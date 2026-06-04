/**
 * Recipe Module
 * Business logic for recipe operations
 */

const Recipe = {
    // Create new empty recipe
    createRecipe() {
        return {
            id: generateId(),
            title: '',
            description: '',
            servings: 4,
            prepTime: 0,  // minutes
            cookTime: 0,  // minutes
            ingredients: [],
            instructions: [],
            growthNote: '',
            tags: [],
            image: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    // Create new ingredient
    createIngredient(name, quantity, unit, optional = false) {
        return {
            id: generateId(),
            name: name,
            quantity: quantity || '',
            unit: unit || '',
            optional: optional
        };
    },

    // Add ingredient to recipe
    addIngredient(recipe, name, quantity, unit, optional) {
        const ingredient = this.createIngredient(name, quantity, unit, optional);
        recipe.ingredients.push(ingredient);
        recipe.updatedAt = new Date().toISOString();
        return ingredient;
    },

    // Update ingredient
    updateIngredient(recipe, ingredientId, updates) {
        const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
        if (ingredient) {
            Object.assign(ingredient, updates);
            recipe.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    },

    // Delete ingredient
    deleteIngredient(recipe, ingredientId) {
        const index = recipe.ingredients.findIndex(i => i.id === ingredientId);
        if (index !== -1) {
            recipe.ingredients.splice(index, 1);
            recipe.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    },

    // Add instruction step
    addInstruction(recipe, text) {
        recipe.instructions.push(text);
        recipe.updatedAt = new Date().toISOString();
    },

    // Update instruction
    updateInstruction(recipe, index, text) {
        if (index >= 0 && index < recipe.instructions.length) {
            recipe.instructions[index] = text;
            recipe.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    },

    // Delete instruction
    deleteInstruction(recipe, index) {
        if (index >= 0 && index < recipe.instructions.length) {
            recipe.instructions.splice(index, 1);
            recipe.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    },

    // Add tag
    addTag(recipe, tag) {
        if (!recipe.tags.includes(tag)) {
            recipe.tags.push(tag);
            recipe.updatedAt = new Date().toISOString();
        }
    },

    // Remove tag
    removeTag(recipe, tag) {
        const index = recipe.tags.indexOf(tag);
        if (index > -1) {
            recipe.tags.splice(index, 1);
            recipe.updatedAt = new Date().toISOString();
        }
    },

    // Generate shopping list items from recipe
    generateShoppingListItems(recipe) {
        return recipe.ingredients.map(ingredient => ({
            name: ingredient.name,
            quantity: `${ingredient.quantity} ${ingredient.unit}`.trim(),
            estimatedCost: 0,
            note: `From recipe: ${recipe.title}${ingredient.optional ? ' (optional)' : ''}`
        }));
    },

    // Validate recipe before saving
    validate(recipe) {
        const errors = [];

        if (!recipe.title || recipe.title.trim() === '') {
            errors.push('Recipe title is required');
        }

        if (recipe.ingredients.length === 0) {
            errors.push('At least one ingredient is required');
        }

        if (recipe.instructions.length === 0) {
            errors.push('At least one instruction step is required');
        }

        return errors;
    }
};
