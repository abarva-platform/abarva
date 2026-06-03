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

import "server-only";

import { createHash } from "node:crypto";
import {
  CONTENT_HASH_PARSE_CACHE_VERSION,
  withContentHashParseCache,
} from "@/lib/ingestion/content-hash-parse-cache";
import {
  DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD,
  isDocumentIntelligenceConfigured,
  parsePdfWithDocumentIntelligenceLayout,
} from "@/lib/ingestion/document-intelligence-layout";

export const AGENT_ATTACHMENT_BUCKET = "agent-attachments";

export const AGENT_ATTACHMENT_MIME_ALLOWLIST: readonly string[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
];

export const AGENT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export const AGENT_ATTACHMENT_PREVIEW_MAX_CHARS = 4000;

export const AGENT_SMALL_DOC_NATIVE_PDF_DEFAULT_MAX_BYTES = 500 * 1024;
export const AGENT_SMALL_DOC_NATIVE_PDF_DEFAULT_MAX_PAGES_EXCLUSIVE = 4;
export const AGENT_RAW_MODE_TOKEN_ESTIMATE_BYTES_PER_TOKEN = 3;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const TEXT_MIMES = new Set(["text/plain", "text/markdown", "text/csv"]);
const IMAGE_MIMES = new Set(["image/png", "image/jpeg"]);
const AGENT_ATTACHMENT_PARSER_VERSION = `${CONTENT_HASH_PARSE_CACHE_VERSION}:agent-attachment-v1`;

export type AgentAttachmentSmallDocumentShortcutReason =
  | "not_pdf"
  | "over_size_threshold"
  | "page_count_unavailable"
  | "over_page_threshold"
  | "small_pdf_under_configured_thresholds";

export interface AgentAttachmentSmallDocumentShortcut {
  eligible: boolean;
  route: "claude-native-pdf" | "parser";
  reason: AgentAttachmentSmallDocumentShortcutReason;
  byteSize: number;
  pageCount: number | null;
  thresholds: {
    maxBytes: number;
    maxPagesExclusive: number;
  };
}

export interface AgentAttachmentRawModeEscape {
  eligible: boolean;
  requiresUserApproval: true;
  route: "claude-native-pdf";
  reason: "pdf_native_last_resort" | "not_pdf";
  estimatedTokensPerTurn: number;
  parserBugTicketId: string | null;
  costWarning: string;
}

export interface AgentAttachmentParseMetadata {
  pageCount: number | null;
  tableCount: number | null;
  parserId: string | null;
  smallDocumentShortcut: AgentAttachmentSmallDocumentShortcut | null;
  rawModeEscape: AgentAttachmentRawModeEscape | null;
}

export interface AgentAttachmentParseResult {
  text: string;
  metadata: AgentAttachmentParseMetadata;
}

export function isAllowedAgentAttachmentMime(mime: string): boolean {
  return AGENT_ATTACHMENT_MIME_ALLOWLIST.includes(mime);
}

export function getSmallDocumentShortcutThresholds(
  env: NodeJS.ProcessEnv = process.env,
): AgentAttachmentSmallDocumentShortcut["thresholds"] {
  return {
    maxBytes: parsePositiveInteger(
      env.AGENT_SMALL_DOC_NATIVE_PDF_MAX_BYTES,
      AGENT_SMALL_DOC_NATIVE_PDF_DEFAULT_MAX_BYTES,
    ),
    maxPagesExclusive: parsePositiveInteger(
      env.AGENT_SMALL_DOC_NATIVE_PDF_MAX_PAGES,
      AGENT_SMALL_DOC_NATIVE_PDF_DEFAULT_MAX_PAGES_EXCLUSIVE,
    ),
  };
}

export function classifySmallPdfNativeShortcut(args: {
  mimeType: string;
  byteSize: number;
  pageCount: number | null;
  env?: NodeJS.ProcessEnv;
}): AgentAttachmentSmallDocumentShortcut {
  const thresholds = getSmallDocumentShortcutThresholds(args.env);
  const base = {
    byteSize: args.byteSize,
    pageCount: args.pageCount,
    thresholds,
  };

  if (args.mimeType !== PDF_MIME) {
    return {
      ...base,
      eligible: false,
      route: "parser",
      reason: "not_pdf",
    };
  }
  if (args.byteSize >= thresholds.maxBytes) {
    return {
      ...base,
      eligible: false,
      route: "parser",
      reason: "over_size_threshold",
    };
  }
  if (args.pageCount === null) {
    return {
      ...base,
      eligible: false,
      route: "parser",
      reason: "page_count_unavailable",
    };
  }
  if (args.pageCount >= thresholds.maxPagesExclusive) {
    return {
      ...base,
      eligible: false,
      route: "parser",
      reason: "over_page_threshold",
    };
  }

  return {
    ...base,
    eligible: true,
    route: "claude-native-pdf",
    reason: "small_pdf_under_configured_thresholds",
  };
}

export function buildRawModeEscape(args: {
  mimeType: string;
  byteSize: number;
  contentHash: string;
}): AgentAttachmentRawModeEscape | null {
  const estimatedTokensPerTurn = estimateRawModeTokens(args.byteSize);
  if (args.mimeType !== PDF_MIME) {
    return null;
  }
  return {
    eligible: true,
    requiresUserApproval: true,
    route: "claude-native-pdf",
    reason: "pdf_native_last_resort",
    estimatedTokensPerTurn,
    parserBugTicketId: `parser-bug-${args.contentHash.slice(0, 12)}`,
    costWarning: formatRawModeCostWarning(estimatedTokensPerTurn),
  };
}

export function estimateRawModeTokens(byteSize: number): number {
  if (!Number.isFinite(byteSize) || byteSize <= 0) return 0;
  return Math.max(
    1,
    Math.ceil(byteSize / AGENT_RAW_MODE_TOKEN_ESTIMATE_BYTES_PER_TOKEN),
  );
}

export function formatRawModeCostWarning(tokens: number): string {
  const roundedThousands = Math.max(1, Math.ceil(tokens / 1000));
  return `Raw mode will send the original PDF to the model and may use about ${roundedThousands}k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.`;
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
  cacheScope?: string | null;
}): Promise<string> {
  const result = await extractAgentAttachmentParseResult(args);
  return result.text;
}

export async function extractAgentAttachmentParseResult(args: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  cacheScope?: string | null;
}): Promise<AgentAttachmentParseResult> {
  try {
    if (TEXT_MIMES.has(args.mimeType)) {
      return {
        text: args.buffer.toString("utf-8"),
        metadata: {
          pageCount: null,
          tableCount: args.mimeType === "text/csv" ? 1 : null,
          parserId: "plain-text",
          smallDocumentShortcut: null,
          rawModeEscape: null,
        },
      };
    }
    if (IMAGE_MIMES.has(args.mimeType)) {
      // No OCR pipeline yet — skip and let the model handle the image
      // separately if we ever pass binary parts upstream.
      return emptyParseResult("image-no-ocr");
    }
    if (args.mimeType === PDF_MIME) {
      return withSmallPdfShortcut(args, await extractCachedAgentPdfText(args));
    }
    if (args.mimeType === DOCX_MIME) {
      return cachedAgentAttachmentParse(args, "docx-mammoth", async () => ({
        text: await extractDocxText(args.buffer),
        metadata: {
          pageCount: null,
          tableCount: null,
          parserId: "docx-mammoth",
          smallDocumentShortcut: null,
          rawModeEscape: null,
        },
      }));
    }
    if (args.mimeType === XLSX_MIME) {
      return cachedAgentAttachmentParse(args, "exceljs-xlsx", () =>
        extractXlsxResult(args.buffer),
      );
    }
    return emptyParseResult(null);
  } catch {
    // Defensive: parser failures should not turn a 200 into a 500.
    return emptyParseResult(null);
  }
}

async function extractCachedAgentPdfText(args: {
  mimeType: string;
  buffer: Buffer;
  cacheScope?: string | null;
}): Promise<AgentAttachmentParseResult> {
  if (isDocumentIntelligenceConfigured()) {
    try {
      return await cachedAgentAttachmentParse(
        args,
        DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD,
        async () => {
          const result = await parsePdfWithDocumentIntelligenceLayout(
            args.buffer,
          );
          return {
            text: result.text,
            metadata: {
              pageCount: result.pageCount,
              tableCount: result.tableCount,
              parserId: DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD,
              smallDocumentShortcut: null,
              rawModeEscape: null,
            },
          };
        },
      );
    } catch {
      return cachedAgentAttachmentParse(args, "pdf-parse", () =>
        extractPdfResult(args.buffer),
      );
    }
  }

  return cachedAgentAttachmentParse(args, "pdf-parse", () =>
    extractPdfResult(args.buffer),
  );
}

async function cachedAgentAttachmentParse(
  args: {
    mimeType: string;
    buffer: Buffer;
    cacheScope?: string | null;
  },
  parserId: string,
  parse: () => Promise<AgentAttachmentParseResult>,
): Promise<AgentAttachmentParseResult> {
  const { value } = await withContentHashParseCache(
    {
      cacheScope: args.cacheScope,
      mimeType: args.mimeType,
      parserId,
      parserVersion: AGENT_ATTACHMENT_PARSER_VERSION,
      bytes: args.buffer,
    },
    parse,
  );
  return value;
}

function withSmallPdfShortcut(
  args: {
    mimeType: string;
    buffer: Buffer;
  },
  result: AgentAttachmentParseResult,
): AgentAttachmentParseResult {
  return {
    ...result,
    metadata: {
      ...result.metadata,
      smallDocumentShortcut: classifySmallPdfNativeShortcut({
        mimeType: args.mimeType,
        byteSize: args.buffer.byteLength,
        pageCount: result.metadata.pageCount,
      }),
      rawModeEscape: buildRawModeEscape({
        mimeType: args.mimeType,
        byteSize: args.buffer.byteLength,
        contentHash: hashBuffer(args.buffer),
      }),
    },
  };
}

async function extractPdfResult(
  buffer: Buffer,
): Promise<AgentAttachmentParseResult> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const [textResult, tableResult] = await Promise.all([
      parser.getText(),
      parser.getTable().catch(() => null),
    ]);
    const tableCount = Array.isArray(tableResult?.pages)
      ? tableResult.pages.reduce((count, page) => {
          const tables = Array.isArray(page.tables) ? page.tables.length : 0;
          return count + tables;
        }, 0)
      : null;
    return {
      text: textResult.text ?? "",
      metadata: {
        pageCount:
          typeof textResult.total === "number" ? textResult.total : null,
        tableCount,
        parserId: "pdf-parse",
        smallDocumentShortcut: null,
        rawModeEscape: null,
      },
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractXlsxResult(
  buffer: Buffer,
): Promise<AgentAttachmentParseResult> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const lines: string[] = [];
  let worksheetCount = 0;
  workbook.eachSheet((worksheet) => {
    worksheetCount += 1;
    lines.push(`Worksheet: ${worksheet.name}`);
    worksheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      const line = values
        .map((value) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "object") {
            if ("text" in value && typeof value.text === "string") {
              return value.text;
            }
            if ("result" in value) return String(value.result ?? "");
            return JSON.stringify(value);
          }
          return String(value);
        })
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" | ");
      if (line) lines.push(line);
    });
  });
  return {
    text: lines.join("\n"),
    metadata: {
      pageCount: null,
      tableCount: worksheetCount,
      parserId: "exceljs-xlsx",
      smallDocumentShortcut: null,
      rawModeEscape: null,
    },
  };
}

function emptyParseResult(parserId: string | null): AgentAttachmentParseResult {
  return {
    text: "",
    metadata: {
      pageCount: null,
      tableCount: null,
      parserId,
      smallDocumentShortcut: null,
      rawModeEscape: null,
    },
  };
}

function parsePositiveInteger(
  raw: string | undefined,
  fallback: number,
): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Bounded snippet for the system prompt — preserves whole words at the
 * boundary when possible.
 */
export function snipExtractedTextPreview(text: string): string {
  if (!text) return "";
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
    .replace(/[\\/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .slice(0, 96);
  return cleaned || "upload";
}
