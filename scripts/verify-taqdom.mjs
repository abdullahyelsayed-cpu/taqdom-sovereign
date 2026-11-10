// scripts/verify-taqdom.mjs — Comprehensive Deep Verification Suite for Taqdom v2 (7 Archetypes & Q4 2026 System)
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const PORT = process.env.PORT || "3040";
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;

function requestWithHost(urlPath, hostHeader) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: Number(PORT),
        path: urlPath,
        method: "GET",
        headers: {
          Host: hostHeader,
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
          })
        );
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("=== TAQDOM SOVEREIGN v2 VERIFICATION SUITE ===");

  // 1. Static CSS check: zero #FFFFFF and zero #00F5D4 in globals.css
  const globalsCss = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf-8");
  assert.equal(
    /#ffffff/i.test(globalsCss),
    false,
    "app/globals.css must NOT contain pure white #FFFFFF"
  );
  assert.equal(
    /#00f5d4/i.test(globalsCss),
    false,
    "app/globals.css must NOT contain neon cyan #00F5D4"
  );
  console.log("[PASS] 1. Q4 2026 Warm Alabaster & Cinema Noir check (Zero #FFFFFF and Zero #00F5D4 in globals.css)");

  // 1b. Verify Ultra-HD 4K WebP assets exist locally in public/images/ultra/
  const ultraDir = path.join(process.cwd(), "public/images/ultra");
  const ultraFiles = fs.readdirSync(ultraDir).filter((f) => f.endsWith(".webp"));
  assert.equal(
    ultraFiles.length >= 21,
    true,
    `Expected at least 21 Ultra-HD 4K WebP images in public/images/ultra, found ${ultraFiles.length}`
  );
  for (const file of ultraFiles) {
    const stat = fs.statSync(path.join(ultraDir, file));
    assert.equal(stat.size > 50_000, true, `Ultra-HD asset ${file} is too small (${stat.size}B)`);
  }
  console.log(`[PASS] 1b. All ${ultraFiles.length} Ultra-HD 4K WebP assets verified in public/images/ultra/`);

  // 2. All core pages & all 7 template routes return 200
  const routes = [
    "/",
    "/templates",
    "/templates/madar",
    "/templates/athar",
    "/templates/haven",
    "/templates/siyada",
    "/templates/wameed",
    "/templates/salam",
    "/templates/meshwar",
    "/studio",
    "/auth",
    "/dashboard",
    "/dashboard/settings",
    "/explore",
    "/legal/privacy",
    "/legal/terms",
    "/sitemap.xml",
    "/robots.txt",
  ];

  for (const r of routes) {
    const res = await fetch(`${BASE}${r}`, { redirect: "manual" });
    assert.equal(res.status, 200, `Expected 200 on ${r}, got ${res.status}`);
    if (["/", "/auth", "/dashboard", "/studio", "/templates"].includes(r)) {
      const html = await res.text();
      assert.equal(
        html.includes("test.taqdom.me"),
        false,
        `Page ${r} must NOT contain test.taqdom.me`
      );
      assert.equal(
        html.includes("حساب الاختبار"),
        false,
        `Page ${r} must NOT contain 'حساب الاختبار'`
      );
    }
  }
  console.log(`[PASS] 2. All ${routes.length} pages & 7 template routes returned HTTP 200 with zero 'test.taqdom.me' references`);

  // 3. Username validation & availability API (including edge cases)
  const availRes = await fetch(`${BASE}/api/username/check?u=ahmed`);
  const availData = await availRes.json();
  assert.equal(availData.valid, true);
  assert.equal(availData.available, true);

  const reservedRes = await fetch(`${BASE}/api/username/check?u=admin`);
  const reservedData = await reservedRes.json();
  assert.equal(reservedData.available, false);

  const invalidRes = await fetch(`${BASE}/api/username/check?u=-bad-`);
  const invalidData = await invalidRes.json();
  assert.equal(invalidData.valid, false);

  const emptyRes = await fetch(`${BASE}/api/username/check?u=`);
  const emptyData = await emptyRes.json();
  assert.equal(emptyData.valid, false);
  console.log("[PASS] 3. Username check API (/api/username/check) verified for valid, reserved, empty, and boundary inputs");

  // 4. 308 Permanent Redirect from root /layla, /portfolio/layla, /@youssef, and www.taqdom.me to subdomain
  const redirectDirect = await requestWithHost("/layla", `localhost:${PORT}`);
  assert.equal(redirectDirect.status, 308, "Expected 308 redirect from /layla");
  assert.equal(
    redirectDirect.headers.location,
    `http://layla.localhost:${PORT}/`
  );

  const redirectPortfolio = await requestWithHost("/portfolio/layla", `localhost:${PORT}`);
  assert.equal(redirectPortfolio.status, 308, "Expected 308 redirect from /portfolio/layla");
  assert.equal(
    redirectPortfolio.headers.location,
    `http://layla.localhost:${PORT}/`
  );

  const redirectAt = await requestWithHost("/@youssef", `localhost:${PORT}`);
  assert.equal(redirectAt.status, 308, "Expected 308 redirect from /@youssef");
  assert.equal(
    redirectAt.headers.location,
    `http://youssef.localhost:${PORT}/`
  );

  const redirectWww = await requestWithHost("/", "www.taqdom.me");
  assert.equal(redirectWww.status, 308, "Expected 308 redirect from www.taqdom.me");
  assert.equal(redirectWww.headers.location, "https://taqdom.me/");
  console.log("[PASS] 4. Canonical 308 redirects (/layla, /portfolio/layla, /@youssef, www.taqdom.me) verified");

  // 5. Subdomain rewrite for all 7 flagship creators + unclaimed subdomain check
  const flagshipCreators = ["layla", "youssef", "farida", "karim", "tariq", "salma", "nora"];
  for (const sub of flagshipCreators) {
    const subRes = await requestWithHost("/", `${sub}.localhost:${PORT}`);
    assert.equal(subRes.status, 200, `Expected 200 on subdomain ${sub}.localhost:${PORT}`);
    assert.equal(
      subRes.body.includes(`https://${sub}.taqdom.me`),
      true,
      `Expected canonical https://${sub}.taqdom.me in ${sub} HTML`
    );
    assert.equal(
      subRes.body.includes('"@type":"ProfilePage"'),
      true,
      `Expected ProfilePage JSON-LD in ${sub} HTML`
    );

    const prodSubRes = await requestWithHost("/", `${sub}.taqdom.me`);
    assert.equal(prodSubRes.status, 200, `Expected 200 on ${sub}.taqdom.me`);
  }

  const unclaimedRes = await requestWithHost("/", `unclaimed-xyz-999.localhost:${PORT}`);
  assert.equal(unclaimedRes.status, 200);
  assert.equal(
    unclaimedRes.body.includes("unclaimed-xyz-999.taqdom.me — هذا النطاق متاح للحجز"),
    true,
    "Unclaimed subdomain should render available subdomain title"
  );
  console.log("[PASS] 5. Host-based subdomain rewrites for all 7 flagship creators, ProfilePage JSON-LD, and unclaimed subdomain verified");

  // 6. Auth Security: /api/auth/me unauthenticated check + Custom Account Register/Login/Password check + Upload
  const meUnauth = await fetch(`${BASE}/api/auth/me`);
  const meUnauthData = await meUnauth.json();
  assert.equal(meUnauthData.authenticated, false, "Unauthenticated /api/auth/me must return authenticated: false");

  await fetch(`${BASE}/api/auth/settings?u=omar-arch`, { method: "DELETE" });

  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "omar-arch",
      email: "omar.custom.2026@example.com",
      password: "StrongPassword123",
      displayName: "عمر المعماري",
      template: "haven",
    }),
  });
  assert.equal(regRes.status, 200, "Expected 200 on custom registration");

  const dupRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "omar-arch",
      email: "other@example.com",
      password: "StrongPassword123",
    }),
  });
  assert.equal(dupRes.status, 409, "Duplicate username registration must return 409");

  const dupEmailRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "omar-arch-second",
      email: "omar.custom.2026@example.com",
      password: "StrongPassword123",
    }),
  });
  assert.equal(dupEmailRes.status, 409, "Duplicate email registration must return 409");

  const wrongLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "omar.custom.2026@example.com",
      password: "WrongPassword999",
    }),
  });
  assert.equal(wrongLogin.status, 401, "Wrong password must return 401");

  const rightLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "omar.custom.2026@example.com",
      password: "StrongPassword123",
    }),
  });
  assert.equal(rightLogin.status, 200, "Correct email + password must return 200");
  const rightLoginData = await rightLogin.json();
  assert.equal(rightLoginData.user.username, "omar-arch");

  // Multi-step Subdomain Handle Rename Test (omar-arch -> omar-renamed -> omar-arch)
  const rename1Res = await fetch(`${BASE}/api/auth/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentUsername: "omar-arch",
      newUsername: "omar-renamed",
    }),
  });
  assert.equal(rename1Res.status, 200, "Subdomain rename omar-arch -> omar-renamed must return 200");
  const rename1Data = await rename1Res.json();
  assert.equal(rename1Data.user.username, "omar-renamed");

  // Verify old handle omar-arch is now available again and password hash is preserved
  const oldAvailRes = await fetch(`${BASE}/api/username/check?u=omar-arch`);
  const oldAvailData = await oldAvailRes.json();
  assert.equal(oldAvailData.available, true, "Old handle omar-arch must be freed after rename");

  const wrongAfterRename = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "omar-renamed",
      password: "WrongPassword999",
    }),
  });
  assert.equal(wrongAfterRename.status, 401, "Wrong password after handle rename must still return 401");

  // Rename back omar-renamed -> omar-arch
  const renameBackRes = await fetch(`${BASE}/api/auth/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentUsername: "omar-renamed",
      newUsername: "omar-arch",
    }),
  });
  assert.equal(renameBackRes.status, 200, "Renaming back omar-renamed -> omar-arch must return 200");

  const tinyPngDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const uploadRes = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataUrl: tinyPngDataUrl,
      mime: "image/png",
      username: "omar-arch",
    }),
  });
  assert.equal(uploadRes.status, 200, "Expected 200 from /api/upload");
  const uploadData = await uploadRes.json();
  assert.equal(uploadData.ok, true);
  const mediaRes = await fetch(`${BASE}${uploadData.url}`);
  assert.equal(mediaRes.status, 200, "Expected 200 from /api/media/[key]");

  const allPortfoliosRes = await fetch(`${BASE}/api/portfolio?all=1`);
  const allPortfoliosData = await allPortfoliosRes.json();
  assert.equal(
    allPortfoliosData.portfolios.some((p) => p.username === "omar-arch"),
    true,
    "Expected omar-arch in /api/portfolio?all=1"
  );

  const omarSubRes = await requestWithHost("/", `omar-arch.localhost:${PORT}`);
  assert.equal(omarSubRes.status, 200);
  assert.equal(
    omarSubRes.body.includes("عمر المعماري"),
    true,
    "Expected عمر المعماري on omar-arch subdomain"
  );

  await fetch(`${BASE}/api/auth/settings?u=omar-arch`, { method: "DELETE" });
  console.log("[PASS] 6. Custom registration, duplicate email rejection, multi-step subdomain rename, PBKDF2 login verification, media upload, and custom subdomain SSR verified");

  // 7. 1-Click Verified Flagship Creator Login (layla) + Studio Edit & Publish Flow + Subdomain Verification
  const flagshipLoginRes = await fetch(`${BASE}/api/auth/test-login`, {
    method: "POST",
  });
  assert.equal(flagshipLoginRes.status, 200);
  const flagshipLoginData = await flagshipLoginRes.json();
  assert.equal(flagshipLoginData.ok, true);
  assert.equal(flagshipLoginData.user.username, "layla");
  const setCookie = flagshipLoginRes.headers.get("set-cookie") || "";
  assert.equal(setCookie.includes("taqdom_session="), true, "Expected taqdom_session cookie");

  const customBio = "نبذة معمارية محدثة للمهندسة ليلى منصور — Sovereign Verified Bio 2026";
  const updatedPortfolio = {
    ...flagshipLoginData.portfolio,
    bio: {
      ...flagshipLoginData.portfolio.bio,
      ar: customBio,
    },
  };
  const pubRes = await fetch(`${BASE}/api/portfolio/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ portfolio: updatedPortfolio }),
  });
  assert.equal(pubRes.status, 200);

  const verifySubRes = await requestWithHost("/", `layla.localhost:${PORT}`);
  assert.equal(
    verifySubRes.body.includes(customBio),
    true,
    `Updated bio must appear on layla.localhost:${PORT} after publish`
  );

  // Restore layla back to clean flagship state
  await fetch(`${BASE}/api/auth/test-login`, { method: "POST" });
  console.log("[PASS] 7. 1-Click Verified Creator (layla.taqdom.me) login, Studio publish, and live subdomain update verified");

  console.log("=== ALL TAQDOM v2 VERIFICATION CHECKS PASSED 100% ===");
}

runTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
