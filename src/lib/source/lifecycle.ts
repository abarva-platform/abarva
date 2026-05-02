import {
  SOURCE_LIFECYCLE_STATUS_LABELS,
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
  SOURCE_STAGE_STATE_LABELS,
  SOURCE_WAITING_LIFECYCLE_STATUSES,
  normalizeSourceStageKey,
} from './constants';
import type {
  SourceLifecycleStatus,
  SourceStageKey,
  SourceStageStatus,
  SourcingEventDetail,
  WorkflowStage,
} from './types';

export function getLifecycleTone(status: SourceLifecycleStatus): 'neutral' | 'info' | 'warning' | 'critical' | 'success' {
  if (status === 'at_risk') return 'critical';
  if (SOURCE_WAITING_LIFECYCLE_STATUSES.includes(status)) return 'warning';
  if (status === 'completed') return 'success';
  if (status === 'active') return 'info';
  return 'neutral';
}

export function getLifecycleStatusLabel(status: SourceLifecycleStatus): string {
  return SOURCE_LIFECYCLE_STATUS_LABELS[status];
}

export function getStageStateLabel(status: SourceStageStatus): string {
  return SOURCE_STAGE_STATE_LABELS[status];
}

export function getActiveStage(stages: WorkflowStage[]): WorkflowStage {
  return stages.find((stage) => stage.status === 'active')
    ?? stages.find((stage) => stage.status === 'blocked' || stage.status === 'needs_approval' || stage.status === 'reopened')
    ?? stages[0];
}

export function isStageOperational(status: SourceStageStatus): boolean {
  return status === 'active' || status === 'blocked' || status === 'needs_approval' || status === 'reopened';
}

export function summarizeJourney(event: SourcingEventDetail): string {
  const active = getActiveStage(event.stages);
  return `${SOURCE_STAGE_LABELS[active.key]} is live. ${active.summary}`;
}

export function stageIndex(stageKey: SourceStageKey): number {
  return SOURCE_STAGE_ORDER.indexOf(normalizeSourceStageKey(stageKey) ?? stageKey);
}
