PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS codes (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL DEFAULT '',
  payload_json    TEXT NOT NULL,
  design_json     TEXT NOT NULL,
  edit_token_hash TEXT NOT NULL UNIQUE,
  api_key_id      TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
  disabled_reason TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  deleted_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_codes_api_key ON codes(api_key_id);

CREATE TABLE IF NOT EXISTS assets (
  id            TEXT PRIMARY KEY,
  code_id       TEXT NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,
  mime          TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  path          TEXT NOT NULL,
  original_name TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(code_id);

CREATE TABLE IF NOT EXISTS scans (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  code_id  TEXT NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  ts       TEXT NOT NULL,
  country  TEXT,
  device   TEXT NOT NULL,
  os       TEXT NOT NULL,
  ip_hash  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scans_code_ts ON scans(code_id, ts);

CREATE TABLE IF NOT EXISTS feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code_id    TEXT NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  ip_hash    TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS abuse_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  url TEXT NOT NULL,
  reason TEXT NOT NULL,
  slug TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id                TEXT PRIMARY KEY,
  key_hash          TEXT NOT NULL UNIQUE,
  manage_token_hash TEXT NOT NULL UNIQUE,
  created_at        TEXT NOT NULL,
  revoked_at        TEXT
);

CREATE TABLE IF NOT EXISTS rate_events (
  bucket TEXT NOT NULL,
  ts     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_bucket_ts ON rate_events(bucket, ts);
