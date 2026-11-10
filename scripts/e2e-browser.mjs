// scripts/e2e-browser.mjs — Real Browser E2E Test & Visual Verification
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const PORT = process.env.PORT || "3045";
const BASE = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.join(process.cwd(), "public/screenshots");

async function launchSystemBrowser() {
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ headless: true, channel });
    } catch {
      // try next channel
    }
  }
  return await chromium.launch({ headless: true });
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await launchSystemBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("=== STARTING REAL BROWSER E2E VERIFICATION ===");

  // Pre-set sessionStorage so preloader doesn't block screenshots
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("taqdom_preloader_done", "1");
    } catch {}
  });

  // 1. Open Homepage (/) in Day Mode (Living Alabaster Off-White)
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  // Verify computed background-color on body is NOT #FFFFFF (rgb(255, 255, 255))
  const bodyBgLight = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  assert.notEqual(
    bodyBgLight,
    "rgb(255, 255, 255)",
    `Day Mode body background must NOT be pure white rgb(255, 255, 255), got ${bodyBgLight}`
  );
  console.log(`[PASS] Browser E2E 1: Day Mode computed body background is Living Alabaster (${bodyBgLight})`);

  // Type 'ahmed' in Hero username input and check live subdomain preview
  const heroInput = page.getByTestId("hero-username-input");
  await heroInput.fill("ahmed");
  const previewText = await page.getByTestId("hero-subdomain-preview").textContent();
  assert.equal(
    previewText?.trim(),
    "https://ahmed.taqdom.me",
    `Expected https://ahmed.taqdom.me, got ${previewText}`
  );
  console.log("[PASS] Browser E2E 2: Typing 'ahmed' updates Hero preview to https://ahmed.taqdom.me");

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-home-day-ar.png") });

  // 2. Toggle Language AR -> EN without reload
  const initialDir = await page.evaluate(() => document.documentElement.dir);
  assert.equal(initialDir, "rtl");
  await page.getByTestId("lang-toggle").click();
  const nextDir = await page.evaluate(() => document.documentElement.dir);
  assert.equal(nextDir, "ltr", "Language toggle must switch dir to ltr immediately");
  console.log("[PASS] Browser E2E 3: Instant AR -> EN language toggle switches html[dir] from rtl to ltr");

  // 3. Toggle Theme Day -> Cyber-Luxury Night
  await page.getByTestId("theme-toggle").click();
  const isDarkClass = await page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );
  assert.equal(isDarkClass, true, "Theme toggle must activate .dark class");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-home-night-en.png") });
  console.log("[PASS] Browser E2E 4: Day -> Night mode toggle verified");

  // Switch back to Arabic for subsequent checks
  await page.getByTestId("lang-toggle").click();

  // 4. Visit /templates page
  await page.goto(`${BASE}/templates`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  for (const tpl of ["athar", "madar", "siyada", "noor"]) {
    const visible = await page.getByTestId(`template-card-${tpl}`).isVisible();
    assert.equal(visible, true, `Template card ${tpl} should be visible`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-templates.png") });
  console.log("[PASS] Browser E2E 5: /templates page displays all 4 templates (athar, madar, siyada, noor)");

  // 5. Visit /auth and click 1-Click Test Account button
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-auth.png") });
  await page.getByTestId("test-account-login-btn").click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await page.waitForTimeout(500);
  const dashSub = await page.getByTestId("dashboard-subdomain").textContent();
  assert.equal(dashSub?.trim(), "https://test.taqdom.me");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-dashboard.png") });
  console.log("[PASS] Browser E2E 6: 1-Click Test Account button logs in and navigates to /dashboard");

  // 6. Visit /studio, edit bio, and click Publish
  await page.goto(`${BASE}/studio?u=test`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const e2eBio = "نبذة تم تعديلها ونشرها عبر المتصفح الحقيقي E2E — Taqdom Studio Live";
  await page.getByTestId("studio-bio-ar-input").fill(e2eBio);
  await page.getByTestId("studio-publish-btn").click();
  await page.getByTestId("studio-publish-banner").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-studio.png") });
  console.log("[PASS] Browser E2E 7: /studio live edit and publish banner verified");

  // 7. Visit http://test.localhost:PORT in Browser and verify published bio renders on subdomain
  await page.goto(`http://test.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const pageContent = await page.content();
  assert.equal(
    pageContent.includes(e2eBio),
    true,
    "Published bio must be visible on http://test.localhost:PORT/"
  );
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-subdomain-test.png") });
  console.log("[PASS] Browser E2E 8: Subdomain http://test.localhost:PORT/ renders updated portfolio");

  // Reset test account back to clean state
  await page.request.post(`${BASE}/api/auth/test-login`);

  await browser.close();
  console.log("=== ALL REAL BROWSER E2E TESTS PASSED 100% ===");
}

main().catch((err) => {
  console.error("E2E Browser Test failed:", err);
  process.exit(1);
});
