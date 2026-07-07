// Per-stage board-grade deliverables for the Source module.
//
// The Source "Board-grade deliverable" page used to hardcode a single deliverable
// type (the RFP) for the whole module, so only the RFP ever got the governed
// multi-pass orchestrator treatment. This module enumerates one board-grade
// deliverable per sourcing lifecycle stage, each carrying its own deliverableType
// and a tailored decisionContext, so each stage produces a stage-appropriate
// board-grade document through the high-quality authoring flow.
//
// We deliberately list ONLY deliverable types that resolve to a real orchestrator
// structure or a bespoke brief — listing a type with no brief would route the
// orchestrator to a thin generic default, which is exactly what we are trying to
// avoid.

import { getDeliverableStructure } from "@/lib/deliverables/orchestrator/briefs/deliverable-structures";

export interface SourceStageDeliverable {
  stageKey: string;
  phase: string;
  deliverableType: string;
  label: string;
  decisionContext: string;
}

export const SOURCE_STAGE_DELIVERABLES: SourceStageDeliverable[] = [
  {
    stageKey: "strategy",
    phase: "Plan",
    deliverableType: "sourcing_strategy_memo",
    label: "Sourcing strategy memo",
    decisionContext:
      "Approve the sourcing strategy, go-to-market approach, commercial model, and evaluation design for this event.",
  },
  {
    stageKey: "rfp",
    phase: "Solicit",
    deliverableType: "rfp_package",
    label: "RFP / RFI package",
    decisionContext:
      "Approve issuance of the RFP and the scope, evaluation criteria, and commercial model it commits the client to.",
  },
  {
    stageKey: "evaluation",
    phase: "Evaluate",
    deliverableType: "evaluation_workbook",
    label: "Evaluation workbook",
    decisionContext:
      "Adopt the evaluation framework and scoring model, and record the preferred vendor with rationale.",
  },
  {
    stageKey: "executive_decision",
    phase: "Decide",
    deliverableType: "executive_recommendation",
    label: "Executive recommendation",
    decisionContext:
      "Approve the recommended vendor selection and the negotiation/award mandate.",
  },
];

// Deliverable types covered by a bespoke brief in the artifact-brief-registry
// rather than by a structure in deliverable-structures. We use a small allowlist
// here instead of importing the brief registry directly, because the registry is
// server-only (it pulls in archetype packs and orchestrator wiring) and importing
// it from a shared module risks pulling server-only code into client bundles.
const BESPOKE_BRIEF_DELIVERABLE_TYPES = new Set<string>(["rfp_package"]);

/**
 * Returns the list of deliverableTypes in SOURCE_STAGE_DELIVERABLES that do NOT
 * resolve to either a real orchestrator structure (via getDeliverableStructure)
 * or a bespoke brief. An empty array means every stage deliverable is backed by a
 * real, non-generic brief — i.e. none of them falls through to a thin generic
 * default. Used by the test suite as a guard.
 */
export function assertEveryStageDeliverableHasBrief(): string[] {
  return SOURCE_STAGE_DELIVERABLES.filter((d) => {
    if (BESPOKE_BRIEF_DELIVERABLE_TYPES.has(d.deliverableType)) return false;
    return getDeliverableStructure("source", d.deliverableType) === undefined;
  }).map((d) => d.deliverableType);
}
