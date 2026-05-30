// Tower · Claude Code ingest — upsert classification (pure logic, no DB).
//
// Given a desired row and the row currently in the table (or null), classify
// the action as 'insert' | 'update' | 'unchanged'. Used both by the CLI to
// produce summary counts and by tests to verify idempotency without a DB.

import { CLAUDE_CODE_TOOL, type ClaudeCodeUsageRow } from './types';

export interface ExistingDbRow {
  team: string | null;
  period_end: string | null;
  sessions: number | null;
  prompt_tokens: number | string | null;
  output_tokens: number | string | null;
  monthly_cost_usd: number | string | null;
  primary_use_case: string | null;
}

export type UpsertAction = 'insert' | 'update' | 'unchanged';

function toNumOrNull(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function classifyUpsert(
  desired: ClaudeCodeUsageRow,
  existing: ExistingDbRow | null,
): UpsertAction {
  if (!existing) return 'insert';
  const changed =
    existing.team !== desired.team ||
    existing.period_end !== desired.period_end ||
    (existing.sessions ?? null) !== desired.sessions ||
    toNumOrNull(existing.prompt_tokens) !== desired.prompt_tokens ||
    toNumOrNull(existing.output_tokens) !== desired.output_tokens ||
    toNumOrNull(existing.monthly_cost_usd) !== desired.monthly_cost_usd ||
    (existing.primary_use_case ?? null) !== desired.primary_use_case;
  return changed ? 'update' : 'unchanged';
}

export interface UsagePayload extends ClaudeCodeUsageRow {
  tool: typeof CLAUDE_CODE_TOOL;
  tenant_client_key: string;
  source_file: string;
}

export function buildPayload(
  row: ClaudeCodeUsageRow,
  tenant: string,
  sourceFile: string,
): UsagePayload {
  return {
    tool: CLAUDE_CODE_TOOL,
    tenant_client_key: tenant,
    source_file: sourceFile,
    ...row,
  };
}
