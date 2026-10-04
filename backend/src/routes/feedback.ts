import { Hono } from "hono";
import { config, RATE } from "../config.js";
import { getDb } from "../db/index.js";
import { AppError, clientIp, handleRouteError } from "../lib/errors.js";
import { hashIp } from "../lib/hash.js";
import { findByEditToken, findBySlug } from "../lib/codes.js";
import { feedbackBody } from "../schemas/forms.js";
import {
  checkRateLimit,
  rateLimitedResponse,
  recordRateEvent,
  setRateHeaders,
} from "../lib/rateLimit.js";
import { nowIso } from "../lib/tokens.js";

export const feedbackRoutes = new Hono();

feedbackRoutes.post("/feedback/:slug", async (c) => {
  try {
    const row = findBySlug(c.req.param("slug"));
    if (!row || row.deleted_at || row.disabled_reason) {
      throw new AppError(404, "not_found", "Code not found");
    }
    if (row.type !== "feedback") {
      throw new AppError(400, "validation", "Not a feedback code");
    }
    const ip = clientIp(c, config.trustProxy);
    const ipHash = hashIp(config.ipSalt, ip);
    const day = new Date().toISOString().slice(0, 10);
    const bucket = `feedback:${row.slug}:${ipHash}:${day}`;
    const rate = checkRateLimit(bucket, RATE.feedbackPerSlugDay, 24 * 60 * 60 * 1000);
    setRateHeaders(c, rate);
    if (!rate.ok) {
      return rateLimitedResponse(c, rate, "Too many feedback submissions today.");
    }
    const body = feedbackBody.parse(await c.req.json());
    getDb()
      .prepare(
        `INSERT INTO feedback (code_id, rating, comment, ip_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(row.id, body.rating, body.comment ?? null, ipHash, nowIso());
    recordRateEvent(bucket);
    return c.json({ ok: true }, 201);
  } catch (err) {
    return handleRouteError(c, err);
  }
});

feedbackRoutes.get("/codes/:editToken/feedback", async (c) => {
  try {
    const row = findByEditToken(c.req.param("editToken"));
    if (!row) throw new AppError(404, "not_found", "Code not found");
    const items = getDb()
      .prepare(
        `SELECT rating, comment, created_at as createdAt FROM feedback WHERE code_id = ? ORDER BY id DESC LIMIT 200`,
      )
      .all(row.id) as { rating: number; comment: string | null; createdAt: string }[];
    const count = items.length;
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let sum = 0;
    for (const item of items) {
      distribution[item.rating as 1 | 2 | 3 | 4 | 5]++;
      sum += item.rating;
    }
    const average = count ? Math.round((sum / count) * 10) / 10 : null;
    return c.json({ count, average, distribution, items });
  } catch (err) {
    return handleRouteError(c, err);
  }
});
