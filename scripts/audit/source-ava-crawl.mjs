#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const LIFECYCLE_STAGES = [
  {
    key: 'current-state',
    label: 'Current state',
    routeHints: ['/source', '/source/events/{eventId}'],
    uiTerms: ['current state', 'baseline', 'portfolio', 'active events', 'status', 'owner', 'aging', 'blocker'],
    responseTerms: ['current state', 'baseline', 'active', 'owner', 'risk', 'next action'],
  },
  {
    key: 'demand-challenge',
    label: 'Demand challenge',
    routeHints: ['/source/events/{eventId}'],
    uiTerms: ['demand', 'challenge', 'business need', 'driver', 'problem', 'pressure'],
    responseTerms: ['demand', 'challenge', 'driver', 'scope implication', 'risk'],
  },
  {
    key: 'scope',
    label: 'Scope',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/scope'],
    uiTerms: ['scope', 'requirements', 'in scope', 'out of scope', 'owner', 'complete', 'gate'],
    responseTerms: ['scope', 'requirements', 'missing', 'gate', 'RFP release'],
  },
  {
    key: 'rfp',
    label: 'RFP',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/rfp'],
    uiTerms: ['RFP', 'release', 'artifact', 'readiness', 'scorecard', 'approval', 'audit'],
    responseTerms: ['RFP', 'release readiness', 'scorecard', 'approval', 'blocker', 'audit'],
  },
  {
    key: 'vendor-responses',
    label: 'Vendor responses',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/responses'],
    uiTerms: ['vendor response', 'late', 'exception', 'comparable', 'submitted', 'received'],
    responseTerms: ['vendor', 'response', 'late', 'exception', 'normalization', 'comparable'],
  },
  {
    key: 'evaluation',
    label: 'Evaluation',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/scorecard'],
    uiTerms: ['evaluation', 'scorecard', 'criteria', 'weight', 'rationale', 'lock', 'evidence'],
    responseTerms: ['evaluation', 'scorecard', 'criteria', 'weight', 'evidence', 'lock'],
  },
  {
    key: 'pricing',
    label: 'Pricing',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/pricing'],
    uiTerms: ['pricing', 'commercial', 'cost', 'value at stake', 'assumption', 'confidence'],
    responseTerms: ['pricing', 'commercial', 'value', 'assumption', 'confidence', 'owner'],
  },
  {
    key: 'bafo',
    label: 'BAFO',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/bafo'],
    uiTerms: ['BAFO', 'best and final', 'negotiation', 'concession', 'final offer'],
    responseTerms: ['BAFO', 'best and final', 'negotiation', 'tradeoff', 'risk'],
  },
  {
    key: 'executive-decision',
    label: 'Executive decision',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/decision'],
    uiTerms: ['executive decision', 'decision', 'recommendation', 'approve', 'defer', 'reject', 'alternative'],
    responseTerms: ['decision', 'recommendation', 'approve', 'defer', 'reject', 'alternative'],
  },
  {
    key: 'transition',
    label: 'Transition',
    routeHints: ['/source/events/{eventId}', '/source/events/{eventId}/transition'],
    uiTerms: ['transition', 'handoff', 'implementation', 'mobilization', 'owner', 'date'],
    responseTerms: ['transition', 'handoff', 'owner', 'risk', 'next action'],
  },
  {
    key: 'value-realization',
    label: 'Value realization',
    routeHints: ['/source/value', '/source/events/{eventId}/value'],
    uiTerms: ['value realization', 'realized value', 'projected value', 'measurement', 'owner', 'confidence'],
    responseTerms: ['realized', 'projected', 'measurement', 'owner', 'confidence', 'assumption'],
  },
];

const PERSONAS = [
  {
    key: 'cio',
    persona: 'CIO',
    route: '/source',
    scenario: 'CIO reviews active sourcing portfolio before weekly operating review',
    prompt: 'What needs my attention?',
    uiTerms: ['active events', 'lifecycle', 'status', 'owner', 'aging', 'blocker', 'value at stake', 'next action'],
    responseTerms: ['event', 'status', 'owner', 'value', 'risk', 'next action'],
    rejectTerms: ['review your dashboard', 'as an ai language model', 'I do not have access'],
  },
  {
    key: 'cfo',
    persona: 'CFO',
    route: '/source',
    scenario: 'CFO reviews value at stake, assumptions, confidence, and delay impact',
    prompt: 'What is the value at stake and can we trust it?',
    uiTerms: ['value at stake', 'projected', 'assumption', 'confidence', 'owner', 'delay'],
    responseTerms: ['projected', 'assumption', 'confidence', 'owner', 'delay', 'unsupported'],
    rejectTerms: ['guaranteed savings', 'certain savings', 'review your dashboard'],
  },
  {
    key: 'procurement',
    persona: 'Procurement leader',
    route: '/source/events/{eventId}',
    scenario: 'Procurement leader checks whether the RFP can be released',
    prompt: 'Is this process defensible?',
    uiTerms: ['gate', 'required inputs', 'scorecard', 'artifact', 'readiness', 'audit'],
    responseTerms: ['defensible', 'gate', 'scorecard', 'blocker', 'audit', 'release'],
    rejectTerms: ['release now', 'no issues', 'review your dashboard'],
  },
  {
    key: 'cto',
    persona: 'CTO',
    route: '/source/events/{eventId}/scorecard',
    scenario: 'CTO reviews scorecard defaults before vendor evaluation begins',
    prompt: 'Can I change commercial weight to 25%?',
    uiTerms: ['technical', 'criteria', 'weight', 'rationale', 'security', 'architecture', 'lock'],
    responseTerms: ['weight', 'material change', 'rationale', 'approval', 'lock', 'technical'],
    rejectTerms: ['change it anytime', 'generic capability', 'review your dashboard'],
  },
  {
    key: 'pmo',
    persona: 'PMO lead',
    route: '/source',
    scenario: 'PMO lead runs daily review of waiting or stuck events',
    prompt: 'What is blocked and who owns it?',
    uiTerms: ['blocked', 'owner', 'aging', 'due', 'next action', 'status'],
    responseTerms: ['blocked', 'owner', 'aging', 'due', 'next action', 'escalation'],
    rejectTerms: ['review your dashboard', 'check with your team'],
  },
  {
    key: 'legal',
    persona: 'Legal/compliance reviewer',
    route: '/source/events/{eventId}',
    scenario: 'Legal reviews RFP package and vendor exception handling',
    prompt: 'What evidence supports release and what cannot be trusted yet?',
    uiTerms: ['evidence', 'compliance', 'audit', 'gate', 'artifact', 'unsupported'],
    responseTerms: ['evidence', 'compliance', 'audit', 'unsupported', 'release blocker', 'citation'],
    rejectTerms: ['fully compliant', 'nothing untrusted', 'review your dashboard'],
  },
  {
    key: 'sponsor',
    persona: 'Business sponsor',
    route: '/source/events/{eventId}/decision',
    scenario: 'Sponsor reviews recommendation before vendor selection decision',
    prompt: 'What decision do you need from me and what happens if I defer?',
    uiTerms: ['decision', 'recommendation', 'alternative', 'value', 'risk', 'confidence'],
    responseTerms: ['decision', 'recommendation', 'approve', 'defer', 'reject', 'tradeoff'],
    rejectTerms: ['up to you', 'review the details', 'review your dashboard'],
  },
  {
    key: 'sourcing-lead',
    persona: 'Sourcing lead',
    route: '/source/events/{eventId}',
    scenario: 'Sourcing lead checks vendor response status and exception normalization',
    prompt: 'Are vendor assumptions comparable and is evaluation ready to begin?',
    uiTerms: ['vendor response', 'exception', 'normalization', 'scorecard', 'readiness', 'late'],
    responseTerms: ['vendor', 'comparable', 'exception', 'normalization', 'scorecard', 'ready'],
    rejectTerms: ['compare manually', 'ad hoc', 'review your dashboard'],
  },
];

const TABLE_CHART_EXPECTATIONS = [
  {
    key: 'response-table',
    label: 'Response table evidence',
    selectors: ['table', '[role="table"]', '[data-testid*="table" i]', '[class*="table" i]', '[class*="grid" i]'],
    terms: ['vendor', 'response', 'status', 'submitted', 'exception', 'score'],
  },
  {
    key: 'chart-evidence',
    label: 'Chart evidence',
    selectors: ['svg', 'canvas', '[class*="recharts" i]', '[data-testid*="chart" i]', '[aria-label*="chart" i]'],
    terms: ['value', 'pricing', 'score', 'confidence', 'risk', 'timeline'],
  },
];

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args['base-url'] ?? process.env.SOURCE_AVA_BASE_URL ?? 'http://localhost:3000');
const eventId = args['event-id'] ?? process.env.SOURCE_AVA_EVENT_ID ?? 'data-ai-modernization-si-selection';
const authClient = args['auth-client'] ?? process.env.SOURCE_AVA_AUTH_CLIENT ?? null;
const authEmail = args['auth-email'] ?? process.env.SOURCE_AVA_AUTH_EMAIL ?? null;
const noBrowser = Boolean(args['no-browser']);
const failOnReject = Boolean(args['fail-on-reject']);
const responseFile = args['response-file'] ? path.resolve(args['response-file']) : null;
const timestamp = args.timestamp ?? new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(args['out-dir'] ?? path.join(REPO_ROOT, 'reports/source-ava-crawl', timestamp));

fs.mkdirSync(outDir, { recursive: true });

const run = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  eventId,
  mode: noBrowser ? 'static-contract' : 'browser-crawl',
  outDir: path.relative(REPO_ROOT, outDir),
  notes: [],
  auth: {
    client: authClient,
    email: authEmail,
    mode: authClient || authEmail ? 'requested' : 'none',
  },
  routes: [],
  lifecycle: [],
  personas: [],
  responseEvidence: [],
  tableChartEvidence: [],
  summary: {},
};

const capturedResponses = responseFile ? loadCapturedResponses(responseFile) : {};

if (noBrowser) {
  run.notes.push('Browser crawl skipped by --no-browser; report contains deterministic contract checks and optional response-file scoring only.');
} else {
  await crawlRoutes(run);
}

scoreLifecycle(run);
scorePersonas(run);
scoreTableChartEvidence(run);
summarize(run);
writeReports(run);

const exitCode = failOnReject && (run.summary.rejects > 0 || run.summary.browserStatus === 'blocked') ? 1 : 0;
console.log(`Source/aVa crawl report written to ${path.relative(process.cwd(), outDir)}`);
console.log(`Verdicts: ACCEPT=${run.summary.accepts} DEFER=${run.summary.defers} REJECT=${run.summary.rejects}`);
if (run.summary.browserStatus === 'blocked') {
  console.log('Browser access was blocked by auth or route protection; signed-in UI/Nexus behavior remains unproven.');
}
process.exit(exitCode);

async function crawlRoutes(report) {
  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch (error) {
    report.notes.push(`Playwright unavailable; falling back to static-contract mode. ${messageOf(error)}`);
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  if (authClient || authEmail) {
    await applyAuth(page, report);
  }
  const routes = unique([
    '/source',
    '/source/value',
    '/source/events/{eventId}',
    '/source/events/{eventId}/scope',
    '/source/events/{eventId}/rfp',
    '/source/events/{eventId}/responses',
    '/source/events/{eventId}/scorecard',
    '/source/events/{eventId}/pricing',
    '/source/events/{eventId}/bafo',
    '/source/events/{eventId}/decision',
    '/source/events/{eventId}/transition',
    '/source/events/{eventId}/value',
  ]).map((route) => materializeRoute(route));

  for (const route of routes) {
    const url = new URL(route, baseUrl).toString();
    const routeResult = {
      route,
      url,
      status: null,
      finalUrl: null,
      browserAccess: 'unknown',
      title: '',
      textSample: '',
      matchedTerms: [],
      tableChartSignals: [],
      error: null,
    };

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: numberArg('timeout-ms', 15000) });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
      routeResult.status = response?.status() ?? null;
      routeResult.finalUrl = page.url();
      routeResult.title = await page.title().catch(() => '');
      const bodyText = compactText(await page.locator('body').innerText({ timeout: 3000 }).catch(() => ''));
      routeResult.textSample = bodyText.slice(0, 5000);
      routeResult.browserAccess = classifyBrowserAccess(routeResult, bodyText);
      routeResult.matchedTerms = matchTerms(bodyText, allUiTerms());
      routeResult.tableChartSignals = await collectTableChartSignals(page, bodyText);
      if (routeResult.browserAccess === 'accessible') {
        const shotPath = path.join(outDir, `route-${safeName(route)}.png`);
        await page.screenshot({ path: shotPath, fullPage: true }).catch(() => undefined);
        routeResult.screenshot = path.relative(REPO_ROOT, shotPath);
      }
    } catch (error) {
      const message = messageOf(error);
      routeResult.browserAccess = /ERR_TOO_MANY_REDIRECTS|redirect/i.test(message) ? 'blocked' : 'error';
      routeResult.error = message;
    }

    report.routes.push(routeResult);
  }

  await browser.close();
}

async function applyAuth(page, report) {
  const email = authEmail ?? demoEmailForClient(authClient);
  const activeClient = activeClientForClient(authClient);
  if (!email && !activeClient) {
    report.notes.push('Auth requested but no auth email or active client could be resolved.');
    report.auth.mode = 'unresolved';
    return;
  }

  if (email) {
    try {
      await signInWithServerTicket(page, email);
      report.auth.mode = 'server-ticket';
      report.auth.email = email;
    } catch (error) {
      report.notes.push(`Server-ticket auth failed for ${email}: ${messageOf(error)}`);
      report.auth.mode = 'failed';
    }
  }

  if (activeClient) {
    await page.context().addCookies([
      {
        name: 'abarva_active_client',
        value: activeClient,
        domain: new URL(baseUrl).hostname,
        path: '/',
        sameSite: 'Lax',
        secure: baseUrl.startsWith('https://'),
      },
    ]);
    report.auth.activeClient = activeClient;
  }
}

async function signInWithServerTicket(page, email) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY missing');
  const { createClerkClient } = await import('@clerk/backend');
  const clerk = createClerkClient({ secretKey });
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users.data[0];
  if (!user) throw new Error(`No Clerk user found for ${email}`);
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: numberArg('timeout-ms', 15000) });
  await page.waitForFunction(() => window.Clerk?.loaded === true, null, { timeout: numberArg('timeout-ms', 15000) });
  await page.evaluate(async (ticket) => {
    const result = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket });
    if (result.status !== 'complete' || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed with status ${result.status}`);
    }
    await window.Clerk.setActive({ session: result.createdSessionId });
  }, signInToken.token);
  await page.waitForFunction(() => Boolean(window.Clerk?.user), null, { timeout: numberArg('timeout-ms', 15000) });
  await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: numberArg('timeout-ms', 15000) });
}

function scoreLifecycle(report) {
  const combinedText = report.routes.map((route) => route.textSample).join('\n');
  for (const stage of LIFECYCLE_STAGES) {
    const routeMatches = report.routes.filter((route) =>
      stage.routeHints.map(materializeRoute).includes(route.route) && route.browserAccess === 'accessible',
    );
    const uiMatches = matchTerms(combinedTextForRoutes(routeMatches) || combinedText, stage.uiTerms);
    const response = capturedResponses[stage.key] ?? capturedResponses[stage.label] ?? '';
    const responseMatches = response ? matchTerms(response, stage.responseTerms) : [];
    const blocked = noBrowser || (routeMatches.length === 0 && report.routes.some((route) => stage.routeHints.map(materializeRoute).includes(route.route) && route.browserAccess === 'blocked'));
    const verdict = verdictFrom({
      blocked,
      uiScore: score(uiMatches, stage.uiTerms),
      responseScore: response ? score(responseMatches, stage.responseTerms) : null,
      hasRejectTerm: hasRejectTerm(response, ['guaranteed', 'fully complete', 'no evidence needed', 'review your dashboard']),
    });

    report.lifecycle.push({
      stage: stage.label,
      key: stage.key,
      routes: stage.routeHints.map(materializeRoute),
      verdict,
      uiEvidence: uiMatches,
      responseEvidence: responseMatches,
      rationale: rationaleFor(verdict, blocked, response),
      requiredFixBeforeRelease: fixFor(verdict, stage.label, blocked, response),
    });
  }
}

function scorePersonas(report) {
  const routeByPath = new Map(report.routes.map((route) => [route.route, route]));
  for (const persona of PERSONAS) {
    const route = materializeRoute(persona.route);
    const routeResult = routeByPath.get(route);
    const response = capturedResponses[persona.key] ?? capturedResponses[persona.persona] ?? capturedResponses[persona.prompt] ?? '';
    const uiMatches = matchTerms(routeResult?.textSample ?? '', persona.uiTerms);
    const responseMatches = response ? matchTerms(response, persona.responseTerms) : [];
    const blocked = noBrowser || routeResult?.browserAccess === 'blocked';
    const verdict = verdictFrom({
      blocked,
      uiScore: score(uiMatches, persona.uiTerms),
      responseScore: response ? score(responseMatches, persona.responseTerms) : null,
      hasRejectTerm: hasRejectTerm(response, persona.rejectTerms),
    });

    report.personas.push({
      persona: persona.persona,
      route,
      scenario: persona.scenario,
      prompt: persona.prompt,
      verdict,
      rationale: rationaleFor(verdict, blocked, response),
      evidenceObserved: uiMatches,
      nexusResponseObserved: response ? summarizeResponse(response) : 'Not supplied. Use --response-file to score captured aVa/Nexus responses.',
      responseEvidence: responseMatches,
      failures: failuresFor(verdict, persona.uiTerms, uiMatches, persona.responseTerms, responseMatches, blocked, response),
      requiredFixBeforeRelease: fixFor(verdict, persona.persona, blocked, response),
    });
  }
}

function scoreTableChartEvidence(report) {
  for (const expectation of TABLE_CHART_EXPECTATIONS) {
    const routeSignals = report.routes
      .map((route) => ({
        route: route.route,
        browserAccess: route.browserAccess,
        selectorSignals: route.tableChartSignals.filter((signal) => signal.key === expectation.key),
        termEvidence: matchTerms(route.textSample, expectation.terms),
      }))
      .filter((route) => route.selectorSignals.length > 0 || route.termEvidence.length > 0 || route.browserAccess === 'blocked');

    const accessibleSignals = routeSignals.filter((route) => route.browserAccess === 'accessible');
    const termMatches = unique(accessibleSignals.flatMap((route) => route.termEvidence));
    const hasSelector = accessibleSignals.some((route) => route.selectorSignals.length > 0);
    let verdict = 'REJECT';
    if (hasSelector && termMatches.length >= 2) verdict = 'ACCEPT';
    else if (noBrowser || hasSelector || termMatches.length >= 2 || routeSignals.some((route) => route.browserAccess === 'blocked')) verdict = 'DEFER';

    report.tableChartEvidence.push({
      key: expectation.key,
      label: expectation.label,
      verdict,
      routes: routeSignals.slice(0, 8),
      expectedTerms: expectation.terms,
      rationale: verdict === 'ACCEPT'
        ? 'Found structural table/chart signal with sourcing evidence terms.'
        : 'Could not prove both structure and evidence terms in accessible browser text.',
    });
  }
}

async function collectTableChartSignals(page, bodyText) {
  const signals = [];
  for (const expectation of TABLE_CHART_EXPECTATIONS) {
    for (const selector of expectation.selectors) {
      const count = await page.locator(selector).count().catch(() => 0);
      if (count > 0) signals.push({ key: expectation.key, selector, count });
    }
    const terms = matchTerms(bodyText, expectation.terms);
    if (terms.length > 0) signals.push({ key: expectation.key, selector: 'body text', count: terms.length, terms });
  }
  return signals;
}

function summarize(report) {
  const allVerdicts = [
    ...report.lifecycle.map((item) => item.verdict),
    ...report.personas.map((item) => item.verdict),
    ...report.tableChartEvidence.map((item) => item.verdict),
  ];
  report.summary = {
    accepts: allVerdicts.filter((verdict) => verdict === 'ACCEPT').length,
    defers: allVerdicts.filter((verdict) => verdict === 'DEFER').length,
    rejects: allVerdicts.filter((verdict) => verdict === 'REJECT').length,
    routesChecked: report.routes.length,
    accessibleRoutes: report.routes.filter((route) => route.browserAccess === 'accessible').length,
    blockedRoutes: report.routes.filter((route) => route.browserAccess === 'blocked').length,
    browserStatus: report.routes.some((route) => route.browserAccess === 'accessible')
      ? 'accessible'
      : report.routes.some((route) => route.browserAccess === 'blocked')
        ? 'blocked'
        : report.routes.length > 0
          ? 'error'
          : 'not-run',
  };
}

function writeReports(report) {
  fs.writeFileSync(path.join(outDir, 'source-ava-crawl.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'source-ava-crawl.md'), renderMarkdown(report));
}

function renderMarkdown(report) {
  const lines = [
    '# Source/aVa Crawl Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Base URL: ${report.baseUrl}`,
    `Event ID: ${report.eventId}`,
    `Mode: ${report.mode}`,
    '',
    '## Summary',
    '',
    `- Verdicts: ACCEPT=${report.summary.accepts} DEFER=${report.summary.defers} REJECT=${report.summary.rejects}`,
    `- Routes checked: ${report.summary.routesChecked}`,
    `- Browser status: ${report.summary.browserStatus}`,
  ];

  if (report.notes.length > 0) {
    lines.push('', '## Notes', '', ...report.notes.map((note) => `- ${note}`));
  }

  lines.push('', '## Routes', '', '| Route | Status | Browser access | Evidence terms |', '|---|---:|---|---|');
  for (const route of report.routes) {
    lines.push(`| \`${route.route}\` | ${route.status ?? ''} | ${route.browserAccess} | ${route.matchedTerms.slice(0, 10).join(', ')} |`);
  }

  lines.push('', '## Lifecycle Checks', '', '| Stage | Verdict | UI evidence | Response evidence | Required fix |', '|---|---|---|---|---|');
  for (const item of report.lifecycle) {
    lines.push(`| ${item.stage} | ${item.verdict} | ${item.uiEvidence.join(', ')} | ${item.responseEvidence.join(', ')} | ${item.requiredFixBeforeRelease} |`);
  }

  lines.push('', '## Persona Verdicts', '');
  for (const item of report.personas) {
    lines.push(
      `### ${item.persona}`,
      '',
      `Persona: ${item.persona}`,
      `Route: \`${item.route}\``,
      `Scenario: ${item.scenario}`,
      `Verdict: ${item.verdict}`,
      `Rationale: ${item.rationale}`,
      `Evidence observed: ${item.evidenceObserved.join(', ') || 'None proved'}`,
      `Nexus response observed: ${item.nexusResponseObserved}`,
      `Failures: ${item.failures.join('; ') || 'None from supplied evidence'}`,
      `Required fix before release: ${item.requiredFixBeforeRelease}`,
      '',
    );
  }

  lines.push('', '## Table And Chart Evidence', '', '| Expectation | Verdict | Rationale |', '|---|---|---|');
  for (const item of report.tableChartEvidence) {
    lines.push(`| ${item.label} | ${item.verdict} | ${item.rationale} |`);
  }

  return `${lines.join('\n')}\n`;
}

function verdictFrom({ blocked, uiScore, responseScore, hasRejectTerm: rejectedResponse }) {
  if (rejectedResponse) return 'REJECT';
  if (blocked) return 'DEFER';
  if (responseScore == null) {
    if (uiScore >= 0.6) return 'DEFER';
    return 'REJECT';
  }
  if (uiScore >= 0.5 && responseScore >= 0.5) return 'ACCEPT';
  if (uiScore >= 0.3 || responseScore >= 0.3) return 'DEFER';
  return 'REJECT';
}

function rationaleFor(verdict, blocked, response) {
  if (blocked) return 'Browser route was protected or redirected to auth; signed-in behavior was not proven.';
  if (!response) return verdict === 'REJECT'
    ? 'Required UI evidence was not found and no captured aVa response was supplied.'
    : 'Some UI evidence was found, but aVa response quality was not scored because no response file was supplied.';
  if (verdict === 'ACCEPT') return 'UI evidence and captured aVa response both met the deterministic evidence threshold.';
  if (verdict === 'DEFER') return 'Partial evidence was present, but one or more expected UI or response grounding signals were missing.';
  return 'Required Source/aVa grounding, actionability, or evidence signals were missing.';
}

function fixFor(verdict, label, blocked, response) {
  if (verdict === 'ACCEPT') return 'None.';
  if (blocked) return 'Run with a signed-in browser session or test credentials and attach the resulting report before release.';
  if (!response) return `Capture and score aVa/Nexus output for ${label}; UI-only evidence is not enough for release.`;
  return `Add missing ${label} evidence, grounding, owner/action, and unsupported-claim labeling before release.`;
}

function failuresFor(verdict, uiTerms, uiMatches, responseTerms, responseMatches, blocked, response) {
  const failures = [];
  if (blocked) failures.push('Browser access blocked by auth or route protection');
  const missingUi = uiTerms.filter((term) => !uiMatches.includes(term));
  if (missingUi.length > 0) failures.push(`Missing UI terms: ${missingUi.slice(0, 5).join(', ')}`);
  if (!response) failures.push('No captured aVa/Nexus response supplied');
  const missingResponse = responseTerms.filter((term) => !responseMatches.includes(term));
  if (response && missingResponse.length > 0) failures.push(`Missing response terms: ${missingResponse.slice(0, 5).join(', ')}`);
  if (verdict === 'ACCEPT') return [];
  return failures;
}

function loadCapturedResponses(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Response file not found: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return Object.fromEntries(parsed.map((item) => [item.key ?? item.persona ?? item.prompt, item.response ?? item.text ?? '']));
    }
    return parsed;
  }
  const sections = {};
  let current = 'default';
  sections[current] = [];
  for (const line of raw.split(/\r?\n/)) {
    const heading = line.match(/^#{1,3}\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = [];
    } else {
      sections[current].push(line);
    }
  }
  return Object.fromEntries(Object.entries(sections).map(([key, lines]) => [key, lines.join('\n').trim()]));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const [name, inlineValue] = arg.slice(2).split('=');
    if (inlineValue != null) parsed[name] = inlineValue;
    else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
      parsed[name] = argv[index + 1];
      index += 1;
    } else {
      parsed[name] = true;
    }
  }
  return parsed;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function activeClientForClient(client) {
  if (!client) return null;
  const key = String(client).toLowerCase();
  const map = {
    apex: 'apexretail',
    apexretail: 'apexretail',
    'apex-retail': 'apexretail',
    skyharbor: 'skyharbor',
    'skyharbor-air': 'skyharbor',
  };
  return map[key] ?? key;
}

function demoEmailForClient(client) {
  const key = activeClientForClient(client);
  const map = {
    apexretail: 'anand.sundaram+apex@thesundaram.com',
    skyharbor: 'anand.sundaram+skyharbor@thesundaram.com',
  };
  return key ? map[key] ?? null : null;
}

function materializeRoute(route) {
  return route.replace('{eventId}', eventId);
}

function compactText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function classifyBrowserAccess(routeResult, bodyText) {
  const finalUrl = routeResult.finalUrl ?? '';
  if ([401, 403].includes(routeResult.status)) return 'blocked';
  if (/\/sign-in|\/sign-up|clerk|authenticate|access-denied|unauthorized/i.test(finalUrl)) return 'blocked';
  if (/sign in|sign-in|authenticate|unauthorized|access denied|publishable key not valid/i.test(bodyText)) return 'blocked';
  if (routeResult.status != null && routeResult.status >= 400) return 'error';
  return 'accessible';
}

function matchTerms(text, terms) {
  const normalized = text.toLowerCase();
  return unique(terms.filter((term) => normalized.includes(term.toLowerCase())));
}

function score(matches, expected) {
  if (expected.length === 0) return 0;
  return matches.length / expected.length;
}

function hasRejectTerm(text, terms) {
  if (!text) return false;
  return terms.some((term) => text.toLowerCase().includes(term.toLowerCase()));
}

function allUiTerms() {
  return unique([
    ...LIFECYCLE_STAGES.flatMap((stage) => stage.uiTerms),
    ...PERSONAS.flatMap((persona) => persona.uiTerms),
    ...TABLE_CHART_EXPECTATIONS.flatMap((expectation) => expectation.terms),
  ]);
}

function combinedTextForRoutes(routes) {
  return routes.map((route) => route.textSample).join('\n');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeName(value) {
  return value.replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'root';
}

function summarizeResponse(response) {
  return compactText(response).slice(0, 500) || 'Empty response supplied.';
}

function numberArg(name, fallback) {
  const value = Number(args[name]);
  return Number.isFinite(value) ? value : fallback;
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
