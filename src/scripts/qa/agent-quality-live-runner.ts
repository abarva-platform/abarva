import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium, expect, type Browser, type Page } from '@playwright/test';
import {
  validateCxoAnswer,
  type CxoTenantKey,
} from '@/lib/agent/quality/cxo-answer-quality';

type AgentName = 'sentinel' | 'atlas' | 'nexus' | 'source' | 'steward';
type DemoGrade = 'A' | 'B' | 'C' | 'D' | 'F';
type RunnerMode = 'dry-run' | 'score-file' | 'live';
type AuthMode = 'cookie' | 'demo-sign-in';

interface AgentQualityCase {
  id: string;
  agent: AgentName;
  tenant: string;
  persona: string;
  category: string;
  surface: string;
  prompt: string;
  expected: {
    requiresTenantFacts: boolean;
    requiresCitations: boolean;
    requiresDissent: boolean;
    requiredTerms: string[];
    forbiddenTerms: string[];
  };
}

interface CapturedAnswer {
  id: string;
  answer: string;
  latencyMs?: number;
  timeToFirstByteMs?: number;
  status?: number;
  error?: string;
}

interface CaseScore {
  id: string;
  agent: AgentName;
  tenant: string;
  persona: string;
  category: string;
  surface: string;
  grade: DemoGrade;
  passed: boolean;
  latencyMs: number | null;
  timeToFirstByteMs: number | null;
  checks: {
    requiredTerms: { passed: boolean; missing: string[] };
    forbiddenTerms: { passed: boolean; found: string[] };
    tenantFacts: 'pass' | 'fail' | 'not-required';
    citations: 'pass' | 'fail' | 'not-required';
    dissent: 'pass' | 'fail' | 'not-required';
    answerPresent: boolean;
    transport: 'pass' | 'fail';
    cxoQuality: 'pass' | 'fail';
  };
  failures: string[];
  excerpt: string;
}

interface RunnerOptions {
  mode: RunnerMode;
  answersPath?: string;
  baseUrl?: string;
  cookie?: string;
  authMode: AuthMode;
  demoPassword: string;
  demoAccessCode: string;
  outPath?: string;
  agent?: AgentName;
  tenant?: string;
  limit?: number;
  failOnGrade?: DemoGrade;
}

const CORPUS_DIR = path.join(process.cwd(), 'tests/agent-quality/golden');
const AGENTS: AgentName[] = ['sentinel', 'atlas', 'nexus', 'source', 'steward'];
const GRADE_ORDER: Record<DemoGrade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };
const DEFAULT_FAIL_ON_GRADE: DemoGrade = 'D';

const AGENT_DISPLAY: Record<AgentName, string> = {
  sentinel: 'Sentinel',
  atlas: 'Atlas',
  nexus: 'Nexus',
  source: 'Source',
  steward: 'Steward',
};

const TENANT_DISPLAY: Record<string, string> = {
  'apex-retail': 'Apex Retail Group',
  'meridian-health': 'Meridian Health System',
  'first-capital': 'First Capital Financial',
  'skyharbor-air': 'SkyHarbor Air',
};

const DEMO_EMAILS: Record<string, Partial<Record<string, string>> & { default: string }> = {
  'apex-retail': {
    default: 'cio@apex-retail.example.com',
    cio: 'cio@apex-retail.example.com',
    cdo: 'cdo@apex-retail.example.com',
  },
  'meridian-health': {
    default: 'cdio@meridian-health.example.com',
    cdio: 'cdio@meridian-health.example.com',
    cdao: 'cdao@meridian-health.example.com',
  },
  'first-capital': {
    default: 'cio@firstcapital.example.com',
    cio: 'cio@firstcapital.example.com',
  },
  'skyharbor-air': {
    default: 'cto@skyharbor-air.example.com',
    cto: 'cto@skyharbor-air.example.com',
    cio: 'cio@skyharbor-air.example.com',
  },
};

function usage(): never {
  console.error(`Usage:
  npm run qa:agent-quality:runner -- --mode dry-run [--agent sentinel] [--tenant apex-retail] [--limit 10]
  npm run qa:agent-quality:score -- --answers /path/to/answers.jsonl [--out /tmp/score.json]
  npm run qa:agent-quality:live -- --base-url https://app.example.com --cookie "$COOKIE" [--out /tmp/answers.jsonl]
  npm run qa:agent-quality:live -- --base-url https://app.example.com --auth-mode demo-sign-in [--out /tmp/answers.jsonl]

Modes:
  dry-run     Lists the corpus cases that would run.
  score-file  Scores captured answers JSONL. Each row: {"id":"case-id","answer":"...","latencyMs":123}
  live        Executes cases through /api/chat/agent and then scores the captured answers.

Auth:
  cookie        Uses --cookie or AGENT_QUALITY_SESSION_COOKIE for every case.
  demo-sign-in  Signs in through /sign-in per case using canonical demo accounts.
`);
  process.exit(2);
}

function parseArgs(argv: string[]): RunnerOptions {
  const options: RunnerOptions = {
    mode: 'dry-run',
    cookie: process.env.AGENT_QUALITY_SESSION_COOKIE,
    authMode: (process.env.AGENT_QUALITY_AUTH_MODE as AuthMode | undefined) ?? 'cookie',
    demoPassword: process.env.E2E_DEMO_PASSWORD ?? 'Demo2026!',
    demoAccessCode: process.env.E2E_DEMO_ACCESS_CODE ?? '424242',
    failOnGrade: DEFAULT_FAIL_ON_GRADE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--mode' && next) {
      if (!['dry-run', 'score-file', 'live'].includes(next)) usage();
      options.mode = next as RunnerMode;
      index += 1;
      continue;
    }
    if (arg === '--answers' && next) {
      options.answersPath = next;
      index += 1;
      continue;
    }
    if (arg === '--base-url' && next) {
      options.baseUrl = next.replace(/\/$/, '');
      index += 1;
      continue;
    }
    if (arg === '--cookie' && next) {
      options.cookie = next;
      index += 1;
      continue;
    }
    if (arg === '--auth-mode' && next) {
      if (!['cookie', 'demo-sign-in'].includes(next)) usage();
      options.authMode = next as AuthMode;
      index += 1;
      continue;
    }
    if (arg === '--demo-password' && next) {
      options.demoPassword = next;
      index += 1;
      continue;
    }
    if (arg === '--demo-access-code' && next) {
      options.demoAccessCode = next;
      index += 1;
      continue;
    }
    if (arg === '--out' && next) {
      options.outPath = next;
      index += 1;
      continue;
    }
    if (arg === '--agent' && next) {
      if (!AGENTS.includes(next as AgentName)) usage();
      options.agent = next as AgentName;
      index += 1;
      continue;
    }
    if (arg === '--tenant' && next) {
      options.tenant = next;
      index += 1;
      continue;
    }
    if (arg === '--limit' && next) {
      const limit = Number(next);
      if (!Number.isInteger(limit) || limit < 1) usage();
      options.limit = limit;
      index += 1;
      continue;
    }
    if (arg === '--fail-on-grade' && next) {
      if (!['A', 'B', 'C', 'D', 'F'].includes(next)) usage();
      options.failOnGrade = next as DemoGrade;
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') usage();
    usage();
  }

  if (options.mode === 'score-file' && !options.answersPath) usage();
  if (options.mode === 'live' && !options.baseUrl) usage();
  if (options.mode === 'live' && options.authMode === 'cookie' && !options.cookie) {
    throw new Error('live mode requires --cookie or AGENT_QUALITY_SESSION_COOKIE');
  }

  return options;
}

function parseCorpus(): AgentQualityCase[] {
  const files = fs.readdirSync(CORPUS_DIR)
    .filter((file) => file.endsWith('.jsonl'))
    .sort();

  const cases: AgentQualityCase[] = [];
  for (const file of files) {
    const fullPath = path.join(CORPUS_DIR, file);
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      try {
        cases.push(JSON.parse(line) as AgentQualityCase);
      } catch (error) {
        throw new Error(`${file}:${index + 1} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  return cases;
}

function filteredCases(cases: AgentQualityCase[], options: RunnerOptions): AgentQualityCase[] {
  let selected = cases;
  if (options.agent) selected = selected.filter((testCase) => testCase.agent === options.agent);
  if (options.tenant) selected = selected.filter((testCase) => testCase.tenant === options.tenant);
  if (options.limit) selected = selected.slice(0, options.limit);
  return selected;
}

function readJsonl<T>(filePath: string): T[] {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  return lines.filter((line) => line.trim().length > 0).map((line, index) => {
    try {
      return JSON.parse(line) as T;
    } catch (error) {
      throw new Error(`${filePath}:${index + 1} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function writeJsonl(filePath: string, rows: unknown[]): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function stripAgentArtifacts(answer: string): string {
  return answer.replace(/\[\[artifact:[^\]]+\]\][\s\S]*?\[\[\/artifact\]\]/g, ' ');
}

function lower(text: string): string {
  return normalizeText(text).toLocaleLowerCase();
}

function includesTerm(answerLower: string, term: string): boolean {
  return answerLower.includes(term.toLocaleLowerCase());
}

function missingRequiredTerms(testCase: AgentQualityCase, answer: string): string[] {
  const answerLower = lower(answer);
  return testCase.expected.requiredTerms.filter((term) => !includesTerm(answerLower, term));
}

function foundForbiddenTerms(testCase: AgentQualityCase, answer: string): string[] {
  const answerLower = lower(answer);
  return testCase.expected.forbiddenTerms.filter((term) => includesTerm(answerLower, term));
}

function hasCitationSignal(answer: string): boolean {
  const patterns = [
    /\b(?:P|UC|FC|MH|APX|SRC|VEN|REG|F)-[A-Z0-9-]{2,}\b/i,
    /\bSR\s*11-7\b/i,
    /\bMH-\d{2}\b/i,
    /\bFC-\d{2}\b/i,
    /\bAR-\d{2}\b/i,
    /\bpattern\b/i,
    /\bevidence\b/i,
    /\bsource(?:s|d)?\b/i,
    /\bcorpus\b/i,
  ];
  return patterns.some((pattern) => pattern.test(answer));
}

function hasDissentSignal(answer: string): boolean {
  const patterns = [
    /\b(push back|strongest argument against|argument against|would be wrong|what would change|risk|blocker|however|but|unless|not enough|watch|challenge|counter)\b/i,
  ];
  return patterns.some((pattern) => pattern.test(answer));
}

function gradeFromFailures(failures: string[], forbiddenTermsFound: string[], hasAnswer: boolean, transportOk: boolean): DemoGrade {
  if (!transportOk || !hasAnswer) return 'F';
  if (forbiddenTermsFound.length > 0) return failures.length >= 3 ? 'F' : 'D';
  if (failures.length === 0) return 'A';
  if (failures.length === 1) return 'B';
  if (failures.length === 2) return 'C';
  if (failures.length === 3) return 'D';
  return 'F';
}

function toCxoTenantKey(tenant: string): CxoTenantKey | undefined {
  if (
    tenant === 'apex-retail' ||
    tenant === 'meridian-health' ||
    tenant === 'skyharbor-air'
  ) {
    return tenant;
  }
  return undefined;
}

function scoreCase(testCase: AgentQualityCase, captured: CapturedAnswer | undefined): CaseScore {
  const answer = captured?.answer ?? '';
  const visibleAnswer = stripAgentArtifacts(answer);
  const answerPresent = normalizeText(visibleAnswer).length > 0;
  const transportOk = !captured?.error && (captured?.status === undefined || (captured.status >= 200 && captured.status < 300));
  const missingTerms = missingRequiredTerms(testCase, visibleAnswer);
  const forbiddenTerms = foundForbiddenTerms(testCase, visibleAnswer);
  const citationOk = !testCase.expected.requiresCitations || hasCitationSignal(visibleAnswer);
  const dissentOk = !testCase.expected.requiresDissent || hasDissentSignal(visibleAnswer);
  const tenantFactsOk = !testCase.expected.requiresTenantFacts || missingTerms.length === 0;
  const tenantKey = toCxoTenantKey(testCase.tenant);
  const cxoQuality = validateCxoAnswer({
    text: visibleAnswer,
    tenant: tenantKey
      ? {
          tenantKey,
          tenantDisplayName: TENANT_DISPLAY[testCase.tenant] ?? testCase.tenant,
        }
      : undefined,
    expectedActionable: true,
    allowQuotedUserPrompt: testCase.prompt,
  });
  const failures: string[] = [];

  if (!transportOk) failures.push(`transport failed${captured?.status ? ` (${captured.status})` : ''}`);
  if (!answerPresent) failures.push('answer missing');
  if (missingTerms.length > 0) failures.push(`missing required terms: ${missingTerms.join(', ')}`);
  if (forbiddenTerms.length > 0) failures.push(`forbidden terms found: ${forbiddenTerms.join(', ')}`);
  if (testCase.expected.requiresTenantFacts && !tenantFactsOk) failures.push('tenant facts missing');
  if (testCase.expected.requiresCitations && !citationOk) failures.push('citation/evidence signal missing');
  if (testCase.expected.requiresDissent && !dissentOk) failures.push('dissent/risk signal missing');
  if (!cxoQuality.passed) {
    failures.push(
      `CXO quality failed: ${cxoQuality.issues
        .map((issue) => issue.code)
        .join(', ')}`,
    );
  }

  const grade = gradeFromFailures(failures, forbiddenTerms, answerPresent, transportOk);
  return {
    id: testCase.id,
    agent: testCase.agent,
    tenant: testCase.tenant,
    persona: testCase.persona,
    category: testCase.category,
    surface: testCase.surface,
    grade,
    passed: grade === 'A' || grade === 'B',
    latencyMs: captured?.latencyMs ?? null,
    timeToFirstByteMs: captured?.timeToFirstByteMs ?? null,
    checks: {
      requiredTerms: { passed: missingTerms.length === 0, missing: missingTerms },
      forbiddenTerms: { passed: forbiddenTerms.length === 0, found: forbiddenTerms },
      tenantFacts: testCase.expected.requiresTenantFacts ? (tenantFactsOk ? 'pass' : 'fail') : 'not-required',
      citations: testCase.expected.requiresCitations ? (citationOk ? 'pass' : 'fail') : 'not-required',
      dissent: testCase.expected.requiresDissent ? (dissentOk ? 'pass' : 'fail') : 'not-required',
      answerPresent,
      transport: transportOk ? 'pass' : 'fail',
      cxoQuality: cxoQuality.passed ? 'pass' : 'fail',
    },
    failures,
    excerpt: normalizeText(visibleAnswer).slice(0, 320),
  };
}

function summarizeScores(scores: CaseScore[], failOnGrade: DemoGrade): Record<string, unknown> {
  const byAgent: Record<string, { total: number; pass: number; fail: number; grades: Record<DemoGrade, number> }> = {};
  const byTenant: Record<string, { total: number; pass: number; fail: number }> = {};
  const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 } as Record<DemoGrade, number>;
  let pass = 0;
  let fail = 0;

  for (const score of scores) {
    grades[score.grade] += 1;
    if (score.passed) pass += 1;
    else fail += 1;

    byAgent[score.agent] ??= { total: 0, pass: 0, fail: 0, grades: { A: 0, B: 0, C: 0, D: 0, F: 0 } };
    byAgent[score.agent].total += 1;
    byAgent[score.agent][score.passed ? 'pass' : 'fail'] += 1;
    byAgent[score.agent].grades[score.grade] += 1;

    byTenant[score.tenant] ??= { total: 0, pass: 0, fail: 0 };
    byTenant[score.tenant].total += 1;
    byTenant[score.tenant][score.passed ? 'pass' : 'fail'] += 1;
  }

  const blockingFailures = scores.filter((score) => GRADE_ORDER[score.grade] <= GRADE_ORDER[failOnGrade]);

  return {
    total: scores.length,
    pass,
    fail,
    grades,
    byAgent,
    byTenant,
    failOnGrade,
    blockingFailures: blockingFailures.length,
    failures: scores
      .filter((score) => score.failures.length > 0)
      .map((score) => ({
        id: score.id,
        agent: score.agent,
        tenant: score.tenant,
        grade: score.grade,
        failures: score.failures,
        excerpt: score.excerpt,
      })),
  };
}

async function readStreamText(response: Response): Promise<{ answer: string; timeToFirstByteMs: number | null }> {
  if (!response.body) return { answer: '', timeToFirstByteMs: null };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const startedAt = Date.now();
  let firstByteAt: number | null = null;
  let answer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.byteLength > 0 && firstByteAt === null) firstByteAt = Date.now();
    answer += decoder.decode(value, { stream: true });
  }
  answer += decoder.decode();
  return {
    answer,
    timeToFirstByteMs: firstByteAt === null ? null : firstByteAt - startedAt,
  };
}

async function typeCredential(page: Page, placeholder: RegExp, value: string): Promise<void> {
  const field = page.getByPlaceholder(placeholder);
  await field.fill('');
  await field.click();
  await page.keyboard.type(value, { delay: 4 });
  await expect(field).toHaveValue(value);
}

function demoEmailForCase(testCase: AgentQualityCase): string {
  const tenantEmails = DEMO_EMAILS[testCase.tenant];
  if (!tenantEmails) {
    throw new Error(`No demo sign-in account configured for tenant ${testCase.tenant}`);
  }
  return tenantEmails[testCase.persona] ?? tenantEmails.default;
}

async function mintDemoCookieHeaderOnce(testCase: AgentQualityCase, options: RunnerOptions, browser: Browser): Promise<string> {
  if (!options.baseUrl) throw new Error('baseUrl is required for demo sign-in auth');
  const email = demoEmailForCase(testCase);
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${options.baseUrl}/sign-in`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.getByPlaceholder(/name@company.com/i)).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => Boolean((globalThis as { Clerk?: { loaded?: boolean } }).Clerk?.loaded), null, { timeout: 30_000 });
    await typeCredential(page, /name@company.com/i, email);
    await typeCredential(page, /Password from invite/i, options.demoPassword);
    await typeCredential(page, /6-digit code/i, options.demoAccessCode);
    await expect(page.getByRole('button', { name: /sign in|continue/i })).toBeEnabled({ timeout: 10_000 });
    await page.getByRole('button', { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/home/, { timeout: 30_000 });
    await page.waitForFunction(() => document.cookie.includes('__session='), null, { timeout: 30_000 });
    const cookies = await context.cookies(options.baseUrl);
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  } finally {
    await context.close();
  }
}

async function mintDemoCookieHeader(testCase: AgentQualityCase, options: RunnerOptions, browser: Browser): Promise<string> {
  const attempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await mintDemoCookieHeaderOnce(testCase, options, browser);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.warn(`Demo sign-in failed for ${testCase.id}; retrying (${attempt}/${attempts})`);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function isHtmlFallback(contentType: string, answer: string): boolean {
  const trimmed = answer.trimStart().slice(0, 200).toLocaleLowerCase();
  return contentType.toLocaleLowerCase().includes('text/html')
    || trimmed.startsWith('<!doctype html')
    || trimmed.startsWith('<html');
}

async function cookieForCase(testCase: AgentQualityCase, options: RunnerOptions, browser: Browser | null): Promise<string> {
  if (options.authMode === 'demo-sign-in') {
    if (!browser) throw new Error('demo-sign-in auth requires a Playwright browser');
    return mintDemoCookieHeader(testCase, options, browser);
  }
  return options.cookie ?? '';
}

async function runLiveCase(testCase: AgentQualityCase, options: RunnerOptions, browser: Browser | null): Promise<CapturedAnswer> {
  const startedAt = Date.now();
  const cookie = await cookieForCase(testCase, options, browser);
  const response = await fetch(`${options.baseUrl}/api/chat/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      message: testCase.prompt,
      agentName: AGENT_DISPLAY[testCase.agent],
      tenantName: TENANT_DISPLAY[testCase.tenant] ?? testCase.tenant,
      surface: testCase.surface,
      surfaceContext: {
        agentQualityRun: true,
        caseId: testCase.id,
        tenant: testCase.tenant,
        persona: testCase.persona,
        category: testCase.category,
      },
    }),
  });

  const { answer, timeToFirstByteMs } = await readStreamText(response);
  const contentType = response.headers.get('content-type') ?? '';
  const htmlFallback = isHtmlFallback(contentType, answer);
  return {
    id: testCase.id,
    answer,
    status: response.status,
    latencyMs: Date.now() - startedAt,
    timeToFirstByteMs: timeToFirstByteMs ?? undefined,
    error: response.ok && !htmlFallback ? undefined : `HTTP ${response.status}${htmlFallback ? ' HTML response' : ''}`,
  };
}

async function runLive(cases: AgentQualityCase[], options: RunnerOptions): Promise<CapturedAnswer[]> {
  const answers: CapturedAnswer[] = [];
  const browser = options.authMode === 'demo-sign-in' ? await chromium.launch({ headless: true }) : null;
  try {
    for (const [index, testCase] of cases.entries()) {
      console.log(`[${index + 1}/${cases.length}] ${testCase.id} · ${testCase.agent} · ${testCase.tenant}`);
      try {
        answers.push(await runLiveCase(testCase, options, browser));
      } catch (error) {
        answers.push({
          id: testCase.id,
          answer: '',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    await browser?.close();
  }
  return answers;
}

function scoreAnswers(cases: AgentQualityCase[], answers: CapturedAnswer[], failOnGrade: DemoGrade): {
  summary: Record<string, unknown>;
  scores: CaseScore[];
} {
  const answerById = new Map(answers.map((answer) => [answer.id, answer]));
  const scores = cases.map((testCase) => scoreCase(testCase, answerById.get(testCase.id)));
  return {
    summary: summarizeScores(scores, failOnGrade),
    scores,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const cases = filteredCases(parseCorpus(), options);

  if (cases.length === 0) {
    throw new Error('No agent-quality cases selected.');
  }

  if (options.mode === 'dry-run') {
    const byAgent = cases.reduce<Record<string, number>>((counts, testCase) => {
      counts[testCase.agent] = (counts[testCase.agent] ?? 0) + 1;
      return counts;
    }, {});
    const byTenant = cases.reduce<Record<string, number>>((counts, testCase) => {
      counts[testCase.tenant] = (counts[testCase.tenant] ?? 0) + 1;
      return counts;
    }, {});
    const plan = {
      mode: options.mode,
      total: cases.length,
      byAgent,
      byTenant,
      cases: cases.map(({ id, agent, tenant, persona, category, surface }) => ({
        id,
        agent,
        tenant,
        persona,
        category,
        surface,
      })),
    };
    console.log(JSON.stringify(plan, null, 2));
    if (options.outPath) fs.writeFileSync(options.outPath, `${JSON.stringify(plan, null, 2)}\n`);
    return;
  }

  const answers = options.mode === 'live'
    ? await runLive(cases, options)
    : readJsonl<CapturedAnswer>(options.answersPath as string);

  if (options.mode === 'live' && options.outPath) {
    writeJsonl(options.outPath, answers);
  }

  const result = scoreAnswers(cases, answers, options.failOnGrade ?? DEFAULT_FAIL_ON_GRADE);
  console.log(JSON.stringify(result, null, 2));
  if (options.mode === 'score-file' && options.outPath) {
    fs.writeFileSync(options.outPath, `${JSON.stringify(result, null, 2)}\n`);
  }

  const blockingFailures = result.scores.filter((score) =>
    GRADE_ORDER[score.grade] <= GRADE_ORDER[options.failOnGrade ?? DEFAULT_FAIL_ON_GRADE],
  );

  if (blockingFailures.length > 0) {
    console.error(`Agent-quality runner found ${blockingFailures.length} blocking failure(s).`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
