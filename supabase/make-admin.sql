
-- Replace the email below with the email of your own account.
update public.profiles
set role='admin'
where id=(select id from auth.users where email='YOUR_EMAIL_HERE');
