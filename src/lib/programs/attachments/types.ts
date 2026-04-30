// Programs · Attachments · isomorphic type contracts
//
// These types are shared between server (`index.ts`, API routes) and
// client (`upload-client.ts`, the chat composer paper-clip UI). Lives
// in its own file so importing the type doesn't drag in the
// `server-only` boundary that `index.ts` enforces.
//
// Slice: OV2-4b. Source of truth for the shape of `program_attachments`
// rows surfaced through the upload API and rendered as in-conversation
// chips.

export type AttachmentScanStatus =
  | 'pending'
  | 'clean'
  | 'infected'
  | 'errored'
  | 'skipped';

export type AttachmentRedactionState = 'none' | 'partial' | 'redacted';

export interface AttachmentRecord {
  id: string;
  tenantKey: string;
  programId: string;
  phase: number | null;
  stepId: string | null;
  deliverableId: string | null;
  originalName: string;
  storagePath: string;
  uploaderUserId: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  scanStatus: AttachmentScanStatus;
  scanFindings: Record<string, unknown> | null;
  redactionState: AttachmentRedactionState;
  createdAt: string;
  deletedAt: string | null;
}

/**
 * Minimal attachment shape used in chat surfaceContext + in-conversation
 * chip rendering. Excludes server-only fields (sha256, storagePath,
 * scan_findings) the chat surface doesn't need.
 */
export interface AttachmentChipRef {
  id: string;
  programId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export function toAttachmentChipRef(record: AttachmentRecord): AttachmentChipRef {
  return {
    id: record.id,
    programId: record.programId,
    originalName: record.originalName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
  };
}
