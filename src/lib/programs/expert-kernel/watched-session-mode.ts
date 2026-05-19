// Moves Expert Kernel — watched-session mode.
//
// This is the first increment toward "expert consultant in the room." A
// watched session transcript is converted into proposed case updates, then a
// regeneration diff shows which artifacts must change before the business case
// can be promoted. It remains deterministic and honest: this module does not
// claim the case has regenerated; it states what must be regenerated.

import type { BusinessCaseSkeleton } from './business-case-compiler';
import type { ExpertReviewCaseId } from './expert-review-cases';
import type { ExpertReviewerRole } from './expert-review-calibration';
import type {
  ScenarioUpdateAssessment,
  ScenarioUpdateInput,
} from './scenario-updates';
import type { KernelArtifactId } from './exports/artifact-catalog';

export type WatchedSessionSignalKind =
  | 'baseline_fact'
  | 'assumption_challenge'
  | 'rate_card_override'
  | 'workshop_decision'
  | 'unmapped_observation';

export interface WatchedSessionSignal {
  id: string;
  kind: WatchedSessionSignalKind;
  key: string;
  label: string;
  quote: string;
  source: string;
  owner: string;
  value?: number | string;
  reviewerRole?: ExpertReviewerRole;
  requiredAction?: string;
}

export interface WatchedSessionTranscript {
  caseId: ExpertReviewCaseId;
  sessionId: string;
  sessionLabel: string;
  observedBy: string;
  observedAtLabel: string;
  participants: string[];
  signals: WatchedSessionSignal[];
}

export interface WatchedSessionExtraction {
  transcript: WatchedSessionTranscript;
  proposedUpdates: ScenarioUpdateInput[];
  unmappedSignals: WatchedSessionSignal[];
}

export type RegenerationArtifactId =
  | 'intelligence_idea'
  | KernelArtifactId;

export interface RegenerationDiffItem {
  updateKey: string;
  updateLabel: string;
  updateKind: ScenarioUpdateInput['kind'];
  beforeValue: number | string | null;
  afterValue: number | string | undefined;
  source: string;
  owner: string;
  affectedArtifacts: RegenerationArtifactId[];
  reason: string;
}

export interface RegenerationDiff {
  recommendationBefore: BusinessCaseSkeleton['recommendation'];
  recommendationAfter: 'requires_regeneration';
  acceptedChanges: RegenerationDiffItem[];
  rejectedChanges: Array<{
    updateKey: string;
    updateLabel: string;
    reason: string;
  }>;
  affectedArtifacts: RegenerationArtifactId[];
  auditSummary: string;
}

export function extractUpdatesFromWatchedSession(
  transcript: WatchedSessionTranscript,
): WatchedSessionExtraction {
  const proposedUpdates: ScenarioUpdateInput[] = transcript.signals.map((signal) => {
    switch (signal.kind) {
      case 'baseline_fact':
        return toUpdate(signal, 'baseline_metric');
      case 'assumption_challenge':
        return toUpdate(signal, 'assumption_review');
      case 'rate_card_override':
        return toUpdate(signal, 'rate_card_override');
      case 'workshop_decision':
        return toUpdate(signal, 'workshop_note');
      case 'unmapped_observation':
        // Deliberately route unmapped observations through the baseline lane so
        // the strict assessor rejects them unless the case explicitly knows the
        // key. This is the guard against "interesting note changed the case."
        return toUpdate(signal, 'baseline_metric');
      default: {
        const exhaustive: never = signal.kind;
        throw new Error(`Unknown watched-session signal: ${exhaustive}`);
      }
    }
  });

  return {
    transcript,
    proposedUpdates,
    unmappedSignals: transcript.signals.filter(
      (signal) => signal.kind === 'unmapped_observation',
    ),
  };
}

export function buildRegenerationDiff(
  skeleton: BusinessCaseSkeleton,
  assessment: ScenarioUpdateAssessment,
): RegenerationDiff {
  const acceptedChanges = assessment.accepted.map((update) => {
    const beforeMetric = skeleton.baseline.metrics.find((m) => m.key === update.key);
    return {
      updateKey: update.key,
      updateLabel: update.label,
      updateKind: update.kind,
      beforeValue: beforeMetric ? beforeMetric.value : null,
      afterValue: update.value,
      source: update.source,
      owner: update.owner,
      affectedArtifacts: affectedArtifactsForUpdate(skeleton, update),
      reason: regenerationReason(update),
    };
  });

  const affectedArtifacts = unique(
    acceptedChanges.flatMap((item) => item.affectedArtifacts),
  );

  return {
    recommendationBefore: skeleton.recommendation,
    recommendationAfter: 'requires_regeneration',
    acceptedChanges,
    rejectedChanges: assessment.rejected.map((item) => ({
      updateKey: item.input.key,
      updateLabel: item.input.label,
      reason: item.reason,
    })),
    affectedArtifacts,
    auditSummary:
      `${acceptedChanges.length} accepted change(s), ` +
      `${assessment.rejected.length} rejected change(s), ` +
      `${affectedArtifacts.length} affected artifact(s).`,
  };
}

export function buildDefaultWatchedSessionTranscript(
  caseId: ExpertReviewCaseId,
): WatchedSessionTranscript {
  switch (caseId) {
    case 'apexretail':
      return {
        caseId,
        sessionId: 'watched-apex-contact-center-001',
        sessionLabel: 'Apex Contact Center AI funding-shape workshop',
        observedBy: 'Moves Scenario Quality Lab',
        observedAtLabel: '2026-05-19 proxy watched session',
        participants: ['CIO', 'VP Customer Care', 'WFM Lead', 'Finance Partner'],
        signals: [
          baseline('cost_per_contact_usd', 'Cost per contact', 7.85, 'Brendan Fox'),
          baseline('contact_volume_annual', 'Annual contact volume', 18_400_000, 'James Wright'),
          assumption(
            'containment_uplift',
            'Containment uplift assumption',
            'Mariana Rojas',
            'Run a 2-week floor pilot before locking containment uplift.',
          ),
          decision(
            'manager_adoption',
            'Manager reinforcement risk',
            'WFM Lead',
            'Add manager coaching checkpoint to the 30-day plan.',
          ),
          unmapped('unmapped_sentiment_score', 'Unmapped sentiment score'),
        ],
      };
    case 'meridian':
      return {
        caseId,
        sessionId: 'watched-meridian-ambient-001',
        sessionLabel: 'Meridian ambient clinical value-chain workshop',
        observedBy: 'Moves Scenario Quality Lab',
        observedAtLabel: '2026-05-19 proxy watched session',
        participants: ['CDIO', 'CMIO', 'Finance Partner', 'Epic Platform Lead'],
        signals: [
          baseline('cost_per_clinician_hour_usd', 'Cost per clinician hour', 118, 'David Park'),
          baseline('raf_to_revenue_coefficient_usd', 'RAF to revenue coefficient', 9850, 'Thomas Hartwell'),
          assumption(
            'locum_avoidance',
            'Locum avoidance assumption',
            'Dr. Jennifer Wexler',
            'Separate physician-time recovery from locum avoidance.',
          ),
          decision(
            'ehr_governance',
            'Epic governance dependency',
            'Linda Howard',
            'Add Epic change-control dependency before mobilization.',
          ),
          unmapped('unmapped_physician_sentiment', 'Unmapped physician sentiment'),
        ],
      };
    case 'arcturus':
      return {
        caseId,
        sessionId: 'watched-firstcapital-fraud-001',
        sessionLabel: 'First Capital fraud detection funding-shape workshop',
        observedBy: 'Moves Scenario Quality Lab',
        observedAtLabel: '2026-05-19 proxy watched session',
        participants: ['CIO', 'Fraud Operations', 'Model Risk', 'Transformation Finance'],
        signals: [
          baseline('fraud_analyst_fte_cost_usd', 'Fraud analyst FTE cost', 154_000, 'Transformation Finance'),
          baseline('alert_volume_annual', 'Annual fraud alert volume', 420_000, 'Fraud Operations'),
          {
            ...baseline('fc_committed_budget', 'Committed FC-FRAUD-2026 budget', 1_800_000, 'Transformation Finance'),
            kind: 'rate_card_override',
            requiredAction:
              'Reconcile market-rate should-cost with committed internal budget.',
          },
          assumption(
            'false_positive_cost',
            'False-positive cost assumption',
            'Fraud Operations',
            'Quantify manual-review cost by segment before funding expansion.',
            'risk_compliance',
          ),
          unmapped('unmapped_branch_feedback', 'Unmapped branch feedback'),
        ],
      };
    default: {
      const exhaustive: never = caseId;
      throw new Error(`Unhandled case id: ${exhaustive}`);
    }
  }
}

function toUpdate(
  signal: WatchedSessionSignal,
  kind: ScenarioUpdateInput['kind'],
): ScenarioUpdateInput {
  return {
    kind,
    key: signal.key,
    label: signal.label,
    value: signal.value,
    source: `${signal.source}: "${signal.quote}"`,
    owner: signal.owner,
    reviewerRole: signal.reviewerRole,
    requiredAction: signal.requiredAction,
  };
}

function affectedArtifactsForUpdate(
  skeleton: BusinessCaseSkeleton,
  update: ScenarioUpdateInput,
): RegenerationArtifactId[] {
  if (update.kind === 'baseline_metric') {
    const handoffImpacted = skeleton.towerHandoff.some(
      (metric) => metric.metricKey === update.key,
    );
    return [
      'discover_brief',
      'charter_case',
      'business_case_pack',
      'financial_model',
      'cfo_pack',
      ...(handoffImpacted ? (['mobilize_pack'] as const) : []),
    ];
  }
  if (update.kind === 'assumption_review') {
    return ['charter_case', 'business_case_pack', 'financial_model', 'cfo_pack'];
  }
  if (update.kind === 'rate_card_override') {
    return ['business_case_pack', 'financial_model', 'cfo_pack'];
  }
  return ['mobilize_pack', 'cfo_pack'];
}

function regenerationReason(update: ScenarioUpdateInput): string {
  switch (update.kind) {
    case 'baseline_metric':
      return 'Baseline evidence changed; value, measurement, and downstream economics may move.';
    case 'assumption_review':
      return 'A named assumption was challenged; sensitivity and recommendation need review.';
    case 'rate_card_override':
      return 'Delivery economics changed; effort estimate and payback must be recalculated.';
    case 'workshop_note':
      return 'Workshop decision/action changed mobilization content.';
    default: {
      const exhaustive: never = update.kind;
      return exhaustive;
    }
  }
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function baseline(
  key: string,
  label: string,
  value: number,
  owner: string,
): WatchedSessionSignal {
  return {
    id: `sig-${key}`,
    kind: 'baseline_fact',
    key,
    label,
    value,
    quote: `${label} confirmed as ${value}.`,
    source: 'watched session',
    owner,
  };
}

function assumption(
  key: string,
  label: string,
  owner: string,
  requiredAction: string,
  reviewerRole: ExpertReviewerRole = 'domain_operator',
): WatchedSessionSignal {
  return {
    id: `sig-${key}`,
    kind: 'assumption_challenge',
    key,
    label,
    quote: `${label} requires validation before the funding gate.`,
    source: 'watched session',
    owner,
    reviewerRole,
    requiredAction,
  };
}

function decision(
  key: string,
  label: string,
  owner: string,
  requiredAction: string,
): WatchedSessionSignal {
  return {
    id: `sig-${key}`,
    kind: 'workshop_decision',
    key,
    label,
    quote: `${label} was accepted as an action item.`,
    source: 'watched session',
    owner,
    requiredAction,
  };
}

function unmapped(key: string, label: string): WatchedSessionSignal {
  return {
    id: `sig-${key}`,
    kind: 'unmapped_observation',
    key,
    label,
    value: 1,
    quote: `${label} surfaced but was not mapped to the case model.`,
    source: 'watched session',
    owner: 'Unknown',
  };
}
