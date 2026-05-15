import { describe, expect, it } from '@jest/globals';
import { normalizeEventGridBlobCreated, type BlobMetadataLoader } from '../event-grid-normalizer';

describe('normalizeEventGridBlobCreated', () => {
  it('converts storage BlobCreated events into canonical ingestion messages', async () => {
    const calls: Parameters<BlobMetadataLoader>[0][] = [];
    const loader: BlobMetadataLoader = async (args) => {
      calls.push(args);
      return {
        metadata: {
          tenantClientKey: 'apex-retail',
          segmentKey: 'enterprise_profile',
          declaredClassification: 'confidential_business',
          sha256: 'a'.repeat(64),
          smokeRunId: 'azlab23-1',
          smokeCase: 'safe',
          expectedFinalDecision: 'allow',
        },
        contentType: 'text/plain',
        contentLength: 123,
      };
    };

    const normalized = await normalizeEventGridBlobCreated({
      id: 'evt-1',
      eventType: 'Microsoft.Storage.BlobCreated',
      eventTime: '2026-05-15T13:00:00Z',
      data: {
        url: 'https://stabarvaprivatedplab001.blob.core.windows.net/context-drops/smoke/azlab23-1/safe.txt',
        contentType: 'application/octet-stream',
        contentLength: 99,
      },
    }, loader);

    expect(calls).toEqual([{
      accountName: 'stabarvaprivatedplab001',
      containerName: 'context-drops',
      blobPath: 'smoke/azlab23-1/safe.txt',
    }]);
    expect(normalized).toMatchObject({
      schema: 'abarva.ingestion.v1',
      tenantClientKey: 'apex-retail',
      segmentKey: 'enterprise_profile',
      declaredClassification: 'confidential_business',
      producedAt: '2026-05-15T13:00:00Z',
      storage: {
        accountName: 'stabarvaprivatedplab001',
        containerName: 'context-drops',
        blobPath: 'smoke/azlab23-1/safe.txt',
        sizeBytes: 123,
        contentType: 'text/plain',
        sha256: 'a'.repeat(64),
      },
      metadata: {
        source: 'event_grid_blob_created',
        eventGridEventId: 'evt-1',
        smokeRunId: 'azlab23-1',
        smokeCase: 'safe',
        expectedFinalDecision: 'allow',
      },
    });
  });

  it('returns null for non-storage events', async () => {
    const normalized = await normalizeEventGridBlobCreated(
      { eventType: 'Microsoft.Resources.ResourceWriteSuccess' },
      (async () => ({ metadata: {} })) satisfies BlobMetadataLoader,
    );
    expect(normalized).toBeNull();
  });

  it('requires tenant and checksum metadata', async () => {
    await expect(normalizeEventGridBlobCreated({
      eventType: 'Microsoft.Storage.BlobCreated',
      data: {
        url: 'https://acct.blob.core.windows.net/context-drops/file.txt',
      },
    }, async () => ({
      metadata: {
        segmentKey: 'enterprise_profile',
      },
    }))).rejects.toThrow('event_grid_missing_tenant_metadata');
  });
});
