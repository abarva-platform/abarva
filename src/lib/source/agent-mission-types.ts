import type {
  SourceAgentContextBundle,
  SourceContextUsed,
  SourceUserRole,
} from './agent-context';
import type { SourceContextValidationReadableReport } from './agent-validation-report';
import type {
  SourceAgentBriefingMode,
  SourceAgentName,
  SourceMultiAgentBriefing,
  SourceSuggestedAgentAction,
} from './multi-agent-types';
import type { SourceStageKey } from './types';
import type { SourceWorkflowValidationReadableReport } from './workflow-validation-report';

export type SourceAgentMissionType =
  | 'next_action'
  | 'evidence_gap'
  | 'gate_check'
  | 'artifact_review'
  | 'data_readiness'
  | 'value_risk'
  | 'executive_brief'
  | 'vendor_response_gap'
  | 'scorecard_governance'
  | 'approval_follow_up'
  | 'workflow_blocker'
  | 'pattern_signal'
  | 'validation_defer'
  | 'low_context_warning';

export type SourceAgentMissionState =
  | 'proposed'
  | 'active'
  | 'waiting'
  | 'blocked'
  | 'completed'
  | 'dismissed'
  | 'escalated'
  | 'deferred';

export type SourceAgentMissionPriority = 'critical' | 'high' | 'medium' | 'low';

export type SourceAgentMissionTrigger =
  | 'dashboard_load'
  | 'event_load'
  | 'stage_focus'
  | 'context_validation_report'
  | 'workflow_validation_report'
  | 'multi_agent_briefing'
  | 'missing_inputs_detected'
  | 'workflow_block_detected'
  | 'validation_defer_detected'
  | 'value_at_stake_detected'
  | 'vendor_response_gap_detected'
  | 'scorecard_not_locked'
  | 'data_readiness_gap'
  | 'user_question';

export type SourceAgentMissionEvidenceStatus =
  | 'usable'
  | 'lowConfidence'
  | 'missing'
  | 'notApplicable';

export interface SourceAgentMissionInput {
  contextBundle: SourceAgentContextBundle;
  contextValidationReport?: SourceContextValidationReadableReport;
  workflowValidationReport?: SourceWorkflowValidationReadableReport;
  multiAgentBriefing?: SourceMultiAgentBriefing;
  userRole?: SourceUserRole;
  mode?: SourceAgentBriefingMode;
  generatedAt?: string;
}

export interface SourceAgentMission {
  missionId: string;
  agentName: SourceAgentName;
  missionType: SourceAgentMissionType;
  title: string;
  summary: string;
  priority: SourceAgentMissionPriority;
  state: SourceAgentMissionState;
  trigger: SourceAgentMissionTrigger;
  sourceEventId?: string | undefined;
  stageId?: SourceStageKey | undefined;
  relatedArtifactId?: string | undefined;
  evidenceStatus: SourceAgentMissionEvidenceStatus;
  blockerReason?: string | undefined;
  recommendedAction: string;
  suggestedActions: SourceSuggestedAgentAction[];
  handoffTarget?: SourceAgentName | undefined;
  contextUsed: SourceContextUsed[];
  createdAt: string;
}

export interface SourceAgentMissionSummary {
  total: number;
  byPriority: Record<SourceAgentMissionPriority, number>;
  byState: Record<SourceAgentMissionState, number>;
  highestPriorityMission?: SourceAgentMission | undefined;
  summary: string;
}
