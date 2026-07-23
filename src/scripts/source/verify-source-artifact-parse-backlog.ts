/**
 * Read-only verification for Source artifact parse/index backlog state.
 *
 * This script reads existing `source_artifacts` registry rows and writes a
 * proof JSON summarizing stored, parsed, parser-ready, search-ready, and
 * unsupported-without-OCR/transcription states. It does not parse files, run a
 * backfill worker, index vectors, promote enterprise context, or mutate data.
 *
 * Usage:
 *   npm run source:artifact-parse:verify-backlog -- --client-key apex-retail --event-id apex-retail-ams-outsourcing-2026
 */

import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from 'dotenv';
import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { buildSourceArtifactParseBacklogReport } from '@/lib/source/artifact-registry/parse-backlog';
import type {
  SourceArtifactApprovalState,
  SourceArtifactEvidenceState,
  SourceArtifactFamily,
  SourceArtifactFormat,
  SourceArtifactOrigin,
  SourceArtifactRegistryRecord,
  SourceClassificationStatus,
  SourceDataClassification,
  SourceEmbeddingStatus,
  SourceGraphStatus,
  SourceParseStatus,
} from '@/lib/source/artifact-registry/types';
import { getSourceEventSeed } from '@/lib/source/mock-seed';
import type { SourceEventRow } from '@/lib/source/queries';
import type { SourceStageKey } from '@/lib/source/types';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import { tenantAliasesFor } from '@/lib/tenant/aliases';

config({ path: '.env.local' });
config({ path: '.env' });

interface CliOptions {
  readonly clientKey: string;
  readonly eventId: string | null;
  readonly outDir: string;
  readonly limit: number;
  readonly failOnAttention: boolean;
  readonly staleParsingAfterHours: number;
}

interface SourceArtifactReadRow {
  id: string;
  tenant_key: string;
  source_event_id: string;
  source_event_row_id: string | null;
  stage_key: SourceStageKey;
  artifact_family: SourceArtifactFamily;
  artifact_kind: string;
  source_origin: SourceArtifactOrigin;
  source_format: SourceArtifactFormat;
  original_name: string;
  blob_uri: string;
  uploader_user_id: string;
  mime_type: string;
  size_bytes: number | string;
  sha256: string;
  parse_status: SourceParseStatus;
  embedding_status: SourceEmbeddingStatus;
  graph_status: SourceGraphStatus;
  classification_status: SourceClassificationStatus;
  data_classification: SourceDataClassification;
  evidence_state: SourceArtifactEvidenceState;
  approval_state: SourceArtifactApprovalState;
  version: number | string;
  supersedes_artifact_version_id: string | null;
  created_by: string;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const ARTIFACT_SELECT_COLUMNS = [
  'id',
  'tenant_key',
  'source_event_id',
  'source_event_row_id',
  'stage_key',
  'artifact_family',
  'artifact_kind',
  'source_origin',
  'source_format',
  'original_name',
  'blob_uri',
  'uploader_user_id',
  'mime_type',
  'size_bytes',
  'sha256',
  'parse_status',
  'embedding_status',
  'graph_status',
  'classification_status',
  'data_classification',
  'evidence_state',
  'approval_state',
  'version',
  'supersedes_artifact_version_id',
  'created_by',
  'validated_by',
  'created_at',
  'updated_at',
  'deleted_at',
].join(', ');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function valueAfter(args: readonly string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const value = args[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

function numberAfter(
  args: readonly string[],
  flag: string,
  fallback: number,
): number {
  const value = valueAfter(args, flag);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive number`);
  }
  return parsed;
}

function usage(): string {
  return [
    'Usage:',
    '  npm run source:artifact-parse:verify-backlog -- --client-key <tenant> [--event-id <uuid|code|slug>] [--out-dir <dir>] [--limit <n>] [--fail-on-attention]',
    '  SOURCE_ARTIFACT_PARSE_CLIENT_KEY=<tenant> SOURCE_ARTIFACT_PARSE_EVENT_ID=<uuid|code|slug> npm run source:artifact-parse:verify-backlog',
    '',
    'Read-only. Summarizes existing Source artifact parse/search readiness without parsing, indexing, promotion, or data mutation.',
  ].join('\n');
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(usage());
    process.exit(0);
  }

  const clientKey =
    valueAfter(args, '--client-key') ??
    valueAfter(args, '--client') ??
    process.env.SOURCE_ARTIFACT_PARSE_CLIENT_KEY;
  if (!clientKey) throw new Error(usage());

  return {
    clientKey: canonicalTenantKey(clientKey),
    eventId:
      valueAfter(args, '--event-id') ??
      valueAfter(args, '--event') ??
      process.env.SOURCE_ARTIFACT_PARSE_EVENT_ID ??
      null,
    outDir:
      valueAfter(args, '--out-dir') ??
      process.env.SOURCE_ARTIFACT_PARSE_OUT_DIR ??
      'reports/source-artifact-parse-backlog',
    limit: numberAfter(args, '--limit', 300),
    failOnAttention:
      args.includes('--fail-on-attention') ||
      process.env.SOURCE_ARTIFACT_PARSE_FAIL_ON_ATTENTION === 'true',
    staleParsingAfterHours: numberAfter(args, '--stale-parsing-after-hours', 24),
  };
}

async function readResolvedEvent(
  clientKey: string,
  eventId: string,
): Promise<SourceEventRow> {
  const clientKeys = tenantAliasesFor(clientKey);
  const seedEvent = getSourceEventSeed(eventId);
  const eventCodes = Array.from(
    new Set(
      [eventId, seedEvent?.code].filter((value): value is string =>
        Boolean(value),
      ),
    ),
  );
  const baseQuery = getAzureReadFluentClient()
    .from('source_events')
    .select(
      'id,client_key,event_code,event_name,event_type,current_stage_key,lifecycle_state,linked_program_id,estimated_value_usd,trigger_description,scope_description,decision_owner,created_by_user_id,created_at,updated_at',
    )
    .in('client_key', clientKeys)
    .order('updated_at', { ascending: false })
    .limit(1);

  const query = UUID_REGEX.test(eventId)
    ? baseQuery.eq('id', eventId)
    : baseQuery.in('event_code', eventCodes);
  const { data, error } = await query.maybeSingle<SourceEventRow>();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(`No Source event found for ${clientKey}:${eventId}`);
  }
  return data;
}

function uniqueArtifacts(
  artifacts: readonly SourceArtifactRegistryRecord[],
): SourceArtifactRegistryRecord[] {
  const seen = new Set<string>();
  const unique: SourceArtifactRegistryRecord[] = [];
  for (const artifact of artifacts) {
    if (seen.has(artifact.id)) continue;
    seen.add(artifact.id);
    unique.push(artifact);
  }
  return unique;
}

function rowToRecord(row: SourceArtifactReadRow): SourceArtifactRegistryRecord {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    sourceEventId: row.source_event_id,
    sourceEventRowId: row.source_event_row_id,
    stageKey: row.stage_key,
    artifactFamily: row.artifact_family,
    artifactKind: row.artifact_kind,
    sourceOrigin: row.source_origin,
    sourceFormat: row.source_format,
    originalName: row.original_name,
    blobUri: row.blob_uri,
    uploaderUserId: row.uploader_user_id,
    mimeType: row.mime_type,
    sizeBytes:
      typeof row.size_bytes === 'string'
        ? Number(row.size_bytes)
        : row.size_bytes,
    sha256: row.sha256,
    parseStatus: row.parse_status,
    embeddingStatus: row.embedding_status,
    graphStatus: row.graph_status,
    classificationStatus: row.classification_status,
    dataClassification: row.data_classification,
    evidenceState: row.evidence_state,
    approvalState: row.approval_state,
    version: typeof row.version === 'string' ? Number(row.version) : row.version,
    supersedesArtifactVersionId: row.supersedes_artifact_version_id,
    createdBy: row.created_by,
    validatedBy: row.validated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function readArtifactRowsByAlias(
  alias: string,
): Promise<SourceArtifactRegistryRecord[]> {
  const db = getAzureReadFluentClient();
  const eventFilter = UUID_REGEX.test(alias)
    ? `source_event_id.eq.${alias},source_event_row_id.eq.${alias}`
    : `source_event_id.eq.${alias}`;
  const { data, error } = await db
    .from('source_artifacts')
    .select(ARTIFACT_SELECT_COLUMNS)
    .or(eventFilter)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`source_artifacts readback: ${error.message}`);
  return ((data as unknown as SourceArtifactReadRow[] | null) ?? []).map(
    rowToRecord,
  );
}

async function readArtifactRowsForTenant(
  clientKey: string,
  limit: number,
): Promise<SourceArtifactRegistryRecord[]> {
  const db = getAzureReadFluentClient();
  const { data, error } = await db
    .from('source_artifacts')
    .select(ARTIFACT_SELECT_COLUMNS)
    .eq('tenant_key', clientKey)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`source_artifacts readback: ${error.message}`);
  return ((data as unknown as SourceArtifactReadRow[] | null) ?? []).map(
    rowToRecord,
  );
}

async function readArtifactsForEvent(
  clientKey: string,
  inputEventId: string,
  event: SourceEventRow,
): Promise<SourceArtifactRegistryRecord[]> {
  const aliases = [
    inputEventId,
    event.id,
    event.event_code,
    getSourceEventSeed(inputEventId)?.code,
  ].filter((value): value is string => Boolean(value));

  const artifacts = (
    await Promise.all(aliases.map((alias) => readArtifactRowsByAlias(alias)))
  ).flat();

  return uniqueArtifacts(artifacts).filter(
    (artifact) => artifact.tenantKey === clientKey,
  );
}

async function writeReport(
  outDir: string,
  report: ReturnType<typeof buildSourceArtifactParseBacklogReport>,
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, 'parse-backlog.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

function emitProofBundle(outDir: string): void {
  if (
    process.env.SOURCE_ARTIFACT_PARSE_EMIT_PROOF_BUNDLE?.toLowerCase() !==
    'true'
  ) {
    return;
  }
  const tar = spawnSync('tar', ['-czf', '-', '-C', outDir, '.'], {
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (tar.status !== 0) {
    throw new Error(
      `failed to create artifact parse-backlog proof bundle: ${
        tar.stderr?.toString('utf8') || tar.stdout?.toString('utf8')
      }`,
    );
  }
  console.log('__SEMANTIC2_PROOF_TGZ_BEGIN__');
  console.log(tar.stdout.toString('base64'));
  console.log('__SEMANTIC2_PROOF_TGZ_END__');
}

async function main() {
  const opts = parseArgs();
  const event = opts.eventId
    ? await readResolvedEvent(opts.clientKey, opts.eventId)
    : null;
  const artifacts = event
    ? await readArtifactsForEvent(opts.clientKey, opts.eventId ?? event.id, event)
    : await readArtifactRowsForTenant(opts.clientKey, opts.limit);

  const report = buildSourceArtifactParseBacklogReport({
    clientKey: opts.clientKey,
    ...(opts.eventId ? { inputEventId: opts.eventId } : {}),
    ...(event
      ? {
          resolvedEventId: event.id,
          resolvedEventCode: event.event_code,
        }
      : {}),
    artifacts,
    staleParsingAfterHours: opts.staleParsingAfterHours,
  });
  const reportPath = await writeReport(opts.outDir, report);
  emitProofBundle(opts.outDir);

  console.log(
    [
      `Source artifact parse backlog ${report.status}`,
      `client=${opts.clientKey}`,
      event ? `event=${event.event_code} (${event.id})` : 'event=tenant-wide',
      `artifacts=${report.counts.totalArtifacts}`,
      `parsed=${report.counts.parsedArtifacts}`,
      `parserReady=${report.counts.parserReadyArtifacts}`,
      `searchReady=${report.counts.searchReadyArtifacts}`,
      `attention=${report.attentionItems.length}`,
      `report=${reportPath}`,
    ].join(' · '),
  );

  if (opts.failOnAttention && report.status !== 'ok') {
    throw new Error(
      `artifact parse backlog status is ${report.status}; see ${reportPath}`,
    );
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exit(1);
});
