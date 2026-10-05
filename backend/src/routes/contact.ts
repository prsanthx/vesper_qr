import { Hono } from "hono";
import { config, RATE } from "../config.js";
import { getDb } from "../db/index.js";
import { clientIp, handleRouteError } from "../lib/errors.js";
import { hashIp } from "../lib/hash.js";
import { contactBody } from "../schemas/forms.js";
import {
  checkRateLimit,
  rateLimitedResponse,
  recordRateEvent,
  setRateHeaders,
} from "../lib/rateLimit.js";
import { nowIso } from "../lib/tokens.js";

export const contactRoutes = new Hono();

contactRoutes.post("/contact", async (c) => {
  try {
    const body = contactBody.parse(await c.req.json());
    if (body.website) {
      return c.json({ ok: true }, 201);
    }
    const ip = clientIp(c, config.trustProxy);
    const ipHash = hashIp(config.ipSalt, ip);
    const rate = checkRateLimit(`contact:ip:${ipHash}`, RATE.contactPerIpHour);
    setRateHeaders(c, rate);
    if (!rate.ok) {
      return rateLimitedResponse(c, rate, "Too many messages. Try again later.");
    }
    const info = getDb()
      .prepare(
        `INSERT INTO contact_messages (name, email, subject, message, ip_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        body.name || null,
        body.email,
        body.subject,
        body.message,
        ipHash,
        nowIso(),
      );
    recordRateEvent(`contact:ip:${ipHash}`);
    console.info("[contact]", info.lastInsertRowid, body.subject);
    return c.json({ ok: true }, 201);
  } catch (err) {
    return handleRouteError(c, err);
  }
});
