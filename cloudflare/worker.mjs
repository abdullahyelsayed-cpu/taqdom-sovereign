// cloudflare/worker.mjs — Sovereign Edge Worker for taqdom.me & *.taqdom.me backed by Cloudflare D1
import { SEED_PORTFOLIOS, createStarterPortfolio, TEMPLATES_CATALOG } from "../lib/seed-data.ts";
import { RESERVED_USERNAMES, normalizeUsername, validateUsername } from "../lib/types.ts";

const APP_ROUTES = new Set([
  ...RESERVED_USERNAMES,
  "icon",
  "apple-icon",
  "opengraph-image",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

const edgeStore = {
  portfolios: structuredClone(SEED_PORTFOLIOS),
  unpublished: new Set(),
  users: {},
  media: {},
  views: {
    layla: 9340,
    youssef: 7615,
    farida: 6490,
    karim: 5290,
    tariq: 8140,
    salma: 7420,
    nora: 5890,
  },
};

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

async function hashPasswordEdge(password, saltHex) {
  const encoder = new TextEncoder();
  const saltBytes = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g).map((b) => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltArray = Array.from(saltBytes);

  return {
    hash: hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""),
    salt: saltArray.map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(b64) {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(padded)));
}

async function signEdgeSession(payload, secret) {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("AUTH_SECRET is not configured. Set a Worker secret of at least 32 characters.");
  }
  const encoder = new TextEncoder();
  const data = base64UrlEncode(JSON.stringify({ ...payload, exp: Date.now() + 30 * 86400 * 1000 }));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${data}.${sigHex}`;
}

async function verifyEdgeSession(token, secret) {
  if (typeof secret !== "string" || secret.length < 32) return null;
  if (!token || !token.includes(".")) return null;
  const [data, sigHex] = token.split(".");
  if (!data || !sigHex) return null;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
    if (!valid) return null;
    const parsed = JSON.parse(base64UrlDecode(data));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function parseSessionFromRequest(request, env) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)taqdom_session=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1].trim());
    return await verifyEdgeSession(token, env?.AUTH_SECRET);
  } catch {
    return null;
  }
}

function makeSessionCookie(token, isSecure = true) {
  return `taqdom_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${
    isSecure ? "; Secure" : ""
  }`;
}

async function getPublishedPortfolioFromD1(env, username) {
  const clean = normalizeUsername(username);
  if (!clean) return null;
  if (edgeStore.unpublished.has(clean)) return null;

  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT published_json FROM portfolios WHERE username = ?1"
      )
        .bind(clean)
        .first();
      if (row) {
        if (!row.published_json) return null;
        return JSON.parse(row.published_json);
      }
    } catch {
      // Fallback to edgeStore
    }
  }
  return edgeStore.portfolios[clean] || SEED_PORTFOLIOS[clean] || null;
}

async function getDraftPortfolioFromD1(env, username) {
  const clean = normalizeUsername(username);
  if (!clean) return null;
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT draft_json, published_json FROM portfolios WHERE username = ?1"
      )
        .bind(clean)
        .first();
      if (row) {
        const raw = row.draft_json || row.published_json;
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
  }
  return edgeStore.portfolios[clean] || SEED_PORTFOLIOS[clean] || null;
}

async function getAllPublishedPortfoliosFromD1(env) {
  const map = { ...SEED_PORTFOLIOS, ...edgeStore.portfolios };
  for (const unpub of edgeStore.unpublished) {
    delete map[unpub];
  }
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT username, published_json FROM portfolios"
      ).all();
      if (Array.isArray(results)) {
        for (const row of results) {
          if (row.username) {
            if (row.published_json) {
              try {
                map[row.username] = JSON.parse(row.published_json);
              } catch {}
            } else {
              delete map[row.username];
            }
          }
        }
      }
    } catch {
      // Ignore D1 error
    }
  }
  return Object.values(map).filter(
    (portfolio) =>
      portfolio?.isFlagshipShowcase === true ||
      portfolio?.discoverable === true
  );
}

async function savePortfolioToD1AndMemory(env, portfolio, isPublish = false, userAuth = null) {
  const clean = normalizeUsername(portfolio.username);
  const now = Date.now();
  const updated = {
    ...portfolio,
    username: clean,
    updatedAt: now,
    publishedAt: isPublish ? now : portfolio.publishedAt || now,
  };
  edgeStore.portfolios[clean] = updated;
  if (isPublish) {
    edgeStore.unpublished.delete(clean);
  }

  if (env.DB) {
    try {
      const jsonStr = JSON.stringify(updated);
      const userId = userAuth?.id || `user-${clean}`;
      const email = (userAuth?.email || updated.email || `${clean}@taqdom.me`).toLowerCase().trim();
      const pwdHash = userAuth?.passwordHash || "d1-hash";
      const salt = userAuth?.salt || "d1-salt";

      const existingUser = await env.DB.prepare(
        "SELECT id, email FROM users WHERE username = ?1"
      )
        .bind(clean)
        .first();

      let targetUserId = existingUser?.id || userId;
      if (!existingUser) {
        const emailConflict = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?1"
        )
          .bind(email)
          .first();
        const safeEmail = emailConflict ? `${clean}.${now}@taqdom.me` : email;
        await env.DB.prepare(
          `INSERT OR IGNORE INTO users (id, email, username, password_hash, salt, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        )
          .bind(targetUserId, safeEmail, clean, pwdHash, salt, now)
          .run();
      } else if (userAuth?.passwordHash) {
        await env.DB.prepare(
          `UPDATE users SET email = ?1, password_hash = ?2, salt = ?3 WHERE username = ?4`
        )
          .bind(email, pwdHash, salt, clean)
          .run()
          .catch(() => {});
      }

      await env.DB.prepare(
        `INSERT INTO portfolios (user_id, username, template, draft_json, published_json, published_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(user_id) DO UPDATE SET
           username = excluded.username,
           template = excluded.template,
           draft_json = excluded.draft_json,
           published_json = CASE WHEN ?8 = 1 THEN excluded.published_json ELSE portfolios.published_json END,
           published_at = CASE WHEN ?8 = 1 THEN excluded.published_at ELSE portfolios.published_at END,
           updated_at = excluded.updated_at`
      )
        .bind(
          targetUserId,
          clean,
          updated.template || "haven",
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
  const isSecure = url.protocol === "https:";
  const origin = request.headers.get("origin");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && origin && origin !== url.origin) {
    return jsonResponse({ error: "Cross-origin request rejected" }, 403);
  }
  const session = await parseSessionFromRequest(request, env);
  const ownsUsername = (username) =>
    Boolean(session?.username) && session.username === normalizeUsername(username);
  const unauthorized = () =>
    jsonResponse({ error: "يجب تسجيل الدخول أولاً / Authentication required" }, 401);
  const forbidden = () =>
    jsonResponse({ error: "لا تملك صلاحية تعديل هذا الحساب / You cannot modify this account" }, 403);

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
    const existing = await getDraftPortfolioFromD1(env, val.normalized);
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
    const fresh = structuredClone(SEED_PORTFOLIOS.layla);
    await savePortfolioToD1AndMemory(env, fresh, true);
    const userPayload = {
      id: "user-layla",
      email: "layla@taqdom.me",
      username: "layla",
      isTestAccount: true,
    };
    const token = await signEdgeSession(userPayload, env?.AUTH_SECRET);
    return jsonResponse(
      {
        ok: true,
        user: userPayload,
        portfolio: fresh,
      },
      200,
      {
        "Set-Cookie": makeSessionCookie(token, isSecure),
      }
    );
  }

  if (pathname === "/api/auth/register" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const val = validateUsername(String(body.username || ""));

    if (!email || !email.includes("@")) {
      return jsonResponse(
        { error: "يرجى إدخال بريد إلكتروني صحيح / Valid email required" },
        400
      );
    }
    if (!val.valid) {
      return jsonResponse({ error: val.reasonAr || val.reasonEn || "Invalid username" }, 400);
    }
    if (password.length < 6) {
      return jsonResponse(
        { error: "كلمة المرور يجب أن تكون ٦ أحرف على الأقل / Password min 6 chars" },
        400
      );
    }

    if (SEED_PORTFOLIOS[val.normalized]) {
      return jsonResponse(
        { error: "هذا النطاق مستخدم لحساب عرض رسمي / Reserved showcase username" },
        409
      );
    }
    if (env.DB) {
      const existingRow = await env.DB.prepare(
        "SELECT username, email FROM users WHERE username = ?1 OR LOWER(email) = ?2"
      )
        .bind(val.normalized, email)
        .first()
        .catch(() => null);

      if (existingRow && existingRow.username === val.normalized) {
        return jsonResponse(
          { error: "هذا الاسم محجوز بالفعل لمبدع آخر / Username already taken" },
          409
        );
      }
      if (existingRow && existingRow.email?.toLowerCase() === email) {
        return jsonResponse(
          { error: "البريد الإلكتروني مسجل بالفعل / Email already registered" },
          409
        );
      }
    }

    const { hash, salt } = await hashPasswordEdge(password);
    const userObj = {
      id: `user-${val.normalized}`,
      email,
      username: val.normalized,
      passwordHash: hash,
      salt,
    };
    edgeStore.users[val.normalized] = userObj;

    const starter = createStarterPortfolio(
      val.normalized,
      body.template || "haven",
      body.displayName || val.normalized
    );
    starter.email = email;
    await savePortfolioToD1AndMemory(env, starter, true, userObj);

    const sessionPayload = {
      id: userObj.id,
      userId: userObj.id,
      email: userObj.email,
      username: userObj.username,
      isTestAccount: false,
    };
    const token = await signEdgeSession(sessionPayload, env?.AUTH_SECRET);

    return jsonResponse(
      {
        ok: true,
        user: sessionPayload,
        portfolio: starter,
      },
      200,
      {
        "Set-Cookie": makeSessionCookie(token, isSecure),
      }
    );
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const identifier = String(body.identifier || body.email || body.username || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!identifier) {
      return jsonResponse({ error: "يرجى إدخال اسم المستخدم أو البريد الإلكتروني" }, 400);
    }

    let dbUser = null;
    if (env.DB) {
      dbUser = await env.DB.prepare(
        "SELECT id, email, username, password_hash, salt FROM users WHERE LOWER(username) = ?1 OR LOWER(email) = ?1"
      )
        .bind(identifier)
        .first()
        .catch(() => null);
    }

    if (!dbUser) {
      for (const u of Object.values(edgeStore.users)) {
        if (u.username === identifier || u.email === identifier) {
          dbUser = {
            id: u.id,
            email: u.email,
            username: u.username,
            password_hash: u.passwordHash,
            salt: u.salt,
          };
          break;
        }
      }
    }

    if (!dbUser) {
      return jsonResponse(
        { error: "الحساب غير موجود. يمكنك إنشاء حساب جديد أو معاينة الحساب الموثق." },
        401
      );
    }

    const isSeededHash =
      dbUser.password_hash === "seeded-pbkdf2" ||
      dbUser.password_hash === "seeded" ||
      dbUser.password_hash === "d1-hash";

    if (isSeededHash) {
      return jsonResponse(
        {
          error: "هذا حساب عرض تجريبي. استخدم زر «معاينة الحساب التجريبي» من صفحة الدخول.",
        },
        403
      );
    }

    const { hash } = await hashPasswordEdge(password, dbUser.salt);
    if (!password || hash !== dbUser.password_hash) {
      return jsonResponse(
        { error: "بيانات الدخول غير صحيحة / Invalid credentials" },
        401
      );
    }

    const portfolio =
      (await getDraftPortfolioFromD1(env, dbUser.username)) ||
      SEED_PORTFOLIOS[dbUser.username] ||
      createStarterPortfolio(dbUser.username, "haven", dbUser.username);

    const sessionPayload = {
      id: dbUser.id,
      userId: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      isTestAccount: dbUser.username === "layla",
    };
    const token = await signEdgeSession(sessionPayload, env?.AUTH_SECRET);

    return jsonResponse(
      {
        ok: true,
        user: sessionPayload,
        portfolio,
      },
      200,
      {
        "Set-Cookie": makeSessionCookie(token, isSecure),
      }
    );
  }

  if (pathname === "/api/auth/logout" && request.method === "POST") {
    return jsonResponse(
      { ok: true },
      200,
      { "Set-Cookie": "taqdom_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" }
    );
  }

  if (pathname === "/api/auth/me" && request.method === "GET") {
    const session = await parseSessionFromRequest(request, env);
    if (!session || !session.username) {
      return jsonResponse({ authenticated: false, user: null });
    }
    const p =
      (await getDraftPortfolioFromD1(env, session.username)) ||
      SEED_PORTFOLIOS[session.username] ||
      null;
    return jsonResponse({
      authenticated: true,
      user: {
        id: session.userId || session.id || `user-${session.username}`,
        email: session.email || `${session.username}@taqdom.me`,
        username: session.username,
        isTestAccount: Boolean(session.isTestAccount),
      },
      portfolio: p,
    });
  }

  if (pathname === "/api/auth/settings") {
    if (request.method === "POST") {
      if (!session?.username) return unauthorized();
      const body = await request.json().catch(() => ({}));
      const cur = normalizeUsername(String(body.currentUsername || ""));
      if (!cur) return jsonResponse({ error: "Missing currentUsername" }, 400);
      if (!ownsUsername(cur)) return forbidden();

      let targetUsername = cur;
      if (body.newUsername && normalizeUsername(String(body.newUsername)) !== cur) {
        const val = validateUsername(String(body.newUsername));
        if (!val.valid) return jsonResponse({ error: val.reasonAr || "Invalid username" }, 400);
        const candidate = val.normalized;
        if (
          RESERVED_USERNAMES.has(candidate) ||
          SEED_PORTFOLIOS[candidate] ||
          edgeStore.users[candidate] ||
          edgeStore.portfolios[candidate]
        ) {
          return jsonResponse({ error: "Username already taken" }, 409);
        }
        if (env.DB) {
          const takenRow = await env.DB.prepare(
            "SELECT username FROM users WHERE username = ?1 UNION SELECT username FROM portfolios WHERE username = ?1"
          )
            .bind(candidate)
            .first()
            .catch(() => null);
          if (takenRow) {
            return jsonResponse({ error: "Username already taken" }, 409);
          }
        }
        targetUsername = candidate;
      }

      let pwdInfo = null;
      if (body.newPassword) {
        if (String(body.newPassword).length < 6) {
          return jsonResponse({ error: "Password min 6 chars" }, 400);
        }
        pwdInfo = await hashPasswordEdge(String(body.newPassword));
      }

      // Fetch existing user credentials so we preserve id, email, password_hash, and salt
      let existingUser = edgeStore.users[cur] || null;
      if (!existingUser && env.DB) {
        existingUser = await env.DB.prepare(
          "SELECT id, email, username, password_hash, salt FROM users WHERE username = ?1"
        )
          .bind(cur)
          .first()
          .catch(() => null);
      }

      const isFlagshipSeed = Boolean(SEED_PORTFOLIOS[cur]);
      const preservedUserId =
        !isFlagshipSeed && existingUser?.id ? existingUser.id : `user-${targetUsername}`;
      const preservedEmail =
        !isFlagshipSeed && existingUser?.email
          ? existingUser.email
          : `${targetUsername}@taqdom.me`;
      const preservedHash = pwdInfo
        ? pwdInfo.hash
        : existingUser?.password_hash || "seeded-pbkdf2";
      const preservedSalt = pwdInfo
        ? pwdInfo.salt
        : existingUser?.salt || "taqdom-salt-2026";

      const currentPortfolio = structuredClone(
        (await getDraftPortfolioFromD1(env, cur)) ||
          createStarterPortfolio(targetUsername, "haven", targetUsername)
      );
      currentPortfolio.username = targetUsername;
      currentPortfolio.email = preservedEmail;
      currentPortfolio.updatedAt = Date.now();

      if (targetUsername !== cur && !isFlagshipSeed) {
        delete edgeStore.portfolios[cur];
        delete edgeStore.users[cur];
        edgeStore.views[targetUsername] = edgeStore.views[cur] || 1;
        delete edgeStore.views[cur];

        if (env.DB) {
          const jsonStr = JSON.stringify(currentPortfolio);
          await env.DB.prepare(
            "UPDATE users SET username = ?1, password_hash = ?2, salt = ?3 WHERE username = ?4"
          )
            .bind(targetUsername, preservedHash, preservedSalt, cur)
            .run()
            .catch(() => {});
          await env.DB.prepare(
            "UPDATE portfolios SET username = ?1, draft_json = ?2, published_json = ?3, updated_at = ?4 WHERE username = ?5"
          )
            .bind(targetUsername, jsonStr, jsonStr, Date.now(), cur)
            .run()
            .catch(() => {});
        }
      }

      edgeStore.users[targetUsername] = {
        id: preservedUserId,
        email: preservedEmail,
        username: targetUsername,
        password_hash: preservedHash,
        salt: preservedSalt,
      };
      edgeStore.portfolios[targetUsername] = currentPortfolio;

      const saved = await savePortfolioToD1AndMemory(env, currentPortfolio, true, {
        id: preservedUserId,
        email: preservedEmail,
        passwordHash: preservedHash,
        salt: preservedSalt,
      });

      const sessionPayload = {
        id: preservedUserId,
        userId: preservedUserId,
        email: preservedEmail,
        username: targetUsername,
        isTestAccount: targetUsername === "layla",
      };
      const token = await signEdgeSession(sessionPayload, env?.AUTH_SECRET);

      return jsonResponse(
        { ok: true, user: sessionPayload, portfolio: saved },
        200,
        { "Set-Cookie": makeSessionCookie(token, isSecure) }
      );
    }

    if (request.method === "DELETE") {
      if (!session?.username) return unauthorized();
      const u = normalizeUsername(searchParams.get("u") || "");
      if (!u || SEED_PORTFOLIOS[u]) {
        return jsonResponse({ error: "Cannot delete showcase account" }, 403);
      }
      if (!ownsUsername(u)) return forbidden();
      delete edgeStore.portfolios[u];
      delete edgeStore.users[u];
      if (env.DB) {
        await env.DB.prepare("DELETE FROM portfolios WHERE username = ?1").bind(u).run().catch(() => {});
        await env.DB.prepare("DELETE FROM users WHERE username = ?1").bind(u).run().catch(() => {});
      }
      return jsonResponse(
        { ok: true },
        200,
        { "Set-Cookie": "taqdom_session=; Path=/; Max-Age=0" }
      );
    }
  }

  if (pathname === "/api/portfolio") {
    if (request.method === "GET") {
      if (searchParams.get("all") === "1") {
        const portfolios = await getAllPublishedPortfoliosFromD1(env);
        return jsonResponse({ portfolios });
      }
      const u = normalizeUsername(searchParams.get("u") || "layla");
      const mode = searchParams.get("mode") || "published";
      if (mode === "draft" && !ownsUsername(u)) return unauthorized();
      const p =
        mode === "draft"
          ? await getDraftPortfolioFromD1(env, u)
          : await getPublishedPortfolioFromD1(env, u);
      if (!p) return jsonResponse({ error: "Not found" }, 404);
      return jsonResponse({ portfolio: p });
    }
    if (request.method === "PUT") {
      if (!session?.username) return unauthorized();
      const body = await request.json().catch(() => ({}));
      if (body?.portfolio?.username) {
        if (!ownsUsername(body.portfolio.username)) return forbidden();
        const saved = await savePortfolioToD1AndMemory(env, body.portfolio, false);
        return jsonResponse({ ok: true, portfolio: saved });
      }
      return jsonResponse({ error: "Invalid payload" }, 400);
    }
  }

  if (pathname === "/api/portfolio/publish") {
    if (request.method === "POST") {
      if (!session?.username) return unauthorized();
      const body = await request.json().catch(() => ({}));
      if (body?.portfolio?.username) {
        if (!ownsUsername(body.portfolio.username)) return forbidden();
        const val = validateUsername(String(body.portfolio.username));
        if (!val.valid) {
          return jsonResponse({ error: val.reasonAr || "Invalid username" }, 400);
        }
        const saved = await savePortfolioToD1AndMemory(
          env,
          { ...body.portfolio, username: val.normalized },
          true
        );
        return jsonResponse({
          ok: true,
          portfolio: saved,
          subdomainUrl: `https://${saved.username}.taqdom.me`,
        });
      }
      return jsonResponse({ error: "Missing portfolio" }, 400);
    }

    if (request.method === "DELETE") {
      if (!session?.username) return unauthorized();
      const uParam = searchParams.get("u");
      const body = await request.json().catch(() => ({}));
      const clean = normalizeUsername(String(uParam || body.username || ""));
      if (!clean) return jsonResponse({ error: "Missing username" }, 400);
      if (!ownsUsername(clean)) return forbidden();
      edgeStore.unpublished.add(clean);
      if (env.DB) {
        await env.DB.prepare(
          "UPDATE portfolios SET published_json = NULL, published_at = NULL WHERE username = ?1"
        )
          .bind(clean)
          .run()
          .catch(() => {});
      }
      return jsonResponse({ ok: true, username: clean });
    }
  }

  if (pathname === "/api/upload" && request.method === "POST") {
    if (!session?.username) return unauthorized();
    const body = await request.json().catch(() => ({}));
    const dataUrl = String(body.dataUrl || "");
    const match = dataUrl.match(/^data:(image\\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/i);
    if (!match) {
      return jsonResponse({ error: "Only valid JPG, PNG, and WebP images are allowed" }, 400);
    }
    const mime = match[1].toLowerCase();
    if (body.mime && String(body.mime).toLowerCase() !== mime) {
      return jsonResponse({ error: "Image type mismatch" }, 400);
    }
    const size = Math.floor((match[2].length * 3) / 4);
    if (size <= 0 || size > 1_600_000) {
      return jsonResponse({ error: "Max file size is 1.5MB" }, 413);
    }
    const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
    const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    edgeStore.media[key] = { key, mime, size, dataUrl };
    if (env.DB) {
      try {
        await env.DB.prepare(
          "CREATE TABLE IF NOT EXISTS media_blobs (key TEXT PRIMARY KEY, mime TEXT, size INTEGER, data_url TEXT, created_at INTEGER)"
        ).run();
        await env.DB.prepare(
          "INSERT OR REPLACE INTO media_blobs (key, mime, size, data_url, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
        )
          .bind(key, mime, size, dataUrl, Date.now())
          .run();
      } catch {
        // Ignore D1 media error
      }
    }
    return jsonResponse({
      ok: true,
      key,
      url: `/api/media/${key}`,
      dataUrl,
    });
  }

  if (pathname.startsWith("/api/media/") && request.method === "GET") {
    const key = pathname.slice("/api/media/".length);
    let item = edgeStore.media[key];
    if ((!item || !item.dataUrl) && env.DB) {
      try {
        const row = await env.DB.prepare(
          "SELECT mime, size, data_url FROM media_blobs WHERE key = ?1"
        )
          .bind(key)
          .first();
        if (row && row.data_url) {
          item = { key, mime: row.mime, size: row.size, dataUrl: row.data_url };
          edgeStore.media[key] = item;
        }
      } catch {
        // Ignore
      }
    }
    if (!item || !item.dataUrl) {
      return new Response("Not found", { status: 404 });
    }
    const base64Idx = item.dataUrl.indexOf("base64,");
    if (base64Idx === -1) return new Response("Invalid media", { status: 400 });
    const binStr = atob(item.dataUrl.slice(base64Idx + 7));
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": item.mime || "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (pathname === "/api/views" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const clean = normalizeUsername(String(body.username || "layla"));
    edgeStore.views[clean] = (edgeStore.views[clean] || 100) + 1;
    if (env.DB) {
      const day = new Date().toISOString().slice(0, 10);
      await env.DB.prepare(
        `INSERT INTO views (username, day, count) VALUES (?1, ?2, 1)
         ON CONFLICT(username, day) DO UPDATE SET count = views.count + 1`
      )
        .bind(clean, day)
        .run()
        .catch(() => {});
    }
    return jsonResponse({ ok: true, views: edgeStore.views[clean] });
  }

  return jsonResponse({ error: "Not found" }, 404);
}

function rewriteSubdomainHtml(baseHtml, targetUser, customData) {
  const canonicalUrl = `https://${targetUser}.taqdom.me`;
  let html = baseHtml
    .replace(/https:\/\/layla\.taqdom\.me/g, canonicalUrl)
    .replace(/layla\.taqdom\.me/g, `${targetUser}.taqdom.me`)
    .replace(/https:\/\/test\.taqdom\.me/g, canonicalUrl)
    .replace(/test\.taqdom\.me/g, `${targetUser}.taqdom.me`);

  if (!customData) {
    const availTitle = `${targetUser}.taqdom.me — هذا النطاق متاح للحجز | تَقَدُّم`;
    const availDesc = `احجز النطاق السيادي ${targetUser}.taqdom.me وأنشئ معرض أعمالك الفاخر على منصة تَقَدُّم.`;
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(availTitle)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/i,
        `<meta name="description" content="${escapeHtml(availDesc)}"/>`
      )
      .replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/gi,
        (match) => (match.includes('"@type":"ProfilePage"') ? "" : match)
      );

    const bootstrapScript = `<script>window.__TAQDOM_SUBDOMAIN__=${JSON.stringify(
      targetUser
    )};window.__TAQDOM_PORTFOLIO__=null;</script>`;
    return html.replace("</head>", `${bootstrapScript}</head>`);
  }

  const title =
    customData.seo?.title ||
    `${customData.name?.ar || targetUser} | ${customData.name?.en || targetUser} — ${
      customData.title?.ar || "تَقَدُّم"
    } | تَقَدُّم`;
  const description =
    customData.seo?.description ||
    `${customData.bio?.ar || ""} — ${customData.bio?.en || ""}`;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonicalUrl,
    mainEntity: {
      "@type": "Person",
      name: customData.name?.en || targetUser,
      alternateName: customData.name?.ar || targetUser,
      jobTitle: customData.title?.en || "",
      description: customData.bio?.en || customData.bio?.ar || "",
      image: `https://taqdom.me${customData.avatar || "/images/creators/layla.jpg"}`,
      url: canonicalUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: customData.city?.en || "Cairo, Egypt",
      },
      sameAs: Array.isArray(customData.links) ? customData.links.map((l) => l.url) : [],
    },
    hasPart: Array.isArray(customData.projects)
      ? customData.projects.map((p) => ({
          "@type": "CreativeWork",
          name: p.title?.en || "",
          headline: p.title?.ar || "",
          description: p.desc?.en || "",
          dateCreated: p.year || "2026",
        }))
      : [],
  };

  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(description)}"/>`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtml(title)}"/>`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtml(description)}"/>`
    )
    .replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/gi,
      (match) =>
        match.includes('"@type":"ProfilePage"')
          ? `<script type="application/ld+json">${JSON.stringify(personJsonLd)}</script>`
          : match
    );

  const safeJson = JSON.stringify(customData).replace(/</g, "\\u003c");
  const bootstrapScript = `<meta name="x-taqdom-bio" content="${escapeHtml(
    customData.bio?.ar || ""
  )}"/><script>window.__TAQDOM_SUBDOMAIN__=${JSON.stringify(
    targetUser
  )};window.__TAQDOM_PORTFOLIO__=${safeJson};</script>`;

  return html.replace("</head>", `${bootstrapScript}</head>`);
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
      const allPortfolios = await getAllPublishedPortfoliosFromD1(env);
      const urls = [
        "https://taqdom.me",
        "https://taqdom.me/templates",
        "https://taqdom.me/explore",
        "https://taqdom.me/auth",
        ...TEMPLATES_CATALOG.map((t) => `https://taqdom.me/templates/${t.slug}`),
        ...allPortfolios
          .filter((p) => !p?.seo?.noindex && p?.username)
          .map((p) => `https://${p.username}.taqdom.me`),
      ];
      const uniqueUrls = Array.from(new Set(urls));
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
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

    // 5. Direct /portfolio/x, /@x, or /x on root -> 308 redirect to https://x.taqdom.me/
    if (root && !sub) {
      const explicitMatch = pathname.match(/^\/(?:portfolio\/|@)([a-z0-9-]{3,30})\/?$/i);
      if (explicitMatch) {
        const candidate = explicitMatch[1].toLowerCase();
        if (!APP_ROUTES.has(candidate) && !candidate.startsWith("-") && !candidate.endsWith("-")) {
          return Response.redirect(`https://${candidate}.${root}/`, 308);
        }
      }

      const directMatch = pathname.match(/^\/([a-z0-9-]{3,30})\/?$/i);
      if (directMatch) {
        const candidate = directMatch[1].toLowerCase();
        if (!APP_ROUTES.has(candidate) && !candidate.startsWith("-") && !candidate.endsWith("-")) {
          return Response.redirect(`https://${candidate}.${root}/`, 308);
        }
      }
    }

    // 6. Subdomain request: username.taqdom.me -> serve dynamically enriched portfolio
    if (root && sub && !RESERVED_USERNAMES.has(sub)) {
      const targetUser = normalizeUsername(sub);
      const knownStatic = new Set(["layla", "youssef", "farida", "karim", "tariq", "salma", "nora"]);
      const targetPath = knownStatic.has(targetUser)
        ? `/portfolio/${targetUser}`
        : `/portfolio/layla`;

      const assetUrl = new URL(request.url);
      assetUrl.pathname = targetPath;

      const assetRes = await env.ASSETS.fetch(new Request(assetUrl.toString()));
      if (assetRes.ok) {
        const rawHtml = await assetRes.text();
        const customData = await getPublishedPortfolioFromD1(env, targetUser);
        const enrichedHtml = rewriteSubdomainHtml(rawHtml, targetUser, customData);
        return new Response(enrichedHtml, {
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
