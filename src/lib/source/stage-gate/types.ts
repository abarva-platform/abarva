// Source Stage-Gate / Maestro override model.
//
// The brief's core flexibility principle: every Source stage gate exposes (1) the full
// RECOMMENDED STANDARD, (2) a MINIMUM-VIABLE GATE, and (3) a MAESTRO OVERRIDE path —
// gaps are allowed, but never hidden, and proceeding-with-gaps carries gap/risk/preliminary
// status forward transparently. The product must never fake completeness.

export type GateStatus =
  | 'ready' // full recommended standard met
  | 'ready_with_gaps' // minimum-viable met; recommended gaps remain
  | 'preliminary_only' // may proceed but deliverables stay preliminary
  | 'blocked' // minimum-viable not met (Maestro may still override)
  | 'maestro_override_approved' // advanced by explicit Maestro override
  | 'client_to_complete' // remaining items are client/legal/procurement decisions
  | 'needs_review'; // remaining items are review sign-offs

export type RequirementTier = 'recommended' | 'minimum_viable';

export type RequirementKind =
  | 'evidence' // an evidence family must be agent_ready
  | 'session' // a working session must have happened
  | 'review' // procurement/legal/pricing sign-off
  | 'decision' // a client/Maestro decision
  | 'artifact'; // a deliverable/upload must exist

/** One requirement in a stage's gate. Recommended-tier items form the full standard; the
 *  minimum_viable subset is the smallest responsible bar to advance without an override. */
export interface StageGateRequirement {
  key: string;
  label: string;
  tier: RequirementTier;
  kind: RequirementKind;
  /** plain-English risk of advancing without this. */
  riskIfMissing: string;
  /** which downstream deliverables/sections become preliminary if this is missing. */
  downstreamImpact?: string[];
}

export interface StageGateDefinition {
  archetype: string;
  stageKey: string;
  stageNumber: number;
  stageName: string;
  purpose: string;
  requirements: StageGateRequirement[];
  approvalRoles: string[];
}

/** What is actually satisfied right now (derived from evidence readiness, uploads,
 *  sessions, reviews, decisions). */
export interface StageCompletionState {
  satisfiedRequirementKeys: Set<string>;
}

export interface GapItem {
  key: string;
  label: string;
  kind: RequirementKind;
  tier: RequirementTier;
  riskIfMissing: string;
  downstreamImpact: string[];
}

export type RecommendedDecision = 'advance' | 'advance_with_gaps_or_hold' | 'hold_or_override';

export interface SourceStageGateAssessment {
  archetype: string;
  stageKey: string;
  stageName: string;
  // (1) full standard, (2) minimum-viable
  recommendedStandard: StageGateRequirement[];
  minimumViableGate: StageGateRequirement[];
  // current state
  satisfied: StageGateRequirement[];
  gaps: GapItem[];
  /** 0..1 share of the recommended standard satisfied. */
  currentCompletion: number;
  minimumViableMet: boolean;
  risksOfProceeding: string[];
  downstreamImpacts: string[];
  gateStatus: GateStatus;
  recommendedDecision: RecommendedDecision;
  /** Maestro can always override (even blocked), but with rationale when gaps exist. */
  maestroOverrideAllowed: boolean;
}

// ── Maestro decision ──

export type MaestroAction =
  | 'approve'
  | 'approve_with_gaps'
  | 'reject'
  | 'mark_preliminary'
  | 'defer'
  | 'assign_follow_up'
  | 'mark_client_to_complete'
  | 'force_advance';

export type ArtifactLabel = 'draft' | 'preliminary' | 'final' | 'client_to_complete';

export interface MaestroDecisionInput {
  action: MaestroAction;
  approver: string;
  approvedAt: string; // ISO; caller stamps (deterministic in tests)
  rationale?: string;
  gapsAcknowledged?: string[];
  risksAccepted?: string[];
  followUpItems?: { item: string; owner: string }[];
}

export interface ResolvedStageGate {
  gateStatus: GateStatus;
  approver: string;
  approvedAt: string;
  rationale: string | null;
  gapsAcknowledged: string[];
  risksAccepted: string[];
  downstreamImpacts: string[];
  followUpItems: { item: string; owner: string }[];
  /** label downstream deliverables inherit. */
  artifactLabel: ArtifactLabel;
  /** whether deliverables from this stage may be marked issue-ready / final. */
  allowIssueReady: boolean;
  /** the approval record payload to persist (File Cabinet approval artifact). */
  approvalRecord: ApprovalRecord;
}

export interface ApprovalRecord {
  archetype: string;
  stageKey: string;
  stageName: string;
  decision: MaestroAction;
  approver: string;
  approvedAt: string;
  rationale: string | null;
  gapsAcknowledged: string[];
  risksAccepted: string[];
  downstreamImpacts: string[];
  followUpItems: { item: string; owner: string }[];
  artifactLabel: ArtifactLabel;
  allowIssueReady: boolean;
  readinessSnapshot: {
    currentCompletion: number;
    minimumViableMet: boolean;
    gateStatusBeforeDecision: GateStatus;
    gapCount: number;
  };
}

export interface MaestroDecisionResult {
  ok: boolean;
  /** present when ok. */
  resolved?: ResolvedStageGate;
  /** present when the decision is invalid (e.g. override without rationale on gaps). */
  error?: string;
}
