import 'server-only';

import path from 'node:path';

import {
  CONTENT_HASH_PARSE_CACHE_VERSION,
  withContentHashParseCache,
} from '@/lib/ingestion/content-hash-parse-cache';
import {
  DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD,
  isDocumentIntelligenceConfigured,
  parsePdfWithDocumentIntelligenceLayout,
} from '@/lib/ingestion/document-intelligence-layout';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const TEXT_MIME_TYPES = new Set(['text/plain', 'text/markdown', 'application/json']);
const MAX_EXTRACTED_TEXT = 60_000;
const PARSER_VERSION = `${CONTENT_HASH_PARSE_CACHE_VERSION}:ingestion-document-upload-v1`;

export interface ParsedIngestionDocument {
  readonly text: string;
  readonly parseMethod: string;
  readonly warnings: string[];
  readonly metadata: {
    readonly mimeType: string;
    readonly extension: string;
    readonly bytesParsed: number;
    readonly pageCount?: number | null;
    readonly tableCount?: number | null;
    readonly slideCount?: number;
    readonly worksheetCount?: number;
    readonly truncated: boolean;
  };
}

export interface ParseIngestionDocumentInput {
  readonly filename: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array | ArrayBuffer | Buffer;
  readonly cacheScope?: string | null;
}

interface RawParseResult {
  readonly text: string;
  readonly parseMethod: string;
  readonly warnings: string[];
  readonly metadata?: Partial<ParsedIngestionDocument['metadata']>;
}

function normalizeBuffer(bytes: Uint8Array | ArrayBuffer | Buffer): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes;
  if (bytes instanceof ArrayBuffer) return Buffer.from(bytes);
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function extension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(/^\./, '');
}

function normalizeMimeType(filename: string, mimeType: string): string {
  const trimmed = mimeType.trim().toLowerCase();
  if (trimmed && trimmed !== 'application/octet-stream') return trimmed;
  switch (extension(filename)) {
    case 'pdf':
      return PDF_MIME;
    case 'docx':
      return DOCX_MIME;
    case 'xlsx':
      return XLSX_MIME;
    case 'pptx':
      return PPTX_MIME;
    case 'md':
      return 'text/markdown';
    case 'json':
      return 'application/json';
    case 'txt':
      return 'text/plain';
    default:
      return trimmed || 'application/octet-stream';
  }
}

export function isSupportedIngestionDocument(args: {
  readonly filename: string;
  readonly mimeType: string;
}): boolean {
  const mimeType = normalizeMimeType(args.filename, args.mimeType);
  return (
    mimeType === PDF_MIME ||
    mimeType === DOCX_MIME ||
    mimeType === XLSX_MIME ||
    mimeType === PPTX_MIME ||
    TEXT_MIME_TYPES.has(mimeType)
  );
}

function compactText(text: string): { text: string; truncated: boolean } {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (normalized.length <= MAX_EXTRACTED_TEXT) {
    return { text: normalized, truncated: false };
  }
  return { text: normalized.slice(0, MAX_EXTRACTED_TEXT), truncated: true };
}

async function parsePdf(buffer: Buffer): Promise<RawParseResult> {
  if (isDocumentIntelligenceConfigured()) {
    try {
      const parsed = await parsePdfWithDocumentIntelligenceLayout(buffer);
      return {
        text: parsed.text,
        parseMethod: DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD,
        warnings: [
          ...parsed.warnings,
          'Azure AI Document Intelligence prebuilt-layout parser used.',
        ],
        metadata: {
          pageCount: parsed.pageCount,
          tableCount: parsed.tableCount,
        },
      };
    } catch (err) {
      const fallback = await parsePdfWithPdfParse(buffer);
      return {
        ...fallback,
        warnings: [
          ...fallback.warnings,
          `Azure AI Document Intelligence failed; pdf-parse fallback used: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ],
      };
    }
  }
  return parsePdfWithPdfParse(buffer);
}

async function parsePdfWithPdfParse(buffer: Buffer): Promise<RawParseResult> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const parsed = await parser.getText();
    return {
      text: parsed.text ?? '',
      parseMethod: 'pdf-parse',
      warnings: [],
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function parseDocx(buffer: Buffer): Promise<RawParseResult> {
  const mammoth = await import('mammoth');
  const parsed = await mammoth.extractRawText({ buffer });
  const warnings = Array.isArray(parsed.messages)
    ? parsed.messages
        .map((msg) =>
          msg && typeof msg === 'object' && 'message' in msg
            ? (msg as { message?: unknown }).message
            : null,
        )
        .filter((msg): msg is string => typeof msg === 'string')
    : [];
  return {
    text: parsed.value ?? '',
    parseMethod: 'docx-mammoth',
    warnings,
  };
}

async function parseXlsx(buffer: Buffer): Promise<RawParseResult> {
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
            if ('text' in value && typeof value.text === 'string') return value.text;
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
  return {
    text: lines.join('\n'),
    parseMethod: 'exceljs-xlsx',
    warnings: [],
    metadata: { worksheetCount: workbook.worksheets.length },
  };
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function parsePptx(buffer: Buffer): Promise<RawParseResult> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const lines: string[] = [];
  for (const [index, slidePath] of slidePaths.entries()) {
    const xml = await zip.files[slidePath]?.async('string');
    if (!xml) continue;
    const text = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
      .map((match) => decodeXmlText(match[1] ?? '').trim())
      .filter(Boolean);
    if (text.length > 0) lines.push(`Slide ${index + 1}: ${text.join(' | ')}`);
  }
  return {
    text: lines.join('\n'),
    parseMethod: 'pptx-jszip',
    warnings: [],
    metadata: { slideCount: slidePaths.length },
  };
}

async function parseByMime(args: {
  readonly filename: string;
  readonly mimeType: string;
  readonly buffer: Buffer;
}): Promise<RawParseResult | null> {
  if (TEXT_MIME_TYPES.has(args.mimeType)) {
    return {
      text: args.buffer.toString('utf-8'),
      parseMethod:
        args.mimeType === 'text/markdown'
          ? 'markdown-text'
          : args.mimeType === 'application/json'
            ? 'json-text'
            : 'plain-text',
      warnings: [],
    };
  }
  if (args.mimeType === PDF_MIME) return parsePdf(args.buffer);
  if (args.mimeType === DOCX_MIME) return parseDocx(args.buffer);
  if (args.mimeType === XLSX_MIME) return parseXlsx(args.buffer);
  if (args.mimeType === PPTX_MIME) return parsePptx(args.buffer);
  return null;
}

export async function parseIngestionDocument(
  input: ParseIngestionDocumentInput,
): Promise<ParsedIngestionDocument | null> {
  const mimeType = normalizeMimeType(input.filename, input.mimeType);
  if (!isSupportedIngestionDocument({ filename: input.filename, mimeType })) {
    return null;
  }
  const buffer = normalizeBuffer(input.bytes);
  const parserMode = mimeType === PDF_MIME && isDocumentIntelligenceConfigured() ? 'azure' : 'local';
  const { value } = await withContentHashParseCache(
    {
      cacheScope: input.cacheScope,
      mimeType,
      parserId: `ingestion-document-upload:${parserMode}`,
      parserVersion: PARSER_VERSION,
      bytes: buffer,
    },
    () => parseByMime({ filename: input.filename, mimeType, buffer }),
  );
  if (!value) return null;
  const compact = compactText(value.text);
  if (!compact.text) {
    throw new Error(`document_parse_empty:${value.parseMethod}`);
  }
  return {
    text: compact.text,
    parseMethod: value.parseMethod,
    warnings: value.warnings,
    metadata: {
      mimeType,
      extension: extension(input.filename),
      bytesParsed: buffer.byteLength,
      truncated: compact.truncated,
      ...value.metadata,
    },
  };
}
