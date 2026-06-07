/**
 * POST /api/redeem-promo
 * Body: { userId, code }
 * Validates a promo code and grants a time-limited Growth Pro trial.
 * Returns { success, trialEndsAt, durationDays }.
 */
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { userId, code } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Sign in required.' });
    if (!code)   return res.status(400).json({ error: 'Enter a promo code.' });

    const normalized = String(code).trim().toUpperCase();

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY   // service role bypasses RLS
    );

    try {
        // 1. Look up the code
        const { data: promo } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', normalized)
            .maybeSingle();

        if (!promo || !promo.active) {
            return res.status(404).json({ error: 'Invalid or expired promo code.' });
        }

        // 2. Redemption cap
        if (promo.max_redemptions != null && promo.times_redeemed >= promo.max_redemptions) {
            return res.status(409).json({ error: 'This code has reached its redemption limit.' });
        }

        // 3. One redemption per user
        const { error: redeemErr } = await supabase
            .from('promo_redemptions')
            .insert({ user_id: userId, code: normalized });

        if (redeemErr) {
            // Unique-violation = already redeemed by this user
            if (redeemErr.code === '23505') {
                return res.status(409).json({ error: "You've already used this code." });
            }
            throw redeemErr;
        }

        // 4. Compute trial end and activate Pro
        const trialEndsAt = new Date(Date.now() + promo.duration_days * 86400000).toISOString();
        await supabase.from('profiles').upsert({
            id: userId,
            subscription_status: 'active',
            trial_ends_at: trialEndsAt,
            updated_at: new Date().toISOString()
        });

        // 5. Bump redemption counter
        await supabase
            .from('promo_codes')
            .update({ times_redeemed: promo.times_redeemed + 1 })
            .eq('code', normalized);

        res.json({ success: true, trialEndsAt, durationDays: promo.duration_days });
    } catch (err) {
        console.error('Promo redeem error:', err.message);
        res.status(500).json({ error: 'Could not redeem code. Please try again.' });
    }
};
