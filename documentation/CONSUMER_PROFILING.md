# Consumer Profiling

Profile the real Base44-backed consumer flow on `https://test-dev.kistik.uk/consumer`.

## Required Inputs

Set two real consumer records before running:

```bash
export TAPCUP_PROFILE_A_ID="REAL_PERSONAL_ID_A"
export TAPCUP_PROFILE_A_PHONE="REAL_PHONE_A"
export TAPCUP_PROFILE_B_ID="REAL_PERSONAL_ID_B"
export TAPCUP_PROFILE_B_PHONE="REAL_PHONE_B"
```

Optional:

```bash
export TAPCUP_PROFILE_BASE_URL="https://test-dev.kistik.uk"
export TAPCUP_PROFILE_ITERATIONS="3"
```

## Run

```bash
npm run profile:consumer
```

Show the latest profiling summary again without rerunning:

```bash
npm run profile:consumer:report
```

Run only a subset:

```bash
node tests/profiling/run-consumer-profile.mjs --grep "saved chip"
```

## Covered Flows

- direct `/consumer?personal_id=...`
- manual phone lookup
- manual NFC ID lookup
- saved-chip tap flow
- reload on routed profile
- sign-out and re-entry
- loaded-profile options:
  history tab,
  preferences tab,
  name edit open,
  phone edit open,
  share sheet when available,
  replacement modal when available

## Output

Artifacts are written to `profiling-artifacts/`.

Each scenario gets a JSON report with:

- scenario name
- consumer key (`A` or `B`)
- iteration number
- route/input type
- timing metrics
- checkpoint list
- pass/fail state

The console summary prints per-scenario medians for the captured timing fields.
