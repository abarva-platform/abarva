// Agent attachments · server-only helpers for the AgentDock upload route.
//
// Mirrors the patterns in `src/lib/programs/attachments` and
// `src/lib/programs/evidence-ingestion.ts` — same parsers, same dynamic
// imports, same defensive empty-string fallbacks. Kept separate because
// the agent surface is generic across products and shouldn't depend on
// the programs-domain envelope.
//
// Spec: this PR · feat(agent): shared AgentDock with 5 modes + Claude-
// style upload (foundation).

import 'server-only';

export const AGENT_ATTACHMENT_BUCKET = 'agent-attachments';

export const AGENT_ATTACHMENT_MIME_ALLOWLIST: readonly string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
];

export const AGENT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export const AGENT_ATTACHMENT_PREVIEW_MAX_CHARS = 4000;

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const TEXT_MIMES = new Set(['text/plain', 'text/markdown', 'text/csv']);
const IMAGE_MIMES = new Set(['image/png', 'image/jpeg']);

export function isAllowedAgentAttachmentMime(mime: string): boolean {
  return AGENT_ATTACHMENT_MIME_ALLOWLIST.includes(mime);
}

/**
 * Best-effort server-side text extraction. NEVER throws — every parser
 * is wrapped in try/catch so a malformed PDF can't tank the upload
 * request. Returns an empty string for images and for parsers that
 * surface no readable text.
 */
export async function extractAgentAttachmentText(args: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<string> {
  try {
    if (TEXT_MIMES.has(args.mimeType)) {
      return args.buffer.toString('utf-8');
    }
    if (IMAGE_MIMES.has(args.mimeType)) {
      // No OCR pipeline yet — skip and let the model handle the image
      // separately if we ever pass binary parts upstream.
      return '';
    }
    if (args.mimeType === PDF_MIME) {
      return await extractPdfText(args.buffer);
    }
    if (args.mimeType === DOCX_MIME) {
      return await extractDocxText(args.buffer);
    }
    if (args.mimeType === XLSX_MIME) {
      return await extractXlsxText(args.buffer);
    }
    return '';
  } catch {
    // Defensive: parser failures should not turn a 200 into a 500.
    return '';
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text ?? '';
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? '';
}

async function extractXlsxText(buffer: Buffer): Promise<string> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const lines: string[] = [];
  workbook.eachSheet((worksheet) => {
    lines.push(`Worksheet: ${worksheet.name}`);
    worksheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      const line = values
        .map((value) => {
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') {
            if ('text' in value && typeof value.text === 'string') {
              return value.text;
            }
            if ('result' in value) return String(value.result ?? '');
            return JSON.stringify(value);
          }
          return String(value);
        })
        .map((value) => value.trim())
        .filter(Boolean)
        .join(' | ');
      if (line) lines.push(line);
    });
  });
  return lines.join('\n');
}

/**
 * Bounded snippet for the system prompt — preserves whole words at the
 * boundary when possible.
 */
export function snipExtractedTextPreview(text: string): string {
  if (!text) return '';
  if (text.length <= AGENT_ATTACHMENT_PREVIEW_MAX_CHARS) return text;
  const head = text.slice(0, AGENT_ATTACHMENT_PREVIEW_MAX_CHARS);
  const minBoundary = Math.floor(AGENT_ATTACHMENT_PREVIEW_MAX_CHARS * 0.75);
  const lastWhitespace = head.search(/\s+\S*$/);
  if (lastWhitespace >= minBoundary) {
    return head.slice(0, lastWhitespace);
  }
  return head;
}

/**
 * Slugify a filename for storage paths. We never trust the client's
 * raw filename — it can contain slashes / NUL / unicode / arbitrary
 * length. Cap at 96 chars.
 */
export function safeStorageFileName(raw: string): string {
  const cleaned = raw
    .replace(/[\\/]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .slice(0, 96);
  return cleaned || 'upload';
}
