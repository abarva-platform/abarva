// Programs · Attachments · server helpers
//
// Slice OV2-4a · data-layer only. No UI, no upload API, no virus-scan
// worker. Caller (the eventual upload API in OV2-4b) is responsible
// for the actual storage.objects upload — these helpers persist /
// query / soft-delete the metadata row on `program_attachments`.
//
// Spec: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section B.4 (file uploads) and Part G (slice OV2-4).

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import {
  ATTACHMENT_MIME_ALLOWLIST,
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './mime';
import type {
  AttachmentRecord,
  AttachmentRedactionState,
  AttachmentScanStatus,
} from './types';

// Re-export the isomorphic type contracts so existing server-side
// importers (`from '@/lib/programs/attachments'`) keep working without
// reaching into ./types directly. The client-side uploader imports
// from ./types directly to avoid pulling the server-only boundary.
export type { AttachmentRecord, AttachmentRedactionState, AttachmentScanStatus } from './types';

export interface CreateAttachmentInput {
  tenantKey: string;
  programId: string;
  phase?: number;
  stepId?: string;
  deliverableId?: string;
  originalName: string;
  uploaderUserId: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storagePath: string;
  scanStatus?: AttachmentScanStatus;
  scanFindings?: Record<string, unknown> | null;
}

interface AttachmentRow {
  id: string;
  tenant_key: string;
  program_id: string;
  phase: number | null;
  step_id: string | null;
  deliverable_id: string | null;
  original_name: string;
  storage_path: string;
  uploader_user_id: string;
  mime_type: string;
  size_bytes: number | string; // bigint can come back as string from PostgREST
  sha256: string;
  scan_status: AttachmentScanStatus;
  scan_findings: Record<string, unknown> | null;
  redaction_state: AttachmentRedactionState;
  created_at: string;
  deleted_at: string | null;
}

const SELECT_COLUMNS =
  'id, tenant_key, program_id, phase, step_id, deliverable_id, original_name, storage_path, uploader_user_id, mime_type, size_bytes, sha256, scan_status, scan_findings, redaction_state, created_at, deleted_at';

const VALID_SCAN_STATUSES = new Set<AttachmentScanStatus>([
  'pending',
  'clean',
  'infected',
  'errored',
  'skipped',
]);

function rowToRecord(row: AttachmentRow): AttachmentRecord {
  const sizeBytes =
    typeof row.size_bytes === 'string' ? Number(row.size_bytes) : row.size_bytes;
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    programId: row.program_id,
    phase: row.phase,
    stepId: row.step_id,
    deliverableId: row.deliverable_id,
    originalName: row.original_name,
    storagePath: row.storage_path,
    uploaderUserId: row.uploader_user_id,
    mimeType: row.mime_type,
    sizeBytes,
    sha256: row.sha256,
    scanStatus: row.scan_status,
    scanFindings: row.scan_findings,
    redactionState: row.redaction_state,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}

function validateInput(input: CreateAttachmentInput): void {
  if (!input.tenantKey) throw new Error('[attachments] tenantKey is required');
  if (!input.programId) throw new Error('[attachments] programId is required');
  if (!input.originalName) throw new Error('[attachments] originalName is required');
  if (!input.uploaderUserId) throw new Error('[attachments] uploaderUserId is required');
  if (!input.storagePath) throw new Error('[attachments] storagePath is required');
  if (!input.sha256) throw new Error('[attachments] sha256 is required');
  if (!isAllowedMimeType(input.mimeType)) {
    throw new Error(
      `[attachments] mimeType "${input.mimeType}" is not in the allowlist (${ATTACHMENT_MIME_ALLOWLIST.length} types)`,
    );
  }
  if (!isWithinSizeLimit(input.sizeBytes)) {
    throw new Error(
      `[attachments] sizeBytes ${input.sizeBytes} exceeds 0 < size <= ${MAX_ATTACHMENT_SIZE_BYTES}`,
    );
  }
  if (
    input.phase !== undefined &&
    input.phase !== null &&
    (input.phase < 0 || input.phase > 6 || !Number.isInteger(input.phase))
  ) {
    throw new Error(`[attachments] phase ${input.phase} must be an integer in [0,6]`);
  }
  if (input.scanStatus && !VALID_SCAN_STATUSES.has(input.scanStatus)) {
    throw new Error(`[attachments] scanStatus "${input.scanStatus}" is not valid`);
  }
}

/**
 * Persist an attachment metadata row AFTER the file was uploaded to
 * the storage bucket. Validates mime + size. Caller is responsible
 * for the actual storage upload (handled by the OV2-4b upload API).
 *
 * Returns the inserted row with defaults populated (`scan_status:
 * 'pending'` unless explicitly supplied, `redaction_state: 'none'`,
 * `created_at` server-side).
 */
export async function recordAttachmentUpload(
  input: CreateAttachmentInput,
): Promise<AttachmentRecord> {
  validateInput(input);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_attachments')
    .insert({
      tenant_key: input.tenantKey,
      program_id: input.programId,
      phase: input.phase ?? null,
      step_id: input.stepId ?? null,
      deliverable_id: input.deliverableId ?? null,
      original_name: input.originalName,
      storage_path: input.storagePath,
      uploader_user_id: input.uploaderUserId,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      sha256: input.sha256,
      ...(input.scanStatus
        ? {
            scan_status: input.scanStatus,
            scan_findings: input.scanFindings ?? null,
          }
        : {}),
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return rowToRecord(data as AttachmentRow);
}

export async function listAttachmentsForProgram(
  programId: string,
): Promise<AttachmentRecord[]> {
  if (!programId) throw new Error('[attachments] programId is required');
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_attachments')
    .select(SELECT_COLUMNS)
    .eq('program_id', programId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as AttachmentRow[] | null) ?? []).map(rowToRecord);
}

export async function listAttachmentsForPhase(
  programId: string,
  phase: number,
): Promise<AttachmentRecord[]> {
  if (!programId) throw new Error('[attachments] programId is required');
  if (!Number.isInteger(phase) || phase < 0 || phase > 6) {
    throw new Error(`[attachments] phase ${phase} must be an integer in [0,6]`);
  }
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_attachments')
    .select(SELECT_COLUMNS)
    .eq('program_id', programId)
    .eq('phase', phase)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as AttachmentRow[] | null) ?? []).map(rowToRecord);
}

export async function getAttachment(
  attachmentId: string,
): Promise<AttachmentRecord | null> {
  if (!attachmentId) throw new Error('[attachments] attachmentId is required');
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_attachments')
    .select(SELECT_COLUMNS)
    .eq('id', attachmentId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRecord(data as AttachmentRow) : null;
}

/**
 * Soft-delete an attachment row by setting `deleted_at`. The bytes in
 * the storage bucket are reaped by a separate retention job (OV2-4c).
 * RLS denies user-level UPDATE on this table; this helper relies on
 * the service-role client returned by getServerSupabase.
 */
export async function softDeleteAttachment(
  attachmentId: string,
  actingUserId: string,
): Promise<AttachmentRecord> {
  if (!attachmentId) throw new Error('[attachments] attachmentId is required');
  if (!actingUserId) throw new Error('[attachments] actingUserId is required');
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', attachmentId)
    .is('deleted_at', null)
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return rowToRecord(data as AttachmentRow);
}

const MAX_STORAGE_PATH_LENGTH = 200;

// Strip ASCII control characters (0x00-0x1F) and DEL (0x7F). Built
// dynamically so the source bytes stay printable and the regex
// passes ESLint's no-control-regex rule.
const CONTROL_CHAR_RE = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(0x1f)}${String.fromCharCode(0x7f)}]`,
  'g',
);

/**
 * Compute the canonical storage path for a tenant/program/attachment.
 * Pattern: {tenantKey}/{programId}/{attachmentId}/{safeFilename}.
 *
 * Sanitization:
 *   - Strips control characters (0x00-0x1F, 0x7F).
 *   - Replaces path separators ('/' and '\\') with '_'.
 *   - Replaces whitespace runs with a single '_'.
 *   - Strips leading/trailing dots and underscores (avoid hidden
 *     files and pure-separator names).
 *   - Lowercases the file extension only (preserves the base name's
 *     case so users can recognize their file).
 *   - Caps the *whole path* to MAX_STORAGE_PATH_LENGTH (200) chars by
 *     trimming the basename — never the prefix segments — preserving
 *     the extension where possible.
 *   - Rejects empty/whitespace-only filenames.
 */
export function buildStoragePath(args: {
  tenantKey: string;
  programId: string;
  attachmentId: string;
  filename: string;
}): string {
  const { tenantKey, programId, attachmentId, filename } = args;
  if (!tenantKey) throw new Error('[attachments] tenantKey is required');
  if (!programId) throw new Error('[attachments] programId is required');
  if (!attachmentId) throw new Error('[attachments] attachmentId is required');
  if (!filename || !filename.trim()) {
    throw new Error('[attachments] filename is required and cannot be empty');
  }

  // 1. Strip control characters + NUL.
  let safe = filename.replace(CONTROL_CHAR_RE, '');
  // 2. Replace path separators.
  safe = safe.replace(/[/\\]/g, '_');
  // 3. Collapse whitespace runs.
  safe = safe.replace(/\s+/g, '_');
  // 4. Strip leading/trailing dots and underscores.
  safe = safe.replace(/^[._]+/, '').replace(/[._]+$/, '');
  if (!safe) {
    throw new Error('[attachments] filename produced an empty sanitized name');
  }

  // 5. Lowercase the extension only.
  const dotIdx = safe.lastIndexOf('.');
  if (dotIdx > 0 && dotIdx < safe.length - 1) {
    const base = safe.slice(0, dotIdx);
    const ext = safe.slice(dotIdx + 1).toLowerCase();
    safe = `${base}.${ext}`;
  }

  const prefix = `${tenantKey}/${programId}/${attachmentId}/`;
  const fullLen = prefix.length + safe.length;
  if (fullLen <= MAX_STORAGE_PATH_LENGTH) {
    return `${prefix}${safe}`;
  }

  // 6. Trim the basename to fit, preserving the extension where
  // possible.
  const room = MAX_STORAGE_PATH_LENGTH - prefix.length;
  if (room <= 0) {
    throw new Error(
      `[attachments] prefix already exceeds ${MAX_STORAGE_PATH_LENGTH} chars`,
    );
  }
  const dotIdx2 = safe.lastIndexOf('.');
  if (dotIdx2 > 0 && dotIdx2 < safe.length - 1) {
    const ext2 = safe.slice(dotIdx2); // includes the dot
    if (ext2.length >= room) {
      // No room for any base; truncate the whole tail.
      return `${prefix}${safe.slice(0, room)}`;
    }
    const baseRoom = room - ext2.length;
    return `${prefix}${safe.slice(0, baseRoom)}${ext2}`;
  }
  return `${prefix}${safe.slice(0, room)}`;
}
