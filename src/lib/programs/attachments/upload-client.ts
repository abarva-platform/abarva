'use client';

// Programs · Attachments · client uploader · OV2-4b
//
// Browser helper that POSTs a multipart/form-data body to the upload
// API route. Why this lives in `lib/programs/attachments/upload-client.ts`
// rather than alongside server helpers in `index.ts`:
//
//   - `index.ts` imports `'server-only'`, which would explode if pulled
//     into a client component bundle.
//   - The upload client only needs the AttachmentRecord type, which we
//     factored out into `./types` so both sides import it cleanly.
//
// XHR-not-fetch: we use XMLHttpRequest so the caller can subscribe to
// `xhr.upload.onprogress` and update the pending-attachment chip with
// a percentage. fetch() doesn't expose request-body progress events
// (you can poll readable streams for response progress, but the
// upload side is opaque).
//
// Pre-flight: mime + size are checked client-side BEFORE the network
// round-trip — saves bandwidth and gives the user immediate feedback
// on impossible files. The server still re-validates because client
// checks aren't a security boundary.

import { isAllowedMimeType, isWithinSizeLimit } from './mime';
import type { AttachmentRecord } from './types';

export interface UploadAttachmentOptions {
  programId: string;
  file: File;
  /** Optional anchor — phase 0..6 the upload belongs to. */
  phase?: number;
  /** Optional anchor — step id within the phase. */
  stepId?: string;
  /** Optional anchor — specific deliverable. */
  deliverableId?: string;
  /**
   * Progress callback. Fires as bytes are pushed up the wire — chip
   * UIs can render a percent bar or a spinner. Will not fire if the
   * client aborts pre-flight (no network round-trip).
   */
  onProgress?: (loaded: number, total: number) => void;
}

export interface UploadAttachmentResult {
  ok: true;
  attachment: AttachmentRecord;
}

export type UploadAttachmentErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'oversize'
  | 'unsupported_mime'
  | 'network'
  | 'unknown';

export interface UploadAttachmentError {
  ok: false;
  code: UploadAttachmentErrorCode;
  message: string;
  /** Optional HTTP status when the failure came from the server. */
  status?: number;
}

const ENDPOINT_BASE = '/api/programs';

function statusToCode(status: number): UploadAttachmentErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 413) return 'oversize';
  if (status === 415) return 'unsupported_mime';
  return 'unknown';
}

function safeParseError(body: string): { error?: string; detail?: string } {
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      return parsed as { error?: string; detail?: string };
    }
  } catch {
    // body wasn't JSON — fall through
  }
  return {};
}

/**
 * Upload a single attachment to a program. Returns a discriminated
 * union — callers should branch on `result.ok`. Never throws under
 * normal conditions; only programmer errors (e.g. invalid programId
 * arg) bubble up via Promise.reject.
 */
export async function uploadAttachment(
  opts: UploadAttachmentOptions,
): Promise<UploadAttachmentResult | UploadAttachmentError> {
  const { programId, file, phase, stepId, deliverableId, onProgress } = opts;

  if (!programId) {
    return { ok: false, code: 'unknown', message: 'programId is required' };
  }
  if (!file) {
    return { ok: false, code: 'unknown', message: 'file is required' };
  }

  // Pre-flight · mime allowlist. The browser-supplied file.type can be
  // empty for unusual extensions; we treat empty as unsupported.
  const mime = file.type || '';
  if (!mime || !isAllowedMimeType(mime)) {
    return {
      ok: false,
      code: 'unsupported_mime',
      message: `File type "${mime || 'unknown'}" is not supported.`,
    };
  }

  // Pre-flight · size cap.
  if (!isWithinSizeLimit(file.size)) {
    return {
      ok: false,
      code: 'oversize',
      message: `File is too large (max 100 MB).`,
    };
  }

  const formData = new FormData();
  formData.append('file', file, file.name);
  if (phase !== undefined) formData.append('phase', String(phase));
  if (stepId) formData.append('stepId', stepId);
  if (deliverableId) formData.append('deliverableId', deliverableId);

  const url = `${ENDPOINT_BASE}/${encodeURIComponent(programId)}/attachments/upload`;

  return new Promise<UploadAttachmentResult | UploadAttachmentError>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.responseType = 'text';
    // Same-origin fetch sends cookies by default; XHR needs withCredentials
    // explicitly so the Clerk session cookie reaches the route.
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.onprogress = (evt: ProgressEvent<EventTarget>) => {
        if (evt.lengthComputable) {
          onProgress(evt.loaded, evt.total);
        }
      };
    }

    xhr.onerror = () => {
      resolve({
        ok: false,
        code: 'network',
        message: 'Network error during upload.',
      });
    };

    xhr.onabort = () => {
      resolve({
        ok: false,
        code: 'network',
        message: 'Upload was cancelled.',
      });
    };

    xhr.onload = () => {
      const status = xhr.status;
      const bodyText = typeof xhr.responseText === 'string' ? xhr.responseText : '';
      if (status >= 200 && status < 300) {
        try {
          const parsed = JSON.parse(bodyText);
          const attachment = (parsed as { attachment?: AttachmentRecord }).attachment;
          if (!attachment) {
            resolve({
              ok: false,
              code: 'unknown',
              message: 'Upload succeeded but response was missing attachment data.',
              status,
            });
            return;
          }
          resolve({ ok: true, attachment });
        } catch {
          resolve({
            ok: false,
            code: 'unknown',
            message: 'Upload succeeded but response could not be parsed.',
            status,
          });
        }
        return;
      }

      const parsed = safeParseError(bodyText);
      const code = statusToCode(status);
      const detail = parsed.detail || parsed.error;
      const friendly = (() => {
        if (code === 'unauthorized') return 'Sign in required to upload.';
        if (code === 'forbidden') return 'You do not have access to this program.';
        if (code === 'oversize') return 'File is too large (max 100 MB).';
        if (code === 'unsupported_mime') return 'File type is not supported.';
        return detail || 'Upload failed.';
      })();
      resolve({ ok: false, code, message: friendly, status });
    };

    xhr.send(formData);
  });
}
