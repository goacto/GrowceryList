# GrowceryList — Cloud Setup Guide

Accounts and paid subscriptions require three services: **Supabase** (auth + database), **Stripe** (billing), and **Vercel** (hosting + serverless API functions). The app works fully offline with localStorage — this setup only unlocks cloud sync and billing.

---

## 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the full contents of [`supabase/schema.sql`](supabase/schema.sql) → Run
   - For promo codes / free trials, also run [`supabase/promo_codes.sql`](supabase/promo_codes.sql)
3. Get your project URL: **Settings → General** → copy **Project URL** (`https://xxxx.supabase.co`) → `SUPABASE_URL`
4. Get your keys: **Settings → API Keys**:
   - **Publishable key** (`sb_publishable_...`) → `SUPABASE_ANON_KEY`
   - **Secret key** (`sb_secret_...`) → `SUPABASE_SERVICE_ROLE_KEY` (keep secret — server-side only)
   - *(Legacy projects show JWT-style `anon` / `service_role` keys instead — either format works.)*
5. **Authentication → Sign In / Providers** → click **Email** → ensure it's enabled
6. **Authentication → URL Configuration** — **required**, not optional (skipping this sends OAuth users to `localhost`):
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: add `https://your-domain.com/**`

---

## 2. Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Go to **Products** → **+ Add product**:
   - Name: `Growth Pro`
   - Pricing: Recurring, $6.00 / month
   - Copy the **Price ID** → `STRIPE_PRICE_ID`
3. Go to **Developers → API keys**:
   - Copy **Publishable key** → `STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** → `STRIPE_SECRET_KEY`
4. Go to **Developers → Webhooks** → **Add endpoint**:
   - URL: `https://your-domain.com/api/stripe-webhook`
   - Events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`
5. Go to **Settings → Billing → Customer portal** → enable it and configure as desired

---

## 3. Google Sign-In (optional)

Lets users sign in with Google in addition to email/password.

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)) → pick or create a project
2. **APIs & Services → OAuth consent screen / Branding**:
   - App name: the name users see on the Google prompt (e.g. your company name)
   - Support email + (optional) logo
   - **Publish** the app (Audience → Publish) so anyone can sign in — while in "Testing", only allow-listed test users can
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Type: **Web application**
   - **Authorized redirect URI** (must match exactly):
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - Create → copy the **Client ID** and **Client Secret**
4. **Supabase → Authentication → Sign In / Providers → Google**:
   - Enable, paste the Client ID and Client Secret, Save

> The OAuth **consent screen / branding is shared by all clients in a Google Cloud project**. If you run multiple products from one project, they all show the same app name on the Google prompt. Use a separate Google Cloud project per product only if each needs its own branding.

---

## 4. Vercel Environment Variables

In your Vercel project → **Settings → Environment Variables**, add all variables from [`.env.example`](.env.example):

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PRICE_ID` | Stripe price ID for Growth Pro |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `APP_URL` | Your production URL (e.g. `https://growcerylist.com`) |

After adding variables, trigger a **Redeploy** from the Vercel dashboard.

---

## 5. Local Development

For local development with auth, create a `.env.local` file (gitignored):
```bash
cp .env.example .env.local
# Fill in your values
```

Then run with [Vercel CLI](https://vercel.com/docs/cli):
```bash
npm install -g vercel
vercel dev
```

This starts a local server at `http://localhost:3000` with the API functions available.

---

## Architecture

```
Browser (vanilla JS)
  ├─ localStorage      ← always used (free tier)
  ├─ /api/config       ← fetches public Supabase + Stripe keys on startup
  ├─ Supabase JS SDK   ← auth + cloud sync (paid tier only)
  └─ /api/*            ← Vercel serverless functions
       ├─ /api/config           GET  returns public env vars
       ├─ /api/create-checkout  POST creates Stripe checkout session
       ├─ /api/portal           POST opens Stripe customer portal
       └─ /api/stripe-webhook   POST handles Stripe events → updates Supabase
```

## Free vs Paid

| Feature | Free | Growth Pro ($6/mo) |
|---|---|---|
| All lists, recipes, meal planning | ✓ | ✓ |
| Growth reflections | ✓ | ✓ |
| Export / import JSON | ✓ | ✓ |
| Cloud sync across devices | — | ✓ |
| Account + password auth | — | ✓ |
| AI features (BYOK) | — | ✓ |
| Community feed (coming soon) | — | ✓ |

---

## Promo Codes (free trials)

Users can redeem a code in **Settings → Plan** for a time-limited Growth Pro trial — no card required. The trial grants full Pro access until it expires, then reverts to Free.

**Manage codes** in the Supabase SQL Editor (`promo_codes` table):

```sql
-- Add a code: 14 free days, max 100 uses
insert into public.promo_codes (code, duration_days, max_redemptions)
values ('LAUNCH14', 14, 100);

-- Disable a code
update public.promo_codes set active = false where code = 'LAUNCH14';

-- See redemption counts
select code, duration_days, times_redeemed, max_redemptions, active from public.promo_codes;
```

Codes are stored UPPERCASE, validated server-side in [`api/redeem-promo.js`](api/redeem-promo.js), and each user can redeem a given code only once. The starter migration seeds `WELCOME7` (7 days) and `GROW30` (30 days).
