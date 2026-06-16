// orchestrated-deliverable-map.ts
//
// Maps a per-phase Moves deliverable REGISTRY key (PHASE_CANONICAL_KEYS in
// deliverable-registry.ts) onto the orchestrator's `deliverableType` so the
// Documents tab can route each phase document through the governed, multi-pass
// async orchestrator (POST /api/v1/deliverables/generate) instead of the retired
// single-pass /api/v1/programs/:id/generate path.
//
// The orchestrator has a generic board-grade brief fallback for ANY deliverable
// type (artifact-brief-registry.ts → buildGenericBrief), so every registry key
// produces a valid run. Where a richer, structure-backed brief exists in
// briefs/deliverable-structures.ts (module 'moves'), we map to that exact key so
// the artifact gets the consultant-grade section flow rather than the generic one.
//
// Structure keys present for module 'moves' (deliverable-structures.ts):
//   charter · business_case · roadmap · discovery_report · target_architecture ·
//   operating_model · estimate_model · value_model · mobilization_plan ·
//   handoff_pack · executive_playback
//
// Anything not in this table falls through to the registry key itself (still a
// valid orchestrator run via the generic brief). Tiers for every value below are
// covered by DELIVERABLE_TIER in document-generation-policy.ts (board_grade /
// large_package), and normalizeDeliverableKey keeps lookups robust.

import { normalizeDeliverableKey } from "@/lib/ai/document-generation-policy";

/**
 * Registry deliverable-type key → orchestrator `deliverableType`.
 * Only entries that benefit from a structure-backed brief (or a clearer tier
 * mapping) are listed; unlisted keys map to themselves.
 */
const REGISTRY_TO_ORCHESTRATOR: Readonly<Record<string, string>> = {
  // P1
  charter: "charter",
  // P2 — both discovery documents lean on the discovery_report structure
  discovery_report: "discovery_report",
  root_cause_worksheet: "discovery_report",
  // P3 — architecture/solution → target_architecture; org design → operating_model;
  //      sourcing brief has no dedicated structure, uses the generic board brief
  target_state_architecture: "target_architecture",
  solution_design: "target_architecture",
  operating_model_design: "operating_model",
  sourcing_strategy: "sourcing_strategy",
  // P4 — roadmap structure; investment case; financial model → estimate_model;
  //      tower metrics plan → value_model (measurement/realization flow)
  execution_roadmap: "roadmap",
  business_case: "business_case",
  financial_model: "estimate_model",
  tower_metrics_plan: "value_model",
  // P5 — handoff → handoff_pack; value contract → value_model
  handoff_package: "handoff_pack",
  value_measurement_contract: "value_model",
};

/**
 * Resolve the orchestrator `deliverableType` for a per-phase registry key.
 * Falls back to the normalized registry key when there is no explicit mapping;
 * the orchestrator's generic brief accepts it either way.
 */
export function orchestratorDeliverableType(registryKey: string): string {
  const normalized = normalizeDeliverableKey(registryKey);
  return REGISTRY_TO_ORCHESTRATOR[normalized] ?? normalized;
}
