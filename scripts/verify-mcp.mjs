import assert from "node:assert/strict";
import { handleMcpRequest, handleMcpTokenApi } from "../cloudflare/mcp.mjs";

const encoder = new TextEncoder();
const tokens = new Map();
let portfolio = {
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
        } else if (sql.includes("UPDATE portfolios SET draft_json = ?1, published_json")) {
          const [draft, publishedAt] = this.values;
          portfolio = JSON.parse(draft);
          portfolio.publishedAt = publishedAt;
          return { success: true, meta: { changes: 1 } };
        } else if (sql.includes("UPDATE portfolios SET draft_json")) {
          const [draft, template, updatedAt] = this.values;
          portfolio = JSON.parse(draft);
          portfolio.template = template || portfolio.template;
          portfolio.updatedAt = updatedAt;
          return { success: true, meta: { changes: 1 } };
        }
        return { success: true, meta: { changes: 1 } };
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
        if (sql.includes("FROM portfolios")) {
          if (this.values[0] !== "mcp-owner" || this.values[1] !== "user-123") return null;
          return { draft_json: JSON.stringify(portfolio), published_json: null };
        }
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
assert.equal(payload.result.serverInfo.version, "2.0.0");
assert.equal(payload.result.protocolVersion, "2025-03-26", "Server must negotiate a protocol version it actually supports");
assert.ok(payload.result.capabilities.resources, "Server must advertise MCP resources capability");
assert.ok(payload.result.capabilities.prompts, "Server must advertise MCP prompts capability");

response = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
payload = await response.json();
assert.deepEqual(payload.result.tools.map((tool) => tool.name), [
  "get_portfolio", "get_profile", "list_projects", "update_profile",
  "create_project", "update_project", "delete_project", "publish_portfolio",
  "get_portfolio_blueprint", "list_templates_and_capabilities",
  "update_portfolio_content", "design_custom_portfolio_theme",
]);

response = await rpc({ jsonrpc: "2.0", id: 21, method: "resources/list" });
payload = await response.json();
assert.equal(payload.result.resources.length, 3, "MCP must expose 3 design & blueprint resources");

response = await rpc({ jsonrpc: "2.0", id: 22, method: "resources/read", params: { uri: "taqdom://design-system/capabilities" } });
payload = await response.json();
const capabilitiesJson = JSON.parse(payload.result.contents[0].text);
assert.equal(capabilitiesJson.builtInTemplates.length, 7);
assert.ok(capabilitiesJson.bespokeCustomDesignEngine.heroVariants.includes("terminal-bento"));

response = await rpc({ jsonrpc: "2.0", id: 23, method: "resources/read", params: { uri: "taqdom://portfolio/mcp-owner/blueprint" } });
payload = await response.json();
const blueprintResource = JSON.parse(payload.result.contents[0].text);
assert.equal("email" in blueprintResource.portfolio, false, "Blueprint resource must not expose email");

response = await rpc({ jsonrpc: "2.0", id: 24, method: "prompts/list" });
payload = await response.json();
assert.equal(payload.result.prompts.length, 3, "MCP must expose 3 portfolio designer prompts");

response = await rpc({ jsonrpc: "2.0", id: 25, method: "prompts/get", params: { name: "design-bespoke-portfolio", arguments: { aesthetic_vibe: "Obsidian Swiss Editorial" } } });
payload = await response.json();
assert.ok(payload.result.messages[0].content.text.includes("design_custom_portfolio_theme"));

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

response = await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "update_profile", arguments: { bio: { ar: "نبذة معدّلة", en: "Updated bio" } } } });
payload = await response.json();
assert.equal(payload.result.structuredContent.ok, true);
assert.equal(payload.result.structuredContent.savedTo, "draft");
assert.equal(portfolio.bio.en, "Updated bio", "Profile edits must persist to the authenticated account draft");
assert.equal(portfolio.publishedAt, undefined, "Draft edits must not silently publish");

response = await rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "create_project", arguments: { title: { ar: "مشروع جديد", en: "New project" }, desc: { ar: "وصف", en: "Description" }, year: "2026", url: "https://example.com" } } });
payload = await response.json();
const newProjectId = payload.result.structuredContent.project.id;
assert.ok(newProjectId, "Project creation must return its ID");
assert.equal(portfolio.projects.length, 2, "Project creation must persist");

response = await rpc({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "update_project", arguments: { projectId: newProjectId, year: "2027" } } });
payload = await response.json();
assert.equal(payload.result.structuredContent.project.year, "2027");

response = await rpc({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "delete_project", arguments: { projectId: newProjectId } } });
payload = await response.json();
assert.equal(payload.result.structuredContent.ok, true);
assert.equal(portfolio.projects.length, 1, "Project deletion must persist");

response = await rpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "update_profile", arguments: { email: "attacker@example.com" } } });
payload = await response.json();
assert.equal(payload.result.isError, true, "Unknown/private profile fields must be rejected");
assert.equal(portfolio.email, "private@example.com", "Private account email must remain unchanged");

response = await rpc({ jsonrpc: "2.0", id: 90, method: "tools/call", params: { name: "get_portfolio_blueprint", arguments: {} } });
payload = await response.json();
assert.equal(payload.result.structuredContent.portfolio.username, "mcp-owner");
assert.equal(payload.result.structuredContent.publicationStatus.publicUrl, "https://mcp-owner.taqdom.me");

response = await rpc({ jsonrpc: "2.0", id: 91, method: "tools/call", params: {
  name: "update_portfolio_content",
  arguments: {
    metrics: [{ label: { ar: "الأنظمة", en: "Systems" }, value: "14+" }],
    seo: { title: "Abdullah Custom Site", description: "Bespoke portfolio" },
  },
} });
payload = await response.json();
assert.equal(payload.result.structuredContent.ok, true);
assert.equal(portfolio.metrics[0].value, "14+");

response = await rpc({ jsonrpc: "2.0", id: 92, method: "tools/call", params: {
  name: "design_custom_portfolio_theme",
  arguments: {
    designName: "Obsidian Gold Custom",
    palette: { background: "#0A0C12", surface: "#131824", text: "#F4F1EA", muted: "#9DA7BA", accent: "#E4B66F" },
    typography: { headingStyle: "editorial-serif", bodyStyle: "sans", scale: "bold" },
    layout: { heroVariant: "terminal-bento", projectGrid: "bento", cardRadius: "lg", navStyle: "floating-glass" },
    effects: { ambientGlow: true, glassBlur: true, gridPattern: "dots", hoverLift: "magnetic", borderStyle: "glow" },
    heroCta: { primaryLabel: { ar: "المشاريع", en: "Projects" }, primaryUrl: "#work" },
    customSections: [
      { id: "principles", kind: "cards", title: { ar: "المبادئ", en: "Principles" }, items: [{ title: { ar: "السرعة", en: "Speed" }, badge: "GPU" }] },
    ],
  },
} });
payload = await response.json();
assert.equal(payload.result.structuredContent.ok, true);
assert.equal(portfolio.customDesign.enabled, true);
assert.equal(portfolio.customDesign.designName, "Obsidian Gold Custom");

response = await rpc({ jsonrpc: "2.0", id: 93, method: "tools/call", params: {
  name: "design_custom_portfolio_theme",
  arguments: {
    palette: { background: "javascript:alert(1)", surface: "#111111", text: "#FFFFFF", muted: "#999999", accent: "#C89D66" },
    typography: { headingStyle: "display" },
    layout: { heroVariant: "split-showcase", projectGrid: "showcase-cards" },
  },
} });
payload = await response.json();
assert.equal(payload.result.isError, true, "Unsafe non-hex color must be rejected");

response = await rpc({ jsonrpc: "2.0", id: 10, method: "tools/call", params: { name: "publish_portfolio", arguments: {} } });
payload = await response.json();
assert.equal(payload.result.structuredContent.published, true, "Publishing must be explicit");
assert.equal(payload.result.structuredContent.customDesignEnabled, true);
assert.equal(portfolio.publishedAt, payload.result.structuredContent.publishedAt);

response = await rpc({ jsonrpc: "2.0", id: 11, method: "ping" }, created.token, "another-user");
assert.equal(response.status, 401, "A token cannot cross account boundaries");

response = await rpc({ jsonrpc: "2.0", id: 12, method: "ping" }, "tqd_mcp_" + "0".repeat(64));
assert.equal(response.status, 401, "Unknown tokens must be rejected");

const revoke = await handleMcpTokenApi(
  new Request("https://taqdom.me/api/mcp/tokens?id=" + created.connection.id, { method: "DELETE" }),
  new URL("https://taqdom.me/api/mcp/tokens?id=" + created.connection.id), env, session
);
assert.equal(revoke.status, 200);
response = await rpc({ jsonrpc: "2.0", id: 13, method: "ping" });
assert.equal(response.status, 401, "Revoked tokens must stop working immediately");

console.log("Taqdom MCP integration tests: PASS (token creation, hash-only storage, initialize, tools/list, profile mapping, project allowlist, tenant isolation, invalid token, revocation)");
