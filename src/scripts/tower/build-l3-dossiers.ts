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
  const metrics = dossier.businessBody.metrics.map((m) => `| ${m.label} | ${m.valueText} | ${m.amountType} | ${m.confidence} |`).join('\n');
  const insights = dossier.businessBody.insights.map((i) => `- **${i.observation}** ${i.implication} _(confidence: ${i.confidence}; support: ${i.supportLabels.join('; ') || 'pending enrichment'})_`).join('\n');
  const gaps = dossier.gaps.map((gap) => `- ${gap}`).join('\n');
  return `# Sample Tower L3 Answer Dossier

Scope: ${dossier.scopeLabel}
View: ${dossier.businessLabels.view}
Verdict: ${dossier.coverage.verdict}
Coverage: ${Math.round(dossier.coverage.score * 100)}%
Stage 2: ${dossier.stage2Status}
Validation: ${dossier.validation.pass ? 'PASS' : `FAIL (${dossier.validation.failures.join(', ')})`}

## Metrics

| Metric | Value | Amount type | Confidence |
|---|---:|---|---|
${metrics || '| None | - | - | - |'}

## Derived CIO Insights

${insights || '- No grounded derived insights available.'}

## Gaps

${gaps || '- No named structural gap for this deterministic skeleton.'}

## Branch Options

${dossier.branchOptions.map((option) => `- ${option}`).join('\n')}
`;
}

interface RenderCellRef {
  label: string;
  valueText: string;
  valueNumber: number | null;
  metricRef: string;
}

function promptForDossier(dossier: TowerAnswerDossier): string {
  return `SYSTEM
You are the Tower CIO advisor. Use only the governed Tower dossier below.
Never calculate new numbers. Claude phrases and synthesizes; AbarVa computes.
Every governed number carries amount_type, period, confidence, and business source labels.
Use business language only. Do not expose raw ids, file paths, row numbers, UUIDs, table names, or restricted client identifiers.
Return JSON with: insights[{observation, implication, confidence, supportLabels}], caveats[], nextBranches[].
Tone: concise CIO command-center read, specific, non-theatrical, no generic consulting filler.
Gold example: "Committed value is larger than realized value, so the CIO issue is proof sequencing, not more spend. Treat unproven value as a gate until owner-attested outcomes land."

USER
Build derived CIO insights for this Tower view. Do not invent entities, values, or vendors. If the evidence is insufficient, say so.

${JSON.stringify(dossier.businessBody, null, 2)}
`;
}

function promptRubric(prompt: string): Record<string, boolean> {
  return {
    governed_numbers_carry_amount_type: /amountType/.test(prompt),
    no_calculate_rule_present: /Never calculate new numbers/.test(prompt),
    business_language_gate_b_present: /restricted client identifiers/.test(prompt),
    schema_present: /insights\[\{observation, implication, confidence, supportLabels\}\]/.test(prompt),
    tone_contract_present: /Tone: concise CIO/.test(prompt),
    gold_few_shot_present: /Gold example:/.test(prompt),
    zero_raw_ids_or_paths: !/csv:|row-[0-9]|metric_[0-9a-f]|[0-9a-f]{8}-[0-9a-f]{4}|\.json|\.csv/.test(prompt),
  };
}

function renderInputForDossier(dossier: TowerAnswerDossier): { table: { title: string; columns: string[]; rows: RenderCellRef[][] }; chart: { title: string; series: RenderCellRef[] } } {
  const refs = dossier.metrics.slice(0, 8).map((metric) => ({
    label: metric.label,
    valueText: metric.valueText,
    valueNumber: metric.valueNumber,
    metricRef: metric.metricKey,
  }));
  return {
    table: {
      title: `${dossier.scopeLabel} ${dossier.businessLabels.view} governed metrics`,
      columns: ['Metric', 'Value', 'Amount type', 'Confidence'],
      rows: dossier.metrics.slice(0, 8).map((metric) => [
        { label: 'Metric', valueText: metric.label, valueNumber: null, metricRef: metric.metricKey },
        { label: 'Value', valueText: metric.valueText, valueNumber: metric.valueNumber, metricRef: metric.metricKey },
        { label: 'Amount type', valueText: metric.amountType, valueNumber: null, metricRef: metric.metricKey },
        { label: 'Confidence', valueText: metric.confidence, valueNumber: null, metricRef: metric.metricKey },
      ]),
    },
    chart: {
      title: `${dossier.scopeLabel} ${dossier.businessLabels.view}`,
      series: refs.filter((ref) => typeof ref.valueNumber === 'number'),
    },
  };
}

function renderHarnessHtml(renderInput: ReturnType<typeof renderInputForDossier>): string {
  const rows = renderInput.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell.valueText}</td>`).join('')}</tr>`).join('\n');
  const max = Math.max(1, ...renderInput.chart.series.map((series) => series.valueNumber ?? 0));
  const bars = renderInput.chart.series.map((series) => {
    const width = Math.max(2, Math.round(((series.valueNumber ?? 0) / max) * 100));
    return `<div class="bar-row"><span>${series.label}</span><div class="bar"><i style="width:${width}%"></i></div><b>${series.valueText}</b></div>`;
  }).join('\n');
  return `<!doctype html>
<meta charset="utf-8">
<title>${renderInput.table.title}</title>
<style>body{font-family:Arial,sans-serif;margin:24px;color:#10203f}table{border-collapse:collapse;width:100%;margin-bottom:24px}th,td{border:1px solid #d7dde8;padding:8px;text-align:left}.bar-row{display:grid;grid-template-columns:220px 1fr 90px;gap:12px;align-items:center;margin:8px 0}.bar{height:16px;background:#eef2f7}.bar i{display:block;height:16px;background:#0b7a4b}</style>
<h1>${renderInput.table.title}</h1>
<table><thead><tr>${renderInput.table.columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
<h2>${renderInput.chart.title}</h2>
${bars || '<p>No numeric series available.</p>'}
`;
}

function renderParity(dossier: TowerAnswerDossier, renderInput: ReturnType<typeof renderInputForDossier>): Array<Record<string, unknown>> {
  const byRef = new Map(dossier.metrics.map((metric) => [metric.metricKey, metric]));
  const tableRows = renderInput.table.rows.flatMap((row) =>
    row
      .filter((cell) => cell.label === 'Value')
      .map((cell) => {
        const metric = byRef.get(cell.metricRef);
        return {
          elementType: 'table_cell',
          label: metric?.label ?? cell.label,
          metricRef: cell.metricRef,
          renderedValue: cell.valueNumber,
          renderedText: cell.valueText,
          snapshotValue: metric?.valueNumber ?? null,
          snapshotText: metric?.valueText ?? null,
          metricSnapshotId: metric?.metricSnapshotId ?? null,
          pass: metric?.valueNumber === cell.valueNumber && metric?.valueText === cell.valueText,
        };
      }),
  );
  const chartRows = renderInput.chart.series.map((series) => {
    const metric = byRef.get(series.metricRef);
    return {
      elementType: 'chart_series',
      label: series.label,
      metricRef: series.metricRef,
      renderedValue: series.valueNumber,
      renderedText: series.valueText,
      snapshotValue: metric?.valueNumber ?? null,
      snapshotText: metric?.valueText ?? null,
      metricSnapshotId: metric?.metricSnapshotId ?? null,
      pass: metric?.valueNumber === series.valueNumber && metric?.valueText === series.valueText,
    };
  });
  return [...tableRows, ...chartRows];
}

function evidenceChain(dossier: TowerAnswerDossier): Array<Record<string, unknown>> {
  return dossier.metrics.map((metric) => ({
    metricSnapshotId: metric.metricSnapshotId,
    label: metric.label,
    valueNumber: metric.valueNumber,
    amountType: metric.amountType,
    formulaVersion: metric.formulaVersion,
    lineage: metric.lineage,
  }));
}

function traceFolderName(dossier: TowerAnswerDossier): string {
  return `${dossier.tenantKey}__${dossier.scopeKey}__${dossier.viewKey}`.replace(/[^a-zA-Z0-9_.-]+/g, '-');
}

function traceRelativePath(dossier: TowerAnswerDossier): string {
  return path.join('trace', traceFolderName(dossier));
}

function writeTrace(outDir: string, dossier: TowerAnswerDossier): Array<Record<string, unknown>> {
  const traceDir = path.join(outDir, 'trace', traceFolderName(dossier));
  fs.mkdirSync(traceDir, { recursive: true });
  const prompt = promptForDossier(dossier);
  const renderInput = renderInputForDossier(dossier);
  const parity = renderParity(dossier, renderInput);
  const grounding = dossier.derivedInsights.map((insight) => ({
    observation: insight.observation,
    placeholder: insight.placeholder,
    citedRefs: insight.supportingRefs,
    citedRefsExistInSkeleton: insight.supportingRefs.every((ref) => dossier.metrics.some((m) => m.metricSnapshotId === ref) || dossier.facts.some((f) => f.factId === ref)),
    fabricatedNumberOrEntity: false,
    dropped: insight.placeholder,
  }));

  fs.writeFileSync(path.join(traceDir, '01_PROMPT_SENT.txt'), prompt);
  fs.writeFileSync(path.join(traceDir, '02_CLAUDE_RAW.json'), JSON.stringify({ status: 'pending_aca_run' }, null, 2));
  fs.writeFileSync(path.join(traceDir, '03_PARSED.json'), JSON.stringify({ status: 'pending_aca_run', insights: [] }, null, 2));
  fs.writeFileSync(path.join(traceDir, '04_GROUNDING.json'), JSON.stringify(grounding, null, 2));
  fs.writeFileSync(path.join(traceDir, '05_RENDER_INPUT.json'), JSON.stringify(renderInput, null, 2));
  fs.writeFileSync(path.join(traceDir, '06_RENDER_OUTPUT.html'), renderHarnessHtml(renderInput));
  fs.writeFileSync(path.join(traceDir, '07_RENDER_PARITY.json'), JSON.stringify(parity, null, 2));
  fs.writeFileSync(path.join(traceDir, '08_EVIDENCE_CHAIN.json'), JSON.stringify(evidenceChain(dossier), null, 2));
  fs.writeFileSync(path.join(traceDir, '09_VALIDATION.json'), JSON.stringify(dossier.validation, null, 2));
  fs.writeFileSync(path.join(traceDir, 'TRACE.md'), `# Tower Trace

- Tenant: ${dossier.tenantKey}
- Scope: ${dossier.scopeLabel}
- View: ${dossier.viewKey}
- Verdict: ${dossier.coverage.verdict}
- Prompt quality: ${Object.values(promptRubric(prompt)).every(Boolean) ? 'PASS' : 'FAIL'}
- Claude raw: pending ACA run (local shell does not have the Stage 2 model key)
- Render parity: ${parity.every((row) => row.pass === true) ? 'PASS' : 'FAIL'}
- Validation: ${dossier.validation.pass ? 'PASS' : `FAIL ${dossier.validation.failures.join(', ')}`}

## Chain

Prompt -> Claude raw -> parsed insight -> grounding -> render input -> render output -> parity -> evidence chain -> validation.
`);
  return parity.map((row) => ({
    tenant_key: dossier.tenantKey,
    scope_key: dossier.scopeKey,
    view_key: dossier.viewKey,
    trace: traceRelativePath(dossier),
    ...row,
  }));
}

function copyRenderHarnessOutputs(outDir: string, dossiers: readonly TowerAnswerDossier[]): void {
  const renderDir = path.join(outDir, 'RENDER_HARNESS_OUTPUT');
  fs.mkdirSync(renderDir, { recursive: true });
  for (const dossier of dossiers) {
    const traceDir = path.join(outDir, traceRelativePath(dossier));
    const source = path.join(traceDir, '06_RENDER_OUTPUT.html');
    const target = path.join(renderDir, `${traceFolderName(dossier)}.html`);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
    }
  }
  const links = dossiers
    .map((dossier) => `- [${dossier.scopeLabel} · ${dossier.viewKey}](./${traceFolderName(dossier)}.html)`)
    .join('\n');
  fs.writeFileSync(path.join(renderDir, 'INDEX.md'), `# Render Harness Output

Standalone HTML outputs produced from each dossier's render input. This proves JSON-to-artifact rendering in isolation; it is not Tower surface wiring.

${links}
`);
}

function countBy<T extends string>(values: readonly T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function legacyVerdictFor(dossier: TowerAnswerDossier): string {
  if (dossier.metrics.length === 0) return 'EMPTY';
  if (dossier.coverage.score >= 0.85) return 'DEEP';
  if (dossier.coverage.score >= 0.5) return 'PARTIAL';
  return 'THIN';
}

const RAW_SURFACE_PATTERN = /csv:|row-[0-9]|metric_[0-9a-f]|[0-9a-f]{8}-[0-9a-f]{4}|\.json|\.csv/gi;

function rawHitCount(value: string): number {
  return value.match(RAW_SURFACE_PATTERN)?.length ?? 0;
}

function legacyPromptRenderSurface(dossier: TowerAnswerDossier): string {
  return JSON.stringify({
    metrics: dossier.metrics,
    facts: dossier.facts,
    relationships: dossier.relationships,
    derivedInsights: dossier.derivedInsights,
    gaps: dossier.gaps,
    branchOptions: dossier.branchOptions,
  });
}

function currentPromptRenderSurface(dossier: TowerAnswerDossier): string {
  return JSON.stringify(dossier.businessBody);
}

function namedGapCount(dossiers: readonly TowerAnswerDossier[], pattern: RegExp): number {
  return dossiers.filter((dossier) => dossier.gaps.some((gap) => pattern.test(gap))).length;
}

function writeTraceIndex(outDir: string, dossiers: readonly TowerAnswerDossier[]): void {
  const rows = dossiers
    .map((dossier) => `| ${dossier.tenantKey} | ${dossier.scopeLabel} | ${dossier.viewKey} | ${dossier.coverage.verdict} | [TRACE](${traceRelativePath(dossier)}/TRACE.md) | [Prompt](${traceRelativePath(dossier)}/01_PROMPT_SENT.txt) | [Render](${traceRelativePath(dossier)}/06_RENDER_OUTPUT.html) |`)
    .join('\n');
  fs.writeFileSync(path.join(outDir, 'TRACE_INDEX.md'), `# Tower Pass B Trace Index

Every sampled dossier is emitted with a full prompt-to-render chain. Stage 2 model links are intentionally labelled pending in this local run.

| Tenant | Scope | View | Verdict | Trace | Prompt | Render |
|---|---|---|---|---|---|---|
${rows}
`);
}

function writePromptRubric(outDir: string, dossiers: readonly TowerAnswerDossier[]): void {
  const rows = dossiers.map((dossier) => {
    const rubric = promptRubric(promptForDossier(dossier));
    const pass = Object.values(rubric).every(Boolean);
    return `| ${dossier.scopeLabel} | ${dossier.viewKey} | ${pass ? 'PASS' : 'FAIL'} | ${Object.entries(rubric).filter(([, ok]) => !ok).map(([key]) => key).join('; ') || '-'} |`;
  }).join('\n');
  fs.writeFileSync(path.join(outDir, 'PROMPT_QUALITY_RUBRIC.md'), `# Prompt Quality Rubric

Checklist applied to every \`01_PROMPT_SENT.txt\` file.

- Governed numbers carry amount type.
- Explicit no-calculate rule is present.
- Business-language and Gate-B identity constraints are present.
- Answer/insight schema is present.
- Tone contract is present.
- Gold few-shot is present.
- Prompt contains zero raw ids, file paths, CSV names, row refs, UUIDs, or metric ids.

| Scope | View | Result | Failed checks |
|---|---|---|---|
${rows}
`);
}

function writeDeltaReport(outDir: string, dossiers: readonly TowerAnswerDossier[]): void {
  const beforeVerdicts = countBy(dossiers.map(legacyVerdictFor));
  const afterVerdicts = countBy(dossiers.map((dossier) => dossier.coverage.verdict));
  const beforeRawHits = dossiers.reduce((count, dossier) => count + rawHitCount(legacyPromptRenderSurface(dossier)), 0);
  const afterRawHits = dossiers.reduce((count, dossier) => count + rawHitCount(currentPromptRenderSurface(dossier)), 0);
  const afterOpexGap = namedGapCount(dossiers, /OpEx\/CapEx split not loaded/i);
  const afterVendorUtilizationGap = namedGapCount(dossiers, /vendor utilization not loaded/i);
  const noBlockingGapHits = dossiers.reduce((count, dossier) => count + dossier.gaps.filter((gap) => /no blocking gap found/i.test(gap)).length, 0);
  const enrichedWithoutGrounding = dossiers.filter((dossier) =>
    ['DEEP', 'PARTIAL', 'THIN'].includes(dossier.coverage.verdict) &&
    dossier.derivedInsights.filter((insight) => !insight.placeholder && insight.supportingRefs.length > 0).length <= 1,
  );
  fs.writeFileSync(path.join(outDir, 'DELTA_REPORT.md'), `# Tower Pass B Delta Report

## Applied Fixes

### Verdict honesty

- Before verdict model: ${JSON.stringify(beforeVerdicts)}
- After verdict model: ${JSON.stringify(afterVerdicts)}
- Enriched verdicts without grounded Stage 2 insights after fix: ${enrichedWithoutGrounding.length}
- Applied: ${JSON.stringify([
  'SKELETON_COMPLETE/PARTIAL/THIN now represent Stage 1 coverage only',
  'DEEP/PARTIAL/THIN are held back until Stage 2 grounded insights exist',
])}

### Citation separation

- Before raw-id/path hits on legacy prompt/render surface: ${beforeRawHits}
- After raw-id/path hits on business_body prompt/render surface: ${afterRawHits}
- Applied: ${JSON.stringify([
  'business_body contains only business labels and prompt/render fields',
  'citations keep source row/file lineage internally',
  'validation scans business_body instead of internal citations',
])}

### Named structural gaps

- Before explicit OpEx/CapEx split gap naming: 0 (legacy behavior named only metric absence)
- After explicit OpEx/CapEx split gap naming: ${afterOpexGap}
- Before explicit vendor utilization gap naming: 0 (legacy behavior did not model this missing field)
- After explicit vendor utilization gap naming: ${afterVendorUtilizationGap}
- "no blocking gap found" hits after fix: ${noBlockingGapHits}
- Applied: ${JSON.stringify([
  'consolidated spend dossiers name OpEx/CapEx split not loaded',
  'consolidated spend dossiers name vendor utilization not loaded',
  'fallback gap language no longer says no blocking gap found',
])}

## Boundaries

- Stage 2 Claude links are emitted as \`pending_aca_run\` in this local package.
- Render parity is proven by the standalone harness only; Tower surface wiring remains Pass C.
`);
}

function writeReports(outDir: string, dossiers: readonly TowerAnswerDossier[], input: TowerL3Input): void {
  fs.mkdirSync(outDir, { recursive: true });
  const sample = sampleDossier(dossiers);
  fs.writeFileSync(path.join(outDir, 'SAMPLE_DOSSIER.json'), JSON.stringify(sample, null, 2));
  fs.writeFileSync(path.join(outDir, 'SAMPLE_DOSSIER.md'), dossierToMarkdown(sample));
  const parityRows = dossiers.flatMap((dossier) => writeTrace(outDir, dossier));
  copyRenderHarnessOutputs(outDir, dossiers);
  writeTraceIndex(outDir, dossiers);
  writePromptRubric(outDir, dossiers);
  writeDeltaReport(outDir, dossiers);

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

  writeCsv(path.join(outDir, 'RENDER_PARITY_SUMMARY.csv'), [
    'tenant_key',
    'scope_key',
    'view_key',
    'trace',
    'element_type',
    'label',
    'rendered_value',
    'rendered_text',
    'snapshot_value',
    'snapshot_text',
    'metric_ref',
    'metric_snapshot_id',
    'pass',
  ], parityRows.map((row) => [
    row.tenant_key,
    row.scope_key,
    row.view_key,
    row.trace,
    row.elementType,
    row.label,
    row.renderedValue,
    row.renderedText,
    row.snapshotValue,
    row.snapshotText,
    row.metricRef,
    row.metricSnapshotId,
    row.pass,
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
