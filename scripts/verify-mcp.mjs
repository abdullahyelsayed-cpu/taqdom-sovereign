import assert from "node:assert/strict";
import { handleMcpRequest, handleMcpTokenApi } from "../cloudflare/mcp.mjs";

const encoder = new TextEncoder();
const tokens = new Map();
const portfolio = {
  username: "mcp-owner",
  name: { ar: "عبدالله", en: "Abdullah" },
  title: { ar: "مطور", en: "Developer" },
  bio: { ar: "نبذة عربية", en: "English bio" },
  city: { ar: "القاهرة", en: "Cairo" },
  template: "madar",
  email: "private@example.com",
  skills: ["TypeScript", "Cloudflare"],
  links: [{ label: "GitHub", url: "https://github.com/example", internalNote: "must not leak" }],
  projects: [{
    id: "p1",
    title: { ar: "مشروع", en: "Project" },
    desc: { ar: "وصف", en: "Description" },
    year: "2026",
    tags: ["MCP"],
    url: "https://example.com",
    client: { ar: "عميل", en: "Client" },
    metrics: "100 users",
    images: ["/project.webp"],
    privateSecret: "must not leak",
  }],
  metrics: [{ label: { ar: "مشاريع", en: "Projects" }, value: "3" }],
  timeline: [],
  theme: { mode: "light", accent: "#315BFF", privateSetting: "must not leak" },
};

const db = {
  prepare(sql) {
    return {
      values: [],
      bind(...values) { this.values = values; return this; },
      async run() {
        if (sql.includes("INSERT INTO mcp_access_tokens")) {
          const [id, user_id, username, token_hash, label, created_at] = this.values;
          tokens.set(id, { id, user_id, username, token_hash, label, created_at, revoked_at: null });
        } else if (sql.includes("UPDATE mcp_access_tokens SET revoked_at")) {
          const [revoked_at, id, user_id] = this.values;
          const row = tokens.get(id);
          if (row?.user_id === user_id) row.revoked_at = revoked_at;
        } else if (sql.includes("UPDATE mcp_access_tokens SET last_used_at")) {
          const [last_used_at, id] = this.values;
          const row = tokens.get(id);
          if (row) row.last_used_at = last_used_at;
        }
        return { success: true };
      },
      async first() {
        if (sql.includes("COUNT(*) AS total")) {
          const userId = this.values[0];
          return { total: [...tokens.values()].filter((t) => t.user_id === userId && !t.revoked_at).length };
        }
        if (sql.includes("WHERE token_hash =")) {
          const row = [...tokens.values()].find((t) => t.token_hash === this.values[0] && !t.revoked_at);
          return row ? { id: row.id, user_id: row.user_id, username: row.username } : null;
        }
        if (sql.includes("FROM portfolios")) return { draft_json: JSON.stringify(portfolio), published_json: null };
        return null;
      },
      async all() {
        const userId = this.values[0];
        return { results: [...tokens.values()].filter((t) => t.user_id === userId).map(({ id, label, created_at, last_used_at, revoked_at }) => ({ id, label, created_at, last_used_at, revoked_at })) };
      },
    };
  },
};

const env = { DB: db };
const session = { userId: "user-123", username: "mcp-owner" };
const create = await handleMcpTokenApi(
  new Request("https://taqdom.me/api/mcp/tokens", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: "CI test" }) }),
  new URL("https://taqdom.me/api/mcp/tokens"), env, session
);
assert.equal(create.status, 201, "Authenticated account can create a token");
const created = await create.json();
assert.match(created.token, /^tqd_mcp_[a-f0-9]{64}$/);
assert.equal(created.connection.endpoint, "https://taqdom.me/mcp/mcp-owner");
assert.ok([...tokens.values()].every((row) => row.token_hash !== created.token), "Raw token must never be stored");

async function rpc(body, token = created.token, username = "mcp-owner") {
  return handleMcpRequest(
    new Request("https://taqdom.me/mcp/" + username, {
      method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
    username
  );
}

let response = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2099-01-01" } });
assert.equal(response.status, 200);
let payload = await response.json();
assert.equal(payload.result.serverInfo.name, "taqdom-account-mcp");
assert.equal(payload.result.protocolVersion, "2025-03-26", "Server must negotiate a protocol version it actually supports");

response = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
payload = await response.json();
assert.deepEqual(payload.result.tools.map((tool) => tool.name), ["get_portfolio", "get_profile", "list_projects"]);

response = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_profile", arguments: {} } });
payload = await response.json();
const profile = payload.result.structuredContent;
assert.deepEqual(profile.name, { ar: "عبدالله", en: "Abdullah" });
assert.equal(profile.title.en, "Developer");
assert.equal("email" in profile, false, "Private account email must not be exposed");

response = await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "list_projects", arguments: {} } });
payload = await response.json();
assert.equal(payload.result.structuredContent[0].title.en, "Project");
assert.equal("privateSecret" in payload.result.structuredContent[0], false, "Unknown project fields must not leak");

response = await rpc({ jsonrpc: "2.0", id: 5, method: "ping" }, created.token, "another-user");
assert.equal(response.status, 401, "A token cannot cross account boundaries");

response = await rpc({ jsonrpc: "2.0", id: 6, method: "ping" }, "tqd_mcp_" + "0".repeat(64));
assert.equal(response.status, 401, "Unknown tokens must be rejected");

const revoke = await handleMcpTokenApi(
  new Request("https://taqdom.me/api/mcp/tokens?id=" + created.connection.id, { method: "DELETE" }),
  new URL("https://taqdom.me/api/mcp/tokens?id=" + created.connection.id), env, session
);
assert.equal(revoke.status, 200);
response = await rpc({ jsonrpc: "2.0", id: 7, method: "ping" });
assert.equal(response.status, 401, "Revoked tokens must stop working immediately");

console.log("Taqdom MCP integration tests: PASS (token creation, hash-only storage, initialize, tools/list, profile mapping, project allowlist, tenant isolation, invalid token, revocation)");
