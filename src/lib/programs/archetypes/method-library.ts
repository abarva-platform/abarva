// =============================================================================
// Analysis method library (PR-1).
// -----------------------------------------------------------------------------
// Strategy methods are declarative, reusable entries — archetypes COMPOSE them by
// key, they don't fork the engine. The existing engine modules (current-state-
// maturity, current-state-plan) are the implementations these entries point to.
// A new archetype assembles a method set from this library + new entries; no
// engine rewrite. (Thought-leader principle #5: methods-as-library.)
// =============================================================================

import type { AnalysisMethodSpec } from "./types";

export const ANALYSIS_METHODS: Record<string, AnalysisMethodSpec> = {
  maturity_scoring: {
    key: "maturity_scoring",
    label: "Maturity scoring (8-dimension, 1–5)",
    description:
      "Scores capability maturity per dimension over committed evidence; every score cited with confidence; insufficient_evidence when unbacked (never silent zero).",
    consumesFamilies: [
      "eng_performance_dora",
      "it_systems_landscape",
      "it_org_structure",
      "ai_tooling_today",
    ],
    producesArtifact: "maturity_profile",
  },
  two_gap: {
    key: "two_gap",
    label: "Two-gap model (foundation vs use-case)",
    description:
      "Derives capability gaps below target, tagged foundation vs use-case with severity; unassessed dimensions surfaced as honest gaps.",
    consumesFamilies: [],
    producesArtifact: "capability_gaps",
  },
  leverage_ranking: {
    key: "leverage_ranking",
    label: "AI-leverage × readiness ranking (where-to-start)",
    description:
      "Ranks areas by aiApplicability × normalizedReadiness × gapWeightedUpside, each term cited. Produces the computed where-to-start sequence — never asked.",
    consumesFamilies: [],
    producesArtifact: "leverage_ranking",
  },
  workpackage_roadmap_estimate: {
    key: "workpackage_roadmap_estimate",
    label: "WorkPackages → roadmap → estimate (phased)",
    description:
      "Derives work packages from gaps + ranked areas, then a roadmap and an effort estimate phased BY the work packages (no float). Rate-card provenance surfaced; value unratified until Charter.",
    consumesFamilies: [],
    producesArtifact: "current_state_plan",
  },
  // ── Method entries other archetypes compose (impl is PR-7+) ──
  should_cost: {
    key: "should_cost",
    label: "Should-cost model",
    description:
      "Bottom-up should-cost from role mix, rates, and scope — for sourcing/cost-takeout archetypes.",
    consumesFamilies: ["vendor_spend", "contract_inventory"],
    producesArtifact: "should_cost_model",
  },
  sla_gap: {
    key: "sla_gap",
    label: "SLA gap analysis",
    description:
      "Compares current SLA performance against baseline/target to size service gaps and renewal leverage.",
    consumesFamilies: ["sla_baseline", "incumbent_performance"],
    producesArtifact: "sla_gap_analysis",
  },
};

export function getAnalysisMethod(key: string): AnalysisMethodSpec | undefined {
  return ANALYSIS_METHODS[key];
}
