export type ContradictionCategory =
  | 'A_strategy_allocation'
  | 'B_commitment_pace'
  | 'C_sponsor_behavior'
  | 'D_budget_priority'
  | 'E_external_internal_messaging';

export type ContradictionTemporalState = 'acute' | 'persistent' | 'widening' | 'narrowing';
export type ContradictionSeverityLabel = 'material' | 'significant' | 'minor';
export type ContradictionLegacySeverity = 'high' | 'medium' | 'low';
export type ContradictionConfidence = 'high' | 'medium' | 'low';
export type ContradictionSensitivity = 'low' | 'medium' | 'high' | 'severe';
export type ContradictionResolutionState =
  | 'open'
  | 'acknowledged'
  | 'resolving'
  | 'resolved'
  | 'superseded'
  | 'dismissed';
export type ContradictionCreatedBy = 'automated' | 'agent_proposed' | 'human_flagged';
export type ContradictionAudience =
  | 'program_lead'
  | 'broader_program'
  | 'cross_program'
  | 'executive_sponsor';
export type ContradictionDisclosureMode = 'full' | 'informed_indirection' | 'reasoning_only';

export type FoundationalRuleId =
  | 'A-R1'
  | 'A-R2'
  | 'A-R3'
  | 'B-R1'
  | 'B-R2'
  | 'B-R3'
  | 'C-R1'
  | 'C-R2'
  | 'C-R3'
  | 'D-R1'
  | 'D-R2'
  | 'D-R3'
  | 'E-R1'
  | 'E-R2'
  | 'E-R3';

export interface FoundationalRuleDefinition {
  id: FoundationalRuleId;
  name: string;
  category: ContradictionCategory;
  description: string;
  temporalWindow: string;
  runSchedule: 'continuous' | 'daily' | 'event_driven' | 'weekly';
  applicableSectors: string[];
  applicableCompanyScales: string[];
  confidenceMultiplier: number;
}

export interface ContradictionStakeComponents {
  strategic: number;
  financial: number;
  reputational: number;
  regulatory: number;
}

export interface ContradictionRecord {
  id: string;
  clientId: string;
  shortTitle: string;
  longDescription: string;
  category: ContradictionCategory;
  subcategory: string | null;
  contradictionType: string;
  temporalState: ContradictionTemporalState;
  severityLabel: ContradictionSeverityLabel;
  severity: ContradictionLegacySeverity;
  confidence: ContradictionConfidence;
  sensitivity: ContradictionSensitivity;
  stakesScore: number;
  stakesComponents: ContradictionStakeComponents;
  sourceCount: number;
  implicatedPriorityRefs: string[];
  implicatedInitiativeRefs: string[];
  implicatedPersonNames: string[];
  implicatedKpiIds: string[];
  implicatedExternalEventIds: string[];
  relatedPatternIds: string[];
  recommendedConversationContext: string;
  firstDetectedAt: string;
  lastRefreshedAt: string;
  resolutionState: ContradictionResolutionState;
  detectionRuleId: FoundationalRuleId;
  createdBy: ContradictionCreatedBy;
  surfacingPriority: number;
}

export interface DeduplicationCandidate {
  category: ContradictionCategory;
  implicatedPriorityRefs: string[];
  implicatedInitiativeRefs: string[];
  implicatedPersonNames: string[];
  implicatedKpiIds: string[];
  implicatedExternalEventIds: string[];
  temporalState: ContradictionTemporalState;
}
