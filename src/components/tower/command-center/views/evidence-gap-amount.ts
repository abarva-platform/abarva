import { formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerEvidenceGapView } from "@/lib/tower/command-center/types";

/** Keep planning benefits separate from Finance-reviewed amounts in loaded months. */
export function evidenceGapAmount(gap: TowerEvidenceGapView): {
  label: string;
  value: string;
} {
  if (gap.gapStage === "claim_gate" && gap.validatedValueHeldUsd > 0) {
    return {
      label: "Finance-reviewed amount held in loaded months",
      value: formatUsdM(gap.validatedValueHeldUsd),
    };
  }
  if (gap.valueAtStakeUsd !== null && gap.promisedValueExposedUsd > 0) {
    return {
      label: "Projected yearly benefit affected",
      value: formatUsdM(gap.promisedValueExposedUsd),
    };
  }
  return { label: "Amount", value: "Not loaded" };
}

export function byEvidencePriority(a: TowerEvidenceGapView, b: TowerEvidenceGapView): number {
  const rank = { high: 0, medium: 1, low: 2 };
  return rank[a.priority] - rank[b.priority] || a.missing.localeCompare(b.missing);
}
