// INT7 · Engagement Intelligence Scorecard view-model.
//
// Pure deterministic helper — returns a per-programme traffic-light scorecard
// for the Apex Retail engagement, aggregating pattern application status,
// evidence confidence, contradiction counts, and gate state into a single
// executive-ready signal per programme plus an engagement-level summary.
//
// No model calls, no fetch, no Date.now / Math.random / new Date,
// no live data. Same input → identical output.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ScorecardSignal = 'green' | 'amber' | 'red';

export type PatternApplicationStatus = 'strong' | 'partial' | 'building';

export type EvidenceConfidenceLevel = 'high' | 'medium' | 'low';

export type ScorecardGateStatus = 'clear' | 'at_risk' | 'blocked';

export interface ProgrammeScorecardRow {
  programmeId: string;
  programmeCode: string;
  programmeName: string;
  /** Rollup traffic-light signal for this programme */
  overallSignal: ScorecardSignal;
  /** One-sentence Sentinel assessment */
  sentinelOneLiner: string;
  // Pattern dimension
  patternApplicationStatus: PatternApplicationStatus;
  activePatternsCount: number;
  // Evidence dimension
  evidenceConfidence: EvidenceConfidenceLevel;
  criticalGapsCount: number;
  // Contradiction dimension
  activeContradictions: number;
  escalatedContradictions: number;
  // Gate dimension
  gateStatus: ScorecardGateStatus;
  nextGate: string;
}

export interface ScorecardEngagementSummary {
  /** Highest-severity signal across all programmes */
  overallEngagementSignal: ScorecardSignal;
  /** Count of programmes with overallSignal !== 'green' */
  programmesNeedingAttention: number;
  /** Sum of escalated contradictions + critical gaps across all programmes */
  totalCriticalItems: number;
  /** Number of gate-blocked programmes */
  gateBlockedCount: number;
  /** One-paragraph executive summary */
  sentinelExecutiveSummary: string;
}

export interface EngagementScorecardView {
  programmes: ProgrammeScorecardRow[];
  engagementSummary: ScorecardEngagementSummary;
  atlasSynthesis: string;
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — Apex Retail four AI programmes
// ─────────────────────────────────────────────────────────────────────────────

const SCORECARD_DATA: ReadonlyArray<ProgrammeScorecardRow> = [
  {
    programmeId: 'APX-AMS-2026',
    programmeCode: 'APX-AMS',
    programmeName: 'Contact Center AI — Advanced Model Suite',
    overallSignal: 'red',
    sentinelOneLiner:
      'Escalated contradiction on model SLA vs call volume blocks architecture gate; three active contradictions require resolution before programme can advance',
    patternApplicationStatus: 'partial',
    activePatternsCount: 1,
    evidenceConfidence: 'medium',
    criticalGapsCount: 2,
    activeContradictions: 3,
    escalatedContradictions: 1,
    gateStatus: 'blocked',
    nextGate: 'Architecture Sign-off',
  },
  {
    programmeId: 'APX-CDP-2026',
    programmeCode: 'APX-CDP',
    programmeName: 'Customer Data Platform',
    overallSignal: 'red',
    sentinelOneLiner:
      'Data residency contradiction and incomplete GDPR review block data architecture approval; pattern application cannot advance until both resolved',
    patternApplicationStatus: 'building',
    activePatternsCount: 1,
    evidenceConfidence: 'low',
    criticalGapsCount: 1,
    activeContradictions: 1,
    escalatedContradictions: 0,
    gateStatus: 'blocked',
    nextGate: 'Data Architecture Approval',
  },
  {
    programmeId: 'APX-SA-2026',
    programmeCode: 'APX-SA',
    programmeName: 'Store Associate Productivity',
    overallSignal: 'amber',
    sentinelOneLiner:
      'KPI baseline contradiction and missing second pilot store put pilot go/no-go at risk; resolvable before gate if stakeholder actions are taken this week',
    patternApplicationStatus: 'partial',
    activePatternsCount: 1,
    evidenceConfidence: 'medium',
    criticalGapsCount: 0,
    activeContradictions: 1,
    escalatedContradictions: 0,
    gateStatus: 'at_risk',
    nextGate: 'Pilot Go/No-Go',
  },
  {
    programmeId: 'APX-DF-2026',
    programmeCode: 'APX-DF',
    programmeName: 'Demand Forecasting',
    overallSignal: 'green',
    sentinelOneLiner:
      'Clean pattern application, strong evidence base, and clear gate path — model selection can proceed on schedule',
    patternApplicationStatus: 'strong',
    activePatternsCount: 1,
    evidenceConfidence: 'high',
    criticalGapsCount: 0,
    activeContradictions: 0,
    escalatedContradictions: 0,
    gateStatus: 'clear',
    nextGate: 'Model Selection',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the EngagementScorecardView — fully deterministic, no runtime data.
 */
export function buildEngagementScorecardView(): EngagementScorecardView {
  const programmes = [...SCORECARD_DATA];

  // Derive engagement summary from programme rows
  let programmesNeedingAttention = 0;
  let totalCriticalItems = 0;
  let gateBlockedCount = 0;
  let hasRed = false;
  let hasAmber = false;

  for (const prog of programmes) {
    if (prog.overallSignal !== 'green') programmesNeedingAttention++;
    if (prog.overallSignal === 'red')   hasRed = true;
    if (prog.overallSignal === 'amber') hasAmber = true;
    totalCriticalItems += prog.escalatedContradictions + prog.criticalGapsCount;
    if (prog.gateStatus === 'blocked')  gateBlockedCount++;
  }

  const overallEngagementSignal: ScorecardSignal = hasRed
    ? 'red'
    : hasAmber
      ? 'amber'
      : 'green';

  const engagementSummary: ScorecardEngagementSummary = {
    overallEngagementSignal,
    programmesNeedingAttention,
    totalCriticalItems,
    gateBlockedCount,
    sentinelExecutiveSummary:
      'The Apex Retail engagement is under pressure across three of four AI programmes. ' +
      'Contact Center AI and Customer Data Platform are gate-blocked — both by active contradictions ' +
      'that have been escalating without resolution for multiple periods. ' +
      'Store Associate Productivity has a clear resolution path if stakeholder actions land this week. ' +
      'Demand Forecasting remains the engagement stability anchor with a clean gate path and strong evidence base. ' +
      'The engagement critical path runs through AMS contradiction resolution, which must be addressed before ' +
      'either AMS or CDP gates can advance.',
  };

  return {
    programmes,
    engagementSummary,
    atlasSynthesis:
      'Scorecard synthesises contradiction monitor, evidence gap queue, gate readiness, and pattern plan signals ' +
      'into a single per-programme view. Two programmes (AMS, CDP) require immediate contradiction resolution; ' +
      'one (SA) requires stakeholder actions within the next two weeks. ' +
      'The engagement cannot reach a majority-green posture until the AMS escalated contradiction is resolved, ' +
      'as it is the root cause of the most significant gate blocks and evidence deferrals.',
    deterministicSeed: true,
  };
}
