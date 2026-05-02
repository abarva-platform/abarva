import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from './types.db';
import { writeProgramAuditLogBestEffort } from './audit-log';

export type EvidenceType =
  | 'meeting_notes'
  | 'workshop_output'
  | 'baseline_evidence'
  | 'decision_log'
  | 'architecture_inventory'
  | 'uploaded_artifact';

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
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function collectPrefixed(lines: string[], labels: string[]): string[] {
  const prefixes = labels.map((label) => label.toLowerCase());
  return lines
    .filter((line) => prefixes.some((prefix) => line.toLowerCase().startsWith(prefix)))
    .map((line) => line.replace(/^[^:—-]+[:—-]\s*/u, '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

function collectSectionItems(lines: string[], headings: string[]): string[] {
  const normalizedHeadings = headings.map((heading) => heading.toLowerCase());
  const items: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const candidateHeading = line
      .replace(/[:—-]\s*$/u, '')
      .trim()
      .toLowerCase();
    const headingMatch = normalizedHeadings.some((heading) =>
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
      .replace(/^[-*•]\s*/u, '')
      .replace(/^\d+[.)]\s*/u, '')
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
  if (/\b(workshop output|workshop artifact|whiteboard|breakout|facilitator)\b/.test(haystack)) {
    return 'workshop_output';
  }
  if (/\b(attendees?|meeting|minutes?|notes?)\b/.test(haystack)) return 'meeting_notes';
  if (/\bworkshop\b/.test(haystack)) return 'workshop_output';
  if (/\b(baseline|current state|metric|dora|kpi)\b/.test(haystack)) return 'baseline_evidence';
  if (/\b(decision|approved|rejected|waived)\b/.test(haystack)) return 'decision_log';
  if (/\b(architecture|system inventory|application|integration|data flow)\b/.test(haystack)) return 'architecture_inventory';
  return 'uploaded_artifact';
}

function inferAttendees(lines: string[]): string[] {
  const attendeeLine = lines.find((line) =>
    /^(attendees?|participants?|present)\s*[:—-]/i.test(line),
  );
  if (!attendeeLine) return [];
  return attendeeLine
    .replace(/^[^:—-]+[:—-]\s*/u, '')
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
  const normalized = args.text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const lines = normalizeLines(normalized);
  const evidenceType = classifyEvidenceType(args.filename, normalized);
  const decisions = uniqueSignals(
    collectPrefixed(lines, ['decision', 'decided', 'approval']),
    collectSectionItems(lines, ['decision', 'decisions', 'approvals']),
  );
  const actionItems = uniqueSignals(
    collectPrefixed(lines, ['action', 'action item', 'todo', 'owner']),
    collectSectionItems(lines, ['action', 'actions', 'action items', 'todos', 'owners']),
  );
  const risks = uniqueSignals(
    collectPrefixed(lines, ['risk', 'issue', 'blocker']),
    collectSectionItems(lines, ['risk', 'risks', 'issues', 'blockers']),
  );
  const baselineCandidates = uniqueSignals(
    collectPrefixed(lines, ['baseline', 'metric', 'kpi', 'current state']),
    collectSectionItems(lines, ['baseline candidate', 'baseline candidates', 'metrics', 'kpis']),
  );
  const attendees = inferAttendees(lines);

  const summary =
    lines.slice(0, 4).join(' ').slice(0, 700) ||
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
      parse_method: args.mimeType === 'text/markdown' ? 'markdown-line-parser' : 'text-line-parser',
      warnings: [],
    },
    confidence: normalized ? 0.78 : 0.3,
  };
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

async function extractDocxText(buffer: Buffer): Promise<{ text: string; warnings: string[] }> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const warnings = Array.isArray(result.messages)
    ? result.messages
        .map((msg) =>
          msg && typeof msg === 'object' && 'message' in msg
            ? (msg as { message?: unknown }).message
            : null,
        )
        .filter((msg): msg is string => typeof msg === 'string')
    : [];
  return { text: result.value ?? '', warnings };
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; warnings: string[] }> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return { text: result.text ?? '', warnings: [] };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractXlsxText(buffer: Buffer): Promise<{ text: string; warnings: string[] }> {
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
  return { text: lines.join('\n'), warnings: [] };
}

export async function extractProgramEvidenceFromUploadBuffer(args: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<ExtractedProgramEvidence> {
  if (TEXTUAL_MIME_TYPES.has(args.mimeType)) {
    const method = args.mimeType === 'text/markdown'
      ? 'markdown-line-parser'
      : args.mimeType === 'text/csv'
        ? 'csv-line-parser'
        : args.mimeType === 'application/json'
          ? 'json-line-parser'
          : 'text-line-parser';
    return withParseMetadata(
      extractProgramEvidenceFromText({
        filename: args.filename,
        mimeType: args.mimeType,
        text: args.buffer.toString('utf-8'),
      }),
      method,
    );
  }

  const parser = (() => {
    if (args.mimeType === DOCX_MIME) return { method: 'docx-mammoth', run: extractDocxText };
    if (args.mimeType === PDF_MIME) return { method: 'pdf-parse', run: extractPdfText };
    if (args.mimeType === XLSX_MIME) return { method: 'exceljs-xlsx', run: extractXlsxText };
    return null;
  })();

  if (!parser) return evidenceForUnsupportedAttachment(args);

  try {
    const { text, warnings } = await parser.run(args.buffer);
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
      parser.method,
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
    evidenceType: 'uploaded_artifact',
    title: args.filename,
    summary: `Uploaded artifact captured. Structured parsing for ${args.mimeType || 'unknown mime'} is not available in the synchronous upload path.`,
    extractedText: null,
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: [],
      attendees: [],
      parse_method: 'metadata-only',
      warnings: ['Structured parsing unavailable for this mime type in synchronous upload path.'],
    },
    confidence: 0.4,
  };
}

export async function recordProgramEvidence(
  ctx: TenancyCtx,
  input: RecordProgramEvidenceInput,
): Promise<string> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_evidence_items')
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
    .select('id')
    .single();
  if (error) throw error;
  const evidenceId = (data as { id: string }).id;
  await writeProgramAuditLogBestEffort(ctx, {
    tenantKey: input.tenantKey,
    programId: input.programId,
    engagementId: input.programId,
    action: 'program_evidence_captured',
    fromState: null,
    toState: input.evidenceType,
    rationale: input.summary,
    evidenceRefs: [evidenceId, ...(input.attachmentId ? [input.attachmentId] : [])],
  });
  return evidenceId;
}
