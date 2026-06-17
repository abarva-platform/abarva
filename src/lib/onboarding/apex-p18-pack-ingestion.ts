import JSZip from 'jszip';

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

type DbRow = Record<string, unknown>;

type SupabaseResult<T = unknown> = Promise<{ data?: T | null; error?: { message: string } | null }>;
type QueryBuilder<T = unknown> = {
  eq: (column: string, value: unknown) => QueryBuilder<T>;
  in: (column: string, values: unknown[]) => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  maybeSingle: () => SupabaseResult<T>;
  single: () => SupabaseResult<T>;
  then: PromiseLike<{ data?: T | null; error?: { message: string } | null }>['then'];
};
export type OnboardingSupabaseClient = {
  from: (table: string) => {
    select: (...args: unknown[]) => QueryBuilder;
    insert: (rows: DbRow[]) => { select: (...args: unknown[]) => { single: () => SupabaseResult<DbRow> } };
    update: (row: DbRow) => { eq: (column: string, value: unknown) => SupabaseResult<DbRow[]> };
    upsert: (rows: DbRow[], options: { onConflict: string }) => SupabaseResult;
  };
};

export type ApexP18ParsedPack = {
  tenantKey: 'apex-retail';
  packKind: 'apex-retail-synthetic-v1';
  packVersion: string;
  sourceFiles: SourceFileRow[];
  chunks: CorpusChunk[];
  expected: {
    enterprise_context_source_files: number;
    enterprise_context_chunks: number;
    contract_pdfs?: number;
    charter_pdfs?: number;
  };
  validationSummary: {
    valid: boolean;
    warnings: string[];
    errors: string[];
    requiredFilesPresent: string[];
  };
  rowCounts: {
    sourceFiles: number;
    chunks: number;
    contractPdfs: number;
    charterPdfs: number;
  };
};

export function asOnboardingSupabaseClient(client: unknown): OnboardingSupabaseClient {
  return client as OnboardingSupabaseClient;
}

export type OnboardingSession = {
  id: string;
  tenantKey: string;
  clientId: string | null;
  uploadedBy: string | null;
  originalFilename: string;
  packKind: string;
  packVersion: string | null;
  status: string;
  rowCounts: Record<string, unknown>;
  validationSummary: Record<string, unknown>;
  commitSummary: Record<string, unknown>;
  errorReport: unknown[];
  createdAt: string;
  updatedAt: string;
  committedAt: string | null;
};

const TENANT_KEY = 'apex-retail' as const;
const RUN_KEY = 'p18-apex-synthetic-v1-2';
const IMPORTED_BY = 'packet-18-onboarding';

function parseCsv<T extends Record<string, string>>(text: string): T[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }

  const [headers, ...records] = rows;
  if (!headers?.length) return [];
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])) as T,
  );
}

function parseJsonl<T>(text: string): T[] {
  return text.trim().split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line) as T;
    } catch (error) {
      throw new Error(`JSONL line ${index + 1} is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function tokenCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function normalizeZipPath(path: string): string {
  return path.replace(/^\/+/, '').replace(/^datasets\/apex-retail-synthetic-v1\//, '').replace(/^apex-retail-synthetic-v1\//, '');
}

async function zipText(zip: JSZip, relativePath: string): Promise<string> {
  const file = Object.values(zip.files).find((entry) => normalizeZipPath(entry.name) === relativePath);
  if (!file || file.dir) throw new Error(`Missing required pack file ${relativePath}`);
  return file.async('text');
}

function countZipFiles(zip: JSZip, prefix: string, extension: string): number {
  return Object.values(zip.files).filter((entry) => !entry.dir && normalizeZipPath(entry.name).startsWith(prefix) && entry.name.endsWith(extension)).length;
}

export async function parseApexP18Zip(bytes: ArrayBuffer): Promise<ApexP18ParsedPack> {
  const zip = await JSZip.loadAsync(bytes);
  const required = [
    'manifest.yaml',
    '13-context/enterprise-context-source-files.csv',
    '13-context/client-data-corpus.jsonl',
    '99-verification/expected-corpus-load.json',
  ];
  const warnings: string[] = [];
  const errors: string[] = [];

  const [manifest, sourceFileText, chunkText, expectedText] = await Promise.all(required.map((file) => zipText(zip, file)));
  const sourceFiles = parseCsv<SourceFileRow>(sourceFileText);
  const chunks = parseJsonl<CorpusChunk>(chunkText);
  const expected = JSON.parse(expectedText) as ApexP18ParsedPack['expected'];
  const sourceFileIds = new Set(sourceFiles.map((row) => row.source_file_id));
  const contractPdfs = countZipFiles(zip, '04-vendors/contract-pdfs/', '.pdf');
  const charterPdfs = countZipFiles(zip, '09-charters/charter-pdfs/', '.pdf');

  if (!manifest.includes('apex-retail')) warnings.push('manifest.yaml does not explicitly include apex-retail');
  if (sourceFiles.length !== expected.enterprise_context_source_files) {
    errors.push(`source file count ${sourceFiles.length} does not match expected ${expected.enterprise_context_source_files}`);
  }
  if (chunks.length !== expected.enterprise_context_chunks) {
    errors.push(`chunk count ${chunks.length} does not match expected ${expected.enterprise_context_chunks}`);
  }
  for (const chunk of chunks) {
    if (chunk.tenant_key !== TENANT_KEY) errors.push(`chunk ${chunk.chunk_id} has tenant_key ${chunk.tenant_key}`);
    if (!sourceFileIds.has(chunk.source_file_id)) errors.push(`chunk ${chunk.chunk_id} references unknown source_file_id ${chunk.source_file_id}`);
  }
  if (expected.contract_pdfs && contractPdfs !== expected.contract_pdfs) {
    warnings.push(`contract PDF count ${contractPdfs} does not match expected ${expected.contract_pdfs}`);
  }
  if (expected.charter_pdfs && charterPdfs !== expected.charter_pdfs) {
    warnings.push(`charter PDF count ${charterPdfs} does not match expected ${expected.charter_pdfs}`);
  }

  return {
    tenantKey: TENANT_KEY,
    packKind: 'apex-retail-synthetic-v1',
    packVersion: '1.2.0',
    sourceFiles,
    chunks,
    expected,
    rowCounts: {
      sourceFiles: sourceFiles.length,
      chunks: chunks.length,
      contractPdfs,
      charterPdfs,
    },
    validationSummary: {
      valid: errors.length === 0,
      warnings,
      errors,
      requiredFilesPresent: required,
    },
  };
}

async function findClientIdByColumn(client: OnboardingSupabaseClient, column: string, values: string[]): Promise<string | null> {
  for (const value of values) {
    const existing = await client.from('clients').select('id').eq(column, value).limit(1).maybeSingle();
    if (existing.error) throw new Error(`Client lookup by ${column} failed: ${existing.error.message}`);
    const data = existing.data as { id?: unknown } | null | undefined;
    if (data?.id) return String(data.id);
  }
  return null;
}

export async function resolveApexClientId(client: OnboardingSupabaseClient): Promise<string | null> {
  return (
    await findClientIdByColumn(client, 'tenant_key', ['apex-retail', 'apexretail']) ??
    await findClientIdByColumn(client, 'slug', ['apex-retail', 'apexretail']) ??
    await findClientIdByColumn(client, 'name', ['Apex Retail', 'Apex Retail Group']) ??
    await findClientIdByColumn(client, 'legal_name', ['Apex Retail', 'Apex Retail Group'])
  );
}

function mapSession(row: DbRow): OnboardingSession {
  return {
    id: String(row.id),
    tenantKey: String(row.tenant_key),
    clientId: row.client_id ? String(row.client_id) : null,
    uploadedBy: row.uploaded_by ? String(row.uploaded_by) : null,
    originalFilename: String(row.original_filename),
    packKind: String(row.pack_kind),
    packVersion: row.pack_version ? String(row.pack_version) : null,
    status: String(row.status),
    rowCounts: (row.row_counts as Record<string, unknown>) ?? {},
    validationSummary: (row.validation_summary as Record<string, unknown>) ?? {},
    commitSummary: (row.commit_summary as Record<string, unknown>) ?? {},
    errorReport: Array.isArray(row.error_report) ? row.error_report : [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    committedAt: row.committed_at ? String(row.committed_at) : null,
  };
}

export async function createOnboardingSession(params: {
  client: OnboardingSupabaseClient;
  parsed: ApexP18ParsedPack;
  originalFilename: string;
  uploadedBy: string;
  clientId?: string | null;
}): Promise<OnboardingSession> {
  const status = params.parsed.validationSummary.valid ? 'validated' : 'validation_failed';
  const { data, error } = await params.client
    .from('onboarding_upload_sessions')
    .insert([{
      tenant_key: params.parsed.tenantKey,
      client_id: params.clientId ?? null,
      uploaded_by: params.uploadedBy,
      original_filename: params.originalFilename,
      pack_kind: params.parsed.packKind,
      pack_version: params.parsed.packVersion,
      status,
      row_counts: params.parsed.rowCounts,
      validation_summary: params.parsed.validationSummary,
      parsed_payload: {
        sourceFiles: params.parsed.sourceFiles,
        chunks: params.parsed.chunks,
      },
      error_report: params.parsed.validationSummary.errors,
    }])
    .select('*')
    .single();
  if (error) throw new Error(`onboarding session insert failed: ${error.message}`);
  return mapSession(data as DbRow);
}

export async function getOnboardingSession(client: OnboardingSupabaseClient, sessionId: string): Promise<OnboardingSession | null> {
  const { data, error } = await client.from('onboarding_upload_sessions').select('*').eq('id', sessionId).limit(1).maybeSingle();
  if (error) throw new Error(`onboarding session lookup failed: ${error.message}`);
  return data ? mapSession(data as DbRow) : null;
}

async function fetchSessionPayload(client: OnboardingSupabaseClient, sessionId: string): Promise<{ session: OnboardingSession; sourceFiles: SourceFileRow[]; chunks: CorpusChunk[] }> {
  const { data, error } = await client.from('onboarding_upload_sessions').select('*').eq('id', sessionId).limit(1).maybeSingle();
  if (error) throw new Error(`onboarding session lookup failed: ${error.message}`);
  if (!data) throw new Error('onboarding session not found');
  const row = data as DbRow;
  const payload = row.parsed_payload as { sourceFiles?: SourceFileRow[]; chunks?: CorpusChunk[] } | null;
  return {
    session: mapSession(row),
    sourceFiles: payload?.sourceFiles ?? [],
    chunks: payload?.chunks ?? [],
  };
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
      uploaded_via: 'admin_onboarding',
    },
    updated_at: now,
  }));
}

function buildChunkRows(chunks: CorpusChunk[], sourceFilesById: Map<string, SourceFileRow>, clientId: string, now: string): DbRow[] {
  return chunks.map((chunk, index) => {
    const source = sourceFilesById.get(chunk.source_file_id);
    if (!source) throw new Error(`Chunk ${chunk.chunk_id} references unknown source_file_id ${chunk.source_file_id}`);
    return {
      client_id: clientId,
      tenant_key: TENANT_KEY,
      chunk_id: chunk.chunk_id,
      source_system: source.source_system,
      source_segment_id: chunk.source_segment_id,
      source_record_id: chunk.source_record_id,
      source_doc: source.source_file,
      source_path: source.source_path,
      chunk_index: index,
      chunk_text: chunk.content,
      token_count: tokenCount(chunk.content),
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
        uploaded_via: 'admin_onboarding',
      },
      updated_at: now,
    };
  });
}

async function fetchExistingEmbeddingStatuses(client: OnboardingSupabaseClient, chunkIds: string[]): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  const batchSize = 250;
  for (let index = 0; index < chunkIds.length; index += batchSize) {
    const batch = chunkIds.slice(index, index + batchSize);
    const { data, error } = await client
      .from('enterprise_context_chunks')
      .select('chunk_id,embedding_status')
      .eq('tenant_key', TENANT_KEY)
      .in('chunk_id', batch);
    if (error) throw new Error(`enterprise_context_chunks status lookup failed: ${error.message}`);
    for (const row of (data as { chunk_id?: unknown; embedding_status?: unknown }[] | null) ?? []) {
      if (row.chunk_id && row.embedding_status) existing.set(String(row.chunk_id), String(row.embedding_status));
    }
  }
  return existing;
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
    source_file: 'onboarding_upload_sessions',
    owner: IMPORTED_BY,
    last_synced_at: now,
    last_validated_at: '2026-05-23',
    confidence: 0.92,
    freshness_status: 'fresh',
    evidence_pointer: 'onboarding_upload_sessions',
    source_root: 'datasets/apex-retail-synthetic-v1',
    workbook_count: 2,
    records_seen: counts.sourceFiles + counts.chunks,
    records_loaded: counts.sourceFiles + counts.chunks,
    quality_issues_created: 0,
    summary: {
      source_files: counts.sourceFiles,
      chunks: counts.chunks,
      static_pack_version: '1.2.0',
      uploaded_via: 'admin_onboarding',
    },
    error_payload: {},
    started_at: now,
    completed_at: now,
    updated_at: now,
  };
}

async function upsertBatch(client: OnboardingSupabaseClient, table: string, rows: DbRow[], onConflict: string): Promise<number> {
  const batchSize = 250;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  return rows.length;
}

export async function commitOnboardingSession(client: OnboardingSupabaseClient, sessionId: string): Promise<OnboardingSession> {
  const { session, sourceFiles, chunks } = await fetchSessionPayload(client, sessionId);
  if (session.status === 'committed') return session;
  if (session.status !== 'validated') throw new Error(`session status ${session.status} cannot be committed`);

  await client.from('onboarding_upload_sessions').update({ status: 'committing', updated_at: new Date().toISOString() }).eq('id', sessionId);
  try {
    const clientId = session.clientId ?? await resolveApexClientId(client);
    if (!clientId) throw new Error('Apex client row not found. Run P18 truth reconciliation first.');
    const now = new Date().toISOString();
    const sourceFilesById = new Map(sourceFiles.map((row) => [row.source_file_id, row]));
    const sourceRows = buildSourceFileRows(sourceFiles, clientId, now);
    const existingEmbeddingStatuses = await fetchExistingEmbeddingStatuses(client, chunks.map((chunk) => chunk.chunk_id));
    const chunkRows = buildChunkRows(chunks, sourceFilesById, clientId, now).map((row) => ({
      ...row,
      embedding_status: existingEmbeddingStatuses.get(String(row.chunk_id)) ?? 'pending',
    }));
    const runRow = buildRunRow(clientId, now, { sourceFiles: sourceRows.length, chunks: chunkRows.length });

    const sourceFileCount = await upsertBatch(client, 'enterprise_context_source_files', sourceRows, 'tenant_key,source_file_id');
    const chunkCount = await upsertBatch(client, 'enterprise_context_chunks', chunkRows, 'tenant_key,chunk_id');
    await upsertBatch(client, 'enterprise_context_template_runs', [runRow], 'tenant_key,run_key');

    const commitSummary = {
      sourceFiles: sourceFileCount,
      chunks: chunkCount,
      runKey: RUN_KEY,
      embeddingStatus: 'preserved_existing_or_pending_new',
    };
    const { error } = await client
      .from('onboarding_upload_sessions')
      .update({
        client_id: clientId,
        status: 'committed',
        commit_summary: commitSummary,
        committed_at: now,
        updated_at: now,
      })
      .eq('id', sessionId);
    if (error) throw new Error(`onboarding session commit update failed: ${error.message}`);
    const updated = await getOnboardingSession(client, sessionId);
    if (!updated) throw new Error('onboarding session disappeared after commit');
    return updated;
  } catch (error) {
    await client
      .from('onboarding_upload_sessions')
      .update({
        status: 'commit_failed',
        error_report: [error instanceof Error ? error.message : String(error)],
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    throw error;
  }
}
