/**
 * AI Module — multi-provider Claude/GPT/Grok client
 * Supports: Anthropic (Claude), OpenAI (GPT-4o), xAI (Grok)
 * Keys stored per-provider in localStorage. Usage tracked for free tier.
 */

const AI = {

    // ─── Provider Config ─────────────────────────────────────────────────────

    PROVIDERS: {
        anthropic: {
            name: 'Claude',
            subtitle: 'Anthropic',
            url: 'https://api.anthropic.com/v1/messages',
            model: 'claude-sonnet-4-6',
            format: 'anthropic',
            keyHint: 'sk-ant-...',
            docsUrl: 'https://console.anthropic.com/'
        },
        openai: {
            name: 'GPT-4o',
            subtitle: 'OpenAI',
            url: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o',
            format: 'openai',
            keyHint: 'sk-...',
            docsUrl: 'https://platform.openai.com/api-keys'
        },
        xai: {
            name: 'Grok',
            subtitle: 'xAI',
            url: 'https://api.x.ai/v1/chat/completions',
            model: 'grok-beta',
            format: 'openai',     // xAI is OpenAI-compatible
            keyHint: 'xai-...',
            docsUrl: 'https://console.x.ai/'
        }
    },

    // ─── Storage Keys ────────────────────────────────────────────────────────

    STORE: {
        PROVIDER:   'growcerylist_ai_provider',
        KEY_PREFIX: 'growcerylist_api_key_',   // + provider id
        USAGE:      'growcerylist_ai_usage',
        LEGACY_KEY: 'growcerylist_api_key'      // pre-multi-provider key
    },

    FREE_LIMIT:  5,
    BONUS_LIMIT: 10,

    // ─── Provider Management ─────────────────────────────────────────────────

    getProvider()    { return localStorage.getItem(this.STORE.PROVIDER) || 'anthropic'; },
    setProvider(p)   { localStorage.setItem(this.STORE.PROVIDER, p); },

    getKey(provider) {
        const p = provider || this.getProvider();
        return localStorage.getItem(this.STORE.KEY_PREFIX + p) || '';
    },

    setKey(key, provider) {
        const p = provider || this.getProvider();
        localStorage.setItem(this.STORE.KEY_PREFIX + p, key.trim());
    },

    clearKey(provider) {
        const p = provider || this.getProvider();
        localStorage.removeItem(this.STORE.KEY_PREFIX + p);
    },

    hasKey(provider) {
        return this.getKey(provider).length > 8;
    },

    hasAnyKey() {
        return Object.keys(this.PROVIDERS).some(p => this.hasKey(p));
    },

    // Migrate a legacy single-provider key to the per-provider store
    migrate() {
        const legacy = localStorage.getItem(this.STORE.LEGACY_KEY);
        if (legacy && !this.hasKey('anthropic')) {
            this.setKey(legacy, 'anthropic');
        }
        if (legacy) {
            localStorage.removeItem(this.STORE.LEGACY_KEY);
        }
    },

    // ─── Usage Tracking ──────────────────────────────────────────────────────

    getUsage() {
        try {
            const d = localStorage.getItem(this.STORE.USAGE);
            return d ? JSON.parse(d) : { used: 0, bonusUnlocked: false };
        } catch (_) { return { used: 0, bonusUnlocked: false }; }
    },

    saveUsage(u) {
        localStorage.setItem(this.STORE.USAGE, JSON.stringify(u));
    },

    getTotalFree() {
        const u = this.getUsage();
        return this.FREE_LIMIT + (u.bonusUnlocked ? this.BONUS_LIMIT : 0);
    },

    getRemaining() {
        if (this.hasAnyKey()) return Infinity;
        const u = this.getUsage();
        return Math.max(0, this.getTotalFree() - u.used);
    },

    canGenerate() {
        return this.hasAnyKey() || this.getRemaining() > 0;
    },

    recordGeneration() {
        if (this.hasAnyKey()) return;     // BYOK: unlimited, don't count
        const u = this.getUsage();
        u.used = (u.used || 0) + 1;
        this.saveUsage(u);
    },

    // Returns true if bonus was newly unlocked (caller shows toast)
    unlockBonus() {
        const u = this.getUsage();
        if (!u.bonusUnlocked) {
            u.bonusUnlocked = true;
            this.saveUsage(u);
            return true;
        }
        return false;
    },

    // ─── Core Streaming Call ─────────────────────────────────────────────────

    async stream(system, userMsg, onDelta, onDone) {
        const provider = this.getProvider();
        const cfg = this.PROVIDERS[provider];

        // Route: prefer the selected provider's key; fallback to any configured key
        let key = this.getKey(provider);
        let activeProvider = provider;
        if (!key) {
            const fallback = Object.keys(this.PROVIDERS).find(p => this.hasKey(p));
            if (fallback) { key = this.getKey(fallback); activeProvider = fallback; }
        }

        if (!key) {
            throw new Error('No API key configured. Go to Settings → AI Settings.');
        }

        const activeCfg = this.PROVIDERS[activeProvider];
        let headers, body;

        if (activeCfg.format === 'anthropic') {
            headers = {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-dangerous-allow-browser': 'true'
            };
            body = {
                model: activeCfg.model,
                max_tokens: 2048,
                stream: true,
                system,
                messages: [{ role: 'user', content: userMsg }]
            };
        } else {
            // OpenAI-compatible (openai + xai)
            headers = {
                'Authorization': `Bearer ${key}`,
                'content-type': 'application/json'
            };
            body = {
                model: activeCfg.model,
                max_tokens: 2048,
                stream: true,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user',   content: userMsg }
                ]
            };
        }

        const res = await fetch(activeCfg.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error ${res.status}`);
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });

            for (const line of chunk.split('\n')) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;

                try {
                    const evt = JSON.parse(raw);
                    let delta = '';

                    if (activeCfg.format === 'anthropic') {
                        // Anthropic streaming format
                        if (evt.type === 'content_block_delta' && evt.delta?.text) {
                            delta = evt.delta.text;
                        }
                    } else {
                        // OpenAI-compatible streaming format
                        delta = evt.choices?.[0]?.delta?.content || '';
                    }

                    if (delta) {
                        full += delta;
                        if (onDelta) onDelta(delta, full);
                    }
                } catch (_) {}
            }
        }

        if (onDone) onDone(full);
        return full;
    },

    // Parse JSON from AI response, tolerating markdown code fences
    parseJSON(text) {
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        const raw = fenced ? fenced[1].trim() : text.trim();
        return JSON.parse(raw);
    },

    // ─── Feature 1: Smart List Builder ───────────────────────────────────────

    buildShoppingList(description, onDelta, onDone) {
        const system = `You are a grocery shopping assistant for GrowceryList, an app that connects nutrition to personal growth. Always respond with valid JSON only — no explanation, no markdown outside the JSON array.`;
        const user = `Create a grocery list for: "${description}"

Respond with ONLY a JSON array of 10–20 items:
[
  {"name": "item name", "quantity": "2", "estimatedCost": 3.99, "growthNote": "why this supports growth (under 12 words)"},
  ...
]
estimatedCost is per-unit in USD as a number.`;
        return this.stream(system, user, onDelta, onDone);
    },

    // ─── Feature 2: Meal Plan Generator ──────────────────────────────────────

    generateMealPlan(goals, availableRecipes, onDelta, onDone) {
        const recipeList = availableRecipes.length
            ? availableRecipes.map(r => `"${r.title}"`).join(', ')
            : '(no saved recipes — suggest healthy common meals)';
        const system = `You are a meal planning assistant for GrowceryList. Respond with valid JSON only — no explanation.`;
        const user = `My goals for this week: ${goals}

Available saved recipes: ${recipeList}

Fill a 7-day meal plan. Prefer recipes from the available list. Use null for intentionally empty slots. Respond ONLY with this JSON (exactly these keys):
{
  "monday":    {"breakfast": "title or null", "lunch": "title or null", "dinner": "title or null"},
  "tuesday":   {"breakfast": "title or null", "lunch": "title or null", "dinner": "title or null"},
  "wednesday": {"breakfast": "title or null", "lunch": "title or null", "dinner": "title or null"},
  "thursday":  {"breakfast": "title or null", "lunch": "title or null", "dinner": "title or null"},
  "friday":    {"breakfast": "title or null", "lunch": "title or null", "dinner": "title or null"},
  "saturday":  {"breakfast": "title or null", "lunch": "title or null", "dinner": "title or null"},
  "sunday":    {"breakfast": "title or null", "lunch": "title or null", "dinner": "title or null"}
}`;
        return this.stream(system, user, onDelta, onDone);
    },

    // ─── Feature 3: Reflection Coach ─────────────────────────────────────────

    analyzeReflection(currentList, pastLists, onDelta, onDone) {
        const cur = `"${currentList.title}" — ${currentList.items.length} items, ${currentList.items.filter(i => i.purchased).length} purchased
Categories: ${currentList.growthReflection.categories.join(', ') || 'none'}
Intention: ${currentList.growthReflection.preShop || '(none)'}
Reflection: ${currentList.growthReflection.postShop || '(none)'}`;

        const past = pastLists.slice(0, 5).map(l =>
            `- "${l.title}": ${l.items.length} items, categories: ${l.growthReflection.categories.join(', ') || 'none'}`
        ).join('\n') || '(no past lists yet)';

        const system = `You are a personal growth coach inside GrowceryList. You help people see how their shopping habits connect to their growth journey. Be warm, specific, and brief. Use plain text — no markdown.`;
        const user = `Analyze this shopping trip and give growth insights in 3 short paragraphs:
1. What went well
2. Pattern across trips (if visible)
3. One actionable suggestion

CURRENT TRIP:
${cur}

RECENT PAST TRIPS:
${past}`;
        return this.stream(system, user, onDelta, onDone);
    },

    // ─── Feature 4: Recipe from Ingredients ──────────────────────────────────

    generateRecipe(ingredients, onDelta, onDone) {
        const system = `You are a creative recipe developer for GrowceryList. Create healthy, growth-focused recipes. Respond with valid JSON only.`;
        const user = `Create a recipe using some or all of: ${ingredients}

Respond ONLY with this JSON:
{
  "title": "Recipe Name",
  "description": "1–2 sentence description",
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": [
    {"name": "ingredient", "quantity": "1", "unit": "cup", "optional": false}
  ],
  "instructions": ["Step 1.", "Step 2.", "Step 3."],
  "tags": ["healthy", "quick"],
  "growthNote": "Why this recipe supports your growth (1–2 sentences)"
}`;
        return this.stream(system, user, onDelta, onDone);
    },

    // ─── Feature 5: Budget Optimizer ─────────────────────────────────────────

    optimizeBudget(list, targetBudget, onDelta, onDone) {
        const items = list.items.map(i => {
            const qty  = parseFloat(i.quantity) || 1;
            const cost = parseFloat(i.estimatedCost) || 0;
            return `- ${i.name}: qty ${qty} × $${cost.toFixed(2)} = $${(qty * cost).toFixed(2)}`;
        }).join('\n') || '(no items yet)';

        const system = `You are a grocery budget optimizer for GrowceryList. Be specific, practical, and encouraging. Plain text — no markdown headers.`;
        const user = `My grocery list totals $${formatCurrency(list.totalEstimated)}. Target budget: $${parseFloat(targetBudget).toFixed(2)}.

Items:
${items}

Provide:
1. The gap ($${Math.max(0, list.totalEstimated - targetBudget).toFixed(2)} ${list.totalEstimated > targetBudget ? 'over' : 'under'} budget)
2. Three specific swaps or reductions (store brand, smaller size, seasonal substitute)
3. Which single item gives the best growth value per dollar and why`;
        return this.stream(system, user, onDelta, onDone);
    },

    // ─── Feature 6: Nutritional Advisor ──────────────────────────────────────

    nutritionalAdvice(list, growthGoals, onDelta, onDone) {
        const items  = list.items.map(i => i.name).join(', ') || '(no items yet)';
        const system = `You are a nutritional growth advisor inside GrowceryList. Connect grocery choices to personal growth goals. Be specific, educational, and encouraging. This is not medical advice. Plain text — no markdown headers.`;
        const user = `Analyze my grocery list for nutritional alignment with my growth goals.

My growth focus: ${growthGoals.join(', ') || 'general health and growth'}
My items: ${items}

Provide in 3 short paragraphs:
1. What this list does well for my goals
2. Key nutritional gaps given my stated focus
3. Two or three items to consider adding next time`;
        return this.stream(system, user, onDelta, onDone);
    }
};
