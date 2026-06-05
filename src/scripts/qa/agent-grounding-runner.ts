import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { buildOpenAiGroundingMessages } from '@/lib/agent-grounding/openai-prompt';
import { buildGroundingReport, renderGroundingHtml } from '@/lib/agent-grounding/report';
import { scoreGroundingCase } from '@/lib/agent-grounding/scorer';
import type {
  AgentGroundingAgent,
  AgentGroundingCapturedAnswer,
  AgentGroundingCase,
  AgentGroundingReport,
  AgentGroundingTenant,
} from '@/lib/agent-grounding/types';

type RunnerMode = 'dry-run' | 'score-file' | 'live' | 'openai';

interface RunnerOptions {
  mode: RunnerMode;
  answersPath?: string;
  baseUrl?: string;
  cookie?: string;
  openAiApiKey?: string;
  openAiModel: string;
  outDir: string;
  agent?: AgentGroundingAgent;
  tenant?: AgentGroundingTenant;
  limit?: number;
  failOnBlockers: boolean;
}

const CURRICULUM_DIR = path.join(process.cwd(), 'tests/agent-grounding/curriculum');
const DEFAULT_OUT_DIR = path.join(process.cwd(), 'reports/agent-grounding/latest');
const AGENTS: AgentGroundingAgent[] = ['sentinel', 'atlas', 'nexus', 'source', 'steward'];
const TENANTS: AgentGroundingTenant[] = ['apex-retail', 'meridian-health', 'skyharbor-air', 'first-capital'];

const AGENT_DISPLAY: Record<AgentGroundingAgent, string> = {
  sentinel: 'Sentinel',
  atlas: 'Atlas',
  nexus: 'Nexus',
  source: 'Source',
  steward: 'Steward',
};

const TENANT_DISPLAY: Record<AgentGroundingTenant, string> = {
  'apex-retail': 'Apex Retail Group',
  'meridian-health': 'Meridian Health',
  'skyharbor-air': 'SkyHarbor Air',
  'first-capital': 'First Capital Financial',
};

function usage(): never {
  console.error(`Usage:
  npm run qa:agent-grounding:dry -- [--agent sentinel] [--tenant meridian-health] [--limit 20]
  npm run qa:agent-grounding:score -- --answers reports/answers.jsonl [--out reports/agent-grounding/latest]
  npm run qa:agent-grounding:live -- --base-url https://app.abarva.ai --cookie "$COOKIE" [--out reports/agent-grounding/latest]
  npm run qa:agent-grounding:openai -- [--openai-model gpt-4.1] [--tenant meridian-health] [--limit 5]

Answer JSONL rows:
  {"id":"case-id","answer":"...","status":200,"mode":"live","latencyMs":1234}

This harness is non-mutating. It evaluates answers; it never uploads or seeds tenant data.
OpenAI mode calls the OpenAI API directly and is a model-only grounding check, not proof of live product retrieval.
`);
  process.exit(2);
}

function parseArgs(argv: string[]): RunnerOptions {
  const options: RunnerOptions = {
    mode: 'dry-run',
    cookie: process.env.AGENT_GROUNDING_SESSION_COOKIE,
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAiModel: process.env.AGENT_GROUNDING_OPENAI_MODEL ?? 'gpt-4.1',
    outDir: process.env.AGENT_GROUNDING_OUT_DIR ?? DEFAULT_OUT_DIR,
    failOnBlockers: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--mode' && next) {
      if (!['dry-run', 'score-file', 'live', 'openai'].includes(next)) usage();
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
    if (arg === '--openai-model' && next) {
      options.openAiModel = next;
      index += 1;
      continue;
    }
    if (arg === '--out' && next) {
      options.outDir = next;
      index += 1;
      continue;
    }
    if (arg === '--agent' && next) {
      if (!AGENTS.includes(next as AgentGroundingAgent)) usage();
      options.agent = next as AgentGroundingAgent;
      index += 1;
      continue;
    }
    if (arg === '--tenant' && next) {
      if (!TENANTS.includes(next as AgentGroundingTenant)) usage();
      options.tenant = next as AgentGroundingTenant;
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
    if (arg === '--no-fail-on-blockers') {
      options.failOnBlockers = false;
      continue;
    }
    if (arg === '--help' || arg === '-h') usage();
    usage();
  }

  if (options.mode === 'score-file' && !options.answersPath) usage();
  if (options.mode === 'live' && (!options.baseUrl || !options.cookie)) {
    throw new Error('live mode requires --base-url and --cookie or AGENT_GROUNDING_SESSION_COOKIE');
  }
  if (options.mode === 'openai' && !options.openAiApiKey) {
    throw new Error('openai mode requires OPENAI_API_KEY');
  }

  return options;
}

function readJsonl<T>(filePath: string): T[] {
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
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

function readCurriculum(): AgentGroundingCase[] {
  const files = fs.readdirSync(CURRICULUM_DIR)
    .filter((file) => file.endsWith('.jsonl'))
    .sort();
  return files.flatMap((file) => readJsonl<AgentGroundingCase>(path.join(CURRICULUM_DIR, file)));
}

function filterCases(cases: AgentGroundingCase[], options: RunnerOptions): AgentGroundingCase[] {
  let selected = cases;
  if (options.agent) selected = selected.filter((testCase) => testCase.agent === options.agent);
  if (options.tenant) selected = selected.filter((testCase) => testCase.tenant === options.tenant);
  if (options.limit) selected = selected.slice(0, options.limit);
  return selected;
}

async function readStreamText(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

function isHtmlFallback(contentType: string, answer: string): boolean {
  const trimmed = answer.trimStart().slice(0, 200).toLocaleLowerCase();
  return contentType.toLocaleLowerCase().includes('text/html')
    || trimmed.startsWith('<!doctype html')
    || trimmed.startsWith('<html');
}

async function runLiveCase(testCase: AgentGroundingCase, options: RunnerOptions): Promise<AgentGroundingCapturedAnswer> {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${options.baseUrl}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: options.cookie ?? '',
      },
      body: JSON.stringify({
        message: testCase.prompt,
        agentName: AGENT_DISPLAY[testCase.agent],
        tenantName: TENANT_DISPLAY[testCase.tenant],
        surface: testCase.surface,
        surfaceContext: {
          agentGroundingRun: true,
          caseId: testCase.id,
          tenant: testCase.tenant,
          persona: testCase.persona,
          category: testCase.category,
        },
      }),
    });
    const answer = await readStreamText(response);
    const contentType = response.headers.get('content-type') ?? '';
    const htmlFallback = isHtmlFallback(contentType, answer);
    return {
      id: testCase.id,
      answer,
      status: response.status,
      mode: normalizeMode(response.headers.get('x-atlas-mode') ?? response.headers.get('x-agent-mode')),
      latencyMs: Date.now() - startedAt,
      error: response.ok && !htmlFallback ? undefined : `HTTP ${response.status}${htmlFallback ? ' HTML response' : ''}`,
    };
  } catch (error) {
    return {
      id: testCase.id,
      answer: '',
      mode: 'unknown',
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runLive(cases: AgentGroundingCase[], options: RunnerOptions): Promise<AgentGroundingCapturedAnswer[]> {
  const answers: AgentGroundingCapturedAnswer[] = [];
  for (const [index, testCase] of cases.entries()) {
    console.log(`[${index + 1}/${cases.length}] ${testCase.id} · ${testCase.agent} · ${testCase.tenant}`);
    answers.push(await runLiveCase(testCase, options));
  }
  return answers;
}

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

async function runOpenAiCase(testCase: AgentGroundingCase, options: RunnerOptions): Promise<AgentGroundingCapturedAnswer> {
  const startedAt = Date.now();
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.openAiModel,
        temperature: 0,
        messages: buildOpenAiGroundingMessages(testCase),
      }),
    });
    const raw = await response.text();
    let parsed: OpenAiChatCompletionResponse | null = null;
    try {
      parsed = JSON.parse(raw) as OpenAiChatCompletionResponse;
    } catch {
      parsed = null;
    }
    const answer = parsed?.choices?.[0]?.message?.content?.trim() ?? raw;
    return {
      id: testCase.id,
      answer,
      status: response.status,
      mode: response.ok ? 'live' : 'unknown',
      latencyMs: Date.now() - startedAt,
      error: response.ok ? undefined : `OpenAI HTTP ${response.status}: ${parsed?.error?.message ?? raw.slice(0, 240)}`,
    };
  } catch (error) {
    return {
      id: testCase.id,
      answer: '',
      mode: 'unknown',
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runOpenAi(cases: AgentGroundingCase[], options: RunnerOptions): Promise<AgentGroundingCapturedAnswer[]> {
  const answers: AgentGroundingCapturedAnswer[] = [];
  for (const [index, testCase] of cases.entries()) {
    console.log(`[${index + 1}/${cases.length}] OpenAI ${options.openAiModel} · ${testCase.id} · ${testCase.agent} · ${testCase.tenant}`);
    answers.push(await runOpenAiCase(testCase, options));
  }
  return answers;
}

function normalizeMode(value: string | null): AgentGroundingCapturedAnswer['mode'] {
  if (value === 'live' || value === 'fallback') return value;
  return 'unknown';
}

function writeReport(report: AgentGroundingReport, outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'raw.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'index.html'), renderGroundingHtml(report));
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const cases = filterCases(readCurriculum(), options);

  if (options.mode === 'dry-run') {
    console.log(`Agent grounding curriculum: ${cases.length} cases`);
    for (const testCase of cases) {
      console.log(`${testCase.id} · ${testCase.agent} · ${testCase.tenant} · ${testCase.category} · ${testCase.prompt}`);
    }
    return;
  }

  const answers = options.mode === 'live'
    ? await runLive(cases, options)
    : options.mode === 'openai'
      ? await runOpenAi(cases, options)
      : readJsonl<AgentGroundingCapturedAnswer>(options.answersPath as string);

  if (options.mode === 'live' || options.mode === 'openai') {
    writeJsonl(path.join(options.outDir, 'answers.jsonl'), answers);
  }

  const answersById = new Map(answers.map((answer) => [answer.id, answer]));
  const scores = cases.map((testCase) => scoreGroundingCase(testCase, answersById.get(testCase.id)));
  const report = buildGroundingReport(scores);
  writeReport(report, options.outDir);

  console.log(`Agent grounding report: ${path.join(options.outDir, 'index.html')}`);
  console.log(JSON.stringify(report.summary, null, 2));

  if (options.failOnBlockers && report.summary.blockers > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
