
# Benita Reading Room — Connect It For Real

I prepared the code so the remaining work is configuration in YOUR accounts. I cannot create or access those accounts on your behalf.

## A. Supabase

1. Create a Supabase project.
2. Open SQL Editor and run:
   - `supabase/schema.sql`
   - `supabase/storage-policies.sql`
3. Storage:
   - Create `covers` as Public.
   - Create `ebooks` as Private.
4. Authentication:
   - Enable Email/Password under Authentication > Providers.
5. After your own account is created, make it admin from SQL Editor:
   `update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');`

## B. Supabase Edge Functions

Deploy:
- `paystack-webhook`
- `create-checkout`
- `create-download`
- `admin-books`

Set secrets on the functions/project:
- SUPABASE_URL
- SUPABASE_ANON_KEY (or the project publishable/anon value expected by the function)
- SUPABASE_SERVICE_ROLE_KEY
- PAYSTACK_SECRET_KEY
- SITE_URL

Never expose SERVICE_ROLE or PAYSTACK_SECRET in a VITE_* variable.

## C. Paystack

1. Create/verify your Paystack merchant account.
2. Put the Paystack secret key only in Supabase Edge Function secrets.
3. Set the webhook URL to:
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook`
4. Use test mode first.
5. Test a successful payment and verify that:
   - order becomes `paid`
   - entitlement is created
   - download endpoint returns a short-lived URL

## D. Frontend environment

Create `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Do NOT add:
- SUPABASE_SERVICE_ROLE_KEY
- PAYSTACK_SECRET_KEY

to `.env.local`.

## E. Book publishing

The admin workflow is prepared to:
1. Upload cover to `covers/{bookId}/...`
2. Upload ebook to `ebooks/{bookId}/...`
3. Create/update the `books` row through the server-side `admin-books` function
4. Set `published=true`
5. The storefront can query published books from Supabase

The ebook bucket remains private.

## F. Production domain

After deployment, set `SITE_URL` to your actual website origin and configure Supabase Auth redirect URLs for that domain.

## G. Important security checks before launch

- Do not make the `ebooks` bucket public.
- Do not ship service-role or Paystack secret keys.
- Keep RLS enabled.
- Test as a normal reader and as an admin.
- Test failed payment, successful payment, duplicate webhook and expired/cancelled subscription.
- Test that a user who did not buy a book gets 403 from the download function.

## What I need from you to finish the live connection

You will need to create the Supabase and Paystack accounts yourself. Then provide the NON-SECRET project values (for Supabase: project URL and publishable/anon key) or place them in the local `.env.local` file. Never send your service-role key or Paystack secret key in chat.
