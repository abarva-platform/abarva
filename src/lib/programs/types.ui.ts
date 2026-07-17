import type { TimelineResourceEstimate } from "@/types/estimation";
import type { ExecutionRoadmapTracker } from "@/types/tracker";

export type ViewerRole =
  | "sponsor"
  | "lead"
  | "team_member"
  | "maestro"
  | "founder";

export type ArchetypeKey =
  | "strategic_transformation"
  | "workflow_automation"
  | "platform_modernization"
  | "ai_product_enablement"
  | "operational_optimization";

export type AttentionVariant = "warning" | "danger" | "success" | "info";

export interface PersonRef {
  id: string;
  name: string;
  title: string;
  initials: string;
  avatarColor?: string;
  clientName?: string;
}

export interface ParticipantRef extends PersonRef {
  role: ViewerRole | "operator";
  workstream?: string;
  activitySummary?: string;
  notificationState?: "all" | "priority" | "muted";
}

export interface ThreadRef {
  id: string;
  title: string;
  source: "intelligence" | "tower" | "manual";
  lastTouchedAt: Date;
}

export interface ActivityEntry {
  id: string;
  type: "gate" | "deliverable" | "nexus" | "risk" | "milestone" | "approval";
  title: string;
  detail: string;
  at: Date;
  actor: PersonRef;
}

export interface PhaseState {
  canonicalPhase: number;
  name: string;
  state: "locked" | "active" | "complete" | "pending_gate" | "skipped";
  gateType: "hard" | "soft" | "none";
  summary: string;
}

export interface InboxItem {
  id: string;
  priority: "critical" | "high" | "medium";
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
  phase?: "all" | "1" | "2" | "3" | "4" | "5" | "6";
  archetype?: "all" | ArchetypeKey;
  status?: "all" | "active" | "pending" | "blocked" | "complete" | "archived";
  sponsor?: "all" | string;
  pattern?: "all" | string;
  myRole?: "all" | ViewerRole;
  shape?: "all" | "template" | "pattern" | "custom";
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
  phaseStatus: "active" | "awaiting_gate" | "blocked" | "complete";
  sponsorPerson: PersonRef;
  leadPerson: PersonRef;
  lastActivityAt: Date;
  attentionBadge?: { label: string; variant: AttentionVariant };
  shape: "template" | "pattern" | "custom";
  // Canonical tenant display name, resolved via canonicalClientDisplayName
  // (src/lib/client-config.ts). String — NOT a closed union — so every tenant
  // (SkyHarbor Air, Northstar Clinical, …) renders correctly and a new tenant
  // never silently defaults to another tenant's name.
  clientName: string;
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
  confidenceBand: "high" | "medium" | "low";
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
  status:
    | "not_started"
    | "in_progress"
    | "draft"
    | "in_review"
    | "signed_off"
    | "skipped"
    | "blocked";
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
  shape: "template" | "pattern" | "custom";
  patternKey?: string;
  phases: PhaseState[];
  modules: ModuleState[];
  team: ParticipantRef[];
  activity: ActivityEntry[];
  linkedIntelligenceThreads?: ThreadRef[];
  archetype: ArchetypeKey;
  // Canonical tenant display name, resolved via canonicalClientDisplayName
  // (src/lib/client-config.ts). String — NOT a closed union — so every tenant
  // (SkyHarbor Air, Northstar Clinical, …) renders correctly and a new tenant
  // never silently defaults to another tenant's name.
  clientName: string;
  sponsorPerson: PersonRef;
  leadPerson: PersonRef;
  phaseStatus: ProgramSummary["phaseStatus"];
  patternName?: string;
  gateSummary: string;
  gateStatus: "pending" | "cleared" | "blocked";
  recommendationPin?: string;
  executeData?: ExecuteSurfaceProps;
  deliverables: DeliverableSummary[];
  metrics: Array<{
    label: string;
    value: string;
    tone?: "default" | "teal" | "amber" | "red";
  }>;
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
  status: "draft" | "in_review" | "signed_off";
  updatedAt: Date;
  owner: PersonRef;
  summary: string;
}

export interface ModuleWorkspaceProps {
  programId: string;
  moduleKey: string;
  renderPattern: "form" | "analysis" | "narrative" | "matrix" | "tracker";
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
  status: "not_started" | "in_progress" | "done" | "at_risk";
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
  status: "not_started" | "in_progress" | "done" | "blocked" | "cancelled";
  dueLabel: string;
  dependency?: string;
  nexusDrafted?: boolean;
}

export interface Risk {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  owner: PersonRef;
  mitigation: string;
  status: "open" | "watching" | "resolved";
}

export interface EvidenceArtifact {
  id: string;
  title: string;
  kind: "screenshot" | "metric" | "log" | "approval" | "report";
  relatedTo: string;
  summary: string;
}

export interface StatusReport {
  id: string;
  title: string;
  audience: "lead" | "sponsor" | "maestro";
  summary: string;
  draftedBy: "nexus" | "lead";
  publishedAt: Date;
}

export interface ExecuteSurfaceProps {
  programId: string;
  activeTab: "milestones" | "work" | "risks" | "evidence" | "reports";
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
  status: "pending_review" | "ready" | "needs_context";
  summary: string;
}

export interface NexusFlag {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
}

export interface ContextSource {
  id: string;
  label: string;
  sourceType: "pattern" | "l1" | "l2" | "l3";
  detail: string;
}

export interface NexusPanelProps {
  programId: string;
  mode: "collapsed" | "expanded";
  activeTab: "chat" | "drafts" | "flags" | "sources";
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
  speaker: "nexus" | "sponsor" | "lead";
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
  mode: "phase_3_interview" | "phase_6_verification";
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
  promotionState: "proven" | "candidate" | "mature";
  summary: string;
  typicalDurationMonths: number;
  deploymentCount: number;
  preloadDepthPct: number;
}

export interface ModuleContent {
  summary: string;
  formFields?: Array<{ label: string; value: string; hint?: string }>;
  narrativeBlocks?: Array<{ title: string; body: string }>;
  matrix?: {
    criteria: string[];
    options: Array<{ name: string; scores: number[]; rationale: string }>;
  };
  tracker?: Array<{
    label: string;
    baseline: string;
    target: string;
    current: string;
    trend: string;
  }>;
  findings?: Array<{ title: string; detail: string; evidence: string[] }>;
  stakeholders?: Array<{
    id: string;
    name: string;
    role: string;
    x: number;
    y: number;
    quadrant: "manage_closely" | "keep_satisfied" | "keep_informed" | "monitor";
  }>;
  timelineEstimate?: TimelineResourceEstimate;
  executionRoadmapTracker?: ExecutionRoadmapTracker;
  structuredDocument?: Record<string, unknown>;
}

export interface OriginationStageEvent {
  id: string;
  label: string;
  detail: string;
  state: "running" | "complete";
}

export type OriginationRequest =
  | OriginationForm
  | { source: "intelligence_thread"; threadId: string }
  | { source: "tower_signal"; signalId: string };

export interface CreateProgramRequest {
  originationFormResult: OriginationForm;
  acceptedPatternKey?: string;
  shapeModifications?: {
    shape?: "template" | "pattern" | "custom";
    notes?: string;
  };
}

export type StrategicMoveStatusColor = "red" | "amber" | "green" | "teal";

export interface StrategicMove {
  id: string;
  displayCode: string;
  name: string;
  tenant: {
    id: string;
    name: string;
    industryCode: string | null;
  };
  // The origination charter JSONB (`engagements.charter`) — the structured
  // brief written at origination. It still carries `functionPackKey` (the
  // classified Domain Function Pack function) as a dual-written fallback, but
  // `functionPackKey` below is now the first-class source. Surfaced so the
  // board-artifacts registry can resolve a Move's `(industryKey, functionKey)`
  // identity without a second DB read. `null` for legacy Moves created before
  // the charter write was introduced.
  charter: Record<string, unknown> | null;
  // The Domain Function Pack function key the Move resolves to — the
  // first-class `engagements.function_pack_key` column. The board-artifacts
  // registry and the function-identity resolver prefer this over
  // `charter.functionPackKey`. `null` when no pack cleared the confidence
  // floor, or for a row read before the column existed.
  functionPackKey: string | null;
  archetype: string;
  currentPhase: number;
  // True once the terminal P5 gate has passed. `currentPhase` remains capped at
  // P5 for route compatibility, so consumers need this explicit completion
  // signal to render the last phase as complete instead of perpetually active.
  terminalComplete?: boolean;
  phaseLabel: string;
  status: {
    key: string;
    text: string;
    description: string;
  };
  statusColor: StrategicMoveStatusColor;
  sponsor: { id: string; name: string; role: string } | null;
  participants: Array<{ personId: string; name: string; role: string }>;
  valueAtStake: {
    projected: { low: number; high: number; currency: string } | null;
    verified: {
      amount: number;
      status: "pending" | "tracked" | "final";
    } | null;
    assumptions: Record<string, unknown> | null;
  };
  deliverables: Array<{
    id: string;
    typeKey: string;
    title: string;
    status: string;
    updatedAt: string | null;
    preview: string;
    url: string;
  }>;
  // Gate criteria for the move's current → next phase transition. Each
  // criterion is evaluated against real program state via
  // `governance.evaluateGate` — `completed` is never fabricated. `verified`
  // is true when the criterion was actually evaluated (false only when no
  // gate rule exists, e.g. the terminal phase, in which case the criterion
  // is rendered explicitly as not-yet-verified rather than guessed).
  gateCriteria: Array<{
    id: string;
    label: string;
    completed: boolean;
    severity: "hard" | "soft";
    verified: boolean;
  }>;
  recentActivity: Array<{
    at: string;
    actor: string;
    action: string;
    summary: string;
  }>;
  linkedEvidence: Array<{
    id: string;
    anchor: string;
    summary: string;
    url: string;
  }>;
  mapLabel: string;
  createdAt: string;
  updatedAt: string;
  // Manage Moves: lifecycle + archive provenance, surfaced so the manage
  // surface can render the Archived filter and the archive metadata without a
  // second read. `lifecycleState === 'archived'` ⇒ the Move is archived.
  // Optional: only the Manage Moves read path populates them; other producers
  // (and test fixtures) may omit them.
  lifecycleState?: string | null;
  archivedAt?: string | null;
  archiveReason?: string | null;
  archiveExplanation?: string | null;
  archivedFromState?: string | null;
}

export interface StrategicMovePortfolio {
  moves: StrategicMove[];
  counts: {
    total: number;
    needAttention: number;
    onTrack: number;
    gated: number;
    idle: number;
  };
  totalValueAtStake: {
    amount: number;
    currency: string;
  };
  needAttentionMoves: Array<{
    id: string;
    displayCode: string;
    statusText: string;
    statusDescription: string;
  }>;
}
