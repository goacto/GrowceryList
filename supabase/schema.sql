-- GrowceryList — Supabase Database Schema
-- Run this in the Supabase SQL Editor for your project.

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
    id                  uuid references auth.users on delete cascade primary key,
    display_name        text,
    tagline             text,
    growth_statement    text,
    goals               jsonb    default '[]',
    subscription_status text     default 'free',   -- 'free' | 'active' | 'inactive'
    stripe_customer_id  text,
    subscription_id     text,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can manage their own profile"
    on public.profiles for all
    using  (auth.uid() = id)
    with check (auth.uid() = id);

-- Auto-create a profile row on new user sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
    insert into public.profiles (id) values (new.id);
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ── Lists ──────────────────────────────────────────────────────────────────────
create table if not exists public.lists (
    id          text primary key,
    user_id     uuid references auth.users on delete cascade not null,
    data        jsonb    not null,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);

alter table public.lists enable row level security;

create policy "Users can manage their own lists"
    on public.lists for all
    using  (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── Recipes ────────────────────────────────────────────────────────────────────
create table if not exists public.recipes (
    id          text primary key,
    user_id     uuid references auth.users on delete cascade not null,
    data        jsonb    not null,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);

alter table public.recipes enable row level security;

create policy "Users can manage their own recipes"
    on public.recipes for all
    using  (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ── Meal Plans ─────────────────────────────────────────────────────────────────
create table if not exists public.meal_plans (
    id          text primary key,
    user_id     uuid references auth.users on delete cascade not null,
    data        jsonb    not null,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);

alter table public.meal_plans enable row level security;

create policy "Users can manage their own meal plans"
    on public.meal_plans for all
    using  (auth.uid() = user_id)
    with check (auth.uid() = user_id);
