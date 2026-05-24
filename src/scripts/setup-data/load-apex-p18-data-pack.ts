import fs from 'node:fs';
import path from 'node:path';

type SourceFileRow = {
  source_file_id: string;
  source_system: string;
  source_file: string;
  source_path: string;
  source_type: string;
  display_name: string;
  target_table: string;
  feature: string;
  row_count: string;
  confidence: string;
  freshness_status: string;
};

type CorpusChunk = {
  chunk_id: string;
  tenant_key: string;
  source_file_id: string;
  source_segment_id: string;
  source_record_id: string;
  content: string;
  confidence: number;
  freshness_status: string;
  evidence_pointer: string;
};

type Args = {
  apply: boolean;
  packRoot: string;
};

type DbRow = Record<string, unknown>;

type MaybeSingleResult = Promise<{ data?: { id?: unknown } | null; error?: { message: string } | null }>;
type QueryBuilder = {
  eq: (column: string, value: unknown) => QueryBuilder;
  in: (column: string, values: unknown[]) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: () => MaybeSingleResult;
  then: PromiseLike<{ data?: unknown; error?: { message: string } | null }>['then'];
};
type SupabaseClient = {
  from: (table: string) => {
    select: (...args: unknown[]) => QueryBuilder;
    upsert: (rows: DbRow[], options: { onConflict: string }) => Promise<{ error?: { message: string } | null }>;
  };
};

const TENANT_KEY = 'apex-retail';
const RUN_KEY = 'p18-apex-synthetic-v1-2';
const IMPORTED_BY = 'packet-18-bootstrap';

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const sourceEq = args.find((arg) => arg.startsWith('--source='));
  const sourceIdx = args.indexOf('--source');
  const packRoot = sourceEq
    ? sourceEq.split('=')[1] ?? ''
    : sourceIdx >= 0
      ? args[sourceIdx + 1]
      : 'datasets/apex-retail-synthetic-v1';
  return {
    apply: args.includes('--apply'),
    packRoot: path.resolve(process.cwd(), packRoot),
  };
}

async function getClient(): Promise<SupabaseClient> {
  const { config: loadEnv } = await import('dotenv');
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to apply Packet 18 data pack.');
  }
  const supabaseModule = await import('@supabase/supabase-js') as unknown as {
    createClient: (url: string, key: string, options: Record<string, unknown>) => SupabaseClient;
  };
  return supabaseModule.createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readCsv<T extends Record<string, string>>(filePath: string): T[] {
  const [headerLine, ...lines] = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines.filter(Boolean).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])) as T;
  });
}

function readJsonl<T>(filePath: string): T[] {
  return fs.readFileSync(filePath, 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as T;
      } catch (error) {
        throw new Error(`${filePath} line ${index + 1} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

function tokenCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function findClientIdByColumn(client: SupabaseClient, column: string, values: string[]): Promise<string | null> {
  for (const value of values) {
    const existing = await client.from('clients').select('id').eq(column, value).limit(1).maybeSingle();
    if (existing.error) throw new Error(`Client lookup by ${column} failed: ${existing.error.message}`);
    if (existing.data?.id) return String(existing.data.id);
  }
  return null;
}

async function ensureApexClientId(client: SupabaseClient): Promise<string> {
  const byTenant = await findClientIdByColumn(client, 'tenant_key', ['apex-retail', 'apexretail']);
  if (byTenant) return byTenant;
  const bySlug = await findClientIdByColumn(client, 'slug', ['apex-retail', 'apexretail']);
  if (bySlug) return bySlug;
  const byName = await findClientIdByColumn(client, 'name', ['Apex Retail', 'Apex Retail Group']);
  if (byName) return byName;
  const byLegalName = await findClientIdByColumn(client, 'legal_name', ['Apex Retail', 'Apex Retail Group']);
  if (byLegalName) return byLegalName;
  throw new Error('Apex client row not found. Run P18 truth reconciliation first.');
}

async function upsertBatch(client: SupabaseClient, table: string, rows: DbRow[], onConflict: string): Promise<number> {
  const batchSize = 250;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  return rows.length;
}

function buildSourceFileRows(rows: SourceFileRow[], clientId: string, now: string): DbRow[] {
  return rows.map((row) => ({
    client_id: clientId,
    tenant_key: TENANT_KEY,
    source_file_id: row.source_file_id,
    source_system: row.source_system,
    source_file: row.source_file,
    source_path: row.source_path,
    workbook_name: row.source_file.endsWith('.xlsx') ? row.source_file : null,
    sheet_names: row.source_file.endsWith('.xlsx') ? ['Portfolio Rollup', 'Vendor Spend'] : [],
    file_hash: null,
    row_count: Number(row.row_count || 1),
    imported_by: IMPORTED_BY,
    last_synced_at: now,
    last_validated_at: '2026-05-23',
    confidence: Number(row.confidence || 0.9),
    freshness_status: row.freshness_status || 'fresh',
    evidence_pointer: `datasets/apex-retail-synthetic-v1/${row.source_path}`,
    metadata: {
      run_key: RUN_KEY,
      feature: row.feature,
      target_table: row.target_table,
      source_type: row.source_type,
      display_name: row.display_name,
      synthetic_fixture: true,
      watermark: 'AbarVa Synthetic - Apex Retail v1',
    },
    updated_at: now,
  }));
}

function buildChunkRows(chunks: CorpusChunk[], sourceFilesById: Map<string, SourceFileRow>, clientId: string, now: string, existingEmbeddingStatuses: Map<string, string>): DbRow[] {
  return chunks.map((chunk, index) => {
    const source = sourceFilesById.get(chunk.source_file_id);
    if (!source) throw new Error(`Chunk ${chunk.chunk_id} references unknown source_file_id ${chunk.source_file_id}`);
    return {
      client_id: clientId,
      tenant_key: TENANT_KEY,
      chunk_id: chunk.chunk_id,
      source_segment_id: chunk.source_segment_id,
      source_record_id: chunk.source_record_id,
      source_doc: source.source_file,
      source_path: source.source_path,
      chunk_index: index,
      chunk_text: chunk.content,
      token_count: tokenCount(chunk.content),
      embedding_status: existingEmbeddingStatuses.get(chunk.chunk_id) ?? 'pending',
      embedding_model: null,
      embedded_at: null,
      provenance: {
        run_key: RUN_KEY,
        source_file_id: chunk.source_file_id,
        evidence_pointer: chunk.evidence_pointer,
        imported_by: IMPORTED_BY,
      },
      chunk_metadata: {
        confidence: chunk.confidence,
        freshness_status: chunk.freshness_status,
        synthetic_fixture: true,
        source_feature: source.feature,
      },
      updated_at: now,
    };
  });
}

function buildRunRow(clientId: string, now: string, counts: { sourceFiles: number; chunks: number }): DbRow {
  return {
    client_id: clientId,
    tenant_key: TENANT_KEY,
    run_key: RUN_KEY,
    run_type: 'apply',
    status: 'completed',
    source_system: 'packet_18_apex_synthetic',
    source_record_id: RUN_KEY,
    source_file: 'datasets/apex-retail-synthetic-v1/manifest.yaml',
    owner: IMPORTED_BY,
    last_synced_at: now,
    last_validated_at: '2026-05-23',
    confidence: 0.92,
    freshness_status: 'fresh',
    evidence_pointer: 'datasets/apex-retail-synthetic-v1/99-verification/expected-corpus-load.json',
    source_root: 'datasets/apex-retail-synthetic-v1',
    workbook_count: 2,
    records_seen: counts.sourceFiles + counts.chunks,
    records_loaded: counts.sourceFiles + counts.chunks,
    quality_issues_created: 0,
    summary: {
      source_files: counts.sourceFiles,
      chunks: counts.chunks,
      contract_pdfs: 30,
      charter_pdfs: 10,
      static_pack_version: '1.2.0',
    },
    error_payload: {},
    started_at: now,
    completed_at: now,
    updated_at: now,
  };
}

async function fetchExistingEmbeddingStatuses(client: SupabaseClient, chunkIds: string[]): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  const batchSize = 250;
  for (let index = 0; index < chunkIds.length; index += batchSize) {
    const batch = chunkIds.slice(index, index + batchSize);
    const { data, error } = await client
      .from('enterprise_context_chunks')
      .select('chunk_id,embedding_status')
      .eq('tenant_key', TENANT_KEY)
      .in('chunk_id', batch) as { data?: { chunk_id?: unknown; embedding_status?: unknown }[] | null; error?: { message: string } | null };
    if (error) throw new Error(`enterprise_context_chunks status lookup failed: ${error.message}`);
    for (const row of data ?? []) {
      if (row.chunk_id && row.embedding_status) existing.set(String(row.chunk_id), String(row.embedding_status));
    }
  }
  return existing;
}

async function main() {
  const args = parseArgs();
  const sourceFilePath = path.join(args.packRoot, '13-context/enterprise-context-source-files.csv');
  const corpusPath = path.join(args.packRoot, '13-context/client-data-corpus.jsonl');
  const expectedPath = path.join(args.packRoot, '99-verification/expected-corpus-load.json');

  const sourceFiles = readCsv<SourceFileRow>(sourceFilePath);
  const chunks = readJsonl<CorpusChunk>(corpusPath);
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8')) as {
    enterprise_context_source_files: number;
    enterprise_context_chunks: number;
  };

  if (sourceFiles.length !== expected.enterprise_context_source_files) {
    throw new Error(`Expected ${expected.enterprise_context_source_files} source files, found ${sourceFiles.length}`);
  }
  if (chunks.length !== expected.enterprise_context_chunks) {
    throw new Error(`Expected ${expected.enterprise_context_chunks} chunks, found ${chunks.length}`);
  }

  const sourceFilesById = new Map(sourceFiles.map((row) => [row.source_file_id, row]));
  for (const chunk of chunks) {
    if (!sourceFilesById.has(chunk.source_file_id)) {
      throw new Error(`Chunk ${chunk.chunk_id} references unknown source_file_id ${chunk.source_file_id}`);
    }
  }

  if (!args.apply) {
    console.log(JSON.stringify({
      ok: true,
      mode: 'dry-run',
      tenantKey: TENANT_KEY,
      packRoot: args.packRoot,
      sourceFiles: sourceFiles.length,
      chunks: chunks.length,
      applyCommand: 'npm run db:load:p18-apex-pack',
    }, null, 2));
    return;
  }

  const client = await getClient();
  const clientId = await ensureApexClientId(client);
  const now = new Date().toISOString();
  const sourceRows = buildSourceFileRows(sourceFiles, clientId, now);
  const existingEmbeddingStatuses = await fetchExistingEmbeddingStatuses(client, chunks.map((chunk) => chunk.chunk_id));
  const chunkRows = buildChunkRows(chunks, sourceFilesById, clientId, now, existingEmbeddingStatuses);
  const runRow = buildRunRow(clientId, now, { sourceFiles: sourceRows.length, chunks: chunkRows.length });

  const sourceFileCount = await upsertBatch(client, 'enterprise_context_source_files', sourceRows, 'tenant_key,source_file_id');
  const chunkCount = await upsertBatch(client, 'enterprise_context_chunks', chunkRows, 'tenant_key,chunk_id');
  await upsertBatch(client, 'enterprise_context_template_runs', [runRow], 'tenant_key,run_key');

  console.log(JSON.stringify({
    ok: true,
    mode: 'apply',
    tenantKey: TENANT_KEY,
    clientId,
    sourceFiles: sourceFileCount,
    chunks: chunkCount,
    runKey: RUN_KEY,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
