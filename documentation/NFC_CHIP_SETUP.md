# Adding a New NFC Chip to TapCup

This document explains the full path for adding a new NFC chip to the app.

TapCup does not rely on browser NFC as the production source of truth. The chip should open a canonical TapCup URL that includes a unique `personal_id`, and the app persists the chip association in app storage and backend records.

## Goal

Add a new chip so it can:

- identify a consumer
- restore or create the linked profile
- work in both consumer and shop flows
- remain minimal on-chip, storing only a canonical URL with the embedded unique ID query string

## Who Can Do It

- `admin`
- `shop`

Consumers should not normally provision chips for other users.

## End-to-End Flow

1. Open the chip setup flow in the app.
2. Generate a new unique `personal_id` or reuse an existing one if the chip is being re-assigned.
3. Build the canonical URL, for example `https://tap-cup.base44.app/?personal_id=ABC123`.
4. Register that URL in the app.
5. Link the chip to a consumer profile or create a new profile seed.
6. Verify the chip works by tapping it in the consumer or shop flow.
7. Save the result so future taps restore the same person.
8. Confirm the app cache remembers the last role and page so the redirect continues into the right flow.

## Recommended Setup Paths

### Path 1: Attach a chip to an existing consumer

Use this when a customer already has a profile.

1. Search for the consumer by name, phone, or existing `personal_id`.
2. Open the profile in the admin or shop setup screen.
3. Choose `Add NFC Chip` or `Assign Chip`.
4. Enter or scan the chip's canonical URL.
5. Confirm the mapping.
6. Verify that tapping the chip opens the URL, the app reads `personal_id`, and the cached role/page context sends the user into the right screen.

### Path 2: Create a new consumer from a blank chip

Use this when the chip has never been used.

1. Open the chip setup flow.
2. Create a new unique `personal_id`.
3. Build and save the canonical URL.
4. Tap the chip.
5. If no profile exists yet, the app should prompt for profile creation seeded with that ID.
6. Finish profile creation and confirm the chip now restores the profile.
7. Confirm the cache stores the current role and page for faster re-entry next time.

### Path 3: Reassign a chip

Use this when a chip should move to a different profile.

1. Open the current chip record.
2. Confirm the existing linked profile.
3. Remove or deactivate the old mapping.
4. Assign the chip to the new profile.
5. Verify the old profile no longer resolves from that chip.

## What Gets Stored

### On the chip

Only a canonical URL with the embedded unique ID query string.

Examples:

- `https://tap-cup.base44.app/?personal_id=SIM-111111`
- `https://tap-cup.base44.app/?personal_id=ABC123`
- any app-generated canonical URL with a unique `personal_id` query string

### In the app

The app stores:

- the chip-to-profile mapping
- the consumer profile linked to that chip
- any default preference data
- the last known chip state if needed for routing
- the cached role and page context used after the URL opens

### In local storage

TapCup may persist the last known `personal_id` in browser storage for simulator or app continuity.

## Verification Steps

After adding the chip, test these flows:

1. Tap the chip from the consumer screen.
2. Confirm it routes to the correct consumer profile.
3. Confirm the shop can resolve the same chip.
4. Confirm the profile loads by `personal_id` on refresh.
5. Confirm the chip does not expose preference data directly.

## Rules

- Never write complex profile data to the chip.
- Never rely on the chip storing anything other than the canonical URL.
- Never rely on the chip to decide the role or destination page by itself.
- Never make browser NFC a hard dependency.
- Keep the chip mapping deterministic.
- Preserve the ability to create a profile if the chip has no linked consumer yet.
- Use role-based access for chip assignment and re-assignment.

## Related App Paths

- `/consumer` for consumer identity and profile management
- `/shop` for customer lookup and order logging
- `/admin` for chip assignment, consumer overview, and shop management

## Implementation Notes

- `personal_id` is the routing key.
- `nfc_id` is the persisted profile identifier.
- The chip URL should point at the canonical base app URL, for example `https://tap-cup.base44.app/?personal_id=...`.
- The app cache should remember the last role and page to decide whether the redirect continues into consumer, shop, or admin.
- The consumer flow should resolve `personal_id` from the URL when the cached role points to consumer.
- The shop flow should be able to look up a customer by the same ID when the cached role points to shop.
- If the chip is unknown, the app should seed profile creation instead of failing.

## Suggested Admin Checklist

Before shipping a new chip setup flow, confirm:

- the chip can be assigned from the admin panel
- the chip can be attached to an existing profile
- a blank chip still starts the creation flow
- the shop cannot edit consumer-owned preferences
- the consumer can recover their profile after refresh
