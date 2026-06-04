/**
 * Meal Plan Module
 * Business logic for weekly meal planning
 */

const MealPlan = {
    MEAL_TYPES: ['breakfast', 'lunch', 'dinner'],
    DAY_NAMES: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

    // Get the Monday of the week containing dateStr (YYYY-MM-DD)
    getWeekMonday(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        return d.toISOString().split('T')[0];
    },

    // Create a new meal plan for the week containing weekStart date
    createMealPlan(weekStart) {
        const monday = this.getWeekMonday(weekStart);
        const days = [];
        const startDate = new Date(monday + 'T00:00:00');
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            days.push({
                date: d.toISOString().split('T')[0],
                meals: { breakfast: null, lunch: null, dinner: null }
            });
        }
        return {
            id: generateId(),
            weekStart: monday,
            days,
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    // Assign a recipe to a meal slot (dayIndex 0-6, mealType: breakfast|lunch|dinner)
    assignMeal(plan, dayIndex, mealType, recipeId) {
        if (plan.days[dayIndex] && this.MEAL_TYPES.includes(mealType)) {
            plan.days[dayIndex].meals[mealType] = recipeId;
            plan.updatedAt = new Date().toISOString();
        }
    },

    // Clear a meal slot
    removeMeal(plan, dayIndex, mealType) {
        if (plan.days[dayIndex]) {
            plan.days[dayIndex].meals[mealType] = null;
            plan.updatedAt = new Date().toISOString();
        }
    },

    // Generate combined shopping list items from all assigned recipes
    generateShoppingItems(plan, recipesMap) {
        const items = [];
        plan.days.forEach(day => {
            this.MEAL_TYPES.forEach(mealType => {
                const recipeId = day.meals[mealType];
                if (recipeId && recipesMap[recipeId]) {
                    Recipe.generateShoppingListItems(recipesMap[recipeId]).forEach(item => {
                        items.push(item);
                    });
                }
            });
        });
        return items;
    },

    // Count how many meals are planned this week
    countAssigned(plan) {
        let count = 0;
        plan.days.forEach(day => {
            this.MEAL_TYPES.forEach(type => {
                if (day.meals[type]) count++;
            });
        });
        return count;
    },

    // Format week label (e.g., "Jun 2 – Jun 8, 2026")
    formatWeekLabel(weekStart) {
        const start = new Date(weekStart + 'T00:00:00');
        const end = new Date(weekStart + 'T00:00:00');
        end.setDate(end.getDate() + 6);
        const opts = { month: 'short', day: 'numeric' };
        const startStr = start.toLocaleDateString('en-US', opts);
        const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
        return `${startStr} – ${endStr}`;
    }
};
