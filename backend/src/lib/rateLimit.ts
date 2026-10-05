import type { Context } from "hono";
import { getDb } from "../db/index.js";
import { RATE } from "../config.js";

export type RateResult =
  | { ok: true; remaining: number; resetSec: number; limit: number }
  | {
      ok: false;
      remaining: 0;
      resetSec: number;
      retryAfterSec: number;
      limit: number;
    };

export function checkRateLimit(
  bucket: string,
  limit: number,
  windowMs = 60 * 60 * 1000,
): RateResult {
  const db = getDb();
  const now = Date.now();
  const windowStart = now - windowMs;
  db.prepare("DELETE FROM rate_events WHERE bucket = ? AND ts < ?").run(
    bucket,
    windowStart,
  );
  const rows = db
    .prepare(
      "SELECT ts FROM rate_events WHERE bucket = ? AND ts >= ? ORDER BY ts ASC",
    )
    .all(bucket, windowStart) as { ts: number }[];
  const oldest = rows[0]?.ts ?? now;
  const resetSec = Math.ceil((oldest + windowMs) / 1000);
  if (rows.length >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    return {
      ok: false,
      remaining: 0,
      resetSec,
      retryAfterSec,
      limit,
    };
  }
  return {
    ok: true,
    remaining: limit - rows.length - 1,
    resetSec,
    limit,
  };
}

export function recordRateEvent(bucket: string): void {
  getDb()
    .prepare("INSERT INTO rate_events (bucket, ts) VALUES (?, ?)")
    .run(bucket, Date.now());
}

export function setRateHeaders(
  c: Context,
  result: { limit: number; remaining: number; resetSec: number },
): void {
  c.header("X-RateLimit-Limit", String(result.limit));
  c.header("X-RateLimit-Remaining", String(Math.max(0, result.remaining)));
  c.header("X-RateLimit-Reset", String(result.resetSec));
}

export function rateLimitedResponse(
  c: Context,
  result: Extract<RateResult, { ok: false }>,
  message: string,
) {
  setRateHeaders(c, result);
  c.header("Retry-After", String(result.retryAfterSec));
  return c.json(
    {
      error: {
        code: "rate_limited",
        message,
        retryAfterSec: result.retryAfterSec,
      },
    },
    429,
  );
}

export { RATE };
