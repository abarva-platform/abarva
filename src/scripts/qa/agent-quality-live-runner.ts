import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

type AgentName = 'sentinel' | 'atlas' | 'nexus' | 'source' | 'steward';
type DemoGrade = 'A' | 'B' | 'C' | 'D' | 'F';
type RunnerMode = 'dry-run' | 'score-file' | 'live';

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
  };
  failures: string[];
  excerpt: string;
}

interface RunnerOptions {
  mode: RunnerMode;
  answersPath?: string;
  baseUrl?: string;
  cookie?: string;
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
};

function usage(): never {
  console.error(`Usage:
  npm run qa:agent-quality:runner -- --mode dry-run [--agent sentinel] [--tenant apex-retail] [--limit 10]
  npm run qa:agent-quality:score -- --answers /path/to/answers.jsonl [--out /tmp/score.json]
  npm run qa:agent-quality:live -- --base-url https://app.example.com --cookie "$COOKIE" [--out /tmp/answers.jsonl]

Modes:
  dry-run     Lists the corpus cases that would run.
  score-file  Scores captured answers JSONL. Each row: {"id":"case-id","answer":"...","latencyMs":123}
  live        Executes cases through /api/chat/agent and then scores the captured answers.
`);
  process.exit(2);
}

function parseArgs(argv: string[]): RunnerOptions {
  const options: RunnerOptions = {
    mode: 'dry-run',
    cookie: process.env.AGENT_QUALITY_SESSION_COOKIE,
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
  if (options.mode === 'live' && !options.cookie) {
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

function scoreCase(testCase: AgentQualityCase, captured: CapturedAnswer | undefined): CaseScore {
  const answer = captured?.answer ?? '';
  const answerPresent = normalizeText(answer).length > 0;
  const transportOk = !captured?.error && (captured?.status === undefined || (captured.status >= 200 && captured.status < 300));
  const missingTerms = missingRequiredTerms(testCase, answer);
  const forbiddenTerms = foundForbiddenTerms(testCase, answer);
  const citationOk = !testCase.expected.requiresCitations || hasCitationSignal(answer);
  const dissentOk = !testCase.expected.requiresDissent || hasDissentSignal(answer);
  const tenantFactsOk = !testCase.expected.requiresTenantFacts || missingTerms.length === 0;
  const failures: string[] = [];

  if (!transportOk) failures.push(`transport failed${captured?.status ? ` (${captured.status})` : ''}`);
  if (!answerPresent) failures.push('answer missing');
  if (missingTerms.length > 0) failures.push(`missing required terms: ${missingTerms.join(', ')}`);
  if (forbiddenTerms.length > 0) failures.push(`forbidden terms found: ${forbiddenTerms.join(', ')}`);
  if (testCase.expected.requiresTenantFacts && !tenantFactsOk) failures.push('tenant facts missing');
  if (testCase.expected.requiresCitations && !citationOk) failures.push('citation/evidence signal missing');
  if (testCase.expected.requiresDissent && !dissentOk) failures.push('dissent/risk signal missing');

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
    },
    failures,
    excerpt: normalizeText(answer).slice(0, 320),
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

async function runLiveCase(testCase: AgentQualityCase, options: RunnerOptions): Promise<CapturedAnswer> {
  const startedAt = Date.now();
  const response = await fetch(`${options.baseUrl}/api/chat/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: options.cookie ?? '',
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
  return {
    id: testCase.id,
    answer,
    status: response.status,
    latencyMs: Date.now() - startedAt,
    timeToFirstByteMs: timeToFirstByteMs ?? undefined,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  };
}

async function runLive(cases: AgentQualityCase[], options: RunnerOptions): Promise<CapturedAnswer[]> {
  const answers: CapturedAnswer[] = [];
  for (const [index, testCase] of cases.entries()) {
    console.log(`[${index + 1}/${cases.length}] ${testCase.id} · ${testCase.agent} · ${testCase.tenant}`);
    try {
      answers.push(await runLiveCase(testCase, options));
    } catch (error) {
      answers.push({
        id: testCase.id,
        answer: '',
        error: error instanceof Error ? error.message : String(error),
      });
    }
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
