# Benita Reading Room — Unlimited Book Catalog

This version keeps the React/Vite storefront and adds an author/admin catalog workflow designed for an unlimited number of books.

## Admin catalog features
- Add unlimited book records
- Search books
- Filter by publication status
- Publish/unpublish
- Edit metadata
- Delete records
- View price/status
- Upload-ready fields for covers and private ebook files
- Catalog metrics
- Bulk-select UI and bulk publish/unpublish actions

The front end is still a scaffold: connect the actions to the Supabase `books` table and the `admin-books` Edge Function from the production backend package.

## Production backend
Use the accompanying `benita_reading_room_production.zip` package for:
- Supabase/PostgreSQL
- Auth
- RLS
- Paystack checkout/webhooks
- private ebook storage
- entitlement checks
- signed downloads
- server-side admin permissions

No application-level book-count limit is imposed.
