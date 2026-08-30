// ─────────────────────────────────────────────────────────────────────────────
// Deterministic vendor/contract portfolio analysis over source.contract_vendor_360.
//
// Every function here is pure and takes rows + an explicit as-of date — none
// of them read the clock. The SkyHarbor demo dataset's "current" date is a
// synthetic 2027-06-30, not real-world today; passing a caller-supplied
// asOfDateIso is the only way to get renewal-window math right for it and
// keeps the functions testable without a fake-clock harness.
//
// This module produces the deterministic exposure/leverage signals Claude's
// advisory packet is built from. Claude may narrate these; it must not
// recompute them (see docs on source_negotiation_brief / source_vendor_strategy).
// ─────────────────────────────────────────────────────────────────────────────

import {
  SUPPLEMENTAL_CONTRACT_VENDOR_REFS,
  type SourceContractApplicationScopeRow,
  type SourceContractVendor360Row,
} from "./types";

/**
 * Postgres NUMERIC/DECIMAL columns come back from node-postgres as strings,
 * not numbers, to avoid silent precision loss — but this repo's row types
 * (types.ts) declare them as `number | null` because that's what every other
 * caller wants to work with. That mismatch is invisible until two values get
 * combined with `+`: `0 + "50000000.00"` is string concatenation in
 * JavaScript, not addition, and it only shows up once a vendor has more than
 * one contract to sum. Every arithmetic accumulation in this file must read
 * through this coercion — reading `?? 0` alone is not enough.
 */
export function numberFromDb(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toNum(value: number | string | null | undefined): number {
  return numberFromDb(value) ?? 0;
}

// ---------------------------------------------------------------------------
// Supplemental-contract exclusion
// ---------------------------------------------------------------------------

/**
 * Drop any row whose vendor_ref is in the supplemental-evidence allowlist
 * (see SUPPLEMENTAL_CONTRACT_VENDOR_REFS) before any portfolio-level rollup.
 * A contract loaded as supplemental demo evidence (e.g. an enhanced synthetic
 * document not part of the reconciled register) must never silently move
 * the concentration, total-value, or budget-reconciliation numbers.
 */
export function excludeSupplementalContracts<T extends { vendor_ref: string }>(
  rows: readonly T[],
): T[] {
  if (SUPPLEMENTAL_CONTRACT_VENDOR_REFS.size === 0) return [...rows];
  return rows.filter(
    (row) => !SUPPLEMENTAL_CONTRACT_VENDOR_REFS.has(row.vendor_ref),
  );
}

// ---------------------------------------------------------------------------
// Portfolio summary
// ---------------------------------------------------------------------------

export interface PortfolioSummary {
  readonly contractCount: number;
  readonly vendorCount: number;
  readonly totalAnnualValue: number;
  readonly totalCommittedValue: number;
  readonly totalCommittedAnnualSpend: number;
  readonly totalActualAnnualSpend: number;
  readonly autoRenewCount: number;
}

export function summarizePortfolio(
  rows: readonly SourceContractVendor360Row[],
): PortfolioSummary {
  const vendorRefs = new Set(rows.map((r) => r.vendor_ref));
  const sum = (
    pick: (r: SourceContractVendor360Row) => number | string | null,
  ) => rows.reduce((acc, r) => acc + toNum(pick(r)), 0);
  return {
    contractCount: rows.length,
    vendorCount: vendorRefs.size,
    totalAnnualValue: sum((r) => r.annual_value),
    totalCommittedValue: sum((r) => r.total_committed_value),
    totalCommittedAnnualSpend: sum((r) => r.committed_annual_spend),
    totalActualAnnualSpend: sum((r) => r.actual_annual_spend),
    autoRenewCount: rows.filter((r) => r.auto_renew).length,
  };
}

// ---------------------------------------------------------------------------
// Concentration
// ---------------------------------------------------------------------------

export interface VendorConcentrationEntry {
  readonly vendorRef: string;
  readonly vendorName: string;
  readonly annualValue: number;
  readonly shareOfTotal: number;
  readonly cumulativeShare: number;
}

export interface VendorConcentrationResult {
  readonly totalAnnualValue: number;
  readonly byVendor: readonly VendorConcentrationEntry[];
  /** Cumulative share at rank N (1-indexed), e.g. topNShare(5) for "top-5 concentration." */
  topNShare(n: number): number;
}

/** Rank vendors by summed annual_value, richest first, with running cumulative share. */
export function computeVendorConcentration(
  rows: readonly SourceContractVendor360Row[],
): VendorConcentrationResult {
  const byVendorValue = new Map<string, { name: string; value: number }>();
  for (const row of rows) {
    const existing = byVendorValue.get(row.vendor_ref);
    const delta = toNum(row.annual_value);
    if (existing) existing.value += delta;
    else
      byVendorValue.set(row.vendor_ref, {
        name: row.vendor_name,
        value: delta,
      });
  }
  const totalAnnualValue = [...byVendorValue.values()].reduce(
    (acc, v) => acc + v.value,
    0,
  );
  const ranked = [...byVendorValue.entries()].sort(
    (a, b) => b[1].value - a[1].value,
  );

  let running = 0;
  const byVendor: VendorConcentrationEntry[] = ranked.map(
    ([vendorRef, { name, value }]) => {
      running += value;
      return {
        vendorRef,
        vendorName: name,
        annualValue: value,
        shareOfTotal: totalAnnualValue > 0 ? value / totalAnnualValue : 0,
        cumulativeShare: totalAnnualValue > 0 ? running / totalAnnualValue : 0,
      };
    },
  );

  return {
    totalAnnualValue,
    byVendor,
    topNShare(n: number): number {
      return byVendor[Math.min(n, byVendor.length) - 1]?.cumulativeShare ?? 0;
    },
  };
}

// ---------------------------------------------------------------------------
// Renewal posture
// ---------------------------------------------------------------------------

export interface RenewalExposureResult {
  readonly asOfDateIso: string;
  /** Contracts whose end_date is already before the as-of date. These are data-freshness exclusions, not live commercial deadlines. */
  readonly expiredAsOfDate: readonly SourceContractVendor360Row[];
  readonly expiredAsOfDateAnnualValue: number;
  /** Contracts whose end_date falls within windowDays of asOfDateIso, not yet past it. */
  readonly expiringWithinWindow: readonly SourceContractVendor360Row[];
  readonly expiringWithinWindowAnnualValue: number;
  /**
   * Still-active contracts (end_date in the future) whose notice deadline
   * (end_date - notice_period_days) has already passed as of asOfDateIso —
   * i.e. commercial optionality may already be lost even though the
   * contract hasn't technically expired yet.
   */
  readonly noticeDeadlinePassed: readonly SourceContractVendor360Row[];
  readonly noticeDeadlinePassedAnnualValue: number;
  readonly noticeDeadlinePassedAutoRenew: readonly SourceContractVendor360Row[];
  readonly noticeDeadlinePassedAutoRenewAnnualValue: number;
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export function computeRenewalExposure(
  rows: readonly SourceContractVendor360Row[],
  asOfDateIso: string,
  windowDays = 180,
): RenewalExposureResult {
  const asOf = new Date(asOfDateIso);
  if (Number.isNaN(asOf.getTime())) {
    throw new Error(
      `compute_renewal_exposure_invalid_as_of_date: ${asOfDateIso}`,
    );
  }

  const withEndDate = rows.filter(
    (r): r is SourceContractVendor360Row & { end_date: string } =>
      typeof r.end_date === "string" && r.end_date.length > 0,
  );

  const expiredAsOfDate = withEndDate.filter((r) => {
    const end = new Date(r.end_date);
    return end.getTime() < asOf.getTime();
  });

  const expiringWithinWindow = withEndDate.filter((r) => {
    const end = new Date(r.end_date);
    const days = daysBetween(asOf, end);
    return days >= 0 && days <= windowDays;
  });

  const noticeDeadlinePassed = withEndDate.filter((r) => {
    const end = new Date(r.end_date);
    if (end.getTime() <= asOf.getTime()) return false; // already expired, not "still active"
    const noticePeriodDays = numberFromDb(r.notice_period_days);
    if (noticePeriodDays == null) return false; // no notice term to have missed
    const noticeDeadline = new Date(
      end.getTime() - noticePeriodDays * 24 * 60 * 60 * 1000,
    );
    return noticeDeadline.getTime() < asOf.getTime();
  });

  const noticeDeadlinePassedAutoRenew = noticeDeadlinePassed.filter(
    (r) => r.auto_renew,
  );

  const sumAnnual = (list: readonly SourceContractVendor360Row[]) =>
    list.reduce((acc, r) => acc + toNum(r.annual_value), 0);

  return {
    asOfDateIso,
    expiredAsOfDate,
    expiredAsOfDateAnnualValue: sumAnnual(expiredAsOfDate),
    expiringWithinWindow,
    expiringWithinWindowAnnualValue: sumAnnual(expiringWithinWindow),
    noticeDeadlinePassed,
    noticeDeadlinePassedAnnualValue: sumAnnual(noticeDeadlinePassed),
    noticeDeadlinePassedAutoRenew,
    noticeDeadlinePassedAutoRenewAnnualValue: sumAnnual(
      noticeDeadlinePassedAutoRenew,
    ),
  };
}

// ---------------------------------------------------------------------------
// Contract leverage (benchmarking / alternatives / dependency composite)
// ---------------------------------------------------------------------------

export type LeverageSignal =
  | "benchmarking"
  | "alternatives"
  | "skill_dependency"
  | "regional_dependency";

export interface ContractLeverageEntry {
  readonly contractId: string;
  readonly vendorRef: string;
  readonly vendorName: string;
  readonly annualValue: number;
  /** True for each weak-leverage signal present on this contract. */
  readonly weakSignals: Readonly<Record<LeverageSignal, boolean>>;
  readonly weakSignalCount: number;
  /** High spend + multiple weak-leverage signals = priority sourcing intervention. */
  readonly isHighPriority: boolean;
}

const WEAK_BENCHMARKING = new Set(["none", "no", "no_clause", "limited"]);
const WEAK_ALTERNATIVES = new Set([
  "none",
  "no_alternatives",
  "limited",
  "market_scan_required",
]);

function isWeakSignal(
  value: string | null,
  weakValues: ReadonlySet<string>,
): boolean {
  if (!value) return false;
  return weakValues.has(value.trim().toLowerCase().replace(/\s+/g, "_"));
}

/**
 * High-spend threshold defaults to the 75th-percentile annual_value within
 * the passed rows, so "high spend" is relative to the actual portfolio
 * rather than a hardcoded dollar figure that would be wrong for a different
 * tenant's scale. Callers may override with an explicit dollar threshold.
 */
export function computeContractLeverageSignals(
  rows: readonly SourceContractVendor360Row[],
  options?: { highSpendThreshold?: number },
): readonly ContractLeverageEntry[] {
  const sortedValues = rows
    .map((r) => toNum(r.annual_value))
    .sort((a, b) => a - b);
  const p75Index = Math.floor(sortedValues.length * 0.75);
  const highSpendThreshold =
    options?.highSpendThreshold ??
    sortedValues[Math.min(p75Index, sortedValues.length - 1)] ??
    0;

  return rows.map((row) => {
    const weakSignals: Record<LeverageSignal, boolean> = {
      benchmarking: isWeakSignal(row.benchmarking_clause, WEAK_BENCHMARKING),
      alternatives: isWeakSignal(row.alternatives_available, WEAK_ALTERNATIVES),
      skill_dependency: Boolean(
        row.concentration_note?.toLowerCase().includes("specialized"),
      ),
      regional_dependency: Boolean(
        row.concentration_note?.toLowerCase().includes("regional"),
      ),
    };
    const weakSignalCount = Object.values(weakSignals).filter(Boolean).length;
    const annualValue = toNum(row.annual_value);
    return {
      contractId: row.contract_id,
      vendorRef: row.vendor_ref,
      vendorName: row.vendor_name,
      annualValue,
      weakSignals,
      weakSignalCount,
      isHighPriority: annualValue >= highSpendThreshold && weakSignalCount >= 2,
    };
  });
}

// ---------------------------------------------------------------------------
// Application-scope confidence tiering (source.contract_application_scope)
// ---------------------------------------------------------------------------

export interface ApplicationScopeConfidenceTiers {
  readonly explicit: readonly SourceContractApplicationScopeRow[];
  readonly reviewed: readonly SourceContractApplicationScopeRow[];
  readonly vendorInferred: readonly SourceContractApplicationScopeRow[];
  readonly unresolved: readonly SourceContractApplicationScopeRow[];
  readonly totalCount: number;
}

/**
 * Separate contract-to-application links by evidentiary strength.
 *
 * `explicitApplicationRefs` should be the set of (contract_id, application_ref)
 * pairs known to come from an actual SOW/contract-scope document reference
 * (the raw register's 357-row explicit set). Everything in the view that
 * isn't in that set was reached only by joining on vendor_ref, and must be
 * labeled vendor_based_inference, not blended into "contract scope."
 *
 * Passing an empty explicitPairs set (the honest default until that 357-row
 * reference set is itself loaded into this read path) puts every row in
 * `unresolved` rather than silently defaulting to a stronger tier — see
 * SOURCE-DATA-MODEL follow-up to wire the real explicit-scope reference.
 */
export function tierApplicationScopeByConfidence(
  rows: readonly SourceContractApplicationScopeRow[],
  explicitPairs: ReadonlySet<string> = new Set(),
): ApplicationScopeConfidenceTiers {
  const explicit: SourceContractApplicationScopeRow[] = [];
  const vendorInferred: SourceContractApplicationScopeRow[] = [];
  const unresolved: SourceContractApplicationScopeRow[] = [];

  for (const row of rows) {
    const key = `${row.contract_id}::${row.application_ref}`;
    if (explicitPairs.has(key)) {
      explicit.push(row);
    } else if (explicitPairs.size > 0) {
      // We have a real explicit-reference set loaded, so anything absent from
      // it but still vendor-linked is a genuine vendor-based inference.
      vendorInferred.push(row);
    } else {
      // No explicit-reference set loaded yet — do not guess; mark unresolved.
      unresolved.push(row);
    }
  }

  return {
    explicit,
    reviewed: [],
    vendorInferred,
    unresolved,
    totalCount: rows.length,
  };
}
