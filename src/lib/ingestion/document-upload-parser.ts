import path from 'node:path';

export interface ParsedIngestionDocument {
  text: string;
  parseMethod: string;
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface IngestionDocumentInput {
  filename: string;
  mimeType?: string | null;
  bytes: Uint8Array | Buffer;
  cacheScope?: string;
}

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 40 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 2000;
const MAX_TEXT_CHARS = 200_000;

const MIME_BY_EXTENSION: Record<string, string> = {
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.jsonl': 'application/x-ndjson',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const EXTENSION_BY_MIME = new Map(Object.entries(MIME_BY_EXTENSION).map(([ext, mime]) => [mime, ext]));
const TEXT_METHOD_BY_EXTENSION: Record<string, string> = {
  '.csv': 'csv-text',
  '.json': 'json-text',
  '.jsonl': 'json-text',
  '.md': 'markdown-text',
  '.markdown': 'markdown-text',
  '.txt': 'plain-text',
};
const ARCHIVE_EXTENSIONS = new Set(['.docx', '.pptx', '.xlsx']);

function documentExtension(input: Pick<IngestionDocumentInput, 'filename' | 'mimeType'>): string | null {
  const ext = path.extname(input.filename).toLowerCase();
  if (ext) return ext in MIME_BY_EXTENSION ? ext : null;
  const mime = input.mimeType?.toLowerCase().split(';', 1)[0].trim();
  return mime ? EXTENSION_BY_MIME.get(mime) ?? null : null;
}

export function isSupportedIngestionDocument(input: Pick<IngestionDocumentInput, 'filename' | 'mimeType'>): boolean {
  return documentExtension(input) !== null;
}

function binarySignature(buffer: Buffer): 'pdf' | 'zip' | null {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b &&
    ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08))) return 'zip';
  return null;
}

async function checkArchiveExpansion(buffer: Buffer, expectedExt: string): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ARCHIVE_ENTRIES) throw new Error('document_parse_too_large: archive entries');
  let expandedBytes = 0;
  for (const entry of entries) {
    if (entry.dir) continue;
    const size = (entry as typeof entry & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (!Number.isSafeInteger(size) || size === undefined || size < 0) {
      throw new Error('document_parse_unsupported: archive size unavailable');
    }
    expandedBytes += size;
    if (expandedBytes > MAX_ARCHIVE_BYTES) throw new Error('document_parse_too_large: archive content');
  }
  const names = new Set(entries.map((entry) => entry.name.toLowerCase()));
  const formats = [
    names.has('word/document.xml') ? '.docx' : null,
    names.has('xl/workbook.xml') ? '.xlsx' : null,
    entries.some((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.name)) ? '.pptx' : null,
  ].filter(Boolean);
  if (formats.length !== 1 || formats[0] !== expectedExt) {
    throw new Error('document_parse_mismatch: Office package type');
  }
}

export async function parseIngestionDocument(input: IngestionDocumentInput): Promise<ParsedIngestionDocument> {
  const ext = documentExtension(input);
  if (!ext) throw new Error('document_parse_unsupported: file type');
  const buffer = Buffer.from(input.bytes);
  if (buffer.byteLength > MAX_INPUT_BYTES) throw new Error('document_parse_too_large: input bytes');
  const reportedMime = input.mimeType?.toLowerCase().split(';', 1)[0].trim();
  if (reportedMime && reportedMime !== 'application/octet-stream' &&
    reportedMime !== 'application/zip' &&
    Object.values(MIME_BY_EXTENSION).includes(reportedMime) &&
    reportedMime !== MIME_BY_EXTENSION[ext] &&
    !(reportedMime === 'text/plain' && ext in TEXT_METHOD_BY_EXTENSION)) {
    throw new Error('document_parse_mismatch: declared MIME type');
  }
  const signature = binarySignature(buffer);
  if ((signature === 'pdf' && ext !== '.pdf') ||
    (signature === 'zip' && !ARCHIVE_EXTENSIONS.has(ext)) ||
    (ext === '.pdf' && signature !== 'pdf') ||
    (ARCHIVE_EXTENSIONS.has(ext) && signature !== 'zip') ||
    (ext in TEXT_METHOD_BY_EXTENSION && buffer.includes(0))) {
    throw new Error('document_parse_mismatch: file signature');
  }
  if (ARCHIVE_EXTENSIONS.has(ext)) await checkArchiveExpansion(buffer, ext);

  const binary = ext === '.pdf' || ARCHIVE_EXTENSIONS.has(ext);
  const extractor = binary
    ? await import('@/lib/source/artifact-registry/upload-text-extraction-core')
    : null;
  const extracted = extractor
    ? await extractor.extractSourceUploadText({ buffer, mimeType: MIME_BY_EXTENSION[ext] })
    : null;
  const rawText = binary ? extracted?.text : buffer.toString('utf8');
  if (!rawText?.trim()) {
    if (extracted?.method === 'unsupported') throw new Error('document_parse_unsupported: binary extractor');
    throw new Error(`document_parse_empty: ${extracted?.method ?? 'text'} returned no readable text`);
  }

  const textLimit = extractor?.MAX_UPLOAD_BODY_CHARS ?? MAX_TEXT_CHARS;
  const text = rawText.trim().slice(0, textLimit);
  const truncated = binary
    ? rawText.length >= textLimit
    : rawText.trim().length > textLimit;
  const warnings = extracted?.warnings ?? [];
  if (truncated) warnings.push(`Extracted text may be limited to ${textLimit} characters.`);

  return {
    text,
    parseMethod: extracted?.method ?? TEXT_METHOD_BY_EXTENSION[ext],
    warnings,
    metadata: {
      filename: input.filename,
      mimeType: MIME_BY_EXTENSION[ext],
      extension: ext.slice(1),
      byteLength: buffer.byteLength,
      cacheScope: input.cacheScope ?? null,
      truncated,
    },
  };
}
