import { existsSync, mkdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const mode = args.find((value) => !value.startsWith('-')) || 'all';
const reportOnly = args.includes('--report');
const artifactDir = path.resolve(process.cwd(), 'simulator-artifacts');
const playwrightBin = process.platform === 'win32' ? 'playwright.cmd' : 'playwright';
const playwrightPath = path.resolve(process.cwd(), 'node_modules', '.bin', playwrightBin);

mkdirSync(artifactDir, { recursive: true });

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

function runPlaywright() {
  const playwrightArgs = ['test', '-c', 'playwright.simulator.config.js'];
  if (mode !== 'all') {
    playwrightArgs.push('--grep', mode);
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
  runPlaywright();
}
