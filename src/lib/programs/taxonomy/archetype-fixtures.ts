// Slice 0.2 — Moves agentic solution-shaping taxonomy: behaviour-test fixtures.
//
// These fixtures are the CONTRACT for the Slice 2.1 agentic suitability
// classifier. Each fixture is a sample proposed Move plus the archetype a
// principal solution architect would classify it into, the reasons, and the
// readiness gaps that must be closed first.
//
// The classifier itself is NOT shipped in Slice 0.2. The accompanying test
// (archetype-fixtures.test.ts) only proves that every fixture is internally
// coherent against the taxonomy contract — i.e. the taxonomy is complete
// enough that a classifier *could* produce these classifications.

import type {
  MaturityLevel,
  ReadinessDimension,
  SolutionArchetypeKey,
} from './solution-archetype-taxonomy';

/** A snapshot of a tenant's readiness across the three gated dimensions. */
export type ReadinessProfile = Readonly<Record<ReadinessDimension, MaturityLevel>>;

/** A readiness gap surfaced for a proposed Move. */
export interface ReadinessGap {
  dimension: ReadinessDimension;
  /** What the tenant has today. */
  current: MaturityLevel;
  /** What the chosen archetype needs. */
  required: MaturityLevel;
  /** Senior-practitioner explanation of what must close. */
  note: string;
}

/**
 * One sample proposed Move with its expected classification. `proposedMove`
 * is the kind of free-text idea a CXO brings to the Moves surface.
 */
export interface ArchetypeFixture {
  /** Stable fixture id for telemetry / debugging. */
  id: string;
  /** The tenant the scenario is set in. */
  tenant: 'apex-retail' | 'meridian-health' | 'first-capital';
  /** The raw proposed Move, as a user would phrase it. */
  proposedMove: string;
  /** Tenant readiness at the time of shaping. */
  readiness: ReadinessProfile;
  /** The archetype a principal solution architect would assign. */
  expectedArchetype: SolutionArchetypeKey;
  /** Why this archetype — used to validate classifier reason quality. */
  expectedReasons: readonly string[];
  /** Readiness gaps that must close before the archetype is safe. */
  expectedReadinessGaps: readonly ReadinessGap[];
  /**
   * If the naive / demo-driven pick differs from the expert pick, the
   * archetype the customer would wrongly select and the anti-pattern code it
   * trips. Omitted when the obvious pick is also correct.
   */
  temptingButWrong?: {
    archetype: SolutionArchetypeKey;
    antiPatternCode: string;
  };
}

export const ARCHETYPE_FIXTURES: readonly ArchetypeFixture[] = [
  {
    id: 'fx-automation-invoice-match',
    tenant: 'apex-retail',
    proposedMove:
      'Auto-match supplier invoices to purchase orders and post the ones that reconcile cleanly.',
    readiness: { data: 'high', control: 'moderate', eval: 'low' },
    expectedArchetype: 'automation',
    expectedReasons: [
      'The process is high-volume, stable, and fully specifiable as reconciliation rules.',
      'Inputs (invoices, POs) are structured and the correct match is unambiguous.',
      'Value is labour displacement on a known unit-cost task; failure is cheap to detect.',
    ],
    expectedReadinessGaps: [],
  },
  {
    id: 'fx-assistant-store-comms',
    tenant: 'apex-retail',
    proposedMove:
      'Help regional managers draft weekly store-operations updates faster.',
    readiness: { data: 'low', control: 'low', eval: 'low' },
    expectedArchetype: 'assistant',
    expectedReasons: [
      'The work product is text a manager reviews before it is sent.',
      'The domain is bounded and a competent human is in the loop by construction.',
      'Value is throughput lift; a thin low-risk first bet is appropriate.',
    ],
    expectedReadinessGaps: [],
  },
  {
    id: 'fx-copilot-policy-answers',
    tenant: 'meridian-health',
    proposedMove:
      'Let care coordinators ask plain-language questions about payer policies and prior-auth rules and get cited answers.',
    readiness: { data: 'high', control: 'moderate', eval: 'moderate' },
    expectedArchetype: 'retrieval_copilot',
    expectedReasons: [
      'Users need answers grounded in tenant-specific, frequently changing policy facts.',
      'An authoritative policy corpus exists and citations are required for trust.',
      'Value is faster, more accurate decisions, not autonomous execution.',
    ],
    expectedReadinessGaps: [],
    temptingButWrong: {
      archetype: 'assistant',
      antiPatternCode: 'ungrounded_fact_assistant',
    },
  },
  {
    id: 'fx-copilot-blocked-stale-corpus',
    tenant: 'first-capital',
    proposedMove:
      'Give relationship managers a copilot that answers questions about each client’s current product holdings and risk posture.',
    readiness: { data: 'low', control: 'moderate', eval: 'low' },
    expectedArchetype: 'data_remediation',
    expectedReasons: [
      'The copilot the customer wants depends on a grounding corpus that is missing or stale.',
      'The §6 data-readiness assessment finds the context the use case needs is not available or fresh.',
      'The honest sequencing is a data project first, agentic project second.',
    ],
    expectedReadinessGaps: [
      {
        dimension: 'data',
        current: 'low',
        required: 'high',
        note: 'Client-holdings and risk context must be integrated and refreshed before a grounded copilot is safe.',
      },
    ],
    temptingButWrong: {
      archetype: 'retrieval_copilot',
      antiPatternCode: 'copilot_on_stale_corpus',
    },
  },
  {
    id: 'fx-hitl-contact-center-resolution',
    tenant: 'apex-retail',
    proposedMove:
      'Have an agent resolve customer service tickets end-to-end — issue refunds, update orders — with supervisor approval on anything over a threshold.',
    readiness: { data: 'high', control: 'high', eval: 'moderate' },
    expectedArchetype: 'human_in_loop_agent',
    expectedReasons: [
      'Actions (refunds, order changes) have real consequences but a supervisor can realistically review them.',
      'A grounded context source and a clear approval workflow both exist.',
      'It is the safe first step toward a fuller agentic workflow.',
    ],
    // All three gates are met (data high, control high, eval at the moderate
    // bar) — a clean classification with no readiness gap.
    expectedReadinessGaps: [],
  },
  {
    id: 'fx-full-agentic-overreach',
    tenant: 'meridian-health',
    proposedMove:
      'Stand up a fully autonomous agent that runs the entire prior-authorization workflow with no human in the loop.',
    readiness: { data: 'moderate', control: 'low', eval: 'low' },
    expectedArchetype: 'human_in_loop_agent',
    expectedReasons: [
      'Full autonomy is over-reach: control and eval maturity are well below the high bar it requires.',
      'There is no prior human-in-loop stage proving the workflow steps.',
      'The expert shape is a human-in-loop agent first, closing data, control, and eval gaps.',
    ],
    expectedReadinessGaps: [
      {
        dimension: 'data',
        current: 'moderate',
        required: 'high',
        note: 'Prior-auth context must reach high freshness and coverage before action proposals are trustworthy.',
      },
      {
        dimension: 'control',
        current: 'low',
        required: 'high',
        note: 'Defined human checkpoints, role-based approvals, and a tested kill switch are not yet in place.',
      },
      {
        dimension: 'eval',
        current: 'low',
        required: 'moderate',
        note: 'Golden and adversarial evals must exist before any step is taken autonomously.',
      },
    ],
    temptingButWrong: {
      archetype: 'full_agentic_workflow',
      antiPatternCode: 'full_agentic_on_low_data_readiness',
    },
  },
  {
    id: 'fx-full-agentic-ready',
    tenant: 'apex-retail',
    proposedMove:
      'Promote the supervised contact-center agent to run high-volume low-value ticket resolution autonomously, supervised by exception.',
    readiness: { data: 'high', control: 'high', eval: 'high' },
    expectedArchetype: 'full_agentic_workflow',
    expectedReasons: [
      'Data, control, and eval maturity are all high and proven on the prior human-in-loop stage.',
      'Ticket volume genuinely rules out step-by-step human approval.',
      'Failure modes are enumerated, observable, and have graceful degradation.',
    ],
    expectedReadinessGaps: [],
  },
  {
    id: 'fx-vendor-led-ambient-scribe',
    tenant: 'meridian-health',
    proposedMove:
      'Adopt an ambient clinical documentation assistant for clinicians instead of building one in-house.',
    readiness: { data: 'moderate', control: 'moderate', eval: 'moderate' },
    expectedArchetype: 'vendor_led_implementation',
    expectedReasons: [
      'A mature vendor product covers ambient clinical documentation and it is not core differentiation.',
      'Speed and lower build risk outweigh deep customisation here.',
      'Meridian still owns grounding, evals, and the production-readiness gate.',
    ],
    // Data, control, and eval all sit at the moderate bar this archetype
    // requires — no readiness gap, though vendor security review remains a
    // mandatory shaping task captured elsewhere.
    expectedReadinessGaps: [],
  },
  {
    id: 'fx-process-redesign-prior-auth',
    tenant: 'meridian-health',
    proposedMove:
      'Automate the current 14-step prior-authorization process exactly as it runs today.',
    readiness: { data: 'moderate', control: 'low', eval: 'low' },
    expectedArchetype: 'process_redesign',
    expectedReasons: [
      'The current process is convoluted and redundant; automating it entrenches a bad design.',
      'The largest value is eliminating steps, not accelerating them.',
      'Redesign must precede any automation or agent on top of this workflow.',
    ],
    expectedReadinessGaps: [],
    temptingButWrong: {
      archetype: 'automation',
      antiPatternCode: 'automating_a_broken_process',
    },
  },
  {
    id: 'fx-data-remediation-model-risk',
    tenant: 'first-capital',
    proposedMove:
      'Build an agent that monitors model-risk and drift across the model inventory.',
    readiness: { data: 'none', control: 'low', eval: 'low' },
    expectedArchetype: 'data_remediation',
    expectedReasons: [
      'The model inventory and drift telemetry the agent would reason over do not yet exist as an accessible source.',
      'Data-readiness is absent; this is a data project before it is an agentic project.',
      'Remediation is scoped to a named downstream use case, so it has a clear stopping point.',
    ],
    expectedReadinessGaps: [
      {
        dimension: 'data',
        current: 'none',
        required: 'high',
        note: 'A model inventory with drift telemetry must be built and integrated before any monitoring agent is shaped.',
      },
    ],
    temptingButWrong: {
      archetype: 'full_agentic_workflow',
      antiPatternCode: 'full_agentic_on_low_data_readiness',
    },
  },
];
