// Admin Loader — parse adapter (Gate 0.5: any uploaded file → ParsedContent).
//
// Turns an arbitrary upload (csv/json/jsonl/yaml/xlsx/pdf/docx/pptx) into the
// `ParsedContent` shape the mapping engine already consumes. Document formats
// (pdf/docx/pptx) are routed through an INJECTABLE `DocumentParser` seam so
// tests never touch Azure; the production wiring supplies `azureDocumentParser`,
// which lazy-wraps Azure AI Document Intelligence layout parsing.
//
// Structured formats (csv/json/jsonl) are parsed in-process with no new npm
// dependencies. YAML and XLSX require optional packages (`yaml`, `xlsx`) that
// are NOT currently dependencies of this repo; when absent they throw a clear,
// namespaced error that callers can surface or fold into a document-text
// fallback. See the context-ingestion truth standard in AGENTS.md: this adapter
// only reports what it can actually extract.

import type { ParsedContent } from './mapping-proposal';

/** Whether parsed content is row/column structured or free text. */
export type ParseKind = 'tabular' | 'document';

/** Concrete file format detected by extension/mime. */
export type ParseFormat =
  | 'csv'
  | 'json'
  | 'jsonl'
  | 'yaml'
  | 'xlsx'
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'unknown';

/**
 * Injectable seam for document-format extraction. Tests pass a stub returning
 * fixed text; production passes `azureDocumentParser()`. The seam keeps Azure
 * (and its `server-only` import) out of the unit test path entirely.
 */
export interface DocumentParser {
  parse(buffer: Buffer): Promise<{ text: string }>;
}

/** Max sample rows surfaced from tabular content (matches mapper expectations). */
const MAX_SAMPLE_ROWS = 20;

/** Normalize an ArrayBuffer | Buffer to a Node Buffer. */
function toBuffer(bytes: ArrayBuffer | Buffer): Buffer {
  if (Buffer.isBuffer(bytes)) return bytes;
  return Buffer.from(new Uint8Array(bytes));
}

/** Lowercased file extension without the dot, or '' when none. */
function extensionOf(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/** Map a content-type/mime to a format when the extension is inconclusive. */
function formatFromContentType(contentType: string): ParseFormat {
  const ct = contentType.toLowerCase().split(';')[0]?.trim() ?? '';
  switch (ct) {
    case 'text/csv':
    case 'application/csv':
      return 'csv';
    case 'application/json':
      return 'json';
    case 'application/jsonl':
    case 'application/x-ndjson':
    case 'application/x-jsonlines':
      return 'jsonl';
    case 'application/yaml':
    case 'text/yaml':
    case 'application/x-yaml':
    case 'text/x-yaml':
      return 'yaml';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return 'xlsx';
    case 'application/pdf':
      return 'pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return 'docx';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.ms-powerpoint':
      return 'pptx';
    default:
      return 'unknown';
  }
}

/** Map an extension to a format. */
function formatFromExtension(ext: string): ParseFormat {
  switch (ext) {
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    case 'jsonl':
    case 'ndjson':
      return 'jsonl';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'pptx':
    case 'ppt':
      return 'pptx';
    default:
      return 'unknown';
  }
}

const TABULAR_FORMATS: ReadonlySet<ParseFormat> = new Set<ParseFormat>([
  'csv',
  'json',
  'jsonl',
  'yaml',
  'xlsx',
]);

/**
 * Classify an upload by extension first, then content-type. Tabular =
 * csv/json/jsonl/yaml/xlsx; document = pdf/docx/pptx. An `unknown` format
 * defaults to the `document` kind (a human must decide what it is, and the
 * document parser is the only path that can extract text from opaque bytes).
 */
export function classifyFileKind(
  filename: string,
  contentType?: string,
): { kind: ParseKind; format: ParseFormat } {
  let format = formatFromExtension(extensionOf(filename));
  if (format === 'unknown' && contentType) {
    format = formatFromContentType(contentType);
  }
  const kind: ParseKind = TABULAR_FORMATS.has(format) ? 'tabular' : 'document';
  return { kind, format };
}

/**
 * Dependency-free CSV parse. Handles quoted fields containing commas, escaped
 * double-quotes (""), and CRLF/CR/LF line endings. Returns an array of rows,
 * each an array of cell strings.
 */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = input.length;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < n) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      endField();
      i += 1;
      continue;
    }
    if (ch === '\r') {
      // Swallow CRLF as a single line break.
      endRow();
      if (input[i + 1] === '\n') i += 2;
      else i += 1;
      continue;
    }
    if (ch === '\n') {
      endRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  // Flush a trailing field/row unless the input ended exactly on a newline with
  // no pending content.
  if (field.length > 0 || row.length > 0) {
    endRow();
  }
  return rows;
}

/** Drop fully-empty trailing rows (common artifact of trailing newlines). */
function dropEmptyRows(rows: string[][]): string[][] {
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function parseTabularCsv(text: string): ParsedContent {
  const rows = dropEmptyRows(parseCsv(text));
  if (rows.length === 0) {
    return { kind: 'tabular', columns: [], sampleRows: [] };
  }
  const columns = rows[0].map((c) => c.trim());
  const sampleRows = rows.slice(1, 1 + MAX_SAMPLE_ROWS).map((r) => {
    const record: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      record[col] = r[idx] ?? '';
    });
    return record;
  });
  return { kind: 'tabular', columns, sampleRows };
}

/** Union of keys across an array of plain objects, preserving first-seen order. */
function unionKeys(records: Array<Record<string, unknown>>): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const rec of records) {
    for (const key of Object.keys(rec)) {
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(key);
      }
    }
  }
  return ordered;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

/** Build tabular ParsedContent from an array of records (JSON / JSONL). */
function tabularFromRecords(records: Array<Record<string, unknown>>): ParsedContent {
  const sampleRows = records.slice(0, MAX_SAMPLE_ROWS);
  return {
    kind: 'tabular',
    columns: unionKeys(records),
    sampleRows,
  };
}

function parseJson(text: string): ParsedContent {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `loader_parse_json_invalid: ${(err as Error).message ?? 'unparseable JSON'}`,
    );
  }
  if (Array.isArray(value)) {
    const records = value.filter(isPlainObject);
    return tabularFromRecords(records);
  }
  if (isPlainObject(value)) {
    return tabularFromRecords([value]);
  }
  // Scalar / array-of-scalars: nothing tabular to map; surface as document text.
  return { kind: 'document', text: text };
}

function parseJsonl(text: string): ParsedContent {
  const records: Array<Record<string, unknown>> = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let value: unknown;
    try {
      value = JSON.parse(trimmed);
    } catch (err) {
      throw new Error(
        `loader_parse_jsonl_invalid: ${(err as Error).message ?? 'unparseable JSONL line'}`,
      );
    }
    if (isPlainObject(value)) records.push(value);
  }
  return tabularFromRecords(records);
}

/**
 * YAML parse. Uses the optional `yaml` package when present; otherwise throws a
 * namespaced error. `yaml` is NOT currently a dependency of this repo, so the
 * default path throws and `parseUpload` folds it into a document-text fallback.
 */
async function parseYaml(text: string): Promise<ParsedContent> {
  let mod: { parse: (src: string) => unknown };
  try {
    // Computed specifier so TypeScript does not try to statically resolve an
    // optional dependency that is not installed (would be TS2307). Runtime
    // import still throws when the package is absent, which we map below.
    const spec = 'yaml';
    mod = (await import(/* webpackIgnore: true */ spec)) as {
      parse: (src: string) => unknown;
    };
  } catch {
    throw new Error('loader_parse_yaml_unavailable');
  }
  const value = mod.parse(text);
  if (Array.isArray(value)) {
    return tabularFromRecords(value.filter(isPlainObject));
  }
  if (isPlainObject(value)) {
    return tabularFromRecords([value]);
  }
  return { kind: 'document', text };
}

/**
 * XLSX parse. Uses the optional `xlsx` package when present; otherwise throws a
 * namespaced error. `xlsx` is NOT currently a dependency of this repo, so the
 * default path throws — callers should surface it rather than silently
 * pretending a spreadsheet was read.
 */
async function parseXlsx(buffer: Buffer): Promise<ParsedContent> {
  let xlsx: {
    read: (data: Buffer, opts: { type: string }) => {
      SheetNames: string[];
      Sheets: Record<string, unknown>;
    };
    utils: {
      sheet_to_json: (
        sheet: unknown,
        opts: { defval: string },
      ) => Array<Record<string, unknown>>;
    };
  };
  try {
    // Computed specifier so TypeScript does not statically resolve an optional
    // dependency that is not installed (would be TS2307).
    const spec = 'xlsx';
    xlsx = (await import(/* webpackIgnore: true */ spec)) as never;
  } catch {
    throw new Error('loader_parse_xlsx_unavailable');
  }
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { kind: 'tabular', columns: [], sampleRows: [] };
  }
  const sheet = workbook.Sheets[firstSheetName];
  const records = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  return tabularFromRecords(records);
}

/**
 * Production DocumentParser backed by Azure AI Document Intelligence layout
 * parsing. The Azure module is imported lazily inside `parse` so this factory
 * (and the broader adapter) can be imported in environments — including unit
 * tests — that never call the document path. The default Azure parser only
 * handles PDF; docx/pptx production wiring should supply a format-appropriate
 * parser that satisfies the same `DocumentParser` interface.
 */
export function azureDocumentParser(): DocumentParser {
  return {
    async parse(buffer: Buffer): Promise<{ text: string }> {
      const { parsePdfWithDocumentIntelligenceLayout } = await import(
        '@/lib/ingestion/document-intelligence-layout'
      );
      const result = await parsePdfWithDocumentIntelligenceLayout(buffer);
      return { text: result.text };
    },
  };
}

/** Resolve the document parser to use, preferring an injected one. */
async function resolveDocumentParser(
  injected?: DocumentParser,
): Promise<DocumentParser> {
  if (injected) return injected;
  const { isDocumentIntelligenceConfigured } = await import(
    '@/lib/ingestion/document-intelligence-layout'
  );
  if (!isDocumentIntelligenceConfigured()) {
    throw new Error('loader_parse_document_parser_unavailable');
  }
  return azureDocumentParser();
}

/**
 * Parse any uploaded file into `ParsedContent`.
 *
 * - Structured (csv/json/jsonl) is parsed in-process.
 * - YAML/XLSX use optional packages; when those are absent, YAML folds into a
 *   document-text fallback and XLSX surfaces `loader_parse_xlsx_unavailable`.
 * - Document formats (pdf/docx/pptx) route through the injected `documentParser`
 *   (or the configured Azure parser). With neither available, throws
 *   `loader_parse_document_parser_unavailable`.
 * - `unknown` format also routes through the document parser, treating the bytes
 *   as a document to extract text from.
 */
export async function parseUpload(args: {
  filename: string;
  contentType?: string;
  bytes: ArrayBuffer | Buffer;
  documentParser?: DocumentParser;
}): Promise<ParsedContent> {
  const { filename, contentType, bytes, documentParser } = args;
  const buffer = toBuffer(bytes);
  const { kind, format } = classifyFileKind(filename, contentType);

  if (kind === 'tabular') {
    switch (format) {
      case 'csv':
        return parseTabularCsv(buffer.toString('utf8'));
      case 'json':
        return parseJson(buffer.toString('utf8'));
      case 'jsonl':
        return parseJsonl(buffer.toString('utf8'));
      case 'yaml':
        try {
          return await parseYaml(buffer.toString('utf8'));
        } catch (err) {
          if ((err as Error).message === 'loader_parse_yaml_unavailable') {
            // Fallback: treat the raw YAML as document text so it can still be
            // preserved and human-mapped rather than dropped.
            return { kind: 'document', text: buffer.toString('utf8') };
          }
          throw err;
        }
      case 'xlsx':
        return await parseXlsx(buffer);
      default:
        // Should not happen — tabular kind implies a tabular format.
        return { kind: 'document', text: buffer.toString('utf8') };
    }
  }

  // Document kind (pdf/docx/pptx) and unknown formats: route through the parser.
  const parser = await resolveDocumentParser(documentParser);
  const { text } = await parser.parse(buffer);
  return { kind: 'document', text };
}
