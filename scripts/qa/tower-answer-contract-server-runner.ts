#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { Client } from 'pg';

import {
  buildCioTowerRightAnswerContracts,
  scoreCioTowerRightAnswerContract,
  type CioTowerAnswerContractScore,
  type CioTowerRightAnswerContract,
} from '../../src/lib/cio-tower/answer-contract';
import type { CioTowerVisibleAnswerContract } from '../../src/lib/cio-tower/answer';
import { canonicalCioTowerTenantKey, toCioTowerMetricPacket, type CioTowerMetricResultLike } from '../../src/lib/cio-tower/metric-packet';
import { buildTowerQuestionBank, summarizeTowerQuestionBank, type TowerQuestionBankItem } from '../../src/lib/tower/tower-question-bank';

interface AnswerTraceRow {
  tenant_key: string;
  user_question: string;
  validation_status: string | null;
  validation_errors: unknown;
  latency_ms: number | null;
  rendered_response: string | null;
  artifacts: unknown;
  created_at: string | Date;
}

interface ScoredContract {
  contract: CioTowerRightAnswerContract;
  status: 'passed' | 'failed' | 'not_run';
  score: CioTowerAnswerContractScore | null;
  trace: AnswerTraceRow | null;
}

const DEFAULT_TENANTS = [
  'apex-retail',
  'first-capital-financial',
  'lakeshore-holdings',
  'meridian-health',
  'skyharbor-air',
];

loadDotEnvLocal();

const tenantKeys = (process.env.TOWER_CONTRACT_TENANTS ?? DEFAULT_TENANTS.join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map(canonicalCioTowerTenantKey);
const limit = Number(process.env.TOWER_CONTRACT_LIMIT ?? flagValue('--limit') ?? 1000);
const requireTraces = process.argv.includes('--require-traces');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = process.env.TOWER_ANSWER_CONTRACT_SERVER_OUT_DIR
  ?? path.join('/Users/anand/Downloads', `tower-answer-contract-server-${timestamp}`);

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

function flagValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  return process.argv[index + 1] ?? null;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file: string, body: string): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body);
}

function parseJson(value: unknown): unknown {
  if (value === null || value === undefined || typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return value;
  }
}

function traceKey(tenantKey: string, question: string): string {
  return `${tenantKey}\n${question.trim().toLowerCase()}`;
}

function visibleContractFromTrace(trace: AnswerTraceRow | null): CioTowerVisibleAnswerContract | null {
  const artifacts = parseJson(trace?.artifacts) as { visible_answer_contract?: unknown } | null;
  const output = artifacts?.visible_answer_contract;
  if (!output || typeof output !== 'object') return null;
  return output as CioTowerVisibleAnswerContract;
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

async function loadMetricRows(client: Client, tenants: readonly string[]): Promise<Map<string, CioTowerMetricResultLike[]>> {
  const rows = await client.query<CioTowerMetricResultLike & { tenant_key: string }>(
    `select mr.tenant_key, mr.measure_key, mr.period, mr.basis, mr.scope, mr.value_numeric, mr.value_json,
            mr.source_fact_keys, mr.formula_version, m.label, m.description
       from cio_tower.measure_results mr
       left join cio_tower.measures m on m.measure_key = mr.measure_key
      where mr.tenant_key = any($1::text[])
      order by mr.tenant_key, mr.measure_key, mr.period`,
    [tenants],
  );
  const byTenant = new Map<string, CioTowerMetricResultLike[]>();
  for (const row of rows.rows) {
    byTenant.set(row.tenant_key, [...(byTenant.get(row.tenant_key) ?? []), row]);
  }
  return byTenant;
}

async function loadLatestTraces(client: Client, tenants: readonly string[]): Promise<Map<string, AnswerTraceRow>> {
  const rows = await client.query<AnswerTraceRow>(
    `select distinct on (tenant_key, lower(trim(user_question)))
            tenant_key,
            user_question,
            validation_status,
            validation_errors,
            latency_ms,
            rendered_response,
            artifacts,
            created_at
       from cio_tower.answer_traces
      where tenant_key = any($1::text[])
      order by tenant_key, lower(trim(user_question)), created_at desc`,
    [tenants],
  );
  const traces = new Map<string, AnswerTraceRow>();
  for (const row of rows.rows) {
    traces.set(traceKey(row.tenant_key, row.user_question), row);
  }
  return traces;
}

function scoreContracts(args: {
  contracts: readonly CioTowerRightAnswerContract[];
  traces: ReadonlyMap<string, AnswerTraceRow>;
}): ScoredContract[] {
  return args.contracts.map((contract) => {
    const trace = args.traces.get(traceKey(contract.tenantKey, contract.question)) ?? null;
    if (!trace) return { contract, status: 'not_run', score: null, trace };
    const score = scoreCioTowerRightAnswerContract(contract, {
      visibleText: trace.rendered_response ?? '',
      modelOutput: visibleContractFromTrace(trace),
      latencyMs: trace.latency_ms,
    });
    return {
      contract,
      status: score.pass ? 'passed' : 'failed',
      score,
      trace,
    };
  });
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
  questionBankSummary: ReturnType<typeof summarizeTowerQuestionBank>;
  scored: readonly ScoredContract[];
  tenants: readonly string[];
  sampleSize: number;
}): string {
  const failed = args.scored.filter((row) => row.status === 'failed').slice(0, 50);
  const notRun = args.scored.filter((row) => row.status === 'not_run').slice(0, 30);
  const statusCounts = countBy(args.scored, 'status');
  const tenantCounts = countBy(args.scored.map((row) => ({
    tenant: row.contract.tenantKey,
    status: row.status,
  })), 'tenant');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower server-side right-answer runner</title>
  <style>
    body { margin: 32px; background: #f8f6f1; color: #07142d; font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    h1 { margin: 0 0 8px; font: 700 42px/1.05 Georgia, serif; }
    h2 { margin-top: 28px; font: 700 24px/1.15 Georgia, serif; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
    .metric, .card { background: #fff; border: 1px solid #ddd7cc; border-radius: 8px; padding: 16px; box-shadow: 0 8px 30px rgba(7, 20, 45, .06); }
    .metric strong { display: block; font-size: 28px; font-family: Georgia, serif; }
    pre { white-space: pre-wrap; word-break: break-word; background: #101828; color: #f5f7fb; border-radius: 6px; padding: 14px; max-height: 480px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ddd7cc; }
    th, td { text-align: left; border-bottom: 1px solid #e7e1d6; padding: 10px; vertical-align: top; }
    th { color: #607089; text-transform: uppercase; letter-spacing: .1em; font-size: 11px; }
    .pass { color: #07592f; }
    .fail { color: #8f1f1f; }
    .pending { color: #8a5a00; }
  </style>
</head>
<body>
  <h1>Tower server-side right-answer runner</h1>
  <p>Generated ${escapeHtml(new Date().toISOString())}. Tenants: ${escapeHtml(args.tenants.join(', '))}. Sample: ${args.sampleSize.toLocaleString()} question(s) per tenant where applicable.</p>
  <div class="summary">
    <div class="metric"><span>Question bank</span><strong>${args.questionBankSummary.total.toLocaleString()}</strong></div>
    <div class="metric"><span>Contracts scored</span><strong>${args.scored.length.toLocaleString()}</strong></div>
    <div class="metric"><span>Passed traces</span><strong class="pass">${(statusCounts.passed ?? 0).toLocaleString()}</strong></div>
    <div class="metric"><span>Failed traces</span><strong class="fail">${(statusCounts.failed ?? 0).toLocaleString()}</strong></div>
  </div>
  <div class="card">
    <h2>Coverage</h2>
    <pre>${escapeHtml(JSON.stringify({ statusCounts, tenantCounts, questionBankSummary: args.questionBankSummary }, null, 2))}</pre>
  </div>
  <h2>Failures</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Question</th><th>Expected</th><th>Failing checks</th><th>Observed</th></tr></thead>
    <tbody>
      ${failed.map((row) => `
        <tr>
          <td>${escapeHtml(row.contract.tenantKey)}</td>
          <td>${escapeHtml(row.contract.question)}</td>
          <td><pre>${escapeHtml(JSON.stringify(row.contract.expectedMetrics ?? [], null, 2))}</pre></td>
          <td><pre>${escapeHtml(JSON.stringify(row.score?.checks.filter((check) => !check.pass) ?? [], null, 2))}</pre></td>
          <td>${escapeHtml(row.trace?.rendered_response ?? '')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <h2>Not Run Yet</h2>
  <table>
    <thead><tr><th>Tenant</th><th>Question</th><th>Route</th><th>Expected metrics</th></tr></thead>
    <tbody>
      ${notRun.map((row) => `
        <tr>
          <td>${escapeHtml(row.contract.tenantKey)}</td>
          <td>${escapeHtml(row.contract.question)}</td>
          <td>${escapeHtml(row.contract.route)}</td>
          <td><pre>${escapeHtml(JSON.stringify(row.contract.expectedMetrics ?? [], null, 2))}</pre></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for server-side Tower contract scoring.');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const bank = buildTowerQuestionBank();
    const sample = selectQuestionSample(bank, limit);
    const [metricRows, traces] = await Promise.all([
      loadMetricRows(client, tenantKeys),
      loadLatestTraces(client, tenantKeys),
    ]);

    const contracts = tenantKeys.flatMap((tenantKey) => buildCioTowerRightAnswerContracts({
      tenantKey,
      items: sample,
      metricPackets: (metricRows.get(tenantKey) ?? []).map(toCioTowerMetricPacket),
    }));
    const scored = scoreContracts({ contracts, traces });
    const statusCounts = countBy(scored, 'status');
    const failedRows = scored
      .filter((row) => row.status !== 'passed')
      .map((row) => ({
        id: row.contract.id,
        tenantKey: row.contract.tenantKey,
        question: row.contract.question,
        status: row.status,
        latencyMs: row.trace?.latency_ms ?? null,
        failedChecks: row.score?.checks.filter((check) => !check.pass).map((check) => ({
          id: check.id,
          detail: check.detail,
        })) ?? [],
        renderedSnippet: (row.trace?.rendered_response ?? '').slice(0, 800),
      }));

    ensureDir(outDir);
    writeFile(path.join(outDir, 'question-bank-summary.json'), JSON.stringify(summarizeTowerQuestionBank(bank), null, 2));
    writeFile(path.join(outDir, 'contracts.json'), JSON.stringify(contracts, null, 2));
    writeFile(path.join(outDir, 'scores.json'), JSON.stringify(scored, null, 2));
    writeFile(path.join(outDir, 'report.html'), buildHtml({
      questionBankSummary: summarizeTowerQuestionBank(bank),
      scored,
      tenants: tenantKeys,
      sampleSize: sample.length,
    }));

    const summary = {
      outDir,
      report: path.join(outDir, 'report.html'),
      tenants: tenantKeys,
      questionBank: summarizeTowerQuestionBank(bank),
      sampleQuestions: sample.length,
      generatedContracts: contracts.length,
      statusCounts,
      requireTraces,
    };
    console.log(JSON.stringify(summary, null, 2));
    if (failedRows.length > 0) {
      console.log(JSON.stringify({ event: 'tower_answer_contract_failures', failedRows }, null, 2));
    }

    if (requireTraces && (statusCounts.not_run ?? 0) > 0) {
      process.exitCode = 1;
    }
    if ((statusCounts.failed ?? 0) > 0) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
