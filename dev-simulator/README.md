# Dev Simulator

This folder is the entry point for TapCup's local browser simulator.

Current commands:

- `npm run sim:test`
- `npm run sim:consumer`
- `npm run sim:shop`
- `npm run sim:report`

Artifacts are written to `simulator-artifacts/`.

The simulator uses Playwright against the real app UI with a simulator-mode Base44 mock.

`sim:test`, `sim:consumer`, and `sim:shop` print a concise pass/fail summary after each run. `npm run sim:report` prints the full artifact report for existing simulator outputs.
