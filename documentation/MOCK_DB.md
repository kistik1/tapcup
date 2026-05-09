# Mock DB — Simulator Test Reference

Seed data for the in-memory simulator. Use these credentials and IDs when testing locally.

---

## Consumers

| Name | Email | Phone | NFC Chip ID |
|------|-------|-------|-------------|
| Maya Bean | sim@tapcup.local | +972500000001 | SIM-111111 |
| Alex Rivera | alex@tapcup.local | +972500000002 | SIM-222222 |
| Dana Levi | dana@tapcup.local | +972500000003 | SIM-333333 |

## Preferences

| Consumer | Preference | Type | Milk | Temp | Default |
|----------|-----------|------|------|------|---------|
| Maya Bean | Morning Latte | Latte | Oat | Hot | ✓ |
| Alex Rivera | Flat White | Flat White | Whole | Hot | ✓ |
| Alex Rivera | Iced Americano | Americano | None | Iced | |
| Dana Levi | Oat Cappuccino | Cappuccino | Oat | Hot | ✓ |
| Dana Levi | Sweet Latte | Latte | Almond | Extra Hot | |

## Shops

| Name | Username | Password | Note |
|------|----------|----------|------|
| TapCup Roasters | `tap` | `tap1` | Simulator only — auto-loaded, login form is skipped |
| Bean There Café | `bean` | `bean1` | Simulator only — auto-loaded, login form is skipped |

> **These credentials do not work on `localhost:7777` or `test-dev.kistik.uk`** — those connect to the real Base44 backend. The mock shops only exist in the in-memory simulator at port 4173. In simulator mode the shop login form is skipped entirely; TapCup Roasters is loaded automatically.

## Seed Orders

| Consumer | Shop | Preference | Price |
|----------|------|-----------|-------|
| Maya Bean | TapCup Roasters | Morning Latte | $4.80 |
| Alex Rivera | TapCup Roasters | Flat White | $5.00 |
| Alex Rivera | Bean There Café | Iced Americano | $4.50 |
| Dana Levi | Bean There Café | Oat Cappuccino | $5.20 |

## NFC Chip URLs

```
https://tap-cup.base44.app/consumer?personal_id=SIM-111111   → Maya Bean
https://tap-cup.base44.app/consumer?personal_id=SIM-222222   → Alex Rivera
https://tap-cup.base44.app/consumer?personal_id=SIM-333333   → Dana Levi
```
