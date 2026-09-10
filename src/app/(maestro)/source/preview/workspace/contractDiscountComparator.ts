import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";

type CloudCommitmentCoverageLike = {
  readonly contract_id: string;
  readonly vendor_name?: string | null;
  readonly cloud_provider?: string | null;
  readonly commitment_covered_spend_usd?: number | string | null;
  readonly expected_discount_pct?: number | string | null;
  readonly source_file_id?: string | null;
  readonly evidence_reference?: string | null;
};

type OpportunityLike = {
  readonly id: string;
  readonly label: string;
  readonly shortLabel?: string | null;
  readonly stageRaw?: string | null;
  readonly blockingGap?: string | null;
};

export type PortfolioDiscountComparatorSummary = {
  readonly heading: string;
  readonly headline: string;
  readonly basis: string;
  readonly caveat: string;
  readonly evidenceGate: string;
  readonly factLine: string;
  readonly selectedDiscountPct: number | null;
  readonly peerMedianPct: number | null;
  readonly peerLowPct: number | null;
  readonly peerHighPct: number | null;
  readonly peerContractCount: number;
  readonly peerObservationCount: number;
};

export function portfolioDiscountComparatorSummary(
  contractId: string | null | undefined,
  coverageRows: readonly CloudCommitmentCoverageLike[] = [],
  opportunities: readonly OpportunityLike[] = [],
): PortfolioDiscountComparatorSummary | null {
  const normalizedContractId = contractId?.trim();
  if (!normalizedContractId) return null;

  const discountSignal = opportunities.find((opportunity) =>
    /discount|re[-_\s]?price|pricing band/i.test(
      [
        opportunity.id,
        opportunity.label,
        opportunity.shortLabel,
        opportunity.blockingGap,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  );
  const selectedRows = coverageRows.filter(
    (row) => row.contract_id === normalizedContractId,
  );
  const selectedDiscountPct = median(
    selectedRows
      .map((row) => numberFromDb(row.expected_discount_pct))
      .map(normalizeDiscountPct)
      .filter(isFiniteNumber),
  );
  if (!discountSignal && selectedDiscountPct == null) return null;

  const selectedProvider =
    selectedRows.find((row) => row.cloud_provider)?.cloud_provider ?? null;
  const peerRows = coverageRows.filter((row) => {
    if (row.contract_id === normalizedContractId) return false;
    const expectedDiscount = normalizeDiscountPct(
      numberFromDb(row.expected_discount_pct),
    );
    if (expectedDiscount == null || !Number.isFinite(expectedDiscount)) {
      return false;
    }
    if (selectedProvider && row.cloud_provider !== selectedProvider) {
      return false;
    }
    return true;
  });
  const peerDiscounts = peerRows
    .map((row) => numberFromDb(row.expected_discount_pct))
    .map(normalizeDiscountPct)
    .filter(isFiniteNumber)
    .sort((left, right) => left - right);
  const peerMedianPct = median(peerDiscounts);
  const peerLowPct = peerDiscounts[0] ?? null;
  const peerHighPct = peerDiscounts[peerDiscounts.length - 1] ?? null;
  const peerContractCount = new Set(peerRows.map((row) => row.contract_id))
    .size;
  const peerObservationCount = peerRows.length;
  const selectedCommitment = sum(
    selectedRows.map((row) => numberFromDb(row.commitment_covered_spend_usd)),
  );
  const peerCommitment = sum(
    peerRows.map((row) => numberFromDb(row.commitment_covered_spend_usd)),
  );
  const currentDiscount =
    selectedDiscountPct == null
      ? "No loaded discount percentage"
      : `Loaded discount ${formatPct(selectedDiscountPct)}`;
  const peerComparison =
    peerMedianPct == null
      ? "no same-tenant cloud peer discount is loaded"
      : `same-tenant cloud peer median ${formatPct(peerMedianPct)}`;
  const peerRange =
    peerLowPct == null || peerHighPct == null
      ? null
      : peerLowPct === peerHighPct
        ? formatPct(peerLowPct)
        : `${formatPct(peerLowPct)}-${formatPct(peerHighPct)}`;
  const basis =
    peerMedianPct == null
      ? "Source can show the current contract's loaded discount signal, but it cannot benchmark the rate until a peer or market comparable is loaded."
      : `${peerContractCount} peer contract${peerContractCount === 1 ? "" : "s"} and ${peerObservationCount} same-tenant monthly coverage rows set a portfolio-relative range of ${peerRange}; selected-contract coverage rows total ${formatUsd(selectedCommitment)}, peer coverage rows total ${formatUsd(peerCommitment)}.`;
  const evidenceGate =
    discountSignal?.blockingGap ??
    "Accepted benchmark comparable required before discount-band value can be treated as supported.";

  return {
    heading: "Discount comparator",
    headline: `${currentDiscount}; ${peerComparison}.`,
    basis,
    caveat:
      "This is buyer-portfolio evidence, not an external market benchmark and not same-vendor price proof. It supports the negotiation question; it does not prove a market percentile.",
    evidenceGate,
    factLine: `Discount comparator: ${currentDiscount}; ${peerComparison}. ${basis} Evidence gate: ${evidenceGate}`,
    selectedDiscountPct,
    peerMedianPct,
    peerLowPct,
    peerHighPct,
    peerContractCount,
    peerObservationCount,
  };
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function normalizeDiscountPct(
  value: number | null | undefined,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.abs(value) > 1 ? value / 100 : value;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const left = sorted[middle - 1];
  const right = sorted[middle];
  return left == null || right == null ? null : (left + right) / 2;
}

function sum(values: Iterable<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (isFiniteNumber(value)) total += value;
  }
  return total;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
