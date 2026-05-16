// Solution architecture options · Wave 2, Slice 2.3.
//
// The pure builder the Moves surface (Nexus agent) uses to turn a *shaped*
// Move — one that already has a recommended archetype from the Slice 2.1
// suitability classifier — into 2-3 concrete solution-architecture options.
//
// Each option is a candidate way to BUILD the Move: it names the data
// sources, the retrieval / grounding approach, the tool surface, the model
// gateway, the audit + security posture, and the integration work. Every
// option is then measured against the agentic solution reference
// architecture in methodology §4 — the eight non-negotiable components
// (grounding/context, broker boundary, guardrails, evals, observability,
// human-in-loop, cost/latency, lifecycle/versioning). A solution missing any
// of them is a POC, not a product.
//
// Expert value: this is what gives a CIO/CTO-level solution-shaping
// conversation real depth. Instead of "let's build an agent", Moves lays out
// "here are three patterns — a thin retrieval copilot you can ship in weeks,
// a brokered human-in-loop agent that is the responsible target, and a full
// agentic workflow that is premature until two readiness gates close — here
// is the §4 component coverage and the trade-off for each."
//
// Pure function — no I/O, client- and server-safe. The Moves origination /
// charter path composes it after the Slice 2.1 assessment; this module ships
// no I/O, no React, and touches no shared file.
//
// Methodology: docs/strategy/MOVES-AGENTIC-SHAPING-METHODOLOGY.md §4–§7.

import {
  getSolutionArchetype,
  meetsReadiness,
  type DeliveryLean,
  type EvidenceInputKey,
  type ReadinessDimension,
  type SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';

// ─── Reference-architecture components (methodology §4) ────────────────────

/**
 * The eight non-negotiable components of the agentic solution reference
 * architecture. Every solution-architecture option is scored against all
 * eight; a solution missing any is a POC, not a product.
 */
export type ReferenceComponent =
  | 'grounding_context'
  | 'broker_boundary'
  | 'guardrails'
  | 'evals'
  | 'observability'
  | 'human_in_loop'
  | 'cost_latency'
  | 'lifecycle_versioning';

/** Ordered canonical list of the §4 components. */
export const REFERENCE_COMPONENTS: readonly ReferenceComponent[] = [
  'grounding_context',
  'broker_boundary',
  'guardrails',
  'evals',
  'observability',
  'human_in_loop',
  'cost_latency',
  'lifecycle_versioning',
];

/** Human-readable label for each §4 component. */
export const REFERENCE_COMPONENT_LABEL: Readonly<
  Record<ReferenceComponent, string>
> = {
  grounding_context: 'Grounding / context layer',
  broker_boundary: 'Retrieval / broker boundary',
  guardrails: 'Guardrails',
  evals: 'Evals',
  observability: 'Observability / telemetry',
  human_in_loop: 'Human-in-the-loop',
  cost_latency: 'Cost & latency control',
  lifecycle_versioning: 'Lifecycle / versioning',
};

/**
 * How fully a given solution-architecture option covers one §4 component.
 *   - `native`   — the option specifies this component as a first-class part
 *                  of the design; production-grade.
 *   - `partial`  — present but thin: a stop-gap that must be hardened before
 *                  the production-readiness gate (§5) is met.
 *   - `missing`  — the option does not address this component at all; this is
 *                  the POC-not-product signal.
 */
export type ComponentCoverage = 'native' | 'partial' | 'missing';

/** Coverage of one §4 component, with the practitioner reason for the call. */
export interface ComponentAssessment {
  component: ReferenceComponent;
  coverage: ComponentCoverage;
  /** Senior-practitioner explanation of what the option does (or omits) here. */
  note: string;
}

// ─── Solution-architecture option contracts ────────────────────────────────

/**
 * Where a solution-architecture option sits on the agentic ambition scale.
 * Mirrors the archetype taxonomy's `agenticAmbition`, collapsed to the three
 * shapes a shaping conversation actually offers as build options.
 */
export type ArchitectureShape =
  | 'retrieval_copilot'
  | 'human_in_loop_agent'
  | 'full_agentic_workflow';

/** Retrieval / grounding strategy an option leans on for §4 grounding. */
export type RetrievalStrategy =
  | 'vector_rag'
  | 'graph_rag'
  | 'hybrid_rag'
  | 'structured_lookup'
  | 'none';

/** One concrete solution-architecture option for a Move. */
export interface SolutionArchitectureOption {
  /** Stable id — used in audit log and telemetry. */
  id: string;
  /** Canonical display name, principal-solution-architect voice. */
  name: string;
  /** The agentic shape this option commits to. */
  shape: ArchitectureShape;
  /** One-paragraph description of the pattern. */
  summary: string;
  /** Tenant context surfaces this option grounds on (§6). */
  dataSources: readonly EvidenceInputKey[];
  /** Retrieval / grounding approach (§4 grounding + broker boundary). */
  retrieval: RetrievalStrategy;
  /** The tool surface the agent is given (read-only vs. action-taking). */
  tools: readonly string[];
  /** Model-gateway posture — routing, fallback, cost caps. */
  modelGateway: string;
  /** Audit / decision-tracing posture (§4 observability). */
  audit: string;
  /** Security / privacy posture for AI on sensitive data (§5 gate). */
  security: string;
  /** Integration work the option requires before it can ship. */
  integrationNeeds: readonly string[];
  /** Build / buy / orchestrate lean — hand-off hint to Source (§7). */
  deliveryLean: DeliveryLean;
  /** Per-component coverage against the §4 reference architecture. */
  componentCoverage: readonly ComponentAssessment[];
  /**
   * §4 readiness score 0–100: how completely this option covers the eight
   * reference-architecture components (native = full credit, partial = half).
   */
  referenceScore: number;
  /**
   * True when every §4 component is `native` — i.e. the option is shaped as a
   * product, not a POC. Options with any `missing` component are never ready.
   */
  productionShaped: boolean;
  /** Trade-offs / what the customer gives up by choosing this option. */
  tradeOffs: readonly string[];
}

/** The outcome of the solution-architecture options builder. */
export interface SolutionArchitectureOptionSet {
  /** The archetype the options are shaped around (from Slice 2.1). */
  archetype: SolutionArchetypeKey;
  /** 2-3 candidate solution-architecture options, ambition-ascending. */
  options: readonly SolutionArchitectureOption[];
  /**
   * The option Moves recommends shipping first — the responsible pick given
   * the tenant's readiness, not the most ambitious one.
   */
  recommendedOptionId: string;
  /**
   * §4 components not yet `native` in the recommended option — the work that
   * stands between this Move and the §5 production-readiness gate.
   */
  openComponentGaps: readonly ReferenceComponent[];
  /** Practitioner reasons behind the recommendation. */
  reasons: readonly string[];
}

/** Input to the builder — the shaped Move plus the tenant's readiness. */
export interface SolutionArchitectureInput {
  /** The recommended archetype from the Slice 2.1 suitability assessment. */
  recommendedArchetype: SolutionArchetypeKey;
  /** Tenant readiness across data / control / eval (§5–§6). */
  readiness: ReadinessProfile;
  /**
   * Optional free-text Move framing — used only to enrich option summaries;
   * the option set is deterministic without it.
   */
  proposedMove?: string;
}

// ─── Internal scoring helpers ──────────────────────────────────────────────

const COVERAGE_CREDIT: Readonly<Record<ComponentCoverage, number>> = {
  native: 1,
  partial: 0.5,
  missing: 0,
};

const DIMENSION_LABEL: Readonly<Record<ReadinessDimension, string>> = {
  data: 'data / grounding',
  control: 'control / guardrail',
  eval: 'eval / regression',
};

/** §4 reference score 0–100 from a per-component coverage list. */
function referenceScore(
  coverage: readonly ComponentAssessment[],
): number {
  if (coverage.length === 0) return 0;
  const credit = coverage.reduce(
    (sum, c) => sum + COVERAGE_CREDIT[c.coverage],
    0,
  );
  return Math.round((credit / coverage.length) * 100);
}

/** True when no §4 component is left `missing` and all are `native`. */
function isProductionShaped(
  coverage: readonly ComponentAssessment[],
): boolean {
  return (
    coverage.length === REFERENCE_COMPONENTS.length &&
    coverage.every((c) => c.coverage === 'native')
  );
}

/** The §4 components not yet `native` in an option. */
function openGaps(
  coverage: readonly ComponentAssessment[],
): ReferenceComponent[] {
  return coverage
    .filter((c) => c.coverage !== 'native')
    .map((c) => c.component);
}

// ─── Component-coverage templates per architecture shape ───────────────────

/**
 * Build the §4 component coverage for an option of a given shape, given the
 * tenant's readiness. Coverage is *not* a fixed property of the shape — a
 * full agentic workflow with weak eval maturity has only `partial` eval
 * coverage, which is exactly the POC-not-product signal §4 exists to surface.
 */
function assessComponents(
  shape: ArchitectureShape,
  readiness: ReadinessProfile,
): ComponentAssessment[] {
  const dataReady = meetsReadiness(readiness.data, 'moderate');
  const controlReady = meetsReadiness(readiness.control, 'moderate');
  const evalReady = meetsReadiness(readiness.eval, 'moderate');

  // Grounding / context — gated on data maturity for every shape.
  const grounding: ComponentAssessment = {
    component: 'grounding_context',
    coverage: dataReady ? 'native' : 'partial',
    note: dataReady
      ? 'Tenant context layer is fresh enough to ground the agent (§6).'
      : 'Data maturity is below moderate — grounding is thin; close the §6 data gate before production.',
  };

  // Broker boundary — always native: the AbarVa contract mandates a clean
  // retrieval/agent separation regardless of shape.
  const broker: ComponentAssessment = {
    component: 'broker_boundary',
    coverage: 'native',
    note: 'Context access goes through the broker contract — testable, swappable, auditable.',
  };

  // Guardrails — the post-generation consistency-guard (G1–G8); their depth
  // tracks control maturity and matters more as the shape takes more action.
  const guardrailsNative = controlReady;
  const guardrails: ComponentAssessment = {
    component: 'guardrails',
    coverage: guardrailsNative ? 'native' : 'partial',
    note: guardrailsNative
      ? 'Input + output validation and the consistency-guard pattern (G1–G8) are in place.'
      : 'Control maturity is low — guardrails are partial; an action-taking shape must harden them first.',
  };

  // Evals — golden + adversarial + regression corpus; gated on eval maturity.
  const evals: ComponentAssessment = {
    component: 'evals',
    coverage: evalReady ? 'native' : 'partial',
    note: evalReady
      ? 'Golden + adversarial + regression corpus exists; quality bar is measurable.'
      : 'No agreed eval corpus yet — you cannot tell if the agent improves or degrades; build it before the §5 gate.',
  };

  // Observability — decision tracing + quality metrics; always native because
  // AbarVa traces every agent decision by construction.
  const observability: ComponentAssessment = {
    component: 'observability',
    coverage: 'native',
    note: 'Every agent decision is traced; catch-rate and drift metrics are surfaced.',
  };

  // Human-in-the-loop — native for the two human-supervised shapes; for a
  // full agentic workflow the checkpoints are exception-only, which still
  // counts as native provided control maturity supports it.
  const hitlNative =
    shape !== 'full_agentic_workflow' || controlReady;
  const humanInLoop: ComponentAssessment = {
    component: 'human_in_loop',
    coverage: hitlNative ? 'native' : 'partial',
    note:
      shape === 'full_agentic_workflow'
        ? hitlNative
          ? 'Exception-path checkpoints keep a named human accountable for high-stakes actions.'
          : 'A full agentic workflow with low control maturity has no safe checkpoint design — partial.'
        : 'Defined review / approval checkpoints keep a human accountable for every consequential action.',
  };

  // Cost & latency — native for thin shapes; an action-taking or multi-step
  // shape needs an explicit unit-cost-per-decision and latency budget, which
  // is only credible once eval maturity lets you measure it.
  const costNative =
    shape === 'retrieval_copilot' || evalReady;
  const costLatency: ComponentAssessment = {
    component: 'cost_latency',
    coverage: costNative ? 'native' : 'partial',
    note: costNative
      ? 'Known unit-cost-per-decision and latency budget with caps at the model gateway.'
      : 'Multi-step cost / latency is unmeasured without an eval harness — partial until §6 closes.',
  };

  // Lifecycle / versioning — always native: agents version, roll forward and
  // roll back as models and prompts change.
  const lifecycle: ComponentAssessment = {
    component: 'lifecycle_versioning',
    coverage: 'native',
    note: 'Agent prompts + model pins are versioned with roll-forward / rollback.',
  };

  return [
    grounding,
    broker,
    guardrails,
    evals,
    observability,
    humanInLoop,
    costLatency,
    lifecycle,
  ];
}

// ─── Option templates ──────────────────────────────────────────────────────

/** Which architecture shapes to offer for a given recommended archetype. */
function shapesForArchetype(
  archetype: SolutionArchetypeKey,
): ArchitectureShape[] {
  switch (archetype) {
    // Precondition / non-agentic archetypes still warrant a shaping
    // conversation: offer the thin copilot and the human-in-loop agent as the
    // realistic build targets once the precondition work is done.
    case 'automation':
    case 'assistant':
    case 'retrieval_copilot':
    case 'data_remediation':
    case 'vendor_led_implementation':
    case 'process_redesign':
      return ['retrieval_copilot', 'human_in_loop_agent'];
    case 'human_in_loop_agent':
      return ['retrieval_copilot', 'human_in_loop_agent', 'full_agentic_workflow'];
    case 'full_agentic_workflow':
      return ['human_in_loop_agent', 'full_agentic_workflow'];
    default: {
      // Exhaustiveness guard — a new archetype key must be handled here.
      const _exhaustive: never = archetype;
      return _exhaustive;
    }
  }
}

interface ShapeTemplate {
  name: string;
  summary: string;
  dataSources: readonly EvidenceInputKey[];
  retrieval: RetrievalStrategy;
  tools: readonly string[];
  modelGateway: string;
  audit: string;
  security: string;
  integrationNeeds: readonly string[];
  deliveryLean: DeliveryLean;
  tradeOffs: readonly string[];
}

const SHAPE_TEMPLATES: Readonly<Record<ArchitectureShape, ShapeTemplate>> = {
  retrieval_copilot: {
    name: 'Grounded retrieval copilot',
    summary:
      'A read-only assistant that answers questions and drafts with cited grounding over the tenant context layer. It never takes action, so the blast radius is bounded and it can ship in weeks.',
    dataSources: ['it_landscape', 'kpi_dictionary', 'policies_controls'],
    retrieval: 'hybrid_rag',
    tools: ['retrieve_context', 'cite_source'],
    modelGateway:
      'Single managed gateway; a small/fast model for retrieval, escalation to a frontier model only for synthesis; hard token cap per session.',
    audit:
      'Every answer logs the retrieved chunks and citations; no state mutation to audit beyond read access.',
    security:
      'Read-only context access scoped by tenant RLS; no write path, so the sensitive-data surface is the retrieval scope alone.',
    integrationNeeds: [
      'Connect the tenant context layer (it_landscape, kpi_dictionary) to the broker.',
      'Embed and index the policy / control corpus.',
    ],
    deliveryLean: 'build',
    tradeOffs: [
      'No action-taking — the human still does all the work the answer informs.',
      'Value is bounded by how good the grounding corpus is.',
    ],
  },
  human_in_loop_agent: {
    name: 'Brokered human-in-the-loop agent',
    summary:
      'An agent that proposes and prepares consequential actions but executes only after a defined human checkpoint. The responsible target for most Moves: real leverage with a named human accountable.',
    dataSources: [
      'it_landscape',
      'kpi_dictionary',
      'process_maps',
      'systems_integrations',
      'policies_controls',
    ],
    retrieval: 'hybrid_rag',
    tools: [
      'retrieve_context',
      'draft_action',
      'request_human_approval',
      'execute_approved_action',
    ],
    modelGateway:
      'Managed gateway with model routing and provider fallback; per-decision cost cap and a latency budget enforced before the approval step.',
    audit:
      'Every proposed action, the human decision, and the executed result are traced as one decision record with a rollback handle.',
    security:
      'Action scope is allow-listed; sensitive-data writes pass a security review and are gated behind the human checkpoint.',
    integrationNeeds: [
      'Wire the action tools to the systems of record behind an approval queue.',
      'Stand up the human-approval checkpoint UI / workflow.',
      'Connect process_maps so the agent reasons over the real process.',
    ],
    deliveryLean: 'mixed',
    tradeOffs: [
      'Throughput is capped by reviewer capacity at the checkpoint.',
      'Needs a real eval corpus before the checkpoint can be relaxed.',
    ],
  },
  full_agentic_workflow: {
    name: 'Full agentic workflow',
    summary:
      'A multi-step agent that runs the workflow end-to-end with exception-only human checkpoints. The highest leverage and the highest bar: premature unless data, control and eval maturity are all proven.',
    dataSources: [
      'it_landscape',
      'kpi_dictionary',
      'process_maps',
      'systems_integrations',
      'policies_controls',
      'risk_register',
      'historical_outcomes',
    ],
    retrieval: 'graph_rag',
    tools: [
      'retrieve_context',
      'plan_steps',
      'execute_action',
      'self_check',
      'escalate_exception',
    ],
    modelGateway:
      'Managed gateway with routing, fallback, and a per-workflow cost ceiling; circuit-breaker and kill switch on cost or error-rate breach.',
    audit:
      'Every step, tool call, and self-check is traced; the full workflow run is replayable for incident review.',
    security:
      'Autonomous writes require a passed security / privacy review, blast-radius limits, and a tested kill switch before go-live.',
    integrationNeeds: [
      'Integrate all systems of record the workflow touches, with idempotent writes.',
      'Build the adversarial + regression eval corpus and wire it to CI.',
      'Implement the kill switch and exception-escalation path.',
    ],
    deliveryLean: 'build',
    tradeOffs: [
      'Highest build cost and the longest path to the §5 production gate.',
      'Autonomy means failures are caught later — observability and evals must be excellent.',
    ],
  },
};

const SHAPE_ID: Readonly<Record<ArchitectureShape, string>> = {
  retrieval_copilot: 'opt-retrieval-copilot',
  human_in_loop_agent: 'opt-human-in-loop-agent',
  full_agentic_workflow: 'opt-full-agentic-workflow',
};

const SHAPE_AMBITION: Readonly<Record<ArchitectureShape, number>> = {
  retrieval_copilot: 1,
  human_in_loop_agent: 2,
  full_agentic_workflow: 3,
};

// ─── Builder ───────────────────────────────────────────────────────────────

/** Build one solution-architecture option for a given shape. */
function buildOption(
  shape: ArchitectureShape,
  readiness: ReadinessProfile,
): SolutionArchitectureOption {
  const template = SHAPE_TEMPLATES[shape];
  const componentCoverage = assessComponents(shape, readiness);
  return {
    id: SHAPE_ID[shape],
    name: template.name,
    shape,
    summary: template.summary,
    dataSources: template.dataSources,
    retrieval: template.retrieval,
    tools: template.tools,
    modelGateway: template.modelGateway,
    audit: template.audit,
    security: template.security,
    integrationNeeds: template.integrationNeeds,
    deliveryLean: template.deliveryLean,
    componentCoverage,
    referenceScore: referenceScore(componentCoverage),
    productionShaped: isProductionShaped(componentCoverage),
    tradeOffs: template.tradeOffs,
  };
}

/**
 * Pick the responsible option to ship first. Among the offered options, the
 * recommendation is the *most ambitious* one that is `productionShaped` for
 * the tenant's current readiness; if none is fully production-shaped, the
 * recommendation is the most ambitious option, since the §4 gaps are the work
 * the shaping conversation must call out rather than a reason to drop scope.
 *
 * Rationale: a thin copilot is always production-shaped, but recommending it
 * when the Move genuinely needs an agent would under-shape the Move. The
 * responsible pick is the highest shape the tenant can carry to production —
 * and when readiness is weak, the highest-ambition option carrying the gap
 * list, so the conversation is honest about what is unfinished.
 */
function pickRecommended(
  options: readonly SolutionArchitectureOption[],
): SolutionArchitectureOption {
  const productionShaped = options.filter((o) => o.productionShaped);
  const pool = productionShaped.length > 0 ? productionShaped : options;
  return pool.reduce((best, o) =>
    SHAPE_AMBITION[o.shape] > SHAPE_AMBITION[best.shape] ? o : best,
  );
}

/** Practitioner reasons behind the recommendation. */
function buildReasons(
  archetype: SolutionArchetypeKey,
  recommended: SolutionArchitectureOption,
  readiness: ReadinessProfile,
  gaps: readonly ReferenceComponent[],
): string[] {
  const archetypeName = getSolutionArchetype(archetype).name;
  const reasons: string[] = [
    `Shaped around the recommended archetype "${archetypeName}" from the suitability assessment.`,
  ];

  if (recommended.productionShaped) {
    reasons.push(
      `"${recommended.name}" covers all eight §4 reference-architecture components natively — it is shaped as a product, not a POC.`,
    );
  } else {
    reasons.push(
      `"${recommended.name}" is the highest-leverage option the tenant can carry, but ${gaps.length} §4 component(s) are not yet production-grade.`,
    );
    for (const g of gaps) {
      reasons.push(
        `Open §4 gap — ${REFERENCE_COMPONENT_LABEL[g]}: must reach native coverage before the §5 production-readiness gate.`,
      );
    }
  }

  // Surface the underlying readiness dimensions still short of moderate.
  const dims: ReadinessDimension[] = ['data', 'control', 'eval'];
  for (const d of dims) {
    if (!meetsReadiness(readiness[d], 'moderate')) {
      reasons.push(
        `Readiness gate open — ${DIMENSION_LABEL[d]} maturity is "${readiness[d]}"; close it to lift the affected §4 components to native.`,
      );
    }
  }

  return reasons;
}

/**
 * Build the solution-architecture option set for a shaped Move.
 *
 * Pure and deterministic: the same `recommendedArchetype` + `readiness`
 * always yields the same 2-3 options, scored against the methodology §4
 * reference architecture. The `proposedMove` text, when given, is not yet
 * used for branching — it is reserved for option-summary enrichment so the
 * contract stays stable.
 */
export function buildSolutionArchitectureOptions(
  input: SolutionArchitectureInput,
): SolutionArchitectureOptionSet {
  const { recommendedArchetype, readiness } = input;
  const shapes = shapesForArchetype(recommendedArchetype);
  const options = shapes.map((shape) => buildOption(shape, readiness));
  const recommended = pickRecommended(options);
  const openComponentGaps = openGaps(recommended.componentCoverage);
  const reasons = buildReasons(
    recommendedArchetype,
    recommended,
    readiness,
    openComponentGaps,
  );

  return {
    archetype: recommendedArchetype,
    options,
    recommendedOptionId: recommended.id,
    openComponentGaps,
    reasons,
  };
}
