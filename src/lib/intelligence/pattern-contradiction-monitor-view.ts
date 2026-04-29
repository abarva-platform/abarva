// pattern-contradiction-monitor-view.ts — INT4
//
// Deterministic view model for the Pattern Contradiction Monitor lens in the
// Intelligence surface. Surfaces active contradictions per-pattern for the
// Apex Retail engagement, showing resolution status, severity, and which
// patterns are most at risk.
//
// Answers: "For each active Sentinel pattern, what contradictions have been
// detected and what is their current resolution status?"
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/source/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ──────────────────────────────────────────────────────────────

export type ContradictionResolutionStatus =
  | 'open'
  | 'investigating'
  | 'escalated'
  | 'resolved';

export type ContradictionSeverityLevel = 'low' | 'medium' | 'high';

export interface PatternContradictionItem {
  contradictionId: string;
  /** Short label. */
  label: string;
  severity: ContradictionSeverityLevel;
  status: ContradictionResolutionStatus;
  /** Which gate or deliverable this blocks (if any). */
  blockedItem: string | null;
  /** Suggested resolution path. */
  resolutionPath: string | null;
}

export interface PatternContradictionSummary {
  patternId: string;
  patternTitle: string;
  /** Short human-readable pattern type label. */
  patternType: string;
  activeContradictions: number;
  resolvedContradictions: number;
  highSeverityCount: number;
  escalatedCount: number;
  overallStatus: 'clean' | 'monitoring' | 'at_risk' | 'critical';
  contradictions: PatternContradictionItem[];
}

export interface ContradictionMonitorSummary {
  totalPatterns: number;
  patternsWithActiveContradictions: number;
  totalActiveContradictions: number;
  highSeverityContradictions: number;
  escalatedContradictions: number;
}

export interface PatternContradictionMonitorView {
  patterns: PatternContradictionSummary[];
  summary: ContradictionMonitorSummary;
  atlasSynthesis: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const PATTERN_CONTRADICTION_DATA: PatternContradictionSummary[] = [
  {
    patternId: 'PAT-SRC-AMS-001',
    patternTitle: 'AMS Outsourcing 2026 — Vendor Evaluation',
    patternType: 'Source Commercial',
    activeContradictions: 3,
    resolvedContradictions: 0,
    highSeverityCount: 2,
    escalatedCount: 1,
    overallStatus: 'critical',
    contradictions: [
      {
        contradictionId: 'CON-AMS-001',
        label: 'Vendor B SOC-2 gap vs. security tier requirement',
        severity: 'high',
        status: 'escalated',
        blockedItem: 'BAFO close / vendor selection (May 5)',
        resolutionPath: 'Vendor B must provide SOC-2 Type II audit evidence or be disqualified — no waiver path available at current security tier',
      },
      {
        contradictionId: 'CON-AMS-002',
        label: 'Vendor C scope confirmation missing for BAFO comparison',
        severity: 'high',
        status: 'open',
        blockedItem: 'BAFO close / vendor selection (May 5)',
        resolutionPath: 'Sourcing team to obtain Vendor C scope confirmation by May 3 to allow BAFO scoring to complete',
      },
      {
        contradictionId: 'CON-AMS-003',
        label: 'Vendor A cost allocation split requires finance sign-off',
        severity: 'medium',
        status: 'investigating',
        blockedItem: null,
        resolutionPath: 'Finance team to confirm OPEX/CAPEX split treatment for Vendor A managed service fee',
      },
    ],
  },
  {
    patternId: 'PAT-PRG-CDP-001',
    patternTitle: 'Customer Data Platform Activation — P3 Design',
    patternType: 'Programme Gate',
    activeContradictions: 1,
    resolvedContradictions: 0,
    highSeverityCount: 1,
    escalatedCount: 0,
    overallStatus: 'at_risk',
    contradictions: [
      {
        contradictionId: 'CON-CDP-001',
        label: 'CDP integration scope undefined while vendor selection pending',
        severity: 'high',
        status: 'open',
        blockedItem: 'CDP P3 Design gate (post-May 5)',
        resolutionPath: 'CDP gate cannot be entered until AMS vendor is selected — no action possible until AMS BAFO closes',
      },
    ],
  },
  {
    patternId: 'PAT-PRG-SA-001',
    patternTitle: 'Store Associate AI Productivity — P2 Synthesis',
    patternType: 'Programme Gate',
    activeContradictions: 1,
    resolvedContradictions: 0,
    highSeverityCount: 0,
    escalatedCount: 0,
    overallStatus: 'monitoring',
    contradictions: [
      {
        contradictionId: 'CON-SA-001',
        label: 'Outcome capture mechanism undefined for in-aisle AI inference',
        severity: 'medium',
        status: 'open',
        blockedItem: 'SA P2 Synthesis gate (May 7)',
        resolutionPath: 'Product owner to define outcome capture mechanism and in-aisle latency budget before May 6 gate prep',
      },
    ],
  },
  {
    patternId: 'PAT-PRG-DF-001',
    patternTitle: 'AI Demand Forecasting — P2 Synthesis',
    patternType: 'Programme Gate',
    activeContradictions: 1,
    resolvedContradictions: 1,
    highSeverityCount: 0,
    escalatedCount: 0,
    overallStatus: 'monitoring',
    contradictions: [
      {
        contradictionId: 'CON-DF-001',
        label: 'Demand signal pipeline specification not yet scoped vs. CDP data layer',
        severity: 'medium',
        status: 'investigating',
        blockedItem: null,
        resolutionPath: 'DF team to confirm pipeline spec does not conflict with CDP data layer — low urgency given May 14 gate',
      },
    ],
  },
  {
    patternId: 'PAT-GOV-001',
    patternTitle: 'AI Governance Baseline — Apex Retail',
    patternType: 'Governance',
    activeContradictions: 0,
    resolvedContradictions: 2,
    highSeverityCount: 0,
    escalatedCount: 0,
    overallStatus: 'clean',
    contradictions: [],
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the pattern contradiction monitor view for Intelligence.
 *
 * Returns per-pattern contradiction summaries for the Apex Retail engagement,
 * with an Intelligence-level synthesis.
 *
 * Deterministic: derives from fixture data only.
 */
export function buildPatternContradictionMonitorView(): PatternContradictionMonitorView {
  const allActive = PATTERN_CONTRADICTION_DATA.flatMap((p) =>
    p.contradictions.filter((c) => c.status !== 'resolved'),
  );
  const escalated = allActive.filter((c) => c.status === 'escalated');
  const highSev = allActive.filter((c) => c.severity === 'high');
  const patternsWithActive = PATTERN_CONTRADICTION_DATA.filter(
    (p) => p.activeContradictions > 0,
  ).length;

  return {
    patterns: PATTERN_CONTRADICTION_DATA,
    summary: {
      totalPatterns: PATTERN_CONTRADICTION_DATA.length,
      patternsWithActiveContradictions: patternsWithActive,
      totalActiveContradictions: allActive.length,
      highSeverityContradictions: highSev.length,
      escalatedContradictions: escalated.length,
    },
    atlasSynthesis:
      'The AMS vendor evaluation pattern (PAT-SRC-AMS-001) is the most critical, with 3 active ' +
      'contradictions including 1 escalated hard gate (Vendor B SOC-2). The CDP and SA programme ' +
      'gate patterns each carry 1 high/medium contradiction that becomes unblockable only after ' +
      'the AMS gate closes on May 5. The DF pattern and the Governance baseline are clean or ' +
      'in low-urgency investigation. Resolving CON-AMS-001 and CON-AMS-002 is the critical path.',
    honestDisclaimer:
      'Deterministic seed · Contradiction monitor reflects fixture pattern data for the Apex Retail ' +
      'engagement. Live contradiction detection and resolution tracking are managed by the Sentinel ' +
      'reasoning runtime.',
    deterministicSeed: true,
  };
}
