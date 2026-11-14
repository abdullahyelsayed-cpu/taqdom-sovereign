// cloudflare/oauth.mjs — MCP OAuth 2.1 Authorization Server, Dynamic Client Registration (RFC 7591), and PKCE S256

import { normalizeUsername } from "../lib/types.ts";

const SHOWCASE_USERNAMES = new Set([
  "layla",
  "youssef",
  "farida",
  "karim",
  "tariq",
  "salma",
  "nora",
]);

const encoder = new TextEncoder();

export const SUPPORTED_SCOPES = ["portfolio:read", "portfolio:write", "portfolio:publish"];

const ALLOWED_NATIVE_SCHEMES = new Set([
  "cursor:",
  "vscode:",
  "vscode-insiders:",
  "windsurf:",
  "claude:",
  "gemini:",
  "antigravity:",
]);

export function oauthCorsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version, WWW-Authenticate",
    "Access-Control-Max-Age": "86400",
    ...extra,
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      pragma: "no-cache",
      ...oauthCorsHeaders(),
      ...headers,
    },
  });
}

function oauthError(error, description, status = 400, headers = {}) {
  return json({ error, error_description: description }, status, headers);
}

function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function base64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function digestHex(value) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

async function pkceS256Challenge(verifier) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier)));
  return base64Url(bytes);
}

function constantTimeEqual(left, right) {
  const a = encoder.encode(String(left || ""));
  const b = encoder.encode(String(right || ""));
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) diff |= (a[i] || 0) ^ (b[i] || 0);
  return diff === 0;
}

export async function ensureOAuthSchema(env) {
  if (!env?.DB) return;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mcp_access_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked_at INTEGER,
      client_id TEXT,
      scope TEXT,
      expires_at INTEGER
    )
  `).run();

  const tokenMigrations = [
    "ALTER TABLE mcp_access_tokens ADD COLUMN client_id TEXT",
    "ALTER TABLE mcp_access_tokens ADD COLUMN scope TEXT",
    "ALTER TABLE mcp_access_tokens ADD COLUMN expires_at INTEGER",
  ];
  for (const stmt of tokenMigrations) {
    try {
      await env.DB.prepare(stmt).run();
    } catch {
      // Column already exists
    }
  }

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS oauth_clients (
      client_id TEXT PRIMARY KEY,
      client_secret_hash TEXT,
      client_name TEXT NOT NULL,
      redirect_uris TEXT NOT NULL,
      token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
      scope TEXT,
      created_at INTEGER NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS oauth_codes (
      code_hash TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      scope TEXT NOT NULL,
      resource TEXT,
      code_challenge TEXT NOT NULL,
      code_challenge_method TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
      token_hash TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      scope TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER
    )
  `).run();
}

export function isValidRedirectUri(rawUri) {
  const val = String(rawUri || "").trim();
  if (!val || val.length > 1024 || /\s/.test(val)) return false;
  try {
    const parsed = new URL(val);
    if (parsed.hash) return false;
    if (parsed.protocol === "https:") {
      return Boolean(parsed.hostname) && !parsed.username && !parsed.password;
    }
    if (parsed.protocol === "http:") {
      const host = parsed.hostname.toLowerCase();
      return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
    }
    return ALLOWED_NATIVE_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
}

export function isMatchingRedirectUri(registeredUri, requestedUri) {
  if (!isValidRedirectUri(requestedUri)) return false;
  if (registeredUri === requestedUri) return true;
  try {
    const reg = new URL(registeredUri);
    const req = new URL(requestedUri);
    // RFC 8252 Section 7.3: Allow arbitrary ephemeral loopback port when registered URI is loopback
    if (
      reg.protocol === "http:" &&
      req.protocol === "http:" &&
      isLoopbackHost(reg.hostname) &&
      reg.hostname.toLowerCase() === req.hostname.toLowerCase() &&
      reg.pathname === req.pathname &&
      (!reg.search || reg.search === req.search)
    ) {
      return !reg.port || reg.port === req.port || isLoopbackHost(reg.hostname);
    }
  } catch {
    return false;
  }
  return false;
}

function isPublicSafeHttpsUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h.endsWith(".local") ||
      h.endsWith(".internal") ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(h) ||
      h.includes(":")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function resolveOAuthClient(env, clientId) {
  const id = String(clientId || "").trim();
  if (!id || id.length > 512) return null;

  if (env?.DB) {
    await ensureOAuthSchema(env);
    const row = await env.DB.prepare(
      "SELECT client_id, client_secret_hash, client_name, redirect_uris, token_endpoint_auth_method, scope FROM oauth_clients WHERE client_id = ?1"
    )
      .bind(id)
      .first();
    if (row) {
      let uris = [];
      try {
        uris = JSON.parse(row.redirect_uris || "[]");
      } catch {
        uris = [];
      }
      return {
        clientId: row.client_id,
        clientSecretHash: row.client_secret_hash || null,
        clientName: row.client_name,
        redirectUris: Array.isArray(uris) ? uris : [],
        tokenEndpointAuthMethod: row.token_endpoint_auth_method || "none",
        scope: row.scope || SUPPORTED_SCOPES.join(" "),
        isCimd: false,
      };
    }
  }

  // Support Client ID Metadata Documents (CIMD: client_id is an HTTPS metadata URL)
  if (id.startsWith("https://") && isPublicSafeHttpsUrl(id)) {
    try {
      const res = await fetch(id, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const doc = await res.json();
        const docClientId = String(doc?.client_id || "").trim();
        const redirectUris = Array.isArray(doc?.redirect_uris)
          ? doc.redirect_uris.filter((u) => isValidRedirectUri(u))
          : [];
        if (docClientId === id && redirectUris.length > 0) {
          return {
            clientId: id,
            clientSecretHash: null,
            clientName: String(doc?.client_name || new URL(id).hostname).slice(0, 80),
            redirectUris,
            tokenEndpointAuthMethod: "none",
            scope: SUPPORTED_SCOPES.join(" "),
            isCimd: true,
          };
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function normalizeScopes(rawScope) {
  const tokens = String(rawScope || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return [...SUPPORTED_SCOPES];
  const accepted = tokens.filter((s) => SUPPORTED_SCOPES.includes(s));
  return accepted.length > 0 ? Array.from(new Set(accepted)) : [...SUPPORTED_SCOPES];
}

export function isOAuthRoute(pathname) {
  return (
    pathname.startsWith("/.well-known/oauth-protected-resource") ||
    pathname.startsWith("/.well-known/oauth-authorization-server") ||
    pathname === "/.well-known/openid-configuration" ||
    pathname.startsWith("/.well-known/openid-configuration/") ||
    /^\/mcp(?:\/[a-z0-9-]{3,30})?\/\.well-known\/oauth-(?:protected-resource|authorization-server)\/?$/i.test(
      pathname
    ) ||
    pathname === "/oauth/register" ||
    pathname === "/oauth/token" ||
    pathname === "/oauth/revoke" ||
    pathname === "/oauth/userinfo" ||
    pathname === "/api/oauth/client-info" ||
    pathname === "/api/oauth/approve"
  );
}

function isSameOriginRequest(request, url) {
  const secFetchSite = (request.headers.get("sec-fetch-site") || "").trim().toLowerCase();
  if (secFetchSite === "cross-site") return false;

  const expectedHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const expectedProto = (request.headers.get("x-forwarded-proto") || url.protocol.replace(":", ""))
    .split(",")[0]
    .trim()
    .toLowerCase();

  const matchesExpected = (rawCandidate) => {
    try {
      const candidate = new URL(rawCandidate);
      return (
        Boolean(expectedHost) &&
        candidate.host.toLowerCase() === expectedHost &&
        candidate.protocol === `${expectedProto}:`
      );
    } catch {
      return false;
    }
  };

  const reqOrigin = request.headers.get("origin");
  if (reqOrigin) {
    if (reqOrigin === url.origin) return true;
    return matchesExpected(reqOrigin);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    return matchesExpected(referer);
  }
  return true;
}

function stripCorsHeaders(response) {
  const headers = new Headers(response.headers);
  for (const key of [
    "access-control-allow-origin",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "access-control-expose-headers",
  ]) {
    headers.delete(key);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function handleOAuthRequest(request, url, env, opts = {}) {
  const isInternalApi = url.pathname.startsWith("/api/oauth/");
  const res = await handleOAuthRequestInner(request, url, env, opts);
  return isInternalApi && res ? stripCorsHeaders(res) : res;
}

async function handleOAuthRequestInner(request, url, env, opts = {}) {
  const { pathname, origin } = url;
  const { parseSessionFn } = opts;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: pathname.startsWith("/api/oauth/") ? {} : oauthCorsHeaders(),
    });
  }

  // 1. OAuth Protected Resource Metadata (RFC 9728 — root & path-prefixed /mcp/.well-known/oauth-protected-resource)
  const prefixedResourceMatch = pathname.match(
    /^\/mcp(?:\/([a-z0-9-]{3,30}))?\/\.well-known\/oauth-protected-resource\/?$/i
  );
  if (
    (pathname.startsWith("/.well-known/oauth-protected-resource") || Boolean(prefixedResourceMatch)) &&
    request.method === "GET"
  ) {
    let resourcePath = "/mcp";
    if (prefixedResourceMatch) {
      resourcePath = prefixedResourceMatch[1]
        ? `/mcp/${normalizeUsername(prefixedResourceMatch[1])}`
        : "/mcp";
    } else {
      const suffix = pathname.slice("/.well-known/oauth-protected-resource".length);
      if (suffix && suffix !== "/") {
        const cleanSuffix = suffix.startsWith("/") ? suffix : `/${suffix}`;
        const match = cleanSuffix.match(/^\/mcp(?:\/([a-z0-9-]{3,30}))?\/?$/i);
        if (match) {
          resourcePath = match[1] ? `/mcp/${normalizeUsername(match[1])}` : "/mcp";
        }
      }
    }
    return json({
      resource: `${origin}${resourcePath}`,
      authorization_servers: [origin],
      scopes_supported: SUPPORTED_SCOPES,
      bearer_methods_supported: ["header", "query"],
      resource_name: "Taqdom Sovereign Portfolio MCP",
      resource_documentation: `${origin}/dashboard/mcp`,
    });
  }

  // 2. OAuth Authorization Server Metadata (RFC 8414) + OIDC Discovery compatibility
  if (
    (pathname.startsWith("/.well-known/oauth-authorization-server") ||
      pathname === "/.well-known/openid-configuration" ||
      pathname.startsWith("/.well-known/openid-configuration/") ||
      /^\/mcp(?:\/[a-z0-9-]{3,30})?\/\.well-known\/oauth-authorization-server\/?$/i.test(pathname)) &&
    request.method === "GET"
  ) {
    return json({
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/oauth/token`,
      registration_endpoint: `${origin}/oauth/register`,
      revocation_endpoint: `${origin}/oauth/revoke`,
      userinfo_endpoint: `${origin}/oauth/userinfo`,
      scopes_supported: SUPPORTED_SCOPES,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: [
        "none",
        "client_secret_post",
        "client_secret_basic",
      ],
      code_challenge_methods_supported: ["S256"],
      revocation_endpoint_auth_methods_supported: [
        "none",
        "client_secret_post",
        "client_secret_basic",
      ],
      service_documentation: `${origin}/dashboard/mcp`,
      client_id_metadata_document_supported: true,
    });
  }

  // 3. Dynamic Client Registration (RFC 7591)
  if (pathname === "/oauth/register" && request.method === "POST") {
    if (!env?.DB) return oauthError("server_error", "Account storage unavailable", 503);
    await ensureOAuthSchema(env);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return oauthError("invalid_client_metadata", "JSON payload required");
    }

    const rawUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
    const redirectUris = rawUris.map((u) => String(u || "").trim()).filter((u) => isValidRedirectUri(u));
    if (redirectUris.length === 0 || redirectUris.length !== rawUris.length || redirectUris.length > 20) {
      return oauthError(
        "invalid_redirect_uri",
        "All redirect_uris must be valid HTTPS, localhost loopback, or supported native MCP callback URIs."
      );
    }

    const requestedMethod = String(body.token_endpoint_auth_method || "none").trim();
    const authMethod = ["none", "client_secret_post", "client_secret_basic"].includes(requestedMethod)
      ? requestedMethod
      : "none";

    const clientName =
      String(body.client_name || "MCP Client").trim().slice(0, 80) || "MCP Client";
    const clientId = "tqd_client_" + hex(crypto.getRandomValues(new Uint8Array(12)));
    const clientSecret =
      authMethod === "none" ? null : "tqd_sec_" + hex(crypto.getRandomValues(new Uint8Array(24)));
    const clientSecretHash = clientSecret ? await digestHex(clientSecret) : null;
    const scope = normalizeScopes(body.scope).join(" ");
    const createdAt = Date.now();

    await env.DB.prepare(
      `INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, redirect_uris, token_endpoint_auth_method, scope, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
      .bind(
        clientId,
        clientSecretHash,
        clientName,
        JSON.stringify(redirectUris),
        authMethod,
        scope,
        createdAt
      )
      .run();

    return json(
      {
        client_id: clientId,
        ...(clientSecret ? { client_secret: clientSecret, client_secret_expires_at: 0 } : {}),
        client_id_issued_at: Math.floor(createdAt / 1000),
        client_name: clientName,
        redirect_uris: redirectUris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: authMethod,
        scope,
      },
      201
    );
  }

  // 4. Consent Metadata Inspection for /oauth/authorize UI
  if (pathname === "/api/oauth/client-info" && request.method === "GET") {
    const clientId = url.searchParams.get("client_id") || "";
    const redirectUri = url.searchParams.get("redirect_uri") || "";
    const codeChallenge = url.searchParams.get("code_challenge") || "";
    const codeChallengeMethod = url.searchParams.get("code_challenge_method") || "";
    const scope = url.searchParams.get("scope") || "";
    const resource = url.searchParams.get("resource") || "";

    const client = await resolveOAuthClient(env, clientId);
    if (!client) {
      return oauthError("invalid_client", "Unregistered or invalid client_id", 400);
    }

    const redirectAllowed = client.redirectUris.some((reg) =>
      isMatchingRedirectUri(reg, redirectUri)
    );
    if (!redirectAllowed) {
      return oauthError(
        "invalid_redirect_uri",
        "The redirect_uri does not match this client's registered callbacks.",
        400
      );
    }

    if (!codeChallenge || codeChallenge.length < 43 || codeChallengeMethod !== "S256") {
      return oauthError(
        "invalid_request",
        "OAuth 2.1 requires PKCE with code_challenge_method=S256.",
        400
      );
    }

    let requestedUsername = null;
    if (resource) {
      try {
        const resUrl = new URL(resource);
        const match = resUrl.pathname.match(/^\/mcp\/([a-z0-9-]{3,30})\/?$/i);
        if (match) requestedUsername = normalizeUsername(match[1]);
      } catch {
        // Ignore invalid optional resource hint
      }
    }

    return json({
      ok: true,
      client: {
        clientId: client.clientId,
        clientName: client.clientName,
        isCimd: client.isCimd,
      },
      redirectUri,
      scopes: normalizeScopes(scope),
      requestedUsername,
    });
  }

  // 5. Consent Approval from Logged-In User (/api/oauth/approve)
  if (pathname === "/api/oauth/approve" && request.method === "POST") {
    if (!env?.DB) return oauthError("server_error", "Account storage unavailable", 503);
    await ensureOAuthSchema(env);

    if (!isSameOriginRequest(request, url)) {
      return oauthError("access_denied", "Cross-origin approval rejected", 403);
    }

    const session = parseSessionFn ? await parseSessionFn(request, env) : null;
    const sessionUsername = normalizeUsername(String(session?.username || ""));
    if (!sessionUsername || session?.isTestAccount || SHOWCASE_USERNAMES.has(sessionUsername)) {
      return oauthError(
        "access_denied",
        "يجب تسجيل الدخول بحسابك الشخصي (وليس حساب العرض التجريبي) للموافقة على الاتصال / Sign in with your personal account to authorize MCP.",
        401
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return oauthError("invalid_request", "JSON payload required");
    }

    const clientId = String(body.client_id || "").trim();
    const redirectUri = String(body.redirect_uri || "").trim();
    const state = String(body.state || "").slice(0, 512);
    const codeChallenge = String(body.code_challenge || "").trim();
    const codeChallengeMethod = String(body.code_challenge_method || "").trim();
    const resource = String(body.resource || "").trim().slice(0, 512);
    const decision = String(body.decision || "approve");

    const client = await resolveOAuthClient(env, clientId);
    if (!client) {
      return oauthError("invalid_client", "Invalid client_id");
    }

    const redirectAllowed = client.redirectUris.some((reg) =>
      isMatchingRedirectUri(reg, redirectUri)
    );
    if (!redirectAllowed) {
      return oauthError("invalid_redirect_uri", "redirect_uri mismatch");
    }

    const targetUrl = new URL(redirectUri);
    if (decision === "deny") {
      targetUrl.searchParams.set("error", "access_denied");
      targetUrl.searchParams.set("error_description", "The user denied the authorization request.");
      if (state) targetUrl.searchParams.set("state", state);
      return json({ ok: true, denied: true, redirectTo: targetUrl.toString() });
    }

    if (!codeChallenge || codeChallenge.length < 43 || codeChallengeMethod !== "S256") {
      return oauthError("invalid_request", "PKCE S256 code_challenge required");
    }

    if (resource) {
      try {
        const resUrl = new URL(resource);
        const resUserMatch = resUrl.pathname.match(/^\/mcp\/([a-z0-9-]{3,30})\/?$/i);
        if (resUserMatch && normalizeUsername(resUserMatch[1]) !== sessionUsername) {
          return oauthError(
            "invalid_target",
            `Signed in as @${sessionUsername}, which does not match requested MCP resource @${normalizeUsername(resUserMatch[1])}.`,
            403
          );
        }
      } catch {
        return oauthError("invalid_target", "Malformed resource URI");
      }
    }

    const grantedScopes = normalizeScopes(body.scope).join(" ");
    const code = "tqd_code_" + hex(crypto.getRandomValues(new Uint8Array(24)));
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000;
    const userId = String(session.userId || session.id || `user-${sessionUsername}`);

    await env.DB.prepare(
      `INSERT INTO oauth_codes (code_hash, client_id, user_id, username, redirect_uri, scope, resource, code_challenge, code_challenge_method, created_at, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
    )
      .bind(
        await digestHex(code),
        client.clientId,
        userId,
        sessionUsername,
        redirectUri,
        grantedScopes,
        resource || `${origin}/mcp`,
        codeChallenge,
        codeChallengeMethod,
        now,
        expiresAt
      )
      .run();

    targetUrl.searchParams.set("code", code);
    if (state) targetUrl.searchParams.set("state", state);
    targetUrl.searchParams.set("iss", origin);

    return json({ ok: true, redirectTo: targetUrl.toString(), username: sessionUsername });
  }

  // 6. OAuth Token Endpoint (/oauth/token)
  if (pathname === "/oauth/token" && request.method === "POST") {
    if (!env?.DB) return oauthError("server_error", "Account storage unavailable", 503);
    await ensureOAuthSchema(env);

    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    let params = {};
    if (contentType.includes("application/json")) {
      const parsed = await request.json().catch(() => null);
      if (parsed && typeof parsed === "object") params = parsed;
    } else {
      const text = await request.text().catch(() => "");
      const sp = new URLSearchParams(text);
      for (const [k, v] of sp.entries()) params[k] = v;
    }

    let clientId = String(params.client_id || "").trim();
    let clientSecret = String(params.client_secret || "").trim();

    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.toLowerCase().startsWith("basic ")) {
      try {
        const decoded = atob(authHeader.slice(6).trim());
        const colon = decoded.indexOf(":");
        if (colon > 0) {
          clientId = clientId || decodeURIComponent(decoded.slice(0, colon));
          clientSecret = clientSecret || decodeURIComponent(decoded.slice(colon + 1));
        }
      } catch {
        return oauthError("invalid_client", "Malformed Basic authorization header", 401);
      }
    }

    const grantType = String(params.grant_type || "").trim();
    const client = await resolveOAuthClient(env, clientId);
    if (!client) {
      return oauthError("invalid_client", "Unknown client_id", 401);
    }

    if (client.clientSecretHash) {
      if (!clientSecret) {
        return oauthError("invalid_client", "Client authentication required", 401);
      }
      const secretHash = await digestHex(clientSecret);
      if (!constantTimeEqual(secretHash, client.clientSecretHash)) {
        return oauthError("invalid_client", "Invalid client_secret", 401);
      }
    }

    if (grantType === "authorization_code") {
      const code = String(params.code || "").trim();
      const redirectUri = String(params.redirect_uri || "").trim();
      const codeVerifier = String(params.code_verifier || "").trim();

      if (!code || !redirectUri || !codeVerifier) {
        return oauthError("invalid_request", "Missing code, redirect_uri, or code_verifier");
      }
      if (!/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier)) {
        return oauthError("invalid_grant", "Malformed PKCE code_verifier");
      }

      const codeHash = await digestHex(code);
      const record = await env.DB.prepare(
        "SELECT code_hash, client_id, user_id, username, redirect_uri, scope, resource, code_challenge, code_challenge_method, expires_at, used_at FROM oauth_codes WHERE code_hash = ?1"
      )
        .bind(codeHash)
        .first();

      if (!record) {
        return oauthError("invalid_grant", "Invalid authorization code");
      }
      if (record.used_at !== null && record.used_at !== undefined) {
        return oauthError("invalid_grant", "Authorization code has already been used");
      }
      const now = Date.now();
      if (Number(record.expires_at) <= now) {
        return oauthError("invalid_grant", "Authorization code has expired");
      }
      if (record.client_id !== client.clientId) {
        return oauthError("invalid_grant", "Client mismatch on authorization code");
      }
      if (record.redirect_uri !== redirectUri) {
        return oauthError("invalid_grant", "redirect_uri mismatch on authorization code");
      }

      const computedChallenge = await pkceS256Challenge(codeVerifier);
      if (!constantTimeEqual(computedChallenge, record.code_challenge)) {
        return oauthError("invalid_grant", "Invalid PKCE code_verifier");
      }

      const consumeResult = await env.DB.prepare(
        "UPDATE oauth_codes SET used_at = ?1 WHERE code_hash = ?2 AND used_at IS NULL"
      )
        .bind(now, codeHash)
        .run();
      if (consumeResult?.meta?.changes === 0) {
        return oauthError("invalid_grant", "Authorization code already consumed");
      }

      const accessToken = "tqd_oat_" + hex(crypto.getRandomValues(new Uint8Array(32)));
      const refreshToken = "tqd_rt_" + hex(crypto.getRandomValues(new Uint8Array(32)));
      const accessExpiresIn = 30 * 24 * 60 * 60;
      const accessExpiresAt = now + accessExpiresIn * 1000;
      const refreshExpiresAt = now + 90 * 24 * 60 * 60 * 1000;

      await env.DB.prepare(
        `INSERT INTO mcp_access_tokens (id, user_id, username, token_hash, label, created_at, client_id, scope, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
      )
        .bind(
          crypto.randomUUID(),
          record.user_id,
          record.username,
          await digestHex(accessToken),
          `OAuth: ${client.clientName}`.slice(0, 60),
          now,
          client.clientId,
          record.scope,
          accessExpiresAt
        )
        .run();

      await env.DB.prepare(
        `INSERT INTO oauth_refresh_tokens (token_hash, client_id, user_id, username, scope, created_at, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
        .bind(
          await digestHex(refreshToken),
          client.clientId,
          record.user_id,
          record.username,
          record.scope,
          now,
          refreshExpiresAt
        )
        .run();

      return json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: accessExpiresIn,
        refresh_token: refreshToken,
        scope: record.scope,
        username: record.username,
        mcp_endpoint: `${origin}/mcp/${record.username}`,
      });
    }

    if (grantType === "refresh_token") {
      const refreshToken = String(params.refresh_token || "").trim();
      if (!refreshToken) {
        return oauthError("invalid_request", "Missing refresh_token");
      }
      const rtHash = await digestHex(refreshToken);
      const record = await env.DB.prepare(
        "SELECT token_hash, client_id, user_id, username, scope, expires_at, revoked_at FROM oauth_refresh_tokens WHERE token_hash = ?1"
      )
        .bind(rtHash)
        .first();

      const now = Date.now();
      if (
        !record ||
        record.revoked_at ||
        Number(record.expires_at) <= now ||
        record.client_id !== client.clientId
      ) {
        return oauthError("invalid_grant", "Invalid or expired refresh_token");
      }

      const revokeResult = await env.DB.prepare(
        "UPDATE oauth_refresh_tokens SET revoked_at = ?1 WHERE token_hash = ?2 AND revoked_at IS NULL"
      )
        .bind(now, rtHash)
        .run();
      if (revokeResult?.meta?.changes === 0) {
        return oauthError("invalid_grant", "Refresh token already rotated");
      }

      const nextAccess = "tqd_oat_" + hex(crypto.getRandomValues(new Uint8Array(32)));
      const nextRefresh = "tqd_rt_" + hex(crypto.getRandomValues(new Uint8Array(32)));
      const accessExpiresIn = 30 * 24 * 60 * 60;
      const nextAccessExpiresAt = now + accessExpiresIn * 1000;
      const nextRefreshExpiresAt = now + 90 * 24 * 60 * 60 * 1000;

      await env.DB.prepare(
        `INSERT INTO mcp_access_tokens (id, user_id, username, token_hash, label, created_at, client_id, scope, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
      )
        .bind(
          crypto.randomUUID(),
          record.user_id,
          record.username,
          await digestHex(nextAccess),
          `OAuth: ${client.clientName}`.slice(0, 60),
          now,
          client.clientId,
          record.scope,
          nextAccessExpiresAt
        )
        .run();

      await env.DB.prepare(
        `INSERT INTO oauth_refresh_tokens (token_hash, client_id, user_id, username, scope, created_at, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
        .bind(
          await digestHex(nextRefresh),
          client.clientId,
          record.user_id,
          record.username,
          record.scope,
          now,
          nextRefreshExpiresAt
        )
        .run();

      return json({
        access_token: nextAccess,
        token_type: "Bearer",
        expires_in: accessExpiresIn,
        refresh_token: nextRefresh,
        scope: record.scope,
        username: record.username,
      });
    }

    return oauthError("unsupported_grant_type", "Supported grant_types: authorization_code, refresh_token");
  }

  // 7. Token Revocation (RFC 7009)
  if (pathname === "/oauth/revoke" && request.method === "POST") {
    if (!env?.DB) return json({ ok: true });
    await ensureOAuthSchema(env);
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    let token = "";
    if (contentType.includes("application/json")) {
      const parsed = await request.json().catch(() => ({}));
      token = String(parsed?.token || "").trim();
    } else {
      const sp = new URLSearchParams(await request.text().catch(() => ""));
      token = String(sp.get("token") || "").trim();
    }
    if (token) {
      const hash = await digestHex(token);
      const now = Date.now();
      await env.DB.prepare("UPDATE mcp_access_tokens SET revoked_at = ?1 WHERE token_hash = ?2 AND revoked_at IS NULL")
        .bind(now, hash)
        .run();
      await env.DB.prepare("UPDATE oauth_refresh_tokens SET revoked_at = ?1 WHERE token_hash = ?2 AND revoked_at IS NULL")
        .bind(now, hash)
        .run();
    }
    return json({ ok: true });
  }

  // 8. OAuth UserInfo (/oauth/userinfo)
  if (pathname === "/oauth/userinfo" && request.method === "GET") {
    if (!env?.DB) return oauthError("server_error", "Account storage unavailable", 503);
    await ensureOAuthSchema(env);
    const authHeader = request.headers.get("authorization") || "";
    const rawToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
    if (!rawToken) return oauthError("invalid_token", "Bearer token required", 401);
    const row = await env.DB.prepare(
      "SELECT user_id, username, scope, revoked_at, expires_at FROM mcp_access_tokens WHERE token_hash = ?1"
    )
      .bind(await digestHex(rawToken))
      .first();
    if (!row || row.revoked_at || (row.expires_at && Number(row.expires_at) <= Date.now())) {
      return oauthError("invalid_token", "Token is invalid or expired", 401);
    }
    return json({
      sub: row.user_id,
      preferred_username: row.username,
      username: row.username,
      scope: row.scope || SUPPORTED_SCOPES.join(" "),
      portfolio_url: `https://${row.username}.taqdom.me`,
      mcp_endpoint: `${origin}/mcp/${row.username}`,
    });
  }

  return oauthError("invalid_request", "Unsupported OAuth endpoint or method", 405);
}
