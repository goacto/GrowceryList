# GrowceryList — Cloud Setup Guide

Accounts and paid subscriptions require three services: **Supabase** (auth + database), **Stripe** (billing), and **Vercel** (hosting + serverless API functions). The app works fully offline with localStorage — this setup only unlocks cloud sync and billing.

---

## 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the full contents of [`supabase/schema.sql`](supabase/schema.sql) → Run
3. Go to **Settings → API** → copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret — server-side only)
4. Go to **Authentication → Providers → Email** → ensure Email provider is enabled
5. (Optional) Set a custom **Site URL** and **Redirect URLs** under **Authentication → URL Configuration**:
   ```
   https://your-domain.com
   https://your-domain.com/?reset=true
   ```

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

## 3. Vercel Environment Variables

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

## 4. Local Development

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
