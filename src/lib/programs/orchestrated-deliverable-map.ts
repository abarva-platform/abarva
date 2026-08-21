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
//   charter · business_case · roadmap · discovery_report · target_state_architecture ·
//   operating_model · estimate_model · value_model · mobilization_plan ·
//   handoff_pack · executive_playback
//
// Anything not in this table falls through to the registry key itself (still a
// valid orchestrator run via the generic brief). Tiers for every value below are
// covered by DELIVERABLE_TIER in document-generation-policy.ts (board_grade /
// large_package), and normalizeDeliverableKey keeps lookups robust.

import { normalizeDeliverableKey } from "@/lib/ai/document-generation-policy";
import {
  DELIVERABLE_REGISTRY,
  getDeliverableSpec,
  type DeliverableFormat,
} from "@/lib/programs/deliverable-registry";

/**
 * Registry deliverable-type key → orchestrator `deliverableType`.
 * Only entries that benefit from a structure-backed brief (or a clearer tier
 * mapping) are listed; unlisted keys map to themselves.
 */
const REGISTRY_TO_ORCHESTRATOR: Readonly<Record<string, string>> = {
  // P1
  charter: "charter",
  // P2 — discovery and root-cause are different client artifacts. Root cause
  // must keep its own issue-tree structure and quality profile; routing it
  // through discovery_report produced a second discovery binder instead of a
  // concise root-cause readout.
  discovery_report: "discovery_report",
  root_cause_worksheet: "root_cause_worksheet",
  // P3 — architecture keeps the premium architecture path; Solution Design keeps
  // its own profile so its five workflow/control exhibits are generated and
  // evaluated in the same key space. Org design → operating_model; sourcing uses
  // the generic board brief.
  target_state_architecture: "target_state_architecture",
  solution_design: "solution_design",
  operating_model_design: "operating_model",
  sourcing_strategy: "sourcing_strategy",
  // P4 — roadmap structure; investment case; financial model → estimate_model;
  //      tower metrics plan → value_model (measurement/realization flow)
  execution_roadmap: "roadmap",
  business_case: "business_case",
  financial_model: "estimate_model",
  tower_metrics_plan: "value_model",
  readiness_and_change_plan: "readiness_and_change_plan",
  // P5 — handoff → handoff_pack; value contract has its own quality profile.
  handoff_package: "handoff_pack",
  value_measurement_contract: "value_measurement_contract",
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

/** Prescribed render/download format the orchestrator should persist a deliverable in. */
export type PrescribedDeliverableFormat = "docx" | "xlsx";

/** registry `formatRecommendation` → the concrete primary file format. */
function registryFormatToFile(
  format: DeliverableFormat,
): PrescribedDeliverableFormat {
  // 'excel' → the document IS the workbook; everything else's primary file is Word/DOCX
  // ('html-word' and 'html-word-excel' both keep HTML for preview but download as DOCX).
  return format === "excel" ? "xlsx" : "docx";
}

/**
 * Reverse map: orchestrator `deliverableType` → the registry keys that map to it.
 * Built once from REGISTRY_TO_ORCHESTRATOR so a single orchestrator type can be
 * traced back to its registry spec (and thus its prescribed format).
 */
const ORCHESTRATOR_TO_REGISTRY_KEYS: Readonly<Record<string, string[]>> =
  (() => {
    const out: Record<string, string[]> = {};
    for (const [registryKey, orchType] of Object.entries(
      REGISTRY_TO_ORCHESTRATOR,
    )) {
      (out[orchType] ??= []).push(registryKey);
    }
    return out;
  })();

/**
 * Resolve the prescribed primary file format for a deliverable, given the
 * orchestrator `deliverableType` (e.g. 'estimate_model') OR a registry key
 * (e.g. 'financial_model'). Uses the registry's `formatRecommendation` where
 * resolvable; defaults to 'docx'.
 *
 *   financial_model / estimate_model → 'xlsx'   (formatRecommendation 'excel')
 *   everything else                  → 'docx'
 */
export function prescribedFormatForDeliverableType(
  deliverableType: string,
): PrescribedDeliverableFormat {
  const normalized = normalizeDeliverableKey(deliverableType);

  // 1 · direct registry-key hit (e.g. 'financial_model', 'charter')
  const directSpec = getDeliverableSpec(normalized);
  if (directSpec) return registryFormatToFile(directSpec.formatRecommendation);

  // 2 · the value is an orchestrator type — trace back to its registry key(s).
  //     If ANY mapped registry spec prescribes Excel, the artifact is a workbook.
  const registryKeys = ORCHESTRATOR_TO_REGISTRY_KEYS[normalized] ?? [];
  for (const key of registryKeys) {
    const spec = DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key);
    if (spec && spec.formatRecommendation === "excel") return "xlsx";
  }

  // 3 · default: Word/DOCX is the conservative primary format for every narrative doc.
  return "docx";
}
