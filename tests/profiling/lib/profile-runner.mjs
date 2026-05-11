import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'profiling-artifacts');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'profile';
}

function truncate(value, max = 500) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export async function runProfileScenario(testInfo, name, execute) {
  await ensureOutputDir();
  const slug = slugify(name);
  const report = {
    name,
    slug,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    status: 'running',
    runs: [],
    summary: {},
    artifacts: {},
  };

  function addRun(run) {
    report.runs.push(run);
  }

  function finalizeSummary() {
    const passed = report.runs.filter((run) => run.status === 'passed').length;
    const failed = report.runs.filter((run) => run.status === 'failed').length;
    const skipped = report.runs.filter((run) => run.status === 'skipped').length;
    report.summary = {
      passed,
      failed,
      skipped,
      total: report.runs.length,
    };
  }

  async function writeArtifacts() {
    const jsonPath = path.join(OUTPUT_DIR, `${slug}.json`);
    report.artifacts.json = jsonPath;
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  }

  try {
    await execute({ addRun, report });
    report.status = report.runs.some((run) => run.status === 'failed') ? 'failed' : 'passed';
  } catch (error) {
    report.status = 'failed';
    report.error = {
      message: error?.message || 'Scenario failed',
      stack: error?.stack || '',
    };
    throw error;
  } finally {
    finalizeSummary();
    report.finishedAt = new Date().toISOString();
    await writeArtifacts();
    await testInfo.attach(`${slug}.json`, {
      path: path.join(OUTPUT_DIR, `${slug}.json`),
      contentType: 'application/json',
    }).catch(() => {});
  }
}

export function buildFailedRun({ consumerKey, iteration, route, error, phase = '' }) {
  return {
    consumerKey,
    iteration,
    route,
    phase,
    status: 'failed',
    error: {
      message: error?.message || 'Run failed',
      stack: truncate(error?.stack || ''),
    },
    finishedAt: new Date().toISOString(),
  };
}
