// GET /api/v1/source/artifacts/{artifactId}/download
//
// Streams the artifact bytes from Azure Blob (durable store) with a download
// disposition. Tenant-scoped: the metadata row must belong to the caller's client.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { getObjectStorageAdapter } from '@/lib/data-plane/objectStorage';
import { getSourceArtifactRegistryRecord } from '@/lib/source/artifact-registry';
import { getSourceArtifact } from '@/lib/source/file-cabinet/repository';
import { downloadArtifactBytes } from '@/lib/source/file-cabinet/blob-store';
import { contentTypeFor } from '@/lib/source/file-cabinet/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctxParam: { params: Promise<{ artifactId: string }> }) {
  try {
    const ctx = await requireTenancy();
    const { artifactId } = await ctxParam.params;
    if (!artifactId?.trim()) {
      return Response.json({ error: 'bad_request', detail: 'artifactId is required.' }, { status: 400 });
    }

    const record = await getSourceArtifact(artifactId, ctx.clientId);
    if (!record) return streamRegistryArtifact(artifactId);

    const bytes = await downloadArtifactBytes({ bucket: record.blobContainer, path: record.blobPath });
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'content-type': contentTypeFor(record.fileFormat),
        'content-disposition': `attachment; filename="${record.fileName.replace(/"/g, '')}"`,
        'content-length': String(bytes.length),
        'cache-control': 'private, no-store',
        'x-source-artifact-id': record.id,
        'x-source-artifact-version': String(record.version),
      },
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error('[GET /api/v1/source/artifacts/[artifactId]/download]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

async function streamRegistryArtifact(artifactId: string): Promise<Response> {
  const [record, activeClient] = await Promise.all([
    getSourceArtifactRegistryRecord(artifactId),
    getActiveClientRow().catch(() => null),
  ]);
  if (!record || record.deletedAt) {
    return Response.json({ error: 'not_found', detail: 'Artifact not found for this tenant.' }, { status: 404 });
  }
  const activeTenantKey = activeClient?.key
    ? clientKeyToInventorySubstrateKey(activeClient.key)
    : null;
  if (!activeTenantKey || record.tenantKey !== activeTenantKey) {
    return Response.json({ error: 'not_found', detail: 'Artifact not found for this tenant.' }, { status: 404 });
  }

  const bytes = await getObjectStorageAdapter().download('source-artifacts', record.blobUri);
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'content-type': record.mimeType || 'application/octet-stream',
      'content-disposition': `attachment; filename="${record.originalName.replace(/"/g, '')}"`,
      'content-length': String(bytes.length),
      'cache-control': 'private, no-store',
      'x-source-artifact-id': record.id,
      'x-source-artifact-version': String(record.version),
      'x-source-artifact-registry': 'source_artifacts',
    },
  });
}
