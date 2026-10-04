import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, "..");

export const APP_NAME = "Vesper";
export const VERSION = "1.0.0";

const isProd = process.env.NODE_ENV === "production";

function resolveDataDir(): string {
  if (process.env.DATA_DIR) return resolve(process.env.DATA_DIR);
  return join(PACKAGE_ROOT, "data");
}

export const DATA_DIR = resolveDataDir();
export const UPLOADS_DIR = join(DATA_DIR, "uploads");
export const DB_PATH = join(DATA_DIR, "vesper.db");

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(UPLOADS_DIR, { recursive: true });

function loadOrCreateIpSalt(): string {
  if (process.env.IP_SALT) return process.env.IP_SALT;
  const saltPath = join(DATA_DIR, "ip_salt");
  if (existsSync(saltPath)) return readFileSync(saltPath, "utf8").trim();
  const salt = randomBytes(32).toString("hex");
  writeFileSync(saltPath, salt, "utf8");
  return salt;
}

export const config: {
  port: number;
  publicBaseUrl: string;
  dataDir: string;
  uploadsDir: string;
  dbPath: string;
  trustProxy: boolean;
  ipSalt: string;
  isProd: boolean;
  frontendDist: string;
} = {
  port: Number(process.env.PORT || 8787),
  publicBaseUrl:
    process.env.PUBLIC_BASE_URL ||
    (isProd ? "" : "http://localhost:5173"),
  dataDir: DATA_DIR,
  uploadsDir: UPLOADS_DIR,
  dbPath: DB_PATH,
  trustProxy: process.env.TRUST_PROXY === "true",
  ipSalt: loadOrCreateIpSalt(),
  isProd,
  frontendDist: resolve(PACKAGE_ROOT, "../frontend/dist"),
};

if (isProd && !config.publicBaseUrl) {
  console.warn(
    "[config] PUBLIC_BASE_URL is required in production. Set it to your public origin.",
  );
}

export const LIMITS = {
  logoBytes: 1_000_000,
  imageBytes: 5_000_000,
  pdfBytes: 15_000_000,
  audioBytes: 20_000_000,
  maxImages: 8,
  maxCodeBytes: 60_000_000,
  jsonBodyBytes: 64 * 1024,
  payloadJsonBytes: 32 * 1024,
  bulkCsvBytes: 64 * 1024,
  bulkMaxRows: 50,
} as const;

export const RATE = {
  createPerIpHour: 30,
  createPerKeyHour: 10,
  contactPerIpHour: 5,
  abusePerIpHour: 5,
  keysPerIpDay: 5,
  feedbackPerSlugDay: 5,
  scanDedupeMs: 10_000,
} as const;
