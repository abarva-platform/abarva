// Source · uploaded-document text extraction
//
// Turns an uploaded file's bytes into a markdown-ish body that can land on the
// canvas artifact (source_event_artifact_states.body). Text-native formats are
// decoded directly; Office/PDF binaries are converted deterministically from the
// text actually present in the file. Images/media remain registry-only until a
// governed OCR/transcription worker exists.

import 'server-only';

import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const MAX_BINARY_PARSE_PAGES = 50;
const MAX_WORKBOOK_SHEETS = 8;
const MAX_WORKBOOK_ROWS_PER_SHEET = 200;
const MAX_WORKBOOK_COLUMNS = 40;
const MAX_PRESENTATION_SLIDES = 120;

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
  | 'pdf-parse'
  | 'xlsx-exceljs'
  | 'pptx-jszip'
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

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  const obj = value as Record<string, unknown>;
  if ('result' in obj) return cellText(obj.result);
  if (Array.isArray(obj.richText)) {
    return obj.richText
      .map((part) => cellText((part as { text?: unknown }).text))
      .join('');
  }
  if ('text' in obj) return cellText(obj.text);
  return '';
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
}

async function extractXlsxText(buffer: Buffer): Promise<{
  text: string | null;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheets = workbook.worksheets.slice(0, MAX_WORKBOOK_SHEETS);
  if (workbook.worksheets.length > sheets.length) {
    warnings.push(
      `Workbook truncated to first ${MAX_WORKBOOK_SHEETS} sheets for synchronous evidence parsing.`,
    );
  }

  const sections: string[] = [];
  for (const sheet of sheets) {
    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      if (rows.length >= MAX_WORKBOOK_ROWS_PER_SHEET) return;
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      const cells = values
        .slice(0, MAX_WORKBOOK_COLUMNS)
        .map((value) => escapeMarkdownCell(cellText(value)));
      if (cells.some(Boolean)) rows.push(cells);
    });
    if (sheet.rowCount > MAX_WORKBOOK_ROWS_PER_SHEET) {
      warnings.push(
        `Worksheet "${sheet.name}" truncated to first ${MAX_WORKBOOK_ROWS_PER_SHEET} non-empty rows.`,
      );
    }
    if (rows.length === 0) continue;
    const width = Math.max(...rows.map((row) => row.length));
    const normalized = rows.map((row) =>
      Array.from({ length: width }, (_, index) => row[index] ?? ''),
    );
    const header = normalized[0];
    const separator = header.map(() => '---');
    const body = normalized
      .map((row) => `| ${row.join(' | ')} |`)
      .join('\n');
    sections.push(
      [`## Worksheet: ${sheet.name}`, `| ${header.join(' | ')} |`, `| ${separator.join(' | ')} |`, ...body.split('\n').slice(1)].join('\n'),
    );
  }

  return { text: clampBody(sections.join('\n\n')), warnings };
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function textFromPptxXml(xml: string): string {
  const parts: string[] = [];
  const pattern = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml)) !== null) {
    const text = decodeXmlEntities(match[1] ?? '').trim();
    if (text) parts.push(text);
  }
  return parts.join('\n');
}

function slideIndex(path: string): number {
  const match = path.match(/slide(\d+)\.xml$/);
  return Number(match?.[1] ?? Number.MAX_SAFE_INTEGER);
}

async function extractPptxText(buffer: Buffer): Promise<{
  text: string | null;
  warnings: string[];
}> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.values(zip.files)
    .filter((file) => /^ppt\/slides\/slide\d+\.xml$/i.test(file.name))
    .sort((a, b) => slideIndex(a.name) - slideIndex(b.name))
    .slice(0, MAX_PRESENTATION_SLIDES);

  const warnings: string[] = [];
  if (slideFiles.length === MAX_PRESENTATION_SLIDES) {
    const totalSlides = Object.values(zip.files).filter((file) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(file.name),
    ).length;
    if (totalSlides > MAX_PRESENTATION_SLIDES) {
      warnings.push(
        `Presentation truncated to first ${MAX_PRESENTATION_SLIDES} slides for synchronous evidence parsing.`,
      );
    }
  }

  const sections: string[] = [];
  for (const file of slideFiles) {
    const xml = await file.async('string');
    const text = textFromPptxXml(xml);
    if (text) sections.push(`## Slide ${slideIndex(file.name)}\n${text}`);
  }
  return { text: clampBody(sections.join('\n\n')), warnings };
}

async function extractPdfText(buffer: Buffer): Promise<{
  text: string | null;
  warnings: string[];
}> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({ first: MAX_BINARY_PARSE_PAGES });
    const warnings =
      result.total > MAX_BINARY_PARSE_PAGES
        ? [
            `PDF truncated to first ${MAX_BINARY_PARSE_PAGES} pages for synchronous evidence parsing.`,
          ]
        : [];
    return { text: clampBody(result.text ?? ''), warnings };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
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

  if (mimeType === XLSX_MIME) {
    try {
      const result = await extractXlsxText(buffer);
      return {
        text: result.text,
        method: 'xlsx-exceljs',
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        text: null,
        method: 'xlsx-exceljs',
        warnings: [err instanceof Error ? err.message : 'xlsx extraction failed'],
      };
    }
  }

  if (mimeType === PPTX_MIME) {
    try {
      const result = await extractPptxText(buffer);
      return {
        text: result.text,
        method: 'pptx-jszip',
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        text: null,
        method: 'pptx-jszip',
        warnings: [err instanceof Error ? err.message : 'pptx extraction failed'],
      };
    }
  }

  if (mimeType === 'application/pdf') {
    try {
      const result = await extractPdfText(buffer);
      return {
        text: result.text,
        method: 'pdf-parse',
        warnings: result.warnings,
      };
    } catch (err) {
      return {
        text: null,
        method: 'pdf-parse',
        warnings: [err instanceof Error ? err.message : 'pdf extraction failed'],
      };
    }
  }

  return {
    text: null,
    method: 'unsupported',
    warnings: [`No text extraction for mime "${mimeType || 'unknown'}" — stored as a registry document only.`],
  };
}
