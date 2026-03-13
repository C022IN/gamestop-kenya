This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## File Format Standards

- Text files are tracked as UTF-8 with LF line endings (`.gitattributes`, `.editorconfig`).
- Windows scripts (`.bat`, `.cmd`, `.ps1`) are kept as CRLF.
- Binary assets (images, fonts, archives, PDFs) are explicitly marked as binary.
- If you add a new file type, update `.gitattributes` so format behavior stays explicit.

## IPTV Provider Setup

For the provider-managed IPTV flow, use:

- `docs/iptv-provider-setup.md`
- `supabase/schema.sql`

## Deploy on Vercel

This repo is prepared for Vercel with:

- `vercel.json` to force `npm ci` and `npm run build`
- `.github/workflows/ci.yml` to match the same Node 22 + npm build path
- `scripts/vercel-env.mjs` to audit required production env and expected callback URLs

Useful commands:

```bash
npm run env:example:check
npm run env:audit
npm run build
```

Before switching production to Vercel, make sure:

- `NEXT_PUBLIC_SITE_URL` points at the Vercel production domain
- Stripe webhooks target `/api/stripe/webhook`
- M-Pesa callbacks target `/api/mpesa/callback` or let the app derive that path from `NEXT_PUBLIC_SITE_URL`
- Supabase, Stripe, TMDB, IPTV, and Cloudflare env are populated in Vercel Project Settings
