// Source File Cabinet — Azure Blob storage layer.
//
// All Source artifact bytes live in Azure Blob (durable), never only in Downloads or
// browser memory. This module owns the canonical blob paths and thin upload/download/
// signed-url wrappers over the shared object-storage adapter.

import 'server-only';

import { getObjectStorageAdapter } from '@/lib/data-plane/objectStorage';
import { contentTypeFor, type ArtifactFileFormat, type ArtifactGroup } from './types';

/** Logical bucket; the adapter nests it under the configured shared container. */
export const SOURCE_ARTIFACT_BUCKET = 'source-events';

function sanitize(part: string): string {
  return part.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'x';
}

export interface BlobLocation {
  bucket: string;
  path: string;
}

/** generated: source-events/{tenant}/{event}/generated/{artifact_type}/{version}/{filename} */
export function generatedArtifactPath(args: { tenantKey: string; sourceEventId: string; artifactType: string; version: number; fileName: string }): BlobLocation {
  return {
    bucket: SOURCE_ARTIFACT_BUCKET,
    path: `${sanitize(args.tenantKey)}/${sanitize(args.sourceEventId)}/generated/${sanitize(args.artifactType)}/v${args.version}/${sanitize(args.fileName)}`,
  };
}

/** uploads: source-events/{tenant}/{event}/uploads/{evidence_family}/{batch}/{filename} */
export function uploadArtifactPath(args: { tenantKey: string; sourceEventId: string; evidenceFamily: string; uploadBatchId: string; fileName: string }): BlobLocation {
  return {
    bucket: SOURCE_ARTIFACT_BUCKET,
    path: `${sanitize(args.tenantKey)}/${sanitize(args.sourceEventId)}/uploads/${sanitize(args.evidenceFamily)}/${sanitize(args.uploadBatchId)}/${sanitize(args.fileName)}`,
  };
}

/** sessions: source-events/{tenant}/{event}/sessions/{session}/{artifact_type}/{filename} */
export function sessionArtifactPath(args: { tenantKey: string; sourceEventId: string; sessionId: string; artifactType: string; fileName: string }): BlobLocation {
  return {
    bucket: SOURCE_ARTIFACT_BUCKET,
    path: `${sanitize(args.tenantKey)}/${sanitize(args.sourceEventId)}/sessions/${sanitize(args.sessionId)}/${sanitize(args.artifactType)}/${sanitize(args.fileName)}`,
  };
}

/** approvals: source-events/{tenant}/{event}/approvals/{gate}/{timestamp}/{filename} */
export function approvalArtifactPath(args: { tenantKey: string; sourceEventId: string; gateId: string; timestamp: string; fileName: string }): BlobLocation {
  return {
    bucket: SOURCE_ARTIFACT_BUCKET,
    path: `${sanitize(args.tenantKey)}/${sanitize(args.sourceEventId)}/approvals/${sanitize(args.gateId)}/${sanitize(args.timestamp)}/${sanitize(args.fileName)}`,
  };
}

/** Pick the canonical location for a group (generated path is the common case). */
export function locationForGroup(args: {
  group: ArtifactGroup;
  tenantKey: string;
  sourceEventId: string;
  artifactType: string;
  version: number;
  fileName: string;
  artifactFamily?: string;
}): BlobLocation {
  if (args.group === 'upload') {
    return uploadArtifactPath({ tenantKey: args.tenantKey, sourceEventId: args.sourceEventId, evidenceFamily: args.artifactFamily ?? args.artifactType, uploadBatchId: `v${args.version}`, fileName: args.fileName });
  }
  if (args.group === 'approval') {
    return approvalArtifactPath({ tenantKey: args.tenantKey, sourceEventId: args.sourceEventId, gateId: args.artifactType, timestamp: `v${args.version}`, fileName: args.fileName });
  }
  if (args.group === 'session') {
    return sessionArtifactPath({ tenantKey: args.tenantKey, sourceEventId: args.sourceEventId, sessionId: args.artifactFamily ?? 'session', artifactType: args.artifactType, fileName: args.fileName });
  }
  // generated + template
  return generatedArtifactPath({ tenantKey: args.tenantKey, sourceEventId: args.sourceEventId, artifactType: args.artifactType, version: args.version, fileName: args.fileName });
}

export async function uploadArtifactBytes(loc: BlobLocation, bytes: Buffer, format: ArtifactFileFormat, metadata?: Record<string, string>): Promise<void> {
  await getObjectStorageAdapter().upload(loc.bucket, loc.path, bytes, {
    contentType: contentTypeFor(format),
    upsert: true,
    ...(metadata ? { metadata } : {}),
  });
}

export async function downloadArtifactBytes(loc: BlobLocation): Promise<Buffer> {
  return getObjectStorageAdapter().download(loc.bucket, loc.path);
}

export async function signedArtifactUrl(loc: BlobLocation, fileName: string, expiresInSeconds = 600): Promise<string> {
  return getObjectStorageAdapter().createSignedUrl(loc.bucket, loc.path, expiresInSeconds, { download: fileName });
}
