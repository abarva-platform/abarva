export type ViewerRole = 'sponsor' | 'lead' | 'team_member' | 'maestro' | 'founder';

export type ArchetypeKey =
  | 'strategic_transformation'
  | 'workflow_automation'
  | 'platform_modernization'
  | 'ai_product_enablement'
  | 'operational_optimization';

export type AttentionVariant = 'warning' | 'danger' | 'success' | 'info';

export interface PersonRef {
  id: string;
  name: string;
  title: string;
  initials: string;
  avatarColor?: string;
  clientName?: string;
}

export interface ParticipantRef extends PersonRef {
  role: ViewerRole | 'operator';
  workstream?: string;
  activitySummary?: string;
  notificationState?: 'all' | 'priority' | 'muted';
}

export interface ThreadRef {
  id: string;
  title: string;
  source: 'intelligence' | 'tower' | 'manual';
  lastTouchedAt: Date;
}

export interface ActivityEntry {
  id: string;
  type: 'gate' | 'deliverable' | 'nexus' | 'risk' | 'milestone' | 'approval';
  title: string;
  detail: string;
  at: Date;
  actor: PersonRef;
}

export interface PhaseState {
  canonicalPhase: number;
  name: string;
  state: 'locked' | 'active' | 'complete' | 'pending_gate' | 'skipped';
  gateType: 'hard' | 'soft' | 'none';
  summary: string;
}

export interface InboxItem {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  label: string;
  title: string;
  detail: string;
  dueLabel: string;
  programId: string;
  programName: string;
  actionLabel: string;
}

export interface PortfolioFilters {
  search?: string;
  phase?: 'all' | '1' | '2' | '3' | '4' | '5' | '6';
  archetype?: 'all' | ArchetypeKey;
  status?: 'all' | 'active' | 'pending' | 'blocked' | 'complete' | 'archived';
  sponsor?: 'all' | string;
  pattern?: 'all' | string;
  myRole?: 'all' | ViewerRole;
  shape?: 'all' | 'template' | 'pattern' | 'custom';
}

export interface PortfolioIndexProps {
  viewerRole: ViewerRole;
  programs: ProgramSummary[];
  inboxItems: InboxItem[];
  filters: PortfolioFilters;
  onFilterChange: (filters: PortfolioFilters) => void;
  onProgramClick: (programId: string) => void;
}

export interface ProgramSummary {
  id: string;
  name: string;
  archetype: ArchetypeKey;
  patternKey?: string;
  patternName?: string;
  charterSummary: string;
  currentPhase: number;
  phaseStatus: 'active' | 'awaiting_gate' | 'blocked' | 'complete';
  sponsorPerson: PersonRef;
  leadPerson: PersonRef;
  lastActivityAt: Date;
  attentionBadge?: { label: string; variant: AttentionVariant };
  shape: 'template' | 'pattern' | 'custom';
  clientName: 'Meridian Health System' | 'First Capital Financial' | 'Apex Retail Group';
}

export interface OriginationForm {
  name: string;
  useCase: string;
  targetOutcome: string;
  sponsorPersonId: string;
  leadPersonId: string;
  industryHint?: string;
  functionHint?: string;
  budgetRangeHint?: string;
  timelineHint?: string;
}

export interface PatternMatch {
  patternKey: string;
  patternName: string;
  confidence: number;
  confidenceBand: 'high' | 'medium' | 'low';
  deploymentCount: number;
  successfulDeploymentCount: number;
  medianOutcomeUsd?: number;
  typicalDurationMonths: number;
  successRatePct: number;
  preloadDepthPct: number;
  proposedShape: {
    phases: Array<{ canonicalPhase: number; name: string }>;
    modules: Array<{ moduleKey: string; name: string }>;
  };
  isTopMatch: boolean;
}

export interface CharterSummary {
  headline: string;
  bullets: string[];
  sponsorDecision: string;
  baselineNeed: string;
}

export interface ModuleState {
  moduleKey: string;
  name: string;
  phase: number;
  status: 'not_started' | 'in_progress' | 'draft' | 'in_review' | 'signed_off' | 'skipped' | 'blocked';
  currentVersion?: number;
  lastEditedBy?: PersonRef;
  lastEditedAt?: Date;
  nexusDraftPending?: boolean;
  blockerReason?: string;
  deliverableIds?: string[];
}

export interface ProgramFullState {
  id: string;
  name: string;
  charter: CharterSummary;
  currentPhase: number;
  shape: 'template' | 'pattern' | 'custom';
  patternKey?: string;
  phases: PhaseState[];
  modules: ModuleState[];
  team: ParticipantRef[];
  activity: ActivityEntry[];
  linkedIntelligenceThreads?: ThreadRef[];
  archetype: ArchetypeKey;
  clientName: 'Meridian Health System' | 'First Capital Financial' | 'Apex Retail Group';
  sponsorPerson: PersonRef;
  leadPerson: PersonRef;
  phaseStatus: ProgramSummary['phaseStatus'];
  patternName?: string;
  gateSummary: string;
  gateStatus: 'pending' | 'cleared' | 'blocked';
  recommendationPin?: string;
  executeData?: ExecuteSurfaceProps;
  deliverables: DeliverableSummary[];
  metrics: Array<{ label: string; value: string; tone?: 'default' | 'teal' | 'amber' | 'red' }>;
  sponsorDashboard: {
    openDecisions: string[];
    milestones: string[];
    keyFindings: string[];
    outcomeSignal: string;
  };
  nexusPanel: NexusPanelProps;
  moduleContent: Record<string, ModuleContent>;
}

export interface ProgramDetailProps {
  programId: string;
  viewerRole: ViewerRole;
  program: ProgramFullState;
  onPhaseNavigate: (phaseNumber: number) => void;
  onModuleOpen: (moduleKey: string) => void;
  onAdvancePhase: (fromPhase: number) => Promise<AdvanceResult>;
}

export interface DeliverableSummary {
  id: string;
  title: string;
  moduleKey: string;
  version: number;
  status: 'draft' | 'in_review' | 'signed_off';
  updatedAt: Date;
  owner: PersonRef;
  summary: string;
}

export interface ModuleWorkspaceProps {
  programId: string;
  moduleKey: string;
  renderPattern: 'form' | 'analysis' | 'narrative' | 'matrix' | 'tracker';
  moduleState: ModuleState;
  viewerRole: ViewerRole;
  onFieldChange: (field: string, value: unknown) => Promise<void>;
  onNexusDraftRequest: () => Promise<DraftResult>;
  onPublish: () => Promise<void>;
}

export interface Milestone {
  id: string;
  name: string;
  owner: PersonRef;
  status: 'not_started' | 'in_progress' | 'done' | 'at_risk';
  plannedWindow: string;
  actualWindow?: string;
  progressLabel: string;
  evidenceCount: number;
}

export interface WorkItem {
  id: string;
  title: string;
  milestoneId: string;
  assignee: PersonRef;
  status: 'not_started' | 'in_progress' | 'done' | 'blocked' | 'cancelled';
  dueLabel: string;
  dependency?: string;
  nexusDrafted?: boolean;
}

export interface Risk {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  owner: PersonRef;
  mitigation: string;
  status: 'open' | 'watching' | 'resolved';
}

export interface EvidenceArtifact {
  id: string;
  title: string;
  kind: 'screenshot' | 'metric' | 'log' | 'approval' | 'report';
  relatedTo: string;
  summary: string;
}

export interface StatusReport {
  id: string;
  title: string;
  audience: 'lead' | 'sponsor' | 'maestro';
  summary: string;
  draftedBy: 'nexus' | 'lead';
  publishedAt: Date;
}

export interface ExecuteSurfaceProps {
  programId: string;
  activeTab: 'milestones' | 'work' | 'risks' | 'evidence' | 'reports';
  milestones: Milestone[];
  workItems: WorkItem[];
  risks: Risk[];
  evidence: EvidenceArtifact[];
  reports: StatusReport[];
  viewerRole: ViewerRole;
}

export interface ProgramThread {
  id: string;
  title: string;
  turns: Turn[];
}

export interface NexusDraft {
  id: string;
  title: string;
  moduleKey: string;
  status: 'pending_review' | 'ready' | 'needs_context';
  summary: string;
}

export interface NexusFlag {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
}

export interface ContextSource {
  id: string;
  label: string;
  sourceType: 'pattern' | 'l1' | 'l2' | 'l3';
  detail: string;
}

export interface NexusPanelProps {
  programId: string;
  mode: 'collapsed' | 'expanded';
  activeTab: 'chat' | 'drafts' | 'flags' | 'sources';
  thread: ProgramThread;
  drafts: NexusDraft[];
  flags: NexusFlag[];
  sources: ContextSource[];
}

export interface Question {
  id: string;
  prompt: string;
  rationale: string;
}

export interface Turn {
  id: string;
  speaker: 'nexus' | 'sponsor' | 'lead';
  text: string;
}

export interface NextTurn {
  nextQuestion?: Question;
  transcript: Turn[];
}

export interface Synthesis {
  headline: string;
  bullets: string[];
}

export interface CxoTakeoverProps {
  programId: string;
  mode: 'phase_3_interview' | 'phase_6_verification';
  questionBank: Question[];
  currentQuestion: Question;
  transcript: Turn[];
  onAnswer: (answer: string) => Promise<NextTurn>;
  onClose: () => Promise<Synthesis>;
}

export interface AdvanceResult {
  ok: boolean;
  message: string;
}

export interface DraftResult {
  ok: boolean;
  message: string;
}

export interface PatternLibraryItem {
  key: string;
  name: string;
  archetype: ArchetypeKey;
  promotionState: 'proven' | 'candidate' | 'mature';
  summary: string;
  typicalDurationMonths: number;
  deploymentCount: number;
  preloadDepthPct: number;
}

export interface ModuleContent {
  summary: string;
  structuredDocument?: Record<string, unknown>;
  formFields?: Array<{ label: string; value: string; hint?: string }>;
  narrativeBlocks?: Array<{ title: string; body: string }>;
  matrix?: {
    criteria: string[];
    options: Array<{ name: string; scores: number[]; rationale: string }>;
  };
  tracker?: Array<{ label: string; baseline: string; target: string; current: string; trend: string }>;
  findings?: Array<{ title: string; detail: string; evidence: string[] }>;
  stakeholders?: Array<{
    id: string;
    name: string;
    role: string;
    x: number;
    y: number;
    quadrant: 'manage_closely' | 'keep_satisfied' | 'keep_informed' | 'monitor';
  }>;
}

export interface OriginationStageEvent {
  id: string;
  label: string;
  detail: string;
  state: 'running' | 'complete';
}

export type OriginationRequest =
  | OriginationForm
  | { source: 'intelligence_thread'; threadId: string }
  | { source: 'tower_signal'; signalId: string };

export interface CreateProgramRequest {
  originationFormResult: OriginationForm;
  acceptedPatternKey?: string;
  shapeModifications?: {
    shape?: 'template' | 'pattern' | 'custom';
    notes?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────
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
