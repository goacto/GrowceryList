/**
 * Sync Module — cloud read/write via Supabase
 * All operations are no-ops when Auth is not available or user is not subscribed.
 */

const Sync = {

    // ─── Subscription ─────────────────────────────────────────────────────────

    SUBSCRIPTION_KEY: 'growcerylist_subscription',

    getStatus()   { return localStorage.getItem(this.SUBSCRIPTION_KEY) || 'free'; },
    setStatus(s)  { localStorage.setItem(this.SUBSCRIPTION_KEY, s); },
    isActive()    { return this.getStatus() === 'active'; },
    clearStatus() { localStorage.removeItem(this.SUBSCRIPTION_KEY); },

    // ─── Helpers ──────────────────────────────────────────────────────────────

    get db() { return Auth.client; },

    // Merge two arrays by ID, keeping the most recently updated item
    _merge(local, cloud) {
        const map = {};
        [...cloud, ...local].forEach(item => {
            const id  = item.id;
            const ts  = item.updatedAt || item.createdAt || '';
            if (!map[id] || ts > (map[id].updatedAt || map[id].createdAt || '')) {
                map[id] = item;
            }
        });
        return Object.values(map);
    },

    // ─── First-sync: merge cloud + local, push result ─────────────────────────

    async initialSync(userId) {
        App.setSyncStatus('syncing');
        try {
            const [listsRes, recipesRes, plansRes, profileRes] = await Promise.all([
                this.db.from('lists').select('data').eq('user_id', userId),
                this.db.from('recipes').select('data').eq('user_id', userId),
                this.db.from('meal_plans').select('data').eq('user_id', userId),
                this.db.from('profiles').select('*').eq('id', userId).maybeSingle()
            ]);

            const cloudLists   = (listsRes.data   || []).map(r => r.data);
            const cloudRecipes = (recipesRes.data  || []).map(r => r.data);
            const cloudPlans   = (plansRes.data    || []).map(r => r.data);

            const mergedLists   = this._merge(Storage.getLists(),      cloudLists);
            const mergedRecipes = this._merge(Storage.getRecipes(),    cloudRecipes);
            const mergedPlans   = this._merge(Storage.getMealPlans(),  cloudPlans);

            Storage.saveLists(mergedLists);
            Storage.saveRecipes(mergedRecipes);
            Storage.saveMealPlans(mergedPlans);

            if (profileRes.data) {
                const { id, updated_at, subscription_status, stripe_customer_id,
                        subscription_id, ...profileFields } = profileRes.data;
                Storage.saveProfile(profileFields);
                this.setStatus(subscription_status || 'free');
                if (stripe_customer_id) {
                    localStorage.setItem('growcerylist_stripe_customer', stripe_customer_id);
                }
            }

            // Push merged result back to cloud
            await this._pushAll(userId, mergedLists, mergedRecipes, mergedPlans);
            App.setSyncStatus('synced');
            return { subscriptionStatus: this.getStatus() };
        } catch (e) {
            console.error('Sync error:', e);
            App.setSyncStatus('error');
            throw e;
        }
    },

    async _pushAll(userId, lists, recipes, plans) {
        const ts = new Date().toISOString();
        const toRow = (table, items) => items.map(i => ({
            id: i.id, user_id: userId, data: i, updated_at: i.updatedAt || ts
        }));

        await Promise.all([
            lists.length   ? this.db.from('lists').upsert(toRow('lists', lists)) : null,
            recipes.length ? this.db.from('recipes').upsert(toRow('recipes', recipes)) : null,
            plans.length   ? this.db.from('meal_plans').upsert(toRow('meal_plans', plans)) : null
        ].filter(Boolean));
    },

    // ─── Per-item save (called after every save action) ───────────────────────

    async saveList(list, userId) {
        if (!this.db || !this.isActive()) return;
        App.setSyncStatus('syncing');
        await this.db.from('lists').upsert({
            id: list.id, user_id: userId, data: list, updated_at: list.updatedAt || new Date().toISOString()
        });
        App.setSyncStatus('synced');
    },

    async saveRecipe(recipe, userId) {
        if (!this.db || !this.isActive()) return;
        App.setSyncStatus('syncing');
        await this.db.from('recipes').upsert({
            id: recipe.id, user_id: userId, data: recipe, updated_at: recipe.updatedAt || new Date().toISOString()
        });
        App.setSyncStatus('synced');
    },

    async saveMealPlan(plan, userId) {
        if (!this.db || !this.isActive()) return;
        App.setSyncStatus('syncing');
        await this.db.from('meal_plans').upsert({
            id: plan.id, user_id: userId, data: plan, updated_at: plan.updatedAt || new Date().toISOString()
        });
        App.setSyncStatus('synced');
    },

    async deleteList(id, userId) {
        if (!this.db || !this.isActive()) return;
        await this.db.from('lists').delete().eq('id', id).eq('user_id', userId);
    },

    async deleteRecipe(id, userId) {
        if (!this.db || !this.isActive()) return;
        await this.db.from('recipes').delete().eq('id', id).eq('user_id', userId);
    },

    async deleteMealPlan(id, userId) {
        if (!this.db || !this.isActive()) return;
        await this.db.from('meal_plans').delete().eq('id', id).eq('user_id', userId);
    },

    // ─── Stripe checkout ──────────────────────────────────────────────────────

    async createCheckoutSession(userId, email) {
        const res = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, email })
        });
        if (!res.ok) throw new Error('Failed to create checkout session');
        return res.json();
    },

    async openCustomerPortal() {
        const customerId = localStorage.getItem('growcerylist_stripe_customer');
        if (!customerId) { Toast.error('No billing account found.'); return; }
        const res = await fetch('/api/portal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId })
        });
        if (!res.ok) { Toast.error('Could not open billing portal.'); return; }
        const { url } = await res.json();
        window.location.href = url;
    }
};
