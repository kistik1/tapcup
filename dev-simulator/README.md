# Dev Simulator

This folder is the entry point for TapCup's local browser simulator.

Current commands:

- `npm run sim:test`
- `npm run sim:consumer`
- `npm run sim:shop`
- `npm run sim:report`

Optional consumer chip flag:

- `npm run sim:test -- --consumer-chip-id SIM-111111`
- `npm run sim:consumer -- --consumer-chip-id SIM-111111`

Artifacts are written to `simulator-artifacts/`.

The simulator uses Playwright against the real app UI with a simulator-mode Base44 mock.

`sim:test`, `sim:consumer`, and `sim:shop` print a concise pass/fail summary after each run. `npm run sim:report` prints the full artifact report for existing simulator outputs.

When `VITE_TAPCUP_SIMULATOR=true`, the app also shows a floating "Simulator NFC" panel that can inject a chip ID into the consumer or shop flow.
When `--consumer-chip-id` is supplied, the panel preloads that chip ID and labels the run as a simulated consumer chip scan.
