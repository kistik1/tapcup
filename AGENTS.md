# TapCup AGENTS.md

## Project
- TapCup is a Base44 coffee app with `consumer` and `shop` flows.
- NFC is simulated through `personal_id` routing, not real browser NFC.
- Treat the simulator as the source of truth for core identity and shop flows.

## Working Rules
- Read the relevant code and simulator tests before changing behavior.
- Keep changes focused and verify only what is affected.

## Verification
- Use `npm run sim:consumer`, `npm run sim:shop`, or `npm run sim:test` as appropriate.
- After NFC or routing changes, verify the relevant simulator flow.
- If a change touches reporting or artifacts, confirm `npm run sim:report` still works.

## Reporting
- Be concise and factual.
- Call out gaps, risks, and existing repo issues that affect the change.
