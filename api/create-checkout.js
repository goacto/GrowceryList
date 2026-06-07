/**
 * POST /api/create-checkout
 * Body: { userId, email }
 * Creates a Stripe Checkout session and returns { url }.
 */
const Stripe = require('stripe');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { userId, email } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Normalize base URL: ensure scheme, strip whitespace and trailing slash
    let base = (process.env.APP_URL || req.headers.origin || '').trim().replace(/\/+$/, '');
    if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: email || undefined,
            line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
            metadata: { userId },
            subscription_data: { metadata: { userId } },
            success_url: `${base}/?subscription=success`,
            cancel_url:  `${base}/?subscription=cancelled`
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe checkout error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
