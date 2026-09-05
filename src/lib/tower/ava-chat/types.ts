// Tower aVa chat — module expert types.
//
// Tower's governing constraint is different from every other surface: Tower
// read models and metric/fact tables own values; Claude owns narrative only.
// So this packet never carries a computed figure. It carries figures the
// deterministic layer already published and marked safe to display, plus the
// reasons a claim is blocked. aVa explains; it does not calculate.

import type { AvaModulePacketBase } from "@/lib/agent/module-expert-contract";

export type TowerAvaAnswerMode =
  | "metric_status"
  | "value_realization"
  | "adoption_status"
  | "funding_gate"
  | "evidence_gap"
  | "out_of_scope_redirect"
  | "general";

export type TowerAvaQualityCheckId =
  | "no_unsupported_number"
  | "no_realized_value_overclaim"
  | "no_certification_claim"
  | "names_evidence_boundary"
  | "no_banned_internal_language";

/** A figure the deterministic layer published and cleared for display. */
export interface TowerAvaDisplayableMetric {
  metricId: string;
  label: string;
  displayValue: string;
  /** Normalized figure fingerprints the answer quality gate may accept. */
  normalizedFigures: string[];
  basis: string;
}

/** A value claim, and whether realized-value language is permitted for it. */
export interface TowerAvaValueClaimSummary {
  claimId: string;
  label: string;
  gateStatus: string;
  realizedValueLanguageAllowed: boolean;
  reason: string;
  requiredEvidence: string[];
}

export interface TowerAvaChatPacket extends AvaModulePacketBase<"tower"> {
  /** Only metrics the deterministic layer marked safeToDisplay. */
  displayableMetrics: TowerAvaDisplayableMetric[];
  /** Metrics that exist but are withheld, with no value carried. */
  withheldMetricLabels: string[];
  /** All normalized figure fingerprints aVa may state in this turn. */
  permittedFigureFingerprints: string[];
  valueClaims: TowerAvaValueClaimSummary[];
  blockedValueClaims: TowerAvaValueClaimSummary[];
  truthCaveats: string[];
  evidenceGaps: string[];
  projectionStatus: string;
}
