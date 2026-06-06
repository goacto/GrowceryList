/**
 * Auth Module — Supabase authentication
 * Gracefully no-ops when Supabase is not configured.
 */

const Auth = {
    client: null,

    // Called from App.init() after config is loaded
    init(supabaseUrl, supabaseAnonKey) {
        if (!supabaseUrl || !supabaseAnonKey) return null;
        try {
            this.client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            // Notify app on every auth state change (sign in, sign out, token refresh)
            this.client.auth.onAuthStateChange((event, session) => {
                App.onAuthStateChange(event, session);
            });
            return this.client;
        } catch (e) {
            console.warn('Supabase init failed:', e.message);
            return null;
        }
    },

    isAvailable() { return !!this.client; },

    async getSession() {
        if (!this.client) return null;
        const { data: { session } } = await this.client.auth.getSession();
        return session;
    },

    async getUser() {
        if (!this.client) return null;
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    },

    async signUp(email, password) {
        if (!this.client) return { error: { message: 'Auth not configured.' } };
        return this.client.auth.signUp({ email, password });
    },

    async signIn(email, password) {
        if (!this.client) return { error: { message: 'Auth not configured.' } };
        return this.client.auth.signInWithPassword({ email, password });
    },

    async signOut() {
        if (!this.client) return;
        return this.client.auth.signOut();
    },

    async resetPassword(email) {
        if (!this.client) return { error: { message: 'Auth not configured.' } };
        return this.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}${window.location.pathname}?reset=true`
        });
    }
};
