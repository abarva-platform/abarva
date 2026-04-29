// programme-risk-summary-view.ts — INT5
//
// Deterministic view model for the Programme Risk Summary lens in the
// Intelligence surface. Cross-references active contradictions, evidence
// gaps, and gate status for each of the 4 Apex AI programmes.
//
// Answers: "How do active contradictions and evidence gaps roll up to
// programme-level risk signals, and which programme is most at risk?"
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/source/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ──────────────────────────────────────────────────────────────

export type ProgrammeRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type ProgrammeGateState = 'blocked' | 'at_risk' | 'pending' | 'approved';

export interface ProgrammeRiskSignal {
  programmeId: string;
  programmeName: string;
  programmeCode: string;
  currentPhase: string;
  /** Count of non-resolved contradictions linked to this programme. */
  activeContradictions: number;
  /** Count of escalated contradictions. */
  escalatedContradictions: number;
  /** Total evidence gaps across all patterns linked to this programme. */
  evidenceGapsTotal: number;
  /** Count of critical-urgency evidence gaps. */
  criticalGaps: number;
  /** Count of high-urgency evidence gaps. */
  highGaps: number;
  /** Current gate state from programme gate status. */
  gateStatus: ProgrammeGateState;
  /** Synthesized risk level derived from contradictions + gaps + gate. */
  riskLevel: ProgrammeRiskLevel;
  /** One-line risk summary for this programme. */
  riskSummary: string;
  /**
   * The single most important item blocking risk reduction,
   * or null if the programme is low-risk.
   */
  criticalPathItem: string | null;
  /** Labels of the top active contradictions linked to this programme. */
  topContradictions: string[];
  /** Labels of the top evidence gaps linked to this programme. */
  topGaps: string[];
}

export interface ProgrammeRiskMetrics {
  totalProgrammes: number;
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  blockedProgrammeCount: number;
  needsAttentionCount: number;
}

export interface ProgrammeRiskSummaryView {
  programmes: ProgrammeRiskSignal[];
  metrics: ProgrammeRiskMetrics;
  atlasSynthesis: string;
  criticalPath: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const PROGRAMME_RISK_DATA: ProgrammeRiskSignal[] = [
  {
    programmeId: 'APX-AMS-2026',
    programmeName: 'AMS Outsourcing 2026',
    programmeCode: 'APX-AMS-2026',
    currentPhase: 'Stage 7 BAFO',
    activeContradictions: 3,
    escalatedContradictions: 1,
    evidenceGapsTotal: 2,
    criticalGaps: 2,
    highGaps: 0,
    gateStatus: 'at_risk',
    riskLevel: 'critical',
    riskSummary: 'Vendor B SOC-2 hard gate escalated; Vendor C scope unconfirmed. BAFO close on May 5 is at risk without immediate resolution.',
    criticalPathItem: 'CON-AMS-001 Vendor B SOC-2 gap must be resolved or Vendor B disqualified before BAFO close',
    topContradictions: [
      'Vendor B SOC-2 gap vs. security tier requirement (escalated)',
      'Vendor C scope confirmation missing for BAFO comparison',
      'Vendor A cost allocation split requires finance sign-off',
    ],
    topGaps: [
      'Vendor B SOC-2 Type II audit evidence — missing, blocks vendor selection',
      'Vendor C scope confirmation — missing, blocks BAFO scoring',
    ],
  },
  {
    programmeId: 'APX-CDP-2026',
    programmeName: 'Customer Data Platform Activation',
    programmeCode: 'APX-CDP-2026',
    currentPhase: 'P3 Design',
    activeContradictions: 1,
    escalatedContradictions: 0,
    evidenceGapsTotal: 2,
    criticalGaps: 1,
    highGaps: 1,
    gateStatus: 'blocked',
    riskLevel: 'high',
    riskSummary: 'CDP P3 Design gate blocked until AMS vendor selection closes May 5. Integration scope cannot be defined until AMS is resolved.',
    criticalPathItem: 'CDP gate unblocks automatically when AMS BAFO closes — no independent action possible',
    topContradictions: [
      'CDP integration scope undefined while vendor selection pending',
    ],
    topGaps: [
      'CDP P3 Design gate specification — blocked by AMS vendor selection',
      'AI Exit Clause enforceability in AMS contract for CDP integration — high urgency',
    ],
  },
  {
    programmeId: 'APX-SA-2026',
    programmeName: 'Store Associate AI Productivity',
    programmeCode: 'APX-SA-2026',
    currentPhase: 'P2 Synthesis',
    activeContradictions: 1,
    escalatedContradictions: 0,
    evidenceGapsTotal: 1,
    criticalGaps: 0,
    highGaps: 1,
    gateStatus: 'at_risk',
    riskLevel: 'medium',
    riskSummary: 'P2 Synthesis gate (May 7) at risk — outcome capture mechanism and in-aisle latency budget are undefined. Product owner action needed by May 6.',
    criticalPathItem: 'Product owner must define outcome capture mechanism and latency budget before May 6 gate prep',
    topContradictions: [
      'Outcome capture mechanism undefined for in-aisle AI inference',
    ],
    topGaps: [
      'AI Tooling Commitment — in-aisle AI latency budget and rollout plan missing',
    ],
  },
  {
    programmeId: 'APX-DF-2026',
    programmeName: 'AI Demand Forecasting',
    programmeCode: 'APX-DF-2026',
    currentPhase: 'P2 Synthesis',
    activeContradictions: 1,
    escalatedContradictions: 0,
    evidenceGapsTotal: 1,
    criticalGaps: 0,
    highGaps: 0,
    gateStatus: 'pending',
    riskLevel: 'low',
    riskSummary: 'P2 Synthesis gate (May 14) on track. DF pipeline spec investigation is low-urgency and unlikely to block the gate.',
    criticalPathItem: null,
    topContradictions: [
      'Demand signal pipeline specification not yet scoped vs. CDP data layer (investigating)',
    ],
    topGaps: [
      'KTP Phase 2 knowledge transfer plan — medium urgency, May 14 gate',
    ],
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the programme risk summary view for Intelligence.
 *
 * Returns per-programme risk signals cross-referencing contradictions,
 * evidence gaps, and gate status for the Apex Retail engagement.
 *
 * Deterministic: derives from fixture data only.
 */
export function buildProgrammeRiskSummaryView(): ProgrammeRiskSummaryView {
  const criticalCount = PROGRAMME_RISK_DATA.filter((p) => p.riskLevel === 'critical').length;
  const highCount = PROGRAMME_RISK_DATA.filter((p) => p.riskLevel === 'high').length;
  const mediumCount = PROGRAMME_RISK_DATA.filter((p) => p.riskLevel === 'medium').length;
  const lowCount = PROGRAMME_RISK_DATA.filter((p) => p.riskLevel === 'low').length;
  const blockedCount = PROGRAMME_RISK_DATA.filter((p) => p.gateStatus === 'blocked').length;
  const needsAttention = PROGRAMME_RISK_DATA.filter(
    (p) => p.riskLevel === 'critical' || p.riskLevel === 'high' || p.gateStatus === 'blocked',
  ).length;

  return {
    programmes: PROGRAMME_RISK_DATA,
    metrics: {
      totalProgrammes: PROGRAMME_RISK_DATA.length,
      criticalRiskCount: criticalCount,
      highRiskCount: highCount,
      mediumRiskCount: mediumCount,
      lowRiskCount: lowCount,
      blockedProgrammeCount: blockedCount,
      needsAttentionCount: needsAttention,
    },
    atlasSynthesis:
      'APX-AMS-2026 drives the critical-path risk for the entire Apex AI portfolio — the 3 active ' +
      'contradictions including the escalated Vendor B SOC-2 gate must resolve before May 5 BAFO ' +
      'close. APX-CDP-2026 is blocked but passively: it unblocks automatically when AMS closes, ' +
      'with no independent actions possible. APX-SA-2026 has a product owner action needed by ' +
      'May 6 to avoid the May 7 gate slip. APX-DF-2026 is the only programme on track with no ' +
      'critical or high items.',
    criticalPath:
      'AMS BAFO close (May 5) → CDP P3 Design gate unblocks → SA P2 gate (May 7) → DF P2 gate (May 14)',
    honestDisclaimer:
      'Deterministic seed · Programme risk summary cross-references fixture contradiction, gap, and ' +
      'gate data for the Apex Retail engagement. Live risk scoring, real-time gate tracking, and ' +
      'evidence ingest are managed by the Sentinel reasoning runtime.',
    deterministicSeed: true,
  };
}
