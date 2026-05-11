import { performance as nodePerformance } from 'node:perf_hooks';
import { expect, test } from '@playwright/test';
import { buildFailedRun, runProfileScenario } from './lib/profile-runner.mjs';

const REQUIRED_ENV = [
  'TAPCUP_PROFILE_A_ID',
  'TAPCUP_PROFILE_A_PHONE',
  'TAPCUP_PROFILE_B_ID',
  'TAPCUP_PROFILE_B_PHONE',
];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
test.skip(missingEnv.length > 0, `Missing profiling env: ${missingEnv.join(', ')}`);

const iterations = Number.parseInt(process.env.TAPCUP_PROFILE_ITERATIONS || '3', 10);
const consumers = [
  {
    key: 'A',
    personalId: process.env.TAPCUP_PROFILE_A_ID?.trim(),
    phone: process.env.TAPCUP_PROFILE_A_PHONE?.trim(),
  },
  {
    key: 'B',
    personalId: process.env.TAPCUP_PROFILE_B_ID?.trim(),
    phone: process.env.TAPCUP_PROFILE_B_PHONE?.trim(),
  },
];

const PERSONAL_ID_STORAGE_KEY = 'tapcup_last_personal_id';
const CHECKPOINT_TIMEOUT_MS = 20_000;
const NFC_SCAN_DELAY_MS = 20_500;

async function createPage(browser, initScript = null) {
  const context = await browser.newContext();
  if (initScript) {
    await context.addInitScript(initScript.fn, initScript.args);
  }
  const page = await context.newPage();
  return { context, page };
}

function savedPersonalIdInit(personalId) {
  return {
    fn: ({ storageKey, value }) => {
      window.localStorage.setItem(storageKey, value);
    },
    args: { storageKey: PERSONAL_ID_STORAGE_KEY, value: personalId },
  };
}

async function getNavigationTiming(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    if (!nav) return null;
    return {
      type: nav.type,
      domContentLoadedMs: nav.domContentLoadedEventEnd,
      responseEndMs: nav.responseEnd,
      loadEventMs: nav.loadEventEnd,
      durationMs: nav.duration,
    };
  });
}

async function waitForAnyVisible(locators, timeout = CHECKPOINT_TIMEOUT_MS) {
  await Promise.any(locators.map((locator) => locator.waitFor({ state: 'visible', timeout })));
}

async function waitForIdentifyScreen(page) {
  await expect(page.getByText('Welcome Back')).toBeVisible({ timeout: CHECKPOINT_TIMEOUT_MS });
}

async function waitForConsumerProfile(page) {
  await expect(page.getByTestId('consumer-profile-nfc-id')).toBeVisible({ timeout: CHECKPOINT_TIMEOUT_MS });
  await waitForAnyVisible([
    page.getByRole('button', { name: /My Coffees/i }),
    page.getByRole('button', { name: /History/i }),
  ]);
}

async function waitForPreferencesReady(page) {
  await waitForAnyVisible([
    page.getByText('Default Order'),
    page.getByRole('button', { name: /Add Coffee Preference/i }),
    page.getByRole('button', { name: /Create My First Order/i }),
    page.getByText('Other Preferences'),
  ]);
}

async function waitForHistoryReady(page) {
  await waitForAnyVisible([
    page.getByText('No orders yet'),
    page.getByTestId('consumer-order-stats'),
    page.getByTestId('consumer-filter-date'),
    page.getByText('Note:').first(),
  ]);
}

async function captureDirectRouteRun(page, consumer) {
  const route = `/consumer?personal_id=${encodeURIComponent(consumer.personalId)}`;
  const navigationStart = nodePerformance.now();
  await page.goto(route);
  const navigationTiming = await getNavigationTiming(page);
  await waitForConsumerProfile(page);
  const profileReadyMs = Number((nodePerformance.now() - navigationStart).toFixed(1));
  const prefsStart = nodePerformance.now();
  await waitForPreferencesReady(page);
  const optionsReadyMs = Number((nodePerformance.now() - prefsStart).toFixed(1));

  return {
    consumerKey: consumer.key,
    iterationRoute: route,
    inputType: 'route',
    status: 'passed',
    metrics: {
      profileReadyMs,
      optionsReadyMs,
      navigation: navigationTiming,
    },
    checkpoints: ['profile_visible', 'preferences_ready'],
  };
}

async function captureManualLookupRun(page, consumer, type) {
  const route = '/consumer';
  await page.goto(route);
  await waitForIdentifyScreen(page);

  const actionStart = nodePerformance.now();
  if (type === 'phone') {
    await page.getByPlaceholder('+972 50 000 0000').fill(consumer.phone);
    await page.getByRole('button', { name: /Sign In/i }).click();
  } else {
    await page.getByPlaceholder('Personal ID').first().fill(consumer.personalId);
    await page.getByRole('button', { name: /Search by NFC ID/i }).click();
  }

  await waitForConsumerProfile(page);
  const profileReadyMs = Number((nodePerformance.now() - actionStart).toFixed(1));
  const prefsStart = nodePerformance.now();
  await waitForPreferencesReady(page);
  const optionsReadyMs = Number((nodePerformance.now() - prefsStart).toFixed(1));

  return {
    consumerKey: consumer.key,
    iterationRoute: route,
    inputType: type,
    status: 'passed',
    metrics: {
      profileReadyMs,
      optionsReadyMs,
    },
    checkpoints: ['identify_visible', 'profile_visible', 'preferences_ready'],
  };
}

async function captureSavedChipRun(page, consumer) {
  const route = '/consumer';
  await page.goto(route);
  await waitForIdentifyScreen(page);

  const actionStart = nodePerformance.now();
  await page.getByTestId('consumer-tap-nfc').click();
  await expect(page.getByText('Ready to Scan')).toBeVisible({ timeout: CHECKPOINT_TIMEOUT_MS });
  const overlayVisibleMs = Number((nodePerformance.now() - actionStart).toFixed(1));

  await page.waitForTimeout(NFC_SCAN_DELAY_MS);
  await expect(page).toHaveURL(new RegExp(`/consumer\\?personal_id=${consumer.personalId}`), { timeout: CHECKPOINT_TIMEOUT_MS });
  await waitForConsumerProfile(page);
  const profileReadyMs = Number((nodePerformance.now() - actionStart).toFixed(1));

  return {
    consumerKey: consumer.key,
    iterationRoute: route,
    inputType: 'saved_chip',
    status: 'passed',
    metrics: {
      overlayVisibleMs,
      profileReadyMs,
    },
    checkpoints: ['identify_visible', 'scan_overlay_visible', 'profile_visible'],
  };
}

async function captureReloadRun(page, consumer) {
  const route = `/consumer?personal_id=${encodeURIComponent(consumer.personalId)}`;
  await page.goto(route);
  await waitForConsumerProfile(page);

  const reloadStart = nodePerformance.now();
  await page.reload();
  const navigationTiming = await getNavigationTiming(page);
  await waitForConsumerProfile(page);
  const profileReadyMs = Number((nodePerformance.now() - reloadStart).toFixed(1));
  const prefsStart = nodePerformance.now();
  await waitForPreferencesReady(page);
  const optionsReadyMs = Number((nodePerformance.now() - prefsStart).toFixed(1));

  return {
    consumerKey: consumer.key,
    iterationRoute: route,
    inputType: 'reload',
    status: 'passed',
    metrics: {
      profileReadyMs,
      optionsReadyMs,
      navigation: navigationTiming,
    },
    checkpoints: ['profile_visible', 'preferences_ready'],
  };
}

async function captureSignOutReentryRun(page, consumer) {
  const route = `/consumer?personal_id=${encodeURIComponent(consumer.personalId)}`;
  await page.goto(route);
  await waitForConsumerProfile(page);

  const signOutStart = nodePerformance.now();
  await page.getByTestId('consumer-sign-out').click();
  await waitForIdentifyScreen(page);
  const signOutToIdentifyMs = Number((nodePerformance.now() - signOutStart).toFixed(1));

  const reentryStart = nodePerformance.now();
  await page.getByTestId('consumer-tap-nfc').click();
  await page.waitForTimeout(NFC_SCAN_DELAY_MS);
  await waitForConsumerProfile(page);
  const profileReadyMs = Number((nodePerformance.now() - reentryStart).toFixed(1));

  return {
    consumerKey: consumer.key,
    iterationRoute: route,
    inputType: 'signout_reentry',
    status: 'passed',
    metrics: {
      signOutToIdentifyMs,
      profileReadyMs,
    },
    checkpoints: ['identify_visible', 'profile_visible'],
  };
}

async function captureOptionsRun(page, consumer) {
  const route = `/consumer?personal_id=${encodeURIComponent(consumer.personalId)}`;
  await page.goto(route);
  await waitForConsumerProfile(page);
  await waitForPreferencesReady(page);

  const metrics = {};
  const checkpoints = [];

  let start = nodePerformance.now();
  await page.getByRole('button', { name: /History/i }).click();
  await waitForHistoryReady(page);
  metrics.historyTabOpenMs = Number((nodePerformance.now() - start).toFixed(1));
  checkpoints.push('history_ready');

  start = nodePerformance.now();
  await page.getByRole('button', { name: /My Coffees/i }).click();
  await waitForPreferencesReady(page);
  metrics.preferencesTabOpenMs = Number((nodePerformance.now() - start).toFixed(1));
  checkpoints.push('preferences_ready');

  start = nodePerformance.now();
  await page.getByTestId('consumer-profile-name-edit-btn').click();
  await expect(page.getByTestId('consumer-profile-name-input')).toBeVisible({ timeout: CHECKPOINT_TIMEOUT_MS });
  metrics.nameEditOpenMs = Number((nodePerformance.now() - start).toFixed(1));
  await page.getByRole('button', { name: /Cancel/i }).first().click();
  checkpoints.push('name_edit_open');

  start = nodePerformance.now();
  await page.getByTestId('consumer-profile-phone').click();
  await expect(page.getByTestId('consumer-profile-phone-input')).toBeVisible({ timeout: CHECKPOINT_TIMEOUT_MS });
  metrics.phoneEditOpenMs = Number((nodePerformance.now() - start).toFixed(1));
  await page.getByRole('button', { name: /Cancel/i }).last().click();
  checkpoints.push('phone_edit_open');

  if (await page.getByLabel(/Share my order/i).count()) {
    start = nodePerformance.now();
    await page.getByLabel(/Share my order/i).click();
    await waitForAnyVisible([
      page.getByText(/Share/i),
      page.getByText(/QR/i),
      page.getByRole('button', { name: /Close/i }),
    ]);
    metrics.shareSheetOpenMs = Number((nodePerformance.now() - start).toFixed(1));
    checkpoints.push('share_sheet_open');
    await page.keyboard.press('Escape');
  } else {
    metrics.shareSheetOpenMs = null;
    checkpoints.push('share_sheet_unavailable');
  }

  if (await page.getByRole('button', { name: /Request Replacement/i }).count()) {
    start = nodePerformance.now();
    await page.getByRole('button', { name: /Request Replacement/i }).click();
    await expect(page.getByText('Request Chip Replacement')).toBeVisible({ timeout: CHECKPOINT_TIMEOUT_MS });
    metrics.replacementModalOpenMs = Number((nodePerformance.now() - start).toFixed(1));
    checkpoints.push('replacement_modal_open');
    await page.keyboard.press('Escape');
  } else {
    metrics.replacementModalOpenMs = null;
    checkpoints.push('replacement_modal_unavailable');
  }

  return {
    consumerKey: consumer.key,
    iterationRoute: route,
    inputType: 'options',
    status: 'passed',
    metrics,
    checkpoints,
  };
}

async function runScenarioForConsumers(browser, addRun, scenarioName, capture) {
  for (const consumer of consumers) {
    for (let iteration = 1; iteration <= iterations; iteration += 1) {
      let context;
      let page;
      const initScript = capture.savedChip ? savedPersonalIdInit(consumer.personalId) : null;

      try {
        ({ context, page } = await createPage(browser, initScript));
        const run = await capture.execute(page, consumer);
        addRun({
          scenario: scenarioName,
          consumerKey: consumer.key,
          iteration,
          route: run.iterationRoute,
          inputType: run.inputType,
          status: run.status,
          metrics: run.metrics,
          checkpoints: run.checkpoints,
          finishedAt: new Date().toISOString(),
        });
      } catch (error) {
        addRun(buildFailedRun({
          consumerKey: consumer.key,
          iteration,
          route: page?.url?.() || '/consumer',
          error,
          phase: scenarioName,
        }));
        throw error;
      } finally {
        await context?.close().catch(() => {});
      }
    }
  }
}

test('consumer profile: direct route load', async ({ browser }, testInfo) => {
  await runProfileScenario(testInfo, 'consumer profile direct route load', async ({ addRun }) => {
    await runScenarioForConsumers(browser, addRun, 'direct_route', {
      execute: captureDirectRouteRun,
    });
  });
});

test('consumer profile: manual phone lookup', async ({ browser }, testInfo) => {
  await runProfileScenario(testInfo, 'consumer profile manual phone lookup', async ({ addRun }) => {
    await runScenarioForConsumers(browser, addRun, 'manual_phone', {
      execute: (page, consumer) => captureManualLookupRun(page, consumer, 'phone'),
    });
  });
});

test('consumer profile: manual NFC ID lookup', async ({ browser }, testInfo) => {
  await runProfileScenario(testInfo, 'consumer profile manual nfc id lookup', async ({ addRun }) => {
    await runScenarioForConsumers(browser, addRun, 'manual_nfc', {
      execute: (page, consumer) => captureManualLookupRun(page, consumer, 'manual_nfc'),
    });
  });
});

test('consumer profile: saved chip flow', async ({ browser }, testInfo) => {
  await runProfileScenario(testInfo, 'consumer profile saved chip flow', async ({ addRun }) => {
    await runScenarioForConsumers(browser, addRun, 'saved_chip', {
      savedChip: true,
      execute: captureSavedChipRun,
    });
  });
});

test('consumer profile: reload routed profile', async ({ browser }, testInfo) => {
  await runProfileScenario(testInfo, 'consumer profile reload routed profile', async ({ addRun }) => {
    await runScenarioForConsumers(browser, addRun, 'reload', {
      execute: captureReloadRun,
    });
  });
});

test('consumer profile: sign out and re-entry', async ({ browser }, testInfo) => {
  await runProfileScenario(testInfo, 'consumer profile sign out and re-entry', async ({ addRun }) => {
    await runScenarioForConsumers(browser, addRun, 'signout_reentry', {
      savedChip: true,
      execute: captureSignOutReentryRun,
    });
  });
});

test('consumer profile: loaded page options', async ({ browser }, testInfo) => {
  await runProfileScenario(testInfo, 'consumer profile loaded page options', async ({ addRun }) => {
    await runScenarioForConsumers(browser, addRun, 'loaded_options', {
      execute: captureOptionsRun,
    });
  });
});
