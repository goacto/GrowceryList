/**
 * Main Application
 * Initializes app, handles routing, and coordinates modules
 */

const App = {
    state: {
        lists: [],
        currentList: null,
        recipes: [],
        currentRecipe: null,
        mealPlans: [],
        currentMealPlan: null,
        mealAssignContext: null, // { dayIndex, mealType }
        currentView: 'list-overview',
        currentItemForNote: null
    },

    // Initialize application
    init() {
        this.loadLists();
        this.loadRecipes();
        this.loadMealPlans();
        this.bindEvents();
        this.render();
    },

    // Load lists from storage
    loadLists() {
        this.state.lists = Storage.getLists();
    },

    // Load recipes from storage
    loadRecipes() {
        this.state.recipes = Storage.getRecipes();
    },

    // Load meal plans from storage
    loadMealPlans() {
        this.state.mealPlans = Storage.getMealPlans();
    },

    // Save current list
    saveCurrentList() {
        if (!this.state.currentList) return;

        const errors = GroceryList.validate(this.state.currentList);
        if (errors.length > 0) {
            Toast.error('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }

        // Check if list already exists in storage
        const existingList = Storage.getList(this.state.currentList.id);
        const isNew = !existingList;

        if (isNew) {
            // New list
            Storage.addList(this.state.currentList);
            Toast.success('List created successfully!');
        } else {
            // Update existing
            Storage.updateList(this.state.currentList.id, this.state.currentList);
            Toast.success('List saved successfully!');
        }

        this.loadLists();
        this.showView('list-overview');
        this.render();
    },

    // Bind event listeners
    bindEvents() {
        // Navigation
        getElement('nav-lists').addEventListener('click', () => {
            this.switchToLists();
        });

        getElement('nav-recipes').addEventListener('click', () => {
            this.switchToRecipes();
        });

        getElement('nav-meal-plan').addEventListener('click', () => {
            this.switchToMealPlans();
        });

        // === LIST EVENTS ===

        // New list button
        getElement('new-list-btn').addEventListener('click', () => {
            this.state.currentList = GroceryList.createList();
            this.showView('list-detail');
            this.renderListDetail();
        });

        // Back button
        getElement('back-btn').addEventListener('click', () => {
            this.showView('list-overview');
        });

        // Save list button
        getElement('save-list-btn').addEventListener('click', () => {
            this.saveCurrentList();
        });

        // Delete list button
        getElement('delete-list-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this list?')) {
                Storage.deleteList(this.state.currentList.id);
                this.loadLists();
                this.showView('list-overview');
                this.render();
                Toast.success('List deleted successfully!');
            }
        });

        // Add item button
        getElement('add-item-btn').addEventListener('click', () => {
            this.addItem();
        });

        // Add item on Enter key
        getElement('item-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addItem();
            }
        });

        // List title and date inputs (auto-save)
        getElement('list-title-input').addEventListener('input', debounce((e) => {
            this.state.currentList.title = e.target.value;
        }, 300));

        getElement('list-date-input').addEventListener('change', (e) => {
            this.state.currentList.date = e.target.value;
        });

        // Reflections
        getElement('pre-shop-reflection').addEventListener('input', debounce((e) => {
            this.state.currentList.growthReflection.preShop = e.target.value;
        }, 300));

        getElement('post-shop-reflection').addEventListener('input', debounce((e) => {
            this.state.currentList.growthReflection.postShop = e.target.value;
        }, 300));

        getElement('shopping-method').addEventListener('change', (e) => {
            this.state.currentList.growthReflection.shoppingMethod = e.target.value;
        });

        getElement('time-spent').addEventListener('input', debounce((e) => {
            this.state.currentList.growthReflection.timeSpent = parseInt(e.target.value) || 0;
        }, 300));

        // Growth categories
        document.querySelectorAll('.checkbox-group input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const categories = this.state.currentList.growthReflection.categories;
                if (e.target.checked) {
                    categories.push(e.target.value);
                } else {
                    const index = categories.indexOf(e.target.value);
                    if (index > -1) categories.splice(index, 1);
                }
            });
        });

        // Modal
        getElement('item-modal').querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        getElement('save-item-note').addEventListener('click', () => {
            this.saveItemNote();
        });

        // Export button
        getElement('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Import button
        getElement('import-btn').addEventListener('click', () => {
            getElement('import-file-input').click();
        });

        // Import file input
        getElement('import-file-input').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // === RECIPE EVENTS ===

        // New recipe button
        getElement('new-recipe-btn').addEventListener('click', () => {
            this.state.currentRecipe = Recipe.createRecipe();
            this.showView('recipe-detail');
            this.renderRecipeDetail();
        });

        // Recipe back button
        getElement('recipe-back-btn').addEventListener('click', () => {
            this.showView('recipe-overview');
        });

        // Save recipe button
        getElement('save-recipe-btn').addEventListener('click', () => {
            this.saveCurrentRecipe();
        });

        // Delete recipe button
        getElement('delete-recipe-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this recipe?')) {
                Storage.deleteRecipe(this.state.currentRecipe.id);
                this.loadRecipes();
                this.showView('recipe-overview');
                this.render();
                Toast.success('Recipe deleted successfully!');
            }
        });

        // Recipe inputs
        getElement('recipe-title-input').addEventListener('input', debounce((e) => {
            this.state.currentRecipe.title = e.target.value;
        }, 300));

        getElement('recipe-description').addEventListener('input', debounce((e) => {
            this.state.currentRecipe.description = e.target.value;
        }, 300));

        getElement('recipe-servings').addEventListener('change', (e) => {
            this.state.currentRecipe.servings = parseInt(e.target.value) || 4;
        });

        getElement('recipe-prep-time').addEventListener('input', debounce((e) => {
            this.state.currentRecipe.prepTime = parseInt(e.target.value) || 0;
        }, 300));

        getElement('recipe-cook-time').addEventListener('input', debounce((e) => {
            this.state.currentRecipe.cookTime = parseInt(e.target.value) || 0;
        }, 300));

        getElement('recipe-growth-note').addEventListener('input', debounce((e) => {
            this.state.currentRecipe.growthNote = e.target.value;
        }, 300));

        // Add ingredient
        getElement('add-ingredient-btn').addEventListener('click', () => {
            this.addIngredient();
        });

        // Add instruction
        getElement('add-instruction-btn').addEventListener('click', () => {
            this.addInstruction();
        });

        // Add tag
        getElement('add-tag-btn').addEventListener('click', () => {
            this.addTag();
        });

        getElement('tag-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTag();
            }
        });

        // Add to shopping list
        getElement('add-to-list-btn').addEventListener('click', () => {
            this.addRecipeToShoppingList();
        });

        // === MEAL PLAN EVENTS ===

        getElement('new-meal-plan-btn').addEventListener('click', () => {
            this.state.currentMealPlan = MealPlan.createMealPlan(getCurrentDate());
            this.showView('meal-plan-detail');
            this.renderMealPlanDetail();
        });

        getElement('meal-plan-back-btn').addEventListener('click', () => {
            this.showView('meal-plan-overview');
            this.renderMealPlanOverview();
        });

        getElement('save-meal-plan-btn').addEventListener('click', () => {
            this.saveCurrentMealPlan();
        });

        getElement('delete-meal-plan-btn').addEventListener('click', () => {
            if (confirm('Delete this meal plan?')) {
                Storage.deleteMealPlan(this.state.currentMealPlan.id);
                this.loadMealPlans();
                this.showView('meal-plan-overview');
                this.renderMealPlanOverview();
                Toast.success('Meal plan deleted.');
            }
        });

        getElement('generate-list-from-plan-btn').addEventListener('click', () => {
            this.generateListFromMealPlan();
        });

        getElement('meal-plan-notes').addEventListener('input', debounce((e) => {
            if (this.state.currentMealPlan) {
                this.state.currentMealPlan.notes = e.target.value;
            }
        }, 300));

        // Meal recipe modal
        getElement('meal-recipe-modal-close').addEventListener('click', () => {
            this.closeMealRecipeModal();
        });

        getElement('meal-recipe-none-btn').addEventListener('click', () => {
            const ctx = this.state.mealAssignContext;
            if (ctx) {
                MealPlan.removeMeal(this.state.currentMealPlan, ctx.dayIndex, ctx.mealType);
                this.renderMealPlanCalendar();
            }
            this.closeMealRecipeModal();
        });
    },

    // Add item to current list
    addItem() {
        const name = getElement('item-name').value.trim();
        const quantity = getElement('item-quantity').value.trim();
        const cost = getElement('item-cost').value;

        if (!name) {
            alert('Please enter an item name');
            return;
        }

        GroceryList.addItem(this.state.currentList, name, quantity, cost);

        // Clear form
        getElement('item-name').value = '';
        getElement('item-quantity').value = '';
        getElement('item-cost').value = '';
        getElement('item-name').focus();

        this.renderItemsList();
    },

    // Open modal for item note
    openItemNoteModal(itemId) {
        this.state.currentItemForNote = itemId;
        const item = this.state.currentList.items.find(i => i.id === itemId);
        getElement('item-growth-note').value = item ? item.growthNote : '';
        show(getElement('item-modal'));
    },

    // Save item note
    saveItemNote() {
        const note = getElement('item-growth-note').value;
        const item = this.state.currentList.items.find(i => i.id === this.state.currentItemForNote);
        if (item) {
            item.growthNote = note;
        }
        this.closeModal();
        this.renderItemsList();
    },

    // Close modal
    closeModal() {
        hide(getElement('item-modal'));
        this.state.currentItemForNote = null;
    },

    // Show specific view
    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            hide(view);
        });
        show(getElement(viewName));
        this.state.currentView = viewName;
    },

    // Render entire app
    render() {
        if (this.state.currentView === 'list-overview') {
            this.renderListOverview();
        } else if (this.state.currentView === 'list-detail') {
            this.renderListDetail();
        } else if (this.state.currentView === 'recipe-overview') {
            this.renderRecipeOverview();
        } else if (this.state.currentView === 'recipe-detail') {
            this.renderRecipeDetail();
        } else if (this.state.currentView === 'meal-plan-overview') {
            this.renderMealPlanOverview();
        } else if (this.state.currentView === 'meal-plan-detail') {
            this.renderMealPlanDetail();
        }
    },

    // Render list overview
    renderListOverview() {
        const container = getElement('lists-container');
        const emptyState = getElement('empty-state');

        if (this.state.lists.length === 0) {
            show(emptyState);
            hide(container);
            return;
        }

        hide(emptyState);
        show(container);

        container.innerHTML = this.state.lists.map(list => `
            <div class="list-card" data-id="${list.id}">
                <h3>${escapeHtml(list.title)}</h3>
                <p class="meta">${escapeHtml(formatDate(list.date))} • ${list.items.length} items</p>
                <p class="cost">$${formatCurrency(list.totalEstimated)} estimated</p>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.list-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.state.currentList = Storage.getList(id);
                this.showView('list-detail');
                this.renderListDetail();
            });
        });
    },

    // Render list detail
    renderListDetail() {
        if (!this.state.currentList) return;

        const list = this.state.currentList;

        // Set form values
        getElement('list-title-input').value = list.title;
        getElement('list-date-input').value = list.date;
        getElement('pre-shop-reflection').value = list.growthReflection.preShop;
        getElement('post-shop-reflection').value = list.growthReflection.postShop;
        getElement('shopping-method').value = list.growthReflection.shoppingMethod;
        getElement('time-spent').value = list.growthReflection.timeSpent || '';

        // Set growth categories
        document.querySelectorAll('.checkbox-group input').forEach(checkbox => {
            checkbox.checked = list.growthReflection.categories.includes(checkbox.value);
        });

        this.renderItemsList();
    },

    // Render items list
    renderItemsList() {
        const list = this.state.currentList;
        const container = getElement('items-list');

        if (list.items.length === 0) {
            container.innerHTML = '<li class="empty-state">No items yet. Add one above!</li>';
            getElement('estimated-total').textContent = '0.00';
            getElement('actual-total').textContent = '0.00';
            return;
        }

        container.innerHTML = list.items.map(item => `
            <li class="item ${item.purchased ? 'purchased' : ''}" data-id="${item.id}">
                <input type="checkbox" ${item.purchased ? 'checked' : ''} class="item-checkbox">
                <span class="item-name editable" contenteditable="true" data-field="name">${escapeHtml(item.name)}</span>
                <span class="item-quantity editable" contenteditable="true" data-field="quantity">${escapeHtml(item.quantity)}</span>
                <span class="item-cost editable" contenteditable="true" data-field="estimatedCost">$${formatCurrency(item.estimatedCost)}</span>
                <span class="item-note-icon" title="${escapeHtml(item.growthNote || 'Add growth note')}">📝</span>
                <span class="item-delete">✕</span>
            </li>
        `).join('');

        // Update totals
        getElement('estimated-total').textContent = formatCurrency(list.totalEstimated);
        getElement('actual-total').textContent = formatCurrency(list.totalActual);

        // Add event handlers
        container.querySelectorAll('.item').forEach(itemEl => {
            const itemId = itemEl.dataset.id;

            // Checkbox
            itemEl.querySelector('.item-checkbox').addEventListener('change', () => {
                GroceryList.togglePurchased(list, itemId);
                this.renderItemsList();
            });

            // Inline editing
            itemEl.querySelectorAll('.editable').forEach(editableEl => {
                const field = editableEl.dataset.field;

                editableEl.addEventListener('blur', () => {
                    let value = editableEl.textContent.trim();

                    // Clean up cost field
                    if (field === 'estimatedCost') {
                        value = value.replace('$', '');
                        value = parseFloat(value) || 0;
                    }

                    const updates = {};
                    updates[field] = value;
                    GroceryList.updateItem(list, itemId, updates);
                    this.renderItemsList();
                });

                editableEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        editableEl.blur();
                    }
                });
            });

            // Note icon
            itemEl.querySelector('.item-note-icon').addEventListener('click', () => {
                this.openItemNoteModal(itemId);
            });

            // Delete
            itemEl.querySelector('.item-delete').addEventListener('click', () => {
                if (confirm('Delete this item?')) {
                    GroceryList.deleteItem(list, itemId);
                    this.renderItemsList();
                }
            });
        });
    },

    // Export data
    exportData() {
        try {
            const data = Storage.exportData();
            const filename = `growcerylist-backup-${getCurrentDate()}.json`;
            downloadJSON(data, filename);
            Toast.info('Export file ready! Check your downloads.');
        } catch (error) {
            console.error('Export error:', error);
            Toast.error('Failed to prepare export file');
        }
    },

    // Import data
    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = Storage.importData(e.target.result);
                if (result) {
                    this.loadLists();
                    this.loadRecipes();
                    this.render();
                    Toast.success('Data imported successfully!');
                } else {
                    Toast.error('Invalid data format');
                }
            } catch (error) {
                console.error('Import error:', error);
                Toast.error('Failed to import data');
            }
            // Reset file input
            getElement('import-file-input').value = '';
        };
        reader.readAsText(file);
    },

    // === NAVIGATION ===

    switchToLists() {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        getElement('nav-lists').classList.add('active');
        this.showView('list-overview');
    },

    switchToRecipes() {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        getElement('nav-recipes').classList.add('active');
        this.showView('recipe-overview');
    },

    switchToMealPlans() {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        getElement('nav-meal-plan').classList.add('active');
        this.loadMealPlans();
        this.showView('meal-plan-overview');
        this.renderMealPlanOverview();
    },

    // === RECIPE METHODS ===

    saveCurrentRecipe() {
        if (!this.state.currentRecipe) return;

        const errors = Recipe.validate(this.state.currentRecipe);
        if (errors.length > 0) {
            Toast.error('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }

        // Check if recipe already exists in storage
        const existingRecipe = Storage.getRecipe(this.state.currentRecipe.id);
        const isNew = !existingRecipe;

        if (isNew) {
            Storage.addRecipe(this.state.currentRecipe);
            Toast.success('Recipe created successfully!');
        } else {
            Storage.updateRecipe(this.state.currentRecipe.id, this.state.currentRecipe);
            Toast.success('Recipe saved successfully!');
        }

        this.loadRecipes();
        this.showView('recipe-overview');
        this.render();
    },

    addIngredient() {
        const name = getElement('ingredient-name').value.trim();
        const quantity = getElement('ingredient-quantity').value.trim();
        const unit = getElement('ingredient-unit').value.trim();
        const optional = getElement('ingredient-optional').checked;

        if (!name) {
            Toast.error('Please enter an ingredient name');
            return;
        }

        Recipe.addIngredient(this.state.currentRecipe, name, quantity, unit, optional);

        // Clear form
        getElement('ingredient-name').value = '';
        getElement('ingredient-quantity').value = '';
        getElement('ingredient-unit').value = '';
        getElement('ingredient-optional').checked = false;
        getElement('ingredient-name').focus();

        this.renderIngredientsList();
    },

    addInstruction() {
        const text = getElement('instruction-text').value.trim();

        if (!text) {
            Toast.error('Please enter an instruction');
            return;
        }

        Recipe.addInstruction(this.state.currentRecipe, text);
        getElement('instruction-text').value = '';
        getElement('instruction-text').focus();

        this.renderInstructionsList();
    },

    addTag() {
        const tag = getElement('tag-input').value.trim().toLowerCase();

        if (!tag) {
            return;
        }

        Recipe.addTag(this.state.currentRecipe, tag);
        getElement('tag-input').value = '';
        this.renderTags();
    },

    addRecipeToShoppingList() {
        if (!this.state.currentRecipe) return;

        // Get or create a new grocery list
        let targetList;

        if (this.state.lists.length > 0) {
            // Ask which list to add to
            const listNames = this.state.lists.map((list, index) => `${index + 1}. ${list.title}`).join('\n');
            const choice = prompt(`Add ingredients to which list?\n\n${listNames}\n\nEnter number (or 0 for new list):`);

            if (choice === null) return; // Cancelled

            const index = parseInt(choice) - 1;
            if (index >= 0 && index < this.state.lists.length) {
                targetList = this.state.lists[index];
            } else {
                targetList = GroceryList.createList();
                targetList.title = `${this.state.currentRecipe.title} - ${formatDate(getCurrentDate())}`;
                Storage.addList(targetList);
            }
        } else {
            targetList = GroceryList.createList();
            targetList.title = `${this.state.currentRecipe.title} - ${formatDate(getCurrentDate())}`;
            Storage.addList(targetList);
        }

        // Add ingredients to list
        const items = Recipe.generateShoppingListItems(this.state.currentRecipe);
        items.forEach(itemData => {
            GroceryList.addItem(targetList, itemData.name, itemData.quantity, itemData.estimatedCost);
            const lastItem = targetList.items[targetList.items.length - 1];
            lastItem.growthNote = itemData.note;
        });

        Storage.updateList(targetList.id, targetList);
        this.loadLists();

        Toast.success(`Added ${items.length} ingredients to "${targetList.title}"!`);
    },

    renderRecipeOverview() {
        const container = getElement('recipes-container');
        const emptyState = getElement('recipes-empty-state');

        if (this.state.recipes.length === 0) {
            show(emptyState);
            hide(container);
            return;
        }

        hide(emptyState);
        show(container);

        container.innerHTML = this.state.recipes.map(recipe => {
            const totalTime = recipe.prepTime + recipe.cookTime;
            return `
                <div class="list-card" data-id="${recipe.id}">
                    <h3>${escapeHtml(recipe.title)}</h3>
                    <p class="meta">${recipe.servings} servings • ${totalTime} min</p>
                    <p class="cost">${recipe.ingredients.length} ingredients</p>
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.list-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                this.state.currentRecipe = Storage.getRecipe(id);
                this.showView('recipe-detail');
                this.renderRecipeDetail();
            });
        });
    },

    renderRecipeDetail() {
        if (!this.state.currentRecipe) return;

        const recipe = this.state.currentRecipe;

        // Set form values
        getElement('recipe-title-input').value = recipe.title;
        getElement('recipe-description').value = recipe.description;
        getElement('recipe-servings').value = recipe.servings;
        getElement('recipe-prep-time').value = recipe.prepTime || '';
        getElement('recipe-cook-time').value = recipe.cookTime || '';
        getElement('recipe-growth-note').value = recipe.growthNote;

        this.renderIngredientsList();
        this.renderInstructionsList();
        this.renderTags();
    },

    renderIngredientsList() {
        const recipe = this.state.currentRecipe;
        const container = getElement('ingredients-list');

        if (recipe.ingredients.length === 0) {
            container.innerHTML = '<li class="empty-state">No ingredients yet. Add one above!</li>';
            return;
        }

        container.innerHTML = recipe.ingredients.map(ingredient => `
            <li class="ingredient-item ${ingredient.optional ? 'optional' : ''}" data-id="${ingredient.id}">
                <span class="ingredient-name">${escapeHtml(ingredient.name)}</span>
                <span class="ingredient-quantity">${escapeHtml(ingredient.quantity)}</span>
                <span class="ingredient-unit">${escapeHtml(ingredient.unit)}</span>
                <span class="ingredient-optional-label">${ingredient.optional ? '(optional)' : ''}</span>
                <span class="ingredient-delete">✕</span>
            </li>
        `).join('');

        // Add delete handlers
        container.querySelectorAll('.ingredient-item').forEach(itemEl => {
            const id = itemEl.dataset.id;
            itemEl.querySelector('.ingredient-delete').addEventListener('click', () => {
                if (confirm('Delete this ingredient?')) {
                    Recipe.deleteIngredient(recipe, id);
                    this.renderIngredientsList();
                }
            });
        });
    },

    renderInstructionsList() {
        const recipe = this.state.currentRecipe;
        const container = getElement('instructions-list');

        if (recipe.instructions.length === 0) {
            container.innerHTML = '<li class="empty-state">No instructions yet. Add a step above!</li>';
            return;
        }

        container.innerHTML = recipe.instructions.map((instruction, index) => `
            <li class="instruction-item">
                <span class="instruction-text">${escapeHtml(instruction)}</span>
                <span class="instruction-delete" data-index="${index}">✕</span>
            </li>
        `).join('');

        // Add delete handlers
        container.querySelectorAll('.instruction-delete').forEach(deleteBtn => {
            const index = parseInt(deleteBtn.dataset.index);
            deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this step?')) {
                    Recipe.deleteInstruction(recipe, index);
                    this.renderInstructionsList();
                }
            });
        });
    },

    renderTags() {
        const recipe = this.state.currentRecipe;
        const container = getElement('tags-container');

        if (recipe.tags.length === 0) {
            container.innerHTML = '<p class="empty-state" style="padding: 10px;">No tags yet</p>';
            return;
        }

        container.innerHTML = recipe.tags.map((tag, index) => `
            <span class="tag">
                ${escapeHtml(tag)}
                <span class="tag-remove" data-index="${index}">✕</span>
            </span>
        `).join('');

        // Add remove handlers
        container.querySelectorAll('.tag-remove').forEach(removeBtn => {
            const index = parseInt(removeBtn.dataset.index);
            removeBtn.addEventListener('click', () => {
                Recipe.removeTag(recipe, recipe.tags[index]);
                this.renderTags();
            });
        });
    },

    // === MEAL PLAN METHODS ===

    renderMealPlanOverview() {
        const container = getElement('meal-plans-container');
        const emptyState = getElement('meal-plans-empty-state');

        if (this.state.mealPlans.length === 0) {
            show(emptyState);
            hide(container);
            return;
        }

        hide(emptyState);
        show(container);

        container.innerHTML = this.state.mealPlans
            .slice()
            .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
            .map(plan => {
                const count = MealPlan.countAssigned(plan);
                return `
                    <div class="list-card" data-id="${plan.id}">
                        <h3>Week of ${escapeHtml(MealPlan.formatWeekLabel(plan.weekStart))}</h3>
                        <p class="meta">${count} meal${count !== 1 ? 's' : ''} planned</p>
                    </div>
                `;
            }).join('');

        container.querySelectorAll('.list-card').forEach(card => {
            card.addEventListener('click', () => {
                this.state.currentMealPlan = Storage.getMealPlan(card.dataset.id);
                this.showView('meal-plan-detail');
                this.renderMealPlanDetail();
            });
        });
    },

    renderMealPlanDetail() {
        if (!this.state.currentMealPlan) return;
        const plan = this.state.currentMealPlan;
        getElement('meal-plan-week-label').textContent = 'Week of ' + MealPlan.formatWeekLabel(plan.weekStart);
        getElement('meal-plan-notes').value = plan.notes || '';
        this.renderMealPlanCalendar();
    },

    renderMealPlanCalendar() {
        const plan = this.state.currentMealPlan;
        const container = getElement('meal-plan-calendar');
        const recipesMap = {};
        this.state.recipes.forEach(r => { recipesMap[r.id] = r; });

        // Header row: blank label cell + 7 day cells
        const headerCells = plan.days.map((day, i) => {
            const date = new Date(day.date + 'T00:00:00');
            const dayName = MealPlan.DAY_NAMES[i].substring(0, 3);
            const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `
                <div class="meal-plan-header-cell">
                    <span class="day-name">${dayName}</span>
                    <span class="day-date">${escapeHtml(dateLabel)}</span>
                </div>`;
        }).join('');

        // Meal rows
        const mealRows = MealPlan.MEAL_TYPES.map(mealType => {
            const slotCells = plan.days.map((day, dayIndex) => {
                const recipeId = day.meals[mealType];
                if (recipeId && recipesMap[recipeId]) {
                    const name = recipesMap[recipeId].title;
                    return `
                        <div class="meal-slot meal-slot-assigned" data-day="${dayIndex}" data-meal="${mealType}">
                            <span class="meal-slot-recipe-name">${escapeHtml(name)}</span>
                            <button class="meal-slot-remove" data-day="${dayIndex}" data-meal="${mealType}" aria-label="Remove recipe from ${mealType}">✕ remove</button>
                        </div>`;
                }
                return `
                    <div class="meal-slot meal-slot-empty" data-day="${dayIndex}" data-meal="${mealType}">
                        <button class="meal-slot-add-btn" data-day="${dayIndex}" data-meal="${mealType}" aria-label="Add recipe for ${MealPlan.DAY_NAMES[dayIndex]} ${mealType}">+</button>
                    </div>`;
            }).join('');

            return `
                <div class="meal-plan-label-cell">${mealType}</div>
                ${slotCells}`;
        }).join('');

        container.innerHTML = `
            <div class="meal-plan-grid">
                <div class="meal-plan-header-cell"></div>
                ${headerCells}
                ${mealRows}
            </div>`;

        // Add slot event handlers
        container.querySelectorAll('.meal-slot-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openMealRecipeModal(parseInt(btn.dataset.day), btn.dataset.meal);
            });
        });

        container.querySelectorAll('.meal-slot-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                MealPlan.removeMeal(this.state.currentMealPlan, parseInt(btn.dataset.day), btn.dataset.meal);
                this.renderMealPlanCalendar();
            });
        });
    },

    openMealRecipeModal(dayIndex, mealType) {
        this.state.mealAssignContext = { dayIndex, mealType };
        const dayName = MealPlan.DAY_NAMES[dayIndex];
        getElement('meal-recipe-slot-label').textContent = `${dayName} – ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

        const list = getElement('meal-recipe-list');
        if (this.state.recipes.length === 0) {
            list.innerHTML = '<li class="empty-state">No recipes yet — create some in the Recipes tab first.</li>';
        } else {
            list.innerHTML = this.state.recipes.map((recipe, index) => `
                <li data-index="${index}">${escapeHtml(recipe.title)}</li>
            `).join('');

            list.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', () => {
                    const recipe = this.state.recipes[parseInt(li.dataset.index)];
                    const ctx = this.state.mealAssignContext;
                    MealPlan.assignMeal(this.state.currentMealPlan, ctx.dayIndex, ctx.mealType, recipe.id);
                    this.renderMealPlanCalendar();
                    this.closeMealRecipeModal();
                });
            });
        }

        show(getElement('meal-recipe-modal'));
    },

    closeMealRecipeModal() {
        hide(getElement('meal-recipe-modal'));
        this.state.mealAssignContext = null;
    },

    saveCurrentMealPlan() {
        if (!this.state.currentMealPlan) return;
        const plan = this.state.currentMealPlan;
        const existing = Storage.getMealPlan(plan.id);

        if (!existing) {
            Storage.addMealPlan(plan);
            Toast.success('Meal plan created!');
        } else {
            Storage.updateMealPlan(plan.id, plan);
            Toast.success('Meal plan saved!');
        }

        this.loadMealPlans();
        this.showView('meal-plan-overview');
        this.renderMealPlanOverview();
    },

    generateListFromMealPlan() {
        const plan = this.state.currentMealPlan;
        if (!plan) return;

        const recipesMap = {};
        this.state.recipes.forEach(r => { recipesMap[r.id] = r; });

        const items = MealPlan.generateShoppingItems(plan, recipesMap);
        if (items.length === 0) {
            Toast.error('No recipes planned yet — add some meals to the calendar first.');
            return;
        }

        const weekLabel = MealPlan.formatWeekLabel(plan.weekStart);
        const newList = GroceryList.createList();
        newList.title = `Meal Plan: ${weekLabel}`;

        items.forEach(itemData => {
            GroceryList.addItem(newList, itemData.name, itemData.quantity, itemData.estimatedCost);
            const last = newList.items[newList.items.length - 1];
            last.growthNote = itemData.note;
        });

        Storage.addList(newList);
        this.loadLists();

        Toast.success(`Created shopping list with ${items.length} items from your meal plan!`);

        // Switch to the new list
        this.state.currentList = newList;
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        getElement('nav-lists').classList.add('active');
        this.showView('list-detail');
        this.renderListDetail();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
