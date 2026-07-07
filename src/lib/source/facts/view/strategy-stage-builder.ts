// ─────────────────────────────────────────────────────────────────────────────
// Compose the STRATEGY (P0) StageAnalyticsView from an event's captured intake.
//
// Strategy is the intake/mandate-confirmation stage on the redesigned canvas, and
// its gate IS the P0 approval. This builder turns the event's persisted intake
// (sponsor / mandate / value thesis, drawn from the SAME fields the standalone
// `/source/events/[eventId]/approval` page reads) into the Strategy view, and —
// when the event is genuinely sitting in the strategy stage — attaches the LIVE
// approve `action` so the canvas gate reuses the real approval backend
// (`POST /api/v1/source/events/[eventId]/approve`) rather than forking persistence.
//
// This is deliberately NOT a value-waterfall stage: the value thesis at P0 is a
// captured intake fact, not a computed proof, so we never dress it as a waterfall.
// ─────────────────────────────────────────────────────────────────────────────

import type { SourceEventRow } from '@/lib/source/queries';
import { parseSourceScopeDescription } from '@/lib/source/intake-summary';
import { formatSourceFinancialValue } from '@/lib/source/financial-display';
import { REQUIRED_APPROVAL_CONFIRMATIONS } from '@/lib/source/approval-decision';
import type {
  StageAnalyticsView,
  StageGateActionView,
  TaskReviewRowView,
} from '@/components/source/canvas/analytics/view-model';

/** The three plain-English facts the Strategy confirm table reviews. */
export interface StrategyIntakeFacts {
  sponsor: string;
  mandate: string;
  valueThesis: string;
}

/**
 * Derive the sponsor / mandate / value-thesis facts from a persisted event row.
 * Mirrors `buildCapturedFacts` on the standalone approval page so the in-canvas
 * Strategy stage reads the exact same intake, not a parallel source of truth.
 */
export function deriveStrategyIntakeFacts(
  row: Pick<
    SourceEventRow,
    | 'decision_owner'
    | 'trigger_description'
    | 'scope_description'
    | 'estimated_value_usd'
  >,
): StrategyIntakeFacts {
  const scopeSummary = parseSourceScopeDescription(row.scope_description);
  const trigger = row.trigger_description?.trim();
  const boundary = scopeSummary.scopeBoundary?.trim();
  const mandate =
    trigger && boundary
      ? `${trigger} — boundary: ${boundary}`
      : trigger ?? boundary ?? 'Mandate not captured yet.';
  const valueThesis =
    scopeSummary.valueTarget?.trim() ??
    (row.estimated_value_usd && row.estimated_value_usd > 0
      ? formatSourceFinancialValue(row.estimated_value_usd, true)
      : 'Value target pending.');
  return {
    sponsor: row.decision_owner?.trim() || 'Decision owner pending.',
    mandate,
    valueThesis,
  };
}

export interface BuildStrategyStageInput {
  /** The sponsor / mandate / value-thesis facts (fact-driven when present). */
  facts: StrategyIntakeFacts;
  /**
   * When the facts are demonstrably real (derived from a persisted intake), pass
   * 'live' so the intel + confirm rows drop the sample honesty note. When they
   * are placeholders, pass 'sample'.
   */
  provenance: 'live' | 'sample';
  /**
   * When present, the gate becomes the LIVE P0 approval: its Approve button POSTs
   * to the existing approve route for this event. Only attach this when the event
   * is genuinely in the strategy stage and the user can approve.
   */
  approve?: {
    eventId: string;
    /** Where to land after approval (the stage the event advances to). */
    redirectStageKey?: string | null;
  } | null;
}

/**
 * Build the Strategy (P0) StageAnalyticsView from captured intake. Never returns
 * null — Strategy always renders (it is the confirm-the-mandate stage); the
 * caller decides live vs. sample provenance from the fact quality.
 */
export function buildStrategyStageView(
  input: BuildStrategyStageInput,
): StageAnalyticsView {
  const isLive = input.provenance === 'live';

  const rows: TaskReviewRowView[] = [
    { key: 'Sponsor', value: input.facts.sponsor },
    { key: 'Mandate', value: input.facts.mandate },
    { key: 'Value thesis', value: input.facts.valueThesis },
  ];

  const action: StageGateActionView | undefined = input.approve
    ? {
        eventId: input.approve.eventId,
        rationale:
          'Strategy gate confirmed on the unified canvas — sponsor sign-off, value target set, archetype confirmed.',
        confirmationKeys: [...REQUIRED_APPROVAL_CONFIRMATIONS],
        redirectStageKey: input.approve.redirectStageKey ?? 'scope',
      }
    : undefined;

  return {
    stageKey: 'strategy',
    stageName: 'Strategy',
    purpose: 'Confirm the mandate and sponsor before any work begins.',
    intel: {
      provenance: input.provenance,
      lead: isLive
        ? "What Source brings to Strategy — here's the mandate we assembled from your intake, and the case for it, so you're confirming rather than authoring from scratch."
        : "What Source brings to Strategy — before you commit the organization, here's the mandate we assembled and the case for it.",
      points: [
        {
          tone: 'found',
          tag: isLive ? 'Assembled' : 'Sample',
          text: isLive
            ? 'The sponsor, mandate, and value thesis below were assembled from this event’s captured intake — you are confirming, not authoring from scratch.'
            : 'We drafted the mandate, sponsor, and value thesis from your intake — you are confirming, not authoring from scratch.',
        },
        {
          tone: 'archetype',
          tag: 'Archetype',
          text: 'The sourcing archetype pre-wires the strategy memo, the rigor call, and the value-lever map this event will chase.',
        },
        {
          tone: 'benchmark',
          tag: 'Benchmark',
          text: 'Comparable events set a value target in the 18–24% band — your confirmed thesis anchors where yours lands.',
        },
        {
          tone: 'without',
          tag: 'Without this',
          text: 'Starting scope without a sponsor-backed mandate leaves the RFP exposed to mid-flight re-litigation of the goal.',
        },
      ],
    },
    tasks: [
      {
        id: 'strategy.confirm',
        title: 'Confirm strategy & sponsor',
        subtitle: 'Mandate · sponsor · value thesis',
        type: 'confirm',
        state: 'todo',
        guide:
          'Review the mandate we assembled and confirm the sponsor stands behind it. Add a note if anything needs qualifying before the gate.',
        rows,
        cta: 'Confirm strategy & sponsor',
      },
    ],
    gate: {
      approver: input.facts.sponsor,
      confirms: [
        {
          label: 'Sponsor sign-off',
          detail: 'The decision owners endorse this event.',
        },
        {
          label: 'Value target set',
          detail: 'The savings and outcome envelope is agreed.',
        },
        {
          label: 'Archetype confirmed',
          detail: 'The sourcing archetype fits the work.',
        },
      ],
      generates: [
        { label: 'Strategy memo', code: 'd01' },
        { label: 'Your Scope readiness pack', isReadinessPack: true },
      ],
      nextStageName: 'Scope',
      action,
    },
    // No waterfall — Strategy is a pure-intake stage.
  };
}
