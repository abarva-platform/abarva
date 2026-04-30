// Source · Artifact Registry · mime allowlist + size cap
//
// Mirrors the Programs attachment allowlist but keeps Source independent.
// Archives and octet-stream are intentionally excluded: Source should parse
// explicit documents/workbooks/media, not opaque bundles.

export const SOURCE_ARTIFACT_MIME_ALLOWLIST = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/markdown',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'audio/mpeg',
  'audio/mp4',
  'video/mp4',
] as const;

export type SourceArtifactAllowedMimeType = (typeof SOURCE_ARTIFACT_MIME_ALLOWLIST)[number];

export const MAX_SOURCE_ARTIFACT_SIZE_BYTES = 104_857_600; // 100 MB

export function isAllowedSourceArtifactMimeType(
  mime: string,
): mime is SourceArtifactAllowedMimeType {
  return (SOURCE_ARTIFACT_MIME_ALLOWLIST as readonly string[]).includes(mime);
}

export function isWithinSourceArtifactSizeLimit(bytes: number): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_SOURCE_ARTIFACT_SIZE_BYTES;
}
