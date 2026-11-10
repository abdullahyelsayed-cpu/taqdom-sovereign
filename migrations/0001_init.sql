-- 0001_init.sql — Taqdom Sovereign Database Schema (Cloudflare D1)
-- Supports 7 Archetype Templates: madar, athar, haven, siyada, wameed, salam, meshwar
-- Flagship Verified Creators: layla, youssef, farida, karim, tariq, salma, nora

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolios (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  template TEXT NOT NULL DEFAULT 'madar',
  draft_json TEXT NOT NULL,
  published_json TEXT,
  published_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  key TEXT UNIQUE,
  mime TEXT,
  size INTEGER,
  data_url TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS media_blobs (
  key TEXT PRIMARY KEY,
  mime TEXT,
  size INTEGER,
  data_url TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS views (
  username TEXT,
  day TEXT,
  count INTEGER,
  PRIMARY KEY (username, day)
);

CREATE TABLE IF NOT EXISTS reserved_names (
  name TEXT PRIMARY KEY
);

INSERT OR IGNORE INTO reserved_names (name) VALUES
  ('www'), ('api'), ('admin'), ('studio'), ('dashboard'), ('auth'),
  ('login'), ('register'), ('explore'), ('templates'), ('settings'),
  ('static'), ('assets'), ('cdn'), ('mail'), ('support'), ('help'),
  ('root'), ('system'), ('cloudflare'), ('taqdom');

INSERT OR IGNORE INTO users (id, email, username, password_hash, salt, created_at) VALUES
  ('user-layla', 'layla@taqdom.me', 'layla', 'seeded-pbkdf2', 'taqdom-salt-2026', 1762000000000),
  ('user-youssef', 'youssef@taqdom.me', 'youssef', 'seeded-pbkdf2', 'taqdom-salt-2026', 1762000000000),
  ('user-farida', 'farida@taqdom.me', 'farida', 'seeded-pbkdf2', 'taqdom-salt-2026', 1762000000000),
  ('user-karim', 'karim@taqdom.me', 'karim', 'seeded-pbkdf2', 'taqdom-salt-2026', 1762000000000),
  ('user-tariq', 'tariq@taqdom.me', 'tariq', 'seeded-pbkdf2', 'taqdom-salt-2026', 1762000000000),
  ('user-salma', 'salma@taqdom.me', 'salma', 'seeded-pbkdf2', 'taqdom-salt-2026', 1762000000000),
  ('user-nora', 'nora@taqdom.me', 'nora', 'seeded-pbkdf2', 'taqdom-salt-2026', 1762000000000);

