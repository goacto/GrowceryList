/**
 * AI Module
 * Claude API client and all 6 AI feature functions.
 * Calls the Anthropic API directly from the browser using a user-supplied key.
 */

const AI = {
    MODEL: 'claude-sonnet-4-6',
    API_URL: 'https://api.anthropic.com/v1/messages',
    KEY_STORAGE: 'growcerylist_api_key',

    getKey()       { return localStorage.getItem(this.KEY_STORAGE) || ''; },
    setKey(key)    { localStorage.setItem(this.KEY_STORAGE, key.trim()); },
    clearKey()     { localStorage.removeItem(this.KEY_STORAGE); },
    isConfigured() { return this.getKey().length > 10; },

    // Base streaming call. onDelta(deltaText, fullTextSoFar), onDone(fullText)
    async stream(system, userMsg, onDelta, onDone) {
        const key = this.getKey();
        if (!key) throw new Error('No API key configured — go to Settings → AI Settings.');

        const res = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-dangerous-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: this.MODEL,
                max_tokens: 2048,
                stream: true,
                system,
                messages: [{ role: 'user', content: userMsg }]
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error ${res.status}`);
        }

        const reader = res.body.getReader();
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
                    if (evt.type === 'content_block_delta' && evt.delta?.text) {
                        full += evt.delta.text;
                        if (onDelta) onDelta(evt.delta.text, full);
                    }
                } catch (_) {}
            }
        }

        if (onDone) onDone(full);
        return full;
    },

    // Parse JSON from AI response, handling markdown code fences
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
            const qty = parseFloat(i.quantity) || 1;
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
        const items = list.items.map(i => i.name).join(', ') || '(no items yet)';
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
