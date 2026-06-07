# Changelog

All notable changes to GrowceryList will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Community feed and sharing
- Spending analytics dashboard

---

## [0.7.0] - 2026-06-07

### Added — Promo Codes / Free Trials
- Redeem a promo code in **Settings → Plan** for a time-limited Growth Pro trial (no card required)
- Server-validated via `/api/redeem-promo`; codes stored in Supabase `promo_codes` table
- One redemption per user (tracked in `promo_redemptions`), optional per-code redemption caps
- Trial status surfaced in the account menu ("🎟 Pro Trial — N days left") and auto-reverts to Free on expiry
- New `supabase/promo_codes.sql` migration; seeds `WELCOME7` and `GROW30`

### Added — Google Sign-In
- "Continue with Google" on the auth modal via Supabase OAuth (alongside email/password)
- Shared across Sign In / Sign Up; hidden on the password-reset tab

### Fixed
- Stripe checkout "Not a valid URL" — `APP_URL` now normalized (scheme added, trailing slash/whitespace stripped) in `create-checkout` and `portal`
- Mobile header: nav is a 2×2 grid, controls centered, account dropdown no longer clips off-screen

---

## [0.6.0] - 2026-06-05

### Added — Accounts, Cloud Sync & Subscriptions
- **Auth** (`js/auth.js`, Supabase): email/password sign-up, sign-in, password reset
- **Cloud sync** (`js/sync.js`): last-write-wins merge of lists, recipes, meal plans, and profile on sign-in; per-save and per-delete background sync (Growth Pro only)
- **Stripe billing**: `/api/create-checkout`, `/api/stripe-webhook`, `/api/portal`, `/api/config`
- Account menu (avatar, email, subscription status, upgrade / manage / sign out), sync status badge, upgrade modal
- Infrastructure: `supabase/schema.sql` (RLS-secured), `package.json`, `.env.example`, `SETUP.md`

---

## [0.5.0] - 2026-06-04

### Added — Splash Screen, Multi-Provider AI & Freemium
- Animated splash screen (logo pulse, auto-dismiss)
- **Multi-provider AI (BYOK)**: Anthropic Claude, OpenAI GPT-4o, xAI Grok — per-provider key storage with a visual selector; OpenAI-compatible streaming alongside Anthropic
- Freemium usage model: free-generation counter (5 + 10 bonus) and engagement milestone tracker (profile → first list → shopping session unlocks bonus)

---

## [0.4.0] - 2026-06-04

### Added — Settings Page & AI Growth Features

**Settings Page (4 tabs)**
- **Profile** — display name, tagline, growth statement, default growth goals, initials avatar
- **Features & Benefits** — app overview with feature cards including Pro and Coming Soon badges
- **Plan** — Free vs Growth Pro comparison with full feature matrix and pricing
- **AI Settings** — Anthropic API key input with show/hide toggle, status indicator, privacy note, and link to get a key

**6 AI Features powered by Claude**
- ✨ **AI Build List** (list detail) — describe your week in natural language → AI generates a complete grocery list with growth notes; "Add Items to List" applies it
- ✨ **Optimize Budget** (list detail) — enter a target budget → AI suggests specific swaps and reductions; streaming advisory output
- ✨ **Nutritional Advice** (list detail) — AI maps current list items to your growth categories and surfaces gaps
- ✨ **Growth Insights** (list detail) — AI reflection coach analyzes current list + shopping history and surfaces patterns
- ✨ **AI Recipe** (recipe overview) — enter available ingredients → AI generates a full recipe; "Create Recipe" pre-populates the recipe form for review before saving
- ✨ **Generate Plan with AI** (meal plan detail) — describe weekly goals → AI fills the calendar with your saved recipes; "Apply to Calendar" assigns matched ones

**Architecture**
- New `js/ai.js` — Claude streaming API client + all 6 feature functions, JSON response parser
- `js/storage.js` — profile CRUD (`getProfile`, `saveProfile`)
- All AI calls stream token-by-token with a blinking cursor; apply/discard actions shown on completion
- API key stored only in localStorage, never transmitted to any server

---

## [0.3.0] - 2026-06-04

### Added - Meal Planner & Security

**Meal Planning**
- Weekly meal planner calendar view (Mon–Sun grid)
- Assign recipes to Breakfast, Lunch, and Dinner per day
- Recipe selection modal — choose from your saved recipes
- Remove recipe from a meal slot without losing the plan
- Generate a complete shopping list from the week's recipes in one click
- Week notes field for intentions and reflections
- Save and manage multiple meal plans
- Meal plans included in JSON export/import

**Security**
- Added `escapeHtml()` utility to prevent XSS via user-supplied content
- All `innerHTML` template renders now escape user data (list titles, item names, recipe titles, ingredient names, instructions, tags, growth notes in title attributes)
- Toast messages also escaped

---

## [0.2.0] - 2026-06-04

### Added - Recipe Integration
**Recipe Management**
- Create, edit, and delete recipes with full details
- Add ingredients with quantities, units, and optional flag
- Step-by-step cooking instructions
- Recipe tags for categorization (vegetarian, quick, high-protein, etc.)
- Growth notes per recipe explaining nutritional value
- Recipe metadata: servings, prep time, cook time, description

**Auto-Generate Shopping Lists**
- "Add to Shopping List" button on recipes
- Automatically converts recipe ingredients to grocery items
- Choose which existing list to add to, or create new list
- Maintains ingredient quantities and notes

**Navigation**
- Tab navigation between Lists and Recipes in header
- Seamless switching between grocery lists and recipe views

**Enhanced Cost Calculation**
- Fixed quantity multiplication in cost totals
- Now correctly calculates: quantity × price for each item
- Example: 2 items at $5 each = $10 (previously showed $5)

**Time Tracking**
- Added "Active Time Spent" field to post-shopping reflection
- Track time spent shopping in minutes
- Helps analyze efficiency across shopping methods

### Changed
- Export toast message now says "Export file ready!" instead of "successfully" since user might cancel download
- Improved responsive layout for recipe forms on mobile

### Technical
- New `recipe.js` module with full recipe CRUD operations
- Extended `storage.js` with recipe localStorage methods
- Recipe data now included in export/import functionality
- Recipe-specific CSS styling with grid layouts

---

## [0.1.0] - 2026-06-04

### Added - MVP Release
**Grocery List Management**
- Create, edit, and delete grocery lists with title and date
- Add items with name, quantity, and estimated cost
- Inline editing for item details (click to edit)
- Mark items as purchased with checkboxes
- Automatic cost calculation (estimated and actual totals)
- View all saved lists in grid layout
- Delete individual items or entire lists

**Growth Journey Integration**
- Pre-shopping reflection textarea for intentions and goals
- Post-shopping reflection for insights and learnings
- Individual growth notes for each item (why you chose it)
- Growth category tags (health, energy, family, budget, environment)
- Shopping method tracking (in-store, curbside, delivery)

**Data Management**
- LocalStorage persistence across browser sessions
- Export all data as JSON backup file
- Import data from JSON file
- Automatic data saving

**User Interface**
- Clean, minimal design with custom CSS and green growth theme
- Fully responsive layout (mobile, tablet, desktop)
- Toast notifications for user feedback (success/error messages)
- Modal dialog for growth notes
- Smooth animations and transitions

**Accessibility**
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML structure
- Focus indicators for keyboard users

### Technical
- Vanilla JavaScript (no framework dependencies)
- Modular code architecture (utils, storage, business logic, app)
- CSS custom properties for theming
- Progressive enhancement approach

---

## [0.0.1] - 2026-06-03

### Added
- Initial project structure
- Project documentation:
  - README.md with project overview
  - BACKLOG.md with user-facing feature roadmap
  - CHANGELOG.md for tracking versions
  - TEXTBOOK.md for comprehensive engineering education
- Directory structure for HTML, CSS, and JavaScript files
- Foundation for vanilla web application (no framework dependencies)

### Philosophy
- Connecting nutrition choices to personal growth
- Part of the goacto ecosystem (growing ourselves, contributing to others)
- Educational codebase designed to teach from 101 to principle engineer level

---

## Version History

### Semantic Versioning Guide

**Major.Minor.Patch** (e.g., 1.2.3)

- **Major (1.x.x)**: Breaking changes or fundamental redesigns
- **Minor (x.1.x)**: New features, backwards-compatible
- **Patch (x.x.1)**: Bug fixes, small improvements

### Release Types

- **Alpha (0.0.x)**: Initial development, unstable
- **Beta (0.x.x)**: Feature development, testing
- **Stable (1.x.x)**: Production-ready releases

---

## Upcoming Milestones

### v0.1.0 - MVP Release (Target: TBD)
Core grocery list functionality with growth reflections, local storage, and basic UI.

### v0.2.0 - Recipe Integration (Target: TBD)
Recipe management, meal planning, and automated shopping list generation from recipes.

### v0.3.0 - Community Features (Target: TBD)
User accounts, public feed, social interactions, and sharing capabilities.

### v1.0.0 - Stable Release (Target: TBD)
Full-featured application with community, recipes, analytics, and mobile-responsive design.

---

## How to Read This Changelog

### Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features that will be removed in future versions
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes

### Example Entry

```markdown
## [1.2.3] - 2026-07-15

### Added
- Recipe ingredient auto-suggest feature (#45)
- Weekly meal planner calendar view (#52)

### Fixed
- Cost calculation error with decimal quantities (#48)
- LocalStorage quota exceeded on large datasets (#51)

### Changed
- Improved mobile navigation UX (#49)
- Updated growth reflection prompts for clarity (#50)
```

---

*This changelog is maintained with every release to keep the community informed of progress and changes.*
