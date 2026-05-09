# TapCup — Product Roadmap

**Status:** First UI live, Base44 integrated, local dev environment running.  
**Stack:** React 18 + Vite + Base44 + Tailwind + Radix UI  
**Goal:** Ship a polished NFC-first coffee experience backed by physical keychains.

---

## Where We Are Now

- [x] Consumer profile creation and identification (NFC ID + phone)
- [x] Coffee preference CRUD with visual cup editor (SVG, drag layers)
- [x] Vessel types (Mug / Glass / TA), milk, sugar, temp, espresso dose
- [x] Default preference selection
- [x] Order history list
- [x] Shop: customer lookup + order logging
- [x] Admin: consumer/shop management, staff access
- [x] Per-shop username/password auth
- [x] Keychain sales landing page (`/keychains`)
- [x] Chip assignment logic + audit log (`chip-assignment.js`)
- [x] `ProfileChipSetup` component (admin/shop only — not consumer-facing)
- [x] Simulator test suite (Playwright)
- [x] Systemd local preview + Caddy reverse proxy

---

## Phase 1 — NFC Chip Flow (Full Loop)

> The chip is the product. The full purchase-to-first-tap flow does not exist yet.  
> Chips are programmed exclusively by the shop using their NFC writer app/reader.  
> The shop generates the ID, writes the URL to the chip, and assigns it to a consumer profile.  
> `ProfileChipSetup` and `chip-assignment.js` have the assignment logic — the shop chip management UI and consumer chip status view are missing.

### 1.1 Shop — Chip Management Panel
- Dedicated section in the shop view for chip operations
- Generate a new unique `personal_id` (one tap)
- Display the canonical URL to write to the chip via the shop's NFC writer
- Assign the programmed chip to an existing consumer profile (search by name/phone)
- Or: assign to a new profile created on the spot
- Handle chip conflict (chip already assigned) with reassignment confirmation
- `ProfileChipSetup` must work in simulator mode (currently returns `null`)

### 1.2 Post-Purchase Onboarding (Consumer-Facing)
- `/keychains` → Stripe checkout → success page
- Instructs buyer to bring the keychain to a participating shop for chip programming
- Shows nearby shops (or contact info) so they know where to go
- Consumer taps the programmed chip → app opens → profile loads → ready

### 1.3 Consumer — Chip Status in Profile
- Show chip status on the profile header: **Linked / Unlinked**
- If linked: display masked chip ID and "Request Replacement" option
- Replacement flow: consumer requests via app → shop re-programs a new chip and reassigns
- Consumer cannot program or reassign chips themselves

---

## Phase 2 — Preference UI/UX Overhaul

> This is the core consumer action. It must feel fast, visual, and intuitive on mobile.

### 2.1 Preference Card — Visual Cup Preview
- Each `PreferenceCard` renders a live mini SVG cup showing actual layer proportions
- Layer colors match the full editor (foam / milk / water / coffee)
- Barista reads the drink without reading text

### 2.2 Preference Form — Mobile-First Step Flow
- **Current:** Full-screen modal, single long form. `PreferenceForm.jsx` is 25KB.
- **Goal:** Step-by-step, one decision per screen, thumb-friendly.
  - Step 1: Pick vessel + size (visual grid)
  - Step 2: Adjust layers with drag editor
  - Step 3: Milk, sugar, temperature (large tap targets)
  - Step 4: Name + notes + save
- Progress indicator, back/forward navigation
- Auto-save draft on close

### 2.3 Preference Card — Quick Actions
- Swipe left → delete (with confirm)
- Swipe right → set as default
- Long press → quick edit overlay
- Tap → expand details before opening editor

### 2.4 Preference List — Reorder + Duplicate
- Drag-to-reorder saved preferences
- One-tap duplicate ("same as usual but iced")
- Soft limit: 5 preferences, with clear UI feedback at limit

### 2.5 Empty State — First-Run Onboarding
- Animated coffee cup illustration
- Single clear CTA: "Create My First Order"
- Editor opens pre-filled with sensible defaults

### 2.6 Share My Order
- Consumer generates a QR code or short link for their default preference
- Shows visual cup + text summary
- Useful when visiting a shop without TapCup

---

## Phase 3 — Consumer Profile Polish

### 3.1 Profile Header
- Avatar (initials-based, colored by NFC ID hash)
- Editable display name inline
- Phone with edit + confirm flow
- Chip status badge (Linked / Unlinked)

### 3.2 Order History — Richer View
- Mini cup visual per order
- Shop name on each entry
- Filter by shop or date range
- "Reorder" — opens preference editor pre-filled with that order's snapshot
- Total orders count + favourite drink stat

---

## Phase 4 — Admin & Operations

### 4.1 Statistics Dashboard
- Total consumers, active last 30 days
- Orders per shop (chart)
- Most popular preferences (aggregate, anonymised)
- Keychain sales count

### 4.2 Shop Management Polish
- Shop list with status (active / inactive)
- Inline staff credential reset
- Audit log viewer

---

## Phase 5 — Shop Experience Upgrade

> The shop view needs a visual-first barista experience, per PRD.

### 5.1 Barista View — Visual Cup First
- Large full-width SVG cup (180×340px) showing the default preference layers
- Shots badge, milk type, temperature overlaid on cup
- One-tap switch between customer's saved preferences (horizontal scroll cards)
- "Log Order" button prominent and always visible

### 5.2 Quick Customer Lookup
- NFC tap auto-routes to shop view with customer loaded
- Manual search: phone or NFC ID with instant results
- Recent customers list (last 5, cached locally)

### 5.3 Order Confirmation Flow
- After "Log Order" → confirmation toast with mini cup preview
- Optional note (e.g., "extra hot today")
- Undo within 10 seconds

---

## Phase 7 — Growth & Loyalty

### 7.1 Loyalty Tracking
- Order count per shop
- Milestone badges (10th coffee, 50th coffee)
- Optional: shop-defined stamp-card rule

### 7.2 Notifications
- Email confirmation on keychain purchase with chip ID + setup link
- "Your usual is ready" — shop triggers push notification after logging an order
- Order history digest (weekly summary)
- Push requires PWA manifest + service worker

### 7.3 Multi-Profile Keychains
- One account, multiple keychains (e.g., couple sharing one account)
- Each chip maps to its own preference set

---

## Immediate Next Sprint

| # | Feature | Phase | Effort |
|---|---------|-------|--------|
| 1 | Shop chip management panel (generate ID, assign to profile) | 1 | Large |
| 2 | Post-purchase onboarding page (bring to shop) | 1 | Medium |
| 3 | Consumer chip status in profile header | 1 | Small |
| 5 | Preference card mini cup preview | 2 | Small |
| 6 | Preference form step-by-step redesign | 2 | Large |
| 7 | Empty state onboarding moment | 2 | Small |

---

## Technical Debt to Address

- `PreferenceForm.jsx` (25KB) — split into step components
- `CoffeeCupEditor.jsx` (22KB) — extract SVG cup as a pure presentational component, reused in cards + shop view
- `ProfileChipSetup` returns `null` in simulator mode — must be testable locally for Phase 1 work
- No loading skeletons — flash of empty content on slow connections
- Simulator mock covers only `CoffeeProfile`, `CoffeePreference`, `Order` — extend for `NfcChip` and `Shop` when working Phase 1

---

## Branch Strategy

```
main  ←  dev  ←  feat/chip-flow-full         (Phase 1)
                  feat/preference-ux           (Phase 2)
                  feat/consumer-profile-polish (Phase 3)
                  feat/admin-operations        (Phase 4)
                  feat/shop-barista-view       (Phase 5)
                  feat/growth-loyalty          (Phase 7)
```

Each phase ships as a `feat/*` branch, verified with `npm run sim:test`, merged to `dev`, reviewed in Base44, then promoted to `main`.
