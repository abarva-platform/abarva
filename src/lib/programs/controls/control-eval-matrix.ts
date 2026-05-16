// Control and eval matrix · Wave 2, Slice 2.5.
//
// The risk-controls model for an agentic Move. Given a Move's solution
// archetype (Slice 0.2 taxonomy) and a few framing flags, this module
// produces the *applicable* control set — the specific controls a principal
// solution architect would require before that Move is allowed to
// productionise — together with a verification checklist and the eval / test
// obligations each control implies.
//
// Lineage: the control catalogue is structured on the NIST AI Risk
// Management Framework (GOVERN / MAP / MEASURE / MANAGE functions) and the
// NIST Secure Software Development Framework (SSDF) practices, intersected
// with AbarVa's own production-readiness gate (MOVES-AGENTIC-SHAPING-
// METHODOLOGY.md §5). Every control maps to one §5 gate item — the matrix is
// the bridge between an external governance standard and the hard gate a
// Move must pass.
//
// Pure module — types + a pure builder, no I/O, client- and server-safe.
// No UI, no DB, no shared-file edits. The Moves surface composes this where
// it shapes the Move's phase-gate criteria.
//
// Methodology: docs/strategy/MOVES-AGENTIC-SHAPING-METHODOLOGY.md §5.

import type {
  SolutionArchetype,
  SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';

// ─── Lineage taxonomy ───────────────────────────────────────────────────────

/**
 * The seven risk categories a control mitigates. These are the named risks
 * an agentic Move carries; every applicable control belongs to exactly one.
 */
export type RiskCategory =
  | 'hallucination'
  | 'phi_pii_exposure'
  | 'model_drift'
  | 'adoption_risk'
  | 'vendor_lock_in'
  | 'security_review'
  | 'human_approvals';

/**
 * NIST AI RMF core function the control sits under. GOVERN is cross-cutting;
 * MAP frames the risk, MEASURE quantifies it, MANAGE acts on it.
 */
export type NistRmfFunction = 'GOVERN' | 'MAP' | 'MEASURE' | 'MANAGE';

/**
 * The AbarVa production-readiness gate item (methodology §5) a control is
 * accountable to. Stable identifiers — used as gate reason codes.
 */
export type ReadinessGateItem =
  | 'evals_defined'
  | 'guardrails'
  | 'observability'
  | 'cost_model'
  | 'failure_modes'
  | 'accountable_owner'
  | 'rollback_kill_switch'
  | 'data_grounding'
  | 'security_privacy_review'
  | 'human_in_the_loop';

/**
 * How a control's effectiveness is verified before the gate is passed. A
 * control with no verification method is not a control — it is a hope.
 */
export type VerificationMethod =
  | 'automated_eval' // a passing eval-harness suite
  | 'red_team' // adversarial probing / jailbreak attempt
  | 'pen_test' // security penetration test
  | 'audit_review' // human review of an audit trail / log
  | 'sign_off' // a named owner's explicit approval
  | 'monitoring_alert' // a live alert proving observability
  | 'design_review'; // architecture / privacy review of the design

/** How strongly a control is required for a given Move. */
export type ControlEnforcement = 'mandatory' | 'recommended' | 'conditional';

// ─── Contracts ──────────────────────────────────────────────────────────────

/** A single test / eval obligation a control implies. */
export interface ControlTest {
  /** Stable id — used as a checklist key and telemetry code. */
  id: string;
  /** What the test proves. */
  description: string;
  /** How the test is run. */
  method: VerificationMethod;
}

/** One control in the matrix. */
export interface ControlDefinition {
  /** Stable control id, e.g. `ctrl.hallucination.grounded_output`. */
  id: string;
  /** Short control name — principal-architect voice. */
  name: string;
  /** The risk this control mitigates. */
  risk: RiskCategory;
  /** What the control does — one sentence. */
  mitigates: string;
  /** NIST AI RMF function the control sits under. */
  rmfFunction: NistRmfFunction;
  /** The §5 readiness gate item this control is accountable to. */
  gate: ReadinessGateItem;
  /** How the control is verified. */
  verification: VerificationMethod;
  /** The test / eval obligations the control implies. */
  tests: readonly ControlTest[];
  /**
   * Archetype keys this control applies to. An empty list means it applies
   * to every archetype (a universal / baseline control).
   */
  appliesTo: readonly SolutionArchetypeKey[];
  /**
   * Minimum agentic-ambition rung (Slice 0.2 `agenticAmbition`, 1..6) at or
   * above which the control becomes mandatory rather than recommended.
   */
  mandatoryAtAmbition: 1 | 2 | 3 | 4 | 5 | 6;
}

/** A control instantiated for a specific Move, with enforcement resolved. */
export interface AppliedControl extends ControlDefinition {
  /** Resolved enforcement for this Move. */
  enforcement: ControlEnforcement;
  /** Why this control applies / was escalated — practitioner voice. */
  rationale: string;
}

/** A single line on the verification checklist for a Move. */
export interface ChecklistItem {
  /** The control test this line verifies. */
  testId: string;
  /** The owning control. */
  controlId: string;
  /** Human-readable obligation. */
  label: string;
  /** Verification method. */
  method: VerificationMethod;
  /** §5 gate item this line is accountable to. */
  gate: ReadinessGateItem;
  /** True when this line must be green before the gate can pass. */
  blocking: boolean;
}

/** Coverage of one §5 readiness-gate item by the applied control set. */
export interface GateCoverage {
  gate: ReadinessGateItem;
  /** Count of applied controls accountable to this gate. */
  controlCount: number;
  /** True when at least one mandatory control covers the gate. */
  covered: boolean;
}

/** Optional framing flags that escalate or add controls for a Move. */
export interface MoveControlContext {
  /** The Move touches PHI / PII / regulated personal data. */
  handlesSensitiveData?: boolean;
  /** The Move is delivered via a third-party / proprietary vendor agent. */
  vendorDelivered?: boolean;
  /** The Move automates a customer- or patient-facing decision. */
  highStakesDecision?: boolean;
}

/** The full control + eval matrix produced for one Move. */
export interface ControlEvalMatrix {
  archetypeKey: SolutionArchetypeKey;
  archetypeName: string;
  /** The controls that apply to this Move, enforcement resolved. */
  controls: readonly AppliedControl[];
  /** The flat verification checklist across all applied controls. */
  checklist: readonly ChecklistItem[];
  /** Per-gate coverage roll-up across the §5 readiness gate. */
  gateCoverage: readonly GateCoverage[];
  /** §5 gate items with no mandatory control covering them. */
  uncoveredGates: readonly ReadinessGateItem[];
  /** Count of mandatory controls — the blocking set. */
  mandatoryCount: number;
}

// ─── Control catalogue ──────────────────────────────────────────────────────

/**
 * The full control catalogue. Structured on the NIST AI RMF functions and
 * SSDF practices, mapped onto AbarVa's §5 production-readiness gate. The
 * builder selects the applicable subset for a given Move.
 */
export const CONTROL_CATALOGUE: readonly ControlDefinition[] = [
  {
    id: 'ctrl.hallucination.grounded_output',
    name: 'Grounded-output eval',
    risk: 'hallucination',
    mitigates:
      'Every model claim on the critical path must be traceable to a tenant evidence source; ungrounded output is rejected.',
    rmfFunction: 'MEASURE',
    gate: 'evals_defined',
    verification: 'automated_eval',
    tests: [
      {
        id: 'test.hallucination.faithfulness',
        description:
          'Faithfulness eval — sampled outputs scored against their cited sources; pass bar agreed before launch.',
        method: 'automated_eval',
      },
      {
        id: 'test.hallucination.no_source_refusal',
        description:
          'Refusal eval — when no grounding source exists the agent abstains rather than fabricating.',
        method: 'automated_eval',
      },
    ],
    appliesTo: [
      'assistant',
      'retrieval_copilot',
      'human_in_loop_agent',
      'full_agentic_workflow',
    ],
    mandatoryAtAmbition: 3,
  },
  {
    id: 'ctrl.hallucination.output_guardrail',
    name: 'Output validation guardrail',
    risk: 'hallucination',
    mitigates:
      'A post-generation validator checks structure, citation presence, and prohibited-claim patterns before output reaches a user.',
    rmfFunction: 'MANAGE',
    gate: 'guardrails',
    verification: 'red_team',
    tests: [
      {
        id: 'test.hallucination.guardrail_redteam',
        description:
          'Red-team probe — adversarial prompts attempt to elicit fabricated or out-of-policy claims; guardrail must block them.',
        method: 'red_team',
      },
    ],
    appliesTo: [
      'assistant',
      'retrieval_copilot',
      'human_in_loop_agent',
      'full_agentic_workflow',
    ],
    mandatoryAtAmbition: 3,
  },
  {
    id: 'ctrl.phi_pii.data_minimization',
    name: 'PHI/PII minimization and masking',
    risk: 'phi_pii_exposure',
    mitigates:
      'Sensitive fields are masked or excluded from prompts and logs; only the minimum necessary data reaches the model.',
    rmfFunction: 'MANAGE',
    gate: 'security_privacy_review',
    verification: 'design_review',
    tests: [
      {
        id: 'test.phi_pii.prompt_scan',
        description:
          'Prompt and log scan — automated detector confirms no unmasked PHI/PII in model inputs or traces.',
        method: 'automated_eval',
      },
      {
        id: 'test.phi_pii.privacy_design_review',
        description:
          'Privacy design review — data-flow reviewed against the minimization standard and sign-off recorded.',
        method: 'design_review',
      },
    ],
    appliesTo: [],
    mandatoryAtAmbition: 1,
  },
  {
    id: 'ctrl.model_drift.regression_eval',
    name: 'Drift regression eval',
    risk: 'model_drift',
    mitigates:
      'A frozen regression suite re-runs on every model/prompt change and on a schedule; quality regressions block release.',
    rmfFunction: 'MEASURE',
    gate: 'evals_defined',
    verification: 'automated_eval',
    tests: [
      {
        id: 'test.model_drift.regression_suite',
        description:
          'Regression suite — golden-set evals re-run on model upgrade; score may not fall below the agreed bar.',
        method: 'automated_eval',
      },
    ],
    appliesTo: [
      'assistant',
      'retrieval_copilot',
      'human_in_loop_agent',
      'full_agentic_workflow',
    ],
    mandatoryAtAmbition: 3,
  },
  {
    id: 'ctrl.model_drift.quality_monitoring',
    name: 'Live quality monitoring',
    risk: 'model_drift',
    mitigates:
      'Production decision quality is tracked with alerting so silent drift is caught between scheduled evals.',
    rmfFunction: 'MEASURE',
    gate: 'observability',
    verification: 'monitoring_alert',
    tests: [
      {
        id: 'test.model_drift.alert_fires',
        description:
          'Alert test — a synthetic quality dip confirms the drift alert fires to the accountable owner.',
        method: 'monitoring_alert',
      },
    ],
    appliesTo: [],
    mandatoryAtAmbition: 2,
  },
  {
    id: 'ctrl.adoption.degradation_path',
    name: 'Graceful-degradation and adoption path',
    risk: 'adoption_risk',
    mitigates:
      'When the agent is unavailable or low-confidence the workflow degrades to a usable human path, protecting adoption.',
    rmfFunction: 'MANAGE',
    gate: 'failure_modes',
    verification: 'audit_review',
    tests: [
      {
        id: 'test.adoption.degradation_drill',
        description:
          'Degradation drill — agent disabled; the fallback human path is exercised and confirmed usable.',
        method: 'audit_review',
      },
    ],
    appliesTo: [],
    mandatoryAtAmbition: 2,
  },
  {
    id: 'ctrl.vendor.lock_in_exit',
    name: 'Vendor exit and portability review',
    risk: 'vendor_lock_in',
    mitigates:
      'Contract, data-portability, and model-substitution terms are reviewed so the Move is not trapped with one vendor.',
    rmfFunction: 'GOVERN',
    gate: 'cost_model',
    verification: 'design_review',
    tests: [
      {
        id: 'test.vendor.exit_review',
        description:
          'Exit review — data export, contract exit clauses, and a substitution plan are documented and reviewed.',
        method: 'design_review',
      },
    ],
    appliesTo: ['vendor_led_implementation'],
    mandatoryAtAmbition: 1,
  },
  {
    id: 'ctrl.security.review',
    name: 'Security review',
    risk: 'security_review',
    mitigates:
      'AI-specific attack surface — prompt injection, tool abuse, data exfiltration — is penetration-tested before launch.',
    rmfFunction: 'MAP',
    gate: 'security_privacy_review',
    verification: 'pen_test',
    tests: [
      {
        id: 'test.security.prompt_injection',
        description:
          'Prompt-injection pen test — untrusted content cannot redirect the agent or exfiltrate tenant data.',
        method: 'pen_test',
      },
      {
        id: 'test.security.tool_abuse',
        description:
          'Tool-abuse pen test — the agent cannot be coerced into out-of-scope tool calls or privilege escalation.',
        method: 'pen_test',
      },
    ],
    appliesTo: [],
    mandatoryAtAmbition: 2,
  },
  {
    id: 'ctrl.approvals.human_checkpoint',
    name: 'Human-in-the-loop approval checkpoint',
    risk: 'human_approvals',
    mitigates:
      'High-stakes actions require a named human to approve before execution; the approval is recorded in the audit trail.',
    rmfFunction: 'GOVERN',
    gate: 'human_in_the_loop',
    verification: 'sign_off',
    tests: [
      {
        id: 'test.approvals.checkpoint_enforced',
        description:
          'Checkpoint test — a high-stakes action cannot execute without a recorded human approval.',
        method: 'sign_off',
      },
    ],
    appliesTo: ['human_in_loop_agent', 'full_agentic_workflow'],
    mandatoryAtAmbition: 4,
  },
  {
    id: 'ctrl.approvals.kill_switch',
    name: 'Rollback and kill switch',
    risk: 'human_approvals',
    mitigates:
      'A tested kill switch can halt the agent and roll back its actions; ownership of the switch is named.',
    rmfFunction: 'MANAGE',
    gate: 'rollback_kill_switch',
    verification: 'audit_review',
    tests: [
      {
        id: 'test.approvals.kill_switch_drill',
        description:
          'Kill-switch drill — the switch is exercised in a non-prod run and the rollback is confirmed effective.',
        method: 'audit_review',
      },
    ],
    appliesTo: [],
    mandatoryAtAmbition: 3,
  },
  {
    id: 'ctrl.approvals.accountable_owner',
    name: 'Named accountable owner',
    risk: 'human_approvals',
    mitigates:
      'A single named person — not a team — is accountable for the Move in production, including its controls and incidents.',
    rmfFunction: 'GOVERN',
    gate: 'accountable_owner',
    verification: 'sign_off',
    tests: [
      {
        id: 'test.approvals.owner_recorded',
        description:
          'Owner record — a named individual is recorded as accountable and has signed off on the control set.',
        method: 'sign_off',
      },
    ],
    appliesTo: [],
    mandatoryAtAmbition: 1,
  },
];

/** Catalogue indexed by control id. */
export const CONTROL_BY_ID: Readonly<Record<string, ControlDefinition>> =
  Object.freeze(
    Object.fromEntries(CONTROL_CATALOGUE.map((c) => [c.id, c])),
  );

/** All §5 readiness-gate items, in methodology order. */
export const READINESS_GATE_ITEMS: readonly ReadinessGateItem[] = [
  'evals_defined',
  'guardrails',
  'observability',
  'cost_model',
  'failure_modes',
  'accountable_owner',
  'rollback_kill_switch',
  'data_grounding',
  'security_privacy_review',
  'human_in_the_loop',
];

// ─── Builder ────────────────────────────────────────────────────────────────

/**
 * True when a catalogue control is in scope for the given archetype. A
 * control with an empty `appliesTo` is universal (a baseline control).
 */
function controlApplies(
  control: ControlDefinition,
  archetypeKey: SolutionArchetypeKey,
): boolean {
  return (
    control.appliesTo.length === 0 ||
    control.appliesTo.includes(archetypeKey)
  );
}

/**
 * Resolve enforcement for an applied control given the Move's archetype
 * ambition and framing flags.
 */
function resolveEnforcement(
  control: ControlDefinition,
  ambition: number,
  context: MoveControlContext,
): { enforcement: ControlEnforcement; rationale: string } {
  // Sensitive-data framing makes every privacy / security control mandatory.
  if (
    context.handlesSensitiveData &&
    (control.risk === 'phi_pii_exposure' ||
      control.risk === 'security_review')
  ) {
    return {
      enforcement: 'mandatory',
      rationale:
        'Move handles PHI/PII — privacy and security controls are mandatory regardless of agentic ambition.',
    };
  }

  // High-stakes framing makes approval / oversight controls mandatory.
  if (context.highStakesDecision && control.risk === 'human_approvals') {
    return {
      enforcement: 'mandatory',
      rationale:
        'Move automates a high-stakes decision — human-oversight controls are mandatory.',
    };
  }

  // Vendor delivery makes lock-in review mandatory even at low ambition.
  if (context.vendorDelivered && control.risk === 'vendor_lock_in') {
    return {
      enforcement: 'mandatory',
      rationale:
        'Move is vendor-delivered — exit and portability review is mandatory before commitment.',
    };
  }

  if (ambition >= control.mandatoryAtAmbition) {
    return {
      enforcement: 'mandatory',
      rationale: `Agentic ambition (${ambition}) meets the control's mandatory threshold (${control.mandatoryAtAmbition}).`,
    };
  }

  return {
    enforcement: 'recommended',
    rationale: `Agentic ambition (${ambition}) is below the mandatory threshold (${control.mandatoryAtAmbition}); control is recommended.`,
  };
}

/**
 * Build the control and eval matrix for one Move.
 *
 * Pure: same archetype + context always yields the same matrix. The Moves
 * surface composes this into the Move's phase-gate criteria.
 */
export function buildControlEvalMatrix(
  archetype: SolutionArchetype,
  context: MoveControlContext = {},
): ControlEvalMatrix {
  const applicable = CONTROL_CATALOGUE.filter((c) =>
    controlApplies(c, archetype.key),
  );

  const controls: AppliedControl[] = applicable.map((control) => {
    const { enforcement, rationale } = resolveEnforcement(
      control,
      archetype.agenticAmbition,
      context,
    );
    return { ...control, enforcement, rationale };
  });

  const checklist: ChecklistItem[] = controls.flatMap((control) =>
    control.tests.map((test) => ({
      testId: test.id,
      controlId: control.id,
      label: test.description,
      method: test.method,
      gate: control.gate,
      blocking: control.enforcement === 'mandatory',
    })),
  );

  const gateCoverage: GateCoverage[] = READINESS_GATE_ITEMS.map((gate) => {
    const forGate = controls.filter((c) => c.gate === gate);
    return {
      gate,
      controlCount: forGate.length,
      covered: forGate.some((c) => c.enforcement === 'mandatory'),
    };
  });

  const uncoveredGates = gateCoverage
    .filter((g) => !g.covered)
    .map((g) => g.gate);

  return {
    archetypeKey: archetype.key,
    archetypeName: archetype.name,
    controls,
    checklist,
    gateCoverage,
    uncoveredGates,
    mandatoryCount: controls.filter((c) => c.enforcement === 'mandatory')
      .length,
  };
}
