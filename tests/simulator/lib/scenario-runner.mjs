import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'simulator-artifacts');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'scenario';
}

function truncate(value, max = 500) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export async function runScenario(testInfo, page, name, execute) {
  await ensureOutputDir();
  const slug = slugify(name);
  const report = {
    name,
    slug,
    startedAt: new Date().toISOString(),
    status: 'running',
    steps: [],
    artifacts: {},
  };
  const logLines = [];

  async function writeArtifacts() {
    const jsonPath = path.join(OUTPUT_DIR, `${slug}.json`);
    const logPath = path.join(OUTPUT_DIR, `${slug}.log`);
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
    await fs.writeFile(logPath, `${logLines.join('\n')}\n`);
    report.artifacts.json = jsonPath;
    report.artifacts.log = logPath;
  }

  async function step(stepName, expected, action) {
    const startedAt = new Date().toISOString();
    const entry = {
      name: stepName,
      expected,
      actual: '',
      status: 'running',
      startedAt,
    };

    try {
      const actual = await action();
      entry.actual = typeof actual === 'string' ? actual : 'passed';
      entry.status = 'passed';
      return actual;
    } catch (error) {
      const screenshotPath = path.join(OUTPUT_DIR, `${slug}-${slugify(stepName)}.png`);
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        report.artifacts.screenshot = screenshotPath;
      } catch {
        // Ignore screenshot errors; the JSON log still captures the failure.
      }

      let bodyText = '';
      try {
        bodyText = await page.locator('body').innerText();
      } catch {
        bodyText = '';
      }

      entry.actual = truncate(bodyText || page.url());
      entry.status = 'failed';
      entry.error = error?.message || 'Step failed';
      entry.screenshot = screenshotPath;
      throw error;
    } finally {
      entry.finishedAt = new Date().toISOString();
      report.steps.push(entry);
      logLines.push(
        `[${entry.status.toUpperCase()}] ${stepName}\n` +
        `  expected: ${expected}\n` +
        `  actual: ${truncate(entry.actual || '')}${entry.error ? `\n  error: ${entry.error}` : ''}`
      );
    }
  }

  try {
    await execute({ step, report });
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.error = {
      message: error?.message || 'Scenario failed',
      stack: error?.stack || '',
    };
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    await writeArtifacts();
    await testInfo.attach(`${slug}.json`, {
      path: path.join(OUTPUT_DIR, `${slug}.json`),
      contentType: 'application/json',
    }).catch(() => {});
  }
}
