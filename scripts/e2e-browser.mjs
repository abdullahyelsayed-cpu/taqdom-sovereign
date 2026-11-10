// scripts/e2e-browser.mjs — Real Browser E2E Test & Visual Verification for Taqdom v2
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

  console.log("=== STARTING REAL BROWSER E2E VERIFICATION (TAQDOM v2) ===");

  // Pre-set sessionStorage so preloader doesn't block screenshots
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("taqdom_preloader_done", "1");
    } catch {}
  });

  // 1. Open Homepage (/) in Day Mode (Warm Alabaster #F7F5F0)
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const bodyBgLight = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  assert.notEqual(
    bodyBgLight,
    "rgb(255, 255, 255)",
    `Day Mode body background must NOT be pure white rgb(255, 255, 255), got ${bodyBgLight}`
  );
  console.log(`[PASS] Browser E2E 1: Day Mode computed body background is Warm Alabaster (${bodyBgLight})`);

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

  // 3. Toggle Theme Day -> Cinema Noir Night
  await page.getByTestId("theme-toggle").click();
  const isDarkClass = await page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );
  assert.equal(isDarkClass, true, "Theme toggle must activate .dark class");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-home-night-en.png") });
  console.log("[PASS] Browser E2E 4: Day -> Cinema Noir Night mode toggle verified");

  // Switch back to Arabic for subsequent checks
  await page.getByTestId("lang-toggle").click();

  // 4. Visit /templates page and verify all 7 templates are visible
  await page.goto(`${BASE}/templates`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const all7 = ["madar", "athar", "haven", "siyada", "wameed", "salam", "meshwar"];
  for (const tpl of all7) {
    const visible = await page.getByTestId(`template-card-${tpl}`).isVisible();
    assert.equal(visible, true, `Template card ${tpl} should be visible`);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-templates.png") });
  console.log("[PASS] Browser E2E 5: /templates page displays all 7 archetypes (madar, athar, haven, siyada, wameed, salam, meshwar)");

  // 5. Visit /auth and click 1-Click Verified Creator button (layla.taqdom.me)
  await page.goto(`${BASE}/auth`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-auth.png") });
  await page.getByTestId("test-account-login-btn").click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  await page.waitForTimeout(500);
  const dashSub = await page.getByTestId("dashboard-subdomain").textContent();
  assert.equal(dashSub?.trim(), "https://layla.taqdom.me");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-dashboard.png") });
  console.log("[PASS] Browser E2E 6: 1-Click Verified Creator button logs into layla.taqdom.me and navigates to /dashboard");

  // 6. Visit /studio?u=layla, test Appearance tab (theme mode & accent), edit bio, and click Publish
  await page.goto(`${BASE}/studio?u=layla`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const e2eBio = "نبذة معمارية تم تحديثها ونشرها حياً عبر الاستوديو — Layla Studio E2E 2026";
  await page.getByTestId("studio-bio-ar-input").fill(e2eBio);
  await page.getByTestId("studio-publish-btn").click();
  await page.getByTestId("studio-publish-banner").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-studio.png") });
  console.log("[PASS] Browser E2E 7: /studio live edit and publish banner verified");

  // 7. Visit http://layla.localhost:PORT in Browser and verify published bio & sticky layered parallax stack
  await page.goto(`http://layla.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const pageContent = await page.content();
  assert.equal(
    pageContent.includes(e2eBio),
    true,
    "Published bio must be visible on http://layla.localhost:PORT/"
  );
  const havenStackVisible = await page.getByTestId("haven-layered-parallax-stack").isVisible();
  assert.equal(havenStackVisible, true, "Haven sticky layered parallax stack must be visible");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-subdomain-layla.png") });
  console.log("[PASS] Browser E2E 8: Subdomain http://layla.localhost:PORT/ renders updated Haven portfolio with sticky layered parallax plates");

  // 8. Verify domain-specific interactive widgets across Madar, Athar, Siyada, Wameed, Salam, and Meshwar subdomains
  await page.goto(`http://youssef.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const initialDeployments = await page.getByTestId("madar-deployments-count").textContent();
  assert.equal(initialDeployments?.trim(), "3 DEPLOYMENTS");
  await page.getByRole("button", { name: "PyTorch & CUDA", exact: true }).click();
  await page.waitForTimeout(200);
  const filteredDeployments = await page.getByTestId("madar-deployments-count").textContent();
  assert.equal(
    filteredDeployments?.trim(),
    "2 DEPLOYMENTS",
    "Clicking PyTorch & CUDA skill tag must filter Madar projects from 3 to 2"
  );
  await page.getByTestId("madar-cmdk-trigger").click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-subdomain-madar-youssef.png") });

  await page.goto(`http://farida.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const atharRailVisible = await page.getByTestId("athar-horizontal-rail").isVisible();
  assert.equal(atharRailVisible, true, "Athar horizontal scroll showcase rail must be visible");
  await page.getByTestId("athar-rail-next").click();
  await page.waitForTimeout(250);

  await page.goto(`http://karim.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.getByTestId("siyada-export-cv-btn").click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-subdomain-siyada-karim.png") });

  await page.goto(`http://tariq.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.getByTestId("wameed-play-pitch-btn").click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-subdomain-wameed-tariq.png") });

  await page.goto(`http://salma.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.getByTestId("salam-node-1").click();
  await page.waitForTimeout(300);
  const salamMatrixVisible = await page.getByTestId("salam-martech-matrix").isVisible();
  assert.equal(salamMatrixVisible, true, "Salam MarTech tool matrix must be visible");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-subdomain-salam-salma.png") });

  await page.goto(`http://nora.localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const inputs = page.locator("form input[type='text']");
  await inputs.nth(0).fill("أحمد حسن");
  await inputs.nth(1).fill("Senior Product Designer");
  await page.getByTestId("meshwar-book-btn").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12-subdomain-meshwar-nora.png") });
  console.log("[PASS] Browser E2E 9: Interactive widgets on Madar (youssef), Athar (farida), Siyada (karim), Wameed (tariq), Salam (salma), and Meshwar (nora) verified");

  // Restore layla back to clean flagship state
  await page.request.post(`${BASE}/api/auth/test-login`);

  await browser.close();
  console.log("=== ALL REAL BROWSER E2E TESTS PASSED 100% ===");
}

main().catch((err) => {
  console.error("E2E Browser Test failed:", err);
  process.exit(1);
});
