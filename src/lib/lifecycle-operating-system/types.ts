// Lifecycle Operating System contract
//
// Shared spine for Programs phases and Source stages. This deterministic
// read-model layer has no model calls, DB writes, fetches, timestamps, or
// randomness. Runtime surfaces can render it and agents can read it.

export type LifecycleSurface = 'programs' | 'source';
export type LifecycleUnitKind = 'phase' | 'stage';
export type LifecycleComplexity = 'simple' | 'complex';

export type AgentWorkMode =
  | 'answer'
  | 'coach'
  | 'draft'
  | 'facilitate_workshop'
  | 'capture_evidence'
  | 'evaluate_gate'
  | 'prepare_next';

export type GateImpact = 'none' | 'soft_signal' | 'hard_blocker';

export type FailureModeId =
  | 'phantom_sponsor'
  | 'unclear_decision_rights'
  | 'solution_before_problem'
  | 'evidence_free_progress'
  | 'data_readiness_blindspot'
  | 'integration_unknowns'
  | 'adoption_afterthought'
  | 'value_baseline_missing'
  | 'commercial_or_vendor_opacity'
  | 'governance_and_risk_late';

export interface FailureModeControl {
  id: FailureModeId;
  label: string;
  promise: string;
  detectionPrompt: string;
  preventionMove: string;
}

export interface TemplateBinding {
  id: string;
  title: string;
  kind: 'meeting_agenda' | 'workshop_pack' | 'scorecard' | 'memo' | 'data_request' | 'approval_packet';
  whenToUse: string;
}

export interface EvidenceRequirement {
  id: string;
  label: string;
  uploadExpectation: string;
  acceptedForms: string[];
  mapsToDefinitionOfDoneIds: string[];
}

export interface ApprovalRequirement {
  authority: string;
  decision: string;
  approvalArtifact: string;
  blockerPolicy: string;
}

export interface NextPhasePrimer {
  readinessQuestion: string;
  requiredCarryForward: string[];
  suggestedFirstMove: string;
}

export interface LifecycleStepContract {
  id: string;
  title: string;
  intent: string;
  complexity: LifecycleComplexity;
  agentWorkMode: AgentWorkMode;
  humanWorkRequired: string[];
  templates: TemplateBinding[];
  evidenceRequired: EvidenceRequirement[];
  gateImpact: GateImpact;
  failureModesPrevented: FailureModeId[];
  producesForNext: string[];
}

export interface LifecycleCompletionContract {
  id: string;
  surface: LifecycleSurface;
  unitKind: LifecycleUnitKind;
  unitNumber: number;
  label: string;
  outcome: string;
  universalDefinitionOfDone: Array<{
    id: string;
    label: string;
    severity: 'hard' | 'soft';
    evaluationHint: string;
  }>;
  parameterizedElements: string[];
  steps: LifecycleStepContract[];
  approval: ApprovalRequirement;
  nextPhasePrimer: NextPhasePrimer;
  failureModeControls: FailureModeControl[];
}
