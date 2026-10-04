import { Hono } from "hono";
import { config, RATE } from "../config.js";
import { getDb } from "../db/index.js";
import {
  checkRateLimit,
  rateLimitedResponse,
  recordRateEvent,
  setRateHeaders,
} from "../lib/rateLimit.js";
import { AppError, clientIp, handleRouteError } from "../lib/errors.js";
import { hashIp } from "../lib/hash.js";
import {
  codeResponse,
  createCode,
  editUrlFor,
  findByEditToken,
  publicUrlFor,
  softDeleteCode,
  validateAssetRefs,
} from "../lib/codes.js";
import { createCodeBody, patchCodeBody } from "../schemas/forms.js";
import {
  deriveTitle,
  parsePayload,
  type DynamicType,
} from "../schemas/payloads.js";
import { deepMergeDesign, designSchema } from "../schemas/design.js";
import { nowIso } from "../lib/tokens.js";

export const codesRoutes = new Hono();

codesRoutes.post("/", async (c) => {
  try {
    const ip = clientIp(c, config.trustProxy);
    const ipHash = hashIp(config.ipSalt, ip);
    const rate = checkRateLimit(`create:ip:${ipHash}`, RATE.createPerIpHour);
    setRateHeaders(c, rate);
    if (!rate.ok) {
      return rateLimitedResponse(
        c,
        rate,
        `You've made a lot of codes in the last hour. Try again in ${Math.ceil(rate.retryAfterSec / 60)} minutes.`,
      );
    }
    const body = createCodeBody.parse(await c.req.json());
    const { row, editToken } = createCode({
      type: body.type,
      payload: body.payload,
      design: body.design,
      title: body.title,
    });
    recordRateEvent(`create:ip:${ipHash}`);
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

codesRoutes.get("/:editToken", async (c) => {
  try {
    const token = c.req.param("editToken");
    const row = findByEditToken(token);
    if (!row) throw new AppError(404, "not_found", "Code not found");
    return c.json(codeResponse(row));
  } catch (err) {
    return handleRouteError(c, err);
  }
});

codesRoutes.patch("/:editToken", async (c) => {
  try {
    const token = c.req.param("editToken");
    const row = findByEditToken(token);
    if (!row) throw new AppError(404, "not_found", "Code not found");
    const body = patchCodeBody.parse(await c.req.json());
    let payload = JSON.parse(row.payload_json);
    let design = JSON.parse(row.design_json);
    let title = row.title;
    if (body.payload !== undefined) {
      payload = parsePayload(row.type as DynamicType, body.payload);
    }
    if (body.design !== undefined) {
      design = deepMergeDesign(design, designSchema.parse(body.design));
    }
    if (body.title !== undefined) title = body.title.trim().slice(0, 80);
    else if (body.payload !== undefined) {
      title = deriveTitle(row.type as DynamicType, payload as Record<string, unknown>).slice(0, 80);
    }
    validateAssetRefs(
      row.id,
      row.type as DynamicType,
      payload as Record<string, unknown>,
      design,
    );
    const now = nowIso();
    getDb()
      .prepare(
        "UPDATE codes SET title = ?, payload_json = ?, design_json = ?, updated_at = ? WHERE id = ?",
      )
      .run(title, JSON.stringify(payload), JSON.stringify(design), now, row.id);
    const updated = findByEditToken(token)!;
    return c.json(codeResponse(updated));
  } catch (err) {
    return handleRouteError(c, err);
  }
});

codesRoutes.delete("/:editToken", async (c) => {
  try {
    const token = c.req.param("editToken");
    const row = findByEditToken(token);
    if (!row) throw new AppError(404, "not_found", "Code not found");
    softDeleteCode(row);
    return c.body(null, 204);
  } catch (err) {
    return handleRouteError(c, err);
  }
});
