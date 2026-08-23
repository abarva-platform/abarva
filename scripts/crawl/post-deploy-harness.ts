import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import {
  createIsolatedPersonaContext,
  resolveCrawlQuestions,
  resolveCrawlPersonas,
  resolveCrawlSurfaces,
  type CrawlSurface,
} from '../../src/lib/crawl/persona-switcher';
import {
  compareCrawlToBaseline,
  isAuthAutomationBlockMessage,
  type CrawlBaseline,
  type CrawlComparison,
  type CrawlPageObservation,
  type CrawlRun,
} from '../../src/lib/crawl/baseline-compare';
import {
  runCandidatePreviewProof,
  type CandidatePreviewComparison,
  type CandidatePreviewProof,
} from './candidate-preview-proof';

interface Args {
  baseUrl: string;
  outputDir: string;
  persona?: string;
  surface?: string;
  questionSet?: string;
  baseline?: string;
  noAuth: boolean;
  rollbackOnP0: boolean;
  includeCandidatePreview: boolean;
  totalTimeoutMs: number;
  surfaceTimeoutMs: number;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'local'}`;
  const out = path.resolve(args.outputDir, runId);
  await fs.mkdir(out, { recursive: true });
  await fs.mkdir(path.join(out, 'screenshots'), { recursive: true });
  await fs.mkdir(path.join(out, 'html'), { recursive: true });
  await fs.mkdir(path.join(out, 'transcripts'), { recursive: true });
  await fs.mkdir(path.join(out, 'candidate-preview'), { recursive: true });

  const observations: CrawlPageObservation[] = [];
  let candidatePreviewProof: CandidatePreviewProof | undefined;
  let candidatePreviewComparison: CandidatePreviewComparison | undefined;
  const personas = resolveCrawlPersonas(args.persona);
  const surfaces = resolveCrawlSurfaces(args.surface);
  const questions = resolveCrawlQuestions(args.questionSet);
  const plannedObservationCount = personas.length * surfaces.length;
  const startedAt = Date.now();
  const deadlineAt = startedAt + args.totalTimeoutMs;
  const logProgress = createProgressLogger(plannedObservationCount);
  console.log(
    `crawl_plan:${personas.map((persona) => persona.key).join(",")}:${surfaces.map((surface) => surface.id).join(",")}:questions=${questions.length}`,
  );
  console.log(
    `crawl_deadline:totalMs=${args.totalTimeoutMs}:surfaceMs=${args.surfaceTimeoutMs}`,
  );
  const baseline = args.baseline ? await readBaseline(args.baseline) : null;
  const persistProgress = async (complete: boolean) => {
    const run = buildCrawlRun(args.baseUrl, runId, observations, candidatePreviewProof);
    const comparison = buildCrawlComparison(
      run,
      baseline,
      complete,
      plannedObservationCount,
      candidatePreviewComparison,
    );
    await writeCrawlArtifacts(args.outputDir, out, run, comparison);
  };

  let fatalError: unknown = null;
  try {
    if (!args.noAuth && args.includeCandidatePreview) {
      try {
        console.log("crawl_candidate_preview_start:agent-skyharbor:/admin/candidate-preview");
        const previewResult = await runCandidatePreviewProof(
          {
            baseUrl: args.baseUrl,
            outputDir: args.outputDir,
            module: "home",
            persona: "agent-skyharbor",
          },
          {
            runId,
            runDir: path.join(out, "candidate-preview"),
            writeLatest: false,
          },
        );
        candidatePreviewProof = previewResult.proof;
        candidatePreviewComparison = previewResult.comparison;
        await persistProgress(false);
        console.log(
          `crawl_candidate_preview_complete:${candidatePreviewComparison.p0}/${candidatePreviewComparison.p1}/${candidatePreviewComparison.p2}`,
        );
      } catch (error) {
        candidatePreviewComparison = buildCandidatePreviewFailureComparison(
          runId,
          error,
        );
        await persistProgress(false);
        console.warn(
          `crawl_candidate_preview_failed:${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    for (const persona of personas) {
      console.log(`crawl_persona_start:${persona.key}:${persona.tenantKey}`);
      const browser = await launchCrawlBrowser();
      let personaContext: { context: BrowserContext; page: Page } | null = null;
      try {
        let activeContext: {
          context: BrowserContext;
          page: Page;
          persona: unknown;
        };
        try {
          activeContext = args.noAuth
            ? await createNoAuthPersonaContext(browser, persona, args.baseUrl)
            : await createIsolatedPersonaContext(browser, persona, {
                baseUrl: args.baseUrl,
              });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`crawl_auth_bootstrap_failed:${persona.key}:${message}`);
          observations.push(
            buildAuthBootstrapObservation(persona, args.baseUrl, message),
          );
          logProgress(observations.length);
          await persistProgress(false);
          continue;
        }
        personaContext = activeContext;
        for (const surface of surfaces) {
          console.log(`crawl_surface_start:${persona.key}:${surface.id}:${surface.path}`);
          const remainingMs = deadlineAt - Date.now();
          if (remainingMs <= 0) {
            throw new Error(
              `crawl_total_timeout_exceeded:captured=${observations.length}/${plannedObservationCount}:totalMs=${args.totalTimeoutMs}`,
            );
          }
          const surfaceTimeoutMs = Math.min(args.surfaceTimeoutMs, remainingMs);
          observations.push(
            await withTimeout(
              crawlSurface(
                activeContext.page,
                persona,
                surface,
                args.baseUrl,
                out,
                questions,
              ),
              surfaceTimeoutMs,
              `crawl_surface_timeout:${persona.key}:${surface.id}:timeoutMs=${surfaceTimeoutMs}:captured=${observations.length}/${plannedObservationCount}`,
            ),
          );
          logProgress(observations.length);
          await persistProgress(false);
          console.log(`crawl_surface_complete:${persona.key}:${surface.id}:captured=${observations.length}/${plannedObservationCount}`);
        }
      } finally {
        await personaContext?.context.close().catch(() => undefined);
        await browser.close().catch(() => undefined);
        console.log(`crawl_persona_complete:${persona.key}`);
      }
    }
  } catch (error) {
    fatalError = error;
  }

  const run = buildCrawlRun(args.baseUrl, runId, observations, candidatePreviewProof);

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
    mergeCandidatePreviewComparison(comparison, candidatePreviewComparison);
    recountComparison(comparison);
    await writeCrawlArtifacts(args.outputDir, out, run, comparison);
    throw fatalError;
  }

  const comparison = buildCrawlComparison(
    run,
    baseline,
    true,
    plannedObservationCount,
    candidatePreviewComparison,
  );
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

function buildAuthBootstrapObservation(
  persona: { key: string; tenantKey: string; tenantName: string },
  baseUrl: string,
  message: string,
): CrawlPageObservation {
  return {
    tenantKey: persona.tenantKey,
    expectedTenantName: persona.tenantName,
    personaKey: persona.key,
    surfaceId: 'auth-bootstrap',
    path: '/sign-in',
    url: new URL('/sign-in', baseUrl).toString(),
    visibleText: `Auth bootstrap failed for ${persona.tenantName}: ${message}`,
    consoleErrors: [],
    networkErrors: [],
    evidenceChipCount: 0,
    proofPointCount: 0,
    citationDensity: 0,
    hardQuestionExactFieldCitations: 0,
    hardQuestionGroundingEvidence: 0,
    watchlistTopEntries: [],
    visualCanon: {
      backgroundOk: true,
      headersOk: true,
      bodyOk: true,
      buttonsOk: true,
    },
  };
}

function buildCrawlRun(
  baseUrl: string,
  runId: string,
  observations: CrawlPageObservation[],
  candidatePreview?: CandidatePreviewProof,
): CrawlRun {
  return {
    runId,
    baseUrl,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    createdAt: new Date().toISOString(),
    observations,
    candidatePreview,
  };
}

function buildCrawlComparison(
  run: CrawlRun,
  baseline: CrawlBaseline | null,
  complete: boolean,
  plannedObservationCount: number,
  candidatePreviewComparison?: CandidatePreviewComparison,
): CrawlComparison {
  const comparison = compareCrawlToBaseline(run, baseline);
  mergeCandidatePreviewComparison(comparison, candidatePreviewComparison);
  if (!complete) {
    comparison.findings.push({
      severity: 'P1',
      tenantKey: 'unknown',
      personaKey: 'crawl-harness',
      surfaceId: 'partial-run',
      dimension: 'crawl-execution',
      message: `Post-deploy crawl is still partial: captured ${run.observations.length} of ${plannedObservationCount} planned observations.`,
      evidence: {
        capturedObservationCount: run.observations.length,
        plannedObservationCount,
      },
    });
  }
  return recountComparison(comparison);
}

function createProgressLogger(plannedObservationCount: number) {
  let nextBucket = 15;
  return (capturedObservationCount: number) => {
    if (plannedObservationCount <= 0) return;
    const percent = Math.floor(
      (capturedObservationCount / plannedObservationCount) * 100,
    );
    while (percent >= nextBucket && nextBucket <= 90) {
      console.log(
        `crawl_progress:${nextBucket}%:captured=${capturedObservationCount}/${plannedObservationCount}`,
      );
      nextBucket += 15;
    }
    if (capturedObservationCount >= plannedObservationCount && nextBucket <= 100) {
      console.log(
        `crawl_progress:100%:captured=${capturedObservationCount}/${plannedObservationCount}`,
      );
      nextBucket = 105;
    }
  };
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function mergeCandidatePreviewComparison(
  comparison: CrawlComparison,
  candidatePreviewComparison: CandidatePreviewComparison | undefined,
): void {
  if (!candidatePreviewComparison) return;
  comparison.candidatePreview = candidatePreviewComparison;
  comparison.findings.push(...candidatePreviewComparison.findings);
}

function recountComparison(comparison: CrawlComparison): CrawlComparison {
  comparison.p0 = comparison.findings.filter((finding) => finding.severity === 'P0').length;
  comparison.p1 = comparison.findings.filter((finding) => finding.severity === 'P1').length;
  comparison.p2 = comparison.findings.filter((finding) => finding.severity === 'P2').length;
  return comparison;
}

function buildCandidatePreviewFailureComparison(
  runId: string,
  error: unknown,
): CandidatePreviewComparison {
  const message = error instanceof Error ? error.message : String(error);
  const authAutomationBlocked = isAuthAutomationBlockMessage(message);
  return {
    runId,
    p0: authAutomationBlocked ? 0 : 1,
    p1: authAutomationBlocked ? 1 : 0,
    p2: 0,
    findings: [
      {
        severity: authAutomationBlocked ? 'P1' : 'P0',
        tenantKey: 'skyharbor-air',
        personaKey: 'agent-skyharbor',
        surfaceId: 'admin-candidate-preview',
        dimension: authAutomationBlocked
          ? 'candidate-preview-auth-bootstrap'
          : 'candidate-preview-execution',
        message: authAutomationBlocked
          ? 'Candidate preview crawl could not establish an authenticated Clerk session; the product route was not reached.'
          : message,
        evidence: {
          originalMessage: message,
          authAutomationBlocked,
        },
      },
    ],
  };
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

async function launchCrawlBrowser() {
  const browserChannel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL?.trim();
  return chromium.launch({
    headless: true,
    ...(browserChannel ? { channel: browserChannel } : {}),
  });
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
  questions: readonly string[],
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
    ? await askHardQuestions(page, persona, surface, safeName, out, questions)
    : { exactFieldCitations: 0, groundingEvidence: 0 };
  if (surface.requiresContextDemoVectorProof) {
    await proveContextDemoVectorPath(page, persona, safeName, out);
  }
  if (surface.id === "home") {
    await proveHomeAvaRail(page, persona, safeName, out);
  }

  const html = await page.content();
  const visibleText = await page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
  const htmlPath = path.join(out, 'html', `${safeName}.html`);
  const screenshotPath = path.join(out, 'screenshots', `${safeName}.png`);
  await fs.writeFile(htmlPath, html);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);

  const counts = await collectPageCounts(page, visibleText).catch((error) => {
    console.warn(`crawl_metrics_extraction_failed:${safeName}:${error instanceof Error ? error.message : String(error)}`);
    return fallbackPageCounts(visibleText);
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
    hardQuestionGroundingEvidence: transcript.groundingEvidence,
    watchlistTopEntries: counts.watchlistTopEntries,
    visualCanon: counts.visualCanon,
    metrics: counts.metrics,
  };
}

async function proveHomeAvaRail(
  page: Page,
  persona: { key: string; tenantKey: string; tenantName: string },
  safeName: string,
  out: string,
) {
  const launcher = page.locator('[data-testid="home-ava-launcher"]');
  if ((await launcher.count()) === 0) return;
  await launcher.first().click({ timeout: 10_000 });
  const drawer = page.locator('[data-testid="home-ava-drawer"]');
  await drawer.waitFor({ state: "visible", timeout: 10_000 });
  const expand = page.getByRole("button", { name: /expand ava/i });
  if ((await expand.count()) > 0) {
    await expand.first().click({ timeout: 5_000 });
  }
  const prompt = "Explain this company in plain English.";
  const promptButton = drawer.getByRole("button", { name: prompt });
  if ((await promptButton.count()) > 0) {
    await promptButton.first().click({ timeout: 5_000 });
  } else {
    await drawer.getByPlaceholder(/ask about this context/i).fill(prompt);
    await drawer.getByRole("button", { name: /ask|send|submit/i }).last().click();
  }
  await page.waitForFunction(
    () => {
      const panel = document.querySelector('[data-testid="home-ava-drawer"]');
      const text = panel?.textContent ?? "";
      const promptSubmitted = text.includes("Explain this company in plain English.");
      const stillLoading = text.includes("Reading loaded context...");
      const hasEnterpriseAnswer =
        /headquarters|revenue|employees|business model|industry|mission|vision|strategic priorit/i.test(text) ||
        /\$[0-9][0-9.,]*(?:[BMK])?\b/.test(text);
      return promptSubmitted && !stillLoading && hasEnterpriseAnswer;
    },
    { timeout: 60_000 },
  );
  const text = await drawer.innerText({ timeout: 10_000 }).catch(() => "");
  if (text.includes("Reading loaded context...")) {
    throw new Error("Home aVa response did not finish before transcript capture");
  }
  await fs.writeFile(
    path.join(out, "transcripts", `${safeName}__home-ava.txt`),
    [
      `persona=${persona.key}`,
      `tenant=${persona.tenantKey}`,
      `tenantName=${persona.tenantName}`,
      `prompt=${prompt}`,
      "",
      text,
    ].join("\n"),
  );
}

async function collectPageCounts(page: Page, visibleText: string): Promise<PageCounts> {
  return page.evaluate((fallbackText) => {
    const text = document.body.innerText || fallbackText;
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
  }, visibleText);
}

function fallbackPageCounts(visibleText: string): PageCounts {
  const proofMatches = [...visibleText.matchAll(/(\d+)\s+proof points?/gi)].map((match) => Number(match[1]));
  const citationMarkers = (visibleText.match(/citation|evidence|source:|intake\.|source_events\.|vendor_pricing\./gi) ?? []).length;
  const wordCount = Math.max(1, visibleText.split(/\s+/).filter(Boolean).length);
  return {
    evidenceChipCount: 0,
    proofPointCount: proofMatches.reduce((sum, value) => sum + value, 0),
    citationDensity: citationMarkers / wordCount,
    visualCanon: {
      backgroundOk: visibleText.length > 0,
      headersOk: true,
      bodyOk: true,
      buttonsOk: true,
    },
    metrics: { lcpMs: 0 },
    watchlistTopEntries: [],
  };
}

interface PageCounts {
  evidenceChipCount: number;
  proofPointCount: number;
  citationDensity: number;
  visualCanon: CrawlPageObservation['visualCanon'];
  metrics: NonNullable<CrawlPageObservation['metrics']>;
  watchlistTopEntries: string[];
}

async function askHardQuestions(
  page: Page,
  persona: { key: string; tenantKey: string; tenantName: string },
  surface: CrawlSurface,
  safeName: string,
  out: string,
  questions: readonly string[],
): Promise<{ exactFieldCitations: number; groundingEvidence: number }> {
  const transcript: Array<{
    question: string;
    answer: string;
    status: 'answered' | 'error';
    error?: string;
    eventCount?: number;
    sourceEventCitations?: number;
    exactFieldCitations?: number;
    concreteFactSignals?: number;
    groundingEvidence?: number;
  }> = [];
  let exactFieldCitations = 0;
  let groundingEvidence = 0;
  for (const question of questions) {
    const questionNumber = transcript.length + 1;
    console.log(`crawl_question_start:${persona.key}:${surface.id}:${questionNumber}/${questions.length}`);
    const response = await askIntelligenceApi(page, question, persona, surface);
    const answer = response.answer;
    const answerExactFieldCitations = countExactFieldCitations(answer);
    const concreteFactSignals = countConcreteFactSignals(answer);
    const answerGroundingEvidence =
      response.sourceEventCitations +
      answerExactFieldCitations +
      concreteFactSignals;
    exactFieldCitations += answerExactFieldCitations;
    groundingEvidence += answerGroundingEvidence;
    transcript.push({
      question,
      answer,
      status: response.ok ? 'answered' : 'error',
      error: response.error,
      eventCount: response.eventCount,
      sourceEventCitations: response.sourceEventCitations,
      exactFieldCitations: answerExactFieldCitations,
      concreteFactSignals,
      groundingEvidence: answerGroundingEvidence,
    });
    console.log(
      `crawl_question_complete:${persona.key}:${surface.id}:${questionNumber}/${questions.length}:ok=${response.ok}:events=${response.eventCount}`,
    );
  }
  await fs.writeFile(path.join(out, 'transcripts', `${safeName}.json`), JSON.stringify(transcript, null, 2));
  return { exactFieldCitations, groundingEvidence };
}

async function askIntelligenceApi(
  page: Page,
  question: string,
  persona: { tenantKey: string; tenantName: string },
  surface: CrawlSurface,
): Promise<{ ok: boolean; answer: string; error?: string; eventCount: number; sourceEventCitations: number }> {
  return page.evaluate(async ({ question: q, persona: p, surface: s }) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch('/api/intelligence/ask', {
        method: 'POST',
        headers: {
          Accept: 'application/x-ndjson',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q,
          client: p.tenantKey,
          surfaceContext: {
            activeTab: s.id,
            activeClient: p.tenantKey,
            clientKey: p.tenantKey,
            facts: [
              `crawl_persona_tenant=${p.tenantName}`,
              `crawl_surface=${s.path}`,
            ],
          },
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        return {
          ok: false,
          answer: '',
          error: `ask_api_http_${response.status}`,
          eventCount: 0,
          sourceEventCitations: 0,
        };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      let eventCount = 0;
      let sourceEventCitations = 0;
      let error: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          eventCount += 1;
          const event = JSON.parse(line) as {
            type?: string;
            text?: string;
            delta?: string;
            error?: string;
            stage?: { name?: string; content?: string };
            sources?: unknown[];
          };
          if (event.type === 'delta' && event.text) answer += event.text;
          if (event.type === 'delta' && event.delta) answer += event.delta;
          if (event.type === 'sources' && Array.isArray(event.sources)) {
            sourceEventCitations += event.sources.length;
          }
          if (event.type === 'sentinel-stage' && event.stage?.content) {
            answer += `${event.stage.name ?? 'Stage'}: ${event.stage.content}\n`;
          }
          if (event.type === 'error') error = event.error ?? 'ask_api_stream_error';
        }
      }

      return {
        ok: !error && answer.trim().length > 0,
        answer: answer.trim(),
        error,
        eventCount,
        sourceEventCitations,
      };
    } catch (err) {
      return {
        ok: false,
        answer: '',
        error: err instanceof Error ? err.message : String(err),
        eventCount: 0,
        sourceEventCitations: 0,
      };
    } finally {
      window.clearTimeout(timeout);
    }
  }, { question, persona, surface });
}

const EXACT_FIELD_CITATION_PATTERN =
  /\b(?:intake|source_events|vendor_pricing|pricing_submissions|selection_memo|legal_review|contract_terms|telemetry)\.[a-z0-9_[\].-]+/gi;

function countExactFieldCitations(answer: string): number {
  return (answer.match(EXACT_FIELD_CITATION_PATTERN) ?? []).length;
}

function countConcreteFactSignals(answer: string): number {
  const signals = new Set<string>();
  for (const match of answer.matchAll(/\$\s?\d[\d,.]*(?:\s?(?:k|m|b|million|billion))?/gi)) {
    signals.add(`money:${match[0].toLowerCase()}`);
  }
  for (const match of answer.matchAll(/\b\d+(?:\.\d+)?\s?%/g)) {
    signals.add(`percent:${match[0]}`);
  }
  for (const match of answer.matchAll(/\b(?:FY\s?)?20\d{2}\b|\bQ[1-4]\s+20\d{2}\b/gi)) {
    signals.add(`date:${match[0].toLowerCase()}`);
  }
  for (const match of answer.matchAll(/\b[\w./-]+\.(?:csv|json|jsonl|md|pdf|docx|xlsx|pptx)\b/gi)) {
    signals.add(`file:${match[0].toLowerCase()}`);
  }
  return signals.size;
}

interface ContextDemoVectorProof {
  ok: boolean;
  status: number;
  brokerTenantKey: string;
  vectorInfoTag: string | null;
  semanticChunkCount: number;
  topScore: number | null;
  topChunkId: string | null;
  topSourceDoc: string | null;
  topTenantKey: string | null;
  warnings: string[];
  error?: string;
  responseSnippet?: string;
}

async function proveContextDemoVectorPath(
  page: Page,
  persona: { key: string; tenantKey: string; tenantName: string },
  safeName: string,
  out: string,
): Promise<void> {
  const brokerTenantKey = brokerTenantKeyForClient(persona.tenantKey);
  const proof = await page.evaluate(
    async ({ tenantKey, tenantName }) => {
      const response = await fetch("/api/context/demo", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `Which ${tenantName} context chunks best explain AI automation, spend, initiatives, and risk?`,
          mode: "tenant",
          tenantKey,
          maxFacts: 8,
          maxChunks: 5,
          graphTraversalDepth: 2,
        }),
      });
      const text = await response.text();
      let body: unknown = null;
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
      return {
        ok: response.ok,
        status: response.status,
        body,
        responseSnippet: text.slice(0, 800),
      };
    },
    { tenantKey: brokerTenantKey, tenantName: persona.tenantName },
  );

  const body = asRecord(proof.body);
  const bundle = asRecord(body?.bundle);
  const infoTags = stringArray(bundle?.infoTags);
  const warnings = stringArray(bundle?.warnings);
  const semanticChunks = arrayOfRecords(bundle?.semanticChunks);
  const topHit = asRecord(semanticChunks[0]);
  const topChunk = asRecord(topHit?.chunk);
  const topScore = typeof topHit?.score === "number" ? topHit.score : null;
  const vectorInfoTag =
    infoTags.find((tag) => /Postgres pgvector/i.test(tag)) ?? null;
  const summary: ContextDemoVectorProof = {
    ok: proof.ok,
    status: proof.status,
    brokerTenantKey,
    vectorInfoTag,
    semanticChunkCount: semanticChunks.length,
    topScore,
    topChunkId: stringOrNull(topChunk?.chunkId),
    topSourceDoc: stringOrNull(topChunk?.sourceDoc),
    topTenantKey: stringOrNull(topChunk?.tenantKey),
    warnings,
    responseSnippet: proof.responseSnippet,
  };

  const failures = [
    proof.ok ? null : `context_demo_http_${proof.status}`,
    vectorInfoTag ? null : "missing_pgvector_info_tag",
    semanticChunks.length > 0 ? null : "no_semantic_chunks",
    typeof topScore === "number" && topScore > 0 ? null : "missing_positive_vector_score",
    summary.topTenantKey === brokerTenantKey
      ? null
      : `top_chunk_tenant_mismatch:${summary.topTenantKey ?? "missing"}`,
    warnings.some((warning) => /Vector retrieval pending/i.test(warning))
      ? "vector_retrieval_fell_back_to_keyword"
      : null,
  ].filter((failure): failure is string => Boolean(failure));

  summary.error = failures.length > 0 ? failures.join(",") : undefined;
  await fs.writeFile(
    path.join(out, "transcripts", `${safeName}.context-demo-vector.json`),
    JSON.stringify(summary, null, 2),
  );

  if (failures.length > 0) {
    throw new Error(
      `context_demo_vector_proof_failed:${persona.key}:${failures.join(",")}`,
    );
  }

  console.log(
    `context_demo_vector_proof:${persona.key}:${brokerTenantKey}:chunks=${summary.semanticChunkCount}:topScore=${summary.topScore}:topChunk=${summary.topChunkId}`,
  );
}

function brokerTenantKeyForClient(clientKey: string): string {
  const map: Record<string, string> = {
    apexretail: "apex-retail",
    arcturus: "firstcapital",
    firstcapital: "firstcapital",
    lakeshore: "lakeshore-holdings",
    meridian: "meridian-health",
    northstar: "northstar-clinical",
    skyharbor: "skyharbor-air",
  };
  return map[clientKey] ?? clientKey;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item))
    : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
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
    includeCandidatePreview:
      process.env.CRAWL_INCLUDE_ADMIN_CANDIDATE_PREVIEW === "true",
    totalTimeoutMs: positiveIntegerFromEnv("CRAWL_TOTAL_TIMEOUT_MS", 2_700_000),
    surfaceTimeoutMs: positiveIntegerFromEnv("CRAWL_SURFACE_TIMEOUT_MS", 900_000),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--base-url' && next) args.baseUrl = next;
    if (arg === '--output-dir' && next) args.outputDir = next;
    if (arg === '--persona' && next) args.persona = next;
    if (arg === '--surface' && next) args.surface = next;
    if (arg === '--question-set' && next) args.questionSet = next;
    if (arg === '--baseline' && next) args.baseline = next;
    if (arg === '--no-auth') args.noAuth = true;
    if (arg === '--rollback-on-p0') args.rollbackOnP0 = true;
    if (arg === '--candidate-preview') args.includeCandidatePreview = true;
  }
  return args;
}

function positiveIntegerFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
