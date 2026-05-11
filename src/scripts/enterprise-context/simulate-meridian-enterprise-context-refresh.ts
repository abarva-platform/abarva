import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import ExcelJS from 'exceljs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  parseMeridianEnterpriseContextDataset,
  type EnterpriseContextCsvRow,
} from '../../lib/enterprise-context/ingestion/meridian-loader';
import {
  buildMeridianRefreshSimulation,
  type MeridianRefreshSimulation,
  type MeridianRefreshSnapshot,
} from '../../lib/enterprise-context/refresh-simulator';
import {
  ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
  ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS,
  type EnterpriseContextTemplateWorkbook,
} from '../../lib/enterprise-context/template-schema';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

type Args = {
  apply: boolean;
  sourceRoot: string;
  outRoot: string;
};

type DbRow = Record<string, unknown>;

const DEFAULT_SOURCE_ROOT = path.resolve(process.cwd(), 'docs/enterprise-context/synthetic/meridian');
const DEFAULT_OUT_ROOT = path.resolve(process.cwd(), 'docs/enterprise-context/refresh/meridian');
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const sourceArg = args.find((arg) => arg.startsWith('--source='));
  const outArg = args.find((arg) => arg.startsWith('--out='));
  return {
    apply: args.includes('--apply'),
    sourceRoot: sourceArg ? path.resolve(sourceArg.split('=')[1] ?? '') : DEFAULT_SOURCE_ROOT,
    outRoot: outArg ? path.resolve(outArg.split('=')[1] ?? '') : DEFAULT_OUT_ROOT,
  };
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to apply refresh snapshots.');
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureMeridianClientId(client: SupabaseClient): Promise<string> {
  const existing = await client
    .from('clients')
    .select('id')
    .or('name.eq.Meridian Health,name.eq.Meridian Health System,legal_name.eq.Meridian Health System')
    .limit(1)
    .maybeSingle();
  if (existing.error) throw new Error(`Meridian client lookup failed: ${existing.error.message}`);
  if (existing.data?.id) return existing.data.id as string;

  const inserted = await client
    .from('clients')
    .insert({ name: 'Meridian Health', legal_name: 'Meridian Health System', industry_code: 'healthcare' })
    .select('id')
    .single();
  if (inserted.error) throw new Error(`Meridian client insert failed: ${inserted.error.message}`);
  return inserted.data.id as string;
}

async function upsertBatch(client: SupabaseClient, table: string, rows: DbRow[], onConflict: string): Promise<number> {
  const batchSize = 250;
  for (let index = 0; index < rows.length; index += batchSize) {
    const { error } = await client.from(table).upsert(rows.slice(index, index + batchSize), { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  return rows.length;
}

function csvEscape(value: string | number | boolean | undefined): string {
  const text = value === undefined ? '' : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: EnterpriseContextCsvRow[], columns: readonly string[]): string {
  return [
    columns.map(csvEscape).join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n') + '\n';
}

async function writeWorkbook(
  template: EnterpriseContextTemplateWorkbook,
  rows: EnterpriseContextCsvRow[],
  snapshot: MeridianRefreshSnapshot,
  outDir: string,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AbarVa Enterprise Context';
  workbook.created = new Date(`${snapshot.asOfDate}T00:00:00.000Z`);
  workbook.modified = new Date(`${snapshot.asOfDate}T00:00:00.000Z`);
  workbook.title = `Meridian Health ${snapshot.label} ${template.title}`;
  workbook.description = `Synthetic, fictional, non-PHI Meridian refresh data. Template version ${ENTERPRISE_CONTEXT_TEMPLATE_VERSION}.`;

  const instructions = workbook.addWorksheet('Instructions');
  instructions.columns = [{ width: 28 }, { width: 110 }];
  [
    ['Dataset', `Meridian Health ${snapshot.label}`],
    ['Workbook', template.title],
    ['Rows', String(rows.length)],
    ['As of date', snapshot.asOfDate],
    ['Notice', 'Fictional internal enterprise context only. No PHI or patient-identifiable data.'],
    ['Refresh use', 'Use to validate weekly/monthly sync, diff, snapshot, quality, and stewardship behavior.'],
  ].forEach((row, index) => {
    instructions.getRow(index + 1).values = row;
  });

  const dictionary = workbook.addWorksheet('Data Dictionary');
  dictionary.columns = [
    { header: 'column', key: 'column', width: 32 },
    { header: 'required', key: 'required', width: 12 },
    { header: 'type', key: 'type', width: 12 },
    { header: 'description', key: 'description', width: 80 },
    { header: 'example', key: 'example', width: 40 },
  ];
  template.columns.forEach((column) => dictionary.addRow({
    column: column.key,
    required: column.required ? 'yes' : 'no',
    type: column.type,
    description: column.description,
    example: column.example,
  }));

  const data = workbook.addWorksheet('Data', { views: [{ state: 'frozen', ySplit: 1 }] });
  const columns = template.columns.map((column) => column.key);
  data.addRow(columns);
  rows.forEach((row) => data.addRow(columns.map((column) => row[column] ?? '')));
  data.columns.forEach((column, index) => {
    const key = columns[index] ?? '';
    column.width = Math.max(14, Math.min(42, key.length + 6));
  });
  data.getRow(1).font = { bold: true };
  data.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  await workbook.xlsx.writeFile(path.join(outDir, `${template.filenameBase}.xlsx`));
}

async function writeSnapshotFiles(
  simulation: MeridianRefreshSimulation,
  snapshot: MeridianRefreshSnapshot,
  outRoot: string,
) {
  const snapshotDir = path.join(outRoot, snapshot.snapshotKey);
  mkdirSync(snapshotDir, { recursive: true });

  for (const template of ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS) {
    const rows = snapshot.tables[template.key];
    if (!rows) throw new Error(`No refresh rows for ${template.key}`);
    const columns = template.columns.map((column) => column.key);
    writeFileSync(path.join(snapshotDir, `${template.filenameBase}.csv`), toCsv(rows, columns));
    await writeWorkbook(template, rows, snapshot, snapshotDir);
  }

  const manifest = {
    tenantKey: simulation.tenantKey,
    tenantSlug: 'meridian',
    displayName: 'Meridian Health',
    generatedAt: `${snapshot.asOfDate}T00:00:00.000Z`,
    fictional: true,
    noPhi: true,
    seed: `meridian-enterprise-context-refresh-${snapshot.snapshotKey}`,
    templateVersion: ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
    workbookCount: ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.length,
    totalRows: Object.values(snapshot.tables).reduce((sum, rows) => sum + rows.length, 0),
    validation: { unresolvedReferences: 0 },
    refresh: {
      snapshotKey: snapshot.snapshotKey,
      label: snapshot.label,
      datasetHash: snapshot.datasetHash,
      diffFromPrevious: snapshot.diffFromPrevious,
      scenarios: snapshot.scenarios,
    },
    datasets: ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.map((template) => ({
      key: template.key,
      title: template.title,
      csv: `${template.filenameBase}.csv`,
      xlsx: `${template.filenameBase}.xlsx`,
      rows: snapshot.tables[template.key]?.length ?? 0,
      columns: template.columns.map((column) => column.key),
    })),
  };
  writeFileSync(path.join(snapshotDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(path.join(snapshotDir, 'refresh-diff.json'), `${JSON.stringify({
    snapshotKey: snapshot.snapshotKey,
    label: snapshot.label,
    asOfDate: snapshot.asOfDate,
    diffFromPrevious: snapshot.diffFromPrevious,
    scenarios: snapshot.scenarios,
  }, null, 2)}\n`);
}

async function writeSimulationFiles(simulation: MeridianRefreshSimulation, outRoot: string) {
  mkdirSync(outRoot, { recursive: true });
  for (const snapshot of simulation.snapshots) {
    await writeSnapshotFiles(simulation, snapshot, outRoot);
  }
  writeFileSync(path.join(outRoot, 'refresh-report.json'), `${JSON.stringify(simulation.report, null, 2)}\n`);
  writeFileSync(path.join(outRoot, 'REFRESH_REPORT.md'), renderMarkdownReport(simulation));
}

function renderMarkdownReport(simulation: MeridianRefreshSimulation): string {
  const lines = [
    '# Meridian Enterprise Context Refresh Simulation',
    '',
    'Synthetic internal-context refresh pack for Day Two sync testing. No PHI. No industry or external research.',
    '',
    `Generated: ${simulation.generatedAt}`,
    `Tenant: ${simulation.tenantKey}`,
    '',
    '## Snapshots',
    '',
    '| Snapshot | Active records | New records | Changed records | Superseded facts | Stewardship tasks |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...simulation.report.snapshots.map((snapshot) => (
      `| ${snapshot.label} | ${snapshot.activeRecords} | ${snapshot.newRecords} | ${snapshot.changedRecords} | ${snapshot.supersededFacts} | ${snapshot.stewardshipTasksCreated} |`
    )),
    '',
    '## Refresh Scenarios',
    '',
    '| Snapshot | Scenario | Domain | Change | Stewardship signal |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const snapshot of simulation.snapshots) {
    for (const scenario of snapshot.scenarios) {
      lines.push(`| ${snapshot.label} | ${scenario.title} | ${scenario.domain} | ${scenario.changeType} | ${scenario.stewardshipSignal} |`);
    }
  }

  lines.push(
    '',
    '## Operating Model',
    '',
    '- Stable source IDs are preserved across refreshes, so unchanged rows upsert cleanly.',
    '- Changed facts are counted as superseded facts, preserving history for downstream evidence and retrieval.',
    '- Snapshot rows are written before canonical overwrite decisions, so Source, Moves, Tower, and Intelligence can inspect freshness and stewardship risk first.',
    '- Quality and stewardship tasks are generated for refresh signals that need human validation.',
    '',
  );
  return lines.join('\n');
}

async function applySimulation(simulation: MeridianRefreshSimulation, outRoot: string): Promise<Record<string, number>> {
  const client = getClient();
  const clientId = await ensureMeridianClientId(client);
  const now = new Date().toISOString();

  const snapshotRows = simulation.snapshots.map((snapshot) => ({
    client_id: clientId,
    tenant_key: simulation.tenantKey,
    snapshot_key: `${simulation.tenantKey}:refresh:${snapshot.snapshotKey}`,
    snapshot_type: 'refresh_simulation',
    source_system: 'day_one_template',
    source_record_id: snapshot.snapshotKey,
    source_file: `${snapshot.snapshotKey}/manifest.json`,
    source_sheet: 'Data',
    owner: 'Enterprise Context Stewardship',
    last_synced_at: now,
    last_validated_at: snapshot.asOfDate,
    confidence: 0.86,
    freshness_status: 'fresh',
    evidence_pointer: path.join(outRoot, snapshot.snapshotKey, 'manifest.json'),
    snapshot_payload: {
      label: snapshot.label,
      asOfDate: snapshot.asOfDate,
      datasetHash: snapshot.datasetHash,
      planSummary: snapshot.planSummary,
      scenarios: snapshot.scenarios,
    },
    diff_summary: snapshot.diffFromPrevious,
    updated_at: now,
  }));

  const scenarioRows = simulation.snapshots.flatMap((snapshot) => snapshot.scenarios.map((scenario) => ({
    client_id: clientId,
    tenant_key: simulation.tenantKey,
    issue_key: `${scenario.scenarioKey}:refresh-signal`,
    issue_type: `refresh_${scenario.changeType}`,
    severity: scenario.changeType === 'stale' || scenario.changeType === 'worsened' ? 'high' : 'medium',
    status: 'open',
    source_system: scenario.domain === 'CMDB' || scenario.domain === 'Incidents' || scenario.domain === 'Problems' ? 'ServiceNow' : 'day_one_template',
    source_record_id: scenario.sourceRecordId,
    source_file: `${snapshot.snapshotKey}/refresh-diff.json`,
    source_sheet: 'Refresh Scenarios',
    source_row_number: 1,
    owner: scenario.owner,
    steward_owner: 'Enterprise Context Stewardship',
    last_synced_at: now,
    last_validated_at: snapshot.asOfDate,
    confidence: 0.84,
    freshness_status: scenario.changeType === 'stale' ? 'stale' : 'fresh',
    evidence_pointer: path.join(outRoot, snapshot.snapshotKey, 'refresh-diff.json'),
    details: { title: scenario.title, stewardship_signal: scenario.stewardshipSignal },
    updated_at: now,
  })));

  const qualityIssueCount = await upsertBatch(client, 'enterprise_context_quality_issues', scenarioRows, 'tenant_key,issue_key');
  const issueKeys = scenarioRows.map((row) => String(row.issue_key));
  const issueIdByKey = await fetchQualityIssueIds(client, simulation.tenantKey, issueKeys);

  const taskRows = simulation.snapshots.flatMap((snapshot) => snapshot.scenarios.map((scenario) => ({
    client_id: clientId,
    tenant_key: simulation.tenantKey,
    task_key: `${scenario.scenarioKey}:refresh-stewardship-task`,
    issue_id: issueIdByKey.get(`${scenario.scenarioKey}:refresh-signal`) ?? null,
    task_type: `refresh_${scenario.changeType}`,
    title: scenario.stewardshipSignal,
    status: 'open',
    priority: scenario.changeType === 'stale' || scenario.changeType === 'worsened' ? 'high' : 'medium',
    assigned_owner: scenario.owner,
    source_system: scenario.domain === 'CMDB' || scenario.domain === 'Incidents' || scenario.domain === 'Problems' ? 'ServiceNow' : 'day_one_template',
    source_record_id: scenario.sourceRecordId,
    source_file: `${snapshot.snapshotKey}/refresh-diff.json`,
    source_sheet: 'Refresh Scenarios',
    source_row_number: 1,
    owner: scenario.owner,
    due_date: '2026-06-08',
    last_synced_at: now,
    last_validated_at: snapshot.asOfDate,
    confidence: 0.84,
    freshness_status: scenario.changeType === 'stale' ? 'stale' : 'fresh',
    evidence_pointer: path.join(outRoot, snapshot.snapshotKey, 'refresh-diff.json'),
    details: { title: scenario.title },
    updated_at: now,
  })));

  return {
    snapshots: await upsertBatch(client, 'enterprise_context_snapshots', snapshotRows, 'tenant_key,snapshot_key'),
    qualityIssues: qualityIssueCount,
    stewardshipTasks: await upsertBatch(client, 'enterprise_context_stewardship_tasks', taskRows, 'tenant_key,task_key'),
  };
}

async function fetchQualityIssueIds(client: SupabaseClient, tenantKey: string, issueKeys: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const batchSize = 200;
  for (let index = 0; index < issueKeys.length; index += batchSize) {
    const { data, error } = await client
      .from('enterprise_context_quality_issues')
      .select('id,issue_key')
      .eq('tenant_key', tenantKey)
      .in('issue_key', issueKeys.slice(index, index + batchSize));
    if (error) throw new Error(`enterprise_context_quality_issues lookup failed: ${error.message}`);
    for (const row of (data ?? []) as unknown as DbRow[]) {
      out.set(String(row.issue_key), String(row.id));
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const parsed = parseMeridianEnterpriseContextDataset(args.sourceRoot);
  const simulation = buildMeridianRefreshSimulation(parsed);
  await writeSimulationFiles(simulation, args.outRoot);

  if (!args.apply) {
    console.log(JSON.stringify({ mode: 'dry-run', outRoot: args.outRoot, ...simulation.report }, null, 2));
    return;
  }

  const applied = await applySimulation(simulation, args.outRoot);
  console.log(JSON.stringify({ mode: 'apply', outRoot: args.outRoot, applied, report: simulation.report }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
