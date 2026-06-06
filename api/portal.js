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

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer:   customerId,
            return_url: process.env.APP_URL || req.headers.origin
        });
        res.json({ url: session.url });
    } catch (err) {
        console.error('Portal error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
