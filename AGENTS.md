# TapCup AGENTS.md

## Project
- TapCup is a Base44 coffee app with `consumer` and `shop` flows.
- NFC is simulated through `personal_id` routing, not real browser NFC.
- Treat the simulator as the source of truth for core identity and shop flows.

## Environments
- `localhost:7777` is the local TapCup preview port on this machine for manual browser review.
- `https://test-dev.kistik.uk` is a Caddy hostname that reverse proxies to `127.0.0.1:7777`.
- The simulator runs its own local app instance on `127.0.0.1:4173` through Playwright.
- Base44 hosted production follows GitHub `main`.
- Caddy is machine-managed infrastructure, not part of this repo.

## Branch Workflow
- `main` is the production branch for the Base44 app.
- `dev` is the verified integration branch.
- Build each new feature from `dev` in a dedicated `feat/*` branch.
- Implement and verify the change locally on the feature branch first.
- Run the app on `localhost:7777` when you need manual browser review or external review through `https://test-dev.kistik.uk`.
- After local verification passes, merge the feature branch into `dev` for integrated review.
- After you confirm the integrated change is good in `dev` and in Base44, merge `dev` into `main`.

## Working Rules
- Read the relevant code and simulator tests before changing behavior.
- Keep changes focused and verify only what is affected.
- Follow the branch flow above for all feature and test work.
- Treat `https://test-dev.kistik.uk` as a view of the local branch currently running on `127.0.0.1:7777`, not as a separate deployment target.
- Do not use the simulator port for manual app review.

## Verification
- Use `npm run sim:consumer`, `npm run sim:shop`, or `npm run sim:test` as appropriate.
- After NFC or routing changes, verify the relevant simulator flow.
- If a change touches reporting or artifacts, confirm `npm run sim:report` still works.
- For consumer, shop, NFC, `personal_id`, or order/profile behavior, local simulator verification is required before merging into `dev`.

## Localhost vs Base44
- Simulator mode covers local consumer/shop identity, `personal_id` routing, saved-chip behavior, and local order/profile flows.
- Plain local non-simulator runs depend on valid Base44 app params and auth/bootstrap behavior.
- Real Base44 auth, hosted publish behavior, and production integration checks still require Base44 runtime validation.
- The simulator mock only covers `CoffeeProfile`, `CoffeePreference`, and `Order`.
- Admin and shop-management features that depend on `Shop`, `StaffAccess`, `NfcChip`, or `AdminAuditLog` may be incomplete locally and must be validated in real Base44-backed mode before release.
- Generated canonical chip URLs still point to `https://tap-cup.base44.app` by design.

## Release Sequence
- Start from local `dev`.
- Create a focused `feat/*` branch.
- Implement locally and run the relevant simulator checks.
- Review manually on `localhost:7777` and, if needed, through `https://test-dev.kistik.uk`.
- Merge the verified feature branch into `dev`.
- Review the integrated result in Base44.
- Merge `dev` into `main`.
- Publish from Base44 `main`.

## Reporting
- Be concise and factual.
- Call out gaps, risks, and existing repo issues that affect the change.
