import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const base = process.env.BASE_URL || "http://127.0.0.1:3040";
const widths = [320, 360, 375, 390, 430, 640, 768, 900, 1024, 1280, 1440];
async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    for (const channel of ["msedge", "chrome"]) {
      try {
        return await chromium.launch({ headless: true, channel });
      } catch {
        // try next channel
      }
    }
    throw new Error("Could not launch headless Chromium, Edge, or Chrome");
  }
}

const browser = await launchBrowser();
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator("#faq").scrollIntoViewIfNeeded();

    const metrics = await page.evaluate(() => {
      const faq = document.querySelector("#faq");
      const grid = faq?.querySelector(".royal-faq-grid");
      const cards = [...(grid?.querySelectorAll("article") || [])];
      const style = grid ? getComputedStyle(grid) : null;
      return {
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        faqVisible: Boolean(faq && faq.getBoundingClientRect().width > 0),
        cards: cards.length,
        columns: style?.gridTemplateColumns || "",
        mcpCardCount: cards.filter((card) => card.textContent?.includes("MCP")).length,
        hasPublishGate: faq?.textContent?.includes("publish_portfolio") || false,
      };
    });

    assert.ok(metrics.faqVisible, `FAQ must be visible at ${width}px`);
    assert.equal(metrics.cards, 6, `Expected six visible FAQ cards at ${width}px, got ${metrics.cards}`);
    assert.equal(metrics.mcpCardCount, 2, `Expected two MCP FAQ cards at ${width}px`);
    assert.equal(metrics.hasPublishGate, true, `MCP publishing explanation missing at ${width}px`);
    assert.ok(metrics.document <= metrics.viewport + 1, `Horizontal overflow at ${width}px: document ${metrics.document}px`);
    if (width <= 640) {
      const columns = metrics.columns.split(" ").filter(Boolean);
      assert.equal(columns.length, 1, `FAQ must stack to one column at ${width}px, got ${metrics.columns}`);
    } else {
      assert.ok(metrics.columns.length > 0, `FAQ grid columns missing at ${width}px`);
    }

    if (width <= 900) {
      const toggle = page.locator(".neo-mobile-toggle");
      assert.equal(await toggle.isVisible(), true, `Mobile navigation toggle must be visible at ${width}px`);
      await toggle.click();
      assert.equal(await page.locator("#taqdom-mobile-navigation").isVisible(), true, `Mobile menu must open at ${width}px`);
      assert.equal(await page.locator("#taqdom-mobile-navigation a[href='/#faq']").count(), 1);
    }

    assert.deepEqual(errors, [], `Browser runtime errors at ${width}px: ${errors.join("; ")}`);
    console.log(`[PASS] ${width}px: no horizontal overflow, six FAQ cards, two MCP cards, responsive navigation`);
    await page.close();
  }
  console.log("Responsive browser verification: PASS (11 viewport widths)");
} finally {
  await browser.close();
}
