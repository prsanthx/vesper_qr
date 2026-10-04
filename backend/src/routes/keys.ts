import { Hono } from "hono";
import { config, RATE } from "../config.js";
import { getDb } from "../db/index.js";
import { AppError, clientIp, handleRouteError } from "../lib/errors.js";
import { hashIp, hashToken } from "../lib/hash.js";
import {
  checkRateLimit,
  rateLimitedResponse,
  recordRateEvent,
  setRateHeaders,
} from "../lib/rateLimit.js";
import {
  generateApiKey,
  generateManageToken,
  nowIso,
  uuid,
} from "../lib/tokens.js";

export const keysRoutes = new Hono();

keysRoutes.post("/keys", async (c) => {
  try {
    const ip = clientIp(c, config.trustProxy);
    const ipHash = hashIp(config.ipSalt, ip);
    const rate = checkRateLimit(
      `keys:ip:${ipHash}`,
      RATE.keysPerIpDay,
      24 * 60 * 60 * 1000,
    );
    setRateHeaders(c, rate);
    if (!rate.ok) {
      return rateLimitedResponse(c, rate, "Too many API keys today.");
    }
    const apiKey = generateApiKey();
    const manageToken = generateManageToken();
    getDb()
      .prepare(
        `INSERT INTO api_keys (id, key_hash, manage_token_hash, created_at) VALUES (?, ?, ?, ?)`,
      )
      .run(uuid(), hashToken(apiKey), hashToken(manageToken), nowIso());
    recordRateEvent(`keys:ip:${ipHash}`);
    return c.json(
      {
        apiKey,
        manageToken,
        note: "Store these now. They cannot be shown again.",
      },
      201,
    );
  } catch (err) {
    return handleRouteError(c, err);
  }
});

keysRoutes.delete("/keys/:manageToken", async (c) => {
  try {
    const hash = hashToken(c.req.param("manageToken"));
    const row = getDb()
      .prepare(
        "SELECT * FROM api_keys WHERE manage_token_hash = ? AND revoked_at IS NULL",
      )
      .get(hash) as { id: string } | undefined;
    if (!row) throw new AppError(404, "not_found", "Key not found");
    getDb()
      .prepare("UPDATE api_keys SET revoked_at = ? WHERE id = ?")
      .run(nowIso(), row.id);
    return c.body(null, 204);
  } catch (err) {
    return handleRouteError(c, err);
  }
});
