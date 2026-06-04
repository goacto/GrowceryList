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
        mealAssignContext: null,
        profile: null,
        currentSettingsTab: 'profile',
        currentView: 'list-overview',
        currentItemForNote: null,
        // pending AI-generated data waiting for user to apply
        pendingAIList: null,
        pendingAIMealPlan: null,
        pendingAIRecipe: null
    },

    // Initialize application
    init() {
        AI.migrate();                        // one-time legacy key migration
        this.loadLists();
        this.loadRecipes();
        this.loadMealPlans();
        this.state.profile = Storage.getProfile();
        this.bindEvents();
        this.render();
        this.initSplash();
    },

    // Dismiss splash after animations complete
    initSplash() {
        const splash = document.getElementById('splash-screen');
        if (!splash) return;
        setTimeout(() => {
            splash.classList.add('splash-hiding');
            setTimeout(() => { splash.hidden = true; }, 520);
        }, 2300);
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
            Storage.addList(this.state.currentList);
            Toast.success('List created successfully!');
        } else {
            Storage.updateList(this.state.currentList.id, this.state.currentList);
            Toast.success('List saved successfully!');
        }

        this.loadLists();
        this.checkEngagementMilestones();
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

        getElement('nav-settings').addEventListener('click', () => {
            this.switchToSettings();
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

        // === SETTINGS EVENTS ===

        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSettingsTab(btn.dataset.tab);
            });
        });

        getElement('save-profile-btn').addEventListener('click', () => {
            this.saveProfile();
        });

        getElement('profile-display-name').addEventListener('input', () => {
            this.updateAvatarPreview();
        });

        // Provider radio selector
        document.querySelectorAll('input[name="ai-provider"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    AI.setProvider(radio.value);
                    this.renderAISettings();
                }
            });
        });

        getElement('ai-key-save').addEventListener('click', () => {
            const key = getElement('ai-api-key-input').value.trim();
            if (!key) { Toast.error('Please enter an API key.'); return; }
            AI.setKey(key);
            this.renderAISettings();
            Toast.success(`${AI.PROVIDERS[AI.getProvider()].name} API key saved!`);
        });

        getElement('ai-key-clear').addEventListener('click', () => {
            const name = AI.PROVIDERS[AI.getProvider()].name;
            if (confirm(`Clear your ${name} API key?`)) {
                AI.clearKey();
                getElement('ai-api-key-input').value = '';
                this.renderAISettings();
                Toast.info(`${name} API key cleared.`);
            }
        });

        getElement('ai-key-toggle').addEventListener('click', (e) => {
            const input = getElement('ai-api-key-input');
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            e.target.textContent = isHidden ? 'Hide' : 'Show';
        });

        // === AI FEATURE EVENTS ===

        // 1. Smart List Builder
        getElement('ai-build-list-btn').addEventListener('click', () => {
            this.toggleAIPanel('ai-list-panel', 'ai-build-list-btn');
        });
        getElement('ai-list-panel-close').addEventListener('click', () => {
            this.hideAIPanel('ai-list-panel');
        });
        getElement('ai-list-submit').addEventListener('click', () => {
            this.runAIBuildList();
        });
        getElement('ai-list-apply').addEventListener('click', () => {
            this.applyAIList();
        });
        getElement('ai-list-discard').addEventListener('click', () => {
            this.hideAIPanel('ai-list-panel');
        });

        // 2. Budget Optimizer
        getElement('ai-budget-btn').addEventListener('click', () => {
            this.toggleAIPanel('ai-budget-panel', 'ai-budget-btn');
        });
        getElement('ai-budget-panel-close').addEventListener('click', () => {
            this.hideAIPanel('ai-budget-panel');
        });
        getElement('ai-budget-submit').addEventListener('click', () => {
            this.runAIBudgetOptimizer();
        });
        getElement('ai-budget-discard').addEventListener('click', () => {
            this.hideAIPanel('ai-budget-panel');
        });

        // 3. Nutritional Advisor
        getElement('ai-nutrition-btn').addEventListener('click', () => {
            this.runAINutritionalAdvice();
        });
        getElement('ai-nutrition-discard').addEventListener('click', () => {
            this.hideAIPanel('ai-nutrition-panel');
        });

        // 4. Reflection Coach
        getElement('ai-reflection-btn').addEventListener('click', () => {
            this.runAIReflectionCoach();
        });
        getElement('ai-reflection-discard').addEventListener('click', () => {
            this.hideAIPanel('ai-reflection-panel');
        });

        // 5. AI Recipe
        getElement('ai-recipe-btn').addEventListener('click', () => {
            this.toggleAIPanel('ai-recipe-panel', 'ai-recipe-btn');
        });
        getElement('ai-recipe-panel-close').addEventListener('click', () => {
            this.hideAIPanel('ai-recipe-panel');
        });
        getElement('ai-recipe-submit').addEventListener('click', () => {
            this.runAIGenerateRecipe();
        });
        getElement('ai-recipe-create').addEventListener('click', () => {
            this.applyAIRecipe();
        });
        getElement('ai-recipe-discard').addEventListener('click', () => {
            this.hideAIPanel('ai-recipe-panel');
        });

        // 6. AI Meal Plan Generator
        getElement('ai-generate-meal-plan-btn').addEventListener('click', () => {
            this.toggleAIPanel('ai-meal-plan-panel', 'ai-generate-meal-plan-btn');
        });
        getElement('ai-meal-plan-panel-close').addEventListener('click', () => {
            this.hideAIPanel('ai-meal-plan-panel');
        });
        getElement('ai-meal-plan-submit').addEventListener('click', () => {
            this.runAIGenerateMealPlan();
        });
        getElement('ai-meal-plan-apply').addEventListener('click', () => {
            this.applyAIMealPlan();
        });
        getElement('ai-meal-plan-discard').addEventListener('click', () => {
            this.hideAIPanel('ai-meal-plan-panel');
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
        } else if (this.state.currentView === 'settings-view') {
            this.renderSettings();
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

    switchToSettings() {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        getElement('nav-settings').classList.add('active');
        this.showView('settings-view');
        this.renderSettings();
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

    // === SETTINGS METHODS ===

    renderSettings() {
        this.renderProfilePanel();
        this.renderAISettings();
    },

    renderProfilePanel() {
        const p = this.state.profile || Storage.getProfile();
        getElement('profile-display-name').value = p.displayName || '';
        getElement('profile-tagline').value = p.tagline || '';
        getElement('profile-growth-statement').value = p.growthStatement || '';
        document.querySelectorAll('.profile-goal').forEach(cb => {
            cb.checked = (p.goals || []).includes(cb.value);
        });
        this.updateAvatarPreview();
    },

    updateAvatarPreview() {
        const name = getElement('profile-display-name').value.trim();
        const initials = name
            ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
            : '?';
        getElement('profile-avatar').textContent = initials;
    },

    saveProfile() {
        const goals = [];
        document.querySelectorAll('.profile-goal:checked').forEach(cb => goals.push(cb.value));
        const profile = {
            displayName: getElement('profile-display-name').value.trim(),
            tagline:     getElement('profile-tagline').value.trim(),
            growthStatement: getElement('profile-growth-statement').value.trim(),
            goals
        };
        Storage.saveProfile(profile);
        this.state.profile = profile;
        Toast.success('Profile saved!');
        this.checkEngagementMilestones();
    },

    switchSettingsTab(tab) {
        this.state.currentSettingsTab = tab;
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            const active = btn.dataset.tab === tab;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active);
        });
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.hidden = !panel.id.endsWith(tab);
        });
        if (tab === 'ai') this.renderAIKeyStatus();
    },

    renderAISettings() {
        const provider   = AI.getProvider();
        const cfg        = AI.PROVIDERS[provider];

        // Sync provider radio cards
        document.querySelectorAll('input[name="ai-provider"]').forEach(radio => {
            const checked = radio.value === provider;
            radio.checked = checked;
            radio.closest('.provider-option').classList.toggle('active', checked);
        });

        // Update "Get a key" link
        const keyLink = getElement('ai-get-key-link');
        if (keyLink) keyLink.href = cfg.docsUrl;

        // Key input: show masked version of existing key or clear
        const keyInput = getElement('ai-api-key-input');
        const savedKey = AI.getKey(provider);
        keyInput.value       = savedKey ? savedKey.slice(0, 16) + '…' : '';
        keyInput.placeholder = cfg.keyHint;
        keyInput.type        = 'password';
        const toggleBtn = getElement('ai-key-toggle');
        if (toggleBtn) toggleBtn.textContent = 'Show';

        // Key status badge
        const statusEl = getElement('ai-key-status');
        if (statusEl) {
            if (AI.hasKey(provider)) {
                statusEl.className = 'ai-key-status configured';
                statusEl.textContent = `✓ ${cfg.name} key configured`;
            } else if (AI.hasAnyKey()) {
                const fallback = Object.keys(AI.PROVIDERS).find(p => AI.hasKey(p));
                statusEl.className = 'ai-key-status configured';
                statusEl.textContent = `✓ Using ${AI.PROVIDERS[fallback].name} key as fallback`;
            } else {
                statusEl.className = 'ai-key-status not-configured';
                statusEl.textContent = `⚠ No key for ${cfg.name} — AI features disabled`;
            }
        }

        // Usage bar
        this.renderAIUsage();

        // Milestones
        this.renderMilestones();
    },

    renderAIKeyStatus() {
        // Alias kept for renderSettings() compatibility
        this.renderAISettings();
    },

    renderAIUsage() {
        const fillEl  = getElement('ai-usage-fill');
        const labelEl = getElement('ai-usage-label');
        if (!fillEl || !labelEl) return;

        if (AI.hasAnyKey()) {
            fillEl.style.width  = '100%';
            fillEl.style.background = 'linear-gradient(90deg, #7c3aed, #4f46e5)';
            labelEl.textContent = 'Unlimited (BYOK active)';
        } else {
            const u     = AI.getUsage();
            const total = AI.getTotalFree();
            const pct   = Math.min(100, Math.round((u.used / total) * 100));
            fillEl.style.width      = pct + '%';
            fillEl.style.background = '';
            labelEl.textContent     = `${u.used} / ${total} used`;
        }
    },

    renderMilestones() {
        const el = getElement('ai-milestone-track');
        if (!el) return;

        if (AI.getUsage().bonusUnlocked) {
            el.innerHTML = `<div class="milestone-unlocked">🎉 Bonus unlocked! +10 free generations earned.</div>`;
            return;
        }

        const profile = Storage.getProfile();
        const lists   = Storage.getLists();
        const milestones = [
            { label: 'Set up your profile',          done: !!profile.displayName },
            { label: 'Create a grocery list',        done: lists.length > 0 },
            { label: 'Complete a shopping session',  done: lists.some(l => (l.growthReflection?.postShop || '').trim().length > 5) }
        ];

        el.innerHTML = `
            <p class="milestone-cta">Complete 3 milestones to unlock <strong>10 bonus free generations</strong>:</p>
            ${milestones.map(m => `
                <div class="milestone-item ${m.done ? 'done' : ''}">
                    <span class="milestone-check">${m.done ? '✓' : '○'}</span>
                    <span>${escapeHtml(m.label)}</span>
                </div>
            `).join('')}
        `;
    },

    checkEngagementMilestones() {
        const profile = Storage.getProfile();
        const lists   = Storage.getLists();
        const m1 = !!profile.displayName;
        const m2 = lists.length > 0;
        const m3 = lists.some(l => (l.growthReflection?.postShop || '').trim().length > 5);

        if (m1 && m2 && m3) {
            const newlyUnlocked = AI.unlockBonus();
            if (newlyUnlocked) {
                Toast.success('🎉 All milestones complete! You\'ve unlocked 10 bonus AI generations.');
            }
        }
    },

    // === AI HELPER METHODS ===

    // Gate: check key configured; free-tier path shows guidance when no key
    requireAIKey() { return this.requireAIGeneration(); },  // legacy alias

    requireAIGeneration() {
        if (AI.hasAnyKey()) return true;
        // No BYOK key — free tier requires backend (coming soon)
        Toast.error('Add your API key in ⚙ Settings → AI Settings to use AI features.');
        return false;
    },

    // Show / hide a named AI panel; hides sibling panels in same view
    toggleAIPanel(panelId, btnId) {
        const panel = getElement(panelId);
        if (!panel) return;
        const isHidden = panel.hidden;
        // Hide all AI panels in the page first
        document.querySelectorAll('.ai-panel').forEach(p => { p.hidden = true; });
        panel.hidden = !isHidden;
    },

    hideAIPanel(panelId) {
        const panel = getElement(panelId);
        if (panel) panel.hidden = true;
    },

    // Stream AI output into a result div; disable/re-enable a submit btn
    async streamToPanel(resultId, actionsId, submitBtnId, streamFn) {
        const resultEl = getElement(resultId);
        const actionsEl = actionsId ? getElement(actionsId) : null;
        const submitBtn = submitBtnId ? getElement(submitBtnId) : null;

        resultEl.textContent = '';
        resultEl.classList.remove('ai-done');
        resultEl.hidden = false;
        if (actionsEl) actionsEl.hidden = true;
        if (submitBtn) submitBtn.disabled = true;

        try {
            await streamFn(
                (delta) => { resultEl.insertAdjacentText('beforeend', delta); },
                (_full) => {
                    AI.recordGeneration();
                    resultEl.classList.add('ai-done');
                    if (actionsEl) actionsEl.hidden = false;
                    if (submitBtn) submitBtn.disabled = false;
                }
            );
        } catch (err) {
            resultEl.classList.add('ai-done');
            resultEl.textContent = `Error: ${err.message}`;
            if (submitBtn) submitBtn.disabled = false;
        }
    },

    // === AI FEATURE 1: Smart List Builder ===
    async runAIBuildList() {
        if (!this.requireAIKey()) return;
        const desc = getElement('ai-list-input').value.trim();
        if (!desc) { Toast.error('Please describe what you need.'); return; }

        this.state.pendingAIList = null;

        await this.streamToPanel('ai-list-result', 'ai-list-actions', 'ai-list-submit', (onDelta, onDone) => {
            return AI.buildShoppingList(desc, onDelta, (full) => {
                try {
                    this.state.pendingAIList = AI.parseJSON(full);
                } catch (_) {
                    this.state.pendingAIList = null;
                    Toast.error('Could not parse AI response. Try again.');
                }
                onDone(full);
            });
        });
    },

    applyAIList() {
        const items = this.state.pendingAIList;
        if (!Array.isArray(items) || !this.state.currentList) return;
        items.forEach(item => {
            GroceryList.addItem(this.state.currentList, item.name, String(item.quantity || '1'), item.estimatedCost || 0);
            const last = this.state.currentList.items[this.state.currentList.items.length - 1];
            last.growthNote = item.growthNote || '';
        });
        this.renderItemsList();
        this.hideAIPanel('ai-list-panel');
        this.state.pendingAIList = null;
        Toast.success(`Added ${items.length} AI-suggested items to your list!`);
    },

    // === AI FEATURE 2: Budget Optimizer ===
    async runAIBudgetOptimizer() {
        if (!this.requireAIKey()) return;
        const target = parseFloat(getElement('ai-budget-target').value);
        if (!target || target <= 0) { Toast.error('Please enter a valid budget.'); return; }
        if (!this.state.currentList) return;

        await this.streamToPanel('ai-budget-result', 'ai-budget-actions', 'ai-budget-submit', (onDelta, onDone) => {
            return AI.optimizeBudget(this.state.currentList, target, onDelta, onDone);
        });
    },

    // === AI FEATURE 3: Nutritional Advisor ===
    async runAINutritionalAdvice() {
        if (!this.requireAIKey()) return;
        if (!this.state.currentList) return;
        const goals = this.state.currentList.growthReflection.categories;
        this.toggleAIPanel('ai-nutrition-panel', null);

        await this.streamToPanel('ai-nutrition-result', null, null, (onDelta, onDone) => {
            return AI.nutritionalAdvice(this.state.currentList, goals, onDelta, onDone);
        });
    },

    // === AI FEATURE 4: Reflection Coach ===
    async runAIReflectionCoach() {
        if (!this.requireAIKey()) return;
        if (!this.state.currentList) return;
        const past = this.state.lists.filter(l => l.id !== this.state.currentList.id);
        this.toggleAIPanel('ai-reflection-panel', null);

        await this.streamToPanel('ai-reflection-result', null, null, (onDelta, onDone) => {
            return AI.analyzeReflection(this.state.currentList, past, onDelta, onDone);
        });
    },

    // === AI FEATURE 5: Recipe from Ingredients ===
    async runAIGenerateRecipe() {
        if (!this.requireAIKey()) return;
        const ingredients = getElement('ai-recipe-input').value.trim();
        if (!ingredients) { Toast.error('Please list some ingredients.'); return; }

        this.state.pendingAIRecipe = null;

        await this.streamToPanel('ai-recipe-result', 'ai-recipe-actions', 'ai-recipe-submit', (onDelta, onDone) => {
            return AI.generateRecipe(ingredients, onDelta, (full) => {
                try {
                    this.state.pendingAIRecipe = AI.parseJSON(full);
                } catch (_) {
                    this.state.pendingAIRecipe = null;
                    Toast.error('Could not parse recipe. Try again.');
                }
                onDone(full);
            });
        });
    },

    applyAIRecipe() {
        const data = this.state.pendingAIRecipe;
        if (!data) return;

        const recipe = Recipe.createRecipe();
        recipe.title       = data.title       || 'AI Recipe';
        recipe.description = data.description || '';
        recipe.servings    = parseInt(data.servings)  || 4;
        recipe.prepTime    = parseInt(data.prepTime)  || 0;
        recipe.cookTime    = parseInt(data.cookTime)  || 0;
        recipe.growthNote  = data.growthNote   || '';
        recipe.tags        = Array.isArray(data.tags) ? data.tags : [];
        recipe.instructions = Array.isArray(data.instructions) ? data.instructions : [];

        (data.ingredients || []).forEach(ing => {
            Recipe.addIngredient(recipe, ing.name, String(ing.quantity || ''), ing.unit || '', ing.optional || false);
        });

        this.state.currentRecipe = recipe;
        this.hideAIPanel('ai-recipe-panel');
        this.state.pendingAIRecipe = null;

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        getElement('nav-recipes').classList.add('active');
        this.showView('recipe-detail');
        this.renderRecipeDetail();
        Toast.success('AI recipe loaded — review and save when ready!');
    },

    // === AI FEATURE 6: Meal Plan Generator ===
    async runAIGenerateMealPlan() {
        if (!this.requireAIKey()) return;
        const goals = getElement('ai-meal-plan-input').value.trim();
        if (!goals) { Toast.error('Please describe your goals for this week.'); return; }

        this.state.pendingAIMealPlan = null;

        await this.streamToPanel('ai-meal-plan-result', 'ai-meal-plan-actions', 'ai-meal-plan-submit', (onDelta, onDone) => {
            return AI.generateMealPlan(goals, this.state.recipes, onDelta, (full) => {
                try {
                    this.state.pendingAIMealPlan = AI.parseJSON(full);
                } catch (_) {
                    this.state.pendingAIMealPlan = null;
                    Toast.error('Could not parse meal plan. Try again.');
                }
                onDone(full);
            });
        });
    },

    applyAIMealPlan() {
        const data = this.state.pendingAIMealPlan;
        const plan = this.state.currentMealPlan;
        if (!data || !plan) return;

        const recipeTitleMap = {};
        this.state.recipes.forEach(r => { recipeTitleMap[r.title.toLowerCase()] = r.id; });

        const dayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        dayKeys.forEach((dayKey, dayIndex) => {
            const dayData = data[dayKey];
            if (!dayData) return;
            MealPlan.MEAL_TYPES.forEach(mealType => {
                const title = dayData[mealType];
                if (!title) return;
                const recipeId = recipeTitleMap[title.toLowerCase()];
                if (recipeId) {
                    MealPlan.assignMeal(plan, dayIndex, mealType, recipeId);
                }
            });
        });

        this.renderMealPlanCalendar();
        this.hideAIPanel('ai-meal-plan-panel');
        this.state.pendingAIMealPlan = null;
        Toast.success('AI meal plan applied! Unmatched suggestions were skipped — add those recipes to use them next time.');
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
