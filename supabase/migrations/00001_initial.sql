-- SecurityScore initial schema + RLS

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  iyzico_customer_ref text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  iyzico_subscription_ref text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Inserts/updates from app: user can upsert own row for checkout flow
create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Scans
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  score int,
  findings jsonb not null default '[]'::jsonb,
  raw_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index scans_user_id_created_at_idx on public.scans (user_id, created_at desc);

alter table public.scans enable row level security;

create policy "Users can read own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scans"
  on public.scans for update
  using (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- New user -> profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
