import { expect, test } from '@playwright/test';
import {
  SIMULATOR_PRIMARY_PREFERENCE,
  SIMULATOR_PRIMARY_PROFILE,
} from '../../src/lib/simulator/fixtures.js';
import { runScenario } from './lib/scenario-runner.mjs';

const PERSONAL_ID_STORAGE_KEY = 'tapcup_last_personal_id';
const UNKNOWN_PERSONAL_ID = 'SIM-NEW-0001';

async function seedSavedPersonalId(page, personalId) {
  await page.addInitScript(
    ({ storageKey, value }) => {
      window.localStorage.setItem(storageKey, value);
    },
    { storageKey: PERSONAL_ID_STORAGE_KEY, value: personalId }
  );
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
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.nfc_id)).toBeVisible();
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
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.nfc_id)).toBeVisible();
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
        await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${SIMULATOR_PRIMARY_PROFILE.nfc_id}`));
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return 'Saved chip id restored the profile route';
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
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.display_name)).toBeVisible();
        return `Opened shop profile for ${SIMULATOR_PRIMARY_PROFILE.display_name}`;
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
        await expect(page.getByText(SIMULATOR_PRIMARY_PROFILE.nfc_id)).toBeVisible();
        return `Opened shop profile for ${SIMULATOR_PRIMARY_PROFILE.display_name} by phone`;
      });
    });
  });
});
