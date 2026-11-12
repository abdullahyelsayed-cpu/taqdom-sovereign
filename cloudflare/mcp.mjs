const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function digest(value) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

function randomToken() {
  return "tqd_mcp_" + hex(crypto.getRandomValues(new Uint8Array(32)));
}

async function ensureSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mcp_access_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked_at INTEGER
    )
  `).run();
}

export async function handleMcpTokenApi(request, url, env, session) {
  if (!session?.username || session.isTestAccount) return json({ error: "Authentication required" }, 401);
  if (!env?.DB) return json({ error: "Account storage unavailable" }, 503);
  await ensureSchema(env);
  const username = String(session.username).toLowerCase();
  const userId = String(session.userId || session.id || `user-${username}`);

  if (request.method === "GET") {
    const { results = [] } = await env.DB.prepare(
      "SELECT id, label, created_at, last_used_at, revoked_at FROM mcp_access_tokens WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 30"
    ).bind(userId).all();
    return json({ tokens: results });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const label = String(body.label || "MCP connection").trim().slice(0, 60) || "MCP connection";
    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM mcp_access_tokens WHERE user_id = ?1 AND revoked_at IS NULL"
    ).bind(userId).first();
    if (Number(count?.total || 0) >= 10) return json({ error: "Maximum 10 active MCP connections" }, 429);
    const token = randomToken();
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO mcp_access_tokens (id, user_id, username, token_hash, label, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    ).bind(id, userId, username, await digest(token), label, Date.now()).run();
    return json({
      token,
      connection: { id, label, endpoint: `https://taqdom.me/mcp/${username}`, created_at: Date.now() },
      warning: "Copy this token now. It will not be shown again.",
    }, 201);
  }

  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Token id required" }, 400);
    await env.DB.prepare(
      "UPDATE mcp_access_tokens SET revoked_at = ?1 WHERE id = ?2 AND user_id = ?3 AND revoked_at IS NULL"
    ).bind(Date.now(), id, userId).run();
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405, { allow: "GET, POST, DELETE" });
}

const TOOLS = [
  { name: "get_portfolio", description: "Read the authenticated account's current portfolio, including draft changes.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_profile", description: "Read the portfolio owner's public profile details and social links.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "list_projects", description: "List projects currently saved in the portfolio.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
];

function toolResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value };
}

export async function handleMcpRequest(request, env, username) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "authorization, content-type, mcp-protocol-version" } });
  if (request.method !== "POST") return json({ error: "Streamable HTTP MCP endpoint accepts POST requests." }, 405, { allow: "POST, OPTIONS" });
  if (!env?.DB) return json({ error: "Account storage unavailable" }, 503);
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer (tqd_mcp_[a-f0-9]{64})$/i);
  if (!match) return json({ error: "A valid Taqdom MCP bearer token is required." }, 401, { "www-authenticate": 'Bearer realm="Taqdom MCP"' });
  await ensureSchema(env);
  const tokenHash = await digest(match[1]);
  const tokenRow = await env.DB.prepare(
    "SELECT id, user_id, username FROM mcp_access_tokens WHERE token_hash = ?1 AND revoked_at IS NULL"
  ).bind(tokenHash).first();
  if (!tokenRow || tokenRow.username !== username) return json({ error: "Invalid, revoked, or out-of-scope MCP token." }, 401);
  await env.DB.prepare("UPDATE mcp_access_tokens SET last_used_at = ?1 WHERE id = ?2").bind(Date.now(), tokenRow.id).run();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid JSON-RPC request" }, 400);
  const respond = (result) => json({ jsonrpc: "2.0", id: body.id ?? null, result }, 200, { "mcp-protocol-version": "2025-03-26" });
  const fail = (code, message) => json({ jsonrpc: "2.0", id: body.id ?? null, error: { code, message } }, 200, { "mcp-protocol-version": "2025-03-26" });

  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") return fail(-32600, "Invalid Request");
  if (body.method === "notifications/initialized" || body.method.startsWith("notifications/")) return new Response(null, { status: 202 });
  if (body.method === "initialize") {
    return respond({
      protocolVersion: body.params?.protocolVersion || "2025-03-26",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "taqdom-account-mcp", version: "1.0.0" },
      instructions: "Read-only access to the authenticated Taqdom portfolio. Each token is restricted to its owner's account.",
    });
  }
  if (body.method === "ping") return respond({});
  if (body.method === "tools/list") return respond({ tools: TOOLS });
  if (body.method === "tools/call") {
    const name = body.params?.name;
    if (!TOOLS.some((tool) => tool.name === name)) return fail(-32602, "Unknown tool");
    const row = await env.DB.prepare(
      "SELECT draft_json, published_json FROM portfolios WHERE username = ?1 AND user_id = ?2"
    ).bind(username, tokenRow.user_id).first();
    const raw = row?.draft_json || row?.published_json;
    if (!raw) return fail(-32004, "Portfolio not found for this account");
    let portfolio;
    try { portfolio = JSON.parse(raw); } catch { return fail(-32603, "Portfolio data is invalid"); }
    const bilingual = (value) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return { ar: String(value.ar || ""), en: String(value.en || "") };
      }
      return { ar: String(value || ""), en: String(value || "") };
    };
    const safeProjects = Array.isArray(portfolio.projects) ? portfolio.projects.map((project) => ({
      id: String(project?.id || ""),
      title: bilingual(project?.title),
      description: bilingual(project?.desc),
      year: String(project?.year || ""),
      tags: Array.isArray(project?.tags) ? project.tags.filter((tag) => typeof tag === "string").slice(0, 30) : [],
      url: typeof project?.url === "string" ? project.url : null,
      client: project?.client ? bilingual(project.client) : null,
      metrics: typeof project?.metrics === "string" ? project.metrics : null,
      images: Array.isArray(project?.images) ? project.images.filter((image) => typeof image === "string").slice(0, 12) : [],
    })) : [];
    const safe = {
      username: String(portfolio.username || username),
      name: bilingual(portfolio.name),
      title: bilingual(portfolio.title),
      bio: bilingual(portfolio.bio),
      city: bilingual(portfolio.city),
      template: String(portfolio.template || ""),
      avatar: typeof portfolio.avatar === "string" ? portfolio.avatar : null,
      cover: typeof portfolio.cover === "string" ? portfolio.cover : null,
      skills: Array.isArray(portfolio.skills) ? portfolio.skills.filter((skill) => typeof skill === "string").slice(0, 100) : [],
      links: Array.isArray(portfolio.links) ? portfolio.links.map((link) => ({
        label: String(link?.label || "").slice(0, 100),
        url: typeof link?.url === "string" ? link.url : "",
      })).slice(0, 50) : [],
      projects: safeProjects,
      metrics: Array.isArray(portfolio.metrics) ? portfolio.metrics.slice(0, 30).map((metric) => ({
        label: bilingual(metric?.label),
        value: String(metric?.value || ""),
      })) : [],
      timeline: Array.isArray(portfolio.timeline) ? portfolio.timeline.slice(0, 50).map((item) => ({
        year: String(item?.year || ""),
        role: bilingual(item?.role),
        organization: bilingual(item?.org),
        summary: bilingual(item?.summary),
      })) : [],
      theme: portfolio.theme && typeof portfolio.theme === "object" ? {
        mode: ["light", "dark", "auto"].includes(portfolio.theme.mode) ? portfolio.theme.mode : "auto",
        accent: String(portfolio.theme.accent || ""),
      } : null,
      publishedAt: portfolio.publishedAt || null,
      updatedAt: portfolio.updatedAt || null,
    };
    if (name === "get_profile") {
      const { projects, metrics, timeline, ...profile } = safe;
      return respond(toolResult(profile));
    }
    if (name === "list_projects") return respond(toolResult(safe.projects));
    return respond(toolResult(safe));
  }
  return fail(-32601, "Method not found");
}
