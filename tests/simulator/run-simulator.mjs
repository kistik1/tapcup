import { existsSync, mkdirSync } from 'node:fs';
import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
let mode = 'all';
let reportOnly = false;
let chipUrl = '';
let side = '';
const artifactDir = path.resolve(process.cwd(), 'simulator-artifacts');
const playwrightBin = process.platform === 'win32' ? 'playwright.cmd' : 'playwright';
const playwrightPath = path.resolve(process.cwd(), 'node_modules', '.bin', playwrightBin);

mkdirSync(artifactDir, { recursive: true });

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--report') {
    reportOnly = true;
    continue;
  }
  if (arg === '--consumer-chip-id' || arg === '--chip-id' || arg === '--chip-url') {
    const next = args[i + 1];
    if (next && !next.startsWith('-')) {
      chipUrl = next;
      i += 1;
    }
    continue;
  }
  if (arg.startsWith('--consumer-chip-id=')) {
    chipUrl = arg.split('=')[1] || '';
    continue;
  }
  if (arg.startsWith('--chip-id=')) {
    chipUrl = arg.split('=')[1] || '';
    continue;
  }
  if (arg.startsWith('--chip-url=')) {
    chipUrl = arg.split('=')[1] || '';
    continue;
  }
  if (arg === '--side') {
    const next = args[i + 1];
    if (next && !next.startsWith('-')) {
      side = next;
      i += 1;
    }
    continue;
  }
  if (arg.startsWith('--side=')) {
    side = arg.split('=')[1] || '';
    continue;
  }
  if (!arg.startsWith('-') && mode === 'all') {
    mode = arg;
  }
}

if (chipUrl) {
  process.env.VITE_TAPCUP_SIMULATOR_CHIP_URL = chipUrl;
  process.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID = chipUrl;
}
if (side) {
  process.env.VITE_TAPCUP_SIMULATOR_SIDE = side;
}

async function showReportSummary() {
  if (!existsSync(artifactDir)) {
    console.log('No simulator artifacts found.');
    return;
  }

  const files = (await readdir(artifactDir)).filter((file) => file.endsWith('.json') && file !== 'playwright-report.json');
  if (files.length === 0) {
    console.log(`No JSON simulator reports found in ${artifactDir}`);
    return;
  }

  for (const file of files.sort()) {
    const content = JSON.parse(await readFile(path.join(artifactDir, file), 'utf8'));
    console.log(`${content.status.toUpperCase()} ${content.name}`);
    for (const step of content.steps || []) {
      console.log(`  - ${step.status.toUpperCase()} ${step.name}`);
      console.log(`    expected: ${step.expected}`);
      console.log(`    actual: ${step.actual}`);
    }
    if (content.artifacts?.screenshot) {
      console.log(`  screenshot: ${content.artifacts.screenshot}`);
    }
    if (content.artifacts?.json) {
      console.log(`  json: ${content.artifacts.json}`);
    }
    if (content.artifacts?.log) {
      console.log(`  log: ${content.artifacts.log}`);
    }
  }
}

async function showRunSummary() {
  const reportPath = path.join(artifactDir, 'playwright-report.json');
  if (!existsSync(reportPath)) {
    console.log(`No Playwright simulator report found in ${artifactDir}`);
    return;
  }

  const root = JSON.parse(await readFile(reportPath, 'utf8'));
  const reports = [];
  let passed = 0;
  let failed = 0;

  function collectSpecs(suites = []) {
    const specs = [];
    for (const suite of suites) {
      if (Array.isArray(suite.specs)) {
        specs.push(...suite.specs);
      }
      if (Array.isArray(suite.suites) && suite.suites.length > 0) {
        specs.push(...collectSpecs(suite.suites));
      }
    }
    return specs;
  }

  const specs = collectSpecs(root.suites || []);
  for (const spec of specs.sort((a, b) => a.title.localeCompare(b.title))) {
    const test = spec.tests?.[0];
    const result = test?.results?.[0];
    const attachments = result?.attachments || [];
    const status = result?.status === 'passed' ? 'passed' : 'failed';
    reports.push({
      name: spec.title,
      status,
      attachments,
    });
    if (status === 'passed') passed += 1;
    else failed += 1;
  }

  console.log(`Simulator summary: ${passed} passed, ${failed} failed, ${reports.length} total`);
  for (const report of reports) {
    console.log(`${report.status.toUpperCase()} ${report.name}`);
    for (const attachment of report.attachments) {
      if (attachment?.path) {
        console.log(`  attachment: ${attachment.path}`);
      }
    }
  }
}

async function clearScenarioArtifacts() {
  if (!existsSync(artifactDir)) return;
  const files = await readdir(artifactDir);
  await Promise.all(
    files
      .filter((file) => file !== 'playwright-report.json' && (file.endsWith('.json') || file.endsWith('.log') || file.endsWith('.png')))
      .map((file) => unlink(path.join(artifactDir, file)).catch(() => {}))
  );
}

async function runPlaywright() {
  await clearScenarioArtifacts();
  const playwrightArgs = ['test', '-c', 'playwright.simulator.config.js'];
  if (mode === 'nfc') {
    playwrightArgs.push('--grep', 'canonical chip url flag');
  }
  if (mode !== 'all') {
    if (mode !== 'nfc') {
      playwrightArgs.push('--grep', mode);
    }
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
  await showRunSummary();
}
