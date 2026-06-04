/**
 * Grocery List Module
 * Business logic for grocery list operations
 */

const GroceryList = {
    // Create new empty list
    createList() {
        return {
            id: generateId(),
            title: `Grocery List - ${formatDate(getCurrentDate())}`,
            date: getCurrentDate(),
            items: [],
            growthReflection: {
                preShop: '',
                postShop: '',
                categories: [],
                shoppingMethod: '',
                timeSpent: 0
            },
            totalEstimated: 0,
            totalActual: 0,
            recipes: [],
            shared: false,
            userId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    // Create new item
    createItem(name, quantity, estimatedCost) {
        return {
            id: generateId(),
            name: name,
            quantity: quantity || '1',
            estimatedCost: parseFloat(estimatedCost) || 0,
            actualCost: 0,
            purchased: false,
            growthNote: ''
        };
    },

    // Add item to list
    addItem(list, name, quantity, estimatedCost) {
        const item = this.createItem(name, quantity, estimatedCost);
        list.items.push(item);
        this.recalculateTotals(list);
        return item;
    },

    // Update item
    updateItem(list, itemId, updates) {
        const item = list.items.find(i => i.id === itemId);
        if (item) {
            Object.assign(item, updates);
            this.recalculateTotals(list);
            return true;
        }
        return false;
    },

    // Delete item
    deleteItem(list, itemId) {
        const index = list.items.findIndex(i => i.id === itemId);
        if (index !== -1) {
            list.items.splice(index, 1);
            this.recalculateTotals(list);
            return true;
        }
        return false;
    },

    // Toggle purchased status
    togglePurchased(list, itemId) {
        const item = list.items.find(i => i.id === itemId);
        if (item) {
            item.purchased = !item.purchased;
            if (item.purchased && item.actualCost === 0) {
                item.actualCost = item.estimatedCost;
            }
            this.recalculateTotals(list);
            return true;
        }
        return false;
    },

    // Recalculate totals
    recalculateTotals(list) {
        list.totalEstimated = list.items.reduce((sum, item) => {
            // Extract numeric quantity (e.g., "2" or "2 lbs" -> 2)
            const quantity = parseFloat(item.quantity) || 1;
            const cost = parseFloat(item.estimatedCost) || 0;
            return sum + (quantity * cost);
        }, 0);

        list.totalActual = list.items.reduce((sum, item) => {
            // Extract numeric quantity
            const quantity = parseFloat(item.quantity) || 1;
            const cost = parseFloat(item.actualCost) || 0;
            return sum + (quantity * cost);
        }, 0);

        list.updatedAt = new Date().toISOString();
    },

    // Validate list before saving
    validate(list) {
        const errors = [];

        if (!list.title || list.title.trim() === '') {
            errors.push('Title is required');
        }

        if (!list.date) {
            errors.push('Date is required');
        }

        return errors;
    }
};
