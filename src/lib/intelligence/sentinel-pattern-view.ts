// I2 · Sentinel Intelligence view helper.
//
// Pure deterministic display layer over the I1 Sentinel pattern
// detection read model. Renders into a brief + active-patterns view
// that the tenant Intelligence page consumes.
//
// No live Sentinel runtime, no Claude / OpenAI invocation, no
// Date.now() reads, no random IDs. Same tenant input → identical
// view object.
//
// Layered exclusively on top of I1:
//   - buildSentinelPatternDetectionsForTenant(tenant)
//   - summarizeSentinelPatternDetections(detections)
//   - SentinelPatternDetection / SentinelPatternDetectionSummary
//
// This module does NOT import:
//   - src/lib/sentinel/**
//   - src/lib/atlas/**
//   - src/lib/nexus/**
//   - src/lib/agent/**
//   - src/components/agent/**
//   - src/lib/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import {
  buildSentinelPatternDetectionsForTenant,
  summarizeSentinelPatternDetections,
  type SentinelDetectionConfidence,
  type SentinelPatternDetection,
  type SentinelPatternDetectionSummary,
  type SentinelPatternHandoffTarget,
  type SentinelPatternSeverity,
} from '@/lib/intelligence/sentinel-pattern-detections';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type SentinelBriefSourceLabel =
  | 'deterministic_seed'
  | 'pattern_detection_read_model';

export interface SentinelBriefFollowUp {
  id: string;
  label: string;
  /** Why this follow-up is suggested. */
  reason: string;
  /**
   * Whether this follow-up is wired today. False until a live
   * Sentinel runtime subscriber lands.
   */
  enabled: false;
}

export interface SentinelBrief {
  title: string;
  /** Pattern name of the top detection, or an absence sentence. */
  topPattern: string;
  /** Uppercase severity of the top detection, or 'NONE'. */
  topSeverity: string;
  /** Uppercase confidence of the top detection, or 'NONE'. */
  topConfidence: string;
  /** Single sentence framing what Sentinel currently observes. */
  whatSentinelSees: string;
  /** One sentence framing why the executive should care. */
  whyItMatters: string;
  /** Sentence summarizing how many programs the brief covers. */
  affectedPrograms: string;
  /** One actionable next step the brief recommends today. */
  recommendedAction: string;
  /** Suggested handoff targets pulled from the top detection. */
  suggestedHandoffs: ReadonlyArray<SentinelPatternHandoffTarget>;
  /**
   * Exactly three follow-up prompts / actions, deterministic and
   * disabled today (live Sentinel runtime is deferred).
   */
  suggestedFollowUps: ReadonlyArray<SentinelBriefFollowUp>;
  /** Marker so consumers know this is not a live-model output. */
  sourceLabel: SentinelBriefSourceLabel;
  /** Single-line basis for the brief's confidence/severity claim. */
  interpretationBasis: string;
}

export interface SentinelPatternCard {
  detection: SentinelPatternDetection;
  severityLabel: string;
  confidenceLabel: string;
  sourceSignalCount: number;
  affectedProgramCount: number;
}

export interface SentinelIntelligenceView {
  tenant: TenantSeedPlan;
  detections: ReadonlyArray<SentinelPatternDetection>;
  summary: SentinelPatternDetectionSummary;
  brief: SentinelBrief;
  cards: ReadonlyArray<SentinelPatternCard>;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic Intelligence view for a tenant. Pure: same
 * tenant input → identical view object.
 */
export function buildSentinelIntelligenceView(
  tenant: TenantSeedPlan,
): SentinelIntelligenceView {
  const detections = buildSentinelPatternDetectionsForTenant(tenant);
  const summary = summarizeSentinelPatternDetections(detections);
  const brief = buildSentinelBrief(tenant, detections, summary);
  const cards = buildPatternDetectionCards(detections);
  return { tenant, detections, summary, brief, cards };
}

/**
 * Compose the Sentinel brief from a tenant + I1 detection list +
 * summary. Pure: same inputs → identical brief.
 */
export function buildSentinelBrief(
  tenant: TenantSeedPlan,
  detections: ReadonlyArray<SentinelPatternDetection>,
  summary: SentinelPatternDetectionSummary,
): SentinelBrief {
  const tenantName = tenant.displayName;
  const title = `${tenantName} · Sentinel intelligence brief`;

  if (detections.length === 0) {
    return composeEmptyBrief(tenantName, title);
  }

  const top = detections[0]; // sorted severity desc / confidence desc
  const topPattern = top.patternName;
  const topSeverity = (summary.topSeverity ?? top.severity).toUpperCase();
  const topConfidence = (summary.topConfidence ?? top.confidence).toUpperCase();

  const whatSentinelSees = composeWhatSentinelSees(detections, summary);
  const whyItMatters = top.whyItMatters;
  const affectedPrograms = composeAffectedPrograms(summary);
  const recommendedAction = composeRecommendedAction(top);
  const suggestedHandoffs = top.handoffTargets;
  const suggestedFollowUps = composeFollowUps(top, summary);
  const interpretationBasis = composeInterpretationBasis(top, summary);

  return {
    title,
    topPattern,
    topSeverity,
    topConfidence,
    whatSentinelSees,
    whyItMatters,
    affectedPrograms,
    recommendedAction,
    suggestedHandoffs,
    suggestedFollowUps,
    sourceLabel: 'pattern_detection_read_model',
    interpretationBasis,
  };
}

/**
 * Project I1 detections into a renderable card view. Pure.
 */
export function buildPatternDetectionCards(
  detections: ReadonlyArray<SentinelPatternDetection>,
): ReadonlyArray<SentinelPatternCard> {
  return detections.map((det) => ({
    detection: det,
    severityLabel: humanizeSeverity(det.severity),
    confidenceLabel: humanizeConfidence(det.confidence),
    sourceSignalCount: det.sourceSignalIds.length,
    affectedProgramCount: det.affectedPrograms.length,
  }));
}

// ---------------------------------------------------------------------
// Internal composition helpers
// ---------------------------------------------------------------------

function composeEmptyBrief(tenantName: string, title: string): SentinelBrief {
  return {
    title,
    topPattern: 'No active pattern detections',
    topSeverity: 'NONE',
    topConfidence: 'NONE',
    whatSentinelSees:
      'Sentinel is not surfacing any active pattern detections from the seed today.',
    whyItMatters:
      'A clean detection list does not necessarily mean the portfolio is healthy; the read model is seed-only and has not yet been populated with evidence or value capture.',
    affectedPrograms: `0 programs in ${tenantName} are emitting detectable patterns today.`,
    recommendedAction:
      'No pattern-level action required today. Once seed-population lands, evidence and value gaps will surface here automatically.',
    suggestedHandoffs: [],
    suggestedFollowUps: composeEmptyFollowUps(),
    sourceLabel: 'deterministic_seed',
    interpretationBasis:
      'Detection list is empty; the read model is seed-only and has nothing to interpret.',
  };
}

function composeWhatSentinelSees(
  detections: ReadonlyArray<SentinelPatternDetection>,
  summary: SentinelPatternDetectionSummary,
): string {
  const programWord = summary.affectedProgramCodes.length === 1 ? 'program' : 'programs';
  const detectionWord = detections.length === 1 ? 'pattern' : 'patterns';
  return `Sentinel is observing ${detections.length} active ${detectionWord} across ${summary.affectedProgramCodes.length} ${programWord}.`;
}

function composeAffectedPrograms(
  summary: SentinelPatternDetectionSummary,
): string {
  const n = summary.affectedProgramCodes.length;
  if (n === 0) return 'No programs are involved in active patterns today.';
  if (n === 1) {
    return `1 program is involved in active patterns: ${summary.affectedProgramCodes[0]}.`;
  }
  const head = summary.affectedProgramCodes.slice(0, 3).join(', ');
  const tail = n > 3 ? `, plus ${n - 3} more` : '';
  return `${n} programs are involved in active patterns: ${head}${tail}.`;
}

function composeRecommendedAction(top: SentinelPatternDetection): string {
  const handoffPhrase = composeHandoffPhrase(top.handoffTargets);
  if (handoffPhrase) {
    return `${top.recommendedAction} ${handoffPhrase}`;
  }
  return top.recommendedAction;
}

function composeHandoffPhrase(
  handoffs: ReadonlyArray<SentinelPatternHandoffTarget>,
): string {
  if (handoffs.length === 0) return '';
  if (handoffs.length === 1) {
    return `Suggested handoff: ${handoffs[0]}.`;
  }
  const named = handoffs.slice(0, -1).join(', ');
  const last = handoffs[handoffs.length - 1];
  return `Suggested handoffs: ${named}, and ${last}.`;
}

function composeFollowUps(
  top: SentinelPatternDetection,
  summary: SentinelPatternDetectionSummary,
): ReadonlyArray<SentinelBriefFollowUp> {
  const followUps: SentinelBriefFollowUp[] = [
    {
      id: 'sentinel-followup-walk-top-pattern',
      label: `Walk me through ${top.patternName.toLowerCase()}`,
      reason: `Top pattern · ${top.severity} severity · ${top.confidence} confidence on ${top.tenantName}.`,
      enabled: false,
    },
    {
      id: 'sentinel-followup-program-cross-section',
      label: 'Show me how this pattern manifests across the affected programs',
      reason:
        summary.affectedProgramCodes.length > 1
          ? `Pattern spans ${summary.affectedProgramCodes.length} programs.`
          : 'Pattern is currently scoped to a single program.',
      enabled: false,
    },
    {
      id: 'sentinel-followup-recurrence-history',
      label: 'Show recurrence history',
      reason:
        'Sentinel persistence + recurrence tracking is deferred to a future slice.',
      enabled: false,
    },
  ];
  return followUps;
}

function composeEmptyFollowUps(): ReadonlyArray<SentinelBriefFollowUp> {
  return [
    {
      id: 'sentinel-followup-walk-top-pattern',
      label: 'Walk me through any active patterns',
      reason: 'No active patterns detected from the seed today.',
      enabled: false,
    },
    {
      id: 'sentinel-followup-program-cross-section',
      label: 'Show me how patterns manifest across affected programs',
      reason: 'No affected programs in the current detection mix.',
      enabled: false,
    },
    {
      id: 'sentinel-followup-recurrence-history',
      label: 'Show recurrence history',
      reason:
        'Sentinel persistence + recurrence tracking is deferred to a future slice.',
      enabled: false,
    },
  ];
}

function composeInterpretationBasis(
  top: SentinelPatternDetection,
  summary: SentinelPatternDetectionSummary,
): string {
  const programs = summary.affectedProgramCodes.length;
  if (top.confidence === 'high' && programs >= 3) {
    return `Cross-program scope (${programs} programs) lifted confidence to high; live Sentinel persistence would refine this with recurrence history.`;
  }
  if (top.confidence === 'medium') {
    return `${programs} program(s) involved; live Sentinel runtime would refine this with retrieval-backed evidence.`;
  }
  return 'Single-program detection from seed-only readiness; live Sentinel runtime would refine this with retrieval and recurrence.';
}

function humanizeSeverity(severity: SentinelPatternSeverity): string {
  switch (severity) {
    case 'critical':
      return 'CRITICAL';
    case 'high':
      return 'HIGH';
    case 'medium':
      return 'MEDIUM';
    case 'low':
      return 'LOW';
  }
}

function humanizeConfidence(confidence: SentinelDetectionConfidence): string {
  switch (confidence) {
    case 'high':
      return 'HIGH';
    case 'medium':
      return 'MEDIUM';
    case 'low':
      return 'LOW';
  }
}
