# Dev Simulator

This folder is the entry point for TapCup's local browser simulator.

Current commands:

- `npm run sim:test`
- `npm run sim:nfc`
- `npm run sim:consumer`
- `npm run sim:shop`
- `npm run sim:report`

Optional canonical chip URL flag:

- `npm run sim:nfc -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A" --side consumer`
- `npm run sim:nfc -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A" --side shop`
- `npm run sim:test -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A"`
- `npm run sim:consumer -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A"`

Artifacts are written to `simulator-artifacts/`.

The simulator uses Playwright against the real app UI with a simulator-mode Base44 mock.

`sim:test`, `sim:consumer`, and `sim:shop` print a concise pass/fail summary after each run. `npm run sim:report` prints the full artifact report for existing simulator outputs.

When `VITE_TAPCUP_SIMULATOR=true`, the app also shows a floating "Simulator NFC" panel that can inject a canonical chip URL into the consumer or shop flow.
When `--chip-url` is supplied, the panel preloads that canonical URL and derives `personal_id` from it.
Use `npm run sim:nfc -- --chip-url "https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A" --side consumer` for the smallest consumer NFC redirect flow, or `--side shop` to exercise the shop resolution path from the same chip URL.
`--chip-id` and `--consumer-chip-id` still work as compatibility aliases, but they now expect a canonical chip URL value.
