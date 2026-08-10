
create extension if not exists pgcrypto;

create type public.app_role as enum ('reader','admin');
create type public.visibility as enum ('free','member');
create type public.order_status as enum ('pending','paid','failed','refunded');
create type public.subscription_status as enum ('active','past_due','cancelled','expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'reader',
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  price_kobo integer not null check (price_kobo >= 0),
  currency text not null default 'NGN',
  cover_path text,
  ebook_path text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  visibility public.visibility not null default 'free',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete restrict,
  amount_kobo integer not null,
  currency text not null default 'NGN',
  provider text not null default 'paystack',
  payment_reference text unique,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'paystack',
  provider_subscription_code text unique,
  plan text not null,
  status public.subscription_status not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id,book_id)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create index orders_user_idx on public.orders(user_id);
create index entitlements_user_idx on public.entitlements(user_id);
create index subscriptions_user_idx on public.subscriptions(user_id);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.blog_posts enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.payment_events enable row level security;

create policy "profiles own read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "public published books" on public.books for select using (published=true);
create policy "admins manage books" on public.books for all using (public.is_admin()) with check (public.is_admin());
create policy "published free posts" on public.blog_posts for select using (published=true and visibility='free');
create policy "members read member posts" on public.blog_posts for select using (
  published=true and visibility='member' and exists(
    select 1 from public.subscriptions s where s.user_id=auth.uid() and s.status='active'
  )
);
create policy "admins manage posts" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());
create policy "own orders" on public.orders for select using (user_id=auth.uid() or public.is_admin());
create policy "own subscriptions" on public.subscriptions for select using (user_id=auth.uid() or public.is_admin());
create policy "own entitlements" on public.entitlements for select using (user_id=auth.uid() or public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$ begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
