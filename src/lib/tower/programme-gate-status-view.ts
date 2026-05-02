// programme-gate-status-view.ts — TOWER8
//
// Deterministic view model for the Programme Gate Status lens in Control Tower.
// Provides current phase/gate state for all 4 active Apex AI programmes,
// with a Tower-level view of what's blocking cross-programme advancement.
//
// Rendered as a section within TowerLensTabs (programme_gates tab).
//
// Answers: "Across all 4 Apex AI programmes, what gates are pending,
// what's blocking, and what requires immediate tower-level attention?"
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/source/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ─────────────────────────────────────────────────────────────

export type GateStatus =
  | 'pending'
  | 'approved'
  | 'blocked'
  | 'at_risk'
  | 'not_reached';

export type ProgrammePhase = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface ProgrammeGateMilestone {
  gateId: string;
  phase: ProgrammePhase;
  /** Short label (e.g., "P2 Synthesis gate"). */
  label: string;
  status: GateStatus;
  /** What must happen before this gate can clear. */
  gatingCondition: string | null;
  /** Scheduled date or deadline (human-readable). */
  targetDate: string | null;
}

export interface ProgrammeGateStatusCard {
  programmeId: string;
  programmeName: string;
  /** Short programme ID label (e.g., "APX-CDP-2026"). */
  displayId: string;
  currentPhase: ProgrammePhase;
  /** Human-readable current phase status. */
  currentPhaseStatus: string;
  /** Gate that is currently the active decision point. */
  activeGate: ProgrammeGateMilestone;
  /** Next gate coming up after the active one. */
  nextGate: ProgrammeGateMilestone | null;
  /** Tower-level risk flags for this programme. */
  towerFlags: string[];
  /** Whether this programme needs tower-level intervention. */
  needsTowerAttention: boolean;
}

export interface ProgrammeGateStatusSummary {
  totalProgrammes: number;
  pendingGates: number;
  blockedGates: number;
  atRiskGates: number;
  approvedGates: number;
  needsAttentionCount: number;
}

export interface ProgrammeGateStatusView {
  programmes: ProgrammeGateStatusCard[];
  summary: ProgrammeGateStatusSummary;
  /** Cross-programme gate dependencies that need Tower co-ordination. */
  crossProgrammeDependencies: string[];
  /** Atlas synthesis of the overall gate status. */
  atlasSynthesis: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const PROGRAMME_CARDS: ProgrammeGateStatusCard[] = [
  {
    programmeId: 'APX-CDP-2026',
    programmeName: 'Customer Data Platform Activation',
    displayId: 'APX-CDP-2026',
    currentPhase: 'P3',
    currentPhaseStatus: 'P3 Design — gate pending',
    activeGate: {
      gateId: 'cdp-p3-design-gate',
      phase: 'P3',
      label: 'P3 Design gate',
      status: 'blocked',
      gatingCondition: 'Loyalty data quality baseline must be validated; AMS vendor selection must complete (vendor CDP integration scope dependency)',
      targetDate: 'May 5 2026',
    },
    nextGate: {
      gateId: 'cdp-p4-build-gate',
      phase: 'P4',
      label: 'P4 Execution Roadmap gate',
      status: 'not_reached',
      gatingCondition: null,
      targetDate: 'June 2026',
    },
    towerFlags: [
      'Blocked on AMS vendor selection (CDP architecture dependency)',
      'Loyalty data quality baseline not yet validated',
    ],
    needsTowerAttention: true,
  },
  {
    programmeId: 'APX-AMS-2026',
    programmeName: 'AMS Vendor Consolidation',
    displayId: 'APX-AMS-2026',
    currentPhase: 'P3',
    currentPhaseStatus: 'P3 Design — BAFO evaluation in progress',
    activeGate: {
      gateId: 'ams-bafo-close',
      phase: 'P3',
      label: 'BAFO close / vendor selection',
      status: 'at_risk',
      gatingCondition: 'Vendor C scope confirmation outstanding; Vendor B SOC-2 blocker unresolved',
      targetDate: 'May 5 2026',
    },
    nextGate: {
      gateId: 'ams-award-gate',
      phase: 'P3',
      label: 'Contract award gate',
      status: 'not_reached',
      gatingCondition: null,
      targetDate: 'May 10 2026',
    },
    towerFlags: [
      'BAFO close at risk — 2 vendor conditions outstanding',
      'CDP programme dependency: vendor selection must complete by May 5',
    ],
    needsTowerAttention: true,
  },
  {
    programmeId: 'APX-SA-2026',
    programmeName: 'Store Associate AI Productivity',
    displayId: 'APX-SA-2026',
    currentPhase: 'P2',
    currentPhaseStatus: 'P2 Synthesis — gate upcoming',
    activeGate: {
      gateId: 'sa-p2-synthesis-gate',
      phase: 'P2',
      label: 'P2 Synthesis gate',
      status: 'at_risk',
      gatingCondition: 'Outcome capture mechanism not yet defined; latency budget for in-aisle inference unspecified',
      targetDate: 'May 7 2026',
    },
    nextGate: {
      gateId: 'sa-p3-design-gate',
      phase: 'P3',
      label: 'P3 Design gate',
      status: 'not_reached',
      gatingCondition: null,
      targetDate: 'June 2026',
    },
    towerFlags: [
      'Outcome capture mechanism undefined — P2 gate will hold',
      'Latency budget for in-aisle inference needs specification',
    ],
    needsTowerAttention: true,
  },
  {
    programmeId: 'APX-DF-2026',
    programmeName: 'AI Demand Forecasting',
    displayId: 'APX-DF-2026',
    currentPhase: 'P2',
    currentPhaseStatus: 'P2 Synthesis — on track',
    activeGate: {
      gateId: 'df-p2-synthesis-gate',
      phase: 'P2',
      label: 'P2 Synthesis gate',
      status: 'pending',
      gatingCondition: 'Demand signal data pipeline specification due before gate review',
      targetDate: 'May 14 2026',
    },
    nextGate: {
      gateId: 'df-p3-design-gate',
      phase: 'P3',
      label: 'P3 Design gate',
      status: 'not_reached',
      gatingCondition: null,
      targetDate: 'July 2026',
    },
    towerFlags: [],
    needsTowerAttention: false,
  },
];

const CROSS_PROGRAMME_DEPENDENCIES: string[] = [
  'APX-CDP-2026 P3 Design gate is blocked until APX-AMS-2026 BAFO closes (May 5) — CDP architecture scope depends on vendor selection',
  'APX-SA-2026 P2 Synthesis gate (May 7) has a sequential dependency on CDP platform availability for the outcome capture mechanism',
  'APX-DF-2026 demand signal pipeline specification must not conflict with CDP data layer being finalised in APX-CDP-2026 P3',
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the programme gate status view for Control Tower.
 *
 * Returns gate status cards for all 4 Apex AI programmes, with cross-programme
 * dependency notes and atlas synthesis.
 *
 * Deterministic: derives from fixture data only.
 */
export function buildProgrammeGateStatusView(): ProgrammeGateStatusView {
  const programmes = PROGRAMME_CARDS;
  const pendingGates = programmes.filter((p) => p.activeGate.status === 'pending').length;
  const blockedGates = programmes.filter((p) => p.activeGate.status === 'blocked').length;
  const atRiskGates = programmes.filter((p) => p.activeGate.status === 'at_risk').length;
  const approvedGates = programmes.filter((p) => p.activeGate.status === 'approved').length;
  const needsAttentionCount = programmes.filter((p) => p.needsTowerAttention).length;

  return {
    programmes,
    summary: {
      totalProgrammes: programmes.length,
      pendingGates,
      blockedGates,
      atRiskGates,
      approvedGates,
      needsAttentionCount,
    },
    crossProgrammeDependencies: CROSS_PROGRAMME_DEPENDENCIES,
    atlasSynthesis:
      'Three of four programmes have gates requiring Tower attention by May 7. ' +
      'The critical path runs AMS BAFO close (May 5) → CDP P3 Design gate → SA P2 Synthesis gate (May 7). ' +
      'Unblocking AMS on May 5 is the prerequisite for both downstream gates. ' +
      'APX-DF-2026 is the only programme on track — no immediate tower intervention required.',
    honestDisclaimer:
      'Deterministic seed · Programme gate status reflects fixture phase data for the Apex Retail ' +
      'engagement. Live gate approvals, phase transitions, and gate criteria updates are managed ' +
      'by the programme gate management workflow.',
    deterministicSeed: true,
  };
}
