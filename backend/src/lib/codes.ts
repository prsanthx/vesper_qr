import { getDb, type AssetRow, type CodeRow } from "../db/index.js";
import { config } from "../config.js";
import { DEFAULT_DESIGN, deepMergeDesign, type Design } from "../schemas/design.js";
import {
  deriveTitle,
  parsePayload,
  rejectOwnRedirect,
  type DynamicType,
} from "../schemas/payloads.js";
import { AppError } from "../lib/errors.js";
import {
  generateEditToken,
  generateSlug,
  hashToken,
  nowIso,
  uuid,
} from "../lib/tokens.js";
import { deleteAssetFile, deleteCodeUploadDir } from "../lib/uploads.js";

export type AssetDto = {
  id: string;
  kind: string;
  mime: string;
  bytes: number;
  originalName: string;
  url: string;
};

export function publicUrlFor(slug: string): string {
  const base = (config.publicBaseUrl || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  return `${base}/r/${slug}`;
}

export function editUrlFor(token: string): string {
  const base = (config.publicBaseUrl || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  return `${base}/e/${token}`;
}

export function assetDto(row: AssetRow): AssetDto {
  return {
    id: row.id,
    kind: row.kind,
    mime: row.mime,
    bytes: row.bytes,
    originalName: row.original_name,
    url: `/api/assets/${row.id}`,
  };
}

export function getAssetsForCode(codeId: string): AssetRow[] {
  return getDb()
    .prepare("SELECT * FROM assets WHERE code_id = ? ORDER BY created_at ASC")
    .all(codeId) as AssetRow[];
}

export function findByEditToken(token: string): CodeRow | null {
  const hash = hashToken(token);
  const row = getDb()
    .prepare(
      "SELECT * FROM codes WHERE edit_token_hash = ? AND deleted_at IS NULL",
    )
    .get(hash) as CodeRow | undefined;
  return row ?? null;
}

export function findBySlug(slug: string): CodeRow | null {
  return (
    (getDb().prepare("SELECT * FROM codes WHERE slug = ?").get(slug) as
      | CodeRow
      | undefined) ?? null
  );
}

export function scanCount(codeId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as c FROM scans WHERE code_id = ?")
    .get(codeId) as { c: number };
  return row.c;
}

export function codeResponse(row: CodeRow) {
  const assets = getAssetsForCode(row.id).map(assetDto);
  return {
    slug: row.slug,
    type: row.type as DynamicType,
    title: row.title,
    payload: JSON.parse(row.payload_json),
    design: JSON.parse(row.design_json) as Design,
    assets,
    publicUrl: publicUrlFor(row.slug),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scanCount: scanCount(row.id),
  };
}

export function publicDoc(row: CodeRow) {
  return {
    slug: row.slug,
    type: row.type as DynamicType,
    title: row.title,
    payload: JSON.parse(row.payload_json),
    design: JSON.parse(row.design_json) as Design,
    assets: getAssetsForCode(row.id).map(assetDto),
  };
}

function assertNoOwnRedirect(payload: unknown): void {
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      if (/^https?:\/\//i.test(v) && !rejectOwnRedirect(v, config.publicBaseUrl)) {
        throw new AppError(400, "validation", "URLs may not point at /r/ paths", {
          url: "Cannot redirect to another Vesper short link",
        });
      }
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(payload);
}

export function validateAssetRefs(
  codeId: string,
  type: DynamicType,
  payload: Record<string, unknown>,
  design: Design,
): void {
  const owned = new Set(getAssetsForCode(codeId).map((a) => a.id));
  const check = (id: unknown, path: string) => {
    if (!id) return;
    if (typeof id !== "string" || !owned.has(id)) {
      throw new AppError(400, "validation", "Unknown file", {
        [path]: "Unknown file",
      });
    }
  };
  if (type === "profile") check(payload.photoAssetId, "photoAssetId");
  if (type === "pdf") check(payload.pdfAssetId, "pdfAssetId");
  if (type === "mp3") {
    check(payload.audioAssetId, "audioAssetId");
    check(payload.coverAssetId, "coverAssetId");
  }
  if (type === "images" && Array.isArray(payload.imageAssetIds)) {
    (payload.imageAssetIds as string[]).forEach((id, i) =>
      check(id, `imageAssetIds.${i}`),
    );
  }
  if (type === "menu" && payload.pdfAssetId) check(payload.pdfAssetId, "pdfAssetId");
  if (design.logo.kind === "upload" && design.logo.assetId) {
    check(design.logo.assetId, "design.logo.assetId");
  }
}

export function createCode(opts: {
  type: DynamicType;
  payload: unknown;
  design?: unknown;
  title?: string;
  apiKeyId?: string | null;
}): { row: CodeRow; editToken: string } {
  const parsed = parsePayload(opts.type, opts.payload) as Record<string, unknown>;
  assertNoOwnRedirect(parsed);
  const design = deepMergeDesign(DEFAULT_DESIGN, opts.design as Design | undefined);
  const db = getDb();
  const id = uuid();
  const slug = generateSlug(
    (s) => !!db.prepare("SELECT 1 FROM codes WHERE slug = ?").get(s),
  );
  const editToken = generateEditToken();
  const now = nowIso();
  const title =
    (opts.title && opts.title.trim()) ||
    deriveTitle(opts.type, parsed).slice(0, 80);
  const payloadJson = JSON.stringify(parsed);
  if (Buffer.byteLength(payloadJson, "utf8") > 32 * 1024) {
    throw new AppError(400, "validation", "Payload too large");
  }
  db.prepare(
    `INSERT INTO codes (id, slug, type, title, payload_json, design_json, edit_token_hash, api_key_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    slug,
    opts.type,
    title,
    payloadJson,
    JSON.stringify(design),
    hashToken(editToken),
    opts.apiKeyId ?? null,
    now,
    now,
  );
  const row = db.prepare("SELECT * FROM codes WHERE id = ?").get(id) as CodeRow;
  return { row, editToken };
}

export function softDeleteCode(row: CodeRow): void {
  const db = getDb();
  const assets = getAssetsForCode(row.id);
  for (const a of assets) deleteAssetFile(a.path);
  deleteCodeUploadDir(row.id);
  db.prepare("DELETE FROM assets WHERE code_id = ?").run(row.id);
  db.prepare(
    "UPDATE codes SET deleted_at = ?, updated_at = ? WHERE id = ?",
  ).run(nowIso(), nowIso(), row.id);
}

export function removeAssetRefs(codeId: string, assetId: string): void {
  const row = getDb()
    .prepare("SELECT * FROM codes WHERE id = ?")
    .get(codeId) as CodeRow;
  if (!row) return;
  const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
  const design = JSON.parse(row.design_json) as Design;
  let changed = false;
  const scrub = (key: string) => {
    if (payload[key] === assetId) {
      delete payload[key];
      changed = true;
    }
  };
  scrub("photoAssetId");
  scrub("pdfAssetId");
  scrub("audioAssetId");
  scrub("coverAssetId");
  if (Array.isArray(payload.imageAssetIds)) {
    const next = (payload.imageAssetIds as string[]).filter((id) => id !== assetId);
    if (next.length !== (payload.imageAssetIds as string[]).length) {
      payload.imageAssetIds = next;
      changed = true;
    }
  }
  if (design.logo.kind === "upload" && design.logo.assetId === assetId) {
    design.logo = { kind: "none" };
    changed = true;
  }
  if (changed) {
    getDb()
      .prepare(
        "UPDATE codes SET payload_json = ?, design_json = ?, updated_at = ? WHERE id = ?",
      )
      .run(JSON.stringify(payload), JSON.stringify(design), nowIso(), codeId);
  }
}
