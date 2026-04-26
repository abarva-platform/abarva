import type { SourceDataReadinessItem, SourceArtifactSummary } from './types';

export type SourceRfpReadinessTier = 'Rich' | 'Outline' | 'Stub' | 'Blocked' | 'Waiver Required';

export type SourceRfpReadinessStatus = 'sufficient' | 'partial' | 'incomplete' | 'blocked' | 'waiver_required';

export type SourceRfpEvidenceReadiness = 'ready' | 'partial' | 'missing' | 'waived';

export type SourceRfpArtifactStatus = 'not_started' | 'draft' | 'needs_inputs' | 'ready' | 'locked' | 'issued' | 'archived';

export interface SourceRfpSectionDefinition {
  id: string;
  title: string;
  requiredInputCategories: string[];
  requiredArtifacts: string[];
}

export type SourceRfpReadinessSectionDefinition = SourceRfpSectionDefinition;

export interface SourceRfpReadinessMissingInput {
  category: string;
  reason: string;
  impact: string;
  severity: 'required' | 'recommended' | 'deferrable';
  fallbackTier: 'stub' | 'outline' | 'waiver_required';
}

export interface SourceRfpReadinessRequiredArtifact {
  name: string;
  status: SourceRfpArtifactStatus;
  readiness: SourceRfpEvidenceReadiness;
  tierImpact: SourceRfpReadinessTier | 'none';
}

export interface SourceRfpSectionReadiness {
  id: string;
  title: string;
  status: SourceRfpEvidenceReadiness;
  readyForSection: boolean;
  requiredInputsPresent: string[];
  requiredInputsMissing: string[];
  notes: string[];
}

export type SourceRfpReadinessSectionReadiness = SourceRfpSectionReadiness;

export interface SourceRfpReadinessSummary {
  requiredInputsComplete: boolean;
  missingInputs: SourceRfpReadinessMissingInput[];
  readinessScore: number;
  summaryText: string;
}

export interface SourceRfpReadiness {
  eventId: string;
  eventName: string;
  stage: string;
  overallTier: SourceRfpReadinessTier;
  readinessStatus: SourceRfpReadinessStatus;
  readinessScore: number;
  requiredInputsComplete: boolean;
  missingInputs: SourceRfpReadinessMissingInput[];
  requiredArtifacts: SourceRfpReadinessRequiredArtifact[];
  rfpSections: SourceRfpSectionReadiness[];
  blockers: string[];
  waiverOptions: string[];
  recommendedNextAction: string;
  nexusGuidance: string;
  sentinelEvidenceNotes: string[];
  stewardGateNotes: string[];
  atlasExecutiveImplication: string;
  generatedAt: string;
}

export interface SourceRfpReadinessArtifactInput {
  title: string;
  status: SourceArtifactSummary['status'];
}

export interface SourceRfpReadinessInput {
  event: {
    id: string;
    name: string;
    currentStageKey: string;
    stages: Array<{
      key: string;
      label: string;
      status: string;
      summary: string;
      gate: {
        id: string;
        label: string;
        status: string;
        ownerRole: string;
        requiredArtifacts: string[];
        blocker: string | null;
      };
    }>;
    artifacts: SourceRfpReadinessArtifactInput[];
    dataReadiness: SourceDataReadinessItem[];
  };
  generatedAt?: string;
}
