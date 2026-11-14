import assert from "node:assert/strict";
import crypto from "node:crypto";
import { handleMcpRequest, handleMcpTokenApi, handleOpenApiSpec, handleMcpRestRequest } from "../cloudflare/mcp.mjs";
import { handleOAuthRequest } from "../cloudflare/oauth.mjs";

const encoder = new TextEncoder();
const tokens = new Map();
const oauthClients = new Map();
const oauthCodes = new Map();
const oauthRefreshTokens = new Map();
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
          const [id, user_id, username, token_hash, label, created_at, client_id, scope, expires_at] = this.values;
          tokens.set(id, {
            id, user_id, username, token_hash, label, created_at,
            revoked_at: null, client_id: client_id ?? null, scope: scope ?? null, expires_at: expires_at ?? null,
          });
        } else if (sql.includes("UPDATE mcp_access_tokens SET revoked_at")) {
          if (sql.includes("WHERE token_hash =")) {
            const [revoked_at, token_hash] = this.values;
            for (const row of tokens.values()) {
              if (row.token_hash === token_hash && !row.revoked_at) row.revoked_at = revoked_at;
            }
          } else {
            const [revoked_at, id, user_id] = this.values;
            const row = tokens.get(id);
            if (row?.user_id === user_id) row.revoked_at = revoked_at;
          }
        } else if (sql.includes("UPDATE mcp_access_tokens SET last_used_at")) {
          const [last_used_at, id] = this.values;
          const row = tokens.get(id);
          if (row) row.last_used_at = last_used_at;
        } else if (sql.includes("INSERT INTO oauth_clients")) {
          const [client_id, client_secret_hash, client_name, redirect_uris, token_endpoint_auth_method, scope, created_at] = this.values;
          oauthClients.set(client_id, { client_id, client_secret_hash, client_name, redirect_uris, token_endpoint_auth_method, scope, created_at });
        } else if (sql.includes("INSERT INTO oauth_codes")) {
          const [code_hash, client_id, user_id, username, redirect_uri, scope, resource, code_challenge, code_challenge_method, created_at, expires_at] = this.values;
          oauthCodes.set(code_hash, { code_hash, client_id, user_id, username, redirect_uri, scope, resource, code_challenge, code_challenge_method, created_at, expires_at, used_at: null });
        } else if (sql.includes("UPDATE oauth_codes SET used_at")) {
          const [used_at, code_hash] = this.values;
          const rec = oauthCodes.get(code_hash);
          if (!rec || rec.used_at !== null) return { success: true, meta: { changes: 0 } };
          rec.used_at = used_at;
        } else if (sql.includes("INSERT INTO oauth_refresh_tokens")) {
          const [token_hash, client_id, user_id, username, scope, created_at, expires_at] = this.values;
          oauthRefreshTokens.set(token_hash, { token_hash, client_id, user_id, username, scope, created_at, expires_at, revoked_at: null });
        } else if (sql.includes("UPDATE oauth_refresh_tokens SET revoked_at")) {
          const [revoked_at, token_hash] = this.values;
          const rec = oauthRefreshTokens.get(token_hash);
          if (!rec || rec.revoked_at !== null) return { success: true, meta: { changes: 0 } };
          rec.revoked_at = revoked_at;
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
        if (sql.includes("FROM mcp_access_tokens WHERE token_hash =")) {
          const row = [...tokens.values()].find((t) => t.token_hash === this.values[0]);
          if (!row) return null;
          if (sql.includes("revoked_at IS NULL") && row.revoked_at) return null;
          return row;
        }
        if (sql.includes("FROM oauth_clients WHERE client_id =")) {
          return oauthClients.get(this.values[0]) || null;
        }
        if (sql.includes("FROM oauth_codes WHERE code_hash =")) {
          return oauthCodes.get(this.values[0]) || null;
        }
        if (sql.includes("FROM oauth_refresh_tokens WHERE token_hash =")) {
          return oauthRefreshTokens.get(this.values[0]) || null;
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
  async batch(stmts) {
    return Promise.all(stmts.map((s) => s.run()));
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
  "upload_portfolio_image",
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
    palette: { background: "#faf", surface: "#131824EE", text: "#111", muted: "#555", accent: "#c89d66" },
    typography: { headingStyle: "editorial-serif", bodyStyle: "sans", scale: "bold" },
    layout: { heroVariant: "terminal-bento", projectGrid: "bento", cardRadius: "lg", navStyle: "floating-glass" },
    effects: { ambientGlow: true, glassBlur: true, gridPattern: "dots", hoverLift: "magnetic", borderStyle: "glow" },
    heroCta: { primaryLabel: { ar: "المشاريع", en: "Projects" }, primaryUrl: "#work" },
    customSections: [
      { id: "---", kind: "cards", title: { ar: "المبادئ", en: "Principles" }, items: [{ title: { ar: "السرعة", en: "Speed" }, badge: "GPU" }] },
    ],
  },
} });
payload = await response.json();
assert.equal(payload.result.structuredContent.ok, true);
assert.equal(portfolio.customDesign.enabled, true);
assert.equal(portfolio.customDesign.designName, "Obsidian Gold Custom");
assert.equal(portfolio.customDesign.palette.background, "#faf");
assert.equal(portfolio.customDesign.palette.surface, "#131824EE");
assert.equal(portfolio.customDesign.customSections[0].id, "custom-1", "Empty sanitized section IDs must fall back cleanly");

response = await rpc({ jsonrpc: "2.0", id: 94, method: "tools/call", params: {
  name: "design_custom_portfolio_theme",
  arguments: { enabled: false, fallbackTemplate: "madar" },
} });
payload = await response.json();
assert.equal(payload.result.structuredContent.ok, true);
assert.equal(portfolio.customDesign.enabled, false);
assert.equal(portfolio.template, "madar");

response = await rpc({ jsonrpc: "2.0", id: 95, method: "tools/call", params: {
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

// --- OAuth 2.1 Discovery, DCR, PKCE S256 Consent, Root /mcp, Direct URLs, & Flexible AI Designs ---
const oauthCall = (pathAndQuery, init = {}, activeSession = session) =>
  handleOAuthRequest(
    new Request("https://taqdom.me" + pathAndQuery, init),
    new URL("https://taqdom.me" + pathAndQuery),
    env,
    { parseSessionFn: async () => activeSession }
  );

// 1. Unauthenticated /mcp triggers standard RFC 9728 WWW-Authenticate OAuth challenge + CORS
const corsPreflight = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", { method: "OPTIONS" }),
  env,
  null,
  null
);
assert.equal(corsPreflight.status, 204);
assert.equal(corsPreflight.headers.get("access-control-allow-origin"), "*");

const unauthMcp = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
  }),
  env,
  null,
  null
);
assert.equal(unauthMcp.status, 401);
assert.match(
  unauthMcp.headers.get("www-authenticate") || "",
  /resource_metadata="https:\/\/taqdom\.me\/\.well-known\/oauth-protected-resource\/mcp"/
);

// 2. OAuth metadata discovery
const prmRes = await oauthCall("/.well-known/oauth-protected-resource/mcp");
assert.equal(prmRes.status, 200);
const prm = await prmRes.json();
assert.equal(prm.resource, "https://taqdom.me/mcp");
assert.deepEqual(prm.authorization_servers, ["https://taqdom.me"]);

const asMetaRes = await oauthCall("/.well-known/oauth-authorization-server");
assert.equal(asMetaRes.status, 200);
const asMeta = await asMetaRes.json();
assert.equal(asMeta.registration_endpoint, "https://taqdom.me/oauth/register");
assert.ok(asMeta.code_challenge_methods_supported.includes("S256"));

// 3. Dynamic Client Registration rejects unsafe schemes, accepts loopback + web callbacks
const badDcr = await oauthCall("/oauth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ client_name: "Evil", redirect_uris: ["javascript:alert(1)"] }),
});
assert.equal(badDcr.status, 400);

const goodDcr = await oauthCall("/oauth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    client_name: "Gemini CLI",
    redirect_uris: ["http://localhost:9999/oauth2callback", "https://claude.ai/api/mcp/auth_callback"],
  }),
});
assert.equal(goodDcr.status, 201);
const registeredClient = await goodDcr.json();
assert.match(registeredClient.client_id, /^tqd_client_/);

// 4. PKCE S256 generation + loopback ephemeral port inspection
const codeVerifier = crypto.randomBytes(48).toString("base64url");
const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
const ephemeralRedirect = "http://localhost:45123/oauth2callback";

const clientInfoRes = await oauthCall(
  `/api/oauth/client-info?client_id=${encodeURIComponent(registeredClient.client_id)}&redirect_uri=${encodeURIComponent(
    ephemeralRedirect
  )}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`
);
assert.equal(clientInfoRes.status, 200);
const clientInfo = await clientInfoRes.json();
assert.equal(clientInfo.client.clientName, "Gemini CLI");

// Demo / unauthenticated accounts cannot approve OAuth
const deniedShowcase = await oauthCall(
  "/api/oauth/approve",
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: registeredClient.client_id,
      redirect_uri: ephemeralRedirect,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }),
  },
  { userId: "layla", username: "layla", isTestAccount: true }
);
assert.equal(deniedShowcase.status, 401);

// Valid user approves consent
const approveRes = await oauthCall("/api/oauth/approve", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    client_id: registeredClient.client_id,
    redirect_uri: ephemeralRedirect,
    state: "xyz-state",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }),
});
assert.equal(approveRes.status, 200);
const approveData = await approveRes.json();
const callbackParsed = new URL(approveData.redirectTo);
const authCode = callbackParsed.searchParams.get("code");
assert.ok(authCode && authCode.startsWith("tqd_code_"));
assert.equal(callbackParsed.searchParams.get("state"), "xyz-state");

const longState = "GKey_" + "A".repeat(1190) + "_HMAC";
const longStateRes = await oauthCall("/api/oauth/approve", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    client_id: registeredClient.client_id,
    redirect_uri: ephemeralRedirect,
    state: longState,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }),
});
assert.equal(longStateRes.status, 200);
const longStateData = await longStateRes.json();
const longStateCallback = new URL(longStateData.redirectTo);
assert.equal(longStateCallback.searchParams.get("state"), longState, "Long OAuth state tokens (>512 chars) must never be truncated");

// 5. Token exchange rejects invalid code_verifier, succeeds on match, rejects replay
const badVerifierRes = await oauthCall("/oauth/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: registeredClient.client_id,
    code: authCode,
    redirect_uri: ephemeralRedirect,
    code_verifier: "wrong_" + codeVerifier,
  }).toString(),
});
assert.equal(badVerifierRes.status, 400);

const tokenRes = await oauthCall("/oauth/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: registeredClient.client_id,
    code: authCode,
    redirect_uri: ephemeralRedirect,
    code_verifier: codeVerifier,
  }).toString(),
});
assert.equal(tokenRes.status, 200);
const tokenJson = await tokenRes.json();
assert.match(tokenJson.access_token, /^tqd_oat_[a-f0-9]{64}$/);
assert.match(tokenJson.refresh_token, /^tqd_rt_[a-f0-9]{64}$/);
assert.equal(tokenJson.mcp_endpoint, "https://taqdom.me/mcp/mcp-owner");

const replayRes = await oauthCall("/oauth/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: registeredClient.client_id,
    code: authCode,
    redirect_uri: ephemeralRedirect,
    code_verifier: codeVerifier,
  }).toString(),
});
assert.equal(replayRes.status, 400, "Authorization code replay must fail");

// 6. UserInfo + Root /mcp + Direct URLs (?token= & path token) + GET SSE + DELETE
const userInfoRes = await oauthCall("/oauth/userinfo", {
  headers: { authorization: `Bearer ${tokenJson.access_token}` },
});
assert.equal(userInfoRes.status, 200);
const userInfo = await userInfoRes.json();
assert.equal(userInfo.username, "mcp-owner");

const rootMcpRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 201, method: "tools/call", params: { name: "get_profile", arguments: {} } }),
  }),
  env,
  null,
  null
);
assert.equal(rootMcpRes.status, 200);
const rootMcpData = await rootMcpRes.json();
assert.equal(rootMcpData.result.structuredContent.username, "mcp-owner");

// Direct ?token= URL & SSE GET & DELETE
const queryAuthGet = await handleMcpRequest(
  new Request(`https://taqdom.me/mcp/mcp-owner?token=${tokenJson.access_token}`, {
    method: "GET",
    headers: { accept: "text/event-stream" },
  }),
  env,
  "mcp-owner",
  null
);
assert.equal(queryAuthGet.status, 200);
assert.match(queryAuthGet.headers.get("content-type") || "", /text\/event-stream/);
const sseReader = queryAuthGet.body.getReader();
const sseFirstChunk = await sseReader.read();
await sseReader.cancel();
const sseFirstText = new TextDecoder().decode(sseFirstChunk.value);
assert.match(sseFirstText, new RegExp(`/mcp/mcp-owner\\?token=${tokenJson.access_token}`));

const pathAuthDelete = await handleMcpRequest(
  new Request(`https://taqdom.me/mcp/mcp-owner/${tokenJson.access_token}`, { method: "DELETE" }),
  env,
  "mcp-owner",
  tokenJson.access_token
);
assert.equal(pathAuthDelete.status, 200);

// 7. Creative Gemini & Claude Bespoke Design Normalization + publish: true
const creativeGeminiRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 202,
      method: "tools/call",
      params: {
        name: "design_custom_portfolio_theme",
        arguments: {
          design: {
            name: "Atelier Cobalt",
            colors: { bg: "ivory", accent: "cobalt", subtle: "slate" },
            fonts: { heading: "Playfair Display", body: "serif" },
            hero: "minimal",
            grid: "editorial-rows",
            cta: { label: "Email Me", url: "mailto:hi@example.com" },
            sections: [
              { type: "timeline", title: "Journey", events: [{ title: "Principal Architect", badge: "2025" }] },
              { type: "quote", title: "Credo", quote: "Craft over noise." },
              "Independent systems researcher and founder.",
            ],
            tokens: { density: "airy", badUrl: "javascript:alert(1)" },
          },
          publish: true,
        },
      },
    }),
  }),
  env,
  null,
  null
);
assert.equal(creativeGeminiRes.status, 200);
const creativeGeminiPayload = await creativeGeminiRes.json();
assert.equal(creativeGeminiPayload.result.isError, undefined, JSON.stringify(creativeGeminiPayload.result));
assert.equal(creativeGeminiPayload.result.structuredContent.published, true);
assert.equal(portfolio.customDesign.designName, "Atelier Cobalt");
assert.equal(portfolio.customDesign.palette.background, "#FAF8F3");
assert.equal(portfolio.customDesign.palette.accent, "#315BFF");
assert.equal(portfolio.customDesign.typography.headingStyle, "editorial-serif");
assert.equal(portfolio.customDesign.layout.heroVariant, "minimal-typographic");
assert.equal(portfolio.customDesign.layout.projectGrid, "editorial-rows");
assert.equal(portfolio.customDesign.customSections.length, 3);
assert.equal(portfolio.customDesign.customSections[0].kind, "timeline");
assert.equal(portfolio.customDesign.customSections[1].kind, "quote");
assert.equal(portfolio.customDesign.tokens.density, "airy");
assert.equal("badUrl" in (portfolio.customDesign.tokens || {}), false);

const claudeRgbHslRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 203,
      method: "tools/call",
      params: {
        name: "design_custom_portfolio_theme",
        arguments: {
          palette: { background: "rgb(15, 23, 42)", accent: "hsl(38, 92%, 50%)" },
          layout: { heroVariant: "mosaic-collage", projectGrid: "bento" },
        },
      },
    }),
  }),
  env,
  null,
  null
);
const claudePayload = await claudeRgbHslRes.json();
assert.equal(claudePayload.result.structuredContent.customDesign.layout.heroVariant, "cards-mosaic");
assert.equal(claudePayload.result.structuredContent.customDesign.palette.background, "#0f172a");
assert.match(claudePayload.result.structuredContent.customDesign.palette.accent, /^#[0-9a-f]{6}$/i);

// 7b. Named theme + camelCase *Color keys + heroStyle + font + timeline/testimonials + extra AI metadata keys
const camelAndNamedRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 205,
      method: "tools/call",
      params: {
        name: "design_custom_portfolio_theme",
        arguments: {
          theme: "emerald-noir",
          heroStyle: "minimal-typographic",
          font: "Fraunces",
          palette: { backgroundColor: "#09110e", foregroundColor: "#f0fdf4", primaryColor: "#34d399", cardColor: "#10201a" },
          customSections: [
            { type: "timeline", title: "Career", items: [{ title: "Principal", org: "Taqdom", period: "2024-2026", summary: ["Led architecture", "Shipped MCP"] }] },
            { type: "testimonials", title: "Quotes", items: [{ quote: "Remarkable engineering", author: "Nadia", role: "CTO" }] },
          ],
          publish: true,
          model: "gemini-2.5-pro",
        },
      },
    }),
  }),
  env,
  null,
  null
);
assert.equal(camelAndNamedRes.status, 200);
const camelPayload = await camelAndNamedRes.json();
assert.equal(camelPayload.result.isError, undefined, JSON.stringify(camelPayload.result));
assert.equal(camelPayload.result.structuredContent.customDesign.palette.background, "#09110e");
assert.equal(camelPayload.result.structuredContent.customDesign.palette.accent, "#34d399");
assert.equal(camelPayload.result.structuredContent.customDesign.layout.heroVariant, "minimal-typographic");
assert.equal(camelPayload.result.structuredContent.customDesign.customSections[0].kind, "timeline");
assert.equal(camelPayload.result.structuredContent.customDesign.customSections[0].items[0].description.en, "Led architecture\nShipped MCP");
assert.equal(camelPayload.result.structuredContent.customDesign.customSections[0].items[0].value, "Taqdom");
assert.equal(camelPayload.result.structuredContent.customDesign.customSections[1].kind, "testimonials");
assert.equal(camelPayload.result.structuredContent.customDesign.customSections[1].items[0].title.en, "Nadia");
assert.equal(camelPayload.result.structuredContent.customDesign.customSections[1].items[0].badge, "CTO");

const aliasProfileRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 206,
      method: "tools/call",
      params: {
        name: "update_profile",
        arguments: { headline: "Principal Systems Designer", about: ["Architects platforms", "Ships clean code"], notes: "metadata ignored" },
      },
    }),
  }),
  env,
  null,
  null
);
const aliasProfilePayload = await aliasProfileRes.json();
assert.equal(aliasProfilePayload.result.isError, undefined, JSON.stringify(aliasProfilePayload.result));
assert.equal(portfolio.title.en, "Principal Systems Designer");
assert.equal(portfolio.bio.en, "Architects platforms\nShips clean code");

const aliasContentRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 207,
      method: "tools/call",
      params: {
        name: "update_portfolio_content",
        arguments: { summary: "Updated summary via alias", model: "claude-sonnet-4", publish: true },
      },
    }),
  }),
  env,
  null,
  null
);
const aliasContentPayload = await aliasContentRes.json();
assert.equal(aliasContentPayload.result.isError, undefined, JSON.stringify(aliasContentPayload.result));
assert.equal(portfolio.bio.en, "Updated summary via alias");

const inlineBespokeRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 208,
      method: "tools/call",
      params: {
        name: "update_portfolio_content",
        arguments: {
          template: "custom-sovereign",
          projects: [{ id: "inline-p1", name: "Inline Project", summary: "Built cleanly", year: "2026" }],
          customDesign: { theme: "emerald-noir", heroStyle: "cards-mosaic", font: "Fraunces" },
          publish: true,
        },
      },
    }),
  }),
  env,
  null,
  null
);
const inlineBespokePayload = await inlineBespokeRes.json();
assert.equal(inlineBespokePayload.result.isError, undefined, JSON.stringify(inlineBespokePayload.result));
assert.equal(portfolio.customDesign?.enabled, true);
assert.equal(portfolio.customDesign?.layout?.heroVariant, "cards-mosaic");
assert.equal(portfolio.projects?.[0]?.id, "inline-p1");
assert.equal(portfolio.projects?.[0]?.desc?.en, "Built cleanly");
assert.notEqual(portfolio.template, "custom-sovereign");

const invalidTplRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 209,
      method: "tools/call",
      params: { name: "update_portfolio_content", arguments: { template: "unknown-gibberish" } },
    }),
  }),
  env,
  null,
  null
);
const invalidTplPayload = await invalidTplRes.json();
assert.equal(invalidTplPayload.result.isError, true);

// 7c. Path-prefixed .well-known discovery, RFC 8252 search mismatch check, and /api/oauth/approve CSRF + CORS stripping
for (const wkPath of [
  "/mcp/.well-known/oauth-protected-resource",
  "/mcp/mcp-owner/.well-known/oauth-protected-resource",
  "/mcp/.well-known/oauth-authorization-server",
  "/.well-known/openid-configuration/mcp",
]) {
  const wkRes = await oauthCall(wkPath);
  assert.equal(wkRes.status, 200, `Expected 200 on ${wkPath}, got ${wkRes.status}`);
}

const approveOptionsRes = await oauthCall("/api/oauth/approve", { method: "OPTIONS" });
assert.equal(approveOptionsRes.status, 204);
assert.equal(approveOptionsRes.headers.get("access-control-allow-origin"), null);

const approveCrossSiteRes = await oauthCall("/api/oauth/approve", {
  method: "POST",
  headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
  body: JSON.stringify({ approve: true }),
});
assert.equal(approveCrossSiteRes.status, 403);
assert.equal(approveCrossSiteRes.headers.get("access-control-allow-origin"), null);

const dcrQueryRes = await oauthCall("/oauth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ client_name: "QueryLoopClient", redirect_uris: ["http://127.0.0.1/callback?app=cli"] }),
});
assert.equal(dcrQueryRes.status, 201);
const dcrQueryClient = await dcrQueryRes.json();
const mismatchQueryInfo = await oauthCall(
  `/api/oauth/client-info?client_id=${encodeURIComponent(dcrQueryClient.client_id)}&redirect_uri=${encodeURIComponent(
    "http://127.0.0.1:4444/callback?app=evil"
  )}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`
);
assert.equal(mismatchQueryInfo.status, 400);
const matchQueryInfo = await oauthCall(
  `/api/oauth/client-info?client_id=${encodeURIComponent(dcrQueryClient.client_id)}&redirect_uri=${encodeURIComponent(
    "http://127.0.0.1:4444/callback?app=cli"
  )}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`
);
assert.equal(matchQueryInfo.status, 200);

// 7d. Agency spotlight editorial theme, customHtml / html section XSS sanitization, upload_portfolio_image, OpenAPI 3.1 & ChatGPT REST bridge
const agencySpotlightRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 210,
      method: "tools/call",
      params: {
        name: "design_custom_portfolio_theme",
        arguments: {
          designName: "Studio 2026 Editorial",
          brandName: "STUDIO 2026",
          brandMonogram: "S",
          heroHeadline: { ar: "نصنع تجارب تحرك الناس", en: "We Craft Experiences That Move People" },
          heroHighlight: { ar: "تحرك الناس", en: "Experiences" },
          navCta: { label: { ar: "لنتحدث", en: "Let's Talk" }, url: "#contact" },
          layout: { heroVariant: "agency-spotlight", projectGrid: "bento", cardRadius: "lg", navStyle: "minimal" },
          palette: { background: "#0B0D13", surface: "#131722", text: "#F5F2EB", muted: "#98A2B3", accent: "#E5B842" },
          customHtml: "<section><h3>Atelier</h3><script>evil()</script></section>",
          customSections: [
            { id: "craft", kind: "html", title: { ar: "الحرفة", en: "Craft" }, html: "<div>Custom Block<img src=x onerror=alert(1)></div>" },
          ],
        },
      },
    }),
  }),
  env,
  null,
  null
);
assert.equal(agencySpotlightRes.status, 200);
const agencyPayload = await agencySpotlightRes.json();
assert.equal(agencyPayload.result.isError, undefined, JSON.stringify(agencyPayload.result));
assert.equal(agencyPayload.result.structuredContent.customDesign.layout.heroVariant, "agency-spotlight");
assert.equal(agencyPayload.result.structuredContent.customDesign.brandName, "STUDIO 2026");
assert.equal(agencyPayload.result.structuredContent.customDesign.brandMonogram, "S");
assert.equal(agencyPayload.result.structuredContent.customDesign.customHtml.en.includes("<script"), false);
assert.equal(agencyPayload.result.structuredContent.customDesign.customHtml.en.includes("Atelier"), true);
assert.equal(agencyPayload.result.structuredContent.customDesign.customSections[0].kind, "html");
assert.equal(agencyPayload.result.structuredContent.customDesign.customSections[0].html.en.includes("onerror"), false);
assert.equal(agencyPayload.result.structuredContent.customDesign.customSections[0].html.en.includes("Custom Block"), true);

const tinyPngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const uploadToolRes = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 211,
      method: "tools/call",
      params: {
        name: "upload_portfolio_image",
        arguments: {
          dataUrl: tinyPngDataUrl,
          assignTo: "avatar",
        },
      },
    }),
  }),
  env,
  null,
  null
);
assert.equal(uploadToolRes.status, 200);
const uploadToolPayload = await uploadToolRes.json();
assert.equal(uploadToolPayload.result.isError, undefined, JSON.stringify(uploadToolPayload.result));
assert.equal(uploadToolPayload.result.structuredContent.ok, true);
assert.match(uploadToolPayload.result.structuredContent.url, /^\/api\/media\//);
assert.equal(portfolio.avatar, uploadToolPayload.result.structuredContent.url);

const openApiRes = handleOpenApiSpec(
  new Request("https://taqdom.me/openapi.json"),
  new URL("https://taqdom.me/openapi.json"),
  false
);
assert.equal(openApiRes.status, 200);
const openApiJson = await openApiRes.json();
assert.equal(openApiJson.openapi, "3.1.0");
assert.ok(openApiJson.paths["/api/mcp/tools/design_custom_portfolio_theme"]);

const restProfileRes = await handleMcpRestRequest(
  new Request("https://taqdom.me/api/mcp/tools/get_profile", {
    method: "POST",
    headers: { authorization: `Bearer ${tokenJson.access_token}`, "content-type": "application/json" },
    body: "{}",
  }),
  env,
  "get_profile"
);
assert.equal(restProfileRes.status, 200);
const restProfileJson = await restProfileRes.json();
assert.equal(restProfileJson.ok, true);

// 8. Refresh token rotation & revocation
const rotatedRes = await oauthCall("/oauth/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    client_id: registeredClient.client_id,
    refresh_token: tokenJson.refresh_token,
  }).toString(),
});
assert.equal(rotatedRes.status, 200);
const rotatedJson = await rotatedRes.json();
assert.match(rotatedJson.access_token, /^tqd_oat_/);
assert.notEqual(rotatedJson.refresh_token, tokenJson.refresh_token);

const staleRefreshRes = await oauthCall("/oauth/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    client_id: registeredClient.client_id,
    refresh_token: tokenJson.refresh_token,
  }).toString(),
});
assert.equal(staleRefreshRes.status, 400, "Rotated refresh token must not replay");

await oauthCall("/oauth/revoke", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ token: rotatedJson.access_token }).toString(),
});
const postRevokeMcp = await handleMcpRequest(
  new Request("https://taqdom.me/mcp", {
    method: "POST",
    headers: { authorization: `Bearer ${rotatedJson.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 204, method: "ping" }),
  }),
  env,
  null,
  null
);
assert.equal(postRevokeMcp.status, 401);

console.log("Taqdom MCP & OAuth 2.1 integration tests: PASS (DCR, PKCE S256, root /mcp, direct URLs, SSE, rotation, bespoke design normalization, tenant isolation, revocation)");
