/**
 * POST /api/portal
 * Body: { customerId }
 * Opens a Stripe customer portal session and returns { url }.
 */
const Stripe = require('stripe');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { customerId } = req.body;

    if (!customerId) return res.status(400).json({ error: 'customerId required' });

    let base = (process.env.APP_URL || req.headers.origin || '').trim().replace(/\/+$/, '');
    if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer:   customerId,
            return_url: base
        });
        res.json({ url: session.url });
    } catch (err) {
        console.error('Portal error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
