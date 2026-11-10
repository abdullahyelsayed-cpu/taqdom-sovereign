/**
 * Source-level checks for the Taqdom experience, security and accessibility.
 * Run with: node scripts/quality-guards.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const workerText = read("../cloudflare/worker.mjs");
const proxyText = read("../proxy.ts");
const layoutText = read("../app/layout.tsx");
const homeText = read("../app/page.tsx");
const reimaginedText = read("../components/homepage/taqdom-reimagined.tsx");
const sceneText = read("../components/homepage/hero-orbit-scene.tsx");
const creditsText = read("../components/sections/graduation-credits-section.tsx");
const testimonialsText = read("../components/sections/testimonials-section.tsx");
const logoText = read("../components/brand/taqdom-logo.tsx");
const seedText = read("../lib/seed-data.ts");
const studioText = read("../app/studio/page.tsx");
const exploreText = read("../app/explore/page.tsx");
const dbText = read("../lib/db.ts");
const dashboardText = read("../app/dashboard/page.tsx");
const privacyText = read("../app/legal/privacy/page.tsx");
const polishCss = read("../app/polish.css");
const reimaginedCss = read("../app/reimagined.css");
const smoothScrollText = read("../components/smooth-scroll.tsx");
const rendererText = read("../components/templates/portfolio-renderer.tsx");

assert.match(layoutText, /defaultTheme="light"/, "The visual experience must start in light mode.");
assert.match(layoutText, /reimagined\.css/, "The new design system must load globally.");
assert.match(homeText, /TaqdomReimagined/, "Homepage must use the rebuilt experience.");
assert.match(reimaginedText, /abdullah-yehia\.webp/, "The creator photo must appear in the first-screen identity and founder story.");
assert.match(reimaginedText, /عبدالله يحيى/, "The creator name must be correctly written in Arabic.");
assert.match(reimaginedText, /linkedin\.com\/in\/abdullah-yehia/, "The creator's professional link must be present.");
assert.match(reimaginedText, /ScrollTrigger/, "The homepage must use scroll-driven GSAP choreography.");
assert.match(reimaginedText, /HeroOrbitScene/, "The homepage must include its lazy-loaded 3D hero visual.");
assert.match(sceneText, /MeshDistortMaterial/, "The 3D visual must use the installed React Three Fiber stack.");
assert.equal(fs.existsSync(new URL("../public/images/abdullah-yehia.webp", import.meta.url)), true, "Optimized creator photo asset must exist.");
assert.match(creditsText, /الدفعة الثانية عشرة/, "Batch 12 context must remain documented.");
assert.match(testimonialsText, /illustrative demo content/i, "Example testimonials must be disclosed as illustrative demo content.");
assert.doesNotMatch(workerText, /taqdom-sovereign-royal-secret-key-2026-egypt/, "No hard-coded session signing secret.");
assert.match(workerText, /if \(!session\?\.username\) return unauthorized\(\)/, "Protected write endpoints must require a session.");
assert.match(workerText, /ownsUsername\(body\.portfolio\.username\)/, "Portfolio writes must be scoped to the signed-in owner.");
assert.match(logoText, /taqdom-step-mark/, "The logo must use the new ascending-step identity.");
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
assert.match(reimaginedCss, /--neo-cobalt: #315BFF/, "The new cobalt action colour must be defined.");
assert.match(reimaginedCss, /--neo-lime: #D8FF52/, "The new lime highlight colour must be defined.");
assert.match(reimaginedCss, /prefers-reduced-motion/, "The redesign must respect reduced-motion preferences.");
assert.match(reimaginedCss, /neo-button-primary/, "Primary actions must have a strong, visible button style.");
assert.match(polishCss, /portfolio-canvas-section/, "Canvas layout styles must remain available.");
assert.match(smoothScrollText, /import\("lenis"\)/, "Lenis must load lazily rather than on every route.");
assert.match(smoothScrollText, /prefers-reduced-motion/, "Smooth scrolling must respect reduced-motion settings.");
assert.match(studioText, /handleCanvasBackgroundUpload/, "Studio must support background image uploads.");
assert.match(studioText, /handleCanvasPointerDown/, "Canvas sections must be directly draggable.");
assert.match(studioText, /updateCanvasSection/, "Canvas sections must have non-drag slider controls.");
assert.match(studioText, /backgroundOverlay/, "Studio must allow background overlay tuning.");
assert.match(rendererText, /backgroundImage: canvasBackgroundImage/, "Portfolio backgrounds must be applied to the rendered canvas.");
assert.match(rendererText, /data-canvas-section="hero"/, "Portfolio sections must expose editable canvas regions.");

console.log("Taqdom quality guards: PASS");
