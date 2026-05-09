# TapCup — Base44 Schema Reference

All entities required for the production app. Create each one in the Base44 dashboard before going live.

---

## CoffeeProfile

One record per customer. Created when a new NFC chip is tapped for the first time.

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `user_email` | Text | ✓ | Primary identifier; can be a placeholder if no real email |
| `display_name` | Text | ✓ | Customer's name shown in shop and consumer views |
| `phone` | Text | | Used for manual lookup at the shop |
| `nfc_id` | Text | | The personal ID stored on the NFC chip |
| `avatar_url` | Text | | URL to profile photo |

---

## CoffeePreference

One or more records per customer. Each is a saved coffee recipe.

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `profile_id` | Text | ✓ | Foreign key → CoffeeProfile |
| `user_email` | Text | ✓ | Denormalized from profile for fast filtering |
| `name` | Text | ✓ | Human label, e.g. "Morning Latte" |
| `coffee_type` | Text | ✓ | e.g. Latte, Cappuccino, Americano, Flat White, Espresso |
| `strength` | Text | ✓ | Espresso shots: `"1"`, `"2"`, `"3"` |
| `milk` | Text | ✓ | None / Whole / Skim / Oat / Almond / Soy / Coconut |
| `sugar` | Text | ✓ | None / Half / 1 tsp / 2 tsp / 3 tsp |
| `temperature` | Text | ✓ | Extra Hot / Hot / Warm / Iced |
| `vessel` | Text | ✓ | `"mug"` / `"glass"` / `"ta"` (paper cup) |
| `size` | Text | ✓ | `"small"` (150 ml) / `"large"` (300 ml) |
| `water_pct` | Number | ✓ | Water layer 0–100 (layers must sum to 100) |
| `milk_pct` | Number | ✓ | Milk layer 0–100 |
| `coffee_pct` | Number | ✓ | Espresso layer 0–100 |
| `foam_pct` | Number | ✓ | Foam layer 0–100 |
| `is_default` | Boolean | ✓ | Only one preference per profile should be true |
| `notes` | Text | | Special instructions for the barista |
| `image_url` | Text | | Photo of the drink |

---

## Order

One record per order logged by a shop. Immutable after creation.

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `profile_id` | Text | ✓ | Foreign key → CoffeeProfile |
| `user_email` | Text | ✓ | Denormalized from profile |
| `preference_id` | Text | | Foreign key → CoffeePreference (nullable if ad-hoc) |
| `preference_snapshot` | JSON | | Full copy of the preference at time of order |
| `shop_id` | Text | | Foreign key → Shop |
| `shop_name` | Text | | Denormalized shop name for display |
| `barista_notes` | Text | | Notes added by shop staff at order time |
| `price` | Number | | Order price |
| `status` | Text | ✓ | `"Completed"` (only status currently in use) |
| `ordered_at` | DateTime | ✓ | Timestamp of when the order was placed |

---

## NfcChip

One record per physical NFC chip. Tracks the full assignment history.

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `personal_id` | Text | ✓ | The ID embedded on the chip (unique) |
| `canonical_url` | Text | ✓ | Full Base44 URL: `https://tap-cup.base44.app/consumer?personal_id=...` |
| `profile_id` | Text | ✓ | Foreign key → CoffeeProfile currently assigned |
| `status` | Text | ✓ | `"active"` / `"inactive"` |
| `assigned_by_role` | Text | ✓ | `"shop"` or `"admin"` |
| `assigned_by_label` | Text | | Shop name or admin label |
| `assigned_at` | DateTime | ✓ | When this assignment was made |
| `deactivated_at` | DateTime | | Set when status changes to inactive |
| `notes` | Text | | Free-text history notes |

---

## Shop

One record per coffee shop. Holds login credentials and metadata.

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `name` | Text | ✓ | Shop display name |
| `address` | Text | | Street address |
| `phone` | Text | | Contact phone |
| `login_username` | Text | ✓ | Used to authenticate shop staff; must be unique |
| `login_password` | Text | ✓ | Plain-text password (Base44 has no hashing — keep short and rotatable) |
| `status` | Text | ✓ | `"active"` / `"inactive"` — inactive shops cannot log in |
| `credentials_updated_at` | DateTime | | Set every time the password is changed |
| `username_updated_by_role` | Text | | `"shop"` or `"admin"` — who last changed the username |
| `notes` | Text | | Internal admin notes |

---

## AdminAuditLog

Append-only log of actions taken by admin and shop roles. Never updated or deleted.

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `actor_role` | Text | ✓ | `"admin"` or `"shop"` |
| `action` | Text | ✓ | e.g. `assign_chip`, `reassign_chip`, `deactivate_chip_records`, `update_shop_username` |
| `entity_type` | Text | ✓ | e.g. `CoffeeProfile`, `NfcChip`, `Shop` |
| `entity_id` | Text | ✓ | ID of the affected record |
| `details` | JSON | | Context object — contents vary by action type |
| `created_at` | DateTime | ✓ | Timestamp of the action |
