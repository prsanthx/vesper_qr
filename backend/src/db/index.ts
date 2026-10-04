import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDb(dbPath = config.dbPath): Database.Database {
  if (db && dbPath === config.dbPath) return db;
  const instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  instance.exec(schema);
  const version = instance.pragma("user_version", { simple: true }) as number;
  if (version < 1) {
    instance.pragma("user_version = 1");
  }
  pruneRateEvents(instance);
  if (dbPath === config.dbPath) {
    db = instance;
    setInterval(() => pruneRateEvents(instance), 60 * 60 * 1000).unref?.();
  }
  return instance;
}

export function pruneRateEvents(instance: Database.Database = getDb()): void {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  instance.prepare("DELETE FROM rate_events WHERE ts < ?").run(cutoff);
}

export function resetDbForTests(dbPath: string): Database.Database {
  if (db) {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    db = null;
  }
  config.dbPath = dbPath;
  return getDb(dbPath);
}

export type CodeRow = {
  id: string;
  slug: string;
  type: string;
  title: string;
  payload_json: string;
  design_json: string;
  edit_token_hash: string;
  api_key_id: string | null;
  disabled_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AssetRow = {
  id: string;
  code_id: string;
  kind: string;
  mime: string;
  bytes: number;
  path: string;
  original_name: string;
  created_at: string;
};
