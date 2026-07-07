// Adapters: MoveDecisionModel → the shared engine's input shapes. Each returns null when the
// model lacks the content (so the Visual Director falls back to a gap-card rather than an empty or
// fabricated exhibit). No client-fact numbers are invented here — every value comes from the model.

import { compactUsd } from "./index";
import type {
  WaterfallStep,
  EconomicsTile,
  ScorecardOption,
  StackSegment,
} from "./index";
import type { TreeNode } from "./tree-exhibit";
import type { MoveDecisionModel } from "@/lib/deliverables/decision-model/types";

/** Estimate-twice → an investment waterfall (Traditional cost stepping down to AI-native). */
export function toValueWaterfallSteps(m: MoveDecisionModel): WaterfallStep[] | null {
  const e = m.valueModel?.estimateTwice;
  if (!e) return null;
  const saving = e.traditional.costUsd - e.aiNative.costUsd;
  return [
    { label: "Traditional cost", amount: e.traditional.costUsd },
    { label: "AI-native saving", amount: -saving },
  ];
}

/** Estimate-twice → the headline-economics strip. */
export function toEconomicsTiles(m: MoveDecisionModel): EconomicsTile[] | null {
  const e = m.valueModel?.estimateTwice;
  if (!e) return null;
  const tiles: EconomicsTile[] = [];
  if (e.costReductionPct != null) tiles.push({ label: "Cost reduction", value: `${e.costReductionPct}%`, tone: "good" });
  if (e.aiNative.paybackMonths != null) tiles.push({ label: "Payback", value: `${e.aiNative.paybackMonths} mo`, tone: "good" });
  if (e.productivityMultiplier != null) tiles.push({ label: "Productivity", value: `${e.productivityMultiplier}×`, tone: "good" });
  if (e.aiNative.npvUsd != null) tiles.push({ label: "NPV (AI-native)", value: compactUsd(e.aiNative.npvUsd), tone: "neutral" });
  return tiles.length ? tiles : null;
}

/**
 * Required decision → an option scorecard. `referenceScore` is a relative FIT emphasis derived
 * from the model's own recommendation (recommended option vs the rest) — it is presentational, not
 * a measured client metric, and asserts no client-specific number.
 */
export function toDecisionScorecardOptions(m: MoveDecisionModel): ScorecardOption[] | null {
  const d = m.requiredDecisions[0];
  if (!d || d.options.length === 0) return null;
  return d.options.map((o) => {
    const selected = o.id === d.recommendedOptionId;
    return {
      name: o.label,
      shapeLabel: o.id,
      referenceScore: selected ? 100 : 55,
      productionShaped: selected,
      selected,
      disposition: selected ? d.rationale : o.cons[0] ?? "Not selected.",
    };
  });
}

/** Value pools → a cost/value stack. */
export function toValueStackSegments(m: MoveDecisionModel): StackSegment[] | null {
  const pools = m.valueModel?.valuePools;
  if (!pools?.length) return null;
  const colors = ["#0B4A91", "#4A7FB5", "#8FB3D4", "#C9C4BA"];
  return pools.map((p, i) => ({ label: p.lever, value: p.annualValueUsd, color: colors[i % colors.length] }));
}

/** Value model → a value tree (thesis → value pools). */
export function toValueTree(m: MoveDecisionModel): TreeNode | null {
  const vm = m.valueModel;
  if (!vm) return null;
  return {
    label: vm.valueThesis || "Value thesis",
    children: (vm.valuePools ?? []).map((pool) => ({ label: `${pool.lever} (${compactUsd(pool.annualValueUsd)})` })),
  };
}

/**
 * Claims → an issue / root-cause tree. The recommendation is the root; each claim a branch; a
 * claim with no supporting evidence renders as a GAP branch, and contradicting evidence is shown
 * as a dashed counter-branch (so the tree surfaces the counter-case, not just the supporting one).
 */
export function toClaimTree(m: MoveDecisionModel): TreeNode | null {
  if (m.claims.length === 0) return null;
  return {
    label: m.answerFirstRecommendation || m.governingDecision || "Decision",
    children: m.claims.map((c) => ({
      label: c.statement,
      isGap: c.supportingEvidence.length === 0,
      children: c.contradictingEvidence.length
        ? [{ label: `Counter-evidence [${c.contradictingEvidence.join(", ")}]`, isGap: true }]
        : undefined,
    })),
  };
}
