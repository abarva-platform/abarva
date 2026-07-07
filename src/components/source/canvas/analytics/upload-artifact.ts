// Client helper: POST a Source canvas file upload to the governed artifact
// upload route. Reuses the SAME route the Workspace Explorer uses
// (`/api/v1/source/:eventId/artifacts/upload`) so a canvas-uploaded file lands
// in Azure Blob storage AND registers a `source_artifacts` row — which is what
// surfaces it in the Workspace Explorer (that surface reads the same registry
// via `listSourceArtifactsForSourceEventId`).
//
// This is intentionally a thin fetch wrapper: all persistence, tenant scoping,
// blob write, and the artifact-row insert happen server-side in the route.

/** Server-side hard limit — mirrors MAX_SOURCE_ARTIFACT_SIZE_BYTES (100 MB). */
export const CANVAS_UPLOAD_MAX_BYTES = 104_857_600;

/** Accept only the formats the redesigned dropzone advertises. */
export const CANVAS_UPLOAD_ACCEPT = '.csv,.xlsx';

const CANVAS_UPLOAD_ACCEPT_MIME = new Set<string>([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export interface UploadedArtifactResult {
  /** Registry artifact id. */
  artifactId: string;
  /** Original file name, e.g. 'apex-svc-baseline-18mo.xlsx'. */
  originalName: string;
  /** Uppercase format badge, e.g. 'XLSX' / 'CSV'. */
  format: string;
  /** Raw byte size for the meta line. */
  sizeBytes: number;
  /** Parse status returned by the route ('pending' | 'parsed' | …). */
  parseStatus: string | null;
}

export interface UploadArtifactArgs {
  eventId: string;
  file: File;
  /** Canonical stage key, so the artifact is scoped to the right stage. */
  stageKey?: string;
  /**
   * The canvas artifact code this upload lands on (optional). When provided the
   * route also lands the extracted text on that artifact's body + satisfies its
   * gate criteria. Absent → registry-only receipt.
   */
  artifactCode?: string;
  /** Data classification; the canvas defaults to Confidential. */
  classification?: string;
}

/** Format the byte size into a human-readable sub-line, e.g. '2.1 MB'. */
export function formatUploadSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

/** True when the file passes the client-side type + size guard. */
export function isAcceptedCanvasUpload(file: File): {
  ok: boolean;
  reason?: string;
} {
  const name = file.name.toLowerCase();
  const extOk = name.endsWith('.csv') || name.endsWith('.xlsx');
  const mimeOk = file.type ? CANVAS_UPLOAD_ACCEPT_MIME.has(file.type) : true;
  if (!extOk && !mimeOk) {
    return { ok: false, reason: 'Only CSV or XLSX files are accepted.' };
  }
  if (file.size > CANVAS_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      reason: `File exceeds the ${Math.round(
        CANVAS_UPLOAD_MAX_BYTES / (1024 * 1024),
      )} MB limit.`,
    };
  }
  return { ok: true };
}

function formatBadge(originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  if (dot < 0 || dot === originalName.length - 1) return 'FILE';
  return originalName.slice(dot + 1).toUpperCase();
}

/**
 * Upload a file to the governed Source artifacts route. Resolves with the
 * persisted artifact metadata on success; throws with a human-readable message
 * on failure (the caller renders an error, never a fake "uploaded" state).
 */
export async function uploadSourceCanvasArtifact(
  args: UploadArtifactArgs,
): Promise<UploadedArtifactResult> {
  const guard = isAcceptedCanvasUpload(args.file);
  if (!guard.ok) throw new Error(guard.reason ?? 'File rejected.');

  const formData = new FormData();
  formData.append('file', args.file, args.file.name);
  if (args.stageKey) formData.append('stageKey', args.stageKey);
  if (args.artifactCode) formData.append('artifactCode', args.artifactCode);
  const classification = args.classification ?? 'Confidential';
  formData.append('dataClassification', classification);
  formData.append('dataProtectionClassification', classification);
  formData.append('artifactFamily', 'pricing_workbook');

  const uploadHref = `/api/v1/source/${encodeURIComponent(
    args.eventId,
  )}/artifacts/upload`;

  let response: Response;
  try {
    response = await fetch(uploadHref, { method: 'POST', body: formData });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Upload request failed: ${error.message}`
        : 'Upload request failed before reaching the server.',
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    detail?: string;
    error?: string;
    artifact?: {
      id?: string;
      originalName?: string;
      sourceFormat?: string;
      sizeBytes?: number;
      parseStatus?: string | null;
    };
  } | null;

  if (!response.ok || !payload?.artifact?.id) {
    throw new Error(
      payload?.detail ??
        payload?.error ??
        `Upload failed with HTTP ${response.status}.`,
    );
  }

  const artifact = payload.artifact;
  const originalName = artifact.originalName ?? args.file.name;
  return {
    artifactId: artifact.id!,
    originalName,
    format: formatBadge(originalName),
    sizeBytes:
      typeof artifact.sizeBytes === 'number'
        ? artifact.sizeBytes
        : args.file.size,
    parseStatus: artifact.parseStatus ?? null,
  };
}
