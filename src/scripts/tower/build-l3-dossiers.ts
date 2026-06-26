#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

import Papa from 'papaparse';

import {
  buildTowerL3Dossiers,
  summarizeTowerDossiers,
  type TowerAnswerDossier,
  type TowerL3Input,
  type TowerSourceRow,
} from '@/lib/tower/tower-l3-dossiers';

interface Args {
  sourceDir: string;
  outDir: string | null;
  clientId: string;
  tenantKey: string;
}

const REQUIRED_FILES = {
  portfolioCompanies: 'portfolio_company_profile.csv',
  budgetRows: 'F12_it_budget_financials.csv',
  vendorRows: 'F11_vendors_contracts_licenses.csv',
  applicationRows: 'F05_applications_systems.csv',
  contractSystemRows: 'F22_contract_system_service_map.csv',
  initiativeRows: 'T01_initiative_registry.csv',
  benefitRows: 'T07_benefit_realization.csv',
  spendRows: 'T08_spend_contracts.csv',
  toolUsageRows: 'T03_tool_usage_monthly.csv',
  riskRows: 'T09_risk_governance.csv',
} as const;

function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    sourceDir: '/tmp/abarva-lakeshore-portfolio-reference',
    outDir: null,
    clientId: '00000000-0000-0000-0000-000000000001',
    tenantKey: 'lakeshore-holdings',
  };
  for (const arg of argv) {
    if (arg.startsWith('--source-dir=')) args.sourceDir = arg.slice('--source-dir='.length);
    else if (arg.startsWith('--out-dir=')) args.outDir = arg.slice('--out-dir='.length);
    else if (arg.startsWith('--client-id=')) args.clientId = arg.slice('--client-id='.length);
    else if (arg.startsWith('--tenant-key=')) args.tenantKey = arg.slice('--tenant-key='.length);
  }
  return args;
}

function readCsv(filePath: string): TowerSourceRow[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`${path.basename(filePath)} CSV parse failed: ${parsed.errors[0]?.message}`);
  }
  return parsed.data.map((values, index) => ({
    sourceFile: path.basename(filePath),
    rowNumber: index + 2,
    values,
  }));
}

function readForbidden(sourceDir: string): string[] {
  const file = path.join(sourceDir, 'GATE_B_forbidden_identifiers.txt');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function loadInput(args: Args, dossierVersion: string): TowerL3Input {
  const input = {
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    forbiddenIdentifiers: readForbidden(args.sourceDir),
    dossierVersion,
    stage2Status: process.env.ANTHROPIC_API_KEY ? 'enriched' : 'unavailable',
  } satisfies Partial<TowerL3Input>;
  const loaded = Object.fromEntries(
    Object.entries(REQUIRED_FILES).map(([key, file]) => {
      const fullPath = path.join(args.sourceDir, file);
      if (!fs.existsSync(fullPath)) throw new Error(`Missing required Tower file: ${fullPath}`);
      return [key, readCsv(fullPath)];
    }),
  ) as Pick<
    TowerL3Input,
    | 'portfolioCompanies'
    | 'budgetRows'
    | 'vendorRows'
    | 'applicationRows'
    | 'contractSystemRows'
    | 'initiativeRows'
    | 'benefitRows'
    | 'spendRows'
    | 'toolUsageRows'
    | 'riskRows'
  >;
  return { ...input, ...loaded } as TowerL3Input;
}

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(filePath: string, headers: readonly string[], rows: readonly unknown[][]): void {
  fs.writeFileSync(filePath, [headers.join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n') + '\n');
}

function sampleDossier(dossiers: readonly TowerAnswerDossier[]): TowerAnswerDossier {
  return (
    dossiers.find((d) => d.scopeKey === 'l1-consolidated' && d.viewKey === 'value_realization') ??
    dossiers[0]
  );
}

function dossierToMarkdown(dossier: TowerAnswerDossier): string {
  const metrics = dossier.metrics.map((m) => `| ${m.label} | ${m.valueText} | ${m.amountType} | ${m.confidence} | ${m.lineage.join('; ')} |`).join('\n');
  const insights = dossier.derivedInsights.map((i) => `- **${i.observation}** ${i.implication} _(confidence: ${i.confidence}; refs: ${i.supportingRefs.join(', ') || 'none'})_`).join('\n');
  const gaps = dossier.gaps.map((gap) => `- ${gap}`).join('\n');
  return `# Sample Tower L3 Answer Dossier

Scope: ${dossier.scopeLabel}
View: ${dossier.businessLabels.view}
Verdict: ${dossier.coverage.verdict}
Coverage: ${Math.round(dossier.coverage.score * 100)}%
Stage 2: ${dossier.stage2Status}
Validation: ${dossier.validation.pass ? 'PASS' : `FAIL (${dossier.validation.failures.join(', ')})`}

## Metrics

| Metric | Value | Amount type | Confidence | Lineage |
|---|---:|---|---|---|
${metrics || '| None | - | - | - | - |'}

## Derived CIO Insights

${insights || '- No grounded derived insights available.'}

## Gaps

${gaps || '- No blocking gap found in this deterministic skeleton.'}

## Branch Options

${dossier.branchOptions.map((option) => `- ${option}`).join('\n')}
`;
}

function writeReports(outDir: string, dossiers: readonly TowerAnswerDossier[], input: TowerL3Input): void {
  fs.mkdirSync(outDir, { recursive: true });
  const sample = sampleDossier(dossiers);
  fs.writeFileSync(path.join(outDir, 'SAMPLE_DOSSIER.json'), JSON.stringify(sample, null, 2));
  fs.writeFileSync(path.join(outDir, 'SAMPLE_DOSSIER.md'), dossierToMarkdown(sample));

  writeCsv(path.join(outDir, 'dossier-build-report.csv'), [
    'tenant_key',
    'scope_key',
    'scope_type',
    'view_key',
    'metric_count',
    'insight_count',
    'coverage',
    'verdict',
    'validation_pass',
    'gaps',
  ], dossiers.map((d) => [
    d.tenantKey,
    d.scopeKey,
    d.scopeType,
    d.viewKey,
    d.metrics.length,
    d.derivedInsights.length,
    d.coverage.score,
    d.coverage.verdict,
    d.validation.pass,
    d.gaps.join('; '),
  ]));

  writeCsv(path.join(outDir, 'validation-summary.csv'), [
    'tenant_key',
    'scope_key',
    'view_key',
    'pass',
    ...Object.keys(dossiers[0]?.validation.checks ?? {}),
    'failures',
  ], dossiers.map((d) => [
    d.tenantKey,
    d.scopeKey,
    d.viewKey,
    d.validation.pass,
    ...Object.values(d.validation.checks),
    d.validation.failures.join('; '),
  ]));

  const reportRows = dossiers.map((d) => `| ${d.tenantKey} | ${d.scopeLabel} | ${d.viewKey} | ${d.metrics.length} | ${d.derivedInsights.length} | ${Math.round(d.coverage.score * 100)}% | ${d.coverage.verdict} | ${d.validation.pass ? 'PASS' : `FAIL: ${d.validation.failures.join('; ')}`} |`).join('\n');
  fs.writeFileSync(path.join(outDir, 'dossier-build-report.md'), `# Tower L3 Dossier Build Report

Stage 1: deterministic governed skeleton.
Stage 2: ${process.env.ANTHROPIC_API_KEY ? 'Claude API available to enrich in this environment.' : 'Claude API key not present in this environment; derived CIO insight enrichment is marked unavailable, not fabricated.'}

| Tenant | Scope | View | Metrics | Insights | Coverage | Verdict | Validation |
|---|---|---|---:|---:|---:|---|---|
${reportRows}
`);

  const catalog = dossiers.flatMap((d) => d.derivedInsights.map((insight) => `## ${d.scopeLabel} · ${d.viewKey}

- Observation: ${insight.observation}
- Implication: ${insight.implication}
- Confidence: ${insight.confidence}
- Supporting refs: ${insight.supportingRefs.join(', ') || 'none'}
`)).join('\n');
  fs.writeFileSync(path.join(outDir, 'insights-catalog.md'), `# Tower L3 Insights Catalog

${catalog || 'No derived insights available.'}
`);

  const summary = summarizeTowerDossiers(dossiers);
  fs.writeFileSync(path.join(outDir, 'OUTCOME_REPORT.md'), `# Tower L3 Outcome Report

## Summary

- Dossiers built: ${summary.total}
- Validation passed: ${summary.passed}
- Validation failed: ${summary.failed}
- Verdict distribution: ${JSON.stringify(summary.verdicts)}
- Stage 2 status: ${process.env.ANTHROPIC_API_KEY ? 'available' : 'unavailable in this local shell'}

## Data Inputs

- Portfolio companies: ${input.portfolioCompanies.length}
- Budget rows: ${input.budgetRows.length}
- Vendor rows: ${input.vendorRows.length}
- Application rows: ${input.applicationRows.length}
- Contract-system rows: ${input.contractSystemRows.length}
- Initiatives: ${input.initiativeRows.length}
- Benefit rows: ${input.benefitRows.length}
- Spend rows: ${input.spendRows.length}
- Tool usage rows: ${input.toolUsageRows.length}
- Risk rows: ${input.riskRows.length}

## Truth Boundary

This report proves the Pass B deterministic dossier builder and validation over the supplied Lakeshore reference pack. It does not prove the live Azure/Postgres L3 store is populated and it does not wire any Tower surface.
`);

  fs.writeFileSync(path.join(outDir, 'REALISM_AUDIT.md'), `# Tower Realism Audit

The attached reference pack supplies calibrated synthetic values. Pass B validates amount typing and non-negative spend/value figures. Full seat-price benchmark reconciliation is enforced as a named Gate E seam and must be run in the ACA/VNet materialization job before live write approval.
`);
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = args.outDir ?? path.join(process.env.HOME ?? '/tmp', 'Downloads', `abarva-tower-dossier-build-${ts}`);
  const input = loadInput(args, ts);
  const dossiers = buildTowerL3Dossiers(input);
  writeReports(outDir, dossiers, input);
  console.log(JSON.stringify({ outDir, ...summarizeTowerDossiers(dossiers) }, null, 2));
  return dossiers.every((d) => d.validation.pass) ? 0 : 1;
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
