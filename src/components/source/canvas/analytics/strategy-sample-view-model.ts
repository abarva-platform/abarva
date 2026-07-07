// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE view-model for the redesigned Source canvas — STRATEGY (P0) stage.
//
// Strategy is the intake stage: it confirms the mandate and sponsor before any
// work begins, and its gate IS the P0 approval. Unlike the Scope exemplar there
// is NO value-type waterfall here — the value thesis is a captured intake fact,
// not a computed proof, so dressing it as a waterfall would over-claim. The
// intel beat is a read ("What Source brings to Strategy"); the single task is
// "Confirm strategy & sponsor" (Sponsor / Mandate / Value thesis review rows);
// the gate carries the same three confirms the standalone `/approval` page uses
// (Sponsor sign-off / Value target set / Archetype confirmed).
//
// Every view here carries `provenance: 'sample'`, so the canvas renders the
// honesty note. When the event's captured facts are available the route builds a
// FACT-DRIVEN Strategy view (see `buildStrategyStageView`) and this sample falls
// away; the sample only renders when the event data is too thin.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AvaLauncherView,
  StageAnalyticsView,
} from './view-model';

/** The Strategy (P0) stage, rendered as the mandate-confirmation exemplar. */
export const SAMPLE_STRATEGY_STAGE: StageAnalyticsView = {
  stageKey: 'strategy',
  stageName: 'Strategy',
  purpose: 'Confirm the mandate and sponsor before any work begins.',
  intel: {
    provenance: 'sample',
    lead:
      "What Source brings to Strategy — before you commit the organization, here's the mandate we assembled and the case for it.",
    points: [
      {
        tone: 'found',
        tag: 'Assembled',
        text: 'We drafted the mandate, sponsor, and value thesis from your intake — you are confirming, not authoring from scratch.',
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
      rows: [
        { key: 'Sponsor', value: 'Confirm the accountable decision owner' },
        { key: 'Mandate', value: 'Why now, and the boundary of the work' },
        { key: 'Value thesis', value: 'The savings / outcome envelope agreed' },
      ],
      cta: 'Confirm strategy & sponsor',
    },
  ],
  gate: {
    approver: 'Accountable sponsor',
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
    // No `action` on the sample: the sample renders the presentational
    // end-state. The route attaches a live `action` when the event is real and
    // sitting in the strategy stage (see buildStrategyStageView).
  },
  // No `waterfall` — Strategy is a pure-intake stage. The value thesis is a
  // captured fact, not a computed proof.
};

/** aVa's docked-launcher scope for the Strategy stage. */
export const SAMPLE_STRATEGY_AVA: AvaLauncherView = {
  role: 'Analyst · Strategy',
  context:
    'One step on Strategy — confirm the mandate and sponsor. Approving here is the P0 gate; it advances the event to Scope.',
  suggestions: [
    'Summarize the mandate we assembled',
    "Who is the accountable sponsor?",
    "What's the value target for this event?",
  ],
};
