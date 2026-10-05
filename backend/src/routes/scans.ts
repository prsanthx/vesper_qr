import { Hono } from "hono";
import { config, RATE } from "../config.js";
import { getDb } from "../db/index.js";
import { AppError, clientIp, handleRouteError } from "../lib/errors.js";
import { hashIp } from "../lib/hash.js";
import { findByEditToken, findBySlug, publicDoc } from "../lib/codes.js";
import { countryFromHeaders } from "../lib/geo.js";
import { isBotUa, parseUa } from "../lib/ua.js";
import { nowIso } from "../lib/tokens.js";

export const scansRoutes = new Hono();

function assertResolvable(slug: string) {
  const row = findBySlug(slug);
  if (!row) throw new AppError(404, "not_found", "Code not found");
  if (row.deleted_at || row.disabled_reason) {
    throw new AppError(410, "retired", "This code was retired");
  }
  return row;
}

scansRoutes.post("/scans/:slug", async (c) => {
  try {
    const row = assertResolvable(c.req.param("slug"));
    const ua = c.req.header("user-agent");
    if (!isBotUa(ua)) {
      const ip = clientIp(c, config.trustProxy);
      const ipHash = hashIp(config.ipSalt, ip);
      const recent = getDb()
        .prepare(
          `SELECT ts FROM scans WHERE code_id = ? AND ip_hash = ? ORDER BY id DESC LIMIT 1`,
        )
        .get(row.id, ipHash) as { ts: string } | undefined;
      const skip =
        recent &&
        Date.now() - new Date(recent.ts).getTime() < RATE.scanDedupeMs;
      if (!skip) {
        const { device, os } = parseUa(ua);
        const country = countryFromHeaders(c.req.raw.headers);
        getDb()
          .prepare(
            `INSERT INTO scans (code_id, ts, country, device, os, ip_hash) VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(row.id, nowIso(), country, device, os, ipHash);
      }
    }
    return c.json(publicDoc(row));
  } catch (err) {
    return handleRouteError(c, err);
  }
});

scansRoutes.get("/public/:slug", async (c) => {
  try {
    const row = assertResolvable(c.req.param("slug"));
    return c.json(publicDoc(row));
  } catch (err) {
    return handleRouteError(c, err);
  }
});

scansRoutes.get("/codes/:editToken/stats", async (c) => {
  try {
    const row = findByEditToken(c.req.param("editToken"));
    if (!row) throw new AppError(404, "not_found", "Code not found");
    const db = getDb();
    const total = (
      db.prepare("SELECT COUNT(*) as c FROM scans WHERE code_id = ?").get(row.id) as {
        c: number;
      }
    ).c;

    const last30Days: { date: string; count: number }[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      last30Days.push({ date, count: 0 });
    }
    const counts = db
      .prepare(
        `SELECT substr(ts, 1, 10) as day, COUNT(*) as c FROM scans
         WHERE code_id = ? AND ts >= ? GROUP BY day`,
      )
      .all(row.id, last30Days[0]!.date) as { day: string; c: number }[];
    const map = new Map(counts.map((r) => [r.day, r.c]));
    for (const entry of last30Days) {
      entry.count = map.get(entry.date) ?? 0;
    }

    const byDeviceRows = db
      .prepare(
        `SELECT device, COUNT(*) as c FROM scans WHERE code_id = ? GROUP BY device`,
      )
      .all(row.id) as { device: string; c: number }[];
    const byDevice = { mobile: 0, tablet: 0, desktop: 0, other: 0 };
    for (const r of byDeviceRows) {
      if (r.device in byDevice) {
        byDevice[r.device as keyof typeof byDevice] = r.c;
      }
    }

    const byOSRows = db
      .prepare(
        `SELECT os, COUNT(*) as c FROM scans WHERE code_id = ? GROUP BY os`,
      )
      .all(row.id) as { os: string; c: number }[];
    const byOS: Record<string, number> = {};
    for (const r of byOSRows) byOS[r.os] = r.c;

    const byCountryRows = db
      .prepare(
        `SELECT COALESCE(country, 'unknown') as country, COUNT(*) as c FROM scans WHERE code_id = ? GROUP BY country`,
      )
      .all(row.id) as { country: string; c: number }[];
    const byCountry: Record<string, number> = {};
    for (const r of byCountryRows) byCountry[r.country] = r.c;

    const recent = db
      .prepare(
        `SELECT ts, country, device, os FROM scans WHERE code_id = ? ORDER BY id DESC LIMIT 50`,
      )
      .all(row.id) as {
      ts: string;
      country: string | null;
      device: string;
      os: string;
    }[];

    return c.json({
      total,
      last30Days,
      byDevice,
      byOS,
      byCountry,
      recent,
    });
  } catch (err) {
    return handleRouteError(c, err);
  }
});
