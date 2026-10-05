import { Hono } from "hono";
import { config, RATE } from "../config.js";
import { getDb, type CodeRow } from "../db/index.js";
import { AppError, clientIp, handleRouteError } from "../lib/errors.js";
import { hashIp, hashToken } from "../lib/hash.js";
import {
  checkRateLimit,
  rateLimitedResponse,
  recordRateEvent,
  setRateHeaders,
} from "../lib/rateLimit.js";
import {
  codeResponse,
  createCode,
  editUrlFor,
  findByEditToken,
  findBySlug,
  publicUrlFor,
  scanCount,
  softDeleteCode,
} from "../lib/codes.js";
import { createCodeBody } from "../schemas/forms.js";
import { DEFAULT_DESIGN } from "../schemas/design.js";

export const v1Routes = new Hono();

function authKey(c: { req: { header: (n: string) => string | undefined } }) {
  const header = c.req.header("authorization") || "";
  const m = /^Bearer\s+(vqk_.+)$/.exec(header);
  if (!m) throw new AppError(401, "unauthorized", "Missing or invalid API key");
  const keyHash = hashToken(m[1]!);
  const row = getDb()
    .prepare(
      "SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL",
    )
    .get(keyHash) as { id: string } | undefined;
  if (!row) throw new AppError(401, "unauthorized", "Missing or invalid API key");
  return row;
}

v1Routes.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  c.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (c.req.method === "OPTIONS") return c.body(null, 204);
  await next();
});

v1Routes.post("/codes", async (c) => {
  try {
    const key = authKey(c);
    const ip = clientIp(c, config.trustProxy);
    const ipHash = hashIp(config.ipSalt, ip);
    const ipRate = checkRateLimit(`create:ip:${ipHash}`, RATE.createPerIpHour);
    const keyRate = checkRateLimit(
      `create:key:${key.id}`,
      RATE.createPerKeyHour,
    );
    setRateHeaders(c, {
      limit: Math.min(ipRate.limit, keyRate.limit),
      remaining: Math.min(ipRate.remaining, keyRate.remaining),
      resetSec: Math.max(ipRate.resetSec, keyRate.resetSec),
    });
    if (!ipRate.ok) {
      return rateLimitedResponse(c, ipRate, "IP create rate limit exceeded");
    }
    if (!keyRate.ok) {
      return rateLimitedResponse(c, keyRate, "API key create rate limit exceeded");
    }
    const body = createCodeBody.parse(await c.req.json());
    const { row, editToken } = createCode({
      type: body.type,
      payload: body.payload,
      design: body.design ?? DEFAULT_DESIGN,
      title: body.title,
      apiKeyId: key.id,
    });
    recordRateEvent(`create:ip:${ipHash}`);
    recordRateEvent(`create:key:${key.id}`);
    return c.json(
      {
        slug: row.slug,
        editToken,
        publicUrl: publicUrlFor(row.slug),
        editUrl: editUrlFor(editToken),
      },
      201,
    );
  } catch (err) {
    return handleRouteError(c, err);
  }
});

v1Routes.get("/codes", async (c) => {
  try {
    const key = authKey(c);
    const token = c.req.query("token");
    if (token) {
      const row = findByEditToken(token);
      if (!row || row.api_key_id !== key.id) {
        throw new AppError(404, "not_found", "Code not found");
      }
      return c.json(codeResponse(row));
    }
    const limit = Math.min(Number(c.req.query("limit") || 50), 100);
    const cursor = c.req.query("cursor");
    const rows = (
      cursor
        ? getDb()
            .prepare(
              `SELECT * FROM codes WHERE api_key_id = ? AND deleted_at IS NULL AND created_at < ?
               ORDER BY created_at DESC LIMIT ?`,
            )
            .all(key.id, cursor, limit + 1)
        : getDb()
            .prepare(
              `SELECT * FROM codes WHERE api_key_id = ? AND deleted_at IS NULL
               ORDER BY created_at DESC LIMIT ?`,
            )
            .all(key.id, limit + 1)
    ) as CodeRow[];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return c.json({
      items: page.map((r) => ({
        slug: r.slug,
        type: r.type,
        title: r.title,
        publicUrl: publicUrlFor(r.slug),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        scanCount: scanCount(r.id),
      })),
      nextCursor: hasMore ? page[page.length - 1]!.created_at : null,
    });
  } catch (err) {
    return handleRouteError(c, err);
  }
});

v1Routes.delete("/codes/:slug", async (c) => {
  try {
    const key = authKey(c);
    const row = findBySlug(c.req.param("slug"));
    if (!row || row.api_key_id !== key.id || row.deleted_at) {
      throw new AppError(404, "not_found", "Code not found");
    }
    softDeleteCode(row);
    return c.body(null, 204);
  } catch (err) {
    return handleRouteError(c, err);
  }
});

v1Routes.post("/codes/bulk", async (c) => {
  try {
    const key = authKey(c);
    const ip = clientIp(c, config.trustProxy);
    const ipHash = hashIp(config.ipSalt, ip);
    const ipRate = checkRateLimit(`create:ip:${ipHash}`, RATE.createPerIpHour);
    const keyRate = checkRateLimit(
      `create:key:${key.id}`,
      RATE.createPerKeyHour,
    );
    setRateHeaders(c, {
      limit: Math.min(ipRate.limit, keyRate.limit),
      remaining: Math.min(ipRate.remaining, keyRate.remaining),
      resetSec: Math.max(ipRate.resetSec, keyRate.resetSec),
    });
    if (!ipRate.ok) {
      return rateLimitedResponse(c, ipRate, "IP create rate limit exceeded");
    }
    if (!keyRate.ok) {
      return rateLimitedResponse(c, keyRate, "API key create rate limit exceeded");
    }

    const text = await c.req.text();
    if (Buffer.byteLength(text, "utf8") > 64 * 1024) {
      throw new AppError(413, "too_large", "CSV too large");
    }
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new AppError(400, "validation", "CSV requires a header and rows");
    }
    const header = lines[0]!.toLowerCase();
    if (header !== "type,title,url") {
      throw new AppError(400, "validation", "Header must be type,title,url");
    }
    const dataLines = lines.slice(1);
    if (dataLines.length > 50) {
      throw new AppError(400, "validation", "Max 50 rows");
    }

    const created: {
      row: number;
      slug: string;
      editToken: string;
      publicUrl: string;
      editUrl: string;
    }[] = [];
    const errors: { row: number; message: string }[] = [];

    dataLines.forEach((line, idx) => {
      const rowNum = idx + 2;
      const parts = line.split(",");
      const type = parts[0]?.trim();
      const title = parts[1]?.trim() || "";
      const url = parts.slice(2).join(",").trim();
      if (type !== "website") {
        errors.push({ row: rowNum, message: "Only website type is supported" });
        return;
      }
      try {
        const { row, editToken } = createCode({
          type: "website",
          payload: { url },
          title,
          apiKeyId: key.id,
        });
        created.push({
          row: rowNum,
          slug: row.slug,
          editToken,
          publicUrl: publicUrlFor(row.slug),
          editUrl: editUrlFor(editToken),
        });
      } catch (e) {
        errors.push({
          row: rowNum,
          message: e instanceof Error ? e.message : "Failed",
        });
      }
    });

    recordRateEvent(`create:ip:${ipHash}`);
    recordRateEvent(`create:key:${key.id}`);
    return c.json({ created, errors }, 201);
  } catch (err) {
    return handleRouteError(c, err);
  }
});
