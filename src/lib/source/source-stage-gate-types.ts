import type { SourceStageKey } from './types';

export type SourceStageGateState =
  | 'ready'
  | 'blocked'
  | 'waiting'
  | 'needs_approval'
  | 'waiver_required'
  | 'deferred';

export interface SourceStageGateTransitionDefinition {
  id: string;
  from: SourceStageKey;
  to: SourceStageKey | 'closed';
  label: string;
}

export interface SourceStageGateReadinessItem {
  transitionId: string;
  transitionLabel: string;
  fromStageKey: SourceStageKey;
  toStageKey: SourceStageKey | 'closed';
  state: SourceStageGateState;
  blocker: string | null;
  requiredArtifacts: string[];
  requiredApprovals: string[];
  evidenceGap: string | null;
}

export interface SourceStageGateReadiness {
  eventId: string;
  eventName: string;
  generatedAt: string;
  currentStageKey: SourceStageKey;
  currentStageLabel: string;
  overallState: SourceStageGateState;
  gates: SourceStageGateReadinessItem[];
  blockers: string[];
  recommendedNextAction: string;
  summary: string;
}

export interface SourceStageGateReadinessInput {
  event: {
    id: string;
    name: string;
    currentStageKey: SourceStageKey;
    currentStageLabel: string;
    stages: Array<{
      key: SourceStageKey;
      label: string;
      status: string;
      summary: string;
      gate: {
        status: string;
        ownerRole: string;
        requiredArtifacts: string[];
        blocker: string | null;
      };
    }>;
  };
  generatedAt?: string;
}
