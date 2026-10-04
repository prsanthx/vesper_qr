import { Hono } from "hono";
import { VERSION } from "../config.js";
import { getDb } from "../db/index.js";

const startedAt = Date.now();

export const healthRoutes = new Hono();

healthRoutes.get("/health", (c) => {
  let dbStatus: "ok" | "error" = "ok";
  try {
    getDb().prepare("SELECT 1").get();
  } catch {
    dbStatus = "error";
  }
  const body = {
    status: dbStatus === "ok" ? "ok" : "degraded",
    version: VERSION,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    db: dbStatus,
    time: new Date().toISOString(),
  };
  return c.json(body, dbStatus === "ok" ? 200 : 503);
});
