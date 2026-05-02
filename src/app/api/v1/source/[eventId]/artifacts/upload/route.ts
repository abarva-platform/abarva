// POST /api/v1/source/:eventId/artifacts/upload
//
// Server-mediated Source paperclip upload. This is intentionally the first
// receipt step only: bytes land in the private source-artifacts bucket and a
// registry row is created with parser/vector/graph states still pending.

import { createHash, randomUUID } from 'node:crypto';

import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import { getServerSupabase } from '@/lib/supabase-server';
import { normalizeSourceStageKey, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import { getSourcingEvent, type SourceEventRow } from '@/lib/source/queries';
import type { SourceStageKey } from '@/lib/source/types';
import {
  buildSourceArtifactBlobPath,
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  registerSourceArtifactUpload,
  type SourceDataClassification,
} from '@/lib/source/artifact-registry';
import {
  inferSourceArtifactFamily,
  sourceArtifactFormatFromMime,
} from '@/lib/source/artifact-registry/upload-contract';
import {
  isSynchronouslyParseableSourceFormat,
  parseSourceTextArtifact,
} from '@/lib/source/artifact-registry/text-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STORAGE_BUCKET = 'source-artifacts';

type SourceUploadRouteContext = {
  params: Promise<{ eventId?: string }>;
};

type ResolvedSourceEventScope = {
  eventId: string;
  sourceEventRowId?: string;
  stageKey: SourceStageKey;
};

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json({ ok: false, error: code, ...(detail ? { detail } : {}) }, { status });
}

function parseOptionalString(raw: FormDataEntryValue | null): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const str = String(raw).trim();
  return str.length > 0 ? str : undefined;
}

function parseDataClassification(raw: FormDataEntryValue | null): SourceDataClassification | undefined {
  const value = parseOptionalString(raw);
  if (!value) return undefined;
  if (value === 'Public' || value === 'Internal' || value === 'Confidential' || value === 'Restricted') {
    return value;
  }
  throw new Error(`dataClassification must be Public, Internal, Confidential, or Restricted; got ${value}`);
}

function parseStageKey(raw: FormDataEntryValue | null): SourceStageKey | undefined {
  const value = parseOptionalString(raw);
  if (!value) return undefined;
  const normalized = normalizeSourceStageKey(value);
  if (normalized && (SOURCE_STAGE_ORDER as readonly string[]).includes(normalized)) return normalized;
  throw new Error(`stageKey must be canonical Source stage, got ${value}`);
}

function seedEventMatchesClient(accountName: string, clientKey: string): boolean {
  const normalized = accountName.toLowerCase();
  if (clientKey === 'apexretail') return normalized.includes('apex');
  if (clientKey === 'meridian') return normalized.includes('meridian');
  return false;
}

async function getPersistedSourceEventRow(
  clientKey: string,
  eventId: string,
): Promise<SourceEventRow | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
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

export async function POST(request: Request, { params }: SourceUploadRouteContext) {
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

  const client = await getActiveClientRow();
  if (!client || client.id !== tenancy.clientId) return jsonError(403, 'no_active_client');
  const tenantKey = clientKeyToBrokerTenantKey(client.key);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, 'invalid_multipart');
  }

  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') return jsonError(400, 'missing_file');
  const file = fileEntry as File;
  const filename = file.name && file.name.trim().length > 0 ? file.name : 'upload';
  const mimeType = file.type || 'application/octet-stream';

  if (!isAllowedSourceArtifactMimeType(mimeType)) {
    return jsonError(415, 'unsupported_mime', `mime "${mimeType}" is not in the allowlist`);
  }
  if (!isWithinSourceArtifactSizeLimit(file.size)) {
    return jsonError(413, 'oversize', `size ${file.size} exceeds limit ${MAX_SOURCE_ARTIFACT_SIZE_BYTES}`);
  }

  let requestedStageKey: SourceStageKey | undefined;
  let dataClassification: SourceDataClassification | undefined;
  try {
    requestedStageKey = parseStageKey(formData.get('stageKey'));
    dataClassification = parseDataClassification(formData.get('dataClassification'));
  } catch (error) {
    return jsonError(400, 'invalid_metadata', error instanceof Error ? error.message : 'invalid metadata');
  }

  const scope = await resolveSourceEventScope({
    clientKey: client.key,
    eventId,
    requestedStageKey,
  });
  if (!scope) return jsonError(403, 'forbidden_event');

  const artifactId = randomUUID();
  let blobUri: string;
  try {
    blobUri = buildSourceArtifactBlobPath({
      tenantKey,
      sourceEventId: scope.eventId,
      artifactId,
      filename,
    });
  } catch (error) {
    return jsonError(400, 'invalid_filename', error instanceof Error ? error.message : 'invalid filename');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const sb = getServerSupabase();

  const { error: uploadError } = await sb.storage.from(STORAGE_BUCKET).upload(blobUri, buffer, {
    contentType: mimeType,
    cacheControl: 'private, max-age=0',
    upsert: false,
  });
  if (uploadError) {
    console.error('[POST /api/v1/source/:eventId/artifacts/upload] storage_upload_failed', {
      blobUri,
      message: uploadError.message,
    });
    return jsonError(500, 'storage_upload_failed', uploadError.message);
  }

  try {
    let artifact = await registerSourceArtifactUpload({
      artifactId,
      tenantKey,
      sourceEventId: scope.eventId,
      sourceEventRowId: scope.sourceEventRowId,
      stageKey: scope.stageKey,
      artifactFamily: inferSourceArtifactFamily({
        stageKey: scope.stageKey,
        filename,
        requestedFamily: parseOptionalString(formData.get('artifactFamily')),
      }),
      artifactKind: parseOptionalString(formData.get('artifactKind')) ?? 'uploaded_source_artifact',
      sourceOrigin: 'uploaded',
      sourceFormat: sourceArtifactFormatFromMime(mimeType),
      originalName: filename,
      blobUri,
      uploaderUserId: tenancy.userId,
      mimeType,
      sizeBytes: file.size,
      sha256,
      dataClassification,
      createdBy: tenancy.userId,
    });

    const parseWarnings: string[] = [];
    if (isSynchronouslyParseableSourceFormat(artifact.sourceFormat)) {
      try {
        artifact = await parseSourceTextArtifact({
          artifact,
          text: buffer.toString('utf8'),
        });
      } catch (parseError) {
        parseWarnings.push(parseError instanceof Error ? parseError.message : 'text parse failed');
        console.error('[POST /api/v1/source/:eventId/artifacts/upload] text_parse_failed', {
          artifactId: artifact.id,
          sourceEventId: artifact.sourceEventId,
          message: parseWarnings[0],
        });
      }
    }

    return Response.json(
      { ok: true, artifact, ...(parseWarnings.length > 0 ? { parseWarnings } : {}) },
      { status: 200 },
    );
  } catch (error) {
    await sb.storage.from(STORAGE_BUCKET).remove([blobUri]).catch(() => undefined);
    console.error('[POST /api/v1/source/:eventId/artifacts/upload] metadata_insert_failed', error);
    return jsonError(
      500,
      'metadata_insert_failed',
      error instanceof Error ? error.message : 'failed to persist Source artifact metadata',
    );
  }
}
