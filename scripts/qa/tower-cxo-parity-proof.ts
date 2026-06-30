#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';

import { loadCioTowerCxoView } from '../../src/lib/cio-tower/cxo-view-model';
import {
  answerCioTowerQuestion,
  canonicalCioTowerTenantKey,
} from '../../src/lib/cio-tower/answer';

const DEFAULT_TENANT = 'skyharbor-air';
const DEFAULT_QUESTION = 'What is my IT spend?';
const DEFAULT_MEASURE_KEY = 'total_it_budget_fy26';

function loadDotEnvLocal(): void {
  if (process.env.DATABASE_URL || process.env.ABARVA_AZURE_DATABASE_URL) return;
  const candidates = [
    process.env.ABARVA_ENV_FILE,
    path.join(process.cwd(), '.env.local'),
    '/Users/anand/Projects/nexus/.env.local',
  ].filter((value): value is string => Boolean(value));
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    if (process.env[key]) continue;
    process.env[key] = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
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

function writeJson(file: string, data: unknown): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function normalizeVisibleText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

async function main(): Promise<void> {
  loadDotEnvLocal();
  const tenantKey = canonicalCioTowerTenantKey(
    flagValue('--tenant') ?? process.env.TOWER_CXO_PARITY_TENANT ?? DEFAULT_TENANT,
  );
  const tenantName = flagValue('--tenant-name') ?? process.env.TOWER_CXO_PARITY_TENANT_NAME ?? tenantKey;
  const question = flagValue('--question') ?? process.env.TOWER_CXO_PARITY_QUESTION ?? DEFAULT_QUESTION;
  const measureKey = flagValue('--measure-key') ?? process.env.TOWER_CXO_PARITY_MEASURE_KEY ?? DEFAULT_MEASURE_KEY;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = flagValue('--out-dir')
    ?? process.env.TOWER_CXO_PARITY_OUT_DIR
    ?? path.join('/Users/anand/Downloads', `tower-cxo-parity-proof-${timestamp}`);

  const view = await loadCioTowerCxoView({
    tenantKeyCandidates: [tenantKey],
    tenantName,
  });
  if (!view) {
    throw new Error(`No governed cio_tower CXO view found for ${tenantKey}`);
  }

  const card = view.cards.find((candidate) => candidate.measureKey === measureKey);
  if (!card) {
    throw new Error(`Measure ${measureKey} is absent from governed dashboard view for ${tenantKey}`);
  }

  const answer = await answerCioTowerQuestion({
    tenantId: tenantKey,
    tenantKey,
    tenantName,
    userId: 'tower-cxo-parity-proof',
    question,
  });

  const visibleText = normalizeVisibleText([
    answer.modelOutput.answer,
    ...(answer.modelOutput.tables ?? []).flatMap((table) => [
      table.title,
      ...table.columns,
      ...table.rows.flat(),
    ]),
    ...(answer.modelOutput.tabs ?? []).flatMap((tab) => [
      tab.label,
      tab.prose,
      ...(tab.tables ?? []).flatMap((table) => [
        table.title,
        ...table.columns,
        ...table.rows.flat(),
      ]),
    ]),
  ].join('\n'));
  const valueAppearsInAnswer = card.displayValue !== 'gap' && visibleText.includes(card.displayValue);

  const report = {
    generatedAt: new Date().toISOString(),
    status: valueAppearsInAnswer ? 'passed' : 'failed',
    tenant: tenantKey,
    tenantName,
    measureKey,
    dashboardValue: card.displayValue,
    dashboardSource: {
      generatedFrom: view.generatedFrom,
      sourceFactKeys: card.sourceFactKeys,
      evidence: card.evidence,
      formulaVersion: card.formulaVersion,
      period: card.period,
      basis: card.basis,
      scope: card.scope,
      gap: card.gap,
    },
    ava: {
      question,
      valueAppearsInAnswer,
      response: answer.response,
      modelOutput: answer.modelOutput,
      modelOutputRaw: answer.modelOutputRaw,
      model: answer.model,
      validationStatus: answer.validationStatus,
      validationErrors: answer.validationErrors,
      latencyMs: answer.latencyMs,
    },
    trace: {
      promptPackageKey: answer.promptPackageKey,
      traceKey: answer.traceKey,
      promptHash: answer.promptHash,
    },
    rendererPolicy: {
      purePlacementOnly: true,
      apiRewritesClaudeOutput: false,
    },
  };

  writeJson(path.join(outDir, 'tower-cxo-dashboard-chat-parity.json'), report);
  console.log(JSON.stringify(report, null, 2));
  if (!valueAppearsInAnswer) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
