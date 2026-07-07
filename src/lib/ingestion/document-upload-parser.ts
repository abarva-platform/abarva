import path from 'node:path';

export interface ParsedIngestionDocumentMetadata {
  filename?: string;
  mimeType?: string | null;
  byteLength?: number;
  cacheScope?: string | null;
  pageCount?: number | null;
  tableCount?: number | null;
  slideCount?: number;
  worksheetCount?: number;
  [key: string]: unknown;
}

export interface ParsedIngestionDocument {
  text: string;
  parseMethod: string;
  warnings: string[];
  metadata: ParsedIngestionDocumentMetadata;
}

export interface IngestionDocumentInput {
  filename: string;
  mimeType?: string | null;
  bytes: Uint8Array | Buffer;
  cacheScope?: string;
}

const SUPPORTED_EXTENSIONS = new Set([
  '.csv',
  '.json',
  '.jsonl',
  '.md',
  '.markdown',
  '.txt',
  '.pdf',
  '.docx',
  '.pptx',
  '.xlsx',
]);

export function isSupportedIngestionDocument(input: Pick<IngestionDocumentInput, 'filename' | 'mimeType'>): boolean {
  const ext = path.extname(input.filename).toLowerCase();
  if (SUPPORTED_EXTENSIONS.has(ext)) return true;
  const mimeType = input.mimeType?.toLowerCase() ?? '';
  return Boolean(
    mimeType.startsWith('text/') ||
      mimeType.includes('json') ||
      mimeType.includes('pdf') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation') ||
      mimeType.includes('wordprocessingml'),
  );
}

export async function parseIngestionDocument(input: IngestionDocumentInput): Promise<ParsedIngestionDocument> {
  const ext = path.extname(input.filename).toLowerCase();
  const buffer = Buffer.from(input.bytes);
  const warnings: string[] = [];
  let text = buffer.toString('utf8').replace(/\u0000/g, ' ').trim();
  let parseMethod = 'text-fallback';

  if (ext === '.csv') parseMethod = 'csv-text';
  else if (ext === '.json' || ext === '.jsonl') parseMethod = 'json-text';
  else if (ext === '.md' || ext === '.markdown') parseMethod = 'markdown-text';
  else if (ext === '.txt') parseMethod = 'plain-text';
  else {
    parseMethod = `${ext.replace('.', '') || 'binary'}-text-fallback`;
    warnings.push('Template-specific binary extraction is not wired in this compatibility parser; review-required fallback text was returned.');
  }

  if (!text) {
    text = `[${input.filename}] No extractable UTF-8 text was produced by the compatibility parser.`;
    warnings.push('No extractable text was found.');
  }

  return {
    text,
    parseMethod,
    warnings,
    metadata: {
      filename: input.filename,
      mimeType: input.mimeType ?? null,
      byteLength: buffer.byteLength,
      cacheScope: input.cacheScope ?? null,
    },
  };
}
