#!/usr/bin/env node
/**
 * Meridian + Lakeshore V2 backend refresh preflight/scaffold.
 *
 * Default mode is dry-run. It does not connect to Azure/Postgres, delete rows,
 * stage blobs, or load data. It validates the local V2 packs and writes a
 * refresh receipt plus client-scoped SQL/runbook artifacts for the later ACA
 * private data-plane execution.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_ID = `meridian-lakeshore-v2-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs/context-refresh', RUN_ID);

const CLIENTS = [
  {
    key: 'meridian-health',
    name: 'Meridian Health',
    clientId: 'd2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612',
    aliases: ['meridian-health', 'meridian', 'meridian-health-system', 'phs-meridian'],
    datasetRoot: 'datasets/meridian-health-synthetic-v2',
  },
  {
    key: 'lakeshore',
    name: 'Lakeshore Industries',
    clientId: '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667',
    aliases: ['lakeshore', 'lakeshore-holdings', 'lakeshore-industries'],
    datasetRoot: 'datasets/lakeshore-industries-synthetic-v2',
  },
];

const REPLACE_TABLES = [
  { table: 'context_insights', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_stewardship_tasks', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_quality_issues', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_relationships', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_evidence', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_facts', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_chunks', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_records', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_source_files', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_sources', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'enterprise_context_template_runs', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'data_ingestion_runs', filter: 'tenant_key = any($tenant_aliases)' },
  { table: 'client_private_patterns', filter: 'client_id = $client_id' },
  { table: 'ai_control_atlas_context_packs', filter: 'client_id = $client_id' },
  { table: 'ai_control_context_relationships', filter: 'client_id = $client_id' },
  { table: 'ai_control_context_facts', filter: 'client_id = $client_id' },
  { table: 'ai_control_evidence_items', filter: 'client_id = $client_id' },
  { table: 'ai_control_actions', filter: 'client_id = $client_id' },
  { table: 'ai_control_risk_governance', filter: 'client_id = $client_id' },
  { table: 'ai_control_spend_contracts', filter: 'client_id = $client_id' },
  { table: 'ai_control_benefit_realization', filter: 'client_id = $client_id' },
  { table: 'ai_control_agent_outcomes', filter: 'client_id = $client_id' },
  { table: 'ai_control_dora_metrics', filter: 'client_id = $client_id' },
  { table: 'ai_control_persona_productivity', filter: 'client_id = $client_id' },
  { table: 'ai_control_tool_usage_monthly', filter: 'client_id = $client_id' },
  { table: 'ai_control_initiatives', filter: 'client_id = $client_id' },
  { table: 'ai_control_sources', filter: 'client_id = $client_id' },
  { table: 'ai_control_refresh_runs', filter: 'client_id = $client_id' },
  { table: 'tower_cloud_cost', filter: 'client_id = $client_id' },
  { table: 'tower_program_financials', filter: 'client_id = $client_id' },
  { table: 'tower_vendor_spend', filter: 'client_id = $client_id' },
  { table: 'tower_ai_tool_usage', filter: 'client_id = $client_id' },
  { table: 'tower_dora_metrics', filter: 'client_id = $client_id' },
  { table: 'tower_itsm_records', filter: 'client_id = $client_id' },
  { table: 'tower_jira_issues', filter: 'client_id = $client_id' },
  { table: 'tower_workforce', filter: 'client_id = $client_id' },
  { table: 'ai_initiatives', filter: 'client_id = $client_id' },
  { table: 'vendor_contracts', filter: 'client_id = $client_id' },
  { table: 'applications', filter: 'client_id = $client_id' },
];

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function read(rel) { return fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'); }
function write(rel, content) {
  const file = path.join(OUTPUT_ROOT, rel);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}
function parseJson(rel) { return JSON.parse(read(rel)); }

function countCsvRows(rel) {
  const text = read(rel).trim();
  if (!text) return 0;
  return Math.max(0, text.split(/\r?\n/).length - 1);
}

function countJsonlRows(rel) {
  const text = read(rel).trim();
  if (!text) return 0;
  return text.split(/\r?\n/).filter((line) => line.trim()).length;
}

function fileExists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function parseManifestFiles(manifestText) {
  const files = [];
  let current = null;
  for (const raw of manifestText.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('- order:')) {
      if (current) files.push(current);
      current = { order: Number(line.replace('- order:', '').trim()) };
      continue;
    }
    if (!current) continue;
    const match = line.match(/^([a-z_]+):\s*(.+)$/);
    if (!match) continue;
    current[match[1]] = match[2];
  }
  if (current) files.push(current);
  return files.filter((entry) => entry.file);
}

function validateClientPack(client) {
  const root = client.datasetRoot;
  const manifestPath = `${root}/manifest.yaml`;
  const countsPath = `${root}/99-verification/expected-row-counts.json`;
  const goldenPath = `${root}/99-verification/golden-questions.json`;
  const patternPath = `${root}/corpus-patterns/move-patterns.jsonl`;
  const errors = [];

  for (const rel of [manifestPath, countsPath, goldenPath, patternPath]) {
    if (!fileExists(rel)) errors.push(`missing:${rel}`);
  }
  if (errors.length) return { client: client.key, ok: false, errors };

  const manifestFiles = parseManifestFiles(read(manifestPath));
  const missingManifestFiles = manifestFiles
    .map((entry) => `${root}/${entry.file}`)
    .filter((rel) => !fileExists(rel));
  errors.push(...missingManifestFiles.map((rel) => `manifest_file_missing:${rel}`));

  const expected = parseJson(countsPath);
  const actual = {
    manifest_entries: manifestFiles.length,
    context_csv_rows: 0,
    graph_edges: 0,
    tower_csv_rows: 0,
    corpus_patterns: countJsonlRows(patternPath),
    source_docs: fs.readdirSync(path.join(REPO_ROOT, root, 'source-docs')).filter((name) => name.endsWith('.md')).length,
  };

  for (const entry of manifestFiles) {
    const rel = `${root}/${entry.file}`;
    if (rel.endsWith('.csv')) actual.context_csv_rows += countCsvRows(rel);
    if (rel.endsWith('.jsonl')) actual.graph_edges += countJsonlRows(rel);
  }

  const towerRoot = path.join(REPO_ROOT, root, 'ai-control-tower');
  const towerFiles = fs.existsSync(towerRoot)
    ? fs.readdirSync(towerRoot).filter((name) => name.endsWith('.csv')).sort()
    : [];
  for (const file of towerFiles) actual.tower_csv_rows += countCsvRows(`${root}/ai-control-tower/${file}`);

  const expectedChecks = {
    applications: expected.applications,
    integrations: expected.integrations,
    edges: expected.edges,
    ai_control_tower_registry: expected.ai_control_tower_registry,
    corpus_patterns: expected.corpus_patterns,
  };
  if (actual.graph_edges !== expected.edges) {
    errors.push(`edge_count_mismatch:actual=${actual.graph_edges}:expected=${expected.edges}`);
  }
  if (actual.corpus_patterns !== expected.corpus_patterns) {
    errors.push(`pattern_count_mismatch:actual=${actual.corpus_patterns}:expected=${expected.corpus_patterns}`);
  }

  return {
    client: client.key,
    ok: errors.length === 0,
    dataset_root: root,
    manifest_path: manifestPath,
    expected_counts_path: countsPath,
    golden_questions_path: goldenPath,
    corpus_patterns_path: patternPath,
    manifest_files: manifestFiles,
    expected_checks: expectedChecks,
    expected_counts: expected,
    actual_counts: actual,
    errors,
  };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function renderSql(client) {
  const aliases = `array[${client.aliases.map(sqlLiteral).join(', ')}]::text[]`;
  const lines = [
    `-- ${client.name} V2 client-scoped replacement SQL`,
    '-- Review counts and archive before executing deletes.',
    'BEGIN;',
    '',
    `-- Client id expected: ${client.clientId}`,
    `-- Tenant aliases: ${client.aliases.join(', ')}`,
    '',
    '-- Pre-counts',
    ...REPLACE_TABLES.map(({ table, filter }) =>
      `SELECT ${sqlLiteral(table)} AS table_name, count(*)::int AS rows_before FROM public.${table} WHERE ${filter.replace('$tenant_aliases', aliases).replace('$client_id', sqlLiteral(client.clientId))};`,
    ),
    '',
    '-- Deletes in FK-safe order. Keep clients/users/audit/global corpus untouched.',
    ...REPLACE_TABLES.map(({ table, filter }) =>
      `DELETE FROM public.${table} WHERE ${filter.replace('$tenant_aliases', aliases).replace('$client_id', sqlLiteral(client.clientId))};`,
    ),
    '',
    'COMMIT;',
    '',
  ];
  return lines.join('\n');
}

function renderRunbook(results) {
  return `# Meridian + Lakeshore V2 Refresh Preflight Receipt

Run id: \`${RUN_ID}\`
Generated at: ${new Date().toISOString()}

## Scope

This receipt validates local V2 source packs and emits client-scoped replacement SQL. It does **not** delete data, stage blobs, commit context rows, refresh embeddings, or prove signed-in retrieval.

## Clients

${results.map((result) => `### ${result.client}

- OK: ${result.ok ? 'yes' : 'no'}
- Dataset: \`${result.dataset_root}\`
- Manifest entries: ${result.actual_counts?.manifest_entries ?? 0}
- Context CSV rows counted from manifest files: ${result.actual_counts?.context_csv_rows ?? 0}
- Graph edges: ${result.actual_counts?.graph_edges ?? 0}
- Tower CSV rows: ${result.actual_counts?.tower_csv_rows ?? 0}
- Corpus patterns: ${result.actual_counts?.corpus_patterns ?? 0}
- Source docs: ${result.actual_counts?.source_docs ?? 0}
- Errors: ${result.errors?.length ? result.errors.join('; ') : 'none'}
`).join('\n')}

## Replacement Rules

- Preserve \`clients\`, users, memberships, auth, audit/egress logs, and global \`corpus_patterns\`.
- Archive current client rows before delete in the ACA/private DB execution step.
- Delete only rows matching the client id or tenant aliases listed in each generated SQL file.
- Load order after delete: manifest YAML/CSV dimensions, source docs/chunks, private corpus patterns, Tower T00-T13, graph edges last, insight evaluator, embeddings/search, signed-in QA.

## Generated Artifacts

- \`receipt.json\`
- \`runbook.md\`
- \`sql/meridian-health-replace.sql\`
- \`sql/lakeshore-replace.sql\`

## Ingestion Truth

- Local artifact generated: yes
- Local parse/preflight: yes
- Product loader/API acceptance: not run
- Azure Blob/object storage staging: not run
- Queue/private worker handoff: not run
- Parser extraction with source citations: not run
- Review/approval queue: not run
- Client data-plane commit: not run
- Embedding/search refresh: not run
- Live signed-in retrieval or answer QA: not run
`;
}

ensureDir(OUTPUT_ROOT);

const results = CLIENTS.map(validateClientPack);
for (const client of CLIENTS) {
  write(`sql/${client.key}-replace.sql`, renderSql(client));
}
write('receipt.json', JSON.stringify({
  run_id: RUN_ID,
  generated_at: new Date().toISOString(),
  mode: 'dry_run_preflight',
  replace_tables: REPLACE_TABLES,
  results,
}, null, 2) + '\n');
write('runbook.md', renderRunbook(results));

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({
  run_id: RUN_ID,
  output_root: path.relative(REPO_ROOT, OUTPUT_ROOT),
  ok: failed.length === 0,
  clients: results.map((result) => ({
    client: result.client,
    ok: result.ok,
    context_csv_rows: result.actual_counts?.context_csv_rows,
    tower_csv_rows: result.actual_counts?.tower_csv_rows,
    graph_edges: result.actual_counts?.graph_edges,
    corpus_patterns: result.actual_counts?.corpus_patterns,
    errors: result.errors,
  })),
}, null, 2));

if (failed.length > 0) process.exit(1);
