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

- `src/app`: App Router entrypoints grouped by audience, with route groups for `(store)`, `(media)`, `(admin)`, plus `api`
- `src/domains`: domain-owned logic that is being split out by capability such as `storefront`, `iptv`, `payments`, and `admin`
- `src/components`: shared UI and feature components that are still used across route groups
- `src/data`: local catalog and content seed data
- `src/hooks`: client hooks for storefront and media UX
- `src/lib`: shared utilities and older integration logic that has not been moved into `src/domains` yet
- `src/context`: legacy/shared React providers that may still exist during the current refactor
- `public`: static brand, product, and category assets
- `supabase`: schema and platform setup SQL
- `scripts`: operational scripts such as env auditing
- `docs`: longer operational/provider setup notes

Current architectural direction:

- Keep the app as one deployable Next.js codebase.
- Continue moving business logic out of the route layer and into `src/domains`.
- Keep `src/lib` for shared helpers and transition code only.

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
npm run lint:eslint
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
npm run typecheck
npm run lint:eslint
npm run lint
node scripts/vercel-env.mjs --check-example
npm run build
```

Notes:

- `npm run lint` now runs `typecheck` followed by a narrowed ESLint target set instead of linting the entire repo root.
- `npm run lint:eslint` exists so lint failures can be isolated without rerunning TypeScript.
- `npm run clean` removes `.next`, `.next-dev`, and `tsconfig.tsbuildinfo`.
- If build or lint fail with `ENOSPC`, free disk space first and rerun after `npm run clean`.

## Phase 1 Status

The repo is in an active stability-and-architecture pass. The current focus is:

- serial verification instead of parallel checks that race on generated Next artifacts
- route-group and domain boundary cleanup
- README and operational runbook alignment
- reducing validation failures caused by deprecated tooling, low disk space, or broad lint targets

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
