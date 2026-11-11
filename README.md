# Taqdom | تَقَدُّم

Taqdom is an Arabic-first platform where anyone can create, customize, and publish a complete personal portfolio — **free forever**. Every portfolio has its own personal address on `*.taqdom.me` and is presented as a standalone website.

## Product experience

- Seven portfolio styles: Orbit, Frame, Forma, Index, Pulse, Flux, and Kin.
- Arabic RTL and English LTR experiences.
- A visual Studio for editing identity, projects, appearance, page sections, SEO, previews, and publishing.
- Day and night modes share one champagne-gold visual identity: pearl-blue / silver daylight and midnight-navy / warm-gold night.
- Personal subdomains on `*.taqdom.me`; a published portfolio is a complete independent page for its owner.
- Every published portfolio carries a discreet footer credit: **مدعوم بواسطة تقدّم**.
- Portfolio creation and publishing are free for everyone, with no trial period or subscription.
- Explore directory is opt-in. Publishing a direct URL does not automatically list it in Explore.
- New accounts start with a blank profile; demonstration portfolios are illustrative samples, not real customer claims.
- Studio Canvas supports background colour or image, overlay tuning, section dragging, resizing, scaling, visibility toggles, and keyboard/touch alternatives through numeric sliders.
- Responsive layouts, accessible focus states, reduced-motion support, and optimized static asset caching.

## Graduation project

Taqdom is an independent graduation project developed in the context of the AI Ambassadors Initiative, Batch 12. The founder and project creator is **عبدالله يحى (Abdullah Yehia)**. Institutional acknowledgements are contextual credits, not endorsements or certifications.

## Technology

- Next.js 16.4.6 App Router, React 19, TypeScript, and Tailwind CSS.
- Cloudflare Workers for edge routing and API endpoints.
- Cloudflare D1 for persistent accounts, portfolios, and media metadata.
- GSAP and Lenis for selected motion and scroll experiences.
- Native browser APIs and SVG for lightweight visual effects.

The platform uses a small, coherent set of technologies rather than adding languages for a numerical target. This keeps the bundle, maintenance surface, and runtime simpler.

## Local development

Requirements: Node.js 22 and pnpm 9.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Run checks and prepare the Cloudflare asset bundle:

```bash
pnpm typecheck
node scripts/quality-guards.mjs
pnpm build
pnpm build:cloudflare
```

## Production deployment

The repository includes a manually triggered, production-only workflow named **Deploy to Cloudflare**. It runs only from `main` and requires explicit confirmation.

Before using it:

1. Add GitHub Actions repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Restrict the Cloudflare API token to the target account and the Worker / route permissions required by Wrangler.
2. Configure a strong Worker secret named `AUTH_SECRET` (at least 32 characters). Generate it locally, for example with Node's `crypto.randomBytes(48).toString("base64url")`, and set it with:
   ```bash
   pnpm dlx wrangler@latest secret put AUTH_SECRET
   ```
3. Merge reviewed changes into `main`, then run **GitHub → Actions → Deploy to Cloudflare** and confirm the production deployment.

Do not commit secrets or place them in public environment files. Rotating `AUTH_SECRET` invalidates existing signed-in sessions.

## Privacy behavior

A published portfolio URL is public to anyone who has the link. Explore directory listing is a separate opt-in and takes effect after the portfolio is published again. Disabling listing removes a profile from Explore but does not make its direct URL private.

## Publishing behavior

The Studio saves a draft and publishes the portfolio to the owner's personal `username.taqdom.me` address. Users can return to the Studio at any time to edit their portfolio and publish updates. A direct URL remains distinct from optional Explore listing.

