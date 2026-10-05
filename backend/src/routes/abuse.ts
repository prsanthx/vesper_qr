import { Hono } from "hono";
import { config, RATE } from "../config.js";
import { getDb } from "../db/index.js";
import { clientIp, handleRouteError } from "../lib/errors.js";
import { hashIp } from "../lib/hash.js";
import { abuseBody } from "../schemas/forms.js";
import {
  checkRateLimit,
  rateLimitedResponse,
  recordRateEvent,
  setRateHeaders,
} from "../lib/rateLimit.js";
import { nowIso } from "../lib/tokens.js";

export const abuseRoutes = new Hono();

function parseSlug(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/r\/([0-9A-Za-z]+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

abuseRoutes.post("/abuse", async (c) => {
  try {
    const body = abuseBody.parse(await c.req.json());
    if (body.website) {
      return c.json({ ok: true }, 201);
    }
    const ip = clientIp(c, config.trustProxy);
    const ipHash = hashIp(config.ipSalt, ip);
    const rate = checkRateLimit(`abuse:ip:${ipHash}`, RATE.abusePerIpHour);
    setRateHeaders(c, rate);
    if (!rate.ok) {
      return rateLimitedResponse(c, rate, "Too many reports. Try again later.");
    }
    const slug = parseSlug(body.url);
    const info = getDb()
      .prepare(
        `INSERT INTO abuse_reports (email, url, reason, slug, status, ip_hash, created_at)
         VALUES (?, ?, ?, ?, 'open', ?, ?)`,
      )
      .run(body.email, body.url, body.reason, slug, ipHash, nowIso());
    recordRateEvent(`abuse:ip:${ipHash}`);
    console.info("[abuse]", info.lastInsertRowid, slug);
    return c.json({ ok: true }, 201);
  } catch (err) {
    return handleRouteError(c, err);
  }
});
