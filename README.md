# Taqdom | تَقَدُّم

Taqdom is an Arabic-first creative portfolio space for students, makers, graduates, and professionals. It helps people shape a clear home for projects, ideas, skills, and work they want to share.

## Product experience

- Seven visual styles: Orbit, Frame, Forma, Index, Pulse, Flux, and Kin.
- Arabic RTL and English LTR experiences.
- A Studio for editing identity, work, appearance, findability, and publishing.
- Personal subdomains on `*.taqdom.me`.
- Explore directory is opt-in for personal portfolios. Publishing a direct URL does not automatically list it in Explore.
- New accounts start with a blank profile; demo creators are clearly labelled as samples.
- Light-first visual system with user-controlled dark mode, cobalt/lime/coral/navy brand colours, and contrast-conscious text colours.
- Studio Canvas: personal background colour or image, overlay tuning, section dragging, resizing, scaling, visibility toggles, and keyboard/touch alternatives through numeric sliders.
- Home scroll reveals and a reading-progress indicator; Lenis is loaded only for the homepage, with native mobile scrolling and reduced-motion fallbacks.
- The large portfolio renderer is lazy-loaded in Studio to reduce initial route JavaScript.
- Keyboard-visible focus, reduced-motion support, and responsive layouts.

## Technology

- Next.js 16.4.6 App Router, React, TypeScript, Tailwind CSS.
- Cloudflare Workers for edge routing and API endpoints.
- Cloudflare D1 for persistent accounts, portfolios, and media metadata.
- GSAP and Lenis for selected motion and scroll experiences.

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

1. Add GitHub Actions repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Restrict the Cloudflare API token to the target account and the Worker/route permissions required by Wrangler.
2. Configure a strong Worker secret named `AUTH_SECRET` (at least 32 characters). Generate it locally, for example with Node's `crypto.randomBytes(48).toString("base64url")`, and set it with:
   ```bash
   pnpm dlx wrangler@latest secret put AUTH_SECRET
   ```
3. Merge reviewed changes into `main`, then run **GitHub → Actions → Deploy to Cloudflare** and confirm the production deployment.

Do not commit secrets or place them in public environment files. Rotating `AUTH_SECRET` invalidates existing signed-in sessions.

## Privacy behavior

A published portfolio URL is public to anyone who has the link. Explore directory listing is a separate opt-in and takes effect after the portfolio is published again. Disabling listing removes a profile from Explore but does not make its direct URL private.

## Graduation project context

The homepage credits identify Taqdom as an independent graduation project developed in the context of the AI Ambassadors Initiative, Batch 12. Institutional acknowledgements are not endorsements or certifications.
