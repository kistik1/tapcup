import { existsSync, mkdirSync } from 'node:fs';
import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const artifactDir = path.resolve(process.cwd(), 'profiling-artifacts');
const playwrightBin = process.platform === 'win32' ? 'playwright.cmd' : 'playwright';
const playwrightPath = path.resolve(process.cwd(), 'node_modules', '.bin', playwrightBin);
const requiredEnv = [
  'TAPCUP_PROFILE_A_ID',
  'TAPCUP_PROFILE_A_PHONE',
  'TAPCUP_PROFILE_B_ID',
  'TAPCUP_PROFILE_B_PHONE',
];

let reportOnly = false;
let grep = '';

mkdirSync(artifactDir, { recursive: true });

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--report') {
    reportOnly = true;
    continue;
  }
  if (arg === '--grep') {
    const next = args[i + 1];
    if (next && !next.startsWith('-')) {
      grep = next;
      i += 1;
    }
    continue;
  }
  if (arg.startsWith('--grep=')) {
    grep = arg.split('=').slice(1).join('=') || '';
  }
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(1));
}

function collectMetric(values, metricName) {
  return values
    .map((run) => run.metrics?.[metricName])
    .filter((value) => typeof value === 'number' && Number.isFinite(value));
}

function missingEnvKeys() {
  return requiredEnv.filter((key) => !process.env[key]?.trim());
}

async function clearScenarioArtifacts() {
  if (!existsSync(artifactDir)) return;
  const files = await readdir(artifactDir);
  await Promise.all(
    files
      .filter((file) => file !== 'playwright-report.json' && file.endsWith('.json'))
      .map((file) => unlink(path.join(artifactDir, file)).catch(() => {}))
  );
}

async function showReportSummary() {
  if (!existsSync(artifactDir)) {
    console.log('No profiling artifacts found.');
    return;
  }

  const files = (await readdir(artifactDir))
    .filter((file) => file.endsWith('.json') && file !== 'playwright-report.json');
  if (files.length === 0) {
    console.log(`No JSON profiling reports found in ${artifactDir}`);
    return;
  }

  for (const file of files.sort()) {
    const content = JSON.parse(await readFile(path.join(artifactDir, file), 'utf8'));
    const runs = content.runs || [];
    console.log(`${content.status.toUpperCase()} ${content.name}`);
    const passedRuns = runs.filter((run) => run.status === 'passed');

    for (const consumerKey of ['A', 'B']) {
      const consumerRuns = passedRuns.filter((run) => run.consumerKey === consumerKey);
      if (consumerRuns.length === 0) continue;

      const profileReadyMedian = median(collectMetric(consumerRuns, 'profileReadyMs'));
      const optionsReadyMedian = median(collectMetric(consumerRuns, 'optionsReadyMs'));
      const historyMedian = median(collectMetric(consumerRuns, 'historyTabOpenMs'));

      const metrics = [
        profileReadyMedian != null ? `profile median ${profileReadyMedian}ms` : null,
        optionsReadyMedian != null ? `options median ${optionsReadyMedian}ms` : null,
        historyMedian != null ? `history median ${historyMedian}ms` : null,
      ].filter(Boolean).join(' · ');

      console.log(`  - Consumer ${consumerKey}: ${consumerRuns.length} passed run(s)${metrics ? ` · ${metrics}` : ''}`);
    }

    const failedRuns = runs.filter((run) => run.status === 'failed');
    for (const run of failedRuns) {
      console.log(`  - FAILED Consumer ${run.consumerKey} iteration ${run.iteration}: ${run.error?.message || 'Run failed'}`);
    }

    if (content.artifacts?.json) {
      console.log(`  json: ${content.artifacts.json}`);
    }
  }
}

async function runPlaywright() {
  const missing = missingEnvKeys();
  if (missing.length > 0) {
    console.error(`Missing profiling env: ${missing.join(', ')}`);
    console.error('Set the two real consumer IDs and phone numbers before running profiling.');
    process.exitCode = 1;
    return;
  }

  await clearScenarioArtifacts();
  const playwrightArgs = ['test', '-c', 'playwright.consumer-profile.config.js'];
  if (grep) {
    playwrightArgs.push('--grep', grep);
  }

  const result = spawnSync(playwrightPath, playwrightArgs, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    console.error('Install dependencies first: npm install');
    process.exitCode = 1;
    return;
  }

  process.exitCode = result.status ?? 0;
}

if (reportOnly) {
  await showReportSummary();
} else {
  await runPlaywright();
  await showReportSummary();
}
