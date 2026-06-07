-- GrowceryList — Promo Codes (free trial of Growth Pro)
-- Run this in the Supabase SQL Editor (in addition to schema.sql).

-- 1. Trial expiry column on profiles -------------------------------------------
alter table public.profiles
    add column if not exists trial_ends_at timestamptz;

-- 2. Promo codes ----------------------------------------------------------------
create table if not exists public.promo_codes (
    code             text primary key,          -- stored UPPERCASE
    duration_days    int  not null default 7,
    max_redemptions  int,                        -- null = unlimited
    times_redeemed   int  not null default 0,
    active           boolean not null default true,
    created_at       timestamptz default now()
);

-- No client access — only the service-role function reads/writes these.
alter table public.promo_codes enable row level security;

-- 3. Redemption ledger (prevents a user redeeming the same code twice) ----------
create table if not exists public.promo_redemptions (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references auth.users on delete cascade not null,
    code        text references public.promo_codes(code) not null,
    redeemed_at timestamptz default now(),
    unique (user_id, code)
);

alter table public.promo_redemptions enable row level security;

create policy "Users can view their own redemptions"
    on public.promo_redemptions for select
    using (auth.uid() = user_id);

-- 4. Seed a couple of starter codes (edit / add your own) -----------------------
insert into public.promo_codes (code, duration_days, max_redemptions) values
    ('WELCOME7',  7,  null),    -- 1 free week, unlimited uses
    ('GROW30',    30, 500)      -- 1 free month, capped at 500 redemptions
on conflict (code) do nothing;
