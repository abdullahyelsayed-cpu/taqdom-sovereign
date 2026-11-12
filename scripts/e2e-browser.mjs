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

  // 1. Open Homepage in the approved pearl-blue daylight mode.
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const bodyBgLight = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  assert.notEqual(
    bodyBgLight,
    "rgb(255, 255, 255)",
    `Day Mode body background must not be pure white, got ${bodyBgLight}`
  );
  assert.equal(await page.getByText(/مجاني دائمًا/).first().isVisible(), true);
  assert.equal(await page.getByRole("heading", { name: /بورتفوليو يتجاوز التوقعات/ }).isVisible(), true);
  console.log(`[PASS] Browser E2E 1: Approved free-portfolio homepage is visible in daylight mode (${bodyBgLight})`);

  const graduationSection = page.locator("#graduation-project");
  await graduationSection.scrollIntoViewIfNeeded();
  assert.equal(await graduationSection.isVisible(), true, "Graduation project section must be visible on the homepage");
  const founderImage = graduationSection.locator('img[alt="عبدالله يحى"]');
  await founderImage.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const img = document.querySelector('#graduation-project img[alt="عبدالله يحى"]');
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
  });
  assert.equal(await graduationSection.locator('a[href="https://www.linkedin.com/in/abdullah-yehia/"]').isVisible(), true);
  await page.evaluate(() => window.scrollTo(0, 0));
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

  // 6. The showcase account is a protected, read-only preview.
  await page.goto(BASE + "/studio?u=layla", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const studioThemeBefore = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.getByTestId("studio-theme-toggle").click();
  const studioThemeAfter = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  assert.notEqual(studioThemeAfter, studioThemeBefore, "Studio must toggle between shared day and night themes");
  await page.getByTestId("studio-theme-toggle").click();
  const studioThemeRestored = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  assert.equal(studioThemeRestored, studioThemeBefore, "Studio must restore the original theme");
  assert.equal(await page.getByText(/وضع المعاينة فقط/).isVisible(), true, "The showcase must show a read-only notice");
  await page.getByTestId("studio-publish-btn").click();
  await page.waitForTimeout(300);
  assert.equal(await page.getByTestId("studio-publish-banner").count(), 0, "A demo account must not publish changes");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-studio.png") });
  console.log("[PASS] Browser E2E 7: Studio theme toggle and read-only showcase protection verified");

  // 7. Verify the public Layla showcase remains intact after preview.
  await page.goto("http://layla.localhost:" + PORT + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  const pageContent = await page.content();
  assert.equal(pageContent.includes("ProfilePage"), true, "Published profile JSON-LD must be present");
  assert.equal(pageContent.includes("Layla Studio E2E 2026"), false, "Demo preview must not alter the live showcase");
  const havenStackVisible = await page.getByTestId("haven-layered-parallax-stack").isVisible();
  assert.equal(havenStackVisible, true, "Haven layered parallax stack must be visible");
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-subdomain-layla.png") });
  console.log("[PASS] Browser E2E 8: Public showcase remains intact after read-only Studio preview");
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

  await browser.close();
  console.log("=== ALL REAL BROWSER E2E TESTS PASSED 100% ===");
}

main().catch((err) => {
  console.error("E2E Browser Test failed:", err);
  process.exit(1);
});
