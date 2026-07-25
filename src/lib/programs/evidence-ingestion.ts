import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  CONTENT_HASH_PARSE_CACHE_VERSION,
  withContentHashParseCache,
} from "@/lib/ingestion/content-hash-parse-cache";
import {
  DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD,
  isDocumentIntelligenceConfigured,
  parsePdfWithDocumentIntelligenceLayout,
} from "@/lib/ingestion/document-intelligence-layout";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { TenancyCtx } from "./types.db";
import { writeProgramAuditLogBestEffort } from "./audit-log";

export type EvidenceType =
  | "meeting_notes"
  | "workshop_output"
  | "baseline_evidence"
  | "decision_log"
  | "architecture_inventory"
  | "uploaded_artifact"
  | "move_context_extract_attached";

export interface EvidenceTableExtract {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface EvidenceCitation {
  /** A short, verbatim (or near-verbatim) quote from the source file. */
  quote: string;
  /** Where in the file this came from, e.g. a sheet/row range, a heading, a page. */
  locator: string;
}

/**
 * The flexible, Move-specific content an uploaded file actually contains —
 * additive to the fixed decisions/risks/action_items/baseline_candidates shape
 * below, and NOT constrained to a predefined per-domain schema. Populated by
 * `extractFlexibleEvidenceEnvelope` (LLM-based); absent when that step is
 * unavailable or fails, so ingestion never hard-depends on it.
 */
export interface FlexibleEvidenceEnvelope {
  /** What this file actually shows, in the file's own terms — not forced into a fixed taxonomy. */
  observations: string[];
  /** Any tabular data worth carrying forward as structured rows, not flattened prose. */
  tables: EvidenceTableExtract[];
  /** Assumptions this file states or implies, distinct from decisions already made. */
  assumptions: string[];
  /** Questions this file raises but does not answer. */
  openQuestions: string[];
  /** Verbatim citations a deliverable can point to, instead of a generic category label. */
  citations: EvidenceCitation[];
}

export interface ExtractedProgramEvidence {
  evidenceType: EvidenceType;
  title: string;
  summary: string;
  extractedText: string | null;
  extractedStructured: {
    decisions: string[];
    action_items: string[];
    risks: string[];
    baseline_candidates: string[];
    attendees: string[];
    parse_method: string;
    warnings: string[];
    /** Optional — see FlexibleEvidenceEnvelope. */
    flexible?: FlexibleEvidenceEnvelope;
  };
  confidence: number;
}

export interface RecordProgramEvidenceInput extends ExtractedProgramEvidence {
  tenantKey: string;
  programId: string;
  attachmentId?: string | null;
  phase?: number | null;
  stepId?: string | null;
}

const MAX_EXTRACTED_TEXT = 20_000;
const TEXTUAL_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const PROGRAM_EVIDENCE_PARSER_VERSION = `${CONTENT_HASH_PARSE_CACHE_VERSION}:program-evidence-v1`;

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function collectPrefixed(lines: string[], labels: string[]): string[] {
  const prefixes = labels.map((label) => label.toLowerCase());
  return lines
    .filter((line) =>
      prefixes.some((prefix) => line.toLowerCase().startsWith(prefix)),
    )
    .map((line) => line.replace(/^[^:—-]+[:—-]\s*/u, "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function collectSectionItems(lines: string[], headings: string[]): string[] {
  const normalizedHeadings = headings.map((heading) => heading.toLowerCase());
  const items: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const candidateHeading = line
      .replace(/[:—-]\s*$/u, "")
      .trim()
      .toLowerCase();
    const headingMatch = normalizedHeadings.some(
      (heading) =>
        candidateHeading === heading ||
        candidateHeading === `${heading}s` ||
        candidateHeading.endsWith(` ${heading}`) ||
        candidateHeading.endsWith(` ${heading}s`),
    );

    if (headingMatch) {
      inSection = true;
      continue;
    }

    // A new title-cased section boundary stops the current capture block.
    if (inSection && /^[A-Z][A-Za-z /&-]{2,}\s*[:—-]\s*$/.test(line)) {
      inSection = false;
    }

    if (!inSection) continue;

    const cleaned = line
      .replace(/^[-*•]\s*/u, "")
      .replace(/^\d+[.)]\s*/u, "")
      .trim();
    if (cleaned) items.push(cleaned);
    if (items.length >= 20) break;
  }

  return items;
}

function uniqueSignals(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const item of group) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 20) return out;
    }
  }
  return out;
}

function classifyEvidenceType(filename: string, text: string): EvidenceType {
  const haystack = `${filename}\n${text}`.toLowerCase();
  if (
    /\b(workshop output|workshop artifact|whiteboard|breakout|facilitator)\b/.test(
      haystack,
    )
  ) {
    return "workshop_output";
  }
  if (/\b(attendees?|meeting|minutes?|notes?)\b/.test(haystack))
    return "meeting_notes";
  if (/\bworkshop\b/.test(haystack)) return "workshop_output";
  if (/\b(baseline|current state|metric|dora|kpi)\b/.test(haystack))
    return "baseline_evidence";
  if (/\b(decision|approved|rejected|waived)\b/.test(haystack))
    return "decision_log";
  if (
    /\b(architecture|system inventory|application|integration|data flow)\b/.test(
      haystack,
    )
  )
    return "architecture_inventory";
  return "uploaded_artifact";
}

function inferAttendees(lines: string[]): string[] {
  const attendeeLine = lines.find((line) =>
    /^(attendees?|participants?|present)\s*[:—-]/i.test(line),
  );
  if (!attendeeLine) return [];
  return attendeeLine
    .replace(/^[^:—-]+[:—-]\s*/u, "")
    .split(/[,;|]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function extractProgramEvidenceFromText(args: {
  filename: string;
  text: string;
  mimeType: string;
}): ExtractedProgramEvidence {
  const normalized = args.text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const lines = normalizeLines(normalized);
  const evidenceType = classifyEvidenceType(args.filename, normalized);
  const decisions = uniqueSignals(
    collectPrefixed(lines, ["decision", "decided", "approval"]),
    collectSectionItems(lines, ["decision", "decisions", "approvals"]),
  );
  const actionItems = uniqueSignals(
    collectPrefixed(lines, ["action", "action item", "todo", "owner"]),
    collectSectionItems(lines, [
      "action",
      "actions",
      "action items",
      "todos",
      "owners",
    ]),
  );
  const risks = uniqueSignals(
    collectPrefixed(lines, ["risk", "issue", "blocker"]),
    collectSectionItems(lines, ["risk", "risks", "issues", "blockers"]),
  );
  const baselineCandidates = uniqueSignals(
    collectPrefixed(lines, ["baseline", "metric", "kpi", "current state"]),
    collectSectionItems(lines, [
      "baseline candidate",
      "baseline candidates",
      "metrics",
      "kpis",
    ]),
  );
  const attendees = inferAttendees(lines);

  const summary =
    lines.slice(0, 4).join(" ").slice(0, 700) ||
    `Uploaded artifact ${args.filename} was captured but no readable text was extracted.`;

  return {
    evidenceType,
    title: args.filename,
    summary,
    extractedText: normalized ? normalized.slice(0, MAX_EXTRACTED_TEXT) : null,
    extractedStructured: {
      decisions,
      action_items: actionItems,
      risks,
      baseline_candidates: baselineCandidates,
      attendees,
      parse_method:
        args.mimeType === "text/markdown"
          ? "markdown-line-parser"
          : "text-line-parser",
      warnings: [],
    },
    confidence: normalized ? 0.78 : 0.3,
  };
}

const FLEXIBLE_EXTRACTION_MODEL =
  process.env.EVIDENCE_EXTRACTION_MODEL ?? "claude-haiku-4-5-20251001";
const MAX_TEXT_FOR_FLEXIBLE_EXTRACTION = 12_000;

const FLEXIBLE_EXTRACTION_SYSTEM_PROMPT = `You extract what an uploaded evidence file actually
contains — you do not force it into a fixed category taxonomy. Read the text and produce a strict
JSON object with this exact shape and nothing else:
{
  "observations": string[],   // what this file actually shows, in its own terms (max 12)
  "tables": [{"title": string, "headers": string[], "rows": string[][]}],  // any tabular data worth carrying forward (max 4 tables, max 20 rows each)
  "assumptions": string[],    // assumptions the file states or implies (max 8)
  "openQuestions": string[],  // questions the file raises but does not answer (max 8)
  "citations": [{"quote": string, "locator": string}]  // short verbatim quotes + where they came from, e.g. a heading or row range (max 10)
}
Only extract what is actually present in the text — never invent a finding, a number, or a citation
that is not there. If a field has nothing to report, return an empty array for it. Return JSON only,
no markdown fences, no commentary.`;

/**
 * Flexible, Move-specific extraction of an uploaded evidence file's real content —
 * additive to the deterministic decisions/risks/action_items/baseline_candidates
 * parser above. Runs through the audited Anthropic egress path (per AGENTS.md);
 * on any failure (no API key, quota, malformed response) this returns null and
 * the caller proceeds without it — ingestion never hard-depends on this step.
 */
export async function extractFlexibleEvidenceEnvelope(args: {
  tenantId: string;
  userId?: string;
  filename: string;
  text: string;
}): Promise<FlexibleEvidenceEnvelope | null> {
  const text = args.text.trim();
  if (!text || !process.env.ANTHROPIC_API_KEY) return null;
  try {
    const truncated = text.slice(0, MAX_TEXT_FOR_FLEXIBLE_EXTRACTION);
    const userContent = `Filename: ${args.filename}\n\nText:\n${truncated}`;
    const { client: anthropic } = await getAuditedAnthropicClient({
      tenantId: args.tenantId,
      userId: args.userId,
      workflow: "moves-evidence-flexible-extraction",
      model: FLEXIBLE_EXTRACTION_MODEL,
      prompt: [FLEXIBLE_EXTRACTION_SYSTEM_PROMPT, userContent].join("\n\n"),
      dataClass: "confidential",
      metadata: { filename: args.filename },
    });
    const result = await anthropic.messages.create({
      model: FLEXIBLE_EXTRACTION_MODEL,
      max_tokens: 2000,
      temperature: 0,
      system: FLEXIBLE_EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });
    const responseText =
      result.content.find((b) => b.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(
      responseText.replace(/^```(?:json)?\s*|\s*```$/g, ""),
    ) as Partial<FlexibleEvidenceEnvelope>;
    return {
      observations: Array.isArray(parsed.observations)
        ? parsed.observations.slice(0, 12).map(String)
        : [],
      tables: Array.isArray(parsed.tables)
        ? parsed.tables.slice(0, 4).map((t) => ({
            title: String((t as EvidenceTableExtract)?.title ?? "Table"),
            headers: Array.isArray((t as EvidenceTableExtract)?.headers)
              ? (t as EvidenceTableExtract).headers.map(String)
              : [],
            rows: Array.isArray((t as EvidenceTableExtract)?.rows)
              ? (t as EvidenceTableExtract).rows
                  .slice(0, 20)
                  .map((row) => (Array.isArray(row) ? row.map(String) : []))
              : [],
          }))
        : [],
      assumptions: Array.isArray(parsed.assumptions)
        ? parsed.assumptions.slice(0, 8).map(String)
        : [],
      openQuestions: Array.isArray(parsed.openQuestions)
        ? parsed.openQuestions.slice(0, 8).map(String)
        : [],
      citations: Array.isArray(parsed.citations)
        ? parsed.citations.slice(0, 10).map((c) => ({
            quote: String((c as EvidenceCitation)?.quote ?? ""),
            locator: String((c as EvidenceCitation)?.locator ?? ""),
          }))
        : [],
    };
  } catch {
    return null;
  }
}

function withParseMetadata(
  evidence: ExtractedProgramEvidence,
  parseMethod: string,
  warnings: string[] = [],
  confidence = evidence.confidence,
): ExtractedProgramEvidence {
  return {
    ...evidence,
    confidence,
    extractedStructured: {
      ...evidence.extractedStructured,
      parse_method: parseMethod,
      warnings,
    },
  };
}

function fallbackEvidenceWithWarning(args: {
  filename: string;
  mimeType: string;
  warning: string;
}): ExtractedProgramEvidence {
  const fallback = evidenceForUnsupportedAttachment(args);
  return {
    ...fallback,
    extractedStructured: {
      ...fallback.extractedStructured,
      warnings: [...fallback.extractedStructured.warnings, args.warning],
    },
  };
}

interface ParserTextResult {
  text: string;
  warnings: string[];
  parseMethod?: string;
}

async function extractDocxText(buffer: Buffer): Promise<ParserTextResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const warnings = Array.isArray(result.messages)
    ? result.messages
        .map((msg) =>
          msg && typeof msg === "object" && "message" in msg
            ? (msg as { message?: unknown }).message
            : null,
        )
        .filter((msg): msg is string => typeof msg === "string")
    : [];
  return { text: result.value ?? "", warnings };
}

async function extractPdfText(buffer: Buffer): Promise<ParserTextResult> {
  if (isDocumentIntelligenceConfigured()) {
    try {
      const result = await parsePdfWithDocumentIntelligenceLayout(buffer);
      return {
        text: result.text,
        warnings: [
          ...result.warnings,
          `Azure AI Document Intelligence layout parser used${
            result.pageCount === null ? "" : ` (${result.pageCount} pages)`
          }.`,
        ],
        parseMethod: DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD,
      };
    } catch (err) {
      const fallback = await extractPdfTextWithPdfParse(buffer);
      return {
        ...fallback,
        warnings: [
          ...fallback.warnings,
          `Azure AI Document Intelligence failed; used pdf-parse fallback: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ],
        parseMethod: "pdf-parse",
      };
    }
  }

  return extractPdfTextWithPdfParse(buffer);
}

async function extractPdfTextWithPdfParse(
  buffer: Buffer,
): Promise<ParserTextResult> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return { text: result.text ?? "", warnings: [], parseMethod: "pdf-parse" };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => XML_ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}

/**
 * Extract the visible text runs from a single PPTX slide's XML. PowerPoint stores
 * each run of text in an `<a:t>` element; paragraph/line breaks are `<a:br>` and
 * new paragraphs are `<a:p>`. Pure + exported for unit testing.
 */
export function extractTextFromSlideXml(xml: string): string {
  if (!xml) return "";
  // Insert soft breaks at paragraph/line boundaries so distinct bullets/lines
  // don't run together (keeps the line-parser's section/heading logic working).
  const withBreaks = xml
    .replace(/<a:br\s*\/?>/g, "\n")
    .replace(/<\/a:p>/g, "\n");
  const runs = [...withBreaks.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) =>
    decodeXmlEntities(m[1]),
  );
  return runs
    .join(" ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function extractPptxText(buffer: Buffer): Promise<ParserTextResult> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? "0");
      const nb = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? "0");
      return na - nb;
    });
  const warnings: string[] = [];
  if (!slideNames.length) {
    warnings.push("No slide XML found in PPTX package.");
    return { text: "", warnings, parseMethod: "pptx-jszip" };
  }
  const parts: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.files[name].async("string");
    const text = extractTextFromSlideXml(xml);
    const slideNo = name.match(/slide(\d+)\.xml$/)?.[1] ?? "?";
    if (text) parts.push(`Slide ${slideNo}: ${text}`);
  }
  return {
    text: parts.join("\n"),
    warnings,
    parseMethod: "pptx-jszip",
  };
}

async function extractXlsxText(buffer: Buffer): Promise<ParserTextResult> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const lines: string[] = [];
  workbook.eachSheet((worksheet) => {
    lines.push(`Worksheet: ${worksheet.name}`);
    worksheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      const line = values
        .map((value) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "object") {
            if ("text" in value && typeof value.text === "string")
              return value.text;
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
  return { text: lines.join("\n"), warnings: [] };
}

export async function extractProgramEvidenceFromUploadBuffer(args: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  cacheScope?: string | null;
}): Promise<ExtractedProgramEvidence> {
  if (TEXTUAL_MIME_TYPES.has(args.mimeType)) {
    const method =
      args.mimeType === "text/markdown"
        ? "markdown-line-parser"
        : args.mimeType === "text/csv"
          ? "csv-line-parser"
          : args.mimeType === "application/json"
            ? "json-line-parser"
            : "text-line-parser";
    return withParseMetadata(
      extractProgramEvidenceFromText({
        filename: args.filename,
        mimeType: args.mimeType,
        text: args.buffer.toString("utf-8"),
      }),
      method,
    );
  }

  const parser = (() => {
    if (args.mimeType === DOCX_MIME)
      return { method: "docx-mammoth", run: extractDocxText };
    if (args.mimeType === PDF_MIME)
      return {
        method: isDocumentIntelligenceConfigured()
          ? DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD
          : "pdf-parse",
        run: extractPdfText,
      };
    if (args.mimeType === XLSX_MIME)
      return { method: "exceljs-xlsx", run: extractXlsxText };
    if (args.mimeType === PPTX_MIME)
      return { method: "pptx-jszip", run: extractPptxText };
    return null;
  })();

  if (!parser) return evidenceForUnsupportedAttachment(args);

  try {
    const {
      value: { text, warnings, parseMethod },
    } = await withContentHashParseCache(
      {
        cacheScope: args.cacheScope,
        mimeType: args.mimeType,
        parserId: parser.method,
        parserVersion: PROGRAM_EVIDENCE_PARSER_VERSION,
        bytes: args.buffer,
      },
      () => parser.run(args.buffer),
    );
    if (!text.trim()) {
      return fallbackEvidenceWithWarning({
        filename: args.filename,
        mimeType: args.mimeType,
        warning: `${parser.method} returned no readable text.`,
      });
    }
    return withParseMetadata(
      extractProgramEvidenceFromText({
        filename: args.filename,
        mimeType: args.mimeType,
        text,
      }),
      parseMethod || parser.method,
      warnings,
      0.72,
    );
  } catch (err) {
    return fallbackEvidenceWithWarning({
      filename: args.filename,
      mimeType: args.mimeType,
      warning: `${parser.method} failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export function evidenceForUnsupportedAttachment(args: {
  filename: string;
  mimeType: string;
}): ExtractedProgramEvidence {
  return {
    evidenceType: "uploaded_artifact",
    title: args.filename,
    summary: `Uploaded artifact captured. Structured parsing for ${args.mimeType || "unknown mime"} is not available in the synchronous upload path.`,
    extractedText: null,
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: [],
      attendees: [],
      parse_method: "metadata-only",
      warnings: [
        "Structured parsing unavailable for this mime type in synchronous upload path.",
      ],
    },
    confidence: 0.4,
  };
}

/**
 * Enrich an already-parsed evidence result with the flexible, Move-specific
 * envelope (observations/tables/assumptions/openQuestions/citations). Callers
 * that don't pass tenant/user context get the evidence back unchanged — this
 * is purely additive and never required for ingestion to succeed.
 */
export async function enrichWithFlexibleEvidenceEnvelope(
  evidence: ExtractedProgramEvidence,
  args: { tenantId: string; userId?: string },
): Promise<ExtractedProgramEvidence> {
  if (!evidence.extractedText) return evidence;
  const flexible = await extractFlexibleEvidenceEnvelope({
    tenantId: args.tenantId,
    userId: args.userId,
    filename: evidence.title,
    text: evidence.extractedText,
  });
  if (!flexible) return evidence;
  return {
    ...evidence,
    extractedStructured: {
      ...evidence.extractedStructured,
      flexible,
    },
  };
}

export async function recordProgramEvidence(
  ctx: TenancyCtx,
  input: RecordProgramEvidenceInput,
): Promise<string> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("program_evidence_items")
    .insert({
      tenant_key: input.tenantKey,
      program_id: input.programId,
      attachment_id: input.attachmentId ?? null,
      phase: input.phase ?? null,
      step_id: input.stepId ?? null,
      evidence_type: input.evidenceType,
      title: input.title,
      summary: input.summary,
      extracted_text: input.extractedText,
      extracted_structured: input.extractedStructured,
      confidence: input.confidence,
      created_by_user_id: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  const evidenceId = (data as { id: string }).id;
  await writeProgramAuditLogBestEffort(ctx, {
    tenantKey: input.tenantKey,
    programId: input.programId,
    engagementId: input.programId,
    action: "program_evidence_captured",
    fromState: null,
    toState: input.evidenceType,
    rationale: input.summary,
    evidenceRefs: [
      evidenceId,
      ...(input.attachmentId ? [input.attachmentId] : []),
    ],
  });
  return evidenceId;
}
