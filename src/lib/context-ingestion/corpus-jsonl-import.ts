import 'server-only';

import crypto from 'node:crypto';

import { getAzureWriteFluentClient, type PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import type { PilotUploadAttestation } from './upload-attestation';

type JsonRecord = Record<string, unknown>;

export type CorpusImportCommitMode = 'validate_only' | 'commit';

export interface CorpusJsonlImportInput {
  clientId: string;
  tenantKey: string;
  uploadedBy: string;
  fileName: string;
  jsonlText: string;
  attestation?: PilotUploadAttestation;
  commitMode?: CorpusImportCommitMode;
  defaultVertical?: string | null;
  uploadedAt?: string;
  db?: PostgresCompatClient;
}

export interface ParsedCorpusPattern extends JsonRecord {
  id?: string;
  code?: string;
  name?: string;
  title?: string;
  description?: string;
  summary?: string;
  embedding_text?: string;
  vertical?: string;
  pattern_type?: string;
  category?: string;
  sub_category?: string;
  subcategory?: string;
  domain?: string;
  office_category?: string;
  tags?: unknown;
  keywords?: unknown;
  vocabulary?: unknown;
  related_patterns?: unknown;
  source_count?: number;
  confidence?: unknown;
  quality_tier?: string;
  failure_rate_pct?: number;
  doctrine?: string;
  triggers?: unknown;
  applies_when?: string;
  appliesWhen?: string;
  does_not_apply_when?: string;
  doesNotApplyWhen?: string;
  decision_owner?: string;
  decisionOwner?: string;
  supporting_evidence?: unknown;
  supportingEvidence?: unknown;
  anti_patterns?: unknown;
  antiPatterns?: unknown;
  failure_modes?: unknown;
  failureModes?: unknown;
  decision_artifacts?: unknown;
  decisionArtifacts?: unknown;
  graph_relationships?: unknown;
  graphRelationships?: unknown;
  personas?: unknown;
  specificity?: string;
}

export interface CorpusImportValidationIssue {
  line: number;
  field: string;
  message: string;
}

export interface PreparedCorpusImport {
  importId: string;
  fileName: string;
  rowsParsed: number;
  patternsPrepared: number;
  edgesPrepared: number;
  verticals: string[];
  warnings: CorpusImportValidationIssue[];
  errors: CorpusImportValidationIssue[];
  patternRows: JsonRecord[];
  edgeRows: JsonRecord[];
}

export interface CorpusJsonlImportResult extends Omit<PreparedCorpusImport, 'patternRows' | 'edgeRows'> {
  ok: boolean;
  mode: CorpusImportCommitMode;
  persistence: {
    status: 'validation_only' | 'inserted' | 'skipped_no_database_url';
    patternsUpserted: number;
    edgesUpserted: number;
    ingestionRunRecorded: boolean;
    detail: string;
  };
}

const MAX_PATTERNS = 1_000;

function databaseConfigured(): boolean {
  return Boolean(process.env.ABARVA_AZURE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim());
}

function deterministicUuid(input: string): string {
  const hex = crypto.createHash('sha1').update(input).digest('hex').slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function compactTimestamp(value: string): string {
  return value.replace(/[^0-9a-z]/gi, '').slice(0, 15);
}

function safeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'corpus';
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(String).map((item) => item.trim()).filter(Boolean);
  return values.length > 0 ? [...new Set(values)] : undefined;
}

function optionalObjectArray(value: unknown): JsonRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((item): item is JsonRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  return values.length > 0 ? values : undefined;
}

function confidenceToNumeric(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'high') return 90;
  if (normalized === 'medium') return 70;
  if (normalized === 'low') return 45;
  return 75;
}

function normalizeTags(pattern: ParsedCorpusPattern): string[] {
  return [
    ...(optionalStringArray(pattern.tags) ?? []),
    ...(optionalStringArray(pattern.keywords) ?? []),
    ...(optionalStringArray(pattern.vocabulary) ?? []),
    optionalString(pattern.domain),
    optionalString(pattern.category),
    optionalString(pattern.sub_category ?? pattern.subcategory),
  ].filter((item): item is string => Boolean(item));
}

function textForPattern(pattern: ParsedCorpusPattern): string {
  return (
    optionalString(pattern.description) ??
    optionalString(pattern.summary) ??
    optionalString(pattern.embedding_text) ??
    ''
  );
}

function buildDoctrineContext(pattern: ParsedCorpusPattern): JsonRecord {
  const entries: Array<[string, unknown]> = [
    ['doctrine', optionalString(pattern.doctrine)],
    ['triggers', optionalStringArray(pattern.triggers)],
    ['applies_when', optionalString(pattern.applies_when ?? pattern.appliesWhen)],
    ['does_not_apply_when', optionalString(pattern.does_not_apply_when ?? pattern.doesNotApplyWhen)],
    ['decision_owner', optionalString(pattern.decision_owner ?? pattern.decisionOwner)],
    ['supporting_evidence', optionalObjectArray(pattern.supporting_evidence ?? pattern.supportingEvidence)],
    ['anti_patterns', optionalStringArray(pattern.anti_patterns ?? pattern.antiPatterns)],
    ['failure_modes', optionalStringArray(pattern.failure_modes ?? pattern.failureModes)],
    ['decision_artifacts', optionalStringArray(pattern.decision_artifacts ?? pattern.decisionArtifacts)],
    ['graph_relationships', optionalObjectArray(pattern.graph_relationships ?? pattern.graphRelationships)],
    ['personas', optionalStringArray(pattern.personas)],
    ['specificity', optionalString(pattern.specificity)],
    ['confidence', optionalString(pattern.confidence)],
    ['embedding_text', optionalString(pattern.embedding_text)],
    ['vocabulary', optionalStringArray(pattern.vocabulary)],
    ['tags', optionalStringArray(pattern.tags)],
    ['related_patterns', optionalStringArray(pattern.related_patterns)],
  ];
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

function parseJsonl(jsonlText: string): Array<{ line: number; pattern: ParsedCorpusPattern }> {
  const rows = jsonlText
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter((item) => item.text.length > 0);
  if (rows.length === 0) {
    throw new Error('corpus_jsonl_empty');
  }
  if (rows.length > MAX_PATTERNS) {
    throw new Error(`corpus_jsonl_too_many_rows: max ${MAX_PATTERNS}`);
  }
  return rows.map((row) => {
    try {
      const parsed = JSON.parse(row.text) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('line must be a JSON object');
      }
      return { line: row.line, pattern: parsed as ParsedCorpusPattern };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`corpus_jsonl_parse_failed line ${row.line}: ${message}`);
    }
  });
}

function relationTarget(relationship: JsonRecord): string | null {
  return optionalString(relationship.target_code) ??
    optionalString(relationship.target) ??
    optionalString(relationship.to_node_id) ??
    optionalString(relationship.to) ??
    null;
}

function relationType(relationship: JsonRecord): string {
  return optionalString(relationship.edge_type) ??
    optionalString(relationship.relation) ??
    optionalString(relationship.relationship) ??
    'related_to';
}

function relationWeight(relationship: JsonRecord): number {
  const raw = relationship.weight;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.min(1, raw));
  return 0.75;
}

export function prepareCorpusJsonlImport(input: CorpusJsonlImportInput): PreparedCorpusImport {
  const uploadedAt = input.uploadedAt ?? new Date().toISOString();
  const fileHash = crypto.createHash('sha256').update(input.jsonlText).digest('hex').slice(0, 12);
  const importId = [
    'corpus-jsonl',
    safeSlug(input.tenantKey),
    safeSlug(input.fileName),
    fileHash,
    compactTimestamp(uploadedAt),
  ].join(':');
  const parsed = parseJsonl(input.jsonlText);
  const errors: CorpusImportValidationIssue[] = [];
  const warnings: CorpusImportValidationIssue[] = [];
  const patternRows: JsonRecord[] = [];
  const edgeRows: JsonRecord[] = [];
  const verticals = new Set<string>();

  for (const { line, pattern } of parsed) {
    const code = optionalString(pattern.code ?? pattern.id);
    const name = optionalString(pattern.name ?? pattern.title);
    const description = textForPattern(pattern);
    if (!code) errors.push({ line, field: 'code', message: 'Pattern code or id is required.' });
    if (!name) errors.push({ line, field: 'name', message: 'Pattern name or title is required.' });
    if (!description) errors.push({ line, field: 'description', message: 'Description, summary, or embedding_text is required.' });
    if (!code || !name || !description) continue;

    const vertical = optionalString(pattern.vertical) ?? optionalString(input.defaultVertical) ?? 'healthcare_provider';
    verticals.add(vertical);
    const subCategory = optionalString(pattern.sub_category ?? pattern.subcategory ?? pattern.category ?? pattern.domain) ?? 'modernization';
    const officeCategory = optionalString(pattern.office_category) ?? 'middle_office';
    const tags = normalizeTags(pattern);
    const supportingEvidence = optionalObjectArray(pattern.supporting_evidence ?? pattern.supportingEvidence) ?? [];
    if (supportingEvidence.length === 0) {
      warnings.push({ line, field: 'supporting_evidence', message: 'No supporting evidence objects supplied.' });
    }

    const doctrineContext = buildDoctrineContext(pattern);
    const patternType = optionalString(pattern.pattern_type) ?? 'failure_pattern';
    const sourceCount =
      typeof pattern.source_count === 'number' && Number.isFinite(pattern.source_count)
        ? Math.max(1, Math.round(pattern.source_count))
        : Math.max(1, supportingEvidence.length);
    const confidence = confidenceToNumeric(pattern.confidence);
    const isActive = optionalString(pattern.quality_tier)?.toLowerCase() !== 'killed';

    patternRows.push({
      id: deterministicUuid(`${vertical}-genome-pattern:${code}`),
      pattern_type: patternType,
      vertical,
      sub_category: subCategory,
      data: {
        ...pattern,
        code,
        name,
        description,
        source_key: 'admin-corpus-import',
        loaded_by: input.uploadedBy,
        loaded_at: uploadedAt,
        import_id: importId,
        tenant_scope: 'global_corpus',
      },
      source_count: sourceCount,
      confidence,
      is_active: isActive,
      code,
      name,
      description,
      summary: optionalString(pattern.summary) ?? description,
      failure_rate_pct:
        typeof pattern.failure_rate_pct === 'number' && Number.isFinite(pattern.failure_rate_pct)
          ? pattern.failure_rate_pct
          : null,
      office_category: officeCategory,
      keywords: [...new Set(tags)],
      doctrine_context: doctrineContext,
    });

    for (const relationship of optionalObjectArray(pattern.graph_relationships ?? pattern.graphRelationships) ?? []) {
      const target = relationTarget(relationship);
      if (!target) {
        warnings.push({ line, field: 'graph_relationships', message: 'Skipped relationship with no target.' });
        continue;
      }
      const edgeType = relationType(relationship);
      edgeRows.push({
        id: deterministicUuid(`edge:${code}:${edgeType}:${target}`),
        from_node_type: 'genome_pattern',
        from_node_id: code,
        edge_type: edgeType,
        to_node_type: optionalString(relationship.to_node_type) ?? 'genome_pattern',
        to_node_id: target,
        vertical,
        weight: relationWeight(relationship),
        evidence: {
          source: 'admin-corpus-import',
          import_id: importId,
          uploaded_by: input.uploadedBy,
          relationship,
        },
        source_key: 'admin-corpus-import',
      });
    }
  }

  return {
    importId,
    fileName: input.fileName,
    rowsParsed: parsed.length,
    patternsPrepared: patternRows.length,
    edgesPrepared: edgeRows.length,
    verticals: [...verticals].sort(),
    warnings,
    errors,
    patternRows,
    edgeRows,
  };
}

async function upsertRows(
  db: PostgresCompatClient,
  table: string,
  rows: JsonRecord[],
  onConflict: string,
): Promise<number> {
  let upserted = 0;
  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100);
    const { data, error, count } = await db.from(table).upsert(batch, { onConflict }).select('*');
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    upserted += Array.isArray(data) ? data.length : count ?? batch.length;
  }
  return upserted;
}

export async function loadCorpusJsonlImport(input: CorpusJsonlImportInput): Promise<CorpusJsonlImportResult> {
  const prepared = prepareCorpusJsonlImport(input);
  const { patternRows, edgeRows, ...publicPrepared } = prepared;
  const mode = input.commitMode ?? 'validate_only';

  if (prepared.errors.length > 0 || mode === 'validate_only') {
    return {
      ok: prepared.errors.length === 0,
      mode,
      ...publicPrepared,
      persistence: {
        status: 'validation_only',
        patternsUpserted: 0,
        edgesUpserted: 0,
        ingestionRunRecorded: false,
        detail:
          prepared.errors.length > 0
            ? 'Corpus JSONL validation failed. Fix the listed errors before commit.'
            : 'Corpus JSONL validated only. Re-run with commit enabled to write genome_patterns.',
      },
    };
  }

  if (!databaseConfigured() && !input.db) {
    return {
      ok: true,
      mode,
      ...publicPrepared,
      persistence: {
        status: 'skipped_no_database_url',
        patternsUpserted: 0,
        edgesUpserted: 0,
        ingestionRunRecorded: false,
        detail: 'No ABARVA_AZURE_DATABASE_URL or DATABASE_URL is configured; import was validated but not written.',
      },
    };
  }

  const db = input.db ?? getAzureWriteFluentClient();
  const patternsUpserted = await upsertRows(db, 'genome_patterns', patternRows, 'code');
  const edgesUpserted =
    edgeRows.length > 0
      ? await upsertRows(db, 'intelligence_graph_edges', edgeRows, 'from_node_type,from_node_id,edge_type,to_node_type,to_node_id')
      : 0;

  const runInsert = await db
    .from('data_ingestion_runs')
    .insert({
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      source_label: `Corpus JSONL import: ${input.fileName}`,
      source_root: 'admin/context-layer/corpus-import',
      status: 'completed',
      records_loaded: prepared.patternsPrepared,
      chunks_loaded: 0,
      nodes_loaded: prepared.patternsPrepared,
      edges_loaded: prepared.edgesPrepared,
      summary: {
        loader: 'c6-governed-corpus-jsonl-import',
        import_id: prepared.importId,
        target_table: 'genome_patterns',
        doctrine_context: true,
        verticals: publicPrepared.verticals,
        warnings: publicPrepared.warnings,
        upload_attestation: input.attestation ?? null,
      },
    })
    .select('id');
  const ingestionRunRecorded = !runInsert.error;

  return {
    ok: true,
    mode,
    ...publicPrepared,
    persistence: {
      status: 'inserted',
      patternsUpserted,
      edgesUpserted,
      ingestionRunRecorded,
      detail: ingestionRunRecorded
        ? 'Corpus patterns were upserted through the governed admin import lane.'
        : 'Corpus patterns were upserted; ingestion run audit row was skipped because the table write failed.',
    },
  };
}
