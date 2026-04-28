// PROG-A — Wave programs redesign view-model types.
// Pure TypeScript data contracts consumed by all Programs pages.
// No React, no model calls, no network, no Date.now() reads.

export type ProgramPhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ProgramPhaseState = 'done' | 'current' | 'pending' | 'locked';
export type ProgramGateStatus = 'open' | 'pending' | 'approved' | 'idle' | 'na';
export type AgentRailState = 'active' | 'on_call' | 'advisory' | 'idle';

export interface ProgramPhaseSlot {
  id: ProgramPhaseId;
  label: string; // 'Originate' | 'Discovery' | 'Synthesis' | 'Design' | 'Build' | 'Activate' | 'Operate'
  state: ProgramPhaseState;
  gateStatus?: 'open' | 'pending' | 'approved';
}

export interface ProgramAgentRailItem {
  initials: string; // 'Nx' | 'Sn' | 'At' | 'St'
  name: string;
  job: string;        // current job in this program/phase context
  state: AgentRailState;
}

export interface ProgramWorkbenchContent {
  title: string;
  prose: string;
  actionsLabel: string;
  actions: Array<{ letter: string; text: string; detail: string }>;
}

export interface ProgramRow {
  id: string;           // 'apx-01'
  displayId: string;    // 'APX-01'
  name: string;
  currentPhase: ProgramPhaseId;
  phases: ProgramPhaseSlot[];  // all 7 phases (P0-P6) with state
  gateStatus: ProgramGateStatus;
  lastActiveLabel: string;  // '2h ago' | '12d ago' | 'Mar 26'
  nexusNote: string;        // one-line Nexus annotation
  actionLabel: 'Continue' | 'Resume' | 'Review';
  isIdle: boolean;
  linkedSourceEvent?: string; // e.g. 'SRC-AMS-2026 · AMS Vendor Consolidation 2026 · Stage 7 BAFO'
}

export interface ProgramsIndexView {
  tenant: string;
  totalActive: number;
  gatesPending: number;
  idleCount: number;
  capacityLabel: string;
  portfolioWorkbench: ProgramWorkbenchContent;
  agentRail: ProgramAgentRailItem[];
  programs: ProgramRow[];
}

export interface EvidenceItem {
  id: string;
  citation: string;       // e.g. "Workshop 4 output · Apr 14 2026"
  source: string;         // e.g. "Priya Sharma / Workshop"
  excerpt: string;        // 1–2 sentence quote
  confidence: 'high' | 'medium' | 'low';
  hasContradiction?: boolean;  // true if a conflicting item exists
}

export interface ProgramPhasePanel {
  summary?: string;
  deliverables?: Array<{ label: string; status: 'done' | 'pending' | 'blocked' }>;
  gateCriteria?: Array<{ criterion: string; met: boolean }>;
  blockerNote?: string;
  evidenceItems?: EvidenceItem[];
}

export interface ProgramDetailView {
  programId: string;
  displayId: string;
  name: string;
  tenant: string;
  currentPhase: ProgramPhaseId;
  viewingPhase: ProgramPhaseId;
  phases: ProgramPhaseSlot[];
  gateStatus: ProgramGateStatus;
  linkedSourceEvent?: string;
  workbench: ProgramWorkbenchContent;
  agentRail: ProgramAgentRailItem[];
  phasePanel: ProgramPhasePanel;
  deterministicSeed: true;
}

export interface ProgramOriginationView {
  tenant: string;
  phases: ProgramPhaseSlot[];  // P0 current, P1-P6 locked
  workbench: ProgramWorkbenchContent;
  agentRail: ProgramAgentRailItem[];
  deterministicSeed: true;
}
