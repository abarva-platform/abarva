// Workflow decomposition canvas · Wave 2, Slice 2.2.
//
// Converts an "AI idea" — a proposed Move plus its Slice 2.1 agentic-
// suitability assessment — into an *implementable workflow architecture*: a
// structured breakdown of tasks, decisions, handoffs, exceptions, human
// approvals, and controls.
//
// Why this exists: a CXO arrives with "an AI agent that resolves customer
// issues end-to-end". That sentence is not buildable. A principal solution
// architect's first move is to decompose it — name every step, mark where a
// model makes a judgement, mark where a human stays accountable, name the
// exceptions, and attach the controls each step needs. The output is the raw
// material the Slice 2.4 mobilization plan turns into a backlog.
//
// The decomposition is *shaped by the recommended archetype*, not the
// customer's framing. A Move stepped down from full_agentic_workflow to
// human_in_loop_agent gets human-approval checkpoints on its consequential
// steps; an automation gets a deterministic reconciliation step instead of an
// eval gate. Readiness gaps from 2.1 surface as controls that are not yet
// satisfiable — the honest "you cannot build this step until gate X closes".
//
// Pure module — no I/O, client- and server-safe. Deterministic: the same
// proposed Move + assessment always yields the same canvas. The Moves
// origination/charter path composes this; wiring is a separate follow-up and
// intentionally NOT in this file.
//
// Methodology: docs/strategy/MOVES-AGENTIC-SHAPING-METHODOLOGY.md §4–§6, §8.

import {
  getSolutionArchetype,
  type ReadinessDimension,
  type SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { SuitabilityAssessment } from '@/lib/programs/suitability/agentic-suitability';

// ─── Node kinds ────────────────────────────────────────────────────────────

/** The kind of a workflow node — the discriminant of `WorkflowNode`. */
export type WorkflowNodeKind =
  /** A unit of work — retrieval, generation, a tool call, a data write. */
  | 'task'
  /** A branch point where an outcome routes the flow. */
  | 'decision'
  /** A transfer of the work item between an agent and a human, or systems. */
  | 'handoff'
  /** A named off-path case the workflow must handle, not ignore. */
  | 'exception'
  /** A point where an accountable human must approve before the flow proceeds. */
  | 'approval';

/** Who (or what) executes a node. */
export type NodeActor = 'agent' | 'human' | 'system' | 'agent_with_human_review';

/** Consequence weight of a node — drives where approvals and controls land. */
export type NodeRisk = 'low' | 'medium' | 'high';

/**
 * A control attached to a node — drawn from the §4 reference architecture.
 * `satisfiable` is false when a Slice 2.1 readiness gap means the tenant
 * cannot yet implement this control; that is the honest blocker, not a
 * silent omission.
 */
export interface NodeControl {
  /** Reference-architecture control category. */
  kind:
    | 'grounding'
    | 'guardrail'
    | 'eval'
    | 'observability'
    | 'human_checkpoint'
    | 'rollback'
    | 'cost_latency';
  /** What the control does, in senior-practitioner voice. */
  description: string;
  /**
   * False when an open readiness gap (from the 2.1 assessment) means this
   * control cannot yet be built — the dimension is named in `blockedBy`.
   */
  satisfiable: boolean;
  /** The readiness dimension blocking this control, when not satisfiable. */
  blockedBy: ReadinessDimension | null;
}

/** A single node in the decomposed workflow. */
export interface WorkflowNode {
  /** Stable id, unique within a canvas — e.g. `task-1`, `approval-2`. */
  id: string;
  kind: WorkflowNodeKind;
  /** Short imperative label — e.g. "Retrieve account history". */
  label: string;
  /** One-sentence description of what happens at this node. */
  description: string;
  actor: NodeActor;
  risk: NodeRisk;
  /** Ids of the nodes that must complete before this one runs. */
  dependsOn: readonly string[];
  /** Controls this node needs to be production-safe. */
  controls: readonly NodeControl[];
}

/** The decomposed workflow architecture for one proposed Move. */
export interface WorkflowDecomposition {
  /** The Move text the canvas was decomposed from. */
  proposedMove: string;
  /** The archetype the decomposition is shaped for (the 2.1 recommendation). */
  archetype: SolutionArchetypeKey;
  /** Canonical display name of that archetype. */
  archetypeName: string;
  /** The ordered nodes — topologically sorted by `dependsOn`. */
  nodes: readonly WorkflowNode[];
  /** Count of nodes that require an accountable human approval. */
  approvalCount: number;
  /** Count of named exception paths. */
  exceptionCount: number;
  /**
   * Controls that cannot yet be implemented because a 2.1 readiness gap is
   * open — surfaced at canvas level so the CXO sees the build is gated.
   */
  blockedControls: readonly NodeControl[];
  /** Senior-practitioner notes on how the canvas was shaped. */
  notes: readonly string[];
}

// ─── Archetype → workflow shape ────────────────────────────────────────────

/**
 * How agentic each archetype's critical-path tasks are. Drives the actor on
 * generated task nodes and whether approval checkpoints are inserted.
 */
interface ArchetypeShape {
  /** Default actor for the core work tasks. */
  taskActor: NodeActor;
  /** True when consequential tasks need a human approval node before them. */
  needsApproval: boolean;
  /** True when the workflow takes a consequential action (a write / decision). */
  takesAction: boolean;
  /** True when an eval gate belongs on generative nodes. */
  needsEvalGate: boolean;
}

const ARCHETYPE_SHAPE: Readonly<Record<SolutionArchetypeKey, ArchetypeShape>> = {
  automation: {
    taskActor: 'system',
    needsApproval: false,
    takesAction: true,
    needsEvalGate: false,
  },
  assistant: {
    taskActor: 'agent_with_human_review',
    needsApproval: false,
    takesAction: false,
    needsEvalGate: true,
  },
  retrieval_copilot: {
    taskActor: 'agent_with_human_review',
    needsApproval: false,
    takesAction: false,
    needsEvalGate: true,
  },
  human_in_loop_agent: {
    taskActor: 'agent',
    needsApproval: true,
    takesAction: true,
    needsEvalGate: true,
  },
  full_agentic_workflow: {
    taskActor: 'agent',
    needsApproval: false,
    takesAction: true,
    needsEvalGate: true,
  },
  data_remediation: {
    taskActor: 'system',
    needsApproval: false,
    takesAction: true,
    needsEvalGate: false,
  },
  vendor_led_implementation: {
    taskActor: 'system',
    needsApproval: false,
    takesAction: true,
    needsEvalGate: true,
  },
  process_redesign: {
    taskActor: 'human',
    needsApproval: false,
    takesAction: false,
    needsEvalGate: false,
  },
};

// ─── Readiness-gap → control blocking ──────────────────────────────────────

/**
 * Map of open readiness dimensions, derived from the 2.1 assessment's gaps.
 * A control whose dimension is in this set is not yet satisfiable.
 */
function openDimensions(assessment: SuitabilityAssessment): ReadonlySet<ReadinessDimension> {
  return new Set(assessment.readinessGaps.map((g) => g.dimension));
}

/** Build one control, marking it blocked when its dimension has an open gap. */
function control(
  kind: NodeControl['kind'],
  description: string,
  dimension: ReadinessDimension | null,
  open: ReadonlySet<ReadinessDimension>,
): NodeControl {
  const blocked = dimension !== null && open.has(dimension);
  return {
    kind,
    description,
    satisfiable: !blocked,
    blockedBy: blocked ? dimension : null,
  };
}

// ─── Node builders ─────────────────────────────────────────────────────────

let _seq = 0;
/** Fresh, stable, per-canvas node id. Reset at the top of `decomposeWorkflow`. */
function nextId(kind: WorkflowNodeKind): string {
  _seq += 1;
  return `${kind}-${_seq}`;
}

/**
 * The canonical agentic workflow skeleton, in §4 reference-architecture order:
 * intake → ground/retrieve → reason/plan → [act] → verify → close. Each
 * archetype keeps or drops stages; an automation has no reasoning stage, a
 * copilot has no action stage, and so on.
 */
function buildNodes(
  assessment: SuitabilityAssessment,
  open: ReadonlySet<ReadinessDimension>,
): WorkflowNode[] {
  const shape = ARCHETYPE_SHAPE[assessment.recommendedArchetype];
  const nodes: WorkflowNode[] = [];

  // 1. Intake — capture and validate the work item. Always present.
  const intake: WorkflowNode = {
    id: nextId('task'),
    kind: 'task',
    label: 'Intake and validate request',
    description:
      'Receive the work item, validate its shape, and reject malformed or out-of-scope inputs early.',
    actor: 'system',
    risk: 'low',
    dependsOn: [],
    controls: [
      control(
        'guardrail',
        'Input validation and prompt-injection screening on the inbound payload.',
        'control',
        open,
      ),
    ],
  };
  nodes.push(intake);

  // 2. Grounding / retrieval — present for every archetype that depends on a
  //    tenant context source (anything above bare automation / redesign).
  let groundingId: string | null = null;
  const groundingDependent: ReadonlySet<SolutionArchetypeKey> = new Set([
    'assistant',
    'retrieval_copilot',
    'human_in_loop_agent',
    'full_agentic_workflow',
    'vendor_led_implementation',
  ]);
  if (groundingDependent.has(assessment.recommendedArchetype)) {
    const grounding: WorkflowNode = {
      id: nextId('task'),
      kind: 'task',
      label: 'Retrieve grounding context',
      description:
        'Fetch the tenant-specific facts this workflow reasons over, through the retrieval / broker boundary.',
      actor: 'system',
      risk: 'medium',
      dependsOn: [intake.id],
      controls: [
        control(
          'grounding',
          'Context source must be present, accessible, and fresh — an agent is only as good as its grounding.',
          'data',
          open,
        ),
        control(
          'guardrail',
          'Retrieval / broker boundary keeps context access testable and auditable.',
          'control',
          open,
        ),
      ],
    };
    nodes.push(grounding);
    groundingId = grounding.id;
  }

  // 3. Reason / plan — the model's judgement step. Skipped for deterministic
  //    automation and for process redesign (no model on the critical path).
  let reasonId: string | null = null;
  if (
    assessment.recommendedArchetype !== 'automation' &&
    assessment.recommendedArchetype !== 'data_remediation' &&
    assessment.recommendedArchetype !== 'process_redesign'
  ) {
    const reasonControls: NodeControl[] = [
      control(
        'guardrail',
        'Post-generation consistency guards (the G1–G8 pattern) police the model output.',
        'control',
        open,
      ),
    ];
    if (shape.needsEvalGate) {
      reasonControls.push(
        control(
          'eval',
          'Golden + adversarial eval corpus bounds reasoning quality before this step is trusted.',
          'eval',
          open,
        ),
      );
    }
    const reason: WorkflowNode = {
      id: nextId('task'),
      kind: 'task',
      label: 'Reason over context and plan response',
      description:
        'The model interprets the request against the retrieved context and produces a proposed response or action plan.',
      actor: shape.taskActor,
      risk: shape.takesAction ? 'high' : 'medium',
      dependsOn: groundingId ? [groundingId] : [intake.id],
      controls: reasonControls,
    };
    nodes.push(reason);
    reasonId = reason.id;
  }

  // 4. Decision — a branch on whether the planned response is high-stakes.
  //    Present whenever the workflow takes a consequential action.
  let decisionId: string | null = null;
  const upstreamForDecision = reasonId ?? groundingId ?? intake.id;
  if (shape.takesAction && assessment.recommendedArchetype !== 'process_redesign') {
    const decision: WorkflowNode = {
      id: nextId('decision'),
      kind: 'decision',
      label: 'Route by consequence',
      description:
        'Branch the work item: low-risk cases proceed; high-stakes cases route to a human checkpoint.',
      actor: 'system',
      risk: 'medium',
      dependsOn: [upstreamForDecision],
      controls: [
        control(
          'observability',
          'Every routing decision is traced so reviewers can audit why a case took the autonomous path.',
          'control',
          open,
        ),
      ],
    };
    nodes.push(decision);
    decisionId = decision.id;
  }

  // 5. Human approval — inserted before the action step for archetypes whose
  //    consequential path must stay human-accountable (human_in_loop_agent).
  let approvalId: string | null = null;
  if (shape.needsApproval) {
    const approval: WorkflowNode = {
      id: nextId('approval'),
      kind: 'approval',
      label: 'Accountable human approves action',
      description:
        'A named, accountable human reviews the proposed action on high-stakes cases and approves or rejects it before execution.',
      actor: 'human',
      risk: 'high',
      dependsOn: decisionId ? [decisionId] : [upstreamForDecision],
      controls: [
        control(
          'human_checkpoint',
          'A real review, not a rubber stamp — the reviewer is the accountability line for this action.',
          'control',
          open,
        ),
      ],
    };
    nodes.push(approval);
    approvalId = approval.id;
  }

  // 6. Act — execute the consequential action. Present only when the workflow
  //    takes action; gated behind approval / decision as applicable.
  let actId: string | null = null;
  if (shape.takesAction && assessment.recommendedArchetype !== 'process_redesign') {
    const actUpstream = approvalId ?? decisionId ?? upstreamForDecision;
    const act: WorkflowNode = {
      id: nextId('task'),
      kind: 'task',
      label: 'Execute action',
      description:
        'Carry out the consequential write or action against the system of record.',
      actor: shape.taskActor === 'agent_with_human_review' ? 'agent' : shape.taskActor,
      risk: 'high',
      dependsOn: [actUpstream],
      controls: [
        control(
          'rollback',
          'A tested rollback / kill switch can reverse or halt this action.',
          'control',
          open,
        ),
        control(
          'cost_latency',
          'Known unit-cost-per-decision and a latency budget with caps.',
          null,
          open,
        ),
      ],
    };
    nodes.push(act);
    actId = act.id;
  }

  // 7. Verify / close — confirm the outcome and emit the audit event. Always
  //    present; for automation this is the reconciliation check.
  const verifyUpstream = actId ?? reasonId ?? groundingId ?? intake.id;
  const verify: WorkflowNode = {
    id: nextId('task'),
    kind: 'task',
    label:
      assessment.recommendedArchetype === 'automation'
        ? 'Reconcile and close'
        : 'Verify outcome and close',
    description:
      assessment.recommendedArchetype === 'automation'
        ? 'Reconcile the result against the expected output and close the work item.'
        : 'Confirm the outcome, capture the result, and emit a decision-audit event.',
    actor: 'system',
    risk: 'low',
    dependsOn: [verifyUpstream],
    controls: [
      control(
        'observability',
        'Decision traced and quality metrics (catch-rate, drift) emitted for monitoring.',
        'control',
        open,
      ),
    ],
  };
  nodes.push(verify);

  // 8. Exception path — every workflow names its off-path cases rather than
  //    ignoring them. Routed off the riskiest upstream node.
  const exceptionUpstream = actId ?? decisionId ?? reasonId ?? intake.id;
  const exception: WorkflowNode = {
    id: nextId('exception'),
    kind: 'exception',
    label: 'Handle failure and escalate',
    description:
      'Named failure path: on error, low confidence, or guardrail trip, degrade gracefully and escalate to a human owner.',
    actor: 'human',
    risk: 'high',
    dependsOn: [exceptionUpstream],
    controls: [
      control(
        'observability',
        'Failure modes are enumerated and observable — graceful degradation, not a silent drop.',
        'control',
        open,
      ),
    ],
  };
  nodes.push(exception);

  return nodes;
}

// ─── Notes ─────────────────────────────────────────────────────────────────

/** Senior-practitioner shaping notes for the canvas. */
function buildNotes(
  assessment: SuitabilityAssessment,
  nodes: readonly WorkflowNode[],
  blocked: readonly NodeControl[],
): string[] {
  const notes: string[] = [];
  const archetypeName = getSolutionArchetype(assessment.recommendedArchetype).name;

  notes.push(
    `Decomposed for the ${archetypeName} archetype — the responsible target from the suitability assessment, not the customer's framing.`,
  );

  if (assessment.steppedDown) {
    notes.push(
      'The Move was stepped down from a more ambitious archetype; the canvas reflects the safer shape, with controls on every consequential step.',
    );
  }

  const approvals = nodes.filter((n) => n.kind === 'approval');
  if (approvals.length > 0) {
    notes.push(
      `${approvals.length} human-approval checkpoint${approvals.length > 1 ? 's keep' : ' keeps'} an accountable person on the consequential path.`,
    );
  } else if (
    assessment.recommendedArchetype === 'full_agentic_workflow'
  ) {
    notes.push(
      'No per-step approval — full autonomy on the critical path; humans supervise by exception only. This is only safe because every readiness gate is met.',
    );
  }

  if (blocked.length > 0) {
    const dims = Array.from(new Set(blocked.map((c) => c.blockedBy))).join(', ');
    notes.push(
      `${blocked.length} control${blocked.length > 1 ? 's are' : ' is'} not yet implementable — open readiness gaps on ${dims}. Close those gates before building the affected steps.`,
    );
  } else {
    notes.push(
      'Every control on the canvas is implementable today — no open readiness gap blocks the build.',
    );
  }

  return notes;
}

// ─── Entry point ───────────────────────────────────────────────────────────

/**
 * Decompose a proposed Move into an implementable workflow architecture.
 *
 * The single entry point the Moves surface composes. Pure and deterministic:
 * the canvas is shaped entirely by `assessment.recommendedArchetype` and the
 * open readiness gaps it carries. `proposedMove` is the free-text framing the
 * suitability assessment was produced from.
 */
export function decomposeWorkflow(
  proposedMove: string,
  assessment: SuitabilityAssessment,
): WorkflowDecomposition {
  _seq = 0; // deterministic ids per canvas
  const open = openDimensions(assessment);
  const nodes = buildNodes(assessment, open);

  const blockedControls = nodes
    .flatMap((n) => n.controls)
    .filter((c) => !c.satisfiable);

  return {
    proposedMove,
    archetype: assessment.recommendedArchetype,
    archetypeName: getSolutionArchetype(assessment.recommendedArchetype).name,
    nodes,
    approvalCount: nodes.filter((n) => n.kind === 'approval').length,
    exceptionCount: nodes.filter((n) => n.kind === 'exception').length,
    blockedControls,
    notes: buildNotes(assessment, nodes, blockedControls),
  };
}
