// SR 11-7 model-risk control deliverable · Wave C2.
//
// For a regulated tenant (financial services), a Move's phase trace must
// carry an explicit, traceable model-risk-management deliverable. US bank
// supervisors expect any model in use — and an ML/agentic Move plainly is
// one — to be governed under the Federal Reserve / OCC supervisory guidance
// SR 11-7 "Guidance on Model Risk Management". A transformation plan that
// leaves model-risk controls implicit fails the regulator's first question.
//
// This module is the bridge between Slice 2.5's control & eval matrix
// (`@/lib/programs/controls/control-eval-matrix`) and the Move phase trace:
// it projects the regulatory subset of the applied control set onto SR 11-7's
// three expectations and packages them as a single first-class deliverable
// the Moves surface can surface in the trace.
//
// SR 11-7 expectations encoded (the three pillars of sound model risk
// management, per the guidance):
//
//   1. Model validation — "an effective validation framework": evaluation of
//      conceptual soundness, ongoing monitoring incl. process verification
//      and benchmarking, and outcomes analysis. Validation must be performed
//      by staff independent of model development and use.
//   2. Ongoing monitoring — models must be monitored on a continuing basis
//      once in use, to confirm they are performing as intended and to detect
//      change in the model, its inputs, or the environment (model drift).
//   3. Governance, policies & controls — a model risk management framework
//      with board/senior-management oversight, an accountable owner, a model
//      inventory, documentation, and an audit trail of model decisions.
//
// Lineage: the control catalogue is structured on the NIST AI RMF and the
// methodology §5 readiness gate (see control-eval-matrix.ts). This module
// adds the SR 11-7 *regulatory* lens on top — it does not re-author controls,
// it maps the already-applicable ones onto the supervisory expectations and
// flags the expectations that no applied control yet covers.
//
// Pure module — types + pure builders, no I/O, client- and server-safe.
// No UI, no DB, no shared-file edits, no Date.now / Math.random / fetch.
// The Moves surface composes this where it builds the Move phase trace.
//
// Scope: Moves only. Does NOT import Source / Tower / Intelligence /
// Codex-lane / voice-doctrine / data-plane modules.

import type {
  AppliedControl,
  ControlEnforcement,
  ControlEvalMatrix,
  RiskCategory,
} from '@/lib/programs/controls/control-eval-matrix';
import type { SolutionArchetypeKey } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';

// ─── Regulated-tenant detection ──────────────────────────────────────────────

/**
 * Industry codes that put a tenant under model-risk-management supervision.
 * SR 11-7 is Federal Reserve / OCC guidance — it binds banks and bank
 * holding companies. `FINSERV` is the canonical financial-services code
 * (see `@/lib/client-config` CLIENT_KEY_TO_INDUSTRY_CODE).
 */
export const SR_11_7_REGULATED_INDUSTRY_CODES: readonly string[] = [
  'FINSERV',
];

/**
 * True when a tenant's industry code places it under SR 11-7 model-risk
 * supervision. Case-insensitive; null / unknown codes are not regulated.
 */
export function isSr117RegulatedTenant(
  industryCode: string | null | undefined,
): boolean {
  if (!industryCode) return false;
  const normalized = industryCode.trim().toUpperCase();
  return SR_11_7_REGULATED_INDUSTRY_CODES.includes(normalized);
}

// ─── Solution-archetype resolution ───────────────────────────────────────────

/**
 * Resolve a Slice 0.2 solution archetype for a Move whose stored archetype
 * is the coarser program `ArchetypeKey` taxonomy (e.g. `ai_product_enablement`).
 *
 * SR 11-7 binds any model in use; for a regulated tenant a Move with no
 * explicitly-shaped solution archetype is treated as `human_in_loop_agent`
 * — the SR 11-7 First Capital scenario's own archetype call ("human-in-loop
 * assistant, explicitly not full agentic workflow", since regulatory
 * accountability makes autonomous decisioning a non-starter). This is a
 * conservative default: it triggers the validation, monitoring, and
 * approval controls a model-risk officer would expect.
 */
export function resolveSolutionArchetypeForMove(
  storedArchetype: string | null | undefined,
): SolutionArchetypeKey {
  const normalized = (storedArchetype ?? '').trim().toLowerCase();
  // A Move already carrying a Slice 0.2 archetype key is used as-is.
  const direct: readonly SolutionArchetypeKey[] = [
    'automation',
    'assistant',
    'retrieval_copilot',
    'human_in_loop_agent',
    'full_agentic_workflow',
    'data_remediation',
    'vendor_led_implementation',
    'process_redesign',
  ];
  if ((direct as readonly string[]).includes(normalized)) {
    return normalized as SolutionArchetypeKey;
  }
  // Otherwise: regulated Moves default to the model-risk-conservative rung.
  return 'human_in_loop_agent';
}

// ─── SR 11-7 expectations ────────────────────────────────────────────────────

/** The three pillars of sound model risk management under SR 11-7. */
export type Sr117ExpectationKey =
  | 'model_validation'
  | 'ongoing_monitoring'
  | 'governance';

/**
 * One SR 11-7 supervisory expectation, encoded as the methodology docs
 * encode expert frameworks: the regulator's words, the controls that
 * satisfy it, and the verification a validator would require.
 */
export interface Sr117Expectation {
  /** Stable key — used as a deliverable line id and telemetry code. */
  readonly key: Sr117ExpectationKey;
  /** Short expectation name — model-risk-officer voice. */
  readonly name: string;
  /** What the supervisory guidance expects — one paragraph. */
  readonly expectation: string;
  /**
   * The Slice 2.5 risk categories whose controls satisfy this expectation.
   * The builder maps applied controls onto expectations through these.
   */
  readonly satisfiedByRisks: readonly RiskCategory[];
}

/**
 * The SR 11-7 expectation catalogue — the regulator's three pillars,
 * encoded once. Order is contract (validation → monitoring → governance,
 * the guidance's own ordering).
 */
export const SR_11_7_EXPECTATIONS: readonly Sr117Expectation[] = [
  {
    key: 'model_validation',
    name: 'Model validation & independent review',
    expectation:
      'SR 11-7 requires an effective validation framework: evaluation of conceptual soundness, ongoing monitoring including benchmarking, and outcomes analysis — performed by staff independent of model development and use. For an ML/agentic Move this is the eval harness and adversarial testing of the model on the critical path, reviewed independently before production.',
    satisfiedByRisks: ['hallucination', 'model_drift'],
  },
  {
    key: 'ongoing_monitoring',
    name: 'Ongoing monitoring & drift detection',
    expectation:
      'SR 11-7 expects models to be monitored on a continuing basis once in use, to confirm they perform as intended and to detect change in the model, its inputs, or the environment. For an agentic Move this is live decision-quality monitoring with alerting and a frozen drift-regression suite that re-runs on every model or prompt change.',
    satisfiedByRisks: ['model_drift'],
  },
  {
    key: 'governance',
    name: 'Governance, accountable ownership & audit trail',
    expectation:
      'SR 11-7 requires a model risk management framework with board and senior-management oversight, a named accountable owner, policies and controls, and documentation — including an audit trail of model decisions and human approvals. For an agentic Move this is the named owner, the human-in-the-loop approval checkpoint, and the kill-switch / rollback control, all recorded.',
    satisfiedByRisks: ['human_approvals', 'security_review'],
  },
];

// ─── Contracts ───────────────────────────────────────────────────────────────

/** Coverage verdict for one SR 11-7 expectation. */
export type Sr117CoverageState =
  /** At least one mandatory applied control satisfies the expectation. */
  | 'satisfied'
  /** Only recommended (non-blocking) controls satisfy the expectation. */
  | 'partial'
  /** No applied control covers the expectation — a regulatory gap. */
  | 'uncovered';

/** One SR 11-7 expectation projected against a Move's applied controls. */
export interface Sr117ControlLine {
  readonly key: Sr117ExpectationKey;
  readonly name: string;
  /** The supervisory expectation, verbatim from the catalogue. */
  readonly expectation: string;
  /** Coverage verdict from the applied control set. */
  readonly coverage: Sr117CoverageState;
  /**
   * The applied controls (by id + name + enforcement) that satisfy this
   * expectation. Empty when the expectation is uncovered.
   */
  readonly satisfyingControls: readonly {
    readonly id: string;
    readonly name: string;
    readonly enforcement: ControlEnforcement;
  }[];
  /**
   * The control-test ids (from Slice 2.5's checklist) whose passing
   * evidences this expectation in the validation record.
   */
  readonly evidenceTestIds: readonly string[];
  /** Model-risk-officer reading of the coverage — one sentence. */
  readonly rationale: string;
}

/** Readiness verdict for the deliverable as a whole. */
export type Sr117ReadinessState =
  /** Every SR 11-7 expectation is satisfied by a mandatory control. */
  | 'ready'
  /** Expectations are covered but some only by recommended controls. */
  | 'hold'
  /** At least one expectation has no applied control — a regulatory gap. */
  | 'blocked';

/**
 * The SR 11-7 model-risk control deliverable for one Move — a first-class,
 * traceable artifact in the Move phase trace for regulated tenants.
 */
export interface Sr117ControlDeliverable {
  /** Stable deliverable type key — joins into the Move trace. */
  readonly typeKey: 'sr_11_7_control_matrix';
  /** Human-readable deliverable title. */
  readonly title: string;
  /** The regulatory framework this deliverable answers to. */
  readonly framework: 'Federal Reserve / OCC SR 11-7 — Model Risk Management';
  /** One line per SR 11-7 expectation, in guidance order. */
  readonly lines: readonly Sr117ControlLine[];
  /** Roll-up readiness verdict across the three expectations. */
  readonly readiness: Sr117ReadinessState;
  /** Expectations with no applied control — the regulatory gaps. */
  readonly uncoveredExpectations: readonly Sr117ExpectationKey[];
  /** Count of expectations satisfied by a mandatory control. */
  readonly satisfiedCount: number;
  /** Advisory — this is a read-model, no gate state is flipped. */
  readonly caveat: string;
}

// ─── Builder ─────────────────────────────────────────────────────────────────

const READINESS_CAVEAT =
  'Advisory read-model. This deliverable projects the Slice 2.5 control matrix onto SR 11-7 expectations; it suggests a readiness verdict but does not flip the Move phase gate or record a model-validation sign-off.';

function coverageRationale(
  expectation: Sr117Expectation,
  coverage: Sr117CoverageState,
): string {
  switch (coverage) {
    case 'satisfied':
      return `A mandatory control covers ${expectation.name.toLowerCase()}; SR 11-7 evidence obligation is in the blocking checklist.`;
    case 'partial':
      return `${expectation.name} is addressed only by recommended controls — escalate to mandatory before a regulated Move can pass its phase gate.`;
    case 'uncovered':
      return `No applied control covers ${expectation.name.toLowerCase()} — a model-risk gap a validator or examiner would flag.`;
  }
}

/**
 * Build the SR 11-7 control deliverable from a Move's Slice 2.5 control &
 * eval matrix. Pure: the same matrix always yields the same deliverable.
 *
 * The deliverable is only meaningful for a regulated tenant; callers gate
 * on `isSr117RegulatedTenant` before surfacing it. This builder itself is
 * tenant-agnostic so it stays unit-testable in isolation.
 */
export function buildSr117ControlDeliverable(
  matrix: ControlEvalMatrix,
): Sr117ControlDeliverable {
  const lines: Sr117ControlLine[] = SR_11_7_EXPECTATIONS.map((expectation) => {
    const satisfying: AppliedControl[] = matrix.controls.filter((c) =>
      expectation.satisfiedByRisks.includes(c.risk),
    );
    const hasMandatory = satisfying.some(
      (c) => c.enforcement === 'mandatory',
    );

    let coverage: Sr117CoverageState;
    if (satisfying.length === 0) {
      coverage = 'uncovered';
    } else if (hasMandatory) {
      coverage = 'satisfied';
    } else {
      coverage = 'partial';
    }

    const satisfyingIds = new Set(satisfying.map((c) => c.id));
    const evidenceTestIds = matrix.checklist
      .filter((item) => satisfyingIds.has(item.controlId))
      .map((item) => item.testId);

    return {
      key: expectation.key,
      name: expectation.name,
      expectation: expectation.expectation,
      coverage,
      satisfyingControls: satisfying.map((c) => ({
        id: c.id,
        name: c.name,
        enforcement: c.enforcement,
      })),
      evidenceTestIds,
      rationale: coverageRationale(expectation, coverage),
    };
  });

  const uncoveredExpectations = lines
    .filter((l) => l.coverage === 'uncovered')
    .map((l) => l.key);
  const satisfiedCount = lines.filter(
    (l) => l.coverage === 'satisfied',
  ).length;

  let readiness: Sr117ReadinessState;
  if (uncoveredExpectations.length > 0) {
    readiness = 'blocked';
  } else if (satisfiedCount === lines.length) {
    readiness = 'ready';
  } else {
    readiness = 'hold';
  }

  return {
    typeKey: 'sr_11_7_control_matrix',
    title: 'SR 11-7 Model-Risk Control Matrix',
    framework: 'Federal Reserve / OCC SR 11-7 — Model Risk Management',
    lines,
    readiness,
    uncoveredExpectations,
    satisfiedCount,
    caveat: READINESS_CAVEAT,
  };
}
