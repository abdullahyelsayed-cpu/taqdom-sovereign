import fs from "fs";
import path from "path";
import { verifySessionToken, type SessionPayload } from "./auth";
const SESSION_COOKIE_NAME = "taqdom_session";
import { SEED_PORTFOLIOS } from "./seed-data";
import type { PortfolioData } from "./types";

interface DbPortfolioEntry {
  draft: PortfolioData;
  published: PortfolioData | null;
}

interface LocalDbSnapshot {
  users: Record<string, { id: string; email: string; username: string; passwordHash: string; salt: string }>;
  portfolios: Record<string, DbPortfolioEntry>;
  views: Record<string, number>;
  media?: Record<string, unknown>;
}

interface OAuthClientRow {
  client_id: string;
  client_secret_hash: string | null;
  client_name: string;
  redirect_uris: string;
  token_endpoint_auth_method: string;
  scope: string;
  created_at: number;
}

interface OAuthCodeRow {
  code_hash: string;
  client_id: string;
  user_id: string;
  username: string;
  redirect_uri: string;
  scope: string;
  resource: string;
  code_challenge: string;
  code_challenge_method: string;
  created_at: number;
  expires_at: number;
  used_at: number | null;
}

interface OAuthRefreshRow {
  token_hash: string;
  client_id: string;
  user_id: string;
  username: string;
  scope: string;
  created_at: number;
  expires_at: number;
  revoked_at: number | null;
}

interface McpTokenRow {
  id: string;
  user_id: string;
  username: string;
  token_hash: string;
  label: string;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
  client_id: string | null;
  scope: string | null;
  expires_at: number | null;
}

interface OAuthSidecarState {
  clients: Record<string, OAuthClientRow>;
  codes: Record<string, OAuthCodeRow>;
  refreshTokens: Record<string, OAuthRefreshRow>;
  mcpTokens: Record<string, McpTokenRow>;
}

const DB_FILE = path.join(process.cwd(), ".taqdom-db.json");
const OAUTH_FILE = path.join(process.cwd(), ".taqdom-oauth.json");

const globalBridge = globalThis as unknown as {
  __taqdomMemoryDb?: LocalDbSnapshot;
};

function readMainDb(): LocalDbSnapshot {
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as LocalDbSnapshot;
      if (parsed && parsed.portfolios) {
        globalBridge.__taqdomMemoryDb = parsed;
        return parsed;
      }
    } catch {
      // fallback below
    }
  }
  if (globalBridge.__taqdomMemoryDb) return globalBridge.__taqdomMemoryDb;
  const users: LocalDbSnapshot["users"] = {};
  const portfolios: LocalDbSnapshot["portfolios"] = {};
  const views: LocalDbSnapshot["views"] = {};
  for (const [uname, p] of Object.entries(SEED_PORTFOLIOS)) {
    users[uname] = {
      id: `user-${uname}`,
      email: p.email || `${uname}@taqdom.me`,
      username: uname,
      passwordHash: "seeded",
      salt: "seeded",
    };
    portfolios[uname] = { draft: structuredClone(p), published: structuredClone(p) };
    views[uname] = p.views || 1200;
  }
  const snap: LocalDbSnapshot = { users, portfolios, views, media: {} };
  globalBridge.__taqdomMemoryDb = snap;
  return snap;
}

function writeMainDb(snap: LocalDbSnapshot) {
  globalBridge.__taqdomMemoryDb = snap;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(snap, null, 2), "utf-8");
  } catch {
    // ignore read-only env
  }
}

function readOAuthState(): OAuthSidecarState {
  if (fs.existsSync(OAUTH_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(OAUTH_FILE, "utf-8")) as OAuthSidecarState;
      if (parsed && parsed.clients && parsed.mcpTokens) return parsed;
    } catch {
      // reset below
    }
  }
  return { clients: {}, codes: {}, refreshTokens: {}, mcpTokens: {} };
}

function writeOAuthState(state: OAuthSidecarState) {
  try {
    fs.writeFileSync(OAUTH_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // ignore read-only env
  }
}

function createLocalD1() {
  return {
    prepare(sql: string) {
      const cleanSql = sql.replace(/\s+/g, " ").trim();
      let boundValues: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          boundValues = values;
          return this;
        },
        async run() {
          const state = readOAuthState();

          if (cleanSql.startsWith("INSERT INTO mcp_access_tokens")) {
            const [id, user_id, username, token_hash, label, created_at, client_id, scope, expires_at] =
              boundValues as [string, string, string, string, string, number, string?, string?, number?];
            state.mcpTokens[id] = {
              id,
              user_id,
              username,
              token_hash,
              label,
              created_at,
              last_used_at: null,
              revoked_at: null,
              client_id: client_id ?? null,
              scope: scope ?? null,
              expires_at: expires_at ?? null,
            };
            writeOAuthState(state);
            return { success: true, meta: { changes: 1 } };
          }

          if (cleanSql.includes("UPDATE mcp_access_tokens SET revoked_at")) {
            let changes = 0;
            if (cleanSql.includes("WHERE id = ?2 AND user_id = ?3")) {
              const [revokedAt, id, userId] = boundValues as [number, string, string];
              const row = state.mcpTokens[id];
              if (row && row.user_id === userId && row.revoked_at === null) {
                row.revoked_at = revokedAt;
                changes = 1;
              }
            } else if (cleanSql.includes("WHERE token_hash = ?2")) {
              const [revokedAt, tokenHash] = boundValues as [number, string];
              for (const row of Object.values(state.mcpTokens)) {
                if (row.token_hash === tokenHash && row.revoked_at === null) {
                  row.revoked_at = revokedAt;
                  changes++;
                }
              }
            }
            if (changes > 0) writeOAuthState(state);
            return { success: true, meta: { changes } };
          }

          if (cleanSql.includes("UPDATE mcp_access_tokens SET last_used_at")) {
            const [lastUsedAt, id] = boundValues as [number, string];
            const row = state.mcpTokens[id];
            if (row) {
              row.last_used_at = lastUsedAt;
              writeOAuthState(state);
            }
            return { success: true, meta: { changes: row ? 1 : 0 } };
          }

          if (cleanSql.startsWith("INSERT INTO oauth_clients")) {
            const [client_id, client_secret_hash, client_name, redirect_uris, token_endpoint_auth_method, scope, created_at] =
              boundValues as [string, string | null, string, string, string, string, number];
            state.clients[client_id] = {
              client_id,
              client_secret_hash,
              client_name,
              redirect_uris,
              token_endpoint_auth_method,
              scope,
              created_at,
            };
            writeOAuthState(state);
            return { success: true, meta: { changes: 1 } };
          }

          if (cleanSql.startsWith("INSERT INTO oauth_codes")) {
            const [
              code_hash,
              client_id,
              user_id,
              username,
              redirect_uri,
              scope,
              resource,
              code_challenge,
              code_challenge_method,
              created_at,
              expires_at,
            ] = boundValues as [string, string, string, string, string, string, string, string, string, number, number];
            state.codes[code_hash] = {
              code_hash,
              client_id,
              user_id,
              username,
              redirect_uri,
              scope,
              resource,
              code_challenge,
              code_challenge_method,
              created_at,
              expires_at,
              used_at: null,
            };
            writeOAuthState(state);
            return { success: true, meta: { changes: 1 } };
          }

          if (cleanSql.includes("UPDATE oauth_codes SET used_at")) {
            const [usedAt, codeHash] = boundValues as [number, string];
            const rec = state.codes[codeHash];
            if (rec && rec.used_at === null) {
              rec.used_at = usedAt;
              writeOAuthState(state);
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: { changes: 0 } };
          }

          if (cleanSql.startsWith("INSERT INTO oauth_refresh_tokens")) {
            const [token_hash, client_id, user_id, username, scope, created_at, expires_at] =
              boundValues as [string, string, string, string, string, number, number];
            state.refreshTokens[token_hash] = {
              token_hash,
              client_id,
              user_id,
              username,
              scope,
              created_at,
              expires_at,
              revoked_at: null,
            };
            writeOAuthState(state);
            return { success: true, meta: { changes: 1 } };
          }

          if (cleanSql.includes("UPDATE oauth_refresh_tokens SET revoked_at")) {
            const [revokedAt, tokenHash] = boundValues as [number, string];
            const rec = state.refreshTokens[tokenHash];
            if (rec && rec.revoked_at === null) {
              rec.revoked_at = revokedAt;
              writeOAuthState(state);
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: { changes: 0 } };
          }

          if (cleanSql.includes("UPDATE portfolios SET draft_json = ?1, published_json")) {
            const [draftRaw, now, username, userId, template] =
              boundValues as [string, number, string, string, string];
            const db = readMainDb();
            const user = db.users[username];
            const entry = db.portfolios[username];
            if (!user || user.id !== userId || !entry) {
              return { success: true, meta: { changes: 0 } };
            }
            const nextPortfolio = JSON.parse(draftRaw) as PortfolioData;
            nextPortfolio.publishedAt = now;
            nextPortfolio.updatedAt = now;
            nextPortfolio.template = (template || nextPortfolio.template) as PortfolioData["template"];
            entry.draft = nextPortfolio;
            entry.published = structuredClone(nextPortfolio);
            writeMainDb(db);
            return { success: true, meta: { changes: 1 } };
          }

          if (cleanSql.includes("UPDATE portfolios SET draft_json")) {
            const [draftRaw, template, updatedAt, username, userId] =
              boundValues as [string, string, number, string, string];
            const db = readMainDb();
            const user = db.users[username];
            const entry = db.portfolios[username];
            if (!user || user.id !== userId || !entry) {
              return { success: true, meta: { changes: 0 } };
            }
            const nextPortfolio = JSON.parse(draftRaw) as PortfolioData;
            nextPortfolio.updatedAt = updatedAt;
            nextPortfolio.template = (template || nextPortfolio.template) as PortfolioData["template"];
            entry.draft = nextPortfolio;
            writeMainDb(db);
            return { success: true, meta: { changes: 1 } };
          }

          return { success: true, meta: { changes: 0 } };
        },
        async first() {
          const state = readOAuthState();

          if (cleanSql.includes("COUNT(*) AS total FROM mcp_access_tokens")) {
            const [userId] = boundValues as [string];
            const total = Object.values(state.mcpTokens).filter(
              (r) => r.user_id === userId && r.revoked_at === null
            ).length;
            return { total };
          }

          if (cleanSql.includes("FROM mcp_access_tokens WHERE token_hash = ?1")) {
            const [tokenHash] = boundValues as [string];
            const row = Object.values(state.mcpTokens).find((r) => r.token_hash === tokenHash);
            if (!row) return null;
            if (cleanSql.includes("revoked_at IS NULL") && row.revoked_at !== null) return null;
            return row;
          }

          if (cleanSql.includes("FROM oauth_clients WHERE client_id = ?1")) {
            const [clientId] = boundValues as [string];
            return state.clients[clientId] || null;
          }

          if (cleanSql.includes("FROM oauth_codes WHERE code_hash = ?1")) {
            const [codeHash] = boundValues as [string];
            return state.codes[codeHash] || null;
          }

          if (cleanSql.includes("FROM oauth_refresh_tokens WHERE token_hash = ?1")) {
            const [tokenHash] = boundValues as [string];
            return state.refreshTokens[tokenHash] || null;
          }

          if (cleanSql.includes("FROM portfolios WHERE username = ?1 AND user_id = ?2")) {
            const [username, userId] = boundValues as [string, string];
            const db = readMainDb();
            const user = db.users[username];
            const entry = db.portfolios[username];
            if (!user || user.id !== userId || !entry) return null;
            return {
              draft_json: JSON.stringify(entry.draft),
              published_json: entry.published ? JSON.stringify(entry.published) : null,
            };
          }

          return null;
        },
        async all() {
          const state = readOAuthState();
          if (cleanSql.includes("FROM mcp_access_tokens WHERE user_id = ?1")) {
            const [userId] = boundValues as [string];
            const results = Object.values(state.mcpTokens)
              .filter((r) => r.user_id === userId)
              .sort((a, b) => b.created_at - a.created_at)
              .slice(0, 30)
              .map(({ id, label, created_at, last_used_at, revoked_at }) => ({
                id,
                label,
                created_at,
                last_used_at,
                revoked_at,
              }));
            return { results };
          }
          return { results: [] };
        },
      };
    },
  };
}

const normUsername = (value: string): string => String(value || "").trim().toLowerCase();

export function syncLocalOAuthUsername(
  oldUsername: string,
  newUsername: string,
  userId?: string
): void {
  const prev = normUsername(oldUsername);
  const next = normUsername(newUsername);
  if (!prev || !next || prev === next) return;
  const state = readOAuthState();
  let changed = false;
  for (const row of Object.values(state.mcpTokens)) {
    if (row.username === prev || (userId && row.user_id === userId)) {
      row.username = next;
      changed = true;
    }
  }
  for (const row of Object.values(state.codes)) {
    if (row.username === prev || (userId && row.user_id === userId)) {
      row.username = next;
      changed = true;
    }
  }
  for (const row of Object.values(state.refreshTokens)) {
    if (row.username === prev || (userId && row.user_id === userId)) {
      row.username = next;
      changed = true;
    }
  }
  if (changed) writeOAuthState(state);
}

export function purgeLocalOAuthUser(username: string, userId?: string): void {
  const clean = normUsername(username);
  if (!clean && !userId) return;
  const state = readOAuthState();
  let changed = false;
  for (const [id, row] of Object.entries(state.mcpTokens)) {
    if (row.username === clean || (userId && row.user_id === userId)) {
      delete state.mcpTokens[id];
      changed = true;
    }
  }
  for (const [hash, row] of Object.entries(state.codes)) {
    if (row.username === clean || (userId && row.user_id === userId)) {
      delete state.codes[hash];
      changed = true;
    }
  }
  for (const [hash, row] of Object.entries(state.refreshTokens)) {
    if (row.username === clean || (userId && row.user_id === userId)) {
      delete state.refreshTokens[hash];
      changed = true;
    }
  }
  if (changed) writeOAuthState(state);
}

export function getLocalEnv() {
  return {
    DB: createLocalD1(),
    AUTH_SECRET: process.env.AUTH_SECRET || "",
  };
}

export async function parseNextRequestSession(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const escaped = SESSION_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
  if (!match?.[1]) return null;
  return verifySessionToken(decodeURIComponent(match[1]));
}
