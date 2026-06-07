# GrowceryList - Product Backlog

*Last Updated: June 7, 2026 (v0.7.0)*

This backlog tracks all planned features, enhancements, and improvements for GrowceryList. Items are organized by development phase and priority.

## Legend

- 🚀 **Now** - Currently in development
- 📋 **Next** - Planned for next iteration
- 💡 **Future** - Ideas for later consideration
- ✅ **Done** - Completed features

---

## Phase 1: MVP - Core Grocery List Experience

### ✅ Completed (v0.1.0)

**Grocery List Management**
- [x] Create new grocery list with title and date
- [x] Add items to list (name, quantity, estimated cost)
- [x] Edit and delete list items (inline editing with contenteditable)
- [x] Mark items as purchased
- [x] Calculate total list cost automatically
- [x] View all grocery lists (current and past)
- [x] Delete entire grocery lists

**Growth Journey Integration**
- [x] Add "Why I chose this" notes to individual items
- [x] Add overall growth reflection to each list
- [x] Tag lists with growth categories (health, energy, family, budget, environment)
- [x] Post-shopping reflection feature (for in-store, curbside pickup, or delivery)
  - [x] Compare planned vs actual purchases
  - [x] Reflect on impulse decisions
  - [x] Note how the experience supported/hindered growth goals

**Local Storage**
- [x] Save all lists to browser localStorage
- [x] Persist data across browser sessions
- [x] Export lists as JSON for backup
- [x] Import lists from JSON backup

**User Interface**
- [x] Clean, minimal design with custom CSS
- [x] Responsive layout (mobile, tablet, desktop)
- [x] Accessible navigation and forms (ARIA labels, keyboard navigation)
- [x] Visual feedback for actions (toast notifications for save, delete, export, import)

---

## Phase 2: Recipe Integration

### ✅ Completed (v0.2.0)

**Recipe Management**
- [x] Create and save recipes
- [x] Link recipes to grocery lists (Add to Shopping List feature)
- [x] Auto-generate shopping list items from recipe ingredients
- [x] View recipe details (ingredients, instructions, servings)
- [x] Tag recipes with any custom tags (vegetarian, quick, high-protein, etc.)
- [x] Recipe metadata (prep time, cook time, servings, description)
- [x] Edit and delete recipes
- [x] Inline ingredient and instruction management

**Recipe Growth Connection**
- [x] Add growth notes to recipes (why this supports my goals)
- [x] Tag recipes with nutritional focus and meal types
- [x] Full recipe search and organization

### ✅ Completed (v0.3.0)

**Meal Planning**
- [x] Weekly meal planner calendar view
- [x] Assign recipes to breakfast, lunch, and dinner per day
- [x] Generate combined grocery list from weekly meal plan
- [x] Save and manage multiple meal plans
- [x] Week notes for reflections

### 📋 Next (Future Phase)

**Meal Planning Enhancements**
- [ ] Drag-and-drop recipes to days of the week
- [ ] Adjust recipes for serving size/portions before generating list
- [ ] Track how recipes make you feel (energy levels, satisfaction, etc.)
- [ ] Copy plan from previous week

---

## Phase 2.5: Settings & AI (v0.4.0)

### ✅ Completed

**Settings Page**
- [x] Profile tab: display name, tagline, growth statement, default goals, avatar
- [x] Features & Benefits tab: feature cards with Pro/Coming Soon badges
- [x] Plan tab: Free vs Growth Pro comparison table
- [x] AI Settings tab: API key management, status, privacy note

**AI Features (Claude-powered)**
- [x] ✨ AI Build List — natural language → grocery list
- [x] ✨ Optimize Budget — target budget → swap suggestions
- [x] ✨ Nutritional Advice — cart → nutrition gap analysis
- [x] ✨ Growth Insights — reflection coach from shopping history
- [x] ✨ AI Recipe — ingredients → full recipe form
- [x] ✨ Generate Plan with AI — goals → filled meal calendar

---

## Phase 3: Community & Sharing

### ✅ Completed — Accounts, Cloud & Billing (v0.6.0 / v0.7.0)

**Account System**
- [x] Optional user account creation (email/password)
- [x] Secure authentication (Supabase, RLS-secured)
- [x] Google OAuth sign-in
- [x] Password reset
- [x] Profile creation (name, avatar initials, growth journey statement)
- [x] Sync data across devices when logged in (Growth Pro)
- [x] Keep local-only option for privacy-conscious users (free tier, no account needed)

**Monetization**
- [x] Stripe subscriptions — Growth Pro ($6/mo): checkout, webhook, customer portal
- [x] Promo codes / free trials (redeem in Settings → Plan)

### 📋 Next

**Community Feed**
- [ ] Public feed of shared grocery lists and reflections
- [ ] Filter feed by growth categories
- [ ] Search for lists by keywords or items
- [ ] Follow/unfollow other users
- [ ] Personalized feed based on follows

**Social Interaction**
- [ ] Like/appreciate others' lists
- [ ] Comment on lists with encouragement or questions
- [ ] Share your own lists (opt-in per list)
- [ ] Private lists by default with option to make public
- [ ] Report inappropriate content

**Inspiration & Discovery**
- [ ] "Growth Stories" - featured community members
- [ ] "Trending Items" - what growth-minded people are buying
- [ ] Weekly challenges (try new vegetable, cook 5 meals, etc.)
- [ ] Achievement badges for consistency and milestones

---

## Phase 4: Enhanced Experience

### 💡 Future

**Analytics & Insights**
- [ ] Spending trends over time
- [ ] Most purchased items
- [ ] Growth category breakdown (nutrition supporting different goals)
- [ ] Cost optimization suggestions
- [ ] Seasonal eating patterns

**Smart Features**
- [ ] Recurring list templates (save frequent shopping lists)
- [ ] Price tracking for items over time
- [ ] Budget setting and alerts
- [ ] Barcode scanner integration (future mobile app)
- [ ] Receipt photo upload and parsing

**Collaboration**
- [ ] Family/household shared lists
- [ ] Real-time collaborative editing
- [ ] Assign items to family members
- [ ] Family growth goals and reflections

**Integrations**
- [ ] Calendar integration for meal planning
- [ ] Grocery store API integration for pricing
- [ ] Nutrition database API for item details
- [ ] Export to note-taking apps (Notion, Obsidian, etc.)

---

## Phase 5: Growth Ecosystem

### 💡 Future

**Personal Development**
- [ ] Goal setting and tracking dashboard
- [ ] Link grocery choices to specific growth goals
- [ ] Progress visualization (nutrition goals, budget goals, etc.)
- [ ] Reflection prompts and journaling

**Educational Content**
- [ ] Nutrition education resources
- [ ] Mindful eating practices
- [ ] Budget-friendly healthy eating guides
- [ ] Seasonal produce guides

**Community Contributions**
- [ ] User-submitted articles and tips
- [ ] Expert Q&A sessions
- [ ] Monthly growth challenges
- [ ] Goacto ecosystem integration (cross-platform features)

---

## Technical Debt & Improvements

### 📋 Ongoing

**Performance**
- [ ] Optimize localStorage usage for large datasets
- [ ] Implement data pagination for lists
- [ ] Lazy loading for community feed
- [ ] Image optimization for recipes and profiles

**Accessibility**
- [ ] Full keyboard navigation
- [ ] Screen reader optimization
- [ ] High contrast mode
- [ ] WCAG 2.1 Level AA compliance

**Security**
- [x] Input sanitization (escapeHtml applied to all innerHTML renders)
- [x] XSS protection
- [ ] CSRF tokens for authenticated actions
- [ ] Rate limiting for API endpoints

**Developer Experience**
- [ ] Comprehensive test suite
- [ ] CI/CD pipeline
- [ ] Documentation for contributors
- [ ] Code quality tooling (linting, formatting)

---

## How to Contribute Ideas

Have an idea for GrowceryList? We'd love to hear it!

1. Check if your idea is already in this backlog
2. Consider how it supports the core mission: connecting nutrition to growth
3. Submit your idea through [contribution process - to be defined]

Remember: GrowceryList is about mindful, intentional food choices that fuel personal growth. Every feature should support this mission.

---

*This backlog is a living document and will evolve based on user feedback and community needs.*
