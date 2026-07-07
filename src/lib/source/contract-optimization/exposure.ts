import type {
  ContractOptimizationFinding,
  ContractOptimizationLever,
  ContractOptimizationMveProfile,
} from "./types";

const EVIDENCED_LEVER_TYPES = new Set<
  ContractOptimizationLever["leverType"]
>([
  "recover_invoice_leakage",
  "reprice_staffing_coverage",
  "convert_change_orders_to_catalog",
]);

export interface ContractOptimizationExposureRollup {
  lowUsd: number | null;
  highUsd: number | null;
  label: string;
}

export function computeContractOptimizationExposureRollup(
  profile: Pick<ContractOptimizationMveProfile, "levers">,
): ContractOptimizationExposureRollup {
  const evidencedLevers = profile.levers.filter(
    (lever) =>
      EVIDENCED_LEVER_TYPES.has(lever.leverType) &&
      Number.isFinite(lever.annualImpactHighUsd),
  );

  const highUsd = evidencedLevers.reduce(
    (sum, lever) => sum + (lever.annualImpactHighUsd ?? 0),
    0,
  );

  if (highUsd <= 0) {
    return {
      lowUsd: null,
      highUsd: null,
      label: "Value to be quantified during vendor cure review",
    };
  }

  const explicitLow = evidencedLevers.reduce(
    (sum, lever) => sum + (lever.annualImpactLowUsd ?? 0),
    0,
  );
  const lowUsd = Math.max(explicitLow, Math.round(highUsd * 0.75));

  return {
    lowUsd,
    highUsd,
    label: `approximately ${money(lowUsd)}-${money(highUsd)} annualized, subject to vendor cure review`,
  };
}

export function formatContractOptimizationMoney(value: number | null): string {
  return money(value);
}

export function extractFindingExposureUsd(
  finding: Pick<ContractOptimizationFinding, "title" | "currentState">,
): number | null {
  const text = `${finding.title} ${finding.currentState}`;
  const moneyValues = [...text.matchAll(/\$([\d,]+)(?:\.\d+)?/g)]
    .map((match) => Number(match[1]?.replaceAll(",", "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!moneyValues.length) return null;
  if (/change[- ]order/i.test(text)) {
    const recurring = text.match(/\$([\d,]+)(?:\.\d+)?\s+appears recurring/i);
    if (recurring?.[1]) return Number(recurring[1].replaceAll(",", ""));
  }
  if (/annualized|annually|annual/i.test(text)) {
    return moneyValues.at(-1) ?? null;
  }
  return moneyValues[0] ?? null;
}

function money(value: number | null): string {
  if (!value || !Number.isFinite(value)) return "value to be quantified";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
}
