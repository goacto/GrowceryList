/**
 * POST /api/stripe-webhook
 * Receives Stripe webhook events and updates subscription status in Supabase.
 * Requires raw body for signature verification — bodyParser is disabled.
 */
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Vercel: disable body parsing so we get the raw buffer for Stripe verification
module.exports.config = { api: { bodyParser: false } };

async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end',  () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const stripe    = Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase  = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS
    );

    const rawBody = await getRawBody(req);
    const sig     = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const obj = event.data.object;

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const userId     = obj.metadata?.userId;
                const customerId = obj.customer;
                const subId      = obj.subscription;
                if (!userId) break;
                await supabase.from('profiles').upsert({
                    id: userId,
                    stripe_customer_id: customerId,
                    subscription_id:    subId,
                    subscription_status: 'active',
                    updated_at: new Date().toISOString()
                });
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const customerId = obj.customer;
                const status     = obj.status === 'active' ? 'active' : 'inactive';
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .maybeSingle();
                if (profile) {
                    await supabase.from('profiles')
                        .update({ subscription_status: status, updated_at: new Date().toISOString() })
                        .eq('id', profile.id);
                }
                break;
            }
        }
    } catch (err) {
        console.error('Webhook handler error:', err.message);
        return res.status(500).json({ error: err.message });
    }

    res.json({ received: true });
};
