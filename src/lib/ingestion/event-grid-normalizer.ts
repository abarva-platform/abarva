import {
  SEGMENT_KEYS,
  type AzureLandingZoneMessage,
  type SegmentKey,
} from '@/lib/ingestion/azure-landing-zone-types';
import type { UploadDataClassification } from '@/lib/security/sensitive-upload-guard';

type EventGridBlobCreated = {
  readonly id?: string;
  readonly eventType?: string;
  readonly type?: string;
  readonly eventTime?: string;
  readonly time?: string;
  readonly data?: {
    readonly url?: string;
    readonly contentType?: string;
    readonly contentLength?: number;
  };
};

export type BlobMetadataLoader = (args: {
  accountName: string;
  containerName: string;
  blobPath: string;
}) => Promise<{
  metadata: Record<string, string | undefined>;
  contentType?: string;
  contentLength?: number;
}>;

function firstEvent(raw: unknown): EventGridBlobCreated | null {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (typeof candidate !== 'object' || candidate === null) return null;
  const event = candidate as EventGridBlobCreated;
  const eventType = event.eventType ?? event.type;
  if (eventType !== 'Microsoft.Storage.BlobCreated') return null;
  if (typeof event.data?.url !== 'string') return null;
  return event;
}

function metadataValue(metadata: Record<string, string | undefined>, keys: string[]): string | undefined {
  const normalized = new Map<string, string>();
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string' && value.trim()) {
      normalized.set(key.toLowerCase().replace(/[^a-z0-9]/g, ''), value.trim());
    }
  }
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (value) return value;
  }
  return undefined;
}

function parseBlobUrl(rawUrl: string): {
  accountName: string;
  containerName: string;
  blobPath: string;
} {
  const url = new URL(rawUrl);
  const accountName = url.hostname.split('.')[0];
  const [, containerName, ...blobParts] = url.pathname.split('/');
  const blobPath = decodeURIComponent(blobParts.join('/'));
  if (!accountName || !containerName || !blobPath) {
    throw new Error('event_grid_invalid_blob_url');
  }
  return { accountName, containerName, blobPath };
}

function parseSegment(raw: string | undefined): SegmentKey {
  if (!raw || !SEGMENT_KEYS.includes(raw as SegmentKey)) {
    throw new Error(`event_grid_invalid_segment:${raw ?? 'missing'}`);
  }
  return raw as SegmentKey;
}

/**
 * Convert a raw Azure Storage BlobCreated Event Grid payload into the
 * canonical AbarVa ingestion message. This intentionally relies on blob
 * metadata for tenant/segment/classification so the storage event itself
 * stays generic and no tenant is inferred from a user-controlled URL.
 */
export async function normalizeEventGridBlobCreated(
  raw: unknown,
  loadMetadata: BlobMetadataLoader,
): Promise<AzureLandingZoneMessage | null> {
  const event = firstEvent(raw);
  if (!event) return null;

  const storage = parseBlobUrl(event.data?.url ?? '');
  const props = await loadMetadata(storage);
  const tenantClientKey = metadataValue(props.metadata, [
    'tenantClientKey',
    'tenant_key',
    'tenantKey',
  ]);
  const segmentKey = parseSegment(metadataValue(props.metadata, [
    'segmentKey',
    'segment_key',
    'segment',
  ]));
  const sha = metadataValue(props.metadata, ['sha256', 'sha_256']);
  if (!tenantClientKey) throw new Error('event_grid_missing_tenant_metadata');
  if (!sha) throw new Error('event_grid_missing_sha256_metadata');

  const declaredClassification = metadataValue(props.metadata, [
    'declaredClassification',
    'classification',
  ]) as UploadDataClassification | undefined;
  const smokeRunId = metadataValue(props.metadata, ['smokeRunId']);
  const smokeCase = metadataValue(props.metadata, ['smokeCase']);
  const expectedFinalDecision = metadataValue(props.metadata, ['expectedFinalDecision']);

  return {
    schema: 'abarva.ingestion.v1',
    tenantClientKey,
    segmentKey,
    storage: {
      ...storage,
      sizeBytes: props.contentLength ?? event.data?.contentLength ?? 0,
      contentType: props.contentType ?? event.data?.contentType ?? 'application/octet-stream',
      sha256: sha,
    },
    declaredClassification,
    producedAt: event.eventTime ?? event.time ?? new Date().toISOString(),
    metadata: {
      source: 'event_grid_blob_created',
      eventGridEventId: event.id ?? '',
      ...(smokeRunId ? { smokeRunId } : {}),
      ...(smokeCase ? { smokeCase } : {}),
      ...(expectedFinalDecision ? { expectedFinalDecision } : {}),
    },
  };
}
