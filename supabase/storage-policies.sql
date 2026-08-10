
-- Create these buckets in Supabase Storage:
-- covers: public
-- ebooks: private
-- Then apply policies to storage.objects.

create policy "published book covers are public"
on storage.objects for select
using (bucket_id='covers');

create policy "admins upload covers"
on storage.objects for insert to authenticated
with check (bucket_id='covers' and public.is_admin());

create policy "admins manage ebooks"
on storage.objects for all to authenticated
using (bucket_id='ebooks' and public.is_admin())
with check (bucket_id='ebooks' and public.is_admin());

-- Do NOT add a public SELECT policy to ebooks.
-- Downloads are issued by the create-download Edge Function after entitlement checks.
