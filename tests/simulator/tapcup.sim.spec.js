import { expect, test } from '@playwright/test';
import {
  SIMULATOR_PRIMARY_PREFERENCE,
  SIMULATOR_PRIMARY_PROFILE,
  SIMULATOR_PRIMARY_ORDER,
  PROFILE_ALEX,
  PREF_ALEX_FLAT_WHITE,
  PREF_ALEX_ICED_AMERICANO,
  SIMULATOR_SHOP_1,
} from '../../src/lib/simulator/fixtures.js';
import { normalizeSimulatorChipPayload } from '../../src/lib/simulator/chip-url.js';
import { runScenario } from './lib/scenario-runner.mjs';

const PERSONAL_ID_STORAGE_KEY = 'tapcup_last_personal_id';
const SHOP_SESSION_STORAGE_KEY = 'tapcup_shop_session';
const UNKNOWN_PERSONAL_ID = 'SIM-NEW-0001';
const NFC_SCAN_DELAY_MS = 20000;
const SIMULATOR_SIDE = process.env.VITE_TAPCUP_SIMULATOR_SIDE?.trim() || 'consumer';
const SIMULATOR_CHIP_PAYLOAD = normalizeSimulatorChipPayload(
  process.env.VITE_TAPCUP_SIMULATOR_CHIP_URL?.trim()
  || process.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID?.trim()
  || `https://tap-cup.base44.app/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`
);
const SIMULATOR_CHIP_URL = SIMULATOR_CHIP_PAYLOAD.canonicalUrl;
const SIMULATOR_CHIP_PERSONAL_ID = SIMULATOR_CHIP_PAYLOAD.personalId;

async function seedSavedPersonalId(page, personalId) {
  await page.addInitScript(
    ({ storageKey, value }) => {
      window.localStorage.setItem(storageKey, value);
    },
    { storageKey: PERSONAL_ID_STORAGE_KEY, value: personalId }
  );
}

async function seedRememberedShopSession(page) {
  await page.addInitScript(
    ({ storageKey, value }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    },
    {
      storageKey: SHOP_SESSION_STORAGE_KEY,
      value: {
        id: 'shop_sim_001',
        name: 'TapCup Roasters',
        login_username: 'tap',
      },
    }
  );
}

async function seedVisibilityController(page) {
  await page.addInitScript(() => {
    window.__tapcupVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => window.__tapcupVisibilityState,
    });
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => window.__tapcupVisibilityState === "hidden",
    });
  });
}

async function setPageHidden(page) {
  await page.evaluate(() => {
    window.__tapcupVisibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("pagehide"));
  });
}

test.describe('TapCup simulator', () => {
  test('consumer: tap NFC redirects via saved chip id', async ({ page }, testInfo) => {
    await seedSavedPersonalId(page, SIMULATOR_PRIMARY_PROFILE.nfc_id);

    await runScenario(testInfo, page, 'consumer tap nfc redirects via saved chip id', async ({ step }) => {
      await step('Open consumer landing page', 'Consumer identify screen should render', async () => {
        await page.goto('/consumer');
        await expect(page.getByRole('button', { name: /Tap NFC/i })).toBeVisible();
        return 'Consumer identify screen is visible';
      });

      await step('Tap NFC', `Redirect to /consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`, async () => {
        await page.getByTestId('consumer-tap-nfc').click();
        await expect(page.getByText('Ready to Scan')).toBeVisible();
        await page.waitForTimeout(NFC_SCAN_DELAY_MS + 500);
        await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`));
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByText(SIMULATOR_PRIMARY_PREFERENCE.name)).toBeVisible();
        return `Redirected to ${page.url()} with profile ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
      });

      await step('Reload page', 'Profile should survive a reload on the URL route', async () => {
        await page.reload();
        await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`));
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return 'Profile remained available after reload';
      });
    });
  });

  test('consumer: tap NFC auto-dismisses when the tab becomes hidden', async ({ page }, testInfo) => {
    await seedVisibilityController(page);
    await seedSavedPersonalId(page, SIMULATOR_PRIMARY_PROFILE.nfc_id);

    await runScenario(testInfo, page, 'consumer tap nfc auto dismisses when tab becomes hidden', async ({ step }) => {
      await step('Open consumer landing page', 'Consumer identify screen should render', async () => {
        await page.goto('/consumer');
        await expect(page.getByRole('button', { name: /Tap NFC/i })).toBeVisible();
        return 'Consumer identify screen is visible';
      });

      await step('Start scan and hide tab', 'The scan overlay should close when the tab is hidden', async () => {
        await page.getByTestId('consumer-tap-nfc').click();
        await expect(page.getByText('Ready to Scan')).toBeVisible();
        await setPageHidden(page);
        await expect(page.getByText('Ready to Scan')).toHaveCount(0);
        await expect(page.getByTestId('consumer-tap-nfc')).toBeVisible();
        return 'Consumer scan overlay dismissed after tab hide';
      });
    });
  });

  test('consumer: manual phone lookup resolves profile', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer manual phone lookup resolves profile', async ({ step }) => {
      await step('Open identify screen', 'Identify screen should be visible', async () => {
        await page.goto('/consumer');
        await expect(page.getByText('Welcome Back')).toBeVisible();
        return 'Identify screen loaded';
      });

      await step('Search by phone', 'Manual phone lookup should load the existing profile', async () => {
        await page.getByPlaceholder('+972 50 000 0000').fill(SIMULATOR_PRIMARY_PROFILE.phone);
        await page.getByRole('button', { name: /Sign In/i }).click();
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByTestId('consumer-profile-nfc-id')).toHaveText(`NFC: ${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        return `Loaded ${SIMULATOR_PRIMARY_PROFILE.display_name} from phone ${SIMULATOR_PRIMARY_PROFILE.phone}`;
      });
    });
  });

  test('consumer: manual NFC ID lookup resolves profile', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer manual nfc id lookup resolves profile', async ({ step }) => {
      await step('Open identify screen', 'Identify screen should be visible', async () => {
        await page.goto('/consumer');
        await expect(page.getByText('Welcome Back')).toBeVisible();
        return 'Identify screen loaded';
      });

      await step('Search by NFC ID', 'Manual NFC ID lookup should load the existing profile', async () => {
        await page.getByPlaceholder('Personal ID').first().fill(SIMULATOR_PRIMARY_PROFILE.nfc_id);
        await page.getByRole('button', { name: /Search by NFC ID/i }).click();
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByTestId('consumer-profile-nfc-id')).toHaveText(`NFC: ${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        return `Loaded ${SIMULATOR_PRIMARY_PROFILE.display_name} from NFC ID ${SIMULATOR_PRIMARY_PROFILE.nfc_id}`;
      });
    });
  });

  test('consumer: unknown personal id creates a new profile', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer unknown personal id creates profile', async ({ step }) => {
      await step('Open unknown consumer route', 'Unknown personal_id should trigger the create profile flow', async () => {
        await page.goto(`/consumer?personal_id=${UNKNOWN_PERSONAL_ID}`);
        await expect(page.getByText('Profile Not Found')).toBeVisible();
        await expect(page.getByPlaceholder('Personal ID')).toHaveValue(UNKNOWN_PERSONAL_ID);
        return `Create profile prompt opened for ${UNKNOWN_PERSONAL_ID}`;
      });

      await step('Create profile', 'The new profile should be created and loaded', async () => {
        await page.getByPlaceholder('Your name').fill('New Simulator Guest');
        await page.getByPlaceholder('+1 555 000 0000').fill('+15550000003');
        await page.getByRole('button', { name: /Create Profile/i }).click();
        await expect(page.getByText('New Simulator Guest')).toBeVisible();
        await expect(page.getByText(`NFC: ${UNKNOWN_PERSONAL_ID}`)).toBeVisible();
        return `Created and loaded profile with NFC ID ${UNKNOWN_PERSONAL_ID}`;
      });
    });
  });

  test('consumer: sign out clears the route and tap NFC restores it', async ({ page }, testInfo) => {
    await seedSavedPersonalId(page, SIMULATOR_PRIMARY_PROFILE.nfc_id);

    await runScenario(testInfo, page, 'consumer sign out clears route and tap nfc restores it', async ({ step }) => {
      await step('Open routed consumer page', 'Existing profile should be loaded from the personal_id URL', async () => {
        await page.goto(`/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return `Loaded ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
      });

      await step('Sign out', 'The route should clear back to /consumer and show identify screen', async () => {
        await page.getByTestId('consumer-sign-out').click();
        await expect(page).toHaveURL(/\/consumer$/);
        await expect(page.getByRole('button', { name: /Tap NFC/i })).toBeVisible();
        return 'Route cleared and identify screen returned';
      });

      await step('Tap NFC again', 'The saved chip id should redirect back to the consumer profile', async () => {
        await page.getByTestId('consumer-tap-nfc').click();
        await page.waitForTimeout(NFC_SCAN_DELAY_MS + 500);
        await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`));
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return 'Saved chip id restored the profile route';
      });
    });
  });

  test('simulator: manual nfc panel can push a chip read into consumer', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'simulator manual nfc panel pushes a chip read into consumer', async ({ step }) => {
      await step('Open home page', 'Simulator panel should be visible on localhost', async () => {
        await page.goto('/');
        await expect(page.getByTestId('simulator-nfc-panel')).toBeVisible();
        return 'Simulator panel loaded';
      });

      await step('Push chip read', 'The simulator should route the chip ID into the consumer flow', async () => {
        await page.getByTestId('simulator-nfc-chip').fill(`https://tap-cup.base44.app/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await page.getByTestId('simulator-nfc-side').selectOption('consumer');
        await page.getByTestId('simulator-nfc-run').click();
        await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`));
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return `Simulated chip read for ${SIMULATOR_PRIMARY_PROFILE.nfc_id}`;
      });
    });
  });

  test('simulator: chip url flag preloads the NFC panel', async ({ page }, testInfo) => {
    test.skip(!process.env.VITE_TAPCUP_SIMULATOR_CHIP_URL?.trim() && !process.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID?.trim(), 'chip url flag not set');

    await runScenario(testInfo, page, 'simulator chip url flag preloads the nfc panel', async ({ step }) => {
      const isShopSide = SIMULATOR_SIDE === 'shop';

      await step('Open home page', 'Simulator panel should preload the canonical chip URL', async () => {
        await page.goto(isShopSide ? '/shop' : '/consumer');
        await expect(page.getByTestId('simulator-nfc-panel')).toBeVisible();
        await expect(page.getByTestId('simulator-nfc-chip')).toHaveValue(SIMULATOR_CHIP_URL);
        await expect(page.getByTestId('simulator-nfc-personal-id')).toHaveText(SIMULATOR_CHIP_PERSONAL_ID);
        await expect(page.getByTestId('simulator-consumer-chip-flag')).toBeVisible();
        return `Loaded canonical chip URL ${SIMULATOR_CHIP_URL}`;
      });

      await step('Simulate consumer chip scan', isShopSide ? 'The panel should seed the shop flow from the canonical chip URL' : 'The panel should route the consumer chip into the consumer flow', async () => {
        await page.getByTestId('simulator-nfc-run').click();
        if (isShopSide) {
          await expect(page).toHaveURL(/\/shop$/);
          await page.getByTestId('shop-tap-nfc').click();
          await page.waitForTimeout(NFC_SCAN_DELAY_MS + 500);
          await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
          return `Seeded shop flow from ${SIMULATOR_CHIP_URL}`;
        }

        await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${SIMULATOR_CHIP_PERSONAL_ID}`));
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return `Simulated consumer chip scan for ${SIMULATOR_CHIP_PERSONAL_ID}`;
      });
    });
  });

  test('nfc: redirect only from canonical chip url flag', async ({ page }, testInfo) => {
    test.skip(!process.env.VITE_TAPCUP_SIMULATOR_CHIP_URL?.trim() && !process.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID?.trim(), 'chip url flag not set');

    await runScenario(testInfo, page, 'nfc redirect only from canonical chip url flag', async ({ step }) => {
      const isShopSide = SIMULATOR_SIDE === 'shop';

      await step('Open landing page', 'Simulator NFC panel should preload the canonical chip URL', async () => {
        await page.goto(isShopSide ? '/shop' : '/consumer');
        await expect(page.getByTestId('simulator-nfc-panel')).toBeVisible();
        await expect(page.getByTestId('simulator-nfc-chip')).toHaveValue(SIMULATOR_CHIP_URL);
        await expect(page.getByTestId('simulator-nfc-personal-id')).toHaveText(SIMULATOR_CHIP_PERSONAL_ID);
        return `Loaded chip URL ${SIMULATOR_CHIP_URL} into the NFC panel`;
      });

      await step('Simulate NFC redirect', isShopSide ? 'The chip should seed the shop flow from the canonical URL' : 'The chip should redirect directly to the consumer route', async () => {
        await page.getByTestId('simulator-nfc-run').click();
        if (isShopSide) {
          await expect(page).toHaveURL(/\/shop$/);
          await expect(page.getByTestId('simulator-nfc-personal-id')).toHaveText(SIMULATOR_CHIP_PERSONAL_ID);
          await page.getByTestId('shop-tap-nfc').click();
          await page.waitForTimeout(NFC_SCAN_DELAY_MS + 500);
          await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
          await expect(page.getByText(SIMULATOR_PRIMARY_PREFERENCE.name)).toBeVisible();
          return `Seeded shop flow from ${SIMULATOR_CHIP_URL}`;
        }

        await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${SIMULATOR_CHIP_PERSONAL_ID}`));
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByText(SIMULATOR_PRIMARY_PREFERENCE.name)).toBeVisible();
        return `Redirected to consumer profile for ${SIMULATOR_CHIP_PERSONAL_ID}`;
      });
    });
  });

  test('shop: tap NFC resolves the seeded customer', async ({ page }, testInfo) => {
    await seedSavedPersonalId(page, SIMULATOR_PRIMARY_PROFILE.nfc_id);

    await runScenario(testInfo, page, 'shop tap nfc resolves the seeded customer', async ({ step }) => {
      await step('Open shop page', 'Shop scan view should render', async () => {
        await page.goto('/shop');
        await expect(page.getByRole('button', { name: /Tap NFC/i })).toBeVisible();
        return 'Shop scan view loaded';
      });

      await step('Tap NFC', 'The shop should open the matched customer profile', async () => {
        await page.getByTestId('shop-tap-nfc').click();
        await expect(page.getByText('Ready to Scan')).toBeVisible();
        await page.waitForTimeout(NFC_SCAN_DELAY_MS + 500);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return `Opened shop profile for ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
      });
    });
  });

  test('shop: tap NFC auto-dismisses when the tab becomes hidden', async ({ page }, testInfo) => {
    await seedVisibilityController(page);
    await seedSavedPersonalId(page, SIMULATOR_PRIMARY_PROFILE.nfc_id);

    await runScenario(testInfo, page, 'shop tap nfc auto dismisses when tab becomes hidden', async ({ step }) => {
      await step('Open shop page', 'Shop scan view should render', async () => {
        await page.goto('/shop');
        await expect(page.getByRole('button', { name: /Tap NFC/i })).toBeVisible();
        return 'Shop scan view loaded';
      });

      await step('Start scan and hide tab', 'The scan overlay should close when the tab is hidden', async () => {
        await page.getByTestId('shop-tap-nfc').click();
        await expect(page.getByText('Ready to Scan')).toBeVisible();
        await setPageHidden(page);
        await expect(page.getByText('Ready to Scan')).toHaveCount(0);
        await expect(page.getByTestId('shop-tap-nfc')).toBeVisible();
        return 'Shop scan overlay dismissed after tab hide';
      });
    });
  });

  test('shop: root chip link opens the shop flow when a shop session is remembered', async ({ page }, testInfo) => {
    await seedVisibilityController(page);
    await seedRememberedShopSession(page);

    await runScenario(testInfo, page, 'shop root chip link opens shop flow when session is remembered', async ({ step }) => {
      await step('Open root chip link', 'The root chip link should redirect into the shop route instead of consumer', async () => {
        await page.goto(`/?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page).toHaveURL(new RegExp(`/shop\\?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`));
        return `Redirected into shop route for ${SIMULATOR_PRIMARY_PROFILE.nfc_id}`;
      });

      await step('Resolve customer from redirected route', 'The redirected shop route should open the customer profile automatically', async () => {
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByText(SIMULATOR_PRIMARY_PREFERENCE.name)).toBeVisible();
        return `Opened shop customer profile for ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
      });
    });
  });

  test('shop: manual phone lookup resolves customer', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'shop manual phone lookup resolves customer', async ({ step }) => {
      await step('Open shop page', 'Shop scan view should render', async () => {
        await page.goto('/shop');
        await expect(page.getByRole('button', { name: /Tap NFC/i })).toBeVisible();
        return 'Shop scan view loaded';
      });

      await step('Search by phone', 'Manual phone lookup should open the matching customer profile', async () => {
        await page.getByPlaceholder('+1 555 000 0000').fill(SIMULATOR_PRIMARY_PROFILE.phone);
        await page.getByRole('button', { name: /Search by Phone/i }).click();
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByTestId('shop-customer-nfc-id')).toHaveText(SIMULATOR_PRIMARY_PROFILE.nfc_id);
        return `Opened shop profile for ${SIMULATOR_PRIMARY_PROFILE.display_name} by phone`;
      });
    });
  });

  test('shop: tap NFC without saved chip id keeps the scan overlay open until closed', async ({ page }, testInfo) => {
    await seedVisibilityController(page);
    await runScenario(testInfo, page, 'shop tap nfc without saved chip id keeps the scan overlay open', async ({ step }) => {
      await step('Open shop page', 'Shop scan view should render', async () => {
        await page.goto('/shop');
        await expect(page.getByTestId('shop-tap-nfc')).toBeVisible();
        return 'Shop scan view loaded';
      });

      await step('Tap NFC without saved id', 'The scan overlay should stay visible and explain that no chip is saved yet', async () => {
        await page.getByTestId('shop-tap-nfc').click();
        await expect(page.getByText('Ready to Scan')).toBeVisible();
        await expect(page.getByText('Waiting for NFC scan...')).toBeVisible();
        await page.waitForTimeout(20500);
        await expect(page.getByText(/No saved chip ID yet/i)).toBeVisible();
        return 'Overlay stayed open with the no-saved-chip message';
      });

      await step('Close scan overlay', 'The X button should close the scan overlay and return to the shop screen', async () => {
        await page.getByTestId('nfc-scan-close').click();
        await expect(page.getByText('Ready to Scan')).toHaveCount(0);
        await expect(page.getByTestId('shop-tap-nfc')).toBeVisible();
        return 'Overlay closed and shop view returned';
      });
    });
  });

  test('shop: log order from the customer profile', async ({ page }, testInfo) => {
    await seedVisibilityController(page);
    await seedSavedPersonalId(page, SIMULATOR_PRIMARY_PROFILE.nfc_id);

    await runScenario(testInfo, page, 'shop log order from customer profile', async ({ step }) => {
      await step('Open shop page', 'Shop scan view should render', async () => {
        await page.goto('/shop');
        await expect(page.getByTestId('shop-tap-nfc')).toBeVisible();
        return 'Shop scan view loaded';
      });

      await step('Open customer profile', 'The seeded chip should open the customer profile', async () => {
        await page.getByTestId('shop-tap-nfc').click();
        await page.waitForTimeout(NFC_SCAN_DELAY_MS + 500);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByText(SIMULATOR_PRIMARY_PREFERENCE.name)).toBeVisible();
        return `Opened shop profile for ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
      });

      await step('Log order', 'The shop should be able to add a completed order for the customer', async () => {
        await page.getByRole('button', { name: /^Order$/ }).click();
        await expect(page.getByRole('heading', { name: /Add Order/i })).toBeVisible();
        await page.getByPlaceholder('e.g. Extra shot added').fill('Extra hot, oat milk');
        await page.getByRole('button', { name: /Log Order/i }).click();
        await page.getByRole('button', { name: /History/i }).click();
        await expect(page.getByText('Extra hot, oat milk')).toBeVisible();
        return 'Logged an order and verified it in order history';
      });
    });
  });

  test('shop: chip management panel generates a personal ID', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'shop chip management panel generates a personal id', async ({ step }) => {
      await step('Open shop page', 'Chip management section should render in the sidebar', async () => {
        await page.goto('/shop');
        await expect(page.getByTestId('shop-tap-nfc')).toBeVisible();
        await expect(page.getByTestId('shop-chip-mgmt-personal-id')).toBeVisible();
        const id = await page.getByTestId('shop-chip-mgmt-personal-id').textContent();
        expect(id.trim()).toMatch(/^NFC-/);
        return `Chip management visible with personal ID ${id.trim()}`;
      });

      await step('Regenerate personal ID', 'New personal ID should still be NFC-prefixed', async () => {
        const before = (await page.getByTestId('shop-chip-mgmt-personal-id').textContent()).trim();
        await page.getByTestId('shop-chip-mgmt-generate').click();
        const after = await page.getByTestId('shop-chip-mgmt-personal-id').textContent();
        expect(after.trim()).toMatch(/^NFC-/);
        return `Regenerated personal ID from ${before} to ${after.trim()}`;
      });
    });
  });

  test('shop: chip management panel assigns chip to a customer profile', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'shop chip management panel assigns chip to customer', async ({ step }) => {
      await step('Open shop page', 'Shop scan view should render', async () => {
        await page.goto('/shop');
        await expect(page.getByTestId('shop-tap-nfc')).toBeVisible();
        return 'Shop scan view loaded';
      });

      await step('Find customer via chip management phone search', 'Customer name should appear in chip management preview', async () => {
        await page.getByTestId('shop-chip-mgmt-phone').fill(SIMULATOR_PRIMARY_PROFILE.phone);
        await page.getByTestId('shop-chip-mgmt-phone').press('Enter');
        await expect(page.getByTestId('shop-chip-mgmt-found-name')).toHaveText(SIMULATOR_PRIMARY_PROFILE.display_name);
        return `Found customer ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
      });

      await step('Confirm chip assignment', 'App should transition to customer profile view', async () => {
        await page.getByTestId('shop-chip-mgmt-assign').click();
        await expect(page.getByTestId('shop-customer-display-name')).toHaveText(SIMULATOR_PRIMARY_PROFILE.display_name);
        return `Chip assigned and customer view opened for ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
      });
    });
  });

  test('consumer: chip status shows linked when nfc_id is set', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer chip status shows linked when nfc id is set', async ({ step }) => {
      await step('Open consumer route with known personal ID', 'Profile should load with Chip Linked badge', async () => {
        await page.goto(`/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await expect(page.getByTestId('consumer-chip-status-badge')).toHaveText('Chip Linked');
        await expect(page.getByTestId('consumer-profile-nfc-id')).toHaveText(`NFC: ${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        return `Profile loaded with Chip Linked badge for NFC ID ${SIMULATOR_PRIMARY_PROFILE.nfc_id}`;
      });
    });
  });

  // ── Phase 3 — Consumer Profile Polish ───────────────────────────────────────

  test('consumer: inline display name edit saves the updated name', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer inline display name edit', async ({ step }) => {
      await step('Load profile via personal_id route', 'Profile card should show name with edit button', async () => {
        await page.goto(`/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page.getByTestId('consumer-profile-display-name')).toBeVisible();
        return `Profile ${SIMULATOR_PRIMARY_PROFILE.display_name} loaded with editable name`;
      });

      await step('Edit display name inline', 'Name should update after save', async () => {
        await page.getByTestId('consumer-profile-name-edit-btn').click({ force: true });
        await page.getByTestId('consumer-profile-name-input').fill('Maya Updated');
        await page.getByTestId('consumer-profile-name-input').press('Enter');
        await expect(page.getByTestId('consumer-profile-display-name')).toHaveText('Maya Updated');
        return 'Display name updated to Maya Updated';
      });
    });
  });

  test('consumer: history tab shows order count in stats bar', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer history tab shows order stats bar', async ({ step }) => {
      await step('Open history tab and verify stats bar', 'Stats bar should show order count', async () => {
        await page.goto(`/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await page.getByRole('button', { name: 'History' }).click();
        await expect(page.getByTestId('consumer-order-stats')).toBeVisible();
        const text = await page.getByTestId('consumer-order-stats').textContent();
        expect(text).toMatch(/1 order/);
        return `Stats bar shows: "${text.trim()}"`;
      });
    });
  });

  test('consumer: history shop filter narrows visible orders', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer history shop filter narrows orders', async ({ step }) => {
      await step('Load Alex profile and open History', 'Orders from two shops should be visible', async () => {
        await page.goto('/consumer');
        await page.getByPlaceholder('+972 50 000 0000').fill(PROFILE_ALEX.phone);
        await page.getByRole('button', { name: /Sign In/i }).click();
        await expect(page.getByText(PROFILE_ALEX.display_name)).toBeVisible();
        await page.getByRole('button', { name: 'History' }).click();
        await expect(page.getByText(PREF_ALEX_FLAT_WHITE.name).first()).toBeVisible();
        await expect(page.getByText(PREF_ALEX_ICED_AMERICANO.name).first()).toBeVisible();
        return `Both orders from two shops visible for ${PROFILE_ALEX.display_name}`;
      });

      await step('Filter by first shop', 'Only orders from that shop should remain', async () => {
        await page.getByTestId('consumer-filter-shop').selectOption(SIMULATOR_SHOP_1.name);
        await expect(page.getByText(PREF_ALEX_FLAT_WHITE.name).first()).toBeVisible();
        await expect(page.getByText(PREF_ALEX_ICED_AMERICANO.name).first()).not.toBeVisible();
        return `Filtered to ${SIMULATOR_SHOP_1.name}: only ${PREF_ALEX_FLAT_WHITE.name} visible`;
      });
    });
  });

  test('consumer: new preference flow supports preset and custom coffee types', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer new preference flow supports custom coffee types', async ({ step }) => {
      await step('Open profile and launch add flow', 'Preference stepper should start on Coffee Type', async () => {
        await page.goto(`/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await page.getByRole('button', { name: /Add Coffee Preference/i }).click();
        await expect(page.getByText('Step 1 of 4 — Coffee Type')).toBeVisible();
        return 'Preference stepper opened on Coffee Type';
      });

      await step('Use custom coffee type and select high strength', 'The new step flow should save a custom coffee type without espresso dose controls', async () => {
        await page.getByRole('button', { name: 'Other' }).click();
        await page.getByPlaceholder('Enter coffee type').fill('Cortado');
        await page.getByRole('button', { name: /Next — Cup & Size/i }).click();
        await expect(page.getByText('Step 2 of 4 — Cup & Size')).toBeVisible();
        await expect(page.getByText(/Espresso dose/i)).toHaveCount(0);
        await page.getByRole('button', { name: /Next — Details/i }).click();
        await expect(page.getByText('Step 3 of 4 — Details')).toBeVisible();
        await page.getByTestId('strength-option-high').click();
        await page.getByRole('button', { name: /Next — Name & Save/i }).click();
        await page.getByPlaceholder('e.g. Morning Latte').fill('Night Cortado');
        await page.getByRole('button', { name: /Add Preference/i }).click();
        await expect(page.getByText('Night Cortado')).toBeVisible();
        await expect(page.getByText('Cortado', { exact: true })).toBeVisible();
        await expect(page.getByText('High strength', { exact: true })).toBeVisible();
        return 'Saved a new preference with custom coffee type Cortado and high strength';
      });
    });
  });

  test('consumer: editing legacy strength maps to the new strength selector', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer editing legacy strength maps to new selector', async ({ step }) => {
      await step('Open existing default preference for edit', 'The editor should load the legacy value into the new stepper', async () => {
        await page.goto(`/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await page.getByRole('button', { name: 'Edit', exact: true }).click();
        await expect(page.getByText('Step 1 of 4 — Coffee Type')).toBeVisible();
        return 'Edit preference flow opened';
      });

      await step('Navigate to Details and verify mapped strength', 'Legacy strength \"2\" should map to High in the UI', async () => {
        await page.getByRole('button', { name: /Next — Cup & Size/i }).click();
        await page.getByRole('button', { name: /Next — Details/i }).click();
        await expect(page.getByTestId('strength-option-high')).toHaveAttribute('aria-pressed', 'true');
        await page.getByRole('button', { name: /Next — Name & Save/i }).click();
        await page.getByRole('button', { name: /Save Changes/i }).click();
        await expect(page.getByText(/High strength/i).first()).toBeVisible();
        return 'Legacy strength value mapped to High and saved through the new flow';
      });
    });
  });

  test('consumer: reorder opens preference form pre-filled with snapshot', async ({ page }, testInfo) => {
    await runScenario(testInfo, page, 'consumer reorder opens preference form with snapshot', async ({ step }) => {
      await step('Open History tab and find Reorder button', 'Reorder button should appear on the order card', async () => {
        await page.goto(`/consumer?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`);
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        await page.getByRole('button', { name: 'History' }).click();
        await expect(page.getByTestId(`reorder-btn-${SIMULATOR_PRIMARY_ORDER.id}`)).toBeVisible();
        return `Reorder button visible for order ${SIMULATOR_PRIMARY_ORDER.id}`;
      });

      await step('Click Reorder', 'Preference form should open as New Preference', async () => {
        await page.getByTestId(`reorder-btn-${SIMULATOR_PRIMARY_ORDER.id}`).click();
        await expect(page.getByText('New Preference')).toBeVisible();
        return 'Preference stepper opened as New Preference for reorder';
      });
    });
  });

  test('consumer: chip status shows unlinked when nfc_id is empty', async ({ page }, testInfo) => {
    const NO_CHIP_PROFILE = {
      id: 'profile_sim_nochip',
      user_email: 'nochip@tapcup.local',
      display_name: 'No Chip User',
      phone: '+15550000099',
      nfc_id: '',
      avatar_url: '',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    await page.addInitScript(({ storageKey, extraProfile }) => {
      const raw = window.localStorage.getItem(storageKey);
      const state = raw ? JSON.parse(raw) : {};
      const profiles = Array.isArray(state.CoffeeProfile) ? state.CoffeeProfile : [];
      if (!profiles.find(p => p.id === extraProfile.id)) {
        profiles.push(extraProfile);
      }
      state.CoffeeProfile = profiles;
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }, { storageKey: 'tapcup_simulator_db_v1', extraProfile: NO_CHIP_PROFILE });

    await runScenario(testInfo, page, 'consumer chip status shows unlinked when nfc id is empty', async ({ step }) => {
      await step('Open identify screen', 'Identify screen should be visible', async () => {
        await page.goto('/consumer');
        await expect(page.getByText('Welcome Back')).toBeVisible();
        return 'Identify screen loaded';
      });

      await step('Sign in with no-chip profile', 'No Chip badge should be shown in the profile header', async () => {
        await page.getByPlaceholder('+972 50 000 0000').fill(NO_CHIP_PROFILE.phone);
        await page.getByRole('button', { name: /Sign In/i }).click();
        await expect(page.getByText(NO_CHIP_PROFILE.display_name)).toBeVisible();
        await expect(page.getByTestId('consumer-chip-status-badge')).toHaveText('No Chip');
        return `Profile loaded with No Chip badge for ${NO_CHIP_PROFILE.display_name}`;
      });
    });
  });
});
