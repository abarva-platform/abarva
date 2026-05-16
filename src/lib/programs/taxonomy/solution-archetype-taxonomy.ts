// Slice 0.2 — Moves agentic solution-shaping taxonomy (typed contracts).
//
// This module is the single source of truth for the 8 agentic solution
// archetypes the Moves surface (Nexus agent) reasons over when it shapes a
// customer's agentic software / solution initiative. It encodes the
// practitioner framework from
// docs/strategy/MOVES-SOLUTION-ARCHETYPE-TAXONOMY.md and
// docs/strategy/MOVES-AGENTIC-SHAPING-METHODOLOGY.md.
//
// Data + types only. No UI, no runtime behaviour. The classifier that maps a
// proposed Move onto one of these archetypes is Slice 2.1 (Agentic suitability
// assessment) and is intentionally NOT in this file. The behaviour-test
// fixtures in __tests__/archetype-fixtures.ts are the contract that proves a
// proposed Move can be classified; this module is what they classify against.

/** Stable archetype identifiers — the discriminant of the union below. */
export type SolutionArchetypeKey =
  | 'automation'
  | 'assistant'
  | 'retrieval_copilot'
  | 'human_in_loop_agent'
  | 'full_agentic_workflow'
  | 'data_remediation'
  | 'vendor_led_implementation'
  | 'process_redesign';

/**
 * The three readiness dimensions a Move is gated on before an archetype is
 * appropriate. Mirrors the §6 data-readiness assessment and §5
 * production-readiness gate in the shaping methodology.
 */
export type ReadinessDimension = 'data' | 'control' | 'eval';

/** A coarse maturity rung used to express both gate thresholds and gaps. */
export type MaturityLevel = 'none' | 'low' | 'moderate' | 'high';

/**
 * Tenant context surfaces an archetype depends on for grounded shaping. These
 * names line up with the 14-segment enterprise genome / context layer the
 * methodology references (it_landscape, kpi_dictionary, etc.).
 */
export type EvidenceInputKey =
  | 'it_landscape'
  | 'kpi_dictionary'
  | 'data_sources'
  | 'process_maps'
  | 'org_chart'
  | 'policies_controls'
  | 'vendor_contracts'
  | 'systems_integrations'
  | 'risk_register'
  | 'historical_outcomes';

/** Where on the build/buy/orchestrate axis (§7) an archetype usually lands. */
export type DeliveryLean = 'build' | 'buy' | 'orchestrate' | 'mixed';

/** A readiness gate: the minimum maturity an archetype needs on one dimension. */
export interface ReadinessGate {
  dimension: ReadinessDimension;
  /** Minimum maturity required before this archetype is safe to pursue. */
  minimum: MaturityLevel;
  /** Why this threshold — senior-practitioner voice. */
  rationale: string;
}

/** A named anti-pattern: a way teams misuse or mis-select this archetype. */
export interface ArchetypeAntiPattern {
  /** Short stable label for telemetry / classifier reason codes. */
  code: string;
  /** One-sentence description of the trap. */
  description: string;
}

/**
 * The full encoded definition of one agentic solution archetype. The
 * discriminated union `SolutionArchetype` is keyed on `key`.
 */
export interface SolutionArchetypeBase<K extends SolutionArchetypeKey> {
  key: K;
  /** Canonical name — used verbatim in UI, audit log, and agent output. */
  name: string;
  /** One-paragraph description, principal-solution-architect voice. */
  summary: string;
  /** Bullet conditions under which this archetype is the right shape. */
  whenItFits: readonly string[];
  /** Bullet conditions under which it is the wrong shape. */
  whenItDoesNotFit: readonly string[];
  /** Readiness gates across data / control / eval maturity. */
  readinessGates: readonly ReadinessGate[];
  /** Tenant context this archetype's shaping depends on. */
  evidenceInputs: readonly EvidenceInputKey[];
  /** Anti-patterns to challenge the customer with. */
  antiPatterns: readonly ArchetypeAntiPattern[];
  /** Typical build/buy/orchestrate lean — hand-off hint to Source. */
  deliveryLean: DeliveryLean;
  /**
   * Relative agentic ambition, 1 (deterministic automation) .. 6 (autonomous
   * multi-step workflow). Used by the Slice 2.1 classifier to detect
   * over-reach (ambition far above readiness).
   */
  agenticAmbition: 1 | 2 | 3 | 4 | 5 | 6;
}

export type AutomationArchetype = SolutionArchetypeBase<'automation'>;
export type AssistantArchetype = SolutionArchetypeBase<'assistant'>;
export type RetrievalCopilotArchetype = SolutionArchetypeBase<'retrieval_copilot'>;
export type HumanInLoopAgentArchetype = SolutionArchetypeBase<'human_in_loop_agent'>;
export type FullAgenticWorkflowArchetype = SolutionArchetypeBase<'full_agentic_workflow'>;
export type DataRemediationArchetype = SolutionArchetypeBase<'data_remediation'>;
export type VendorLedImplementationArchetype =
  SolutionArchetypeBase<'vendor_led_implementation'>;
export type ProcessRedesignArchetype = SolutionArchetypeBase<'process_redesign'>;

/** Discriminated union of all 8 agentic solution archetypes. */
export type SolutionArchetype =
  | AutomationArchetype
  | AssistantArchetype
  | RetrievalCopilotArchetype
  | HumanInLoopAgentArchetype
  | FullAgenticWorkflowArchetype
  | DataRemediationArchetype
  | VendorLedImplementationArchetype
  | ProcessRedesignArchetype;

export const SOLUTION_ARCHETYPES: readonly SolutionArchetype[] = [
  {
    key: 'automation',
    name: 'Deterministic Automation',
    summary:
      'A rule-bound, deterministic flow — RPA, scripted integration, or a workflow engine — that removes manual effort from a stable, well-specified process. No model judgement on the critical path; AI, if present, is confined to a narrow classifier with a measured error budget.',
    whenItFits: [
      'The process is stable, high-volume, and fully specifiable as rules.',
      'Inputs are structured and the correct output is unambiguous.',
      'Value is labour displacement on a known unit-cost task.',
      'Failure is cheap and easy to detect and reverse.',
    ],
    whenItDoesNotFit: [
      'The task needs judgement, interpretation, or unstructured-input handling.',
      'Rules change faster than they can be maintained.',
      'The real problem is a broken process — automating it just makes the mess faster.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'moderate',
        rationale:
          'Inputs must be structured and reliable enough that deterministic rules hold; no grounding corpus is needed.',
      },
      {
        dimension: 'control',
        minimum: 'low',
        rationale:
          'A basic exception queue and reversibility are enough — there is no generative output to police.',
      },
      {
        dimension: 'eval',
        minimum: 'low',
        rationale:
          'Correctness is checked by reconciliation, not a model eval harness.',
      },
    ],
    evidenceInputs: ['process_maps', 'systems_integrations', 'kpi_dictionary'],
    antiPatterns: [
      {
        code: 'automating_a_broken_process',
        description:
          'Automating a process that should be redesigned first — the archetype should be process_redesign.',
      },
      {
        code: 'ai_label_on_rpa',
        description:
          'Marketing a deterministic RPA flow as an "AI agent" to win demo attention.',
      },
    ],
    deliveryLean: 'buy',
    agenticAmbition: 1,
  },
  {
    key: 'assistant',
    name: 'Conversational Assistant',
    summary:
      'A model-fronted assistant that drafts, summarises, rewrites, or answers within a bounded domain. The human always reviews and owns the output; the assistant accelerates work but takes no consequential action on its own.',
    whenItFits: [
      'The work product is text the user will review before it is used.',
      'Value is throughput and quality lift for knowledge workers.',
      'The domain is bounded and a competent human is in the loop by construction.',
      'Time-to-value matters and a thin, low-risk first bet is wanted.',
    ],
    whenItDoesNotFit: [
      'The assistant would need authoritative, fresh tenant facts it cannot retrieve — that is retrieval_copilot.',
      'The output must be acted on without human review.',
      'Accuracy on tenant-specific facts is load-bearing.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'low',
        rationale:
          'A general model can add value without a tenant grounding corpus; mandatory review absorbs residual error.',
      },
      {
        dimension: 'control',
        minimum: 'low',
        rationale:
          'Human review is the primary control; basic prompt-injection and output hygiene suffice.',
      },
      {
        dimension: 'eval',
        minimum: 'low',
        rationale:
          'Lightweight quality sampling is enough since no autonomous action is taken.',
      },
    ],
    evidenceInputs: ['kpi_dictionary', 'org_chart'],
    antiPatterns: [
      {
        code: 'ungrounded_fact_assistant',
        description:
          'Letting an assistant answer tenant-specific factual questions with no retrieval — it will hallucinate.',
      },
      {
        code: 'assistant_as_system_of_record',
        description:
          'Treating assistant output as authoritative instead of a draft a human owns.',
      },
    ],
    deliveryLean: 'buy',
    agenticAmbition: 2,
  },
  {
    key: 'retrieval_copilot',
    name: 'Retrieval Copilot',
    summary:
      'A grounded copilot that answers and drafts against an authoritative tenant context source through a retrieval / broker boundary. The human still owns the action, but answers are cited and traceable to fresh tenant data.',
    whenItFits: [
      'Users need answers grounded in tenant-specific, changing facts.',
      'An authoritative, accessible, reasonably fresh context source exists or can be built.',
      'Citations and traceability are required for trust or audit.',
      'Value is faster, more accurate decisions — not autonomous execution.',
    ],
    whenItDoesNotFit: [
      'The grounding corpus does not exist or is stale — do data_remediation first.',
      'No retrieval / broker boundary can be cleanly drawn.',
      'The use case actually needs to take action, not just inform.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'high',
        rationale:
          'An agent is only as good as its grounding; the context source must be present, accessible, and fresh.',
      },
      {
        dimension: 'control',
        minimum: 'moderate',
        rationale:
          'A retrieval / broker boundary plus output-consistency guards are needed to keep answers grounded.',
      },
      {
        dimension: 'eval',
        minimum: 'moderate',
        rationale:
          'A golden corpus is required to know whether retrieval quality is improving or degrading.',
      },
    ],
    evidenceInputs: [
      'data_sources',
      'it_landscape',
      'kpi_dictionary',
      'policies_controls',
    ],
    antiPatterns: [
      {
        code: 'copilot_on_stale_corpus',
        description:
          'Shipping a copilot over a context source that is stale or incomplete — confident wrong answers.',
      },
      {
        code: 'no_broker_boundary',
        description:
          'Wiring the model directly to data stores with no testable retrieval boundary.',
      },
    ],
    deliveryLean: 'orchestrate',
    agenticAmbition: 3,
  },
  {
    key: 'human_in_loop_agent',
    name: 'Human-in-the-Loop Agent',
    summary:
      'An agent that plans and proposes consequential actions but executes only through defined human checkpoints. It can take low-risk steps autonomously and escalates high-stakes decisions to an accountable human.',
    whenItFits: [
      'Actions have real consequences but a human can realistically review them.',
      'A grounded context source and a clear approval workflow both exist.',
      'The organisation wants agentic leverage without ceding accountability.',
      'It is the safe first step on the path toward a fuller agentic workflow.',
    ],
    whenItDoesNotFit: [
      'Volume or latency makes human review at every checkpoint impractical.',
      'Eval and control maturity is too low to trust even the autonomous low-risk steps.',
      'The work is purely informational — a copilot is enough.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'high',
        rationale:
          'Action proposals must be grounded in fresh, accurate tenant context.',
      },
      {
        dimension: 'control',
        minimum: 'high',
        rationale:
          'Defined human checkpoints, role-based approvals, and a tested kill switch are mandatory for consequential action.',
      },
      {
        dimension: 'eval',
        minimum: 'moderate',
        rationale:
          'Golden plus adversarial evals are needed to bound the quality of autonomously taken low-risk steps.',
      },
    ],
    evidenceInputs: [
      'data_sources',
      'process_maps',
      'org_chart',
      'policies_controls',
      'risk_register',
    ],
    antiPatterns: [
      {
        code: 'rubber_stamp_checkpoint',
        description:
          'A human checkpoint that reviewers approve without scrutiny — accountability theatre, not control.',
      },
      {
        code: 'skipping_to_full_agentic',
        description:
          'Jumping past human-in-loop to a full agentic workflow before control and eval maturity exist.',
      },
    ],
    deliveryLean: 'mixed',
    agenticAmbition: 4,
  },
  {
    key: 'full_agentic_workflow',
    name: 'Full Agentic Workflow',
    summary:
      'A multi-step agentic system that plans, retrieves, calls tools, and executes an end-to-end workflow with autonomy on the critical path. Humans supervise by exception rather than approving each step.',
    whenItFits: [
      'The workflow is well understood and decomposable into bounded steps.',
      'Data, control, and eval maturity are all high and proven on a prior human-in-loop stage.',
      'Volume or latency genuinely rules out step-by-step human approval.',
      'Failure modes are enumerated, observable, and have graceful degradation.',
    ],
    whenItDoesNotFit: [
      'Any of data, control, or eval readiness is below high — this is the highest-risk archetype.',
      'There is no prior human-in-loop stage proving the steps work.',
      'Failure cost or regulatory exposure is severe and not yet bounded.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'high',
        rationale:
          'Every step depends on grounded, fresh context; a weak link breaks the chain.',
      },
      {
        dimension: 'control',
        minimum: 'high',
        rationale:
          'Guardrails, exception handling, observability, and a tested kill switch must all be production-grade.',
      },
      {
        dimension: 'eval',
        minimum: 'high',
        rationale:
          'Golden, adversarial, and regression evals on every step are required before autonomy is granted.',
      },
    ],
    evidenceInputs: [
      'data_sources',
      'process_maps',
      'systems_integrations',
      'policies_controls',
      'risk_register',
      'historical_outcomes',
    ],
    antiPatterns: [
      {
        code: 'full_agentic_on_low_data_readiness',
        description:
          'Choosing a full agentic workflow when data-readiness is low — the canonical over-reach failure.',
      },
      {
        code: 'demo_driven_autonomy',
        description:
          'Selecting full autonomy because it demos well, with no production-readiness gate behind it.',
      },
      {
        code: 'no_human_in_loop_predecessor',
        description:
          'Going straight to autonomy without a human-in-loop stage that proved the steps.',
      },
    ],
    deliveryLean: 'build',
    agenticAmbition: 6,
  },
  {
    key: 'data_remediation',
    name: 'Data Remediation',
    summary:
      'Not an agentic solution at all — a data project that must precede one. It closes the grounding gap: builds, cleans, integrates, or refreshes the context source a later agentic archetype will depend on.',
    whenItFits: [
      'A high-value agentic use case is blocked because its grounding context is missing, stale, or inaccessible.',
      'The §6 data-readiness assessment found context the customer does not have.',
      'The honest sequencing is "data project first, agentic project second".',
    ],
    whenItDoesNotFit: [
      'The grounding context already exists, is accessible, and is fresh.',
      'It is being used to indefinitely defer a use case that is actually ready.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'none',
        rationale:
          'This archetype exists precisely to start from low or absent data readiness.',
      },
      {
        dimension: 'control',
        minimum: 'low',
        rationale:
          'Data-quality and lineage controls matter, but no agent is in production yet.',
      },
      {
        dimension: 'eval',
        minimum: 'none',
        rationale:
          'Success is measured by data-quality metrics, not a model eval harness.',
      },
    ],
    evidenceInputs: ['data_sources', 'it_landscape', 'systems_integrations'],
    antiPatterns: [
      {
        code: 'remediation_as_permanent_parking',
        description:
          'Using a data-remediation label to indefinitely stall a use case whose grounding is actually adequate.',
      },
      {
        code: 'remediation_without_target_use_case',
        description:
          'Cleaning data with no named downstream agentic use case to anchor scope and stopping point.',
      },
    ],
    deliveryLean: 'mixed',
    agenticAmbition: 1,
  },
  {
    key: 'vendor_led_implementation',
    name: 'Vendor-Led Implementation',
    summary:
      'A mature vertical agent or packaged solution exists; the work is selection, integration, configuration, and governance of a vendor product rather than building an agent in-house.',
    whenItFits: [
      'A mature vendor agent covers the use case and the use case is not differentiating.',
      'Speed and lower build risk outweigh the loss of deep customisation.',
      'The customer can still own grounding, evals, and the production-readiness gate.',
    ],
    whenItDoesNotFit: [
      'The use case is core differentiation needing proprietary context and control — that is build.',
      'No vendor product is genuinely mature; "vendor-led" would mean a custom build wearing a vendor logo.',
      'Vendor lock-in or data-handling posture is unacceptable.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'moderate',
        rationale:
          'Even a bought agent needs tenant grounding wired in; integration data must be ready.',
      },
      {
        dimension: 'control',
        minimum: 'moderate',
        rationale:
          'Vendor security review, data-handling posture, and exit / lock-in controls must be assessed.',
      },
      {
        dimension: 'eval',
        minimum: 'moderate',
        rationale:
          'The customer must still eval vendor output against its own quality bar — buying does not transfer accountability.',
      },
    ],
    evidenceInputs: [
      'vendor_contracts',
      'it_landscape',
      'systems_integrations',
      'policies_controls',
    ],
    antiPatterns: [
      {
        code: 'vendor_led_on_core_differentiation',
        description:
          'Buying a vendor agent for a capability that is the customer’s core differentiation.',
      },
      {
        code: 'accountability_outsourced',
        description:
          'Assuming the vendor owns evals, grounding, and the readiness gate — accountability cannot be bought.',
      },
    ],
    deliveryLean: 'buy',
    agenticAmbition: 3,
  },
  {
    key: 'process_redesign',
    name: 'Process Redesign',
    summary:
      'Not an agentic solution — a precondition for one. The process itself is broken or convoluted; it must be redesigned before any automation or agent is shaped on top of it, or the technology just accelerates the dysfunction.',
    whenItFits: [
      'The underlying process is broken, redundant, or convoluted.',
      'Automating or "agentifying" the current process would entrench a bad design.',
      'The largest value is in eliminating steps, not accelerating them.',
    ],
    whenItDoesNotFit: [
      'The process is already sound and only effort-heavy — that is automation.',
      'It is used to stall a genuinely ready agentic bet.',
    ],
    readinessGates: [
      {
        dimension: 'data',
        minimum: 'none',
        rationale:
          'Redesign is an operating-model exercise; it does not require a grounding corpus.',
      },
      {
        dimension: 'control',
        minimum: 'low',
        rationale:
          'Change-management and process-ownership controls matter; no agent controls are needed yet.',
      },
      {
        dimension: 'eval',
        minimum: 'none',
        rationale:
          'Success is measured by process KPIs, not a model eval harness.',
      },
    ],
    evidenceInputs: ['process_maps', 'org_chart', 'kpi_dictionary'],
    antiPatterns: [
      {
        code: 'paving_the_cowpath',
        description:
          'Automating the existing broken process instead of redesigning it first.',
      },
      {
        code: 'redesign_without_owner',
        description:
          'Redesigning a process with no accountable process owner to enforce the new design.',
      },
    ],
    deliveryLean: 'mixed',
    agenticAmbition: 1,
  },
];

/** Index of archetypes by key for O(1) lookup. */
export const SOLUTION_ARCHETYPE_BY_KEY: Readonly<
  Record<SolutionArchetypeKey, SolutionArchetype>
> = Object.freeze(
  SOLUTION_ARCHETYPES.reduce(
    (acc, archetype) => {
      acc[archetype.key] = archetype;
      return acc;
    },
    {} as Record<SolutionArchetypeKey, SolutionArchetype>,
  ),
);

/** All 8 archetype keys, in canonical order. */
export const SOLUTION_ARCHETYPE_KEYS: readonly SolutionArchetypeKey[] =
  SOLUTION_ARCHETYPES.map((a) => a.key);

/** Look up a single archetype definition by key. */
export function getSolutionArchetype(
  key: SolutionArchetypeKey,
): SolutionArchetype {
  return SOLUTION_ARCHETYPE_BY_KEY[key];
}

/** Ordinal ranking of maturity levels for gate comparison. */
const MATURITY_ORDER: Readonly<Record<MaturityLevel, number>> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
};

/**
 * True when `actual` maturity meets or exceeds `required`. Helper for the
 * Slice 2.1 classifier and for the behaviour-test fixtures; this module ships
 * no classifier itself.
 */
export function meetsReadiness(
  actual: MaturityLevel,
  required: MaturityLevel,
): boolean {
  return MATURITY_ORDER[actual] >= MATURITY_ORDER[required];
}
