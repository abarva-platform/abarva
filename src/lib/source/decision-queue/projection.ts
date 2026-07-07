// Decision Queue projection — raw tenant-data rows → detector inputs.
//
// Pure projection layer. Takes the raw `data_inventory_records` payloads for
// the `vendor_contracts` and `it_financials` segments (whatever shape they
// arrived in) and normalizes them into the typed detector inputs. Kept pure
// and DB-free so it is fully unit-testable; the read adapter does the I/O and
// hands raw payloads here.
//
// The synthetic Apex dataset payloads are loose JSON — this module reads
// defensively, accepting common field-name variants, and skips a record only
// when the minimum identity (a contract id + vendor) cannot be established.

import type {
  FinancialLineInput,
  VendorContractInput,
} from "./detector-inputs";

/** A raw record row as projected from `data_inventory_records`. */
export interface RawTenantRecord {
  recordId: string;
  recordKind: string;
  title: string;
  payload: Record<string, unknown>;
}

// --- Field readers (defensive) ---------------------------------------------

function str(
  payload: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const v = payload[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function num(
  payload: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const v = payload[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/[^0-9.\-]/g, "");
      if (cleaned.length > 0) {
        const parsed = Number(cleaned);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
  }
  return null;
}

function bool(payload: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = payload[key];
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const lower = v.trim().toLowerCase();
      if (["true", "yes", "y", "auto", "auto-renew"].includes(lower))
        return true;
      if (["false", "no", "n", "none", "manual"].includes(lower)) return false;
    }
  }
  return false;
}

function isoDate(
  payload: Record<string, unknown>,
  ...keys: string[]
): string | null {
  const raw = str(payload, ...keys);
  if (!raw) return null;
  // Accept YYYY-MM-DD directly; otherwise try Date parsing.
  const direct = /^\d{4}-\d{2}-\d{2}/.exec(raw);
  if (direct) return direct[0];
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function rate01(
  payload: Record<string, unknown>,
  ...keys: string[]
): number | null {
  const n = num(payload, ...keys);
  if (n === null) return null;
  // Accept either a 0..1 fraction or a 0..100 percentage.
  if (n > 1) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
}

function criticality(
  payload: Record<string, unknown>,
): VendorContractInput["criticality"] {
  const raw = (
    str(payload, "business_criticality", "criticality", "risk_level") ?? ""
  ).toLowerCase();
  if (raw.includes("high") || raw.includes("critical")) return "high";
  if (raw.includes("low")) return "low";
  return "medium";
}

// --- Projections -----------------------------------------------------------

/**
 * Project a raw `vendor_contracts` row into a `VendorContractInput`. Returns
 * `null` when the record carries neither a vendor name nor a product — there
 * is nothing groundable to decide on (no fabrication).
 */
export function projectVendorContract(
  record: RawTenantRecord,
): VendorContractInput | null {
  const p = record.payload;
  const vendorName =
    str(p, "vendor_name", "vendor", "supplier", "supplier_name") ??
    record.title;
  const product =
    str(p, "product", "service", "tool_name", "system_name", "category") ??
    record.title;
  if (!vendorName && !product) return null;

  const category =
    str(p, "category", "capability", "domain", "service_category") ??
    product ??
    "uncategorized";

  return {
    contractId: record.recordId,
    vendorName,
    product,
    category,
    annualSpendUsd: num(
      p,
      "annual_spend_usd",
      "annual_value_usd",
      "annual_contract_value",
      "acv_usd",
      "annual_spend",
      "tcv_usd",
    ),
    termEndDate: isoDate(
      p,
      "term_end_date",
      "contract_end_date",
      "end_date",
      "expiry_date",
      "renewal_or_expiry",
      "renewal_date",
      "contract_expiry",
    ),
    autoRenew: bool(p, "auto_renew", "auto_renewal", "evergreen"),
    noticePeriodDays: num(
      p,
      "notice_period_days",
      "notice_days",
      "termination_notice_days",
    ),
    utilizationRate: rate01(
      p,
      "utilization_rate",
      "utilization",
      "adoption_rate",
      "seat_utilization",
      "license_utilization",
    ),
    criticality: criticality(p),
    ownerRef: str(p, "owner_id", "relationship_owner", "it_owner", "owner"),
  };
}

/**
 * Project a raw `it_financials` row into a `FinancialLineInput`. Returns
 * `null` when neither a budget nor a benchmark figure is present.
 */
export function projectFinancialLine(
  record: RawTenantRecord,
): FinancialLineInput | null {
  const p = record.payload;
  const budget = num(
    p,
    "annual_budget_usd",
    "budget_usd",
    "annual_spend_usd",
    "planned_spend_usd",
    "budget",
  );
  const benchmark = num(
    p,
    "benchmark_usd",
    "benchmark_annual_usd",
    "market_benchmark_usd",
    "should_cost_usd",
    "category_benchmark_usd",
  );
  if (budget === null && benchmark === null) return null;
  const category =
    str(
      p,
      "category",
      "capability",
      "domain",
      "cost_category",
      "spend_category",
    ) ?? record.title;
  return {
    recordId: record.recordId,
    category,
    annualBudgetUsd: budget ?? benchmark ?? 0,
    benchmarkUsd: benchmark,
  };
}

/**
 * Canonical-source ranking for vendor-contract record IDs.
 *
 * Multiple source-system rows can map to the same real-world contract:
 *   - `ven:<tenant>:<n>`                        — vendor master record
 *   - `contract_clause_inventory:contracts:<n>` — clause-inventory extract
 *   - other ad-hoc extracts
 *
 * The vendor master record is the system of record for a contract. When two
 * rows resolve to the same (vendor, product) pair, the canonical row wins.
 * Lower number = higher priority.
 */
function canonicalSourceRank(recordId: string): number {
  if (recordId.startsWith("ven:")) return 0;
  if (recordId.startsWith("vendor:")) return 0;
  if (recordId.startsWith("contract:")) return 1;
  if (recordId.startsWith("contract_clause_inventory:")) return 3;
  return 2;
}

/** Stable natural key for a projected contract: lowercased vendor + product. */
function vendorContractKey(input: VendorContractInput): string {
  const vendor = (input.vendorName ?? "").trim().toLowerCase();
  const product = (input.product ?? "").trim().toLowerCase();
  return `${vendor}::${product}`;
}

function pickCanonicalContract(
  existing: VendorContractInput,
  candidate: VendorContractInput,
): VendorContractInput {
  const existingRank = canonicalSourceRank(existing.contractId);
  const candidateRank = canonicalSourceRank(candidate.contractId);
  if (candidateRank < existingRank) return candidate;
  if (candidateRank > existingRank) return existing;

  const existingSpend = existing.annualSpendUsd ?? 0;
  const candidateSpend = candidate.annualSpendUsd ?? 0;
  if (candidateSpend > existingSpend) return candidate;
  return existing;
}

/**
 * Bulk-project vendor-contract rows, dropping unprojectable records.
 *
 * The Decision Queue is a per-contract review surface, not a per-source-row
 * audit log. Collapse duplicate source-system rows for the same
 * (vendor, product), preferring canonical vendor-master rows and then the
 * row with the stronger pricing signal.
 */
export function projectVendorContracts(
  records: RawTenantRecord[],
): VendorContractInput[] {
  const byKey = new Map<string, VendorContractInput>();
  for (const r of records) {
    const projected = projectVendorContract(r);
    if (!projected) continue;
    const key = vendorContractKey(projected);
    const existing = byKey.get(key);
    byKey.set(
      key,
      existing ? pickCanonicalContract(existing, projected) : projected,
    );
  }
  return Array.from(byKey.values());
}

/** Bulk-project financial-line rows, dropping unprojectable records. */
export function projectFinancialLines(
  records: RawTenantRecord[],
): FinancialLineInput[] {
  const out: FinancialLineInput[] = [];
  for (const r of records) {
    const projected = projectFinancialLine(r);
    if (projected) out.push(projected);
  }
  return out;
}
