// Source reasoning · the Reasoning Envelope contract (Phase 1, Slice 1.0)
//
// The canonical, durable artifact of the Source Intelligence OS's thinking — the
// container every reasoning stage emits and every deliverable renders.
// Spec: docs/build/source-intelligence-os/VOLUME_2_SOURCE_INTELLIGENCE_ENGINE.md §5.3.
//
// This slice ships TYPES + the gate validator ONLY (see envelope-gate.ts). Nothing
// imports it on the live path yet: the Analysis/Recommendation stages (Slices
// 1.3/1.5) and the flag-gated generate-route wiring (Slice 1.6) come later. The
// live generate path (generate-from-claude/route.ts) is untouched.

import type {
  SourceDataReadinessState,
  SourceRigorLevel,
  SourceStageKey,
} from "@/lib/source/types";

/** Calibrated confidence (§5.4): a label + numeric interval + the factor breakdown. */
export type ConfidenceLabel = "low" | "moderate" | "high";

export interface ConfidenceBand {
  label: ConfidenceLabel;
  /** Point estimate in [0,1]. */
  score: number;
  /** Inclusive [low, high] interval in [0,1]. */
  interval: [number, number];
  /** f(evidence_sufficiency, recency, corroboration, model_uncertainty), each in [0,1]. */
  factors: {
    evidenceSufficiency: number;
    evidenceRecency: number;
    corroboration: number;
    modelUncertainty: number;
  };
}

/** A citation into the evidence layer (evidence states / parsed artifacts). */
export interface EvidenceRef {
  id: string;
  /** Source deliverable code this evidence came from (e.g. "d05_scope_memo"), if any. */
  sourceArtifactCode?: string;
  /** Row id in the tracked evidence states, if evidence-backed. */
  evidenceStateId?: string;
  /** Human-readable citation (source file + locus). */
  citation: string;
  /** Where this evidence sits on the promotion-only readiness ladder. */
  readinessState: SourceDataReadinessState;
}

/** A single assertion the reasoning makes; the unit the quality gate checks. */
export interface Claim {
  id: string;
  text: string;
  /** EvidenceRef.ids that support this claim. EMPTY = quality-gate FAILURE (§5.3 keystone). */
  supportedBy: string[];
  confidence: ConfidenceBand;
  /** Whether the challenge model adversarially tested this claim (§5.4). */
  challenged: boolean;
  /** True when, if unsupported, this claim must block its stage gate (§5.6). */
  gateDefining?: boolean;
}

/** An assumption the reasoning made, tested to accepted/rejected (§5.4). */
export interface Assumption {
  id: string;
  statement: string;
  status: "accepted" | "rejected";
  reason: string;
  evidenceRefId?: string;
}

/** A scoped limitation on the recommendation, bounded to the rigor level. */
export interface Caveat {
  id: string;
  text: string;
}

/** One auditable step in the decision trace (§5.4). */
export interface TraceStep {
  step: number;
  /** EvidenceRef.ids / framework keys consumed at this step. */
  inputRefs: string[];
  framework?: string;
  decision: string;
  score?: number;
  confidence?: ConfidenceLabel;
  modelMeta?: { model: string; stopReason?: string };
  /** ISO timestamp; passed in by the caller (pure code never reads the clock). */
  ts: string;
}

/** Emitted when grounded refusal fires: insufficient usable evidence for a gate-defining claim (§5.6). */
export interface RefusalRecord {
  reason: string;
  /** Evidence missing or below "Usable Evidence" for a gate-defining claim. */
  missingEvidence: Array<{
    requirement: string;
    currentState: SourceDataReadinessState;
  }>;
  /** The minimum-data request rendered in place of a fabricated recommendation. */
  minimumDataRequest: string;
}

/** The canonical container every Source reasoning stage emits (§5.3). */
export interface ReasoningEnvelope {
  envelopeId: string;
  eventId: string;
  tenantKey: string;
  stage: SourceStageKey;
  archetype: string;
  rigor: SourceRigorLevel;
  claims: Claim[];
  evidence: EvidenceRef[];
  assumptions: Assumption[];
  confidence: ConfidenceBand;
  caveats: Caveat[];
  decisionTrace: TraceStep[];
  /** Present iff grounded refusal fired; the deliverable renders the refusal, not a rec. */
  refusal?: RefusalRecord;
}

/** The single readiness state that supports a gate-defining claim (§5.6 promotion-only ladder). */
export const GATE_SUPPORTING_READINESS: SourceDataReadinessState =
  "Usable Evidence";
