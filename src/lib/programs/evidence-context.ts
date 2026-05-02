import 'server-only';

import { canReadProgram } from '@/lib/auth/program-access-policy';
import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from './types.db';

export interface ProgramEvidencePromptItem {
  id: string;
  title: string;
  evidenceType: string;
  summary: string | null;
  parseMethod: string | null;
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
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_evidence_items')
    .select('id, title, evidence_type, summary, extracted_text, extracted_structured, created_at')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
    id: String(row.id),
    title: asString(row.title) ?? 'Untitled evidence',
    evidenceType: asString(row.evidence_type) ?? 'evidence',
    summary: asString(row.summary),
    parseMethod: readParseMethod(row.extracted_structured),
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
      `  Text preview: ${compactLine(item.extractedText)}`,
    );
  }
  lines.push(
    'Use this ledger as captured program evidence. Do not say there are zero uploaded items when entries are listed here.',
  );
  return lines.join('\n');
}
