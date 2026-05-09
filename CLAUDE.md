# TapCup — CLAUDE.md

Project instructions for Claude Code. Read this before touching any code.

---

## Quick Reference — Implementation Gate

NEVER begin implementation unless ALL of the following are true:
- [ ] The task is scoped to a local `feat/*` branch
- [ ] Relevant simulator tests identified (or confirmed N/A)
- [ ] No uncommitted changes on the branch that would break a clean sim run

---

## Project Overview

TapCup is an NFC-driven coffee profile app hosted on Base44.  
NFC chips store a canonical URL with a `personal_id` param; the app resolves that into a consumer coffee profile.

- **Production:** https://tap-cup.base44.app/
- **Local preview:** https://test-dev.kistik.uk → Caddy → `127.0.0.1:7777`
- **Simulator:** Playwright in-memory Base44 mock, runs on `127.0.0.1:4173`

**Three roles:** Consumer (profile + preferences), Shop (NFC lookup + order logging), Admin (manage all entities).

---

## Tech Stack

- React 18 + Vite + Tailwind + Radix UI + Framer Motion
- Base44 SDK — no custom REST API; all state lives in Base44 entities
- React Query + React Hook Form + Zod
- Stripe (payments), Leaflet (maps), Three.js (3D)
- Playwright for simulator tests

---

## Key Files

| File | Role |
|------|------|
| `src/lib/AuthContext.jsx` | Global auth state (consumer / shop / admin) |
| `src/lib/personal-id.js` | NFC chip ID routing |
| `src/lib/chip-assignment.js` | Chip-to-profile assignment + audit |
| `src/pages/AdminPage.jsx` | Admin dashboard (21 KB) |
| `src/pages/ShopPage.jsx` | Shop flow (16 KB) |
| `src/components/consumer/PreferenceForm.jsx` | Coffee pref editor (25 KB) |
| `tests/simulator/` | Playwright simulator suite |
| `documentation/PRD.md` | Product requirements |
| `documentation/ROADMAP.md` | Phased feature roadmap |

---

## Auth

| Role | Method |
|------|--------|
| Consumer | Base44 token bootstrap via `base44.auth.me()` |
| Shop | Per-shop username/password (admin-created) |
| Admin | `PasswordGate` — env var `VITE_TAPCUP_ADMIN_PASSWORD` |

---

## Git and GitHub Flow

### Rules
- **GitHub `main`** = Base44-ready code only. The Base44 platform publishes from `main`.
- **All work** happens on local `feat/*` branches. Never commit directly to `main`.
- **One remote branch:** `origin/main`. No persistent `dev` or staging branch on GitHub.

### Dev cycle
```
feat/* branch (local)
  → develop + manual review on localhost:7777
  → run npm run sim:test
  → all tests pass
  → user confirms "push to main"
  → fast-forward merge to origin/main
  → delete feature branch
```

### Push gate (enforced before every merge to main)
1. Run `npm run sim:test` — all tests must pass
2. No uncommitted changes
3. User explicitly confirms the push

### npm scripts
```bash
npm run sim:test      # full suite
npm run sim:consumer  # consumer flow only
npm run sim:shop      # shop flow only
npm run sim:nfc       # NFC routing only
npm run sim:report    # artifact report
```

---

## Simulator Scope

The simulator mock covers: `CoffeeProfile`, `CoffeePreference`, `Order`.

The following require real Base44-backed mode for full validation:
- `Shop`, `StaffAccess`, `NfcChip`, `AdminAuditLog`
- Admin and shop-management features
- Real Base44 auth and hosted publish behavior

---

## Working Rules

1. Read the relevant code and simulator tests before making changes.
2. Keep changes focused — verify only what is affected.
3. After any NFC or routing change, run `npm run sim:nfc` before the full suite.
4. Do not use `localhost:4173` (simulator port) for manual app review — use `localhost:7777`.
5. `https://test-dev.kistik.uk` is a view of whatever is running on `127.0.0.1:7777`, not a separate deployment.
6. Generated canonical chip URLs point to `https://tap-cup.base44.app` by design — do not change this.
7. Caddy and systemd are machine-managed infrastructure — do not modify them from this repo.

---

## Definition of Done

A task is complete only when:
- Simulator passes (`npm run sim:test`)
- No lint errors (`npm run lint`)
- Manual review on `localhost:7777` confirms the feature works end-to-end
- Docs updated if behavior changed
