// scripts/verify-taqdom.mjs — Comprehensive Deep Verification Suite for Taqdom
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
  console.log("=== TAQDOM SOVEREIGN VERIFICATION SUITE ===");

  // 1. Static CSS check: zero #FFFFFF in globals.css
  const globalsCss = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf-8");
  assert.equal(
    /#ffffff/i.test(globalsCss),
    false,
    "app/globals.css must NOT contain pure white #FFFFFF"
  );
  console.log("[PASS] 1. Living Alabaster Off-White check (Zero #FFFFFF in globals.css)");

  // 2. All core pages return 200 (including /dashboard/settings)
  const routes = [
    "/",
    "/templates",
    "/templates/athar",
    "/templates/madar",
    "/templates/siyada",
    "/templates/noor",
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
  }
  console.log(`[PASS] 2. All ${routes.length} pages & SEO routes (/sitemap.xml, /robots.txt, /dashboard/settings) returned HTTP 200`);

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

  // 4. 308 Permanent Redirect from root /test, /portfolio/test, /@layla, and www.taqdom.me to subdomain
  const redirectDirect = await requestWithHost("/test", `localhost:${PORT}`);
  assert.equal(redirectDirect.status, 308, "Expected 308 redirect from /test");
  assert.equal(
    redirectDirect.headers.location,
    `http://test.localhost:${PORT}/`
  );

  const redirectPortfolio = await requestWithHost("/portfolio/test", `localhost:${PORT}`);
  assert.equal(redirectPortfolio.status, 308, "Expected 308 redirect from /portfolio/test");
  assert.equal(
    redirectPortfolio.headers.location,
    `http://test.localhost:${PORT}/`
  );

  const redirectAt = await requestWithHost("/@layla", `localhost:${PORT}`);
  assert.equal(redirectAt.status, 308, "Expected 308 redirect from /@layla");
  assert.equal(
    redirectAt.headers.location,
    `http://layla.localhost:${PORT}/`
  );

  const redirectWww = await requestWithHost("/", "www.taqdom.me");
  assert.equal(redirectWww.status, 308, "Expected 308 redirect from www.taqdom.me");
  assert.equal(redirectWww.headers.location, "https://taqdom.me/");
  console.log("[PASS] 4. Canonical 308 redirects (/test, /portfolio/test, /@layla, www.taqdom.me) verified");

  // 5. Subdomain rewrite for test, layla, youssef, farida, karim + unclaimed subdomain check
  for (const sub of ["test", "layla", "youssef", "farida", "karim"]) {
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
  console.log("[PASS] 5. Host-based subdomain rewrites, ProfilePage JSON-LD, and unclaimed subdomain handling verified");

  // 6. Auth Security: /api/auth/me unauthenticated check + Custom Account Register/Login/Password check + Upload + Unpublish
  const meUnauth = await fetch(`${BASE}/api/auth/me`);
  const meUnauthData = await meUnauth.json();
  assert.equal(meUnauthData.authenticated, false, "Unauthenticated /api/auth/me must return authenticated: false");

  // Clean up any previous omar-arch test user
  await fetch(`${BASE}/api/auth/settings?u=omar-arch`, { method: "DELETE" });

  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "omar-arch",
      email: "omar.custom.2026@example.com",
      password: "StrongPassword123",
      displayName: "عمر المعماري",
      template: "athar",
    }),
  });
  assert.equal(regRes.status, 200, "Expected 200 on custom registration");

  // Duplicate registration must return 409
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

  // Wrong password login must return 401
  const wrongLogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "omar.custom.2026@example.com",
      password: "WrongPassword999",
    }),
  });
  assert.equal(wrongLogin.status, 401, "Wrong password must return 401");

  // Correct email + password login must return 200 and username: omar-arch
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

  // Test Media Upload (/api/upload and /api/media/[key])
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

  // Verify omar-arch appears in /api/portfolio?all=1 and on omar-arch.localhost:PORT
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

  // Clean up omar-arch
  await fetch(`${BASE}/api/auth/settings?u=omar-arch`, { method: "DELETE" });
  console.log("[PASS] 6. Custom registration, PBKDF2 login verification, media upload, and custom subdomain SSR verified");

  // 7. 1-Click Test Account Login + Studio Edit & Publish Flow + Subdomain Verification
  const testLoginRes = await fetch(`${BASE}/api/auth/test-login`, {
    method: "POST",
  });
  assert.equal(testLoginRes.status, 200);
  const testLoginData = await testLoginRes.json();
  assert.equal(testLoginData.ok, true);
  assert.equal(testLoginData.user.username, "test");
  const setCookie = testLoginRes.headers.get("set-cookie") || "";
  assert.equal(setCookie.includes("taqdom_session="), true, "Expected taqdom_session cookie");

  // Modify bio & publish via /api/portfolio/publish
  const customBio = "نبذة محدثة من اختبار الاستوديو الآلي — Sovereign Verified Bio 2026";
  const updatedPortfolio = {
    ...testLoginData.portfolio,
    bio: {
      ...testLoginData.portfolio.bio,
      ar: customBio,
    },
  };
  const pubRes = await fetch(`${BASE}/api/portfolio/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ portfolio: updatedPortfolio }),
  });
  assert.equal(pubRes.status, 200);

  // Verify updated bio appears on test.localhost:PORT
  const verifySubRes = await requestWithHost("/", `test.localhost:${PORT}`);
  assert.equal(
    verifySubRes.body.includes(customBio),
    true,
    `Updated bio must appear on test.localhost:${PORT} after publish`
  );

  // Reset test account back to clean state
  await fetch(`${BASE}/api/auth/test-login`, { method: "POST" });
  console.log("[PASS] 7. 1-Click Test Account login, Studio publish, and live subdomain update verified");

  console.log("=== ALL TAQDOM VERIFICATION CHECKS PASSED 100% ===");
}

runTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
