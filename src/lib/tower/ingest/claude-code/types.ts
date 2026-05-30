// Tower · Claude Code developer usage ingest — shared types.
//
// One row per developer × monthly period. Schema mirrors the
// `tower_ai_tool_usage` table (tool='claude_code').

export const CLAUDE_CODE_TOOL = 'claude_code' as const;

export interface ClaudeCodeUsageRow {
  team: string;
  developer_id: string;
  period_start: string; // ISO date YYYY-MM-DD
  period_end: string; // ISO date YYYY-MM-DD
  sessions: number | null;
  prompt_tokens: number | null;
  output_tokens: number | null;
  monthly_cost_usd: number | null;
  primary_use_case: string | null;
}

export interface ParseResult {
  rows: ClaudeCodeUsageRow[];
  warnings: string[];
}

export interface ValidationError {
  row_index: number; // 1-based excluding header
  developer_id: string | null;
  period_start: string | null;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export const CLAUDE_CODE_REQUIRED_COLUMNS = [
  'team',
  'developer_id',
  'period_start',
  'period_end',
] as const;

export const CLAUDE_CODE_NUMERIC_COLUMNS = [
  'sessions',
  'prompt_tokens',
  'output_tokens',
  'monthly_cost_usd',
] as const;

export const CLAUDE_CODE_COLUMN_ORDER = [
  'team',
  'developer_id',
  'period_start',
  'period_end',
  'sessions',
  'prompt_tokens',
  'output_tokens',
  'monthly_cost_usd',
  'primary_use_case',
] as const;

export type ClaudeCodeColumn = (typeof CLAUDE_CODE_COLUMN_ORDER)[number];
