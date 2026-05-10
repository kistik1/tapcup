# TapCup

TapCup is a Base44 coffee app with `consumer` and `shop` flows.

Production identity is URL-driven: the NFC chip stores a canonical TapCup URL such as `https://tap-cup.base44.app/consumer?personal_id=...`, and the app resolves that `personal_id` into a consumer profile. Browser NFC is optional and is not the production source of truth.

App URL: `https://tap-cup.base44.app/`

## Workflow

- `main` is the only branch on GitHub. Base44 publishes from `main`.
- All work happens on local `feat/*` branches — never commit directly to `main`.
- Develop and verify locally on `localhost:7777`.
- Run `npm run sim:test` — all tests must pass before pushing.
- Push to `origin/main` only after explicit confirmation and a clean simulator run.
- Delete the feature branch after merge.

See [AGENTS.md](AGENTS.md) for the enforced working rules.

## Clone And Setup

```bash
git clone <repo-url>
cd tapcup
npm install
cp .env.local.example .env.local
```

Set the real Base44 values in `.env.local`:

```bash
VITE_BASE44_APP_ID=your_base44_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

Optional values:

- `VITE_BASE44_FUNCTIONS_VERSION` if your Base44 app requires a pinned functions version.
- `VITE_TAPCUP_ADMIN_PASSWORD` for `/admin` outside simulator mode.

## Local Preview And Proxy

Use the fixed TapCup local preview port when you want manual browser review or external review through Caddy:

```bash
npm run dev:local
```

This starts Vite on `127.0.0.1:7777`.

On this machine, Caddy maps:

- `https://test-dev.kistik.uk` -> `127.0.0.1:7777`

That means `test-dev.kistik.uk` is not a separate deployment target. It is only a hostname that shows the same local branch currently running through `npm run dev:local`.

`npm run dev` is still available for ad hoc Vite startup, but it does not follow the shared TapCup review convention.

## Boot Service

This repo includes a user-level systemd unit at [ops/tapcup-local.service](/home/kosta/projects/dev/tapcup/ops/tapcup-local.service) for running the local review app after reboot.

Install or refresh it with:

```bash
./scripts/install-user-service.sh
```

Installed on this machine, it starts:

```bash
npm run dev:local
```

from this clone at:

- `/home/kosta/projects/dev/tapcup`

Important behavior:

- the service serves whichever branch is currently checked out in this clone
- `.env.local` must exist in this repo before boot if you want real Base44-backed local mode
- Caddy continues to expose the service at `https://test-dev.kistik.uk`
- the installed user unit lives at `~/.config/systemd/user/tapcup-local.service`

## Simulator

The simulator is the local source of truth for consumer identity, shop identity, NFC routing, and `personal_id` flows.

Run the full simulator:

```bash
npm run sim:test
```

Run narrower flows:

```bash
npm run sim:nfc
npm run sim:consumer
npm run sim:shop
```

The simulator uses Playwright against a simulator-mode app instance on `127.0.0.1:4173`.

Artifacts are written to `simulator-artifacts/` and include JSON step logs, plain-text logs, screenshots, and Playwright traces on failure.

To simulate a chip scan with a canonical chip URL:

```bash
npm run sim:nfc -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A" --side consumer
npm run sim:nfc -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A" --side shop
npm run sim:test -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A"
```

Inspect the latest simulator artifact report with:

```bash
npm run sim:report
```

## What Works Locally

Reliable in simulator mode:

- consumer lookup by phone or `personal_id`
- shop lookup by phone or `personal_id`
- saved-chip behavior
- consumer profile creation from unknown `personal_id`
- local order and preference flows backed by simulator state

Requires real Base44-backed mode:

- auth bootstrap and token-driven login behavior
- Base44 app public settings and hosted runtime behavior
- production publish validation
- final integrated checks for admin and shop-management data

Current local limitation:

- the simulator mock only covers `CoffeeProfile`, `CoffeePreference`, and `Order`
- features that depend on `Shop`, `NfcChip`, or `AdminAuditLog` may be incomplete in pure simulator mode
- generated canonical chip URLs still point at `https://tap-cup.base44.app` by design

## Verification Rules

- Use `npm run sim:consumer`, `npm run sim:shop`, or `npm run sim:test` as appropriate.
- After NFC or routing changes, verify the relevant simulator flow.
- If a change touches reporting or artifacts, confirm `npm run sim:report` still works.
- For consumer, shop, NFC, `personal_id`, or order/profile behavior, local simulator verification is required before merging into `main`.

## Base44 Publish

When the feature is verified and the user confirms:

1. Run `npm run sim:test` — all tests must pass.
2. Fast-forward merge the feature branch into `origin/main`.
3. Delete the feature branch.
4. Base44 publishes automatically from `main`.

## Docs And Support

- Base44 GitHub integration docs: `https://docs.base44.com/Integrations/Using-GitHub`
- Base44 support: `https://app.base44.com/support`
