// ─────────────────────────────────────────────────────────────────────────────
// View-model for the Vendor & Contract Portfolio section (recommended Source
// page structure, section 2 of 8) — the first slice of the new cross-domain
// data model wired into a real page. Maps deterministic repository output
// into UI-ready rows; no numbers are computed here, only formatted.
// ─────────────────────────────────────────────────────────────────────────────

import {
  computeContractLeverageSignals,
  computeRenewalExposure,
  computeVendorConcentration,
  excludeSupplementalContracts,
  numberFromDb,
  summarizePortfolio,
  type ContractLeverageEntry,
  type RenewalExposureResult,
  type VendorConcentrationEntry,
} from "./vendor-contract-portfolio";
import type { SourceContractVendor360Row } from "./types";

export interface PortfolioStat {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly sub: string;
}

export interface ContractListEntry {
  readonly contractId: string;
  readonly contractName: string;
  readonly vendorName: string;
  readonly annualValue: number;
  readonly endDate: string | null;
  readonly autoRenew: boolean;
}

export interface VendorPortfolioView {
  readonly asOfDateIso: string;
  readonly statCards: readonly PortfolioStat[];
  readonly concentration: readonly VendorConcentrationEntry[];
  readonly top5Share: number;
  readonly top10Share: number;
  readonly renewal: RenewalExposureResult;
  readonly highPriorityLeverage: readonly ContractLeverageEntry[];
  readonly contracts: readonly ContractListEntry[];
  readonly rowCount: number;
  readonly isEmpty: boolean;
}

function formatUsdCompact(value: number): string {
  if (!Number.isFinite(value)) return "Not available";
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

export function buildVendorPortfolioView(
  rows: readonly SourceContractVendor360Row[],
  asOfDateIso: string,
): VendorPortfolioView {
  const cleaned = excludeSupplementalContracts(rows);
  const summary = summarizePortfolio(cleaned);
  const concentration = computeVendorConcentration(cleaned);
  const renewal = computeRenewalExposure(cleaned, asOfDateIso, 180);
  const leverage = computeContractLeverageSignals(cleaned).filter(
    (entry) => entry.isHighPriority,
  );

  const statCards: PortfolioStat[] = [
    {
      key: "contracts",
      label: "Contracts",
      value: String(summary.contractCount),
      sub: `${summary.vendorCount} vendors`,
    },
    {
      key: "annual-value",
      label: "Annual contract value",
      value: formatUsdCompact(summary.totalAnnualValue),
      sub: `${formatUsdCompact(summary.totalCommittedValue)} total committed`,
    },
    {
      key: "actual-spend",
      label: "Actual annual spend",
      value: formatUsdCompact(summary.totalActualAnnualSpend),
      sub: `vs. ${formatUsdCompact(summary.totalCommittedAnnualSpend)} committed`,
    },
    {
      key: "auto-renew",
      label: "Auto-renewing",
      value: String(summary.autoRenewCount),
      sub: `of ${summary.contractCount} contracts`,
    },
    {
      key: "concentration",
      label: "Top-5 concentration",
      value: formatPct(concentration.topNShare(5)),
      sub: `top-10 ${formatPct(concentration.topNShare(10))}`,
    },
    {
      key: "notice-missed",
      label: "Notice deadline passed",
      value: String(renewal.noticeDeadlinePassed.length),
      sub: `${formatUsdCompact(renewal.noticeDeadlinePassedAnnualValue)} still active`,
    },
  ];

  const contracts: ContractListEntry[] = [...cleaned]
    .sort(
      (a, b) =>
        (numberFromDb(b.annual_value) ?? 0) -
        (numberFromDb(a.annual_value) ?? 0),
    )
    .map((row) => ({
      contractId: row.contract_id,
      contractName: row.contract_name,
      vendorName: row.vendor_name,
      annualValue: numberFromDb(row.annual_value) ?? 0,
      endDate: row.end_date,
      autoRenew: row.auto_renew,
    }));

  return {
    asOfDateIso,
    statCards,
    concentration: concentration.byVendor,
    top5Share: concentration.topNShare(5),
    top10Share: concentration.topNShare(10),
    renewal,
    highPriorityLeverage: leverage,
    contracts,
    rowCount: cleaned.length,
    isEmpty: cleaned.length === 0,
  };
}

export { formatUsdCompact, formatPct };
