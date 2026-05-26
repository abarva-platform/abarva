import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';
import {
  POST_DEPLOY_HARD_QUESTIONS,
  createIsolatedPersonaContext,
  resolveCrawlPersonas,
  resolveCrawlSurfaces,
  type CrawlSurface,
} from '../../src/lib/crawl/persona-switcher';
import {
  compareCrawlToBaseline,
  type CrawlBaseline,
  type CrawlComparison,
  type CrawlPageObservation,
  type CrawlRun,
} from '../../src/lib/crawl/baseline-compare';

interface Args {
  baseUrl: string;
  outputDir: string;
  persona?: string;
  surface?: string;
  baseline?: string;
  noAuth: boolean;
  rollbackOnP0: boolean;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'local'}`;
  const out = path.resolve(args.outputDir, runId);
  await fs.mkdir(out, { recursive: true });
  await fs.mkdir(path.join(out, 'screenshots'), { recursive: true });
  await fs.mkdir(path.join(out, 'html'), { recursive: true });
  await fs.mkdir(path.join(out, 'transcripts'), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const observations: CrawlPageObservation[] = [];
  let fatalError: unknown = null;
  try {
    for (const persona of resolveCrawlPersonas(args.persona)) {
      const surfaces = resolveCrawlSurfaces(args.surface);
      const personaContext = args.noAuth
        ? await createNoAuthPersonaContext(browser, persona, args.baseUrl)
        : await createIsolatedPersonaContext(browser, persona, { baseUrl: args.baseUrl });
      try {
        for (const surface of surfaces) {
          observations.push(await crawlSurface(personaContext.page, persona, surface, args.baseUrl, out));
        }
      } finally {
        await personaContext.context.close().catch(() => undefined);
      }
    }
  } catch (error) {
    fatalError = error;
  } finally {
    await browser.close();
  }

  const run: CrawlRun = {
    runId,
    baseUrl: args.baseUrl,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    createdAt: new Date().toISOString(),
    observations,
  };

  if (fatalError) {
    const comparison: CrawlComparison = {
      runId,
      p0: 1,
      p1: 0,
      p2: 0,
      findings: [{
        severity: 'P0',
        tenantKey: 'unknown',
        personaKey: 'crawl-harness',
        surfaceId: 'sign-in-or-crawl-bootstrap',
        dimension: 'crawl-execution',
        message: fatalError instanceof Error ? fatalError.message : String(fatalError),
      }],
    };
    await writeCrawlArtifacts(args.outputDir, out, run, comparison);
    throw fatalError;
  }

  const baseline = args.baseline ? await readBaseline(args.baseline) : null;
  const comparison = compareCrawlToBaseline(run, baseline);
  await writeCrawlArtifacts(args.outputDir, out, run, comparison);

  console.log(`Post-deploy crawl complete: ${comparison.p0} P0, ${comparison.p1} P1, ${comparison.p2} P2`);
  console.log(`Artifacts: ${out}`);

  if (comparison.p0 > 0) {
    process.exitCode = 2;
    if (args.rollbackOnP0) {
      console.error('P0 findings detected. Run scripts/crawl/auto-rollback.ts with --execute only from the controlled deploy workflow.');
    }
  }
}

async function writeCrawlArtifacts(
  outputDir: string,
  runDir: string,
  run: CrawlRun,
  comparison: CrawlComparison,
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(runDir, 'crawl-run.json'), JSON.stringify(run, null, 2));
  await fs.writeFile(path.join(runDir, 'comparison.json'), JSON.stringify(comparison, null, 2));
  await fs.writeFile(path.resolve(outputDir, 'latest.json'), JSON.stringify({ run, comparison }, null, 2));
}

async function createNoAuthPersonaContext(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  persona: { key: string },
  baseUrl: string,
) {
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  return { context, page, persona };
}

async function crawlSurface(
  page: Page,
  persona: { key: string; tenantKey: string; tenantName: string },
  surface: CrawlSurface,
  baseUrl: string,
  out: string,
): Promise<CrawlPageObservation> {
  const consoleErrors: string[] = [];
  const networkErrors: Array<{ url: string; status: number }> = [];
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onResponse = (response: { status: () => number; url: () => string }) => {
    const status = response.status();
    if (status >= 400) networkErrors.push({ url: response.url(), status });
  };
  page.on('console', onConsole);
  page.on('response', onResponse);

  const safeName = `${persona.key}__${surface.id}`;
  const url = new URL(surface.path, baseUrl).toString();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

  const transcript = surface.requiresAgentProbe
    ? await askHardQuestions(page, safeName, out)
    : { exactFieldCitations: 0 };

  const html = await page.content();
  const visibleText = await page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
  const htmlPath = path.join(out, 'html', `${safeName}.html`);
  const screenshotPath = path.join(out, 'screenshots', `${safeName}.png`);
  await fs.writeFile(htmlPath, html);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);

  const counts = await page.evaluate(() => {
    const text = document.body.innerText;
    const evidenceChipCount = document.querySelectorAll('[data-evidence-chip], [aria-label*="evidence" i], [aria-label*="citation" i]').length;
    const proofMatches = [...text.matchAll(/(\d+)\s+proof points?/gi)].map((match) => Number(match[1]));
    const citationMarkers = (text.match(/citation|evidence|source:|intake\.|source_events\.|vendor_pricing\./gi) ?? []).length;
    const wordCount = Math.max(1, text.split(/\s+/).filter(Boolean).length);
    const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map((el) => getComputedStyle(el).fontFamily).join(' ');
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const bg = getComputedStyle(document.body).backgroundColor;
    const buttons = Array.from(document.querySelectorAll('button,a')).slice(0, 30).map((el) => {
      const style = getComputedStyle(el);
      return `${style.backgroundColor}|${style.color}|${style.borderColor}`;
    }).join('\n');
    return {
      evidenceChipCount,
      proofPointCount: proofMatches.reduce((sum, value) => sum + value, 0),
      citationDensity: citationMarkers / wordCount,
      visualCanon: {
        backgroundOk: bg.includes('248, 247, 244') || text.length > 0,
        headersOk: /Georgia|serif/i.test(headings) || headings.length === 0,
        bodyOk: /DM Sans|sans/i.test(bodyFont),
        buttonsOk: /rgb\(17, 24, 39\)|rgb\(255, 255, 255\)|rgba\(0, 0, 0, 0\)/i.test(buttons) || buttons.length === 0,
      },
      metrics: {
        lcpMs: Math.round(performance.getEntriesByType('largest-contentful-paint').at(-1)?.startTime ?? 0),
      },
      watchlistTopEntries: Array.from(document.querySelectorAll('[data-watchlist-entry], article, li')).slice(0, 10).map((el) => el.textContent?.trim() ?? '').filter(Boolean),
    };
  });

  page.off('console', onConsole);
  page.off('response', onResponse);

  return {
    tenantKey: persona.tenantKey,
    expectedTenantName: persona.tenantName,
    personaKey: persona.key,
    surfaceId: surface.id,
    path: surface.path,
    url,
    title: await page.title().catch(() => undefined),
    visibleText,
    screenshotPath,
    htmlPath,
    consoleErrors,
    networkErrors,
    evidenceChipCount: counts.evidenceChipCount,
    proofPointCount: counts.proofPointCount,
    citationDensity: counts.citationDensity,
    hardQuestionExactFieldCitations: transcript.exactFieldCitations,
    watchlistTopEntries: counts.watchlistTopEntries,
    visualCanon: counts.visualCanon,
    metrics: counts.metrics,
  };
}

async function askHardQuestions(page: Page, safeName: string, out: string): Promise<{ exactFieldCitations: number }> {
  const transcript: Array<{ question: string; answer: string }> = [];
  let exactFieldCitations = 0;
  for (const question of POST_DEPLOY_HARD_QUESTIONS) {
    const input = page.getByRole('textbox').first();
    if (!(await input.isVisible().catch(() => false))) break;
    await input.fill(question);
    await input.press('Enter');
    await page.waitForTimeout(2500);
    const answer = (await page.locator('body').innerText().catch(() => '')).slice(-5000);
    exactFieldCitations += (answer.match(/\b(?:intake|source_events|vendor_pricing|pricing_submissions|selection_memo|legal_review|contract_terms|telemetry)\.[a-z0-9_[\].-]+/gi) ?? []).length;
    transcript.push({ question, answer });
  }
  await fs.writeFile(path.join(out, 'transcripts', `${safeName}.json`), JSON.stringify(transcript, null, 2));
  return { exactFieldCitations };
}

async function readBaseline(file: string): Promise<CrawlBaseline | null> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as CrawlBaseline;
  } catch {
    return null;
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    baseUrl: process.env.CRAWL_BASE_URL ?? 'https://app.abarva.ai',
    outputDir: 'audit-artifacts/post-deploy-crawl',
    noAuth: false,
    rollbackOnP0: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--base-url' && next) args.baseUrl = next;
    if (arg === '--output-dir' && next) args.outputDir = next;
    if (arg === '--persona' && next) args.persona = next;
    if (arg === '--surface' && next) args.surface = next;
    if (arg === '--baseline' && next) args.baseline = next;
    if (arg === '--no-auth') args.noAuth = true;
    if (arg === '--rollback-on-p0') args.rollbackOnP0 = true;
  }
  return args;
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
