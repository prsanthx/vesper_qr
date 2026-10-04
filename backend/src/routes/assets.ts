import { Hono } from "hono";
import { readFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { config, LIMITS } from "../config.js";
import { getDb, type AssetRow } from "../db/index.js";
import { AppError, handleRouteError } from "../lib/errors.js";
import {
  assetDto,
  findByEditToken,
  getAssetsForCode,
  removeAssetRefs,
} from "../lib/codes.js";
import {
  deleteAssetFile,
  KIND_LIMITS,
  newAssetId,
  saveAssetFile,
  sniffAndValidate,
  type AssetKind,
} from "../lib/uploads.js";
import { nowIso } from "../lib/tokens.js";

export const assetsRoutes = new Hono();

const COUNT_LIMITS: Record<string, number> = {
  logo: 1,
  image: 8,
  pdf: 1,
  audio: 1,
};

assetsRoutes.post("/codes/:editToken/assets", async (c) => {
  try {
    const token = c.req.param("editToken");
    const row = findByEditToken(token);
    if (!row) throw new AppError(404, "not_found", "Code not found");

    const contentLength = Number(c.req.header("content-length") || 0);
    const form = await c.req.parseBody({ all: true });
    const kindRaw = String(form.kind || "");
    if (!["logo", "image", "pdf", "audio"].includes(kindRaw)) {
      throw new AppError(400, "validation", "Invalid kind");
    }
    const kind = kindRaw as AssetKind;
    const rawFile = form.file;
    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;
    if (!file || typeof file === "string") {
      throw new AppError(400, "validation", "file is required");
    }
    const upload = file as File;
    const max = KIND_LIMITS[kind] + 64 * 1024;
    if (contentLength && contentLength > max) {
      throw new AppError(413, "too_large", "File too large");
    }
    const ab = await upload.arrayBuffer();
    const buffer = Buffer.from(ab);
    if (buffer.byteLength > KIND_LIMITS[kind]) {
      throw new AppError(413, "too_large", "File too large");
    }

    const existing = getAssetsForCode(row.id);
    const totalBytes = existing.reduce((s, a) => s + a.bytes, 0) + buffer.byteLength;
    if (totalBytes > LIMITS.maxCodeBytes) {
      throw new AppError(413, "code_quota", "Total upload quota exceeded");
    }
    const kindCount = existing.filter((a) => a.kind === kind).length;
    const limit =
      kind === "image"
        ? row.type === "images"
          ? 8
          : 1
        : COUNT_LIMITS[kind] ?? 1;
    if (kindCount >= limit) {
      throw new AppError(409, "asset_limit", `Too many ${kind} files`);
    }

    const sniffed = await sniffAndValidate(kind, buffer, upload.name || "file");
    const id = newAssetId();
    const rel = saveAssetFile(row.id, id, sniffed.ext, buffer);
    const createdAt = nowIso();
    getDb()
      .prepare(
        `INSERT INTO assets (id, code_id, kind, mime, bytes, path, original_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        row.id,
        kind,
        sniffed.mime,
        buffer.byteLength,
        rel,
        sniffed.originalName,
        createdAt,
      );
    const asset = getDb()
      .prepare("SELECT * FROM assets WHERE id = ?")
      .get(id) as AssetRow;
    return c.json(assetDto(asset), 201);
  } catch (err) {
    return handleRouteError(c, err);
  }
});

assetsRoutes.delete("/codes/:editToken/assets/:assetId", async (c) => {
  try {
    const row = findByEditToken(c.req.param("editToken"));
    if (!row) throw new AppError(404, "not_found", "Code not found");
    const asset = getDb()
      .prepare("SELECT * FROM assets WHERE id = ? AND code_id = ?")
      .get(c.req.param("assetId"), row.id) as AssetRow | undefined;
    if (!asset) throw new AppError(404, "not_found", "Asset not found");
    deleteAssetFile(asset.path);
    getDb().prepare("DELETE FROM assets WHERE id = ?").run(asset.id);
    removeAssetRefs(row.id, asset.id);
    return c.body(null, 204);
  } catch (err) {
    return handleRouteError(c, err);
  }
});

assetsRoutes.get("/assets/:assetId", async (c) => {
  try {
    const asset = getDb()
      .prepare("SELECT * FROM assets WHERE id = ?")
      .get(c.req.param("assetId")) as AssetRow | undefined;
    if (!asset) throw new AppError(404, "not_found", "Asset not found");
    const code = getDb()
      .prepare("SELECT * FROM codes WHERE id = ?")
      .get(asset.code_id) as { deleted_at: string | null } | undefined;
    if (!code || code.deleted_at) {
      throw new AppError(410, "retired", "Asset unavailable");
    }
    const abs = join(config.dataDir, asset.path);
    if (!existsSync(abs)) throw new AppError(404, "not_found", "File missing");
    const download = c.req.query("download") === "1";
    const stat = statSync(abs);
    const range = c.req.header("range");
    c.header("Content-Type", asset.mime);
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Cache-Control", "public, max-age=31536000, immutable");
    c.header(
      "Content-Disposition",
      download
        ? `attachment; filename="${asset.original_name.replace(/"/g, "")}"`
        : "inline",
    );
    c.header("Accept-Ranges", "bytes");

    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]);
        const end = m[2] ? Number(m[2]) : stat.size - 1;
        if (start >= stat.size || end >= stat.size || start > end) {
          c.header("Content-Range", `bytes */${stat.size}`);
          return c.body(null, 416);
        }
        const chunk = readFileSync(abs).subarray(start, end + 1);
        c.header("Content-Range", `bytes ${start}-${end}/${stat.size}`);
        c.header("Content-Length", String(chunk.length));
        return c.body(chunk, 206);
      }
    }
    c.header("Content-Length", String(stat.size));
    const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;
    return c.body(stream, 200);
  } catch (err) {
    return handleRouteError(c, err);
  }
});
