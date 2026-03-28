# GameStop Kenya

Operational notes for the current Next.js application in this repository.

## Stack

- Next.js 15 App Router
- React 18
- TypeScript 5
- Tailwind CSS 3
- Supabase for data and admin-backed storage
- Stripe and M-Pesa payment flows
- TMDB and IPTV/media integrations

## Repository Layout

- `src/app`: App Router pages, layouts, and API routes
- `src/components`: shared UI and feature components
- `src/context`: client-side React context providers
- `src/data`: local catalog and content seed data
- `src/hooks`: client hooks for storefront and media UX
- `src/lib`: server/domain/integration logic
- `public`: static brand, product, and category assets
- `supabase`: schema and platform setup SQL
- `scripts`: operational scripts such as env auditing
- `docs`: longer operational/provider setup notes

## Requirements

- Node.js `22.x`
- npm

The repo is configured and validated with npm. Avoid mixing `yarn`, `pnpm`, `bun`, and npm lockfiles during normal development.

## Install

```bash
npm ci
```

If PowerShell blocks `npm` with `npm.ps1 cannot be loaded because running scripts is disabled`, use one of these instead:

```powershell
npm.cmd ci
node .\node_modules\npm\bin\npm-cli.js ci
```

## Local Development

```bash
npm run dev
```

Useful scripts:

```bash
npm run dev:turbo
npm run clean
npm run typecheck
npm run lint
npm run env:example:check
npm run env:audit
npm run build
```

## Environment Setup

Use `.env.example` as the source of truth for required variables. The main groups are:

- core app and auth: `ADMIN_SECRET`, site URL values
- Supabase: public URL/key plus service role key
- Stripe: publishable key, secret key, webhook secret, and tax settings
- TMDB: API base/image base/language/key
- compatible player: embed base URL and UI flags
- M-Pesa: consumer credentials, shortcode, passkey, callback URL, environment
- IPTV: provisioning mode, provider metadata, playlist inputs, sample playback values
- Cloudflare Stream: customer/account/token/signing flags and stream UIDs

Recommended flow:

1. Copy `.env.example` to a local env file such as `.env.local`.
2. Fill in the values required for the features you are actively using.
3. Run `node scripts/vercel-env.mjs --check-example`.
4. Run `node scripts/vercel-env.mjs --audit` before deployment.

## Verification

Run checks serially. The repo shares generated Next.js artifacts between some checks, so parallel validation can produce noisy failures.

Recommended order:

```bash
npm run clean
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\eslint\bin\eslint.js .
npm run lint
node scripts/vercel-env.mjs --check-example
npm run build
```

Notes:

- `npm run lint` now uses the ESLint CLI directly rather than deprecated `next lint`.
- `npm run clean` removes `.next`, `.next-dev`, and `tsconfig.tsbuildinfo`.
- If build or lint fail with `ENOSPC`, free disk space first and rerun after `npm run clean`.

## Deployment and CI

- Vercel config lives in `vercel.json`.
- CI lives in `.github/workflows/ci.yml`.
- CI currently runs:
  - `npm ci`
  - `npm run env:example:check`
  - `npm run lint`
  - `npm run build`

Before deploying, make sure:

- `NEXT_PUBLIC_SITE_URL` points to the production domain
- Stripe webhooks target `/api/stripe/webhook`
- M-Pesa callbacks target `/api/mpesa/callback` or are derived from the site URL
- Supabase, Stripe, TMDB, IPTV, and Cloudflare variables are populated in the deployment environment

## Operational References

- `docs/iptv-provider-setup.md`
- `supabase/schema.sql`
- `scripts/vercel-env.mjs`
