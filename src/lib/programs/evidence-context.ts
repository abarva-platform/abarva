import 'server-only';

import { canReadProgram } from '@/lib/auth/program-access-policy';
import { azureRead } from '@/lib/data-plane/azureRead';
import type { TenancyCtx } from './types.db';

export interface ProgramEvidencePromptItem {
  id: string;
  title: string;
  evidenceType: string;
  summary: string | null;
  parseMethod: string | null;
  structuredSignals: string[];
  extractedText: string | null;
  createdAt: string;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readParseMethod(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  return asString((value as { parse_method?: unknown }).parse_method);
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item): item is string => item !== null)
    .slice(0, 12);
}

function readStructuredSignals(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const structured = value as Record<string, unknown>;
  const candidates = [
    ...readStringList(structured.baseline_candidates),
    ...readStringList(structured.decisions),
    ...readStringList(structured.action_items),
    ...readStringList(structured.risks),
  ];
  const seen = new Set<string>();
  return candidates
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
}

function compactLine(value: string | null | undefined, limit = 420): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return 'No text preview available.';
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

export async function listProgramEvidenceForPrompt(
  ctx: TenancyCtx,
  programId: string,
  limit = 8,
): Promise<ProgramEvidencePromptItem[]> {
  if (!programId || !(await canReadProgram(ctx, programId))) return [];
  const rows = await azureRead.select<Record<string, unknown>>({
    table: 'program_evidence_items',
    columns: ['id', 'title', 'evidence_type', 'summary', 'extracted_text', 'extracted_structured', 'created_at'],
    where: { program_id: programId },
    orderBy: { column: 'created_at', direction: 'desc' },
    limit,
  });
  return rows.map((row) => ({
    id: String(row.id),
    title: asString(row.title) ?? 'Untitled evidence',
    evidenceType: asString(row.evidence_type) ?? 'evidence',
    summary: asString(row.summary),
    parseMethod: readParseMethod(row.extracted_structured),
    structuredSignals: readStructuredSignals(row.extracted_structured),
    extractedText: asString(row.extracted_text),
    createdAt: asString(row.created_at) ?? '',
  }));
}

export function formatProgramEvidenceForPrompt(
  items: readonly ProgramEvidencePromptItem[],
): string {
  if (items.length === 0) return '';
  const lines = ['PROGRAM EVIDENCE LEDGER (uploaded/captured):'];
  for (const item of items) {
    lines.push(
      `- ${item.title} (${item.evidenceType}; ${item.parseMethod ?? 'parser unknown'}; ${item.createdAt})`,
      `  Summary: ${compactLine(item.summary)}`,
      item.structuredSignals.length
        ? `  Structured signals: ${item.structuredSignals
            .map((signal) => compactLine(signal, 240))
            .join(' | ')}`
        : '  Structured signals: none captured.',
      `  Text preview: ${compactLine(item.extractedText)}`,
    );
  }
  lines.push(
    'Use this ledger as captured program evidence. Do not say there are zero uploaded items when entries are listed here.',
  );
  return lines.join('\n');
}
