// Tower-side display helper for the S9e Programs → Control Tower
// signal read model. S9f slice.
//
// Pure: imports the S9e helpers and produces a deterministic display
// shape the <ProgramPressureCards> component renders. This module
// does NOT re-derive signals from program seed data; the read model
// is the single source of truth (per the S9e contract).
//
// No model calls, no Date.now(), no mutation. Same tenant input →
// identical view object.

import {
  buildTenantProgramControlTowerSignals,
  summarizeProgramControlTowerSignals,
  type ProgramControlTowerSignal,
  type ProgramControlTowerSignalSummary,
} from '@/lib/programs/programs-control-tower-signals';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

export const TOWER_PROGRAM_PRESSURE_DEFAULT_TOP_N = 5;

export interface TowerProgramPressureView {
  tenant: TenantSeedPlan;
  signals: ReadonlyArray<ProgramControlTowerSignal>;
  summary: ProgramControlTowerSignalSummary;
  /** Top-N cards in canonical sort order (severity desc, type rank, id). */
  topCards: ReadonlyArray<ProgramControlTowerSignal>;
  /** Count of evidence_not_ready + value_not_ready signals. */
  evidenceValueGapCount: number;
  /** Human-friendly executive strip values. */
  strip: TowerProgramPressureStrip;
}

export interface TowerProgramPressureStrip {
  totalSignals: string;
  topSeverity: string;
  programsAffected: string;
  evidenceValueGaps: string;
}

/**
 * Build the deterministic view a Tower component renders. Pure.
 */
export function buildTowerProgramPressureView(
  tenant: TenantSeedPlan,
  topN: number = TOWER_PROGRAM_PRESSURE_DEFAULT_TOP_N,
): TowerProgramPressureView {
  const signals = buildTenantProgramControlTowerSignals(tenant);
  const summary = summarizeProgramControlTowerSignals(signals);
  const topCards = signals.slice(0, Math.max(0, Math.floor(topN)));
  const evidenceValueGapCount = signals.filter(
    (s) => s.type === 'evidence_not_ready' || s.type === 'value_not_ready',
  ).length;
  const strip: TowerProgramPressureStrip = {
    totalSignals: String(summary.totalCount),
    topSeverity: summary.topSeverity ? summary.topSeverity.toUpperCase() : 'NONE',
    programsAffected: String(summary.affectedProgramCodes.length),
    evidenceValueGaps: String(evidenceValueGapCount),
  };
  return { tenant, signals, summary, topCards, evidenceValueGapCount, strip };
}

// =====================================================================
// S9g · Atlas Executive Brief
// =====================================================================
//
// Pure deterministic helpers that compose an executive-tone brief
// from the S9e signal summary. The brief is what an Atlas-led Tower
// landing would say "at a glance" before the user scans the cards.
//
// No live Atlas runtime, no Claude / OpenAI invocation, no Date.now()
// reads. Same tenant + signal list → identical brief every time.

export type AtlasBriefSourceLabel =
  | 'deterministic_seed'
  | 'program_pressure_signals';

export type AtlasBriefConfidenceLabel =
  | 'high'
  | 'medium'
  | 'low'
  | 'no_signals';

export interface AtlasBriefFollowUp {
  id: string;
  label: string;
  /** Why this follow-up is suggested. */
  reason: string;
  /**
   * Whether this follow-up is wired today. False until a live Atlas
   * runtime subscriber lands; the renderer can show it as a disabled
   * affordance.
   */
  enabled: false;
}

export interface AtlasProgramPressureBrief {
  title: string;
  /**
   * Single sentence naming the most important pressure (top severity,
   * top type) — or stating the seed has no pressures.
   */
  topPressure: string;
  /** One sentence framing why the executive should care. */
  whyItMatters: string;
  /** Sentence summarizing how many programs the brief covers. */
  programsAffected: string;
  /**
   * Sentence calling out evidence + value readiness gaps when present.
   * Empty string when no such gaps were found in the signal list.
   */
  evidenceValueWarning: string;
  /** One executive-actionable next step the Tower can suggest today. */
  recommendedExecutiveAction: string;
  /**
   * Exactly three follow-up prompts / actions, deterministic and
   * disabled today (Ask-Atlas runtime is deferred).
   */
  suggestedFollowUps: ReadonlyArray<AtlasBriefFollowUp>;
  /**
   * Confidence label derived from the signal mix: how strongly the
   * brief stands today.
   */
  confidenceLabel: AtlasBriefConfidenceLabel;
  /** Single-line basis for the confidence label. */
  interpretationBasis: string;
  /** Marker so consumers know this is not a live-model output. */
  sourceLabel: AtlasBriefSourceLabel;
}

/**
 * Compose the Atlas brief. Pure: same inputs always yield identical
 * output. Reads only from the tenant identity and the S9e signal
 * summary; never re-derives from program seed data directly.
 */
export function buildAtlasProgramPressureBrief(
  tenant: TenantSeedPlan,
  signals: ReadonlyArray<ProgramControlTowerSignal>,
  summary: ProgramControlTowerSignalSummary,
): AtlasProgramPressureBrief {
  const evidenceValueGapCount = signals.filter(
    (s) => s.type === 'evidence_not_ready' || s.type === 'value_not_ready',
  ).length;

  const tenantName = tenant.displayName;
  const title = `${tenantName} · Atlas executive brief`;

  if (summary.totalCount === 0) {
    return composeEmptyBrief(tenantName, title);
  }

  const topPressure = buildAtlasPressureNarrative(signals, summary);
  const whyItMatters = composeWhyItMatters(summary);
  const programsAffected = composeProgramsAffected(summary);
  const evidenceValueWarning = composeEvidenceValueWarning(evidenceValueGapCount);
  const recommendedExecutiveAction = buildAtlasExecutiveAction(signals, summary);
  const suggestedFollowUps = composeFollowUps(signals, summary);
  const { confidenceLabel, interpretationBasis } = composeConfidence(summary);

  return {
    title,
    topPressure,
    whyItMatters,
    programsAffected,
    evidenceValueWarning,
    recommendedExecutiveAction,
    suggestedFollowUps,
    confidenceLabel,
    interpretationBasis,
    sourceLabel: 'program_pressure_signals',
  };
}

/**
 * Single-sentence narrative naming the top pressure. Pure.
 */
export function buildAtlasPressureNarrative(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
  summary: ProgramControlTowerSignalSummary,
): string {
  const top = signals[0]; // signals are pre-sorted severity-desc by S9e
  if (!top) {
    return 'No Programs pressure signals are present in the seed today.';
  }
  const severity = (summary.topSeverity ?? top.severity).toUpperCase();
  const typeLabel = humanizeType(top.type);
  return `${severity} pressure · ${top.programCode} · ${typeLabel}: ${top.title}.`;
}

/**
 * One executive-actionable next step. Pure.
 */
export function buildAtlasExecutiveAction(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
  summary: ProgramControlTowerSignalSummary,
): string {
  if (summary.totalCount === 0) {
    return 'No portfolio action required from this signal mix today.';
  }
  const top = signals[0];
  if (!top) {
    return 'Review the Program pressure cards below.';
  }
  // Prefer the top signal's own recommended action when its severity
  // is critical — that is the closest to "executive-actionable" today.
  if (top.severity === 'critical') {
    return `${top.programCode} · ${top.recommendedAction}`;
  }
  return `Review the top ${Math.min(3, signals.length)} pressure cards for ${top.programCode} and adjacent programs; ${top.recommendedAction.toLowerCase()}`;
}

// --- Internal composition helpers ------------------------------------

function composeEmptyBrief(
  tenantName: string,
  title: string,
): AtlasProgramPressureBrief {
  return {
    title,
    topPressure: 'No Programs pressure signals are present in the seed today.',
    whyItMatters:
      'A clean signal list does not necessarily mean the portfolio is healthy; the read model is seed-only and has not yet been populated with evidence or value capture.',
    programsAffected: `0 programs in ${tenantName} are emitting Programs pressure signals today.`,
    evidenceValueWarning: '',
    recommendedExecutiveAction:
      'No portfolio action required from this signal mix today.',
    suggestedFollowUps: composeEmptyFollowUps(),
    confidenceLabel: 'no_signals',
    interpretationBasis:
      'Signal list is empty; the read model is seed-only and has nothing to interpret.',
    sourceLabel: 'deterministic_seed',
  };
}

function composeWhyItMatters(
  summary: ProgramControlTowerSignalSummary,
): string {
  if (summary.bySeverity.critical > 0) {
    const word = summary.bySeverity.critical === 1 ? 'pressure' : 'pressures';
    return `${summary.bySeverity.critical} critical ${word} need executive attention before the next steering touchpoint.`;
  }
  if (summary.bySeverity.high > 0) {
    const word = summary.bySeverity.high === 1 ? 'pressure' : 'pressures';
    return `${summary.bySeverity.high} high-severity ${word} risk slipping into critical without intervention.`;
  }
  return 'Pressure mix is medium or lower today; the portfolio is in maintenance posture rather than active triage.';
}

function composeProgramsAffected(
  summary: ProgramControlTowerSignalSummary,
): string {
  const n = summary.affectedProgramCodes.length;
  if (n === 0) return 'No programs are emitting pressure signals today.';
  if (n === 1) {
    return `1 program is emitting pressure signals: ${summary.affectedProgramCodes[0]}.`;
  }
  const head = summary.affectedProgramCodes.slice(0, 3).join(', ');
  const tail = n > 3 ? `, plus ${n - 3} more` : '';
  return `${n} programs are emitting pressure signals: ${head}${tail}.`;
}

function composeEvidenceValueWarning(gapCount: number): string {
  if (gapCount === 0) return '';
  return `Evidence and value readiness gaps account for ${gapCount} of today's signals; until a future seed-population slice lands, dollar claims and gate-readiness should be treated as informational.`;
}

function composeFollowUps(
  signals: ReadonlyArray<ProgramControlTowerSignal>,
  summary: ProgramControlTowerSignalSummary,
): ReadonlyArray<AtlasBriefFollowUp> {
  const top = signals[0];
  // Three deterministic follow-ups, always in the same order.
  const followUps: AtlasBriefFollowUp[] = [
    {
      id: 'atlas-followup-walk-top-pressure',
      label: top
        ? `Walk me through ${top.programCode}'s top pressure`
        : 'Walk me through portfolio pressure',
      reason: top
        ? `Top signal · ${humanizeType(top.type)} on ${top.programCode}.`
        : 'No top signal in the seed today.',
      enabled: false,
    },
    {
      id: 'atlas-followup-evidence-value-gaps',
      label: 'Show me the evidence and value readiness gaps',
      reason:
        summary.byType.evidence_not_ready + summary.byType.value_not_ready > 0
          ? 'Evidence + value categories are still seed-only.'
          : 'No evidence or value gap signals in the current mix.',
      enabled: false,
    },
    {
      id: 'atlas-followup-portfolio-summary',
      label: 'Compose a steering-touchpoint summary',
      reason: 'Aggregates the signal mix into an executive headline.',
      enabled: false,
    },
  ];
  return followUps;
}

function composeEmptyFollowUps(): ReadonlyArray<AtlasBriefFollowUp> {
  return [
    {
      id: 'atlas-followup-walk-top-pressure',
      label: 'Walk me through portfolio pressure',
      reason: 'No top signal in the seed today.',
      enabled: false,
    },
    {
      id: 'atlas-followup-evidence-value-gaps',
      label: 'Show me the evidence and value readiness gaps',
      reason: 'Read model is seed-only; gaps will appear when seeded.',
      enabled: false,
    },
    {
      id: 'atlas-followup-portfolio-summary',
      label: 'Compose a steering-touchpoint summary',
      reason: 'Aggregates the signal mix into an executive headline.',
      enabled: false,
    },
  ];
}

function composeConfidence(
  summary: ProgramControlTowerSignalSummary,
): { confidenceLabel: AtlasBriefConfidenceLabel; interpretationBasis: string } {
  if (summary.totalCount === 0) {
    return {
      confidenceLabel: 'no_signals',
      interpretationBasis:
        'Signal list is empty; the read model is seed-only and has nothing to interpret.',
    };
  }
  // Confidence reflects how strongly the brief stands. Today every
  // signal is seed-only, so no path can climb to "high"; the cap is
  // "medium" until evidence and value are seeded.
  if (summary.bySeverity.critical >= 1) {
    return {
      confidenceLabel: 'medium',
      interpretationBasis:
        'Multiple critical signals from seed-only readiness; live Atlas subscriber would refine this.',
    };
  }
  if (summary.bySeverity.high >= 1) {
    return {
      confidenceLabel: 'medium',
      interpretationBasis:
        'High-severity signals derived from seed-only readiness; live Atlas subscriber would refine this.',
    };
  }
  return {
    confidenceLabel: 'low',
    interpretationBasis:
      'Mostly medium / low signals from seed-only readiness; brief is informational.',
  };
}

function humanizeType(type: ProgramControlTowerSignal['type']): string {
  switch (type) {
    case 'gate_missing_inputs':
      return 'gate inputs';
    case 'evidence_not_ready':
      return 'evidence readiness';
    case 'value_not_ready':
      return 'value readiness';
    case 'deliverable_coverage_gap':
      return 'deliverable coverage';
    case 'context_insufficient':
      return 'context bundle';
    case 'executive_decision_needed':
      return 'executive decision';
  }
}
