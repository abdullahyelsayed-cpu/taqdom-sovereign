// cloudflare/worker.mjs — Sovereign Edge Worker for taqdom.me & *.taqdom.me backed by Cloudflare D1
import { SEED_PORTFOLIOS, createStarterPortfolio, TEMPLATES_CATALOG } from "../lib/seed-data.ts";
import { RESERVED_USERNAMES, normalizeUsername, validateUsername } from "../lib/types.ts";

const edgeStore = {
  portfolios: structuredClone(SEED_PORTFOLIOS),
  views: {
    test: 4820,
    layla: 9340,
    youssef: 7615,
    farida: 6490,
    karim: 5290,
  },
};

function parseHost(rawHost) {
  const host = (rawHost || "").toLowerCase().trim();
  if (host === "taqdom.me") return { root: "taqdom.me", sub: null };
  if (host.endsWith(".taqdom.me")) {
    return {
      root: "taqdom.me",
      sub: host.slice(0, -".taqdom.me".length),
    };
  }
  const localMatch = host.match(/^(?:([a-z0-9-]+)\.)?(localhost(?::\d+)?|lvh\.me(?::\d+)?)$/);
  if (localMatch) {
    return {
      root: localMatch[2],
      sub: localMatch[1] || null,
    };
  }
  return { root: null, sub: null };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders,
    },
  });
}

async function getPortfolioFromD1OrMemory(env, username) {
  const clean = normalizeUsername(username);
  if (!clean) return null;
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT published_json, draft_json FROM portfolios WHERE username = ?1"
      )
        .bind(clean)
        .first();
      if (row) {
        const raw = row.published_json || row.draft_json;
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Fallback to edgeStore
    }
  }
  return edgeStore.portfolios[clean] || SEED_PORTFOLIOS[clean] || null;
}

async function savePortfolioToD1AndMemory(env, portfolio, isPublish = false) {
  const clean = normalizeUsername(portfolio.username);
  const now = Date.now();
  const updated = {
    ...portfolio,
    username: clean,
    updatedAt: now,
    publishedAt: isPublish ? now : portfolio.publishedAt || now,
  };
  edgeStore.portfolios[clean] = updated;

  if (env.DB) {
    try {
      const jsonStr = JSON.stringify(updated);
      await env.DB.prepare(
        `INSERT INTO users (id, email, username, password_hash, salt, created_at)
         VALUES (?1, ?2, ?3, 'd1-hash', 'd1-salt', ?4)
         ON CONFLICT(username) DO NOTHING`
      )
        .bind(`user-${clean}`, updated.email || `${clean}@taqdom.me`, clean, now)
        .run();

      await env.DB.prepare(
        `INSERT INTO portfolios (user_id, username, template, draft_json, published_json, published_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(user_id) DO UPDATE SET
           template = excluded.template,
           draft_json = excluded.draft_json,
           published_json = CASE WHEN ?8 = 1 THEN excluded.published_json ELSE portfolios.published_json END,
           published_at = CASE WHEN ?8 = 1 THEN excluded.published_at ELSE portfolios.published_at END,
           updated_at = excluded.updated_at`
      )
        .bind(
          `user-${clean}`,
          clean,
          updated.template || "athar",
          jsonStr,
          jsonStr,
          now,
          now,
          isPublish ? 1 : 0
        )
        .run();
    } catch {
      // Ignore D1 errors
    }
  }
  return updated;
}

async function handleApiRequest(request, url, env) {
  const { pathname, searchParams } = url;

  if (pathname === "/api/username/check" && request.method === "GET") {
    const u = searchParams.get("u") || "";
    const val = validateUsername(u);
    if (!val.valid) {
      return jsonResponse({
        username: val.normalized,
        valid: false,
        available: false,
        isDemoAccount: false,
        reasonAr: val.reasonAr,
        reasonEn: val.reasonEn,
      });
    }
    const existing = await getPortfolioFromD1OrMemory(env, val.normalized);
    const taken = Boolean(existing);
    const isDemo = Boolean(SEED_PORTFOLIOS[val.normalized]);
    return jsonResponse({
      username: val.normalized,
      valid: true,
      available: !taken,
      isDemoAccount: isDemo,
      reasonAr: taken
        ? isDemo
          ? "هذا النطاق مستخدم لحساب عرض حي (يمكنك زيارته الآن)"
          : "هذا الاسم محجوز بالفعل"
        : "النطاق الفرعي متاح للحجز الفوري!",
      reasonEn: taken
        ? isDemo
          ? "Active live showcase subdomain"
          : "Username already taken"
        : "Subdomain is available for instant claim!",
    });
  }

  if (pathname === "/api/auth/test-login" && request.method === "POST") {
    const fresh = structuredClone(SEED_PORTFOLIOS.test);
    await savePortfolioToD1AndMemory(env, fresh, true);
    return jsonResponse(
      {
        ok: true,
        user: {
          id: "user-test-sovereign",
          email: "test@taqdom.me",
          username: "test",
          isTestAccount: true,
        },
        portfolio: fresh,
      },
      200,
      {
        "Set-Cookie":
          "taqdom_session=test-session-edge; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000",
      }
    );
  }

  if (pathname === "/api/auth/register" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const val = validateUsername(String(body.username || ""));
    if (!val.valid) {
      return jsonResponse({ error: val.reasonAr || "Invalid username" }, 400);
    }
    const starter = createStarterPortfolio(
      val.normalized,
      body.template || "athar",
      body.displayName || val.normalized
    );
    starter.email = String(body.email || `${val.normalized}@taqdom.me`);
    await savePortfolioToD1AndMemory(env, starter, true);
    return jsonResponse(
      {
        ok: true,
        user: {
          id: `user-${val.normalized}`,
          email: starter.email,
          username: val.normalized,
        },
        portfolio: starter,
      },
      200,
      {
        "Set-Cookie": `taqdom_session=${val.normalized}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
      }
    );
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const id = normalizeUsername(String(body.identifier || "test").split("@")[0]) || "test";
    const portfolio = (await getPortfolioFromD1OrMemory(env, id)) || SEED_PORTFOLIOS.test;
    return jsonResponse(
      {
        ok: true,
        user: {
          id: `user-${portfolio.username}`,
          email: portfolio.email || `${portfolio.username}@taqdom.me`,
          username: portfolio.username,
          isTestAccount: portfolio.username === "test",
        },
        portfolio,
      },
      200,
      {
        "Set-Cookie": `taqdom_session=${portfolio.username}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
      }
    );
  }

  if (pathname === "/api/auth/logout" && request.method === "POST") {
    return jsonResponse(
      { ok: true },
      200,
      { "Set-Cookie": "taqdom_session=; Path=/; Max-Age=0" }
    );
  }

  if (pathname === "/api/auth/me" && request.method === "GET") {
    const p = (await getPortfolioFromD1OrMemory(env, "test")) || SEED_PORTFOLIOS.test;
    return jsonResponse({
      authenticated: true,
      user: {
        id: "user-test-sovereign",
        email: "test@taqdom.me",
        username: "test",
        isTestAccount: true,
      },
      portfolio: p,
    });
  }

  if (pathname === "/api/portfolio") {
    if (request.method === "GET") {
      const u = normalizeUsername(searchParams.get("u") || "test");
      const p = await getPortfolioFromD1OrMemory(env, u);
      if (!p) return jsonResponse({ error: "Not found" }, 404);
      return jsonResponse({ portfolio: p });
    }
    if (request.method === "PUT") {
      const body = await request.json().catch(() => ({}));
      if (body?.portfolio?.username) {
        const saved = await savePortfolioToD1AndMemory(env, body.portfolio, false);
        return jsonResponse({ ok: true, portfolio: saved });
      }
      return jsonResponse({ error: "Invalid payload" }, 400);
    }
  }

  if (pathname === "/api/portfolio/publish" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (body?.portfolio?.username) {
      const saved = await savePortfolioToD1AndMemory(env, body.portfolio, true);
      return jsonResponse({
        ok: true,
        portfolio: saved,
        subdomainUrl: `https://${saved.username}.taqdom.me`,
      });
    }
    return jsonResponse({ error: "Missing portfolio" }, 400);
  }

  if (pathname === "/api/views" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const clean = normalizeUsername(String(body.username || "test"));
    edgeStore.views[clean] = (edgeStore.views[clean] || 100) + 1;
    return jsonResponse({ ok: true, views: edgeStore.views[clean] });
  }

  return jsonResponse({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const rawHost = request.headers.get("host") || url.host;
    const { root, sub } = parseHost(rawHost);
    const { pathname } = url;

    // 1. Handle API endpoints
    if (pathname.startsWith("/api/")) {
      return handleApiRequest(request, url, env);
    }

    // 2. Dynamic /robots.txt and /sitemap.xml
    if (pathname === "/robots.txt") {
      return new Response(
        `User-agent: *\nAllow: /\nAllow: /templates\nAllow: /explore\nAllow: /auth\nDisallow: /api/\nDisallow: /dashboard/settings\nHost: https://taqdom.me\nSitemap: https://taqdom.me/sitemap.xml\n`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    if (pathname === "/sitemap.xml") {
      const urls = [
        "https://taqdom.me",
        "https://taqdom.me/templates",
        "https://taqdom.me/explore",
        "https://taqdom.me/auth",
        ...TEMPLATES_CATALOG.map((t) => `https://taqdom.me/templates/${t.slug}`),
        ...Object.keys(edgeStore.portfolios).map((u) => `https://${u}.taqdom.me`),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`)
        .join("\n")}\n</urlset>`;
      return new Response(xml, {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // 3. Pass static assets directly to ASSETS binding
    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/images/") ||
      /\.[a-zA-Z0-9]{2,5}$/.test(pathname)
    ) {
      return env.ASSETS.fetch(request);
    }

    // 4. www -> apex 308 redirect
    if (root && sub === "www") {
      return Response.redirect(`https://${root}${pathname}${url.search}`, 308);
    }

    // 5. Direct /portfolio/x or /@x on root -> 308 redirect to https://x.taqdom.me/
    if (root && !sub) {
      const m = pathname.match(/^\/(?:portfolio\/|@)([a-z0-9-]{3,30})\/?$/i);
      if (m) {
        return Response.redirect(`https://${m[1].toLowerCase()}.${root}/`, 308);
      }
    }

    // 6. Subdomain request: username.taqdom.me -> serve /portfolio/username
    if (root && sub && !RESERVED_USERNAMES.has(sub)) {
      const targetUser = normalizeUsername(sub);
      const knownStatic = new Set(["test", "layla", "youssef", "farida", "karim"]);
      const targetPath = knownStatic.has(targetUser)
        ? `/portfolio/${targetUser}`
        : `/portfolio/test`;

      const assetUrl = new URL(request.url);
      assetUrl.pathname = targetPath;

      const assetRes = await env.ASSETS.fetch(new Request(assetUrl.toString()));
      if (assetRes.ok) {
        let html = await assetRes.text();
        const customData = await getPortfolioFromD1OrMemory(env, targetUser);
        if (!knownStatic.has(targetUser)) {
          html = html
            .replace(/https:\/\/test\.taqdom\.me/g, `https://${targetUser}.taqdom.me`)
            .replace(/test\.taqdom\.me/g, `${targetUser}.taqdom.me`);
        }
        if (customData && customData.bio?.ar) {
          html = html.replace(
            "</head>",
            `<meta name="x-taqdom-bio" content="${customData.bio.ar.replace(/"/g, "&quot;")}" /></head>`
          );
        }
        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Taqdom-Subdomain": targetUser,
          },
        });
      }
    }

    // 7. Standard Marketing / App routes on root domain
    return env.ASSETS.fetch(request);
  },
};
