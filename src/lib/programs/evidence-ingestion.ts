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
    const headingMatch = normalizedHeadings.some((heading) =>
      new RegExp(`^${heading}s?\\s*[:—-]?$`, 'i').test(line),
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
  if (/\b(attendees?|meeting|minutes?|notes?)\b/.test(haystack)) return 'meeting_notes';
  if (/\b(workshop|whiteboard|breakout|facilitator)\b/.test(haystack)) return 'workshop_output';
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
