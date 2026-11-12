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

const BILINGUAL = {
  type: "object",
  properties: { ar: { type: "string", maxLength: 12000 }, en: { type: "string", maxLength: 12000 } },
  additionalProperties: false,
};
const TOOLS = [
  { name: "get_portfolio", description: "Read the authenticated account's portfolio draft and publication status.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "get_profile", description: "Read the portfolio owner's profile details and social links.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "list_projects", description: "List projects currently saved in the portfolio.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "update_profile", description: "Update selected profile fields in the owner's draft. Changes are saved but are not public until publish_portfolio is called.", inputSchema: { type: "object", properties: {
    name: BILINGUAL, title: BILINGUAL, bio: BILINGUAL, city: BILINGUAL,
    skills: { type: "array", maxItems: 100, items: { type: "string", maxLength: 80 } },
    links: { type: "array", maxItems: 50, items: { type: "object", properties: { label: { type: "string", maxLength: 100 }, url: { type: "string", maxLength: 2048 } }, required: ["label", "url"], additionalProperties: false } },
    avatar: { type: "string", maxLength: 2048 }, cover: { type: "string", maxLength: 2048 },
    theme: { type: "object", properties: { mode: { type: "string", enum: ["light", "dark", "auto"] }, accent: { type: "string", maxLength: 32 } }, additionalProperties: false },
  }, additionalProperties: false } },
  { name: "create_project", description: "Create a project in the owner's draft. The new project is not public until published.", inputSchema: { type: "object", properties: {
    title: BILINGUAL, desc: BILINGUAL, year: { type: "string", maxLength: 12 },
    tags: { type: "array", maxItems: 30, items: { type: "string", maxLength: 40 } },
    url: { type: "string", maxLength: 2048 }, client: BILINGUAL,
    metrics: { type: "string", maxLength: 500 }, images: { type: "array", maxItems: 12, items: { type: "string", maxLength: 2048 } },
  }, required: ["title", "desc"], additionalProperties: false } },
  { name: "update_project", description: "Update an existing project in the owner's draft using its projectId.", inputSchema: { type: "object", properties: {
    projectId: { type: "string", minLength: 1, maxLength: 100 },
    title: BILINGUAL, desc: BILINGUAL, year: { type: "string", maxLength: 12 },
    tags: { type: "array", maxItems: 30, items: { type: "string", maxLength: 40 } },
    url: { type: "string", maxLength: 2048 }, client: BILINGUAL,
    metrics: { type: "string", maxLength: 500 }, images: { type: "array", maxItems: 12, items: { type: "string", maxLength: 2048 } },
  }, required: ["projectId"], additionalProperties: false } },
  { name: "delete_project", description: "Delete one project from the owner's draft using its projectId.", inputSchema: { type: "object", properties: { projectId: { type: "string", minLength: 1, maxLength: 100 } }, required: ["projectId"], additionalProperties: false } },
  { name: "publish_portfolio", description: "Publish the current draft to the owner's public Taqdom page. This is an explicit action; it does not affect other accounts.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
];

function toolResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value };
}

function toolError(message) {
  return { content: [{ type: "text", text: String(message) }], isError: true };
}

function bilingual(value, fieldName) {
  if (typeof value === "string") return { ar: value.slice(0, 12000), en: value.slice(0, 12000) };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${fieldName}: expected text or {ar,en}.`);
  return { ar: String(value.ar || "").slice(0, 12000), en: String(value.en || "").slice(0, 12000) };
}

function safeUrl(value, { allowMail = false, allowLocal = false } = {}) {
  const raw = String(value || "").trim().slice(0, 2048);
  if (!raw) return "";
  if (allowLocal && /^\/(?!\/)[a-z0-9/_ .%-]*$/i.test(raw)) return raw;
  if (allowMail && /^(mailto:|tel:)[^\s]+$/i.test(raw)) return raw;
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) candidate = "https://" + candidate;
  const parsed = new URL(candidate);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Only safe http(s) URLs are accepted.");
  return parsed.toString();
}

function normalizeProjectFields(args, partial = false) {
  const result = {};
  if ("title" in args) result.title = bilingual(args.title, "title");
  if ("desc" in args) result.desc = bilingual(args.desc, "desc");
  if ("year" in args) result.year = String(args.year || "").slice(0, 12);
  if ("tags" in args) result.tags = Array.isArray(args.tags) ? args.tags.slice(0, 30).map((tag) => String(tag).slice(0, 40)) : [];
  if ("url" in args) result.url = args.url ? safeUrl(args.url) : "";
  if ("client" in args) result.client = args.client ? bilingual(args.client, "client") : null;
  if ("metrics" in args) result.metrics = String(args.metrics || "").slice(0, 500);
  if ("images" in args) result.images = Array.isArray(args.images) ? args.images.slice(0, 12).map((src) => safeUrl(src, { allowLocal: true })) : [];
  if (!partial && (!result.title || !result.desc)) throw new Error("Project title and description are required.");
  return result;
}

function publicProject(project) {
  return {
    id: String(project?.id || ""),
    title: bilingual(project?.title || "", "title"),
    description: bilingual(project?.desc || "", "description"),
    year: String(project?.year || ""),
    tags: Array.isArray(project?.tags) ? project.tags.filter((tag) => typeof tag === "string").slice(0, 30) : [],
    url: typeof project?.url === "string" ? project.url : null,
    client: project?.client ? bilingual(project.client, "client") : null,
    metrics: typeof project?.metrics === "string" ? project.metrics : null,
    images: Array.isArray(project?.images) ? project.images.filter((image) => typeof image === "string").slice(0, 12) : [],
  };
}

function safePortfolio(portfolio, username) {
  return {
    username: String(portfolio.username || username),
    name: bilingual(portfolio.name || "", "name"),
    title: bilingual(portfolio.title || "", "title"),
    bio: bilingual(portfolio.bio || "", "bio"),
    city: bilingual(portfolio.city || "", "city"),
    template: String(portfolio.template || ""),
    avatar: typeof portfolio.avatar === "string" ? portfolio.avatar : null,
    cover: typeof portfolio.cover === "string" ? portfolio.cover : null,
    skills: Array.isArray(portfolio.skills) ? portfolio.skills.filter((skill) => typeof skill === "string").slice(0, 100) : [],
    links: Array.isArray(portfolio.links) ? portfolio.links.map((link) => ({ label: String(link?.label || "").slice(0, 100), url: typeof link?.url === "string" ? link.url : "" })).slice(0, 50) : [],
    projects: Array.isArray(portfolio.projects) ? portfolio.projects.map(publicProject) : [],
    metrics: Array.isArray(portfolio.metrics) ? portfolio.metrics.slice(0, 30).map((metric) => ({ label: bilingual(metric?.label || "", "metric label"), value: String(metric?.value || "") })) : [],
    timeline: Array.isArray(portfolio.timeline) ? portfolio.timeline.slice(0, 50).map((item) => ({ year: String(item?.year || ""), role: bilingual(item?.role || "", "role"), organization: bilingual(item?.org || "", "organization"), summary: bilingual(item?.summary || "", "summary") })) : [],
    theme: portfolio.theme && typeof portfolio.theme === "object" ? { mode: ["light", "dark", "auto"].includes(portfolio.theme.mode) ? portfolio.theme.mode : "auto", accent: String(portfolio.theme.accent || "") } : null,
    publishedAt: portfolio.publishedAt || null,
    updatedAt: portfolio.updatedAt || null,
  };
}

async function loadOwnedPortfolio(env, username, userId) {
  const row = await env.DB.prepare(
    "SELECT draft_json, published_json FROM portfolios WHERE username = ?1 AND user_id = ?2"
  ).bind(username, userId).first();
  const raw = row?.draft_json || row?.published_json;
  if (!raw) throw new Error("Portfolio not found for this account.");
  let portfolio;
  try { portfolio = JSON.parse(raw); } catch { throw new Error("Portfolio data is invalid."); }
  return portfolio;
}

async function saveOwnedDraft(env, username, userId, portfolio) {
  const now = Date.now();
  const updated = { ...portfolio, username, updatedAt: now };
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, template = ?2, updated_at = ?3 WHERE username = ?4 AND user_id = ?5"
  ).bind(JSON.stringify(updated), String(updated.template || "haven"), now, username, userId).run();
  if (result?.meta?.changes === 0 || result?.changes === 0) throw new Error("Draft was not saved. The account ownership check failed.");
  return updated;
}

async function publishOwnedDraft(env, username, userId, portfolio) {
  const now = Date.now();
  const published = { ...portfolio, username, updatedAt: now, publishedAt: now };
  const result = await env.DB.prepare(
    "UPDATE portfolios SET draft_json = ?1, published_json = ?1, published_at = ?2, updated_at = ?2 WHERE username = ?3 AND user_id = ?4"
  ).bind(JSON.stringify(published), now, username, userId).run();
  if (result?.meta?.changes === 0 || result?.changes === 0) throw new Error("Publish failed. The account ownership check failed.");
  return published;
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
      protocolVersion: "2025-03-26",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "taqdom-account-mcp", version: "1.1.0" },
      instructions: "Read and write access to the authenticated owner's Taqdom portfolio. Draft edits remain private until publish_portfolio is explicitly called. Each token is restricted to its owner's account.",
    });
  }
  if (body.method === "ping") return respond({});
  if (body.method === "tools/list") return respond({ tools: TOOLS });
  if (body.method === "tools/call") {
    const name = body.params?.name;
    const args = body.params?.arguments || {};
    if (!TOOLS.some((tool) => tool.name === name)) return fail(-32602, "Unknown tool");
    try {
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Tool arguments must be an object.");
      const portfolio = await loadOwnedPortfolio(env, username, tokenRow.user_id);
      if (name === "get_profile") {
        const safe = safePortfolio(portfolio, username);
        const { projects, metrics, timeline, ...profile } = safe;
        return respond(toolResult(profile));
      }
      if (name === "list_projects") return respond(toolResult((portfolio.projects || []).map(publicProject)));
      if (name === "get_portfolio") return respond(toolResult(safePortfolio(portfolio, username)));

      if (name === "update_profile") {
        const allowed = new Set(["name", "title", "bio", "city", "skills", "links", "avatar", "cover", "theme"]);
        const keys = Object.keys(args);
        if (!keys.length || keys.some((key) => !allowed.has(key))) throw new Error("Provide at least one supported profile field.");
        for (const key of ["name", "title", "bio", "city"]) if (key in args) portfolio[key] = bilingual(args[key], key);
        if ("skills" in args) portfolio.skills = Array.isArray(args.skills) ? args.skills.slice(0, 100).map((skill) => String(skill).slice(0, 80)) : [];
        if ("links" in args) {
          if (!Array.isArray(args.links) || args.links.length > 50) throw new Error("Links must be an array with at most 50 entries.");
          portfolio.links = args.links.map((link) => ({ label: String(link.label || "").slice(0, 100), url: safeUrl(link.url, { allowMail: true }) }));
        }
        for (const key of ["avatar", "cover"]) if (key in args) portfolio[key] = args[key] ? safeUrl(args[key], { allowLocal: true }) : "";
        if ("theme" in args) {
          if (!args.theme || typeof args.theme !== "object" || Array.isArray(args.theme)) throw new Error("Theme must be an object.");
          portfolio.theme = { mode: ["light", "dark", "auto"].includes(args.theme.mode) ? args.theme.mode : (portfolio.theme?.mode || "auto"), accent: /^#[0-9a-f]{6}$/i.test(String(args.theme.accent || "")) ? args.theme.accent : (portfolio.theme?.accent || "#315BFF") };
        }
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", published: false, portfolio: safePortfolio(saved, username) }));
      }
      if (name === "create_project") {
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        if (projects.length >= 100) throw new Error("A portfolio can contain at most 100 projects.");
        const project = { id: crypto.randomUUID(), ...normalizeProjectFields(args) };
        portfolio.projects = [...projects, project];
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", project: publicProject(project), updatedAt: saved.updatedAt }));
      }
      if (name === "update_project") {
        const { projectId, ...fields } = args;
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        const index = projects.findIndex((project) => String(project?.id) === String(projectId));
        if (index < 0) throw new Error("Project not found in this account.");
        if (!Object.keys(fields).length) throw new Error("Provide at least one project field to update.");
        projects[index] = { ...projects[index], ...normalizeProjectFields(fields, true) };
        portfolio.projects = projects;
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", project: publicProject(projects[index]), updatedAt: saved.updatedAt }));
      }
      if (name === "delete_project") {
        const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
        const next = projects.filter((project) => String(project?.id) !== String(args.projectId));
        if (next.length === projects.length) throw new Error("Project not found in this account.");
        portfolio.projects = next;
        const saved = await saveOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, savedTo: "draft", deletedProjectId: String(args.projectId), updatedAt: saved.updatedAt }));
      }
      if (name === "publish_portfolio") {
        const published = await publishOwnedDraft(env, username, tokenRow.user_id, portfolio);
        return respond(toolResult({ ok: true, published: true, publicUrl: `https://${username}.taqdom.me`, publishedAt: published.publishedAt }));
      }
      return fail(-32602, "Unsupported tool");
    } catch (error) {
      return respond(toolError(error instanceof Error ? error.message : "MCP tool failed."));
    }
  }
  return fail(-32601, "Method not found");
}
