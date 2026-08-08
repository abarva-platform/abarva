import { config as loadEnv } from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const DEFAULT_OPEN_EXCLUSIONS = ['archived', 'completed', 'settled', 'cancelled', 'canceled', 'deleted'];
const CONFIRM_TOKEN = 'CONFIRM_SOURCE_OPEN_EVENT_CLEANUP';

type Args = {
  tenantKeys: string[];
  apply: boolean;
  includeCompleted: boolean;
  operator: string;
  reason: string;
  confirm: string | null;
  outDir: string;
  emitProofBundle: boolean;
};

type TableColumns = Map<string, Set<string>>;

type SourceEventRow = {
  id: string;
  client_key: string;
  event_code: string | null;
  event_name: string | null;
  lifecycle_state: string | null;
  current_stage_key: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SourceArtifactRow = {
  id: string;
  tenant_key: string | null;
  source_event_row_id: string | null;
  source_event_id?: string | null;
  original_name: string | null;
  artifact_kind: string | null;
  blob_uri: string | null;
  blob_container: string | null;
  blob_path: string | null;
  deleted_at: string | null;
};

type BlobTarget = {
  artifactId: string;
  logicalContainer: string;
  logicalPath: string;
  physicalContainer: string;
  physicalPath: string;
  originalName: string | null;
};

function parseArgs(argv: string[]): Args {
  const tenantKeys: string[] = splitEnvList(process.env.SOURCE_CLEANUP_TENANT_KEYS);
  let apply = process.env.SOURCE_CLEANUP_APPLY === 'true';
  let includeCompleted = process.env.SOURCE_CLEANUP_INCLUDE_COMPLETED === 'true';
  let operator = process.env.ABARVA_OPERATOR_ID || 'source-open-event-cleanup-operator';
  let reason = process.env.SOURCE_CLEANUP_REASON || 'operator_source_open_event_cleanup';
  let confirm: string | null = process.env.SOURCE_CLEANUP_CONFIRM || null;
  let outDir = process.env.SOURCE_CLEANUP_OUT_DIR || path.join(os.tmpdir(), `source-open-event-cleanup-${stamp()}`);
  let emitProofBundle = process.env.EMIT_ACA_PROOF_BUNDLE === 'true';

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === '--tenant-key') tenantKeys.push(next());
    else if (arg === '--apply') apply = true;
    else if (arg === '--include-completed') includeCompleted = true;
    else if (arg === '--operator') operator = next();
    else if (arg === '--reason') reason = next();
    else if (arg === '--confirm') confirm = next();
    else if (arg === '--out-dir') outDir = next();
    else if (arg === '--emit-proof-bundle') emitProofBundle = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (tenantKeys.length === 0) {
    throw new Error('At least one --tenant-key is required.');
  }

  return {
    tenantKeys: [...new Set(tenantKeys.map((key) => key.trim()).filter(Boolean))],
    apply,
    includeCompleted,
    operator,
    reason,
    confirm,
    outDir,
    emitProofBundle,
  };
}

function printHelp(): void {
  console.log(`Usage:
  npx tsx scripts/ops/source-open-event-cleanup.ts --tenant-key <key> [--tenant-key <alias>]

Dry-run is the default. Apply requires:
  --apply --confirm ${CONFIRM_TOKEN}

ACA operator jobs may use env vars instead of CLI args:
  SOURCE_CLEANUP_TENANT_KEYS=skyharbor-air,skyharbor
  SOURCE_CLEANUP_APPLY=true
  SOURCE_CLEANUP_CONFIRM=${CONFIRM_TOKEN}

Options:
  --include-completed    Include completed/settled lifecycle rows in addition to open rows.
  --operator <id>        Audit actor label.
  --reason <text>        Cleanup reason stored in activity metadata.
  --out-dir <path>       Local proof directory.
  --emit-proof-bundle    Emit a base64 proof tgz for ACA operator extraction.
`);
}

function splitEnvList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL || process.env.ABARVA_AZURE_DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL or ABARVA_AZURE_DATABASE_URL is required.');
  return value;
}

function sha256File(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function loadTableColumns(client: Client): Promise<TableColumns> {
  const { rows } = await client.query<{ table_name: string; column_name: string }>(`
    select table_name, column_name
      from information_schema.columns
     where table_schema = 'public'
       and table_name = any($1::text[])
     order by table_name, ordinal_position
  `, [[
    'source_events',
    'source_artifacts',
    'source_event_artifact_states',
    'source_event_evidence_states',
    'source_event_gate_criterion_states',
    'source_event_participants',
    'source_event_activity',
    'source_event_approvals',
    'source_event_pricing_submissions',
    'source_artifact_acceptances',
    'source_artifact_generation_jobs',
    'source_reasoning_envelopes',
    'source_event_facts',
    'source_value_levers',
  ]]);
  const columns: TableColumns = new Map();
  for (const row of rows) {
    let set = columns.get(row.table_name);
    if (!set) {
      set = new Set();
      columns.set(row.table_name, set);
    }
    set.add(row.column_name);
  }
  return columns;
}

function hasTable(columns: TableColumns, table: string): boolean {
  return columns.has(table);
}

function hasColumn(columns: TableColumns, table: string, column: string): boolean {
  return columns.get(table)?.has(column) ?? false;
}

async function listCandidateEvents(client: Client, args: Args): Promise<SourceEventRow[]> {
  const lifecycleClause = args.includeCompleted
    ? "coalesce(lifecycle_state, '') <> 'archived'"
    : "lower(coalesce(lifecycle_state, '')) <> all($2::text[])";
  const params = args.includeCompleted
    ? [args.tenantKeys]
    : [args.tenantKeys, DEFAULT_OPEN_EXCLUSIONS];
  const { rows } = await client.query<SourceEventRow>(`
    select id::text, client_key, event_code, event_name, lifecycle_state,
           current_stage_key, created_at::text, updated_at::text
      from public.source_events
     where client_key = any($1::text[])
       and ${lifecycleClause}
     order by updated_at desc nulls last, created_at desc nulls last, id
  `, params);
  return rows;
}

async function listArtifacts(
  client: Client,
  columns: TableColumns,
  tenantKeys: string[],
  eventIds: string[],
): Promise<SourceArtifactRow[]> {
  if (!hasTable(columns, 'source_artifacts')) return [];
  const sourceEventColumn = hasColumn(columns, 'source_artifacts', 'source_event_row_id')
    ? 'source_event_row_id'
    : hasColumn(columns, 'source_artifacts', 'source_event_id')
      ? 'source_event_id'
      : null;
  if (!sourceEventColumn || eventIds.length === 0) return [];
  const params = [tenantKeys, eventIds];
  const sourceEventSelect = sourceEventColumn === 'source_event_id'
    ? 'source_event_id::text as source_event_id, null::text as source_event_row_id'
    : sourceEventColumn === 'source_event_row_id'
      ? 'source_event_row_id::text as source_event_row_id, null::text as source_event_id'
      : 'null::text as source_event_row_id, null::text as source_event_id';

  const { rows } = await client.query<SourceArtifactRow>(`
    select id::text, tenant_key, ${sourceEventSelect},
           original_name, artifact_kind, blob_uri, blob_container, blob_path,
           deleted_at::text
      from public.source_artifacts
     where tenant_key = any($1::text[])
       and ${quoteIdent(sourceEventColumn)} = any($2::uuid[])
     order by created_at desc nulls last, id
  `, params);
  return rows;
}

async function countRelatedRows(
  client: Client,
  columns: TableColumns,
  tenantKeys: string[],
  eventIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const tableEventColumns: Record<string, string> = {
    source_event_artifact_states: 'source_event_id',
    source_event_evidence_states: 'source_event_id',
    source_event_gate_criterion_states: 'source_event_id',
    source_event_participants: 'source_event_id',
    source_event_activity: 'event_id',
    source_event_approvals: 'event_id',
    source_event_pricing_submissions: 'source_event_id',
    source_artifact_generation_jobs: 'source_event_id',
    source_reasoning_envelopes: 'source_event_id',
    source_event_facts: 'source_event_id',
    source_value_levers: 'source_event_id',
  };

  for (const [table, eventColumn] of Object.entries(tableEventColumns)) {
    if (!hasTable(columns, table) || !hasColumn(columns, table, eventColumn) || eventIds.length === 0) {
      counts[table] = 0;
      continue;
    }
    const { rows } = await client.query<{ count: string }>(
      `select count(*)::text as count from public.${quoteIdent(table)} where ${quoteIdent(eventColumn)} = any($1::uuid[])`,
      [eventIds],
    );
    counts[table] = Number(rows[0]?.count ?? 0);
  }

  if (hasTable(columns, 'source_artifact_acceptances') && eventIds.length > 0) {
    const { rows } = await client.query<{ count: string }>(
      'select count(*)::text as count from public.source_artifact_acceptances where event_id = any($1::uuid[])',
      [eventIds],
    );
    counts.source_artifact_acceptances = Number(rows[0]?.count ?? 0);
  }

  const { rows } = await client.query<{ count: string }>(
    "select count(*)::text as count from public.source_events where client_key = any($1::text[]) and lower(coalesce(lifecycle_state, '')) = 'archived'",
    [tenantKeys],
  );
  counts.pre_existing_archived_events = Number(rows[0]?.count ?? 0);
  return counts;
}

async function countLifecycleStates(
  client: Client,
  tenantKeys: string[],
): Promise<Array<{ client_key: string; lifecycle_state: string | null; count: number }>> {
  const { rows } = await client.query<{ client_key: string; lifecycle_state: string | null; count: string }>(`
    select client_key, lifecycle_state, count(*)::text as count
      from public.source_events
     where client_key = any($1::text[])
     group by client_key, lifecycle_state
     order by client_key, lifecycle_state
  `, [tenantKeys]);
  return rows.map((row) => ({ ...row, count: Number(row.count) }));
}

async function loadRelatedRows(
  client: Client,
  columns: TableColumns,
  eventIds: string[],
): Promise<Record<string, unknown[]>> {
  const rowsByTable: Record<string, unknown[]> = {};
  if (eventIds.length === 0) return rowsByTable;

  const tableEventColumns: Record<string, string> = {
    source_event_artifact_states: 'source_event_id',
    source_event_evidence_states: 'source_event_id',
    source_event_gate_criterion_states: 'source_event_id',
    source_event_participants: 'source_event_id',
    source_event_activity: 'event_id',
    source_event_approvals: 'event_id',
    source_event_pricing_submissions: 'source_event_id',
    source_artifact_generation_jobs: 'source_event_id',
    source_reasoning_envelopes: 'source_event_id',
    source_event_facts: 'source_event_id',
    source_value_levers: 'source_event_id',
  };

  for (const [table, eventColumn] of Object.entries(tableEventColumns)) {
    if (!hasTable(columns, table) || !hasColumn(columns, table, eventColumn)) {
      rowsByTable[table] = [];
      continue;
    }
    const { rows } = await client.query<Record<string, unknown>>(
      `select * from public.${quoteIdent(table)} where ${quoteIdent(eventColumn)} = any($1::uuid[])`,
      [eventIds],
    );
    rowsByTable[table] = rows;
  }

  if (hasTable(columns, 'source_artifact_acceptances')) {
    const { rows } = await client.query<Record<string, unknown>>(
      'select * from public.source_artifact_acceptances where event_id = any($1::uuid[])',
      [eventIds],
    );
    rowsByTable.source_artifact_acceptances = rows;
  }

  return rowsByTable;
}

function parseBlobUri(uri: string | null): { container: string; path: string } | null {
  if (!uri) return null;
  const azMatch = uri.match(/^az(?:ure)?:\/\/([^/]+)\/(.+)$/i);
  if (azMatch) return { container: azMatch[1], path: azMatch[2] };
  return null;
}

function readEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function parseConnectionString(connectionString: string): { accountName?: string; accountKey?: string } {
  const parts = new Map<string, string>();
  for (const part of connectionString.split(';')) {
    const index = part.indexOf('=');
    if (index > 0) parts.set(part.slice(0, index), part.slice(index + 1));
  }
  return { accountName: parts.get('AccountName'), accountKey: parts.get('AccountKey') };
}

function safeContainerName(bucket: string): string {
  const normalized = bucket.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(normalized) || normalized.includes('--')) {
    throw new Error(`Unsafe Azure Blob container name: ${bucket}`);
  }
  return normalized;
}

function storageConfig() {
  const connectionString = readEnv([
    'DATA_PLANE_OBJECT_STORE_CONNECTION_STRING',
    'AZURE_OBJECT_STORAGE_CONNECTION_STRING',
    'AZURE_STORAGE_CONNECTION_STRING',
  ]);
  const parsed = connectionString ? parseConnectionString(connectionString) : {};
  const accountName = readEnv([
    'DATA_PLANE_OBJECT_STORE_ACCOUNT',
    'AZURE_OBJECT_STORAGE_ACCOUNT_NAME',
    'AZURE_STORAGE_ACCOUNT_NAME',
  ]) ?? parsed.accountName;
  const accountKey = readEnv([
    'DATA_PLANE_OBJECT_STORE_ACCOUNT_KEY',
    'AZURE_OBJECT_STORAGE_ACCOUNT_KEY',
    'AZURE_STORAGE_ACCOUNT_KEY',
  ]) ?? parsed.accountKey;
  const sharedContainer = readEnv([
    'DATA_PLANE_OBJECT_STORE_CONTAINER',
    'AZURE_OBJECT_STORAGE_CONTAINER',
  ]);
  return { accountName, accountKey, connectionString, sharedContainer };
}

function resolveBlobTarget(row: SourceArtifactRow): BlobTarget | null {
  const parsed = parseBlobUri(row.blob_uri);
  const logicalContainer = row.blob_container || parsed?.container;
  const logicalPath = row.blob_path || parsed?.path;
  if (!logicalContainer || !logicalPath) return null;

  const cfg = storageConfig();
  const cleanPath = logicalPath.replace(/^\/+/, '');
  const bucket = safeContainerName(logicalContainer);
  const physicalContainer = cfg.sharedContainer ? safeContainerName(cfg.sharedContainer) : bucket;
  const physicalPath = cfg.sharedContainer ? `${bucket}/${cleanPath}` : cleanPath;
  return {
    artifactId: row.id,
    logicalContainer,
    logicalPath: cleanPath,
    physicalContainer,
    physicalPath,
    originalName: row.original_name,
  };
}

async function archiveEvents(
  client: Client,
  args: Args,
  columns: TableColumns,
  events: SourceEventRow[],
): Promise<{ archivedEvents: number; activityRows: number }> {
  const eventIds = events.map((event) => event.id);
  if (eventIds.length === 0) return { archivedEvents: 0, activityRows: 0 };

  await client.query('begin');
  try {
    const archived = await client.query(
      `update public.source_events
          set lifecycle_state = 'archived',
              updated_at = now()
        where id = any($1::uuid[])
          and client_key = any($2::text[])
          and lower(coalesce(lifecycle_state, '')) <> 'archived'`,
      [eventIds, args.tenantKeys],
    );

    let activityRows = 0;
    if (hasTable(columns, 'source_event_activity')) {
      const detail = {
        reason: args.reason,
        operator: args.operator,
        script: 'scripts/ops/source-open-event-cleanup.ts',
        scopeBoundary: 'source_events.lifecycle_state only; dependent rows and blob objects preserved',
      };
      for (const event of events) {
        await client.query(
          `insert into public.source_event_activity
             (event_id, client_key, actor_user_id, action_type, action_label, details, occurred_at)
           values ($1::uuid, $2, $3, 'operator_archive', 'Operator archived Source event', $4::jsonb, now())`,
          [event.id, event.client_key, args.operator, JSON.stringify(detail)],
        );
        activityRows += 1;
      }
    }

    await client.query('commit');
    return {
      archivedEvents: archived.rowCount ?? 0,
      activityRows,
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(filePath: string, rows: Array<Record<string, unknown>>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(fullPath));
    else if (entry.isFile()) out.push(fullPath);
  }
  return out.sort();
}

function writeChecksumManifest(outDir: string): void {
  const manifestPath = path.join(outDir, 'sha256-manifest.txt');
  const rows = listFilesRecursive(outDir)
    .filter((filePath) => filePath !== manifestPath)
    .map((filePath) => `${sha256File(filePath)}  ${path.relative(outDir, filePath)}`);
  fs.writeFileSync(manifestPath, `${rows.join('\n')}\n`);
}

function emitProofBundle(outDir: string): void {
  const tgz = path.join(os.tmpdir(), `source-open-event-cleanup-proof-${stamp()}.tgz`);
  const result = spawnSync('tar', ['-czf', tgz, '-C', outDir, '.'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(`proof bundle tar failed: ${result.stderr || result.stdout || result.status}`);
  }
  const payload = fs.readFileSync(tgz).toString('base64');
  console.log('__SEMANTIC2_PROOF_TGZ_BEGIN__');
  console.log(payload);
  console.log('__SEMANTIC2_PROOF_TGZ_END__');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.apply && args.confirm !== CONFIRM_TOKEN) {
    throw new Error(`Apply requires --confirm ${CONFIRM_TOKEN}`);
  }

  fs.mkdirSync(args.outDir, { recursive: true });
  const client = new Client({
    connectionString: requireDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let summary: Record<string, unknown> = {};
  try {
    const columns = await loadTableColumns(client);
    if (!hasTable(columns, 'source_events') || !hasColumn(columns, 'source_events', 'lifecycle_state')) {
      throw new Error('Archive mechanism unavailable: public.source_events.lifecycle_state was not found.');
    }
    const events = await listCandidateEvents(client, args);
    const eventIds = events.map((event) => event.id);
    const artifacts = await listArtifacts(client, columns, args.tenantKeys, eventIds);
    const blobTargets = artifacts.map(resolveBlobTarget).filter((value): value is BlobTarget => Boolean(value));
    const relatedCounts = await countRelatedRows(client, columns, args.tenantKeys, eventIds);
    const lifecycleCountsBefore = await countLifecycleStates(client, args.tenantKeys);
    const relatedRows = await loadRelatedRows(client, columns, eventIds);

    writeJson(path.join(args.outDir, 'backup', 'source_events.json'), events);
    writeJson(path.join(args.outDir, 'backup', 'source_artifacts.json'), artifacts);
    for (const [table, rows] of Object.entries(relatedRows)) {
      writeJson(path.join(args.outDir, 'backup', `${table}.json`), rows);
    }
    writeJson(path.join(args.outDir, 'candidate-events.json'), events);
    writeCsv(path.join(args.outDir, 'candidate-events.csv'), events);
    writeJson(path.join(args.outDir, 'candidate-artifacts.json'), artifacts);
    writeCsv(path.join(args.outDir, 'candidate-artifacts.csv'), artifacts as Array<Record<string, unknown>>);
    writeJson(path.join(args.outDir, 'candidate-blob-targets.json'), blobTargets);
    writeCsv(path.join(args.outDir, 'candidate-blob-targets.csv'), blobTargets);
    writeJson(path.join(args.outDir, 'related-counts.json'), relatedCounts);
    writeJson(path.join(args.outDir, 'lifecycle-counts-before.json'), lifecycleCountsBefore);

    const applyResult = args.apply
      ? await archiveEvents(client, args, columns, events)
      : { archivedEvents: 0, activityRows: 0 };

    const postEvents = await listCandidateEvents(client, args);
    const postArtifacts = await listArtifacts(client, columns, args.tenantKeys, postEvents.map((event) => event.id));
    const lifecycleCountsAfter = await countLifecycleStates(client, args.tenantKeys);
    writeJson(path.join(args.outDir, 'lifecycle-counts-after.json'), lifecycleCountsAfter);

    summary = {
      status: 'succeeded',
      mode: args.apply ? 'apply' : 'dry-run',
      tenantKeys: args.tenantKeys,
      includeCompleted: args.includeCompleted,
      operator: args.operator,
      reason: args.reason,
      scopeBoundary: {
        archiveMechanism: 'public.source_events.lifecycle_state = archived',
        sourceEventsArchived: args.apply,
        artifactRowsDeletedOrSoftDeleted: false,
        blobObjectsDeleted: false,
        contractVendorApplicationOrContextTablesTouched: false,
      },
      candidates: {
        openEvents: events.length,
        artifacts: artifacts.length,
        blobTargets: blobTargets.length,
        relatedCounts,
      },
      beforeReadback: {
        lifecycleCounts: lifecycleCountsBefore,
      },
      applied: applyResult,
      blobDelete: { attempted: 0, deleted: 0, policy: 'not_supported_by_archive_only_script' },
      postReadback: {
        openEvents: postEvents.length,
        artifactsStillLinkedToOpenEvents: postArtifacts.length,
        lifecycleCounts: lifecycleCountsAfter,
      },
      outDir: args.outDir,
    };
    writeJson(path.join(args.outDir, 'summary.json'), summary);
    writeChecksumManifest(args.outDir);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end();
  }

  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

main().catch((error) => {
  console.error('[source-open-event-cleanup] failed', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
