// Mobilization plan generator · Wave 2, Slice 2.4.
//
// The pure builder that turns a *shaped* Move into an *executable* plan. By
// the time a Move reaches this slice it carries three artifacts:
//
//   - the workflow decomposition (Slice 2.2) — every task, decision, handoff,
//     exception, approval, and the controls each node needs;
//   - the solution-architecture option set (Slice 2.3) — the recommended way
//     to BUILD it, with the §4 reference-architecture component gaps; and
//   - the control & eval matrix (Slice 2.5) — the NIST-lineaged controls the
//     Move must pass before the §5 production-readiness gate.
//
// A principal solution architect's last shaping move is to sequence that into
// a 30/60/90 mobilization plan: who is on the squad, what the backlog looks
// like, what data work, integration work, and eval work must land, when the
// pilot runs, and how the change / adoption story is carried. The output is
// the document a delivery lead can actually execute against.
//
// Why this exists: a shaped idea with a decomposition, an architecture, and a
// control matrix is still not a plan. It does not say "in the first 30 days
// you stand up the broker connection and the eval corpus; the pilot is a
// day-60 milestone; rollout is gated on the security review closing." That
// sequencing — front-loading the readiness gaps, putting the pilot behind the
// controls that must be green, and naming the squad against the real work —
// is the expert value this module adds.
//
// The plan is *shaped by the inputs*, not by a template. A Move with open
// readiness gaps gets remediation work pulled into the first 30 days and its
// pilot pushed to day 90; a Move whose recommended architecture is already
// production-shaped gets a tighter plan with the pilot at day 60. A vendor-led
// delivery gets a vendor-onboarding workstream instead of a build backlog.
//
// Pure module — no I/O, client- and server-safe. Deterministic: the same
// three artifacts always yield the same plan. The Moves origination / charter
// path composes this; wiring is a separate follow-up and intentionally NOT in
// this file. This module ships no I/O, no React, and touches no shared file.
//
// Methodology: docs/strategy/MOVES-AGENTIC-SHAPING-METHODOLOGY.md §5–§9.

import {
  getSolutionArchetype,
  type DeliveryLean,
  type ReadinessDimension,
  type SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { WorkflowDecomposition } from '@/lib/programs/decomposition/workflow-decomposition';
import type {
  ReferenceComponent,
  SolutionArchitectureOption,
  SolutionArchitectureOptionSet,
} from '@/lib/programs/architecture/solution-architecture-options';
import type {
  ControlEvalMatrix,
  ReadinessGateItem,
} from '@/lib/programs/controls/control-eval-matrix';

// ─── Plan vocabulary ───────────────────────────────────────────────────────

/** The three time-boxed horizons of the mobilization plan. */
export type PlanHorizon = 'day_30' | 'day_60' | 'day_90';

/** Ordered canonical list of the horizons. */
export const PLAN_HORIZONS: readonly PlanHorizon[] = [
  'day_30',
  'day_60',
  'day_90',
];

/** Human-readable label for each horizon. */
export const PLAN_HORIZON_LABEL: Readonly<Record<PlanHorizon, string>> = {
  day_30: 'First 30 days',
  day_60: 'Days 31–60',
  day_90: 'Days 61–90',
};

/**
 * The workstreams a mobilization plan sequences. Each maps to a concern a
 * delivery lead must staff and track; a plan item belongs to exactly one.
 */
export type Workstream =
  /** Squad formation, RACI, and the accountable-owner appointment. */
  | 'squad'
  /** Connecting and remediating the tenant context / grounding sources. */
  | 'data'
  /** Wiring the agent to systems of record and the broker boundary. */
  | 'integration'
  /** Building the workflow nodes from the decomposition backlog. */
  | 'build'
  /** Standing up the eval corpus and the regression harness. */
  | 'evals'
  /** Implementing guardrails, security review, kill switch, observability. */
  | 'controls'
  /** Running the bounded pilot and reading its results. */
  | 'pilot'
  /** Production rollout and ramp past the pilot cohort. */
  | 'rollout'
  /** Change management, training, and the adoption story. */
  | 'change';

/** Ordered canonical list of the workstreams. */
export const WORKSTREAMS: readonly Workstream[] = [
  'squad',
  'data',
  'integration',
  'build',
  'evals',
  'controls',
  'pilot',
  'rollout',
  'change',
];

/** Human-readable label for each workstream. */
export const WORKSTREAM_LABEL: Readonly<Record<Workstream, string>> = {
  squad: 'Squad & accountability',
  data: 'Data & grounding',
  integration: 'Integration',
  build: 'Build backlog',
  evals: 'Evals & quality',
  controls: 'Controls & safety',
  pilot: 'Pilot',
  rollout: 'Rollout',
  change: 'Change & adoption',
};

// ─── Squad ─────────────────────────────────────────────────────────────────

/** One role on the mobilization squad. */
export interface SquadRole {
  /** Stable role key — used in RACI and telemetry. */
  key: string;
  /** Role title, principal-architect voice. */
  title: string;
  /** What this role is on the hook for. */
  responsibility: string;
  /**
   * True when the role is the single named accountable owner for the Move —
   * exactly one role carries this.
   */
  accountable: boolean;
}

// ─── Plan items ────────────────────────────────────────────────────────────

/** A single sequenced piece of work in the plan. */
export interface PlanItem {
  /** Stable id — e.g. `data-1`, `build-3`. Unique within a plan. */
  id: string;
  /** The horizon this item is scheduled into. */
  horizon: PlanHorizon;
  /** The workstream it belongs to. */
  workstream: Workstream;
  /** Short imperative label. */
  label: string;
  /** One-sentence description of the work. */
  description: string;
  /**
   * True when this item must complete before the pilot can run — it gates a
   * §5 readiness item or a §4 reference-architecture component.
   */
  blocksPilot: boolean;
  /**
   * Why the item is in this horizon — practitioner voice. Names the gap,
   * control, or decomposition node it is pulled from.
   */
  rationale: string;
}

/** A backlog epic derived from the workflow decomposition. */
export interface BacklogEpic {
  /** Stable id — mirrors a decomposition node id where one-to-one. */
  id: string;
  /** Epic title — the node label it builds. */
  title: string;
  /** The decomposition node kinds rolled into this epic. */
  buildsNodes: readonly string[];
  /** Rough relative size — drives horizon placement. */
  size: 'small' | 'medium' | 'large';
}

// ─── Plan contract ─────────────────────────────────────────────────────────

/** The full mobilization plan produced for one shaped Move. */
export interface MobilizationPlan {
  /** The Move text the plan was built from. */
  proposedMove: string;
  /** The recommended archetype the plan is shaped around. */
  archetype: SolutionArchetypeKey;
  /** Canonical display name of that archetype. */
  archetypeName: string;
  /** The recommended solution-architecture option id (from Slice 2.3). */
  architectureOptionId: string;
  /** The build/buy/orchestrate lean of the recommended option. */
  deliveryLean: DeliveryLean;
  /** The mobilization squad — roles, RACI, accountable owner. */
  squad: readonly SquadRole[];
  /** The build backlog — epics derived from the decomposition. */
  backlog: readonly BacklogEpic[];
  /** Every sequenced plan item, across all horizons and workstreams. */
  items: readonly PlanItem[];
  /**
   * The horizon the pilot is scheduled into. Pushed later when readiness
   * gaps or uncovered §5 gates mean the pilot cannot safely run at day 60.
   */
  pilotHorizon: PlanHorizon;
  /**
   * Plan items that gate the pilot — the work that must be green before the
   * pilot cohort sees the Move.
   */
  pilotGatingItems: readonly PlanItem[];
  /**
   * True when the recommended architecture option is already production-
   * shaped and no §5 gate is uncovered — the plan is on the tight path.
   */
  readyForTightPath: boolean;
  /** Senior-practitioner notes on how the plan was sequenced. */
  notes: readonly string[];
}

/** Input to the builder — the three shaped artifacts for one Move. */
export interface MobilizationPlanInput {
  /** The Slice 2.2 workflow decomposition. */
  decomposition: WorkflowDecomposition;
  /** The Slice 2.3 solution-architecture option set. */
  architecture: SolutionArchitectureOptionSet;
  /** The Slice 2.5 control & eval matrix. */
  controlMatrix: ControlEvalMatrix;
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/** Sequence counter for stable per-plan item ids. Reset per build. */
let _seq = 0;
/** Fresh, stable, per-plan id scoped to a workstream. */
function nextId(workstream: Workstream): string {
  _seq += 1;
  return `${workstream}-${_seq}`;
}

/** The recommended option from a Slice 2.3 option set. */
function recommendedOption(
  architecture: SolutionArchitectureOptionSet,
): SolutionArchitectureOption {
  const found = architecture.options.find(
    (o) => o.id === architecture.recommendedOptionId,
  );
  // The Slice 2.3 contract guarantees the recommended id is in the set; fall
  // back to the first option so this module never throws on a malformed set.
  return found ?? architecture.options[0];
}

/** Human-readable label for a §5 readiness-gate item. */
const GATE_LABEL: Readonly<Record<ReadinessGateItem, string>> = {
  evals_defined: 'eval corpus defined',
  guardrails: 'guardrails in place',
  observability: 'observability wired',
  cost_model: 'cost model agreed',
  failure_modes: 'failure modes handled',
  accountable_owner: 'accountable owner named',
  rollback_kill_switch: 'rollback / kill switch tested',
  data_grounding: 'data grounding ready',
  security_privacy_review: 'security / privacy review passed',
  human_in_the_loop: 'human-in-the-loop checkpoint enforced',
};

/** Human-readable label for a §4 reference-architecture component. */
const COMPONENT_LABEL: Readonly<Record<ReferenceComponent, string>> = {
  grounding_context: 'grounding / context layer',
  broker_boundary: 'retrieval / broker boundary',
  guardrails: 'guardrails',
  evals: 'evals',
  observability: 'observability',
  human_in_loop: 'human-in-the-loop',
  cost_latency: 'cost & latency control',
  lifecycle_versioning: 'lifecycle / versioning',
};

/** The readiness dimensions with an open gap on the 2.2 decomposition. */
function openDimensions(
  decomposition: WorkflowDecomposition,
): ReadonlySet<ReadinessDimension> {
  const dims = new Set<ReadinessDimension>();
  for (const control of decomposition.blockedControls) {
    if (control.blockedBy) dims.add(control.blockedBy);
  }
  return dims;
}

// ─── Squad builder ─────────────────────────────────────────────────────────

/**
 * Compose the mobilization squad. The base squad — accountable owner, solution
 * architect, delivery lead — is always present; the archetype and delivery
 * lean add or drop specialist roles. Exactly one role is `accountable`.
 */
function buildSquad(
  archetype: SolutionArchetypeKey,
  option: SolutionArchitectureOption,
  controlMatrix: ControlEvalMatrix,
): SquadRole[] {
  const squad: SquadRole[] = [
    {
      key: 'accountable_owner',
      title: 'Accountable business owner',
      responsibility:
        'The single named person accountable for the Move in production — its outcomes, its controls, and its incidents.',
      accountable: true,
    },
    {
      key: 'solution_architect',
      title: 'Solution architect',
      responsibility:
        'Owns the architecture, the §4 component coverage, and the readiness-gate plan from shaping through go-live.',
      accountable: false,
    },
    {
      key: 'delivery_lead',
      title: 'Delivery lead',
      responsibility:
        'Runs the 30/60/90 plan, the squad, and the workstream dependencies; the day-to-day execution owner.',
      accountable: false,
    },
  ];

  // A build-heavy delivery needs engineering capacity; a vendor-led one needs
  // a vendor-management role instead.
  if (option.deliveryLean === 'buy') {
    squad.push({
      key: 'vendor_manager',
      title: 'Vendor delivery manager',
      responsibility:
        'Owns the vendor relationship, the onboarding, and the exit / portability terms; the lock-in line of defence.',
      accountable: false,
    });
  } else {
    squad.push({
      key: 'agent_engineer',
      title: 'Agent / platform engineer',
      responsibility:
        'Builds the workflow nodes, the tool surface, the broker integration, and the model-gateway wiring.',
      accountable: false,
    });
  }

  // Any archetype that grounds on the tenant context layer needs a data owner.
  if (
    archetype !== 'automation' &&
    archetype !== 'process_redesign'
  ) {
    squad.push({
      key: 'data_owner',
      title: 'Data / grounding owner',
      responsibility:
        'Owns the context sources the agent grounds on — connection, freshness, and remediation of any data gap.',
      accountable: false,
    });
  }

  // An eval engineer is needed whenever the control matrix carries an
  // eval-defined gate obligation.
  const needsEvals = controlMatrix.controls.some(
    (c) => c.gate === 'evals_defined',
  );
  if (needsEvals) {
    squad.push({
      key: 'eval_engineer',
      title: 'Eval engineer',
      responsibility:
        'Builds the golden + adversarial + regression corpus and wires the eval harness into CI.',
      accountable: false,
    });
  }

  // A security reviewer is needed whenever a security / privacy gate is in
  // scope for this Move.
  const needsSecurity = controlMatrix.controls.some(
    (c) => c.gate === 'security_privacy_review',
  );
  if (needsSecurity) {
    squad.push({
      key: 'security_reviewer',
      title: 'Security & privacy reviewer',
      responsibility:
        'Runs the AI-specific security / privacy review — prompt injection, tool abuse, PHI/PII exposure.',
      accountable: false,
    });
  }

  // Every Move that changes how people work needs a change lead.
  squad.push({
    key: 'change_lead',
    title: 'Change & adoption lead',
    responsibility:
      'Owns the adoption story — training, the human fallback path, and the cutover communications.',
    accountable: false,
  });

  return squad;
}

// ─── Backlog builder ───────────────────────────────────────────────────────

/**
 * Derive the build backlog from the workflow decomposition. Each consequential
 * node (task / decision / approval / exception) becomes an epic; the riskier
 * the node, the larger the epic. Pure intake/validation nodes are folded into
 * a single scaffold epic so the backlog reads at the right altitude.
 */
function buildBacklog(
  decomposition: WorkflowDecomposition,
): BacklogEpic[] {
  const epics: BacklogEpic[] = [];

  // One scaffold epic covers the always-present intake + verify/close nodes.
  const scaffoldNodes = decomposition.nodes
    .filter(
      (n) =>
        n.kind === 'task' &&
        (n.label.startsWith('Intake') ||
          n.label.startsWith('Verify') ||
          n.label.startsWith('Reconcile')),
    )
    .map((n) => n.id);
  if (scaffoldNodes.length > 0) {
    epics.push({
      id: 'epic-scaffold',
      title: 'Workflow scaffold — intake, validation, and close',
      buildsNodes: scaffoldNodes,
      size: 'small',
    });
  }

  // Each remaining node becomes its own epic, sized by risk.
  for (const node of decomposition.nodes) {
    if (scaffoldNodes.includes(node.id)) continue;
    const size: BacklogEpic['size'] =
      node.risk === 'high'
        ? 'large'
        : node.risk === 'medium'
          ? 'medium'
          : 'small';
    epics.push({
      id: `epic-${node.id}`,
      title: node.label,
      buildsNodes: [node.id],
      size,
    });
  }

  return epics;
}

// ─── Plan-item builders ────────────────────────────────────────────────────

/** Append a plan item, returning it so callers can collect gating items. */
function item(
  items: PlanItem[],
  horizon: PlanHorizon,
  workstream: Workstream,
  label: string,
  description: string,
  blocksPilot: boolean,
  rationale: string,
): PlanItem {
  const planItem: PlanItem = {
    id: nextId(workstream),
    horizon,
    workstream,
    label,
    description,
    blocksPilot,
    rationale,
  };
  items.push(planItem);
  return planItem;
}

/**
 * Build every sequenced plan item. The shape of the plan is driven by the
 * three artifacts: readiness gaps front-load into day 30, uncovered §5 gates
 * become controls work that gates the pilot, and the pilot lands at day 60 or
 * day 90 depending on how much gating work there is.
 */
function buildItems(
  input: MobilizationPlanInput,
  option: SolutionArchitectureOption,
  pilotHorizon: PlanHorizon,
): PlanItem[] {
  const { decomposition, architecture, controlMatrix } = input;
  const items: PlanItem[] = [];
  const openDims = openDimensions(decomposition);
  const uncoveredGates = new Set(controlMatrix.uncoveredGates);

  // ── Squad workstream — always day 30. ────────────────────────────────────
  item(
    items,
    'day_30',
    'squad',
    'Stand up the squad and name the accountable owner',
    'Form the mobilization squad, agree the RACI, and record the single named accountable business owner.',
    true,
    'A named accountable owner is a §5 gate item — the plan cannot proceed without it.',
  );

  // ── Data / grounding workstream. ─────────────────────────────────────────
  const dataGapOpen = openDims.has('data');
  if (option.dataSources.length > 0) {
    item(
      items,
      'day_30',
      'data',
      dataGapOpen
        ? 'Remediate the data gap and connect grounding sources'
        : 'Connect the grounding sources to the broker',
      dataGapOpen
        ? 'Close the open data-readiness gap, then connect and index the tenant context sources the agent grounds on.'
        : 'Connect and index the tenant context sources the agent grounds on, through the broker boundary.',
      true,
      dataGapOpen
        ? 'An open data-readiness gap blocks grounding — remediation is front-loaded into the first 30 days.'
        : 'Grounding must be live before the agent can be built against it.',
    );
  }

  // ── Integration workstream. ──────────────────────────────────────────────
  if (option.integrationNeeds.length > 0) {
    const integrationHorizon: PlanHorizon = dataGapOpen ? 'day_60' : 'day_30';
    item(
      items,
      integrationHorizon,
      'integration',
      'Wire the agent to the systems of record',
      `Complete the integration work the architecture requires: ${option.integrationNeeds.join('; ')}.`,
      true,
      dataGapOpen
        ? 'Integration follows data remediation — it cannot start until grounding is stable.'
        : 'Integration is on the critical path to the first end-to-end run.',
    );
  }

  // ── Build workstream — backlog epics across day 30 and day 60. ───────────
  item(
    items,
    'day_30',
    'build',
    'Build the workflow scaffold and the read-only path',
    'Build the intake, validation, grounding, and reasoning nodes — the read-only path that produces a proposed output.',
    true,
    'The read-only path is the foundation every later node depends on.',
  );
  const takesAction = decomposition.nodes.some(
    (n) => n.label.startsWith('Execute'),
  );
  if (takesAction) {
    item(
      items,
      'day_60',
      'build',
      'Build the action path behind its checkpoint',
      'Build the decision, approval, and action nodes — the consequential path, gated behind its human checkpoint.',
      true,
      'The action path carries the blast radius; it is built after the read-only path is proven.',
    );
  }
  if (decomposition.exceptionCount > 0) {
    item(
      items,
      'day_60',
      'build',
      'Build the exception and escalation paths',
      'Implement the named exception handlers and the graceful-degradation escalation to a human owner.',
      true,
      'Named exception paths must exist before the pilot — a silent drop is not acceptable.',
    );
  }

  // ── Evals workstream. ────────────────────────────────────────────────────
  const evalGapOpen = openDims.has('eval');
  const needsEvals = controlMatrix.controls.some(
    (c) => c.gate === 'evals_defined',
  );
  if (needsEvals) {
    item(
      items,
      'day_30',
      'evals',
      'Build the eval corpus',
      'Assemble the golden + adversarial eval corpus so reasoning quality is measurable before the agent is trusted.',
      true,
      evalGapOpen
        ? 'Eval maturity is an open readiness gap — the corpus is front-loaded so quality can be measured at all.'
        : 'An eval corpus is a §5 gate item; it must exist before the pilot can read results.',
    );
    item(
      items,
      'day_60',
      'evals',
      'Wire the regression harness into CI',
      'Wire the regression suite into CI so every model / prompt change is scored against the agreed quality bar.',
      true,
      'Regression evals catch drift; they gate the pilot so a quality regression cannot ship silently.',
    );
  }

  // ── Controls workstream — one item per uncovered §5 gate, plus the
  //    baseline controls every Move carries. ───────────────────────────────
  for (const gate of controlMatrix.uncoveredGates) {
    item(
      items,
      'day_60',
      'controls',
      `Close the ${GATE_LABEL[gate]} gate`,
      `Implement and verify the controls accountable to the §5 ${GATE_LABEL[gate]} gate — currently uncovered.`,
      true,
      `The §5 ${GATE_LABEL[gate]} gate has no mandatory control covering it — it must close before the pilot.`,
    );
  }
  const securityGateInScope = controlMatrix.controls.some(
    (c) => c.gate === 'security_privacy_review',
  );
  if (securityGateInScope && !uncoveredGates.has('security_privacy_review')) {
    item(
      items,
      'day_60',
      'controls',
      'Run the security and privacy review',
      'Penetration-test the AI attack surface — prompt injection, tool abuse, data exfiltration — and record sign-off.',
      true,
      'The security / privacy review is a §5 gate item and a hard blocker on the pilot.',
    );
  }
  item(
    items,
    'day_60',
    'controls',
    'Implement guardrails, observability, and the kill switch',
    'Stand up the post-generation guardrails, decision tracing / quality metrics, and a tested rollback / kill switch.',
    true,
    'Guardrails, observability, and a kill switch are §5 gate items — the pilot is unsafe without them.',
  );

  // ── §4 component-gap items — architecture work the recommended option
  //    still owes before it is production-shaped. ──────────────────────────
  for (const component of architecture.openComponentGaps) {
    // Skip components already covered by a controls or data item above.
    if (component === 'grounding_context' && option.dataSources.length > 0) {
      continue;
    }
    item(
      items,
      'day_60',
      'controls',
      `Harden the ${COMPONENT_LABEL[component]} component`,
      `Lift the §4 ${COMPONENT_LABEL[component]} component from partial to native coverage in the chosen architecture.`,
      true,
      `The recommended architecture option leaves the §4 ${COMPONENT_LABEL[component]} component below native — it must be hardened before go-live.`,
    );
  }

  // ── Pilot workstream. ────────────────────────────────────────────────────
  item(
    items,
    pilotHorizon,
    'pilot',
    'Run the bounded pilot',
    'Run the Move with a bounded cohort, every gating control green, and read the eval + adoption results before ramping.',
    false,
    pilotHorizon === 'day_90'
      ? 'The pilot is at day 90 — open readiness gaps and uncovered §5 gates need the first 60 days to close.'
      : 'With no open gates the pilot can run at day 60, leaving day 90 for rollout.',
  );

  // ── Change / adoption workstream — runs alongside, lands before the
  //    pilot so the cohort is prepared. ────────────────────────────────────
  item(
    items,
    'day_30',
    'change',
    'Map the impacted roles and the human fallback path',
    'Identify the people whose work changes, design the human fallback for low-confidence cases, and plan the training.',
    false,
    'Adoption is designed from day one — the human fallback path is part of the workflow, not an afterthought.',
  );
  item(
    items,
    pilotHorizon,
    'change',
    'Train the pilot cohort and brief the accountable owner',
    'Deliver training to the pilot cohort and walk the accountable owner through the controls and the kill switch.',
    false,
    'The pilot cohort must be trained before they see the Move — adoption risk is a named §5 failure mode.',
  );

  // ── Rollout workstream — always day 90, gated on a clean pilot. ──────────
  item(
    items,
    'day_90',
    'rollout',
    'Ramp past the pilot cohort',
    'On a clean pilot, ramp the Move past the pilot cohort under live quality monitoring and the standing kill switch.',
    false,
    'Rollout is gated on a clean pilot read — it is never scheduled ahead of the pilot result.',
  );

  return items;
}

// ─── Pilot scheduling ──────────────────────────────────────────────────────

/**
 * Decide which horizon the pilot lands in. The pilot is at day 60 only when
 * the Move is on the tight path — the recommended architecture is production-
 * shaped and every §5 gate is covered. Any open readiness gap, uncovered
 * gate, or §4 component gap pushes the pilot to day 90 so the gating work has
 * the first 60 days to close.
 */
function schedulePilot(input: MobilizationPlanInput): {
  pilotHorizon: PlanHorizon;
  readyForTightPath: boolean;
} {
  const { decomposition, architecture, controlMatrix } = input;
  const option = recommendedOption(architecture);
  const hasReadinessGap = openDimensions(decomposition).size > 0;
  const hasUncoveredGate = controlMatrix.uncoveredGates.length > 0;
  const hasComponentGap = architecture.openComponentGaps.length > 0;
  const readyForTightPath =
    option.productionShaped &&
    !hasReadinessGap &&
    !hasUncoveredGate &&
    !hasComponentGap;
  return {
    pilotHorizon: readyForTightPath ? 'day_60' : 'day_90',
    readyForTightPath,
  };
}

// ─── Notes ─────────────────────────────────────────────────────────────────

/** Senior-practitioner notes on how the plan was sequenced. */
function buildNotes(
  input: MobilizationPlanInput,
  option: SolutionArchitectureOption,
  pilotHorizon: PlanHorizon,
  readyForTightPath: boolean,
): string[] {
  const { decomposition, architecture, controlMatrix } = input;
  const notes: string[] = [];
  const archetypeName = getSolutionArchetype(
    decomposition.archetype,
  ).name;

  notes.push(
    `Mobilization plan shaped around the ${archetypeName} archetype and the "${option.name}" architecture option — the responsible target from shaping, not the customer's framing.`,
  );

  if (readyForTightPath) {
    notes.push(
      'The recommended architecture is production-shaped with every §5 gate covered — the plan is on the tight path with the pilot at day 60.',
    );
  } else {
    const reasons: string[] = [];
    if (openDimensions(decomposition).size > 0) {
      reasons.push(
        `${openDimensions(decomposition).size} open readiness gap(s)`,
      );
    }
    if (controlMatrix.uncoveredGates.length > 0) {
      reasons.push(
        `${controlMatrix.uncoveredGates.length} uncovered §5 gate(s)`,
      );
    }
    if (architecture.openComponentGaps.length > 0) {
      reasons.push(
        `${architecture.openComponentGaps.length} §4 component gap(s)`,
      );
    }
    notes.push(
      `The pilot is at ${PLAN_HORIZON_LABEL[pilotHorizon].toLowerCase()} — ${reasons.join(', ')} must close in the first 60 days before the pilot can safely run.`,
    );
  }

  const blockedControls = decomposition.blockedControls.length;
  if (blockedControls > 0) {
    notes.push(
      `${blockedControls} workflow control(s) cannot yet be implemented — the affected build epics are gated on the readiness work scheduled in the first 30 days.`,
    );
  }

  if (controlMatrix.mandatoryCount > 0) {
    notes.push(
      `${controlMatrix.mandatoryCount} mandatory control(s) from the §5 matrix must be green before the pilot — they are the pilot-gating set.`,
    );
  }

  if (option.deliveryLean === 'buy') {
    notes.push(
      'Delivery leans vendor-led — a vendor delivery manager owns onboarding and the exit / portability terms in place of a build squad.',
    );
  }

  return notes;
}

// ─── Entry point ───────────────────────────────────────────────────────────

/**
 * Build the mobilization plan for a shaped Move.
 *
 * The single entry point the Moves origination / charter path composes. Pure
 * and deterministic: the same three artifacts always yield the same plan. The
 * plan is shaped entirely by the decomposition's readiness gaps, the
 * architecture's §4 component coverage, and the control matrix's §5 gate
 * coverage — never by a static template.
 */
export function buildMobilizationPlan(
  input: MobilizationPlanInput,
): MobilizationPlan {
  _seq = 0; // deterministic ids per plan
  const { decomposition, architecture, controlMatrix } = input;
  const option = recommendedOption(architecture);
  const { pilotHorizon, readyForTightPath } = schedulePilot(input);

  const squad = buildSquad(decomposition.archetype, option, controlMatrix);
  const backlog = buildBacklog(decomposition);
  const items = buildItems(input, option, pilotHorizon);
  const pilotGatingItems = items.filter((i) => i.blocksPilot);

  return {
    proposedMove: decomposition.proposedMove,
    archetype: decomposition.archetype,
    archetypeName: getSolutionArchetype(decomposition.archetype).name,
    architectureOptionId: option.id,
    deliveryLean: option.deliveryLean,
    squad,
    backlog,
    items,
    pilotHorizon,
    pilotGatingItems,
    readyForTightPath,
    notes: buildNotes(input, option, pilotHorizon, readyForTightPath),
  };
}
