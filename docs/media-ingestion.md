# Catalog Media Ingestion

This storefront now supports a managed media-ingestion flow for games and gift cards.

## Goal

Use official, licensed, distributor-provided, or owned product imagery without bundling third-party art into the repo.

## Admin Flow

1. Sign in at `/admin/login`.
2. Open `/admin/catalog`.
3. Select a storefront product.
4. Paste the approved primary image URL.
5. Add gallery URLs, one per line, in the desired order.
6. Set framing metadata:
   - `imageAspect`: `portrait`, `card`, or `wide`
   - `imageFit`: `cover` or `contain`
   - `imagePosition`: CSS `object-position` value such as `center top`
7. Record licensing provenance:
   - `licenseType`
   - `sourceLabel`
   - `sourceUrl`
   - `usageScope`
   - `notes`
8. Save.

The dashboard writes to:

- `products.image_url`
- `products.metadata`
- `product_media`

## Storefront Behavior

When Supabase media exists, storefront pages prefer it automatically. If no managed media exists, the site falls back to local seeded artwork.

The merged media path now covers:

- home shelves
- games page
- gift cards page
- cart recommendations
- platform and category showcase pages

## Database Notes

`product_media` now expects:

- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Apply the latest `supabase/schema.sql` before using the admin dashboard in production.
