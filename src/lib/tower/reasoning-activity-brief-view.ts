// reasoning-activity-brief-view.ts — TOWER9
//
// Deterministic view model for the Reasoning Activity Brief lens in Control Tower.
// Surfaces AI reasoning signals across the Apex Retail engagement: active
// contradictions, pending cross-stage handoffs, evidence quality signals, and
// a weekly synthesis cadence summary.
//
// Answers: "What is the AI reasoning engine tracking right now, and which reasoning
// signals are most relevant to current Tower decisions?"
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/source/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ──────────────────────────────────────────────────────────────

export type ContradictionSeverity = 'low' | 'medium' | 'high';
export type ContradictionStatus = 'open' | 'monitoring' | 'resolved';
export type HandoffReadiness = 'green' | 'amber' | 'red';

export interface ReasoningContradictionItem {
  contradictionId: string;
  /** Short label for this contradiction. */
  label: string;
  patternId: string;
  patternTitle: string;
  severity: ContradictionSeverity;
  status: ContradictionStatus;
  /** Which programme gate this contradiction most directly affects. */
  relevantGate: string | null;
  /** Tower-level flag text to surface in the panel. */
  towerFlag: string | null;
}

export interface ReasoningHandoffItem {
  handoffId: string;
  programmeId: string;
  programmeName: string;
  fromStage: string;
  toStage: string;
  /** One-sentence narrative of what needs to transfer. */
  narrativeSummary: string;
  readinessSignal: HandoffReadiness;
}

export interface ReasoningActivitySummary {
  totalPatternsAnalyzed: number;
  activeContradictions: number;
  pendingHandoffs: number;
  resolvedContradictions: number;
  /** Human-readable label for the last synthesis event. */
  lastSynthesisEvent: string;
}

export interface ReasoningActivityBriefView {
  summary: ReasoningActivitySummary;
  activeContradictions: ReasoningContradictionItem[];
  pendingHandoffs: ReasoningHandoffItem[];
  atlasSynthesis: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const CONTRADICTION_ITEMS: ReasoningContradictionItem[] = [
  {
    contradictionId: 'CON-AMS-001',
    label: 'Vendor B SOC-2 gap vs. security tier requirement',
    patternId: 'PAT-SRC-AMS-001',
    patternTitle: 'AMS Outsourcing 2026 — Vendor Evaluation',
    severity: 'high',
    status: 'open',
    relevantGate: 'APX-AMS-2026 BAFO close (May 5)',
    towerFlag: 'Hard gate: Vendor B cannot proceed without SOC-2 Type II — decision needed at BAFO close',
  },
  {
    contradictionId: 'CON-CDP-001',
    label: 'CDP integration scope undefined while vendor selection pending',
    patternId: 'PAT-PRG-CDP-001',
    patternTitle: 'Customer Data Platform Activation — P3 Design',
    severity: 'high',
    status: 'open',
    relevantGate: 'APX-CDP-2026 P3 Design gate (post-May 5)',
    towerFlag: 'CDP architecture cannot be finalised until AMS vendor is selected — creates sequential dependency',
  },
  {
    contradictionId: 'CON-AMS-002',
    label: 'Vendor C scope confirmation missing for BAFO comparison',
    patternId: 'PAT-SRC-AMS-001',
    patternTitle: 'AMS Outsourcing 2026 — Vendor Evaluation',
    severity: 'high',
    status: 'open',
    relevantGate: 'APX-AMS-2026 BAFO close (May 5)',
    towerFlag: 'Vendor C scope gap prevents a clean BAFO comparison — sourcing team must resolve before May 5',
  },
  {
    contradictionId: 'CON-SA-001',
    label: 'Outcome capture mechanism undefined for in-aisle AI inference',
    patternId: 'PAT-PRG-SA-001',
    patternTitle: 'Store Associate AI Productivity — P2 Synthesis',
    severity: 'medium',
    status: 'open',
    relevantGate: 'APX-SA-2026 P2 Synthesis gate (May 7)',
    towerFlag: 'Without an outcome capture mechanism, P2 gate will hold — product team owns resolution',
  },
  {
    contradictionId: 'CON-DF-001',
    label: 'Demand signal pipeline specification not yet scoped vs. CDP data layer',
    patternId: 'PAT-PRG-DF-001',
    patternTitle: 'AI Demand Forecasting — P2 Synthesis',
    severity: 'medium',
    status: 'monitoring',
    relevantGate: 'APX-DF-2026 P2 Synthesis gate (May 14)',
    towerFlag: null,
  },
  {
    contradictionId: 'CON-AMS-003',
    label: 'Vendor A cost allocation split requires finance sign-off',
    patternId: 'PAT-SRC-AMS-001',
    patternTitle: 'AMS Outsourcing 2026 — Vendor Evaluation',
    severity: 'medium',
    status: 'monitoring',
    relevantGate: 'APX-AMS-2026 BAFO close (May 5)',
    towerFlag: null,
  },
];

const HANDOFF_ITEMS: ReasoningHandoffItem[] = [
  {
    handoffId: 'HO-AMS-P3-AWARD',
    programmeId: 'APX-AMS-2026',
    programmeName: 'AMS Vendor Consolidation',
    fromStage: 'P3 BAFO Evaluation',
    toStage: 'P3 Contract Award',
    narrativeSummary:
      'BAFO close must transfer vendor selection rationale, final pricing data, and residual condition status to the contract award team — Vendor C SOC-2 and scope confirmation must be documented as pre-conditions.',
    readinessSignal: 'amber',
  },
  {
    handoffId: 'HO-CDP-P2-P3',
    programmeId: 'APX-CDP-2026',
    programmeName: 'Customer Data Platform Activation',
    fromStage: 'P2 Discovery',
    toStage: 'P3 Design',
    narrativeSummary:
      'CDP P3 Design gate requires AMS vendor selection output — the handoff cannot begin until AMS BAFO closes on May 5 and CDP integration scope is confirmed against the selected vendor.',
    readinessSignal: 'red',
  },
  {
    handoffId: 'HO-SA-P2-P3',
    programmeId: 'APX-SA-2026',
    programmeName: 'Store Associate AI Productivity',
    fromStage: 'P2 Synthesis',
    toStage: 'P3 Design',
    narrativeSummary:
      'SA P2 Synthesis handoff requires an outcome capture mechanism definition and a resolved latency budget for in-aisle inference — both are outstanding as of the May 7 gate.',
    readinessSignal: 'amber',
  },
  {
    handoffId: 'HO-DF-P2-P3',
    programmeId: 'APX-DF-2026',
    programmeName: 'AI Demand Forecasting',
    fromStage: 'P2 Synthesis',
    toStage: 'P3 Design',
    narrativeSummary:
      'DF P2 Synthesis handoff is on track — demand signal pipeline specification is due before the May 14 gate review, with no CDP data layer conflicts identified to date.',
    readinessSignal: 'green',
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the reasoning activity brief view for Control Tower.
 *
 * Returns active contradiction items and pending cross-stage handoffs for all
 * 4 Apex AI programmes, with a Tower-level synthesis.
 *
 * Deterministic: derives from fixture data only.
 */
export function buildReasoningActivityBriefView(): ReasoningActivityBriefView {
  const activeContradictions = CONTRADICTION_ITEMS.filter(
    (c) => c.status === 'open' || c.status === 'monitoring',
  );
  const resolvedContradictions = CONTRADICTION_ITEMS.filter(
    (c) => c.status === 'resolved',
  ).length;

  return {
    summary: {
      totalPatternsAnalyzed: 13,
      activeContradictions: activeContradictions.length,
      pendingHandoffs: HANDOFF_ITEMS.filter((h) => h.readinessSignal !== 'green').length,
      resolvedContradictions,
      lastSynthesisEvent: 'Week 17 · Apr 28 2026 · 4 programmes · 6 contradictions tracked',
    },
    activeContradictions,
    pendingHandoffs: HANDOFF_ITEMS,
    atlasSynthesis:
      'The reasoning engine is tracking 6 active contradictions across 3 of 4 programmes, with ' +
      '3 high-severity items directly gating the critical path. The AMS BAFO close on May 5 is ' +
      'the single most consequential event: resolving CON-AMS-001, CON-AMS-002, and CON-AMS-003 ' +
      'simultaneously unblocks the CDP P3 Design gate and the SA P2 Synthesis handoff. ' +
      'APX-DF-2026 has no active high-severity contradictions.',
    honestDisclaimer:
      'Deterministic seed · Reasoning activity reflects fixture contradiction and handoff data for ' +
      'the Apex Retail engagement. Live contradiction detection, pattern synthesis, and handoff ' +
      'tracking are managed by the Sentinel reasoning runtime.',
    deterministicSeed: true,
  };
}
