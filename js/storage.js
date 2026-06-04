/**
 * Storage Module
 * Handles all localStorage operations
 */

const Storage = {
    KEYS: {
        LISTS: 'growcerylist_lists',
        RECIPES: 'growcerylist_recipes',
        MEAL_PLANS: 'growcerylist_meal_plans',
        PROFILE: 'growcerylist_profile'
    },

    // Get all lists
    getLists() {
        try {
            const data = localStorage.getItem(this.KEYS.LISTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading lists from storage:', error);
            return [];
        }
    },

    // Save all lists
    saveLists(lists) {
        try {
            localStorage.setItem(this.KEYS.LISTS, JSON.stringify(lists));
            return true;
        } catch (error) {
            console.error('Error saving lists to storage:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please delete some old lists.');
            }
            return false;
        }
    },

    // Get single list by ID
    getList(id) {
        const lists = this.getLists();
        return lists.find(list => list.id === id);
    },

    // Add new list
    addList(list) {
        const lists = this.getLists();
        lists.push(list);
        return this.saveLists(lists);
    },

    // Update existing list
    updateList(id, updates) {
        const lists = this.getLists();
        const index = lists.findIndex(list => list.id === id);

        if (index !== -1) {
            lists[index] = { ...lists[index], ...updates };
            return this.saveLists(lists);
        }

        return false;
    },

    // Delete list
    deleteList(id) {
        const lists = this.getLists();
        const filtered = lists.filter(list => list.id !== id);
        return this.saveLists(filtered);
    },

    // === RECIPE STORAGE ===

    // Get all recipes
    getRecipes() {
        try {
            const data = localStorage.getItem(this.KEYS.RECIPES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading recipes from storage:', error);
            return [];
        }
    },

    // Save all recipes
    saveRecipes(recipes) {
        try {
            localStorage.setItem(this.KEYS.RECIPES, JSON.stringify(recipes));
            return true;
        } catch (error) {
            console.error('Error saving recipes to storage:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please delete some recipes.');
            }
            return false;
        }
    },

    // Get single recipe by ID
    getRecipe(id) {
        const recipes = this.getRecipes();
        return recipes.find(recipe => recipe.id === id);
    },

    // Add new recipe
    addRecipe(recipe) {
        const recipes = this.getRecipes();
        recipes.push(recipe);
        return this.saveRecipes(recipes);
    },

    // Update existing recipe
    updateRecipe(id, updates) {
        const recipes = this.getRecipes();
        const index = recipes.findIndex(recipe => recipe.id === id);

        if (index !== -1) {
            recipes[index] = { ...recipes[index], ...updates };
            return this.saveRecipes(recipes);
        }

        return false;
    },

    // Delete recipe
    deleteRecipe(id) {
        const recipes = this.getRecipes();
        const filtered = recipes.filter(recipe => recipe.id !== id);
        return this.saveRecipes(filtered);
    },

    // === PROFILE STORAGE ===

    getProfile() {
        try {
            const data = localStorage.getItem(this.KEYS.PROFILE);
            return data ? JSON.parse(data) : { displayName: '', tagline: '', growthStatement: '', goals: [] };
        } catch (_) {
            return { displayName: '', tagline: '', growthStatement: '', goals: [] };
        }
    },

    saveProfile(profile) {
        try {
            localStorage.setItem(this.KEYS.PROFILE, JSON.stringify(profile));
            return true;
        } catch (_) {
            return false;
        }
    },

    // === MEAL PLAN STORAGE ===

    getMealPlans() {
        try {
            const data = localStorage.getItem(this.KEYS.MEAL_PLANS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading meal plans from storage:', error);
            return [];
        }
    },

    saveMealPlans(plans) {
        try {
            localStorage.setItem(this.KEYS.MEAL_PLANS, JSON.stringify(plans));
            return true;
        } catch (error) {
            console.error('Error saving meal plans to storage:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please delete some old meal plans.');
            }
            return false;
        }
    },

    getMealPlan(id) {
        return this.getMealPlans().find(plan => plan.id === id);
    },

    addMealPlan(plan) {
        const plans = this.getMealPlans();
        plans.push(plan);
        return this.saveMealPlans(plans);
    },

    updateMealPlan(id, updates) {
        const plans = this.getMealPlans();
        const index = plans.findIndex(p => p.id === id);
        if (index !== -1) {
            plans[index] = { ...plans[index], ...updates };
            return this.saveMealPlans(plans);
        }
        return false;
    },

    deleteMealPlan(id) {
        const plans = this.getMealPlans();
        return this.saveMealPlans(plans.filter(p => p.id !== id));
    },

    // === IMPORT/EXPORT ===

    // Export data (for backup)
    exportData() {
        const data = {
            lists: this.getLists(),
            recipes: this.getRecipes(),
            mealPlans: this.getMealPlans(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    // Import data (from backup)
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            let success = true;

            if (data.lists && Array.isArray(data.lists)) {
                success = this.saveLists(data.lists) && success;
            }

            if (data.recipes && Array.isArray(data.recipes)) {
                success = this.saveRecipes(data.recipes) && success;
            }

            if (data.mealPlans && Array.isArray(data.mealPlans)) {
                success = this.saveMealPlans(data.mealPlans) && success;
            }

            return success;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};
