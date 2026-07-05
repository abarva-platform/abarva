// POST /api/v1/source/:eventId/artifacts/generate
//
// Persists an agent-generated Source work product as a first-class artifact.
// This does not claim parser/vector/graph completion; it stores the generated
// markdown in the private source-artifacts bucket and creates a registry row
// that downstream parsing, vector, graph, and approval jobs can consume.

import { createHash, randomUUID } from 'node:crypto';

import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { getObjectStorageAdapter } from '@/lib/data-plane/objectStorage';
import { normalizeSourceStageKey, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import { getSourcingEvent, type SourceEventRow } from '@/lib/source/queries';
import type { SourceStageKey } from '@/lib/source/types';
import {
  buildSourceArtifactBlobPath,
  registerSourceArtifactUpload,
  type SourceArtifactFamily,
  type SourceDataClassification,
} from '@/lib/source/artifact-registry';
import {
  getCurrentArtifacts,
  supersedePriorVersions,
} from '@/lib/source/file-cabinet/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STORAGE_BUCKET = 'source-artifacts';
const GENERATED_MIME = 'text/markdown';
const MAX_GENERATED_ARTIFACT_CHARS = 200_000;

type GenerateRouteContext = {
  params: Promise<{ eventId?: string }>;
};

interface GenerateSourceArtifactBody {
  title?: unknown;
  content?: unknown;
  stageKey?: unknown;
  artifactFamily?: unknown;
  artifactKind?: unknown;
  dataClassification?: unknown;
}

type ResolvedSourceEventScope = {
  eventId: string;
  sourceEventRowId?: string;
  stageKey: SourceStageKey;
};

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json({ ok: false, error: code, ...(detail ? { detail } : {}) }, { status });
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseRequiredString(value: unknown, field: string): string {
  const parsed = parseOptionalString(value);
  if (!parsed) throw new Error(`${field} is required`);
  return parsed;
}

function parseStageKey(value: unknown): SourceStageKey | undefined {
  const parsed = parseOptionalString(value);
  if (!parsed) return undefined;
  const normalized = normalizeSourceStageKey(parsed);
  if (normalized && (SOURCE_STAGE_ORDER as readonly string[]).includes(normalized)) return normalized;
  throw new Error(`stageKey must be canonical Source stage, got ${parsed}`);
}

function parseArtifactFamily(value: unknown, stageKey: SourceStageKey): SourceArtifactFamily {
  const parsed = parseOptionalString(value);
  if (parsed && SOURCE_ARTIFACT_FAMILIES.has(parsed as SourceArtifactFamily)) return parsed as SourceArtifactFamily;
  if (stageKey === 'scope') return 'scope_document';
  if (stageKey === 'strategy' || stageKey === 'sourcing_strategy' || stageKey === 'intake') return 'sourcing_strategy';
  if (stageKey === 'rfp' || stageKey === 'rfp_rfi_package') return 'rfp';
  if (stageKey === 'responses' || stageKey === 'vendor_responses') return 'proposal';
  if (stageKey === 'evaluation') return 'scorecard';
  if (stageKey === 'pricing') return 'pricing_workbook';
  if (stageKey === 'bafo' || stageKey === 'orals_bafo') return 'bafo';
  if (stageKey === 'executive_decision' || stageKey === 'selection') return 'decision_brief';
  if (stageKey === 'transition' || stageKey === 'contract_mobilization') return 'transition_risk_register';
  if (stageKey === 'value' || stageKey === 'value_realization') return 'value_ledger';
  return 'other';
}

function parseDataClassification(value: unknown): SourceDataClassification | undefined {
  const parsed = parseOptionalString(value);
  if (!parsed) return undefined;
  if (parsed === 'Public' || parsed === 'Internal' || parsed === 'Confidential' || parsed === 'Restricted') {
    return parsed;
  }
  throw new Error(`dataClassification must be Public, Internal, Confidential, or Restricted; got ${parsed}`);
}

function seedEventMatchesClient(accountName: string, clientKey: string): boolean {
  const normalized = accountName.toLowerCase();
  if (clientKey === 'apexretail') return normalized.includes('apex');
  if (clientKey === 'meridian') return normalized.includes('meridian');
  if (clientKey === 'firstcapital') return normalized.includes('first') || normalized.includes('capital');
  return false;
}

async function getPersistedSourceEventRow(clientKey: string, eventId: string): Promise<SourceEventRow | null> {
  const { data, error } = await getAzureReadFluentClient()
    .from('source_events')
    .select('*')
    .eq('id', eventId)
    .eq('client_key', clientKey)
    .maybeSingle();
  if (error) throw error;
  return (data as SourceEventRow | null) ?? null;
}

async function resolveSourceEventScope(args: {
  clientKey: string;
  eventId: string;
  requestedStageKey?: SourceStageKey;
}): Promise<ResolvedSourceEventScope | null> {
  const persisted = await getPersistedSourceEventRow(args.clientKey, args.eventId);
  if (persisted) {
    return {
      eventId: persisted.id,
      sourceEventRowId: persisted.id,
      stageKey: args.requestedStageKey ?? normalizeSourceStageKey(persisted.current_stage_key) ?? 'strategy',
    };
  }

  const seedEvent = await getSourcingEvent(args.eventId);
  if (!seedEvent || !seedEventMatchesClient(seedEvent.accountName, args.clientKey)) return null;
  return {
    eventId: seedEvent.id,
    stageKey: args.requestedStageKey ?? seedEvent.currentStageKey,
  };
}

function safeFilename(title: string, artifactId: string): string {
  const safe = title
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[/\\]/g, ' ')
    .replace(/[^a-zA-Z0-9._ -]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 90);
  return `${safe || 'source-generated-artifact'}-${artifactId.slice(0, 8)}.md`;
}

function displayTitle(title: string): string {
  return title.replace(/\s*[—-]\s*AbarVa Draft\s*$/i, '').trim() || title;
}

export async function POST(request: Request, { params }: GenerateRouteContext) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return jsonError(500, 'internal_error');
    }
  }

  const { eventId } = await params;
  if (!eventId) return jsonError(400, 'missing_event_id');

  const activeClient = await getActiveClientRow();
  if (!activeClient || activeClient.id !== tenancy.clientId) return jsonError(403, 'no_active_client');

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);

  if (!accessPolicy?.canGenerateSourcingArtifacts) {
    return jsonError(403, 'forbidden_source_artifact_generate_required', 'Source artifact generation rights are required.');
  }

  let body: GenerateSourceArtifactBody;
  try {
    body = (await request.json()) as GenerateSourceArtifactBody;
  } catch {
    return jsonError(400, 'invalid_json');
  }

  let title: string;
  let content: string;
  let stageKey: SourceStageKey | undefined;
  let dataClassification: SourceDataClassification | undefined;
  try {
    title = parseRequiredString(body.title, 'title');
    content = parseRequiredString(body.content, 'content');
    stageKey = parseStageKey(body.stageKey);
    dataClassification = parseDataClassification(body.dataClassification);
  } catch (error) {
    return jsonError(400, 'invalid_metadata', error instanceof Error ? error.message : 'invalid metadata');
  }

  if (content.length > MAX_GENERATED_ARTIFACT_CHARS) {
    return jsonError(413, 'generated_artifact_too_large', `content exceeds ${MAX_GENERATED_ARTIFACT_CHARS} characters`);
  }

  const scope = await resolveSourceEventScope({
    clientKey: activeClient.key,
    eventId,
    requestedStageKey: stageKey,
  });
  if (!scope) return jsonError(403, 'forbidden_event');

  const artifactFamily = parseArtifactFamily(body.artifactFamily, scope.stageKey);
  const artifactKind = parseOptionalString(body.artifactKind) ?? 'generated_source_artifact';
  let fileCabinetVersion = 1;
  let supersedesArtifactId: string | null = null;
  try {
    const prior = await getCurrentArtifacts(scope.eventId, artifactKind, 'generated');
    fileCabinetVersion = prior.reduce((max, item) => Math.max(max, item.version), 0) + 1;
    supersedesArtifactId = prior[0]?.id ?? null;
  } catch (error) {
    console.error('[POST /api/v1/source/:eventId/artifacts/generate] file cabinet prior-version read failed', {
      eventId: scope.eventId,
      artifactKind,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const artifactId = randomUUID();
  const filename = safeFilename(title, artifactId);
  let blobUri: string;
  try {
    blobUri = buildSourceArtifactBlobPath({
      tenantKey: clientKeyToInventorySubstrateKey(activeClient.key),
      sourceEventId: scope.eventId,
      artifactId,
      filename,
    });
  } catch (error) {
    return jsonError(400, 'invalid_filename', error instanceof Error ? error.message : 'invalid filename');
  }

  const markdown = [
    `# ${title}`,
    '',
    `Generated from Source agent on ${new Date().toISOString()}.`,
    `Stage: ${scope.stageKey}`,
    '',
    content,
  ].join('\n');
  const buffer = Buffer.from(markdown, 'utf8');
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const storage = getObjectStorageAdapter();

  try {
    await storage.upload(STORAGE_BUCKET, blobUri, buffer, {
      contentType: GENERATED_MIME,
      cacheControl: 'private, max-age=0',
      upsert: false,
    });
  } catch (uploadError) {
    console.error('[POST /api/v1/source/:eventId/artifacts/generate] storage_upload_failed', {
      blobUri,
      message: uploadError instanceof Error ? uploadError.message : String(uploadError),
    });
    return jsonError(
      500,
      'storage_upload_failed',
      uploadError instanceof Error ? uploadError.message : 'object storage upload failed',
    );
  }

  try {
    const artifact = await registerSourceArtifactUpload({
      artifactId,
      tenantKey: clientKeyToInventorySubstrateKey(activeClient.key),
      sourceEventId: scope.eventId,
      sourceEventRowId: scope.sourceEventRowId,
      stageKey: scope.stageKey,
      artifactFamily,
      artifactKind,
      sourceOrigin: 'generated',
      sourceFormat: 'markdown',
      originalName: filename,
      blobUri,
      uploaderUserId: tenancy.userId,
      mimeType: GENERATED_MIME,
      sizeBytes: buffer.byteLength,
      sha256,
      dataClassification,
      createdBy: tenancy.userId,
      ...(supersedesArtifactId ? { supersedesArtifactVersionId: supersedesArtifactId } : {}),
      fileCabinet: {
        clientId: activeClient.id,
        sourcingStage: scope.stageKey,
        artifactGroup: 'generated',
        artifactType: artifactKind,
        artifactFamily,
        title: displayTitle(title),
        description: 'Generated Source draft preserved for client review, downstream lineage, and client-final supersession.',
        fileName: filename,
        fileFormat: 'md',
        blobContainer: STORAGE_BUCKET,
        blobPath: blobUri,
        fileSize: buffer.byteLength,
        version: fileCabinetVersion,
        status: 'draft',
        generatedBy: tenancy.userId,
        sourceBasis: `generated-source-artifact:${artifactId}`,
        confidence: 'draft',
        citationReady: false,
        evidenceFamiliesUsed: [artifactFamily],
        missingInputs: [],
        clientCompleteItems: [],
        assumptions: [],
        supersedesArtifactId,
        blobSha256: sha256,
      },
    });
    if (supersedesArtifactId) {
      await supersedePriorVersions(scope.eventId, artifactKind, 'generated', artifact.id);
    }

    return Response.json({
      ok: true,
      artifact,
      receipt: {
        persisted: true,
        parser: artifact.parseStatus,
        vector: artifact.embeddingStatus,
        graph: artifact.graphStatus,
        evidenceState: artifact.evidenceState,
      },
    }, { status: 200 });
  } catch (error) {
    await storage.remove(STORAGE_BUCKET, [blobUri]).catch(() => undefined);
    console.error('[POST /api/v1/source/:eventId/artifacts/generate] metadata_insert_failed', error);
    return jsonError(
      500,
      'metadata_insert_failed',
      error instanceof Error ? error.message : 'failed to persist generated Source artifact metadata',
    );
  }
}

const SOURCE_ARTIFACT_FAMILIES = new Set<SourceArtifactFamily>([
  'rfi',
  'rfp',
  'bafo',
  'scorecard',
  'pricing_workbook',
  'proposal',
  'meeting_notes',
  'workshop_output',
  'decision_brief',
  'transition_risk_register',
  'value_ledger',
  'sourcing_strategy',
  'scope_document',
  'other',
]);
