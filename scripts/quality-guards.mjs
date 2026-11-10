/**
 * Quick source-level guards for security and accessibility regressions.
 * Run with: node scripts/quality-guards.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const workerText = read("../cloudflare/worker.mjs");
const proxyText = read("../proxy.ts");
const layoutText = read("../app/layout.tsx");
const homeText = read("../app/page.tsx");
const creditsText = read("../components/sections/graduation-credits-section.tsx");
const testimonialsText = read("../components/sections/testimonials-section.tsx");
const logoText = read("../components/brand/taqdom-logo.tsx");
const seedText = read("../lib/seed-data.ts");
const studioText = read("../app/studio/page.tsx");
const exploreText = read("../app/explore/page.tsx");
const dbText = read("../lib/db.ts");
const dashboardText = read("../app/dashboard/page.tsx");
const privacyText = read("../app/legal/privacy/page.tsx");

assert.match(layoutText, /defaultTheme="dark"/, "Dark mode must be the default.");
assert.match(homeText, /GraduationCreditsSection/, "Homepage must include the project credit section.");
assert.match(creditsText, /abdullah-yehia\.webp/, "Creator photo must be present in the credit section.");
assert.equal(fs.existsSync(new URL("../public/images/abdullah-yehia.webp", import.meta.url)), true, "Optimized creator photo asset must exist.");
assert.match(creditsText, /linkedin\.com\/in\/abdullah-yehia/, "Creator LinkedIn URL must be present.");
assert.match(creditsText, /الدفعة الثانية عشرة/, "Batch 12 context must be visible.");
assert.match(testimonialsText, /illustrative demo content/i, "Example testimonials must be disclosed as illustrative.");
assert.doesNotMatch(workerText, /taqdom-sovereign-royal-secret-key-2026-egypt/, "No hard-coded session signing secret.");
assert.match(workerText, /if \(!session\?\.username\) return unauthorized\(\)/, "Protected write endpoints must require a session.");
assert.match(workerText, /ownsUsername\(body\.portfolio\.username\)/, "Portfolio writes must be scoped to the signed-in owner.");
assert.match(logoText, /taqdom-mark-spectrum/, "Brand mark must use the refined inline SVG emblem.");
assert.match(proxyText, /export function proxy\(/, "Next.js 16 routing must use the proxy convention.");
assert.match(studioText, /studio-explore-visibility/, "Explore listing must be an explicit opt-in.");
assert.match(exploreText, /c\.discoverable !== true/, "Explore must filter out portfolios without opt-in.");
assert.match(dbText, /entry\.published\.discoverable === true/, "Server-side public directory query must enforce discoverability.");
assert.match(workerText, /portfolio\?\.discoverable === true/, "Cloudflare public directory must enforce discoverability.");
assert.match(seedText, /discoverable: false/, "New portfolios must start hidden from Explore.");
assert.match(seedText, /taqdom-avatar-placeholder\.svg/, "New accounts must not inherit demo portraits.");
assert.doesNotMatch(seedText, /Verified Taqdom Member/, "New accounts must not claim a verified status.");
assert.doesNotMatch(dashboardText, /4820/, "Dashboard must not show fabricated view totals.");
assert.match(privacyText, /Explore is opt-in/, "Privacy policy must explain optional directory visibility.");


console.log("Taqdom quality guards: PASS");
