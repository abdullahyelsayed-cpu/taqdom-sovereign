// scripts/verify-taqdom.mjs — Comprehensive Deep Verification Suite for Taqdom v2 (7 Archetypes & Q4 2026 System)
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const PORT = process.env.PORT || "3040";
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;
const BASE_PARSED = new URL(BASE);
if (BASE_PARSED.protocol !== "http:" || !["localhost", "127.0.0.1", "::1"].includes(BASE_PARSED.hostname)) {
  throw new Error("Safety stop: verify-taqdom.mjs is local-only; it creates and deletes disposable accounts.");
}
const TEST_USERNAME = "qa-" + Date.now().toString(36).slice(-8);
const RENAMED_USERNAME = TEST_USERNAME + "-r";
const DUPLICATE_USERNAME = TEST_USERNAME + "-x";
const TEST_EMAIL = TEST_USERNAME + "@example.test";
let sessionCookie = "";
function updateSessionCookie(response) {
  const raw = response.headers.get("set-cookie") || "";
  if (raw) sessionCookie = raw.split(";")[0];
}
function sessionHeaders(extra = {}) {
  return { ...extra, ...(sessionCookie ? { Cookie: sessionCookie } : {}) };
}

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

  // 1. Verify the active bright-premium and future-night design tokens.
  const designCss = fs.readFileSync(path.join(process.cwd(), "app/reimagined.css"), "utf-8");
  assert.match(designCss, /--neo-paper:\s*#F7F8F3/i, "The day theme must use the warm-paper background.");
  assert.match(designCss, /--neo-cobalt:\s*#315BFF/i, "The day theme must include the approved cobalt accent.");
  assert.match(designCss, /--neo-lime:\s*#D8FF52/i, "The day theme must include the approved lime accent.");
  assert.match(designCss, /\.dark\s*\{/, "The design system must include the future-night theme.");
  console.log("[PASS] 1. Bright premium day palette and future-night theme tokens verified.");

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

  const regRes = await fetch(BASE + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: "StrongPassword123",
      displayName: "عمر المعماري",
      template: "haven",
    }),
  });
  assert.equal(regRes.status, 200, "Expected 200 on custom registration");

  const dupRes = await fetch(BASE + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: TEST_USERNAME, email: "other@example.com", password: "StrongPassword123" }),
  });
  assert.equal(dupRes.status, 409, "Duplicate username registration must return 409");

  const dupEmailRes = await fetch(BASE + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: DUPLICATE_USERNAME, email: TEST_EMAIL, password: "StrongPassword123" }),
  });
  assert.equal(dupEmailRes.status, 409, "Duplicate email registration must return 409");

  const weakPasswordRes = await fetch(BASE + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: DUPLICATE_USERNAME, email: "weak@example.test", password: "Weak123" }),
  });
  assert.equal(weakPasswordRes.status, 400, "Weak passphrases must be rejected");

  const wrongLogin = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: TEST_EMAIL, password: "WrongPassword999" }),
  });
  assert.equal(wrongLogin.status, 401, "Wrong password must return 401");

  const rightLogin = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: TEST_EMAIL, password: "StrongPassword123" }),
  });
  assert.equal(rightLogin.status, 200, "Correct email + password must return 200");
  updateSessionCookie(rightLogin);
  const rightLoginData = await rightLogin.json();
  assert.equal(rightLoginData.user.username, TEST_USERNAME);

  const rename1Res = await fetch(BASE + "/api/auth/settings", {
    method: "POST",
    headers: sessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentUsername: TEST_USERNAME, newUsername: RENAMED_USERNAME }),
  });
  assert.equal(rename1Res.status, 200, "Subdomain rename must return 200");
  updateSessionCookie(rename1Res);
  const rename1Data = await rename1Res.json();
  assert.equal(rename1Data.user.username, RENAMED_USERNAME);

  const oldAvailRes = await fetch(BASE + "/api/username/check?u=" + TEST_USERNAME);
  const oldAvailData = await oldAvailRes.json();
  assert.equal(oldAvailData.available, true, "Old handle must be freed after rename");

  const wrongAfterRename = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: RENAMED_USERNAME, password: "WrongPassword999" }),
  });
  assert.equal(wrongAfterRename.status, 401, "Wrong password after rename must still return 401");

  const renameBackRes = await fetch(BASE + "/api/auth/settings", {
    method: "POST",
    headers: sessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentUsername: RENAMED_USERNAME, newUsername: TEST_USERNAME }),
  });
  assert.equal(renameBackRes.status, 200, "Renaming back must return 200");
  updateSessionCookie(renameBackRes);

  const tinyPngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const uploadRes = await fetch(BASE + "/api/upload", {
    method: "POST",
    headers: sessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ dataUrl: tinyPngDataUrl, mime: "image/png", username: TEST_USERNAME }),
  });
  assert.equal(uploadRes.status, 200, "Expected 200 from /api/upload");
  const uploadData = await uploadRes.json();
  assert.equal(uploadData.ok, true);
  const mediaRes = await fetch(BASE + uploadData.url);
  assert.equal(mediaRes.status, 200, "Expected 200 from /api/media/[key]");

  const allPortfoliosRes = await fetch(BASE + "/api/portfolio?all=1");
  const allPortfoliosData = await allPortfoliosRes.json();
  assert.equal(allPortfoliosData.portfolios.some((p) => p.username === TEST_USERNAME), true);
  assert.equal(allPortfoliosData.portfolios.find((p) => p.username === TEST_USERNAME)?.email, undefined, "Public directory must not expose account email");

  const publicPortfolioRes = await fetch(BASE + "/api/portfolio?u=" + TEST_USERNAME);
  const publicPortfolioData = await publicPortfolioRes.json();
  assert.equal(publicPortfolioData.portfolio?.email, undefined, "Public portfolio API must not expose account email");

  const safeLinkPortfolio = {
    ...publicPortfolioData.portfolio,
    links: [{ name: "Unsafe test", url: "javascript:alert(1)" }],
  };
  const publishRes = await fetch(BASE + "/api/portfolio/publish", {
    method: "POST",
    headers: sessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ portfolio: safeLinkPortfolio }),
  });
  assert.equal(publishRes.status, 200, "Owner should be able to publish their own portfolio");

  const testSubRes = await requestWithHost("/", TEST_USERNAME + ".localhost:" + PORT);
  assert.equal(testSubRes.status, 200);
  assert.equal(testSubRes.body.includes("javascript:alert(1)"), false, "Unsafe links must never appear in live HTML");
  assert.equal(testSubRes.body.includes("عمر المعماري"), true, "Expected test creator profile on personal subdomain");

  const unpublishRes = await fetch(BASE + "/api/portfolio/publish?u=" + TEST_USERNAME, {
    method: "DELETE",
    headers: sessionHeaders(),
  });
  assert.equal(unpublishRes.status, 200, "Owner should be able to unpublish their own portfolio");

  const deleteTestUser = await fetch(BASE + "/api/auth/settings?u=" + TEST_USERNAME, {
    method: "DELETE",
    headers: sessionHeaders(),
  });
  assert.equal(deleteTestUser.status, 200, "Disposable verification account must be deleted cleanly");
  console.log("[PASS] 6. Temporary account registration, passphrase policy, duplicate protection, rename, upload, public-data privacy, safe links, publish, unpublish, and cleanup");

  const flagshipLoginRes = await fetch(BASE + "/api/auth/test-login", { method: "POST" });
  assert.equal(flagshipLoginRes.status, 200);
  const flagshipLoginData = await flagshipLoginRes.json();
  assert.equal(flagshipLoginData.ok, true);
  assert.equal(flagshipLoginData.user.username, "layla");
  assert.equal(flagshipLoginData.readOnly, true);
  updateSessionCookie(flagshipLoginRes);

  const blockedPublish = await fetch(BASE + "/api/portfolio/publish", {
    method: "POST",
    headers: sessionHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ portfolio: flagshipLoginData.portfolio }),
  });
  assert.equal(blockedPublish.status, 403, "Demo showcase must reject publishing");
  const blockedDelete = await fetch(BASE + "/api/auth/settings?u=layla", { method: "DELETE", headers: sessionHeaders() });
  assert.equal(blockedDelete.status, 403, "Demo showcase must reject deletion");
  console.log("[PASS] 7. Demo account is read-only and cannot publish or delete showcase data");
  console.log("=== ALL TAQDOM v2 VERIFICATION CHECKS PASSED 100% ===");
}

runTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
