// Programs · Attachments · server-side text extraction (OV2-4c).
//
// Lane 2 of slice OV2-4c: when the agent receives a chat turn whose
// surfaceContext carries attachment chips, the route resolves them to
// AttachmentRecords and runs each through `extractAttachmentText`. Plain
// text and markdown are read directly; DOCX is converted via `mammoth`'s
// `extractRawText`. Other binary formats (PDF, XLSX, PPTX, images, audio,
// video) return null — those require richer pipelines (vision, layout,
// OCR, transcription) and are deferred to follow-on slices.
//
// Bounded snippet length keeps the system prompt small. We cap at
// SNIPPET_MAX_CHARS (~3000 chars / ~750 tokens) and trim to the last
// whitespace boundary so we don't slice mid-word.
//
// Spec: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section B.4 (file uploads cross-cutting), slice OV2-4c.

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import type { AttachmentRecord } from './index';

const STORAGE_BUCKET = 'program-attachments';
const SIGNED_URL_TTL_SECONDS = 60;

/** Maximum characters of parsed text we surface in the system prompt. */
export const SNIPPET_MAX_CHARS = 3000;

export type AttachmentParsingMethod =
  | 'plain'
  | 'markdown'
  | 'docx-mammoth'
  | 'unsupported';

export interface AttachmentTextPreview {
  attachmentId: string;
  originalName: string;
  mimeType: string;
  /** Up to ~3000 chars of human-readable text, trimmed to a whitespace boundary. */
  parsedTextSnippet: string;
  /** True when the underlying text was longer than SNIPPET_MAX_CHARS. */
  truncated: boolean;
  parsingMethod: AttachmentParsingMethod;
  /** Non-fatal warnings (e.g. mammoth conversion warnings). */
  warnings: string[];
}

const PLAIN_TEXT_MIME = 'text/plain';
const MARKDOWN_MIME = 'text/markdown';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Mime types we know how to parse server-side. */
function isParseableMimeType(mime: string): boolean {
  return (
    mime === PLAIN_TEXT_MIME || mime === MARKDOWN_MIME || mime === DOCX_MIME
  );
}

/**
 * Trim a string to ~maxChars, preferring the last whitespace boundary so
 * we never slice mid-word. Returns the original string when it already
 * fits within the cap.
 */
function snipToBoundary(
  text: string,
  maxChars: number,
): { snippet: string; truncated: boolean } {
  if (text.length <= maxChars) {
    return { snippet: text, truncated: false };
  }
  const head = text.slice(0, maxChars);
  // Look for the last whitespace in the LAST quarter of the slice so we
  // don't drop too much when the string has long unbroken stretches.
  const minBoundary = Math.floor(maxChars * 0.75);
  const lastWhitespace = head.search(/\s+\S*$/);
  if (lastWhitespace >= minBoundary) {
    return { snippet: head.slice(0, lastWhitespace), truncated: true };
  }
  return { snippet: head, truncated: true };
}

/**
 * Fetch the file's bytes via a short-lived signed URL. The service-role
 * client bypasses RLS at the storage layer, so we never trust the
 * client to supply a path or a URL — only the AttachmentRecord's own
 * `storagePath`, which was assigned server-side at upload time.
 */
async function fetchAttachmentBytes(attachment: AttachmentRecord): Promise<Buffer> {
  const sb = getServerSupabase();
  const { data, error } = await sb.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(attachment.storagePath, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error(
      `[attachments/extract-text] signed_url_failed: ${error?.message ?? 'no signed url'}`,
    );
  }

  const res = await fetch(data.signedUrl);
  if (!res.ok) {
    throw new Error(
      `[attachments/extract-text] storage_fetch_failed: status ${res.status}`,
    );
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/**
 * Returns up to ~3000 chars of human-readable text from the attachment's
 * stored content. Reads via signed URL; never trusts the client. For
 * unsupported mime types, returns null.
 *
 * Plain text and markdown: read directly (no markdown parsing — the agent
 * gets the raw source as the snippet).
 * DOCX: use `mammoth.extractRawText` with a Buffer input.
 * Other (PDF, XLSX, PPTX, images, audio, video): return null — these
 * require richer pipelines deferred to follow-on slices.
 *
 * Failures are non-fatal at the call site: the agent route catches and
 * logs, then renders the attachment-name-only path.
 */
export async function extractAttachmentText(
  attachment: AttachmentRecord,
): Promise<AttachmentTextPreview | null> {
  if (!isParseableMimeType(attachment.mimeType)) {
    return null;
  }

  const bytes = await fetchAttachmentBytes(attachment);
  const warnings: string[] = [];

  let rawText: string;
  let parsingMethod: AttachmentParsingMethod;

  if (attachment.mimeType === PLAIN_TEXT_MIME) {
    rawText = bytes.toString('utf-8');
    parsingMethod = 'plain';
  } else if (attachment.mimeType === MARKDOWN_MIME) {
    rawText = bytes.toString('utf-8');
    parsingMethod = 'markdown';
  } else {
    // DOCX — dynamic import keeps the dep out of the cold path for
    // routes that never see a docx upload.
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: bytes });
    rawText = result.value ?? '';
    parsingMethod = 'docx-mammoth';
    if (Array.isArray(result.messages)) {
      for (const msg of result.messages) {
        if (msg && typeof msg === 'object' && 'message' in msg) {
          const m = (msg as { message?: unknown }).message;
          if (typeof m === 'string') warnings.push(m);
        }
      }
    }
  }

  // Normalize Windows line endings, collapse runs of blank lines so the
  // snippet doesn't waste budget on whitespace.
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const { snippet, truncated } = snipToBoundary(normalized, SNIPPET_MAX_CHARS);

  return {
    attachmentId: attachment.id,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    parsedTextSnippet: snippet,
    truncated,
    parsingMethod,
    warnings,
  };
}
