#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { Client } from 'pg';

import {
  answerCioTowerQuestion,
  canonicalCioTowerTenantKey,
  type CioTowerAnswerResult,
} from '../../src/lib/cio-tower/answer';
import { buildTowerQuestionBank, summarizeTowerQuestionBank, type TowerQuestionBankItem } from '../../src/lib/tower/tower-question-bank';

interface ExecuteResult {
  tenantKey: string;
  tenantName: string;
  questionId: string;
  question: string;
  category: string;
  intent: string;
  route: string;
  artifact: string;
  status: 'planned' | 'passed' | 'failed' | 'skipped';
  latencyMs: number | null;
  promptPackageKey: string | null;
  traceKey: string | null;
  promptHash: string | null;
  model: string | null;
  validationStatus: string | null;
  validationErrors: unknown;
  promptText: string | null;
  rawModelOutput: string | null;
  renderedText: string | null;
  error: string | null;
}

interface PromptPackageRow {
  prompt_package_key: string;
  prompt_text: string | null;
}

const DEFAULT_TENANTS = [
  'apex-retail',
  'first-capital-financial',
  'lakeshore-industries',
  'meridian-health',
  'skyharbor-air',
];

const TENANT_NAMES: Record<string, string> = {
  'apex-retail': 'Apex Retail Group',
  'first-capital-financial': 'First Capital Financial',
  'lakeshore-industries': 'Lakeshore Holdings',
  'meridian-health': 'Meridian Health System',
  'skyharbor-air': 'SkyHarbor Air',
};

loadDotEnvLocal();

const tenantKeys = (process.env.TOWER_ANSWER_EXECUTE_TENANTS ?? DEFAULT_TENANTS.join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map(canonicalCioTowerTenantKey);
const sampleLimit = numericEnv('TOWER_ANSWER_EXECUTE_SAMPLE_LIMIT', numericFlag('--sample-limit', 10));
const totalLimit = numericEnv('TOWER_ANSWER_EXECUTE_TOTAL_LIMIT', numericFlag('--total-limit', 0));
const concurrency = Math.max(1, numericEnv('TOWER_ANSWER_EXECUTE_CONCURRENCY', numericFlag('--concurrency', 1)));
const dryRun = process.env.TOWER_ANSWER_EXECUTE_DRY_RUN === '1' || process.argv.includes('--dry-run');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = process.env.TOWER_ANSWER_EXECUTE_OUT_DIR
  ?? path.join('/Users/anand/Downloads', `tower-answer-contract-executor-${timestamp}`);

function loadDotEnvLocal(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = [
    process.env.ABARVA_ENV_FILE,
    path.join(process.cwd(), '.env.local'),
    '/Users/anand/Projects/nexus/.env.local',
  ].find((candidate): candidate is string => Boolean(candidate && fs.existsSync(candidate)));
  if (!envPath) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    if (process.env[key]) continue;
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

function numericFlag(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

function numericEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file: string, body: string): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body);
}

function selectQuestionSample(bank: readonly TowerQuestionBankItem[], requestedLimit: number): TowerQuestionBankItem[] {
  if (!Number.isFinite(requestedLimit) || requestedLimit <= 0 || requestedLimit >= bank.length) return [...bank];
  const selected: TowerQuestionBankItem[] = [];
  const seen = new Set<string>();
  const add = (items: readonly TowerQuestionBankItem[], max = items.length) => {
    for (const item of items.slice(0, max)) {
      if (seen.has(item.id)) continue;
      selected.push(item);
      seen.add(item.id);
      if (selected.length >= requestedLimit) return;
    }
  };

  for (const category of ['safety', 'handoff', 'metric', 'dataset', 'cross_dimension', 'gap', 'advisory']) {
    const byDataset = new Map<string, TowerQuestionBankItem[]>();
    for (const item of bank.filter((candidate) => candidate.category === category)) {
      byDataset.set(item.dataset, [...(byDataset.get(item.dataset) ?? []), item]);
    }
    for (const items of byDataset.values()) {
      add(items, category === 'metric' ? 6 : 3);
      if (selected.length >= requestedLimit) return selected;
    }
  }

  add(bank);
  return selected;
}

function plannedResult(tenantKey: string, item: TowerQuestionBankItem): ExecuteResult {
  return {
    tenantKey,
    tenantName: TENANT_NAMES[tenantKey] ?? tenantKey,
    questionId: item.id,
    question: item.question,
    category: item.category,
    intent: item.intent,
    route: item.route,
    artifact: item.artifact,
    status: 'planned',
    latencyMs: null,
    promptPackageKey: null,
    traceKey: null,
    promptHash: null,
    model: null,
    validationStatus: null,
    validationErrors: null,
    promptText: null,
    rawModelOutput: null,
    renderedText: null,
    error: null,
  };
}

async function loadPromptText(client: Client, promptPackageKey: string | null): Promise<string | null> {
  if (!promptPackageKey) return null;
  const result = await client.query<PromptPackageRow>(
    `select prompt_text from cio_tower.prompt_packages where prompt_package_key = $1 limit 1`,
    [promptPackageKey],
  );
  return result.rows[0]?.prompt_text ?? null;
}

function resultFromAnswer(
  planned: ExecuteResult,
  answer: CioTowerAnswerResult,
  promptText: string | null,
): ExecuteResult {
  return {
    ...planned,
    status: 'passed',
    latencyMs: answer.latencyMs,
    promptPackageKey: answer.promptPackageKey,
    traceKey: answer.traceKey,
    promptHash: answer.promptHash,
    model: answer.model,
    validationStatus: answer.validationStatus,
    validationErrors: answer.validationErrors,
    promptText,
    rawModelOutput: answer.modelOutputRaw,
    renderedText: answer.response,
    error: null,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function runOne(client: Client, planned: ExecuteResult): Promise<ExecuteResult> {
  if (dryRun) return { ...planned, status: 'skipped', error: 'dry_run' };
  try {
    const answer = await answerCioTowerQuestion({
      tenantId: planned.tenantKey,
      tenantKey: planned.tenantKey,
      tenantName: planned.tenantName,
      question: planned.question,
      userId: 'tower-answer-contract-executor',
    });
    const promptText = await loadPromptText(client, answer.promptPackageKey);
    return resultFromAnswer(planned, answer, promptText);
  } catch (error) {
    const cause = error instanceof Error ? error.cause as { promptPackageKey?: string; traceKey?: string; rawResponse?: string; validationErrors?: unknown } | undefined : undefined;
    const promptText = await loadPromptText(client, cause?.promptPackageKey ?? null).catch(() => null);
    return {
      ...planned,
      status: 'failed',
      promptPackageKey: cause?.promptPackageKey ?? null,
      traceKey: cause?.traceKey ?? null,
      validationErrors: cause?.validationErrors ?? null,
      promptText,
      rawModelOutput: cause?.rawResponse ?? null,
      error: errorMessage(error),
    };
  }
}

async function runWithConcurrency<T, R>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function countBy<T, K extends keyof T>(items: readonly T[], key: K): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const value = String(item[key] ?? 'unknown');
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(args: {
  results: readonly ExecuteResult[];
  questionBankSummary: ReturnType<typeof summarizeTowerQuestionBank>;
}): string {
  const counts = countBy(args.results, 'status');
  const rows = args.results.slice(0, 200).map((row) => `
    <section class="card ${row.status}">
      <div class="head">
        <div>
          <p>${escapeHtml(row.tenantKey)} · ${escapeHtml(row.category)} · ${escapeHtml(row.intent)} · ${escapeHtml(row.route)}</p>
          <h2>${escapeHtml(row.question)}</h2>
        </div>
        <strong>${escapeHtml(row.status)}</strong>
      </div>
      <div class="grid">
        <div>
          <h3>Prompt sent to Claude</h3>
          <pre>${escapeHtml(row.promptText ?? row.error ?? 'not executed')}</pre>
        </div>
        <div>
          <h3>Raw Claude output</h3>
          <pre>${escapeHtml(row.rawModelOutput ?? '')}</pre>
        </div>
        <div>
          <h3>Rendered answer text</h3>
          <pre>${escapeHtml(row.renderedText ?? '')}</pre>
          <h3>Trace</h3>
          <pre>${escapeHtml(JSON.stringify({
            promptPackageKey: row.promptPackageKey,
            traceKey: row.traceKey,
            latencyMs: row.latencyMs,
            validationStatus: row.validationStatus,
            validationErrors: row.validationErrors,
            error: row.error,
          }, null, 2))}</pre>
        </div>
      </div>
    </section>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower answer contract executor</title>
  <style>
    body { margin: 32px; background: #f8f6f1; color: #07142d; font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    h1 { margin: 0 0 8px; font: 700 42px/1.05 Georgia, serif; }
    h2 { margin: 4px 0 0; font-size: 20px; }
    h3 { color: #607089; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .metric, .card { background: #fff; border: 1px solid #ddd7cc; border-radius: 8px; padding: 16px; box-shadow: 0 8px 30px rgba(7, 20, 45, .06); }
    .metric strong { display: block; font-size: 28px; font-family: Georgia, serif; }
    .head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
    .head p { margin: 0; color: #087245; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: 11px; }
    .passed strong { color: #07592f; }
    .failed strong { color: #8f1f1f; }
    .skipped strong { color: #8a5a00; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #101828; color: #f5f7fb; border-radius: 6px; padding: 14px; max-height: 520px; overflow: auto; }
    @media (max-width: 1200px) { .grid, .summary { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>Tower answer contract executor</h1>
  <p>Generated ${escapeHtml(new Date().toISOString())}. This report captures the exact prompt sent to Claude, raw Claude output, and the rendered answer text. The renderer is expected to be pure placement; answer wording belongs in the prompt/model contract.</p>
  <div class="summary">
    <div class="metric"><span>Question bank</span><strong>${args.questionBankSummary.total.toLocaleString()}</strong></div>
    <div class="metric"><span>Executed/planned</span><strong>${args.results.length.toLocaleString()}</strong></div>
    <div class="metric"><span>Passed</span><strong>${(counts.passed ?? 0).toLocaleString()}</strong></div>
    <div class="metric"><span>Failed</span><strong>${(counts.failed ?? 0).toLocaleString()}</strong></div>
  </div>
  <div class="card">
    <h2>Summary JSON</h2>
    <pre>${escapeHtml(JSON.stringify({ counts, questionBankSummary: args.questionBankSummary }, null, 2))}</pre>
  </div>
  ${rows}
</body>
</html>`;
}

async function main(): Promise<void> {
  if (!dryRun && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required unless TOWER_ANSWER_EXECUTE_DRY_RUN=1 is set.');
  }

  const bank = buildTowerQuestionBank();
  const sample = selectQuestionSample(bank, sampleLimit);
  const planned = tenantKeys.flatMap((tenantKey) => sample.map((item) => plannedResult(tenantKey, item)));
  const selected = totalLimit > 0 ? planned.slice(0, totalLimit) : planned;

  ensureDir(outDir);
  writeFile(path.join(outDir, 'question-bank-summary.json'), JSON.stringify(summarizeTowerQuestionBank(bank), null, 2));
  writeFile(path.join(outDir, 'execution-plan.json'), JSON.stringify(selected, null, 2));

  const client = dryRun
    ? null
    : new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  if (client) await client.connect();

  try {
    const results = client
      ? await runWithConcurrency(selected, async (row, index) => {
        console.log(JSON.stringify({
          event: 'tower_answer_execute_start',
          index: index + 1,
          total: selected.length,
          tenantKey: row.tenantKey,
          questionId: row.questionId,
          question: row.question,
        }));
        const result = await runOne(client, row);
        console.log(JSON.stringify({
          event: 'tower_answer_execute_done',
          index: index + 1,
          total: selected.length,
          tenantKey: row.tenantKey,
          questionId: row.questionId,
          status: result.status,
          latencyMs: result.latencyMs,
          traceKey: result.traceKey,
          error: result.error,
        }));
        return result;
      })
      : selected.map((row) => ({ ...row, status: 'skipped' as const, error: 'dry_run' }));

    writeFile(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
    writeFile(path.join(outDir, 'report.html'), buildHtml({
      results,
      questionBankSummary: summarizeTowerQuestionBank(bank),
    }));

    const summary = {
      outDir,
      report: path.join(outDir, 'report.html'),
      dryRun,
      tenantKeys,
      sampleQuestions: sample.length,
      totalPlanned: selected.length,
      concurrency,
      counts: countBy(results, 'status'),
    };
    writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));

    if (results.some((row) => row.status === 'failed')) {
      process.exitCode = 1;
    }
  } finally {
    if (client) await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
