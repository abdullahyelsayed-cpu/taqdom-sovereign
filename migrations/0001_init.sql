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
  key TEXT,
  mime TEXT,
  size INTEGER,
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
