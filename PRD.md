# TapCup PRD

## Overview
TapCup is a Base44 coffee experience with two primary flows:

- Consumer: a customer manages their coffee profile, preferences, and order history.
- Shop: a coffee shop identifies a customer and logs an order.

The product uses NFC-inspired identity, but the web app does not depend on real browser NFC scanning as the primary production path. Instead, a chip stores a unique personal ID, the app saves state, and navigation is driven by URL redirect.

## Problem
Web NFC support is inconsistent across browsers and devices, which makes a direct browser-based scan flow unreliable for production use.

We need a flow that:

- Works reliably in the browser
- Keeps NFC hardware simple
- Preserves a fast tap-to-profile experience
- Allows the app to restore the correct user state from a URL

## Product Goal
Let a coffee customer tap an NFC chip, have the system resolve the chip's unique ID, and land on the correct consumer experience without requiring the browser to perform the NFC read itself.

## Core Principle
The NFC chip stores only a unique personal ID.

The app is responsible for:

- Saving or resolving the chip state
- Mapping the ID to a `CoffeeProfile`
- Redirecting to a relevant URL such as `/consumer?personal_id=...`

## User Flows

### Consumer onboarding
1. User taps NFC or enters their phone/NFC ID manually.
2. The app resolves the identity.
3. If a matching profile exists, the app loads that profile.
4. If no profile exists, the app prompts to create one.

### NFC redirect flow
1. The chip contains a unique personal ID.
2. The app receives or simulates the scan result.
3. The app stores the lookup context and redirects to the consumer URL.
4. The consumer page reads `personal_id` from the URL and resolves the profile.

### Shop lookup
1. Barista scans or enters the customer identifier.
2. The app finds the profile by NFC ID or phone.
3. The app displays the customer profile and allows order logging.

## Functional Requirements

- The app must support `personal_id` as a URL-driven profile lookup key.
- The app must resolve a `personal_id` into a `CoffeeProfile.nfc_id`.
- The app must preserve the existing manual lookup paths.
- The app must support profile creation when a chip ID is unknown.
- The app must keep the NFC chip data minimal: unique ID only.

## Non-Goals

- Real browser NFC support as the only production path
- Writing complex profile data directly onto the NFC chip
- Replacing Base44 entity storage with chip-side storage

## Data Model

### CoffeeProfile
Represents the customer identity.

Primary fields:

- `user_email`
- `display_name`
- `phone`
- `nfc_id`

### CoffeePreference
Represents a saved coffee order preference for a profile.

### Order
Represents a logged shop order and a snapshot of the preference used.

## Experience Requirements

- The consumer page should load a profile from `personal_id` automatically when present.
- The app should show a loading state while resolving the identifier.
- If no profile exists, the app should present a creation flow seeded with the chip ID.
- The UI should remain usable when NFC is unavailable by allowing manual input.

## Acceptance Criteria

- A redirected URL like `/consumer?personal_id=ABC123` opens the matching consumer profile.
- If the profile exists, preferences and order history load automatically.
- If the profile does not exist, the app prompts for profile creation using the provided ID.
- The consumer experience still works with manual phone and NFC ID entry.
- The product does not require browser NFC support to function in production.

## Notes for Implementation

- Treat `personal_id` as the routing key and `nfc_id` as the persisted profile identifier.
- Keep the redirect flow deterministic so the app can restore state from the URL.
- If browser NFC is available, it can be treated as an optional enhancement, not a dependency.
