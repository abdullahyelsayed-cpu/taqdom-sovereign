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

Run checks and prepare the Cloudflare asset bundle before deployment:

```bash
pnpm typecheck
node scripts/quality-guards.mjs
pnpm build
pnpm build:cloudflare
```

## Production deployment

The GitHub repository includes a manually triggered, production-only workflow named **Deploy to Cloudflare**. It can deploy only from `main` and requires explicit confirmation.

Before using it:

1. Add GitHub repository Actions secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The Cloudflare API token should be restricted to the target account and grant the Worker script/route permissions needed by Wrangler.
2. Configure the Worker secret `AUTH_SECRET` once. Generate a strong value locally (for example with Node's `crypto.randomBytes(48).toString("base64url")`) and set it with:
   ```bash
   pnpm dlx wrangler@latest secret put AUTH_SECRET
   ```
3. Merge the reviewed changes into `main`, then open **GitHub → Actions → Deploy to Cloudflare → Run workflow** and check the production-confirmation input.

The deployment workflow checks that `AUTH_SECRET` exists before uploading the Worker. Do not commit the secret, put it in a public environment file, or rotate it casually: rotating it invalidates existing signed-in sessions.

## Worker configuration

The production Worker requires an `AUTH_SECRET` secret of at least 32 characters, the `DB` D1 binding, and the `ASSETS` static-assets binding. See `wrangler.jsonc` for resource names and routing configuration.

## Graduation project context

The homepage credits identify Taqdom as an independent graduation project developed in the context of the AI Ambassadors Initiative, Batch 12. Institutional acknowledgements are not endorsements or certifications.
