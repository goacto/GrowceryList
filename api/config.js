/**
 * GET /api/config
 * Returns public client-side config from Vercel environment variables.
 * Secret keys are never exposed here.
 */
module.exports = function handler(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({
        supabaseUrl:          process.env.SUPABASE_URL          || '',
        supabaseAnonKey:      process.env.SUPABASE_ANON_KEY     || '',
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        stripePriceId:        process.env.STRIPE_PRICE_ID        || ''
    });
};
