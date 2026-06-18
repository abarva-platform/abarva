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

const SUPPORTED_EXTENSIONS = new Set([
  '.csv',
  '.docx',
  '.json',
  '.jsonl',
  '.md',
  '.pdf',
  '.pptx',
  '.txt',
  '.xlsx',
]);

const SUPPORTED_MIME_HINTS = [
  'application/json',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-',
  'text/',
];

function extensionOf(filename: string): string {
  const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

function decodeBestEffort(bytes: Uint8Array | Buffer): string {
  return Buffer.from(bytes)
    .toString('utf8')
    .replace(/\u0000/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
}

export function isSupportedIngestionDocument(input: {
  filename: string;
  mimeType?: string | null;
}): boolean {
  const ext = extensionOf(input.filename);
  if (SUPPORTED_EXTENSIONS.has(ext)) return true;
  const mimeType = input.mimeType?.toLowerCase() ?? '';
  return SUPPORTED_MIME_HINTS.some((hint) => mimeType.startsWith(hint));
}

export async function parseIngestionDocument(input: IngestionDocumentInput): Promise<ParsedIngestionDocument> {
  const ext = extensionOf(input.filename);
  const text = decodeBestEffort(input.bytes);
  const officeOrPdf = ext === '.pdf' || ext === '.docx' || ext === '.pptx' || ext === '.xlsx';
  return {
    text,
    parseMethod: officeOrPdf ? 'binary-text-preview' : 'plain-text',
    warnings: officeOrPdf
      ? ['Best-effort compatibility parser; deterministic source-location extraction requires the governed parser path.']
      : [],
    metadata: {
      filename: input.filename,
      mimeType: input.mimeType ?? null,
      extension: ext || null,
      byteLength: Buffer.byteLength(Buffer.from(input.bytes)),
      cacheScope: input.cacheScope ?? null,
    },
  };
}
