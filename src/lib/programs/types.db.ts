import type { ArchetypeKey } from './types.ui';

// DB-layer types · Packet 13 §13.5 data access layer
// The types above are UI view-models. The types below match DB shape
// and are consumed by lib/programs/{queries,mutations,classifier,
// governance,nexus,execute}.ts.
// ─────────────────────────────────────────────────────────────────────

export type OriginSource = 'tower_triggered' | 'user_initiated' | 'intelligence_promoted';
export type OversightLevel = 'full' | 'partial' | 'none';
export type PromotionState = 'draft' | 'pilot' | 'mature' | 'deprecated';
export type ModuleStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'skipped';
export type WorkItemType = 'workstream' | 'use_case' | 'solution' | 'execution_plan' | 'task';
export type WorkItemStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type RiskLikelihood = 'low' | 'medium' | 'high';
export type RiskImpact = 'low' | 'medium' | 'high';
export type RiskStatus = 'open' | 'mitigating' | 'accepted' | 'transferred' | 'closed';
export type MilestoneStatus = 'upcoming' | 'at_risk' | 'hit' | 'missed' | 'cancelled';
export type ApprovalAuthority = 'sponsor' | 'approver' | 'contributor' | 'observer';
export type NexusThreadMode = 'side_panel' | 'module_drafting' | 'cxo_takeover';
export type ApprovalRequestStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'withdrawn';
export type FlagType =
  | 'decision_required' | 'approval_needed' | 'quality_concern'
  | 'risk_detected' | 'policy_violation' | 'scope_drift';
export type FlagSeverity = 'critical' | 'warning' | 'info';

export const PHASE_LABELS: Record<number, string> = {
  0: 'Origination',
  1: 'Charter',
  2: 'Diagnose',
  3: 'Design',
  4: 'Execute',
  5: 'Verify',
};

export interface TenancyCtx {
  clientId: string;
  userId: string;
  role?: string;
}

export interface ProgramCore {
  id: string;
  clientId: string;
  name: string;
  archetype: ArchetypeKey | null;
  originSource: OriginSource | null;
  originSourceRef: string | null;
  status: string | null;
  currentPhase: number | null;
  currentModuleKey: string | null;
  maestroOversightLevel: OversightLevel | null;
  founderApprovalRequired: boolean;
  phaseLockedAt: string | null;
  phaseLockedByUserId: string | null;
  dataResidencyRegion: string | null;
  retentionPolicyYears: number | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface ProgramModuleRow {
  id: string;
  engagementId: string;
  moduleKey: string;
  moduleName: string;
  phaseNumber: number;
  moduleOrder: number | null;
  status: ModuleStatus;
  state: Record<string, unknown>;
  assignedUserId: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ProgramWorkItemRow {
  id: string;
  engagementId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  itemType: WorkItemType;
  status: WorkItemStatus;
  priority: 'critical' | 'high' | 'medium' | 'low' | null;
  assignedUserId: string | null;
  moduleKey: string | null;
  phaseNumber: number | null;
  dueDate: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface ProgramMilestoneRow {
  id: string;
  engagementId: string;
  name: string;
  description: string | null;
  targetDate: string | null;
  actualDate: string | null;
  status: MilestoneStatus;
  phaseNumber: number | null;
  moduleKey: string | null;
  ownerUserId: string | null;
}

export interface ProgramRiskRow {
  id: string;
  engagementId: string;
  title: string;
  description: string | null;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  status: RiskStatus;
  mitigationPlan: string | null;
  ownerUserId: string | null;
  phaseNumber: number | null;
  moduleKey: string | null;
  identifiedAt: string;
  closedAt: string | null;
}

export interface PatternClassifierMatch {
  patternKey: string;
  confidence: number;
  archetype: ArchetypeKey | null;
  industry: string | null;
  canonicalShape: Record<string, unknown> | null;
  band: 'high' | 'medium' | 'low' | 'no_match';
  suggestedAction: 'pattern' | 'template' | 'custom';
  rationale: string;
}

export interface ClassifierInput {
  useCase: string;
  industry?: string;
  sponsor?: string;
  scale?: string;
  entities?: string[];
  archetypeHint?: ArchetypeKey;
  tenancy: TenancyCtx;
}

export interface ClassifierOutput {
  matches: PatternClassifierMatch[];
  extracted: {
    archetype: ArchetypeKey | null;
    industry: string | null;
    entities: string[];
    objectives: string[];
  };
  latencyMs: {
    stage1: number;
    stage2: number;
    stage3: number;
    total: number;
  };
}

export interface FounderApprovalRequestRow {
  id: string;
  engagementId: string;
  requestType:
    | 'phase_gate' | 'budget_change' | 'scope_change'
    | 'vendor_selection' | 'program_close' | 'risk_acceptance' | 'milestone_slip';
  status: ApprovalRequestStatus;
  requestedByUserId: string;
  approverUserId: string | null;
  approverRole: string | null;
  headline: string;
  context: Record<string, unknown>;
  decisionNotes: string | null;
  deadlineAt: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface MaestroFlag {
  id: string;
  engagementId: string;
  flagType: FlagType;
  severity: FlagSeverity;
  raisedBy: 'maestro' | 'nexus' | 'system' | 'user';
  raisedByUserId: string | null;
  headline: string;
  context: Record<string, unknown>;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export interface PhaseSnapshot {
  id: string;
  engagementId: string;
  phaseNumber: number;
  phaseName: string | null;
  snapshot: Record<string, unknown>;
  lockedByUserId: string | null;
  lockedAt: string | null;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface GateCheck {
  pass: boolean;
  failedChecks: Array<{ check: string; reason: string; severity: 'hard' | 'soft' }>;
  requiresApproval: boolean;
  approverRole: ApprovalAuthority | null;
}
