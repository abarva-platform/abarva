import type { DealPackInput } from '../exports/deal-pack/stage-sections';

export type SourceJudgmentVerdict =
  | 'award_ready'
  | 'do_not_award_yet'
  | 'proceed_to_bafo'
  | 'renegotiate'
  | 'rebid_required'
  | 'pause_for_evidence'
  | 'kill_or_reframe';

export type SourceJudgmentConfidence = 'high' | 'medium' | 'low';

export type SourceJudgmentBlockerDomain =
  | 'legal'
  | 'ai_data_rights'
  | 'pricing'
  | 'commercial'
  | 'delivery'
  | 'security'
  | 'evidence'
  | 'governance';

export interface SourceJudgmentBlocker {
  severity: 'P0' | 'P1' | 'P2';
  domain: SourceJudgmentBlockerDomain;
  description: string;
  requiredResolution: string;
  evidenceRef?: string;
}

export interface SourceJudgmentEvidence {
  label: string;
  sourceType: string;
  confidence: SourceJudgmentConfidence;
  relevance: string;
}

export interface SourceJudgmentGap {
  gap: string;
  whyItMatters: string;
  blocksDecision: boolean;
}

export interface SourceJudgmentAssumption {
  assumption: string;
  challenge: string;
  sensitivity: 'high' | 'medium' | 'low';
}

export interface SourceJudgmentAction {
  action: string;
  owner?: string;
  urgency: 'now' | 'next_7_days' | 'next_30_days';
}

export interface SourceJudgment {
  verdict: SourceJudgmentVerdict;
  confidence: SourceJudgmentConfidence;
  executiveSummary: string;
  rationale: string[];
  blockers: SourceJudgmentBlocker[];
  evidenceUsed: SourceJudgmentEvidence[];
  evidenceGaps: SourceJudgmentGap[];
  challengedAssumptions: SourceJudgmentAssumption[];
  nextActions: SourceJudgmentAction[];
  whatWouldChangeTheVerdict: string[];
}

export interface SourceJudgmentGateCriterion {
  criterionId: string;
  label?: string;
  state?: string | null;
}

export interface SourceJudgmentEvidenceRow {
  requirementId: string;
  currentState?: string | null;
  sourceArtifactId?: string | null;
  notes?: string | null;
}

export interface SourceJudgmentArtifact {
  code: string;
  title: string;
  body?: string | null;
  bodyIsAuthored?: boolean;
  kind?: string;
  structuredKind?: string;
}

export interface SourceJudgmentInput {
  eventName: string;
  eventCode?: string;
  currentStageKey?: string;
  eventOwner?: string | null;
  estimatedValueUsd?: number | null;
  artifacts: SourceJudgmentArtifact[];
  gateCriteria: SourceJudgmentGateCriterion[];
  evidence: SourceJudgmentEvidenceRow[];
}

export type SourceJudgmentDealPackInput = DealPackInput;
