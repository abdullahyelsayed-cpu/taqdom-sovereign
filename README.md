# Taqdom | تَقَدُّم

Taqdom is an Arabic-first digital identity and portfolio platform built for students, graduates, creators, and professionals.

## Product experience

- Seven portfolio archetypes with Arabic RTL and English LTR support.
- A studio for editing and publishing portfolios.
- Individual subdomains on `*.taqdom.me`.
- A dashboard for account and portfolio management.
- Dark-first appearance with a user-controlled light theme.
- Responsive layouts, structured metadata, and accessible keyboard focus states.

## Technology

- Next.js App Router, React, TypeScript, Tailwind CSS.
- Cloudflare Workers for edge routing and API endpoints.
- Cloudflare D1 for persistent accounts and portfolios.
- GSAP and Lenis for selected motion and scroll experiences.

## Local development

Requirements: Node.js 22 and pnpm 9.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Run checks before proposing changes:

```bash
pnpm typecheck
node scripts/quality-guards.mjs
pnpm build
```

## Environment and deployment notes

The Cloudflare Worker requires an `AUTH_SECRET` secret with at least 32 characters. Set it with Wrangler or the Cloudflare dashboard; do not place the value in source control or a public `.env.example`.

The production Worker uses the `DB` D1 binding and `ASSETS` static-assets binding. See `wrangler.jsonc` for resource names and routing configuration.

## Graduation project context

The homepage credits identify Taqdom as an independent graduation project developed in the context of the AI Ambassadors Initiative, Batch 12. Institutional acknowledgements are not endorsements or certifications.
