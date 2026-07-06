// Source · uploaded-document text extraction
//
// Turns an uploaded file's bytes into a markdown-ish body that can land on the
// canvas artifact (source_event_artifact_states.body). Text-native formats are
// decoded directly; DOCX is converted via mammoth (already a dependency, used
// by the Programs attachment pipeline). PDF / XLSX / images are not extractable
// here yet — they get a registry row but no artifact body, and the caller keeps
// the artifact as-authored rather than fabricating content.

import 'server-only';

import mammoth from 'mammoth';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Mime types we can decode straight to text. */
const TEXT_MIMES = new Set<string>([
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'application/json',
]);

/** Cap the landed body so a huge upload can't blow past the body column limit. */
export const MAX_UPLOAD_BODY_CHARS = 200_000;

export type UploadExtractionMethod =
  | 'text'
  | 'docx-mammoth'
  | 'unsupported';

export interface ExtractedUploadText {
  /** Extracted body, or null when the format can't be turned into text. */
  text: string | null;
  method: UploadExtractionMethod;
  warnings: string[];
}

function clampBody(raw: string): string | null {
  const text = raw.slice(0, MAX_UPLOAD_BODY_CHARS);
  return text.trim().length > 0 ? text : null;
}

/**
 * Extract a landable text body from an uploaded document. Pure dispatch on the
 * mime type; the only async path is DOCX (mammoth). Never throws — extraction
 * failure returns `{ text: null, ... }` with a warning so the upload still
 * succeeds as a registry row.
 */
export async function extractSourceUploadText(input: {
  buffer: Buffer;
  mimeType: string;
}): Promise<ExtractedUploadText> {
  const { buffer, mimeType } = input;

  if (TEXT_MIMES.has(mimeType)) {
    return { text: clampBody(buffer.toString('utf8')), method: 'text', warnings: [] };
  }

  if (mimeType === DOCX_MIME) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: clampBody(result.value ?? ''),
        method: 'docx-mammoth',
        warnings: (result.messages ?? []).map((m) => m.message),
      };
    } catch (err) {
      return {
        text: null,
        method: 'docx-mammoth',
        warnings: [err instanceof Error ? err.message : 'docx extraction failed'],
      };
    }
  }

  return {
    text: null,
    method: 'unsupported',
    warnings: [`No text extraction for mime "${mimeType || 'unknown'}" — stored as a registry document only.`],
  };
}
