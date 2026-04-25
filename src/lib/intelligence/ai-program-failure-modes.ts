// PF1 · AI Program Failure Modes Pattern Pack.
//
// Pure deterministic pattern pack capturing the AbarVa POV on why AI
// programs fail. Sentinel, Nexus, Steward, and Atlas can subscribe to
// this pack to detect, escalate, and intervene on canonical failure
// modes without inventing them at runtime.
//
// No live runtime, no Claude / OpenAI / Pinecone invocation, no
// Date.now() reads, no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type AiProgramFailureKey =
  | 'weak_data_foundation'
  | 'poor_use_case_framing'
  | 'no_business_owner'
  | 'no_measurable_baseline'
  | 'no_value_ledger'
  | 'weak_workflow_integration'
  | 'tool_first_thinking'
  | 'missing_governance_risk'
  | 'no_adoption_change_plan'
  | 'no_operating_model_for_scale'
  | 'pilot_purgatory'
  | 'ai_tool_sprawl_without_value';

/** S9e signal types this pack correlates with. */
export type AiProgramFailureSignalType =
  | 'gate_missing_inputs'
  | 'evidence_not_ready'
  | 'value_not_ready'
  | 'deliverable_coverage_gap'
  | 'context_insufficient'
  | 'executive_decision_needed';

/** Canonical phase enum (Origination → Verify) plus 'any'. */
export type AiProgramFailurePhase =
  | 'origination'
  | 'charter'
  | 'diagnose'
  | 'design'
  | 'execute'
  | 'verify'
  | 'any';

/** Canonical hard gate identifiers, plus 'none' when no gate is at risk. */
export type AiProgramFailureGate = 'G1' | 'G2' | 'G3' | 'G4' | 'none';

/** Deliverable class implicated by the failure mode. */
export type AiProgramFailureDeliverable =
  | 'charter'
  | 'diagnose_findings'
  | 'design_pack'
  | 'evaluation_postmortem'
  | 'value_ledger'
  | 'operating_model_doc'
  | 'risk_responsible_ai_review'
  | 'adoption_change_plan'
  | 'integration_plan'
  | 'data_readiness_plan'
  | 'use_case_canvas'
  | 'portfolio_review';

export type AiProgramFailureAgent = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export interface AiProgramFailureMode {
  key: AiProgramFailureKey;
  name: string;
  definition: string;
  whyItMatters: string;
  commonSignals: ReadonlyArray<AiProgramFailureSignalType>;
  requiredEvidence: ReadonlyArray<string>;
  phaseWhereDetected: ReadonlyArray<AiProgramFailurePhase>;
  recommendedIntervention: string;
  gateImplication: AiProgramFailureGate;
  deliverableImplication: AiProgramFailureDeliverable;
  primaryAgent: AiProgramFailureAgent;
  handoffAgents: ReadonlyArray<AiProgramFailureAgent>;
  createdFrom: 'deterministic_pattern_pack';
}

export interface AiProgramFailureModeSummary {
  totalCount: number;
  byPrimaryAgent: Record<AiProgramFailureAgent, number>;
  byPhase: Record<AiProgramFailurePhase, number>;
  byGate: Record<AiProgramFailureGate, number>;
  uniqueDeliverableImplications: ReadonlyArray<AiProgramFailureDeliverable>;
}

// ---------------------------------------------------------------------
// Pattern pack
// ---------------------------------------------------------------------

const PACK: Record<AiProgramFailureKey, AiProgramFailureMode> = {
  weak_data_foundation: {
    key: 'weak_data_foundation',
    name: 'Weak data foundation',
    definition:
      'The program assumes useful AI outputs are possible without first establishing a defensible data foundation: source systems, data quality, lineage, ownership, and access have not been captured or tested.',
    whyItMatters:
      'AI outputs are only as defensible as the data feeding them. Without a captured data foundation, every model claim — and every dollar claim — collapses on the first CXO challenge.',
    commonSignals: ['context_insufficient', 'evidence_not_ready'],
    requiredEvidence: [
      'Source-system inventory with named data owners',
      'Data quality snapshot per critical attribute',
      'Lineage map for the use case input chain',
    ],
    phaseWhereDetected: ['diagnose', 'design'],
    recommendedIntervention:
      'Pause use-case design until a data foundation review is captured: source systems, owners, quality snapshot, lineage map.',
    gateImplication: 'G3',
    deliverableImplication: 'data_readiness_plan',
    primaryAgent: 'steward',
    handoffAgents: ['nexus', 'sentinel'],
    createdFrom: 'deterministic_pattern_pack',
  },
  poor_use_case_framing: {
    key: 'poor_use_case_framing',
    name: 'Poor use-case framing',
    definition:
      'The program is framed as "use AI for X" rather than as a defensible business problem with a measurable outcome, named decision-maker, and bounded scope.',
    whyItMatters:
      'A vague use case cannot pass G1 charter; the executive sponsor cannot defend the investment and the program drifts as scope shifts each steering touchpoint.',
    commonSignals: ['context_insufficient', 'gate_missing_inputs'],
    requiredEvidence: [
      'Use-case canvas with named business problem and outcome',
      'Named decision-maker / sponsor',
      'In-scope / out-of-scope statement',
    ],
    phaseWhereDetected: ['origination', 'charter'],
    recommendedIntervention:
      'Run a use-case framing workshop and capture the canvas before signing the charter (G1).',
    gateImplication: 'G1',
    deliverableImplication: 'use_case_canvas',
    primaryAgent: 'nexus',
    handoffAgents: ['steward', 'atlas'],
    createdFrom: 'deterministic_pattern_pack',
  },
  no_business_owner: {
    key: 'no_business_owner',
    name: 'No business owner',
    definition:
      'The program lacks a named business owner with authority and time to drive adoption and consume the outcome. Engineering leads or central AI teams are not substitutes.',
    whyItMatters:
      'Without a business owner, the program cannot be defended at G1 / G2 / G4 and adoption stalls — the AI capability lands but nobody runs it.',
    commonSignals: ['executive_decision_needed', 'context_insufficient'],
    requiredEvidence: [
      'Business owner named with authority + time commitment',
      'Owner sign-off on the charter',
      'Owner attendance pattern at steering touchpoints',
    ],
    phaseWhereDetected: ['origination', 'charter', 'diagnose'],
    recommendedIntervention:
      'Escalate to the executive sponsor to assign a business owner; refuse to advance past G1 without one.',
    gateImplication: 'G1',
    deliverableImplication: 'charter',
    primaryAgent: 'steward',
    handoffAgents: ['atlas'],
    createdFrom: 'deterministic_pattern_pack',
  },
  no_measurable_baseline: {
    key: 'no_measurable_baseline',
    name: 'No measurable baseline',
    definition:
      'No baseline KPI is captured for the use case; "before" reference is anecdotal so any "after" claim is not measurable.',
    whyItMatters:
      'Without a captured baseline, value cannot be quantified; G3 design + value cannot pass; G4 verification cannot defend realized outcomes.',
    commonSignals: ['value_not_ready'],
    requiredEvidence: [
      'Baseline KPI snapshot with timestamp and measurement source',
      'Confidence band or measurement error',
      'CXO sign-off on the baseline',
    ],
    phaseWhereDetected: ['diagnose', 'design'],
    recommendedIntervention:
      'Capture the baseline KPI from the source-of-truth system (not anecdote) before promoting to G3.',
    gateImplication: 'G3',
    deliverableImplication: 'value_ledger',
    primaryAgent: 'atlas',
    handoffAgents: ['steward', 'nexus'],
    createdFrom: 'deterministic_pattern_pack',
  },
  no_value_ledger: {
    key: 'no_value_ledger',
    name: 'No value ledger',
    definition:
      'The program has no captured value chain — baseline → target → realized — that traces dollar claims back to a measurable source.',
    whyItMatters:
      'Without a value ledger, dollar claims at G3 / G4 are not defensible. Atlas refuses to issue dollar claims; Steward must surface the gap.',
    commonSignals: ['value_not_ready', 'evidence_not_ready'],
    requiredEvidence: [
      'Captured baseline KPI',
      'Captured target with confidence band',
      'Captured realized-value entry tied to the same measurement source',
    ],
    phaseWhereDetected: ['design', 'execute', 'verify'],
    recommendedIntervention:
      'Open the value ledger panel and capture baseline + target + realized entries before publishing dollar claims.',
    gateImplication: 'G3',
    deliverableImplication: 'value_ledger',
    primaryAgent: 'atlas',
    handoffAgents: ['steward'],
    createdFrom: 'deterministic_pattern_pack',
  },
  weak_workflow_integration: {
    key: 'weak_workflow_integration',
    name: 'Weak workflow integration',
    definition:
      'AI capability is built without integrating into the user workflow it must improve. Output lands in a separate tool or report; the user never sees it where the work happens.',
    whyItMatters:
      'AI capability without workflow integration does not change behavior; adoption stays low; realized value never materializes.',
    commonSignals: ['deliverable_coverage_gap', 'context_insufficient'],
    requiredEvidence: [
      'Workflow map naming the user, the system of record, and the integration point',
      'Integration plan with technical approach + owner',
      'Adoption checkpoints aligned to the workflow',
    ],
    phaseWhereDetected: ['design', 'execute'],
    recommendedIntervention:
      'Pause execute until the integration plan is captured and the workflow change is tested with a real user.',
    gateImplication: 'G3',
    deliverableImplication: 'integration_plan',
    primaryAgent: 'nexus',
    handoffAgents: ['steward'],
    createdFrom: 'deterministic_pattern_pack',
  },
  tool_first_thinking: {
    key: 'tool_first_thinking',
    name: 'Tool-first thinking',
    definition:
      'The program is anchored on a specific tool ("we will use Copilot" / "we will buy <vendor>") rather than on a problem to solve. Tool selection is treated as the strategy.',
    whyItMatters:
      'Tool-first thinking confuses purchasing with delivery. Without a problem-first frame, the program cannot defend the investment when tool incumbents change.',
    commonSignals: ['context_insufficient', 'executive_decision_needed'],
    requiredEvidence: [
      'Use-case canvas with named business problem (not tool)',
      'Tool evaluation tied to the problem (not the brand)',
      'Decision record naming the alternatives considered',
    ],
    phaseWhereDetected: ['origination', 'charter', 'diagnose'],
    recommendedIntervention:
      'Reframe the program around the business problem; downgrade the tool decision to an evaluation step inside Diagnose.',
    gateImplication: 'G1',
    deliverableImplication: 'use_case_canvas',
    primaryAgent: 'nexus',
    handoffAgents: ['atlas', 'steward'],
    createdFrom: 'deterministic_pattern_pack',
  },
  missing_governance_risk: {
    key: 'missing_governance_risk',
    name: 'Missing governance / risk review',
    definition:
      'The program advances without a captured responsible-AI review, risk register entry, or framework alignment (EU AI Act / NIST AI RMF / ISO 42001).',
    whyItMatters:
      'Without governance review, the program cannot be defended at G3 / G4 in a regulated context; legal / compliance can block delivery late.',
    commonSignals: ['executive_decision_needed', 'gate_missing_inputs'],
    requiredEvidence: [
      'Responsible-AI review for the active use case',
      'Risk register entry with named owner',
      'Framework alignment statement (EU AI Act / NIST AI RMF / ISO 42001)',
    ],
    phaseWhereDetected: ['design', 'execute'],
    recommendedIntervention:
      'Run the responsible-AI review and capture the risk register entry before promoting to G3.',
    gateImplication: 'G3',
    deliverableImplication: 'risk_responsible_ai_review',
    primaryAgent: 'steward',
    handoffAgents: ['atlas', 'sentinel'],
    createdFrom: 'deterministic_pattern_pack',
  },
  no_adoption_change_plan: {
    key: 'no_adoption_change_plan',
    name: 'No adoption / change plan',
    definition:
      'The program has no captured plan for adoption: training, comms, behavior change, escalation. The capability is delivered "and then everyone uses it" by assumption.',
    whyItMatters:
      'Without an adoption plan, behavior does not change; usage telemetry stays flat; G4 verification of realized outcomes fails.',
    commonSignals: ['deliverable_coverage_gap', 'context_insufficient'],
    requiredEvidence: [
      'Adoption / change plan with named user cohort',
      'Communication + training schedule',
      'Behavior-change KPI per cohort',
    ],
    phaseWhereDetected: ['design', 'execute'],
    recommendedIntervention:
      'Capture the adoption plan as a required deliverable in Design; refuse to advance past G3 without it.',
    gateImplication: 'G3',
    deliverableImplication: 'adoption_change_plan',
    primaryAgent: 'nexus',
    handoffAgents: ['steward', 'atlas'],
    createdFrom: 'deterministic_pattern_pack',
  },
  no_operating_model_for_scale: {
    key: 'no_operating_model_for_scale',
    name: 'No operating model for scale',
    definition:
      'A pilot succeeds but no operating model exists to scale: ownership, run cost, incident handling, retraining cadence, and capacity planning are undefined.',
    whyItMatters:
      'Without an operating model, the pilot lives forever as a pilot; scale stalls; the portfolio loses confidence in the AI investment.',
    commonSignals: ['executive_decision_needed', 'context_insufficient'],
    requiredEvidence: [
      'Operating model doc naming run owner, retraining cadence, incident process',
      'Capacity / cost plan per scaled instance',
      'Steady-state KPI baseline',
    ],
    phaseWhereDetected: ['execute', 'verify'],
    recommendedIntervention:
      'Stand up an operating-model review at G4 and capture the operating model doc before claiming completion.',
    gateImplication: 'G4',
    deliverableImplication: 'operating_model_doc',
    primaryAgent: 'atlas',
    handoffAgents: ['steward', 'sentinel'],
    createdFrom: 'deterministic_pattern_pack',
  },
  pilot_purgatory: {
    key: 'pilot_purgatory',
    name: 'Pilot purgatory',
    definition:
      'The program runs successive pilots without graduating to production. Each pilot is treated as a one-off; learnings do not propagate; scaling is repeatedly deferred.',
    whyItMatters:
      'Pilot purgatory consumes investment without delivering portfolio value; executive trust in AI delivery erodes over time.',
    commonSignals: ['gate_missing_inputs', 'executive_decision_needed'],
    requiredEvidence: [
      'Decision record naming the graduation criteria',
      'Pilot postmortem with explicit graduate / retire / re-scope decision',
      'Portfolio review entry tracking the pilot history',
    ],
    phaseWhereDetected: ['execute', 'verify'],
    recommendedIntervention:
      'Force a graduate / retire / re-scope decision at the next steering touchpoint; do not run another pilot in the same scope.',
    gateImplication: 'G4',
    deliverableImplication: 'evaluation_postmortem',
    primaryAgent: 'atlas',
    handoffAgents: ['steward'],
    createdFrom: 'deterministic_pattern_pack',
  },
  ai_tool_sprawl_without_value: {
    key: 'ai_tool_sprawl_without_value',
    name: 'AI tool sprawl without value',
    definition:
      'Multiple AI tools are licensed and rolled out across the org without a connected value chain. Spend grows; usage telemetry is partial; portfolio outcome is undefined.',
    whyItMatters:
      'Tool sprawl is the most common path to executive disappointment with AI: spend rises, productivity claims cannot be defended, and license rationalization becomes a board issue.',
    commonSignals: ['value_not_ready', 'evidence_not_ready', 'context_insufficient'],
    requiredEvidence: [
      'Per-tool seat / usage / cost telemetry',
      'Per-tool value claim with captured baseline + target',
      'Portfolio review entry naming the consolidation strategy',
    ],
    phaseWhereDetected: ['execute', 'verify', 'any'],
    recommendedIntervention:
      'Convene a portfolio AI tool rationalization review; require a value chain per tool before renewing any license.',
    gateImplication: 'G4',
    deliverableImplication: 'portfolio_review',
    primaryAgent: 'atlas',
    handoffAgents: ['steward', 'sentinel'],
    createdFrom: 'deterministic_pattern_pack',
  },
};

const PACK_KEYS_IN_ORDER: ReadonlyArray<AiProgramFailureKey> = [
  'weak_data_foundation',
  'poor_use_case_framing',
  'no_business_owner',
  'no_measurable_baseline',
  'no_value_ledger',
  'weak_workflow_integration',
  'tool_first_thinking',
  'missing_governance_risk',
  'no_adoption_change_plan',
  'no_operating_model_for_scale',
  'pilot_purgatory',
  'ai_tool_sprawl_without_value',
];

const ALL_PHASES: ReadonlyArray<AiProgramFailurePhase> = [
  'origination',
  'charter',
  'diagnose',
  'design',
  'execute',
  'verify',
  'any',
];

const ALL_GATES: ReadonlyArray<AiProgramFailureGate> = ['G1', 'G2', 'G3', 'G4', 'none'];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full pattern pack in canonical order. Pure: same call →
 * identical output.
 */
export function listAiProgramFailureModes(): ReadonlyArray<AiProgramFailureMode> {
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]);
}

/**
 * Return one failure mode by key. Pure. Returns null for unknown keys.
 */
export function getAiProgramFailureMode(
  key: string,
): AiProgramFailureMode | null {
  if (!isAiProgramFailureKey(key)) return null;
  return PACK[key];
}

/**
 * Map a deterministic signal-type list onto the failure modes whose
 * commonSignals overlap with the input. Pure.
 */
export function mapSignalsToFailureModes(
  signalTypes: ReadonlyArray<string>,
): ReadonlyArray<AiProgramFailureMode> {
  if (signalTypes.length === 0) return [];
  const validTypes = signalTypes.filter(isAiProgramFailureSignalType);
  if (validTypes.length === 0) return [];
  const set = new Set<AiProgramFailureSignalType>(validTypes);
  return PACK_KEYS_IN_ORDER.map((k) => PACK[k]).filter((mode) =>
    mode.commonSignals.some((s) => set.has(s)),
  );
}

/**
 * Aggregate counts by primary agent, phase, gate, and deliverable
 * implication. Pure.
 */
export function summarizeFailureModes(
  modes: ReadonlyArray<AiProgramFailureMode>,
): AiProgramFailureModeSummary {
  const byPrimaryAgent: Record<AiProgramFailureAgent, number> = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
  const byPhase: Record<AiProgramFailurePhase, number> = {
    origination: 0,
    charter: 0,
    diagnose: 0,
    design: 0,
    execute: 0,
    verify: 0,
    any: 0,
  };
  const byGate: Record<AiProgramFailureGate, number> = {
    G1: 0,
    G2: 0,
    G3: 0,
    G4: 0,
    none: 0,
  };
  const deliverables = new Set<AiProgramFailureDeliverable>();
  for (const m of modes) {
    byPrimaryAgent[m.primaryAgent] += 1;
    for (const p of m.phaseWhereDetected) byPhase[p] += 1;
    byGate[m.gateImplication] += 1;
    deliverables.add(m.deliverableImplication);
  }
  return {
    totalCount: modes.length,
    byPrimaryAgent,
    byPhase,
    byGate,
    uniqueDeliverableImplications: Array.from(deliverables).sort(),
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const AI_PROGRAM_FAILURE_KEYS_IN_ORDER: ReadonlyArray<AiProgramFailureKey> =
  PACK_KEYS_IN_ORDER;

export const AI_PROGRAM_FAILURE_PHASES: ReadonlyArray<AiProgramFailurePhase> = ALL_PHASES;

export const AI_PROGRAM_FAILURE_GATES: ReadonlyArray<AiProgramFailureGate> = ALL_GATES;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function isAiProgramFailureKey(value: string): value is AiProgramFailureKey {
  return (PACK_KEYS_IN_ORDER as ReadonlyArray<string>).includes(value);
}

const SIGNAL_TYPE_SET: ReadonlySet<AiProgramFailureSignalType> = new Set([
  'gate_missing_inputs',
  'evidence_not_ready',
  'value_not_ready',
  'deliverable_coverage_gap',
  'context_insufficient',
  'executive_decision_needed',
]);

function isAiProgramFailureSignalType(
  value: string,
): value is AiProgramFailureSignalType {
  return SIGNAL_TYPE_SET.has(value as AiProgramFailureSignalType);
}
