// ─────────────────────────────────────────────────────────────────────────────
// Deterministic, Source-computed "sourcing opportunities" — ranked candidates
// for negotiation or renegotiation action, derived entirely from
// source.contract_vendor_360 rows already verified real for this tenant.
//
// This is NOT a read against a dedicated source.sourcing_opportunity Postgres
// view. The SkyHarbor audit confirmed source.contract_vendor_360,
// source.contract_360, source.contract_application_scope,
// source.vendor_contract_portfolio, tower.metric_observation, and
// tower.value_claim as real (see types.ts header, exact row counts). It did
// not confirm a sourcing_opportunity table exists or what its columns would
// be — guessing a schema for an unconfirmed table would break the
// no-fabrication discipline the rest of this data model was built under. So
// this module computes opportunities from data already proven real instead.
// If source.sourcing_opportunity is confirmed to exist later with a real
// export to verify column names against, replace this module with a
// read-adapter call — do not extend it to paper over the gap.
// ─────────────────────────────────────────────────────────────────────────────

import {
  computeContractLeverageSignals,
  computeRenewalExposure,
  computeVendorConcentration,
  excludeSupplementalContracts,
  numberFromDb,
} from "./vendor-contract-portfolio";
import type { SourceContractVendor360Row } from "./types";

export type SourcingOpportunityReason =
  | "high_priority_leverage"
  | "notice_deadline_passed"
  | "top_concentration_vendor";

export interface SourcingOpportunity {
  readonly contractId: string;
  readonly vendorRef: string;
  readonly vendorName: string;
  readonly contractName: string;
  readonly annualValue: number;
  readonly reasons: readonly SourcingOpportunityReason[];
  readonly rationale: readonly string[];
}

export interface SourcingOpportunitiesResult {
  readonly asOfDateIso: string;
  readonly opportunities: readonly SourcingOpportunity[];
}

interface MutableOpportunity {
  contractId: string;
  vendorRef: string;
  vendorName: string;
  contractName: string;
  annualValue: number;
  reasons: SourcingOpportunityReason[];
  rationale: string[];
}

function getOrCreate(
  map: Map<string, MutableOpportunity>,
  row: SourceContractVendor360Row,
): MutableOpportunity {
  const existing = map.get(row.contract_id);
  if (existing) return existing;
  const created: MutableOpportunity = {
    contractId: row.contract_id,
    vendorRef: row.vendor_ref,
    vendorName: row.vendor_name,
    contractName: row.contract_name,
    annualValue: numberFromDb(row.annual_value) ?? 0,
    reasons: [],
    rationale: [],
  };
  map.set(row.contract_id, created);
  return created;
}

function addReason(
  entry: MutableOpportunity,
  reason: SourcingOpportunityReason,
  rationale: string,
): void {
  if (!entry.reasons.includes(reason)) entry.reasons.push(reason);
  entry.rationale.push(rationale);
}

export function computeSourcingOpportunities(
  rows: readonly SourceContractVendor360Row[],
  asOfDateIso: string,
  options?: { topConcentrationCount?: number },
): SourcingOpportunitiesResult {
  const cleaned = excludeSupplementalContracts(rows);
  const byContractId = new Map<string, SourceContractVendor360Row>();
  for (const row of cleaned) byContractId.set(row.contract_id, row);

  const opportunities = new Map<string, MutableOpportunity>();

  const highPriorityLeverage = computeContractLeverageSignals(cleaned).filter(
    (e) => e.isHighPriority,
  );
  for (const signal of highPriorityLeverage) {
    const row = byContractId.get(signal.contractId);
    if (!row) continue;
    const entry = getOrCreate(opportunities, row);
    const weakLabels = (
      Object.keys(signal.weakSignals) as Array<keyof typeof signal.weakSignals>
    )
      .filter((key) => signal.weakSignals[key])
      .join(", ");
    addReason(
      entry,
      "high_priority_leverage",
      `High spend with ${signal.weakSignalCount} weak-leverage signals (${weakLabels}).`,
    );
  }

  const renewal = computeRenewalExposure(cleaned, asOfDateIso, 180);
  for (const row of renewal.noticeDeadlinePassed) {
    const entry = getOrCreate(opportunities, row);
    addReason(
      entry,
      "notice_deadline_passed",
      row.auto_renew
        ? "Notice deadline already passed and the contract auto-renews — optionality may be lost without action."
        : "Notice deadline already passed on a still-active contract.",
    );
  }

  const topConcentrationCount = options?.topConcentrationCount ?? 3;
  const concentration = computeVendorConcentration(cleaned);
  const topVendorRefs = new Set(
    concentration.byVendor
      .slice(0, topConcentrationCount)
      .map((v) => v.vendorRef),
  );
  for (const row of cleaned) {
    if (!topVendorRefs.has(row.vendor_ref)) continue;
    const entry = getOrCreate(opportunities, row);
    const vendorRank = concentration.byVendor.find(
      (v) => v.vendorRef === row.vendor_ref,
    );
    addReason(
      entry,
      "top_concentration_vendor",
      `Vendor is top-${topConcentrationCount} by annual value (${
        vendorRank ? `${(vendorRank.shareOfTotal * 100).toFixed(1)}%` : "n/a"
      } of portfolio) — consolidated negotiation leverage.`,
    );
  }

  const ranked = [...opportunities.values()].sort(
    (a, b) => b.annualValue - a.annualValue,
  );

  return {
    asOfDateIso,
    opportunities: ranked,
  };
}
