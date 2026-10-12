import type { CsvRecord } from "./projection";

function first(row: CsvRecord, ...fields: string[]): string {
  for (const field of fields) {
    const value = row[field];
    if (value !== undefined && value !== null && String(value).trim())
      return String(value);
  }
  return "";
}

function quantity(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0)
    throw new Error("Invalid measured quantity");
  return parsed;
}

function declared(row: CsvRecord, field: string, ...aliases: string[]): string {
  return Object.hasOwn(row, field)
    ? String(row[field] ?? "")
    : first(row, ...aliases);
}

export function normalizeSpendSourceRow(
  row: CsvRecord,
  fallbackFileId: string,
): CsvRecord {
  return {
    ...row,
    committed_base_amount_usd: declared(
      row,
      "committed_base_amount_usd",
      "commitment_run_rate_usd",
    ),
    invoice_amount_usd: declared(
      row,
      "invoice_amount_usd",
      "invoiced_amount_usd",
    ),
    paid_amount_usd: declared(row, "paid_amount_usd", "payment_amount_usd"),
    actual_spend_usd: declared(row, "actual_spend_usd", "spend_usd"),
    invoice_ref: first(row, "invoice_ref", "invoice_id"),
    currency: first(row, "currency") || "USD",
    source_file_id: first(row, "source_file_id") || fallbackFileId,
  };
}

export function normalizeUsageSourceRow(
  row: CsvRecord,
  fallbackFileId: string,
): CsvRecord {
  const entitledText = declared(row, "entitled_quantity", "entitled_seats");
  const activeText = declared(row, "active_quantity", "active_seats");
  const entitled = quantity(entitledText);
  const active = quantity(activeText);
  if (entitled !== null && active !== null && active > entitled)
    throw new Error("Active quantity exceeds entitlement");
  const known = entitled !== null && active !== null;
  const unused = quantity(first(row, "unused_quantity"));
  if (known && unused !== null && unused !== entitled - active)
    throw new Error("Conflicting unused quantity");
  return {
    ...row,
    entitled_quantity: entitledText,
    active_quantity: activeText,
    unused_quantity:
      first(row, "unused_quantity") || (known ? String(entitled - active) : ""),
    utilization_pct:
      first(row, "utilization_pct") ||
      (known && entitled > 0 ? String(active / entitled) : ""),
    metric_name: first(row, "metric_name") || "workspace_entitlement",
    unit:
      first(row, "unit") || (row.entitled_seats !== undefined ? "seats" : ""),
    annual_opportunity_usd: first(row, "annual_opportunity_usd"),
    source_file_id: first(row, "source_file_id") || fallbackFileId,
  };
}

export function preserveSourceFile(
  row: CsvRecord,
  fallbackFileId: string,
): string {
  return first(row, "source_file_id") || fallbackFileId;
}
