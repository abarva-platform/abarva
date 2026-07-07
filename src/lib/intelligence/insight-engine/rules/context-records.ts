import type { RuleEvaluationContext } from "../types";
import type { InsightFreshness } from "../types";

export interface ContextRecordRow {
  id: string;
  title: string;
  record_type: string;
  source_file: string | null;
  source_row_number: number | null;
  payload: Record<string, unknown> | null;
  freshness_status: string | null;
  lifecycle_state: string | null;
}

export async function loadActiveRecords(
  ctx: RuleEvaluationContext,
  recordTypes: string[],
  limit = 500,
): Promise<{ rows: ContextRecordRow[]; errors?: string[] }> {
  const result = await ctx.db
    .from<ContextRecordRow[]>("enterprise_context_records")
    .select(
      "id,title,record_type,source_file,source_row_number,payload,freshness_status,lifecycle_state",
    )
    .eq("tenant_key", ctx.tenantKey)
    .in("record_type", recordTypes)
    .in("lifecycle_state", ["active", "review"])
    .limit(limit);

  if (result.error) return { rows: [], errors: [result.error.message] };
  return { rows: result.data ?? [] };
}

export function textValue(
  payload: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = payload?.[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

export function numberValue(
  payload: Record<string, unknown> | null | undefined,
  ...keys: string[]
): number | null {
  const text = textValue(payload, ...keys);
  if (!text) return null;
  const parsed = Number(text.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function boolValue(
  payload: Record<string, unknown> | null | undefined,
  key: string,
): boolean {
  const normalized = String(payload?.[key] ?? "")
    .trim()
    .toLowerCase();
  return ["true", "yes", "y", "1"].includes(normalized);
}

export function daysUntil(dateText: string | null): number | null {
  if (!dateText) return null;
  const timestamp = Date.parse(dateText);
  if (!Number.isFinite(timestamp)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((timestamp - today.getTime()) / 86_400_000);
}

export function moneyLabel(value: number | null): string {
  if (!Number.isFinite(value) || !value || value <= 0) return "material";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value.toLocaleString()}`;
}

export function evidenceLabel(row: ContextRecordRow): string {
  if (!row.source_file) return row.title;
  return `${row.source_file}${row.source_row_number ? ` · row ${row.source_row_number}` : ""}`;
}

export function freshnessFor(row: ContextRecordRow): InsightFreshness {
  return row.freshness_status === "fresh" ? "fresh" : "attention";
}
