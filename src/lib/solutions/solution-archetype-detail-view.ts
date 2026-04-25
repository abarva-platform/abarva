// SOL7 · Solution Archetype Detail Read Model.
//
// Pure deterministic projection of a canonical solution archetype into a
// canvas-ready detail view. Programs, Atlas, and Steward subscribe to
// this read model to render an archetype detail surface without inventing
// content at runtime.
//
// This module is a *library*. It does NOT call models, read tenant state,
// invoke retrieval, or randomise output. Every call with the same input
// produces a byte-equal result.
//
// SOL3 integration note:
//   The canonical solution archetype registry (SOL3) is being authored in
//   a parallel worktree and is NOT importable from this worktree. Instead
//   of importing the registry directly, this module declares a local
//   structural type `SolutionArchetypeLike` that captures the canonical
//   archetype shape. A follow-up slice will replace direct callers with
//   the real registry import; the structural type guarantees the read
//   model continues to compile at that point.
//
// No live runtime, no Claude / OpenAI / Pinecone invocation, no
// Date.now() reads, no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/solutions/solution-archetype-registry (not present yet)
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

export interface SolutionArchetypeLike {
  key: string;
  name: string;
  sector: string;
  capabilityFamily: string;
  problemStatement: string;
  businessOutcomes: readonly string[];
  currentStateInputsRequired: readonly string[];
  patternsUsed: readonly string[];
  failureModesAddressed: readonly string[];
  solutionComponents: readonly string[];
  architectureBuildingBlocks: readonly string[];
  workshopsRequired: readonly string[];
  smesRequired: readonly string[];
  buildBuyPartnerConsiderations: readonly string[];
  governanceRiskConsiderations: readonly string[];
  deliverablesGenerated: readonly string[];
  valueMetrics: readonly string[];
  agentRoles: { nexus: string; sentinel: string; atlas: string; steward: string };
  recommendedFirstWorkshop: string;
  createdFrom: 'deterministic_solution_archetype_registry';
}

export interface SolutionArchetypeDetailView {
  archetypeKey: string;
  summary: { name: string; sector: string; capabilityFamily: string; problemStatement: string };
  businessOutcomes: readonly string[];
  currentStateInputs: readonly string[];
  patterns: readonly string[];
  failureModes: readonly string[];
  solutionComponents: readonly string[];
  architecture: readonly string[];
  workshops: readonly string[];
  smes: readonly string[];
  buildBuyPartner: readonly string[];
  governanceRisk: readonly string[];
  deliverables: readonly string[];
  valueMetrics: readonly string[];
  agentRoles: { nexus: string; sentinel: string; atlas: string; steward: string };
  missingInputPrompts: readonly string[];
  recommendedNextAction: string;
  basis: { source: 'deterministic_solution_archetype_registry'; viewBuilderVersion: string };
  createdFrom: 'deterministic_seed';
}

export interface SolutionArchetypeCanvasSection {
  key: string;
  title: string;
  body: readonly string[];
  layoutHint: 'list' | 'paragraph' | 'two_column' | 'metric_strip' | 'agent_partition';
  evidenceLinkRequired: boolean;
}

export interface SolutionArchetypeReadinessSummary {
  archetypeKey: string;
  totalSections: number;
  sectionsWithBody: number;
  missingInputCount: number;
  readinessLevel: 'usable' | 'partial' | 'weak';
  recommendedNextAction: string;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const VIEW_BUILDER_VERSION = 'sol7.v1';

const CANONICAL_SECTION_KEYS = [
  'brief',
  'business_outcomes',
  'current_state_inputs',
  'patterns_and_failure_modes',
  'solution_components',
  'architecture',
  'workshops',
  'smes',
  'build_buy_partner',
  'governance_risk',
  'deliverables',
  'value_metrics',
] as const;

type CanonicalSectionKey = (typeof CANONICAL_SECTION_KEYS)[number];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Project a canonical solution archetype into a canvas-ready detail
 * view. Pure: identical input yields a byte-equal output.
 *
 * `missingInputPrompts` is derived from required-input arrays that are
 * empty. For a fully-specified canonical archetype the array is `[]`.
 *
 * `recommendedNextAction` is derived: when any required input is
 * missing, the action proposes scheduling the archetype's recommended
 * first workshop; otherwise the action proposes proceeding to
 * architecture composition.
 */
export function buildSolutionArchetypeDetailView(
  archetype: SolutionArchetypeLike,
): SolutionArchetypeDetailView {
  const missingInputPrompts = deriveMissingInputPrompts(archetype);
  const recommendedNextAction = deriveRecommendedNextAction(
    archetype,
    missingInputPrompts.length,
  );
  return {
    archetypeKey: archetype.key,
    summary: {
      name: archetype.name,
      sector: archetype.sector,
      capabilityFamily: archetype.capabilityFamily,
      problemStatement: archetype.problemStatement,
    },
    businessOutcomes: [...archetype.businessOutcomes],
    currentStateInputs: [...archetype.currentStateInputsRequired],
    patterns: [...archetype.patternsUsed],
    failureModes: [...archetype.failureModesAddressed],
    solutionComponents: [...archetype.solutionComponents],
    architecture: [...archetype.architectureBuildingBlocks],
    workshops: [...archetype.workshopsRequired],
    smes: [...archetype.smesRequired],
    buildBuyPartner: [...archetype.buildBuyPartnerConsiderations],
    governanceRisk: [...archetype.governanceRiskConsiderations],
    deliverables: [...archetype.deliverablesGenerated],
    valueMetrics: [...archetype.valueMetrics],
    agentRoles: {
      nexus: archetype.agentRoles.nexus,
      sentinel: archetype.agentRoles.sentinel,
      atlas: archetype.agentRoles.atlas,
      steward: archetype.agentRoles.steward,
    },
    missingInputPrompts,
    recommendedNextAction,
    basis: {
      source: 'deterministic_solution_archetype_registry',
      viewBuilderVersion: VIEW_BUILDER_VERSION,
    },
    createdFrom: 'deterministic_seed',
  };
}

/**
 * Project a canonical archetype into the 12 canvas sections in the
 * canonical render order. Pure. Each section carries a layout hint and
 * an `evidenceLinkRequired` flag that downstream renderers honour.
 */
export function buildSolutionArchetypeCanvasSections(
  archetype: SolutionArchetypeLike,
): readonly SolutionArchetypeCanvasSection[] {
  const sections: SolutionArchetypeCanvasSection[] = [
    {
      key: 'brief',
      title: 'Brief',
      body: [
        archetype.name,
        archetype.sector,
        archetype.capabilityFamily,
        archetype.problemStatement,
      ].filter((entry) => entry.trim().length > 0),
      layoutHint: 'paragraph',
      evidenceLinkRequired: false,
    },
    {
      key: 'business_outcomes',
      title: 'Business outcomes',
      body: [...archetype.businessOutcomes],
      layoutHint: 'list',
      evidenceLinkRequired: true,
    },
    {
      key: 'current_state_inputs',
      title: 'Current-state inputs required',
      body: [...archetype.currentStateInputsRequired],
      layoutHint: 'list',
      evidenceLinkRequired: true,
    },
    {
      key: 'patterns_and_failure_modes',
      title: 'Patterns and failure modes',
      body: [
        ...archetype.patternsUsed.map((p) => `Pattern: ${p}`),
        ...archetype.failureModesAddressed.map((fm) => `Failure mode: ${fm}`),
      ],
      layoutHint: 'two_column',
      evidenceLinkRequired: true,
    },
    {
      key: 'solution_components',
      title: 'Solution components',
      body: [...archetype.solutionComponents],
      layoutHint: 'list',
      evidenceLinkRequired: false,
    },
    {
      key: 'architecture',
      title: 'Architecture building blocks',
      body: [...archetype.architectureBuildingBlocks],
      layoutHint: 'list',
      evidenceLinkRequired: false,
    },
    {
      key: 'workshops',
      title: 'Workshops required',
      body: [...archetype.workshopsRequired],
      layoutHint: 'list',
      evidenceLinkRequired: false,
    },
    {
      key: 'smes',
      title: 'SMEs required',
      body: [...archetype.smesRequired],
      layoutHint: 'list',
      evidenceLinkRequired: false,
    },
    {
      key: 'build_buy_partner',
      title: 'Build / buy / partner considerations',
      body: [...archetype.buildBuyPartnerConsiderations],
      layoutHint: 'list',
      evidenceLinkRequired: false,
    },
    {
      key: 'governance_risk',
      title: 'Governance and risk considerations',
      body: [...archetype.governanceRiskConsiderations],
      layoutHint: 'list',
      evidenceLinkRequired: true,
    },
    {
      key: 'deliverables',
      title: 'Deliverables generated',
      body: [...archetype.deliverablesGenerated],
      layoutHint: 'list',
      evidenceLinkRequired: false,
    },
    {
      key: 'value_metrics',
      title: 'Value metrics',
      body: [...archetype.valueMetrics],
      layoutHint: 'metric_strip',
      evidenceLinkRequired: true,
    },
  ];
  // Defensive assertion: the canonical order MUST match the registry of
  // section keys. This is a pure self-check; the test suite enforces the
  // same property externally.
  for (let i = 0; i < CANONICAL_SECTION_KEYS.length; i += 1) {
    if (sections[i]?.key !== CANONICAL_SECTION_KEYS[i]) {
      throw new Error(
        `SOL7: canvas section order drift at index ${i}: expected ${CANONICAL_SECTION_KEYS[i]}, got ${sections[i]?.key ?? '<undefined>'}`,
      );
    }
  }
  return sections;
}

/**
 * Compute the readiness summary for an archetype: how many of the 12
 * canvas sections carry a non-empty body, the number of missing-input
 * prompts, and a derived readiness level.
 *
 * Readiness levels:
 *   - `usable`  : all 12 sections populated AND no missing-input prompts.
 *   - `partial` : at least 9 of 12 sections populated (75% threshold).
 *   - `weak`    : fewer than 9 sections populated.
 */
export function summarizeSolutionArchetypeReadiness(
  archetype: SolutionArchetypeLike,
): SolutionArchetypeReadinessSummary {
  const sections = buildSolutionArchetypeCanvasSections(archetype);
  const totalSections = sections.length;
  const sectionsWithBody = sections.filter((s) => s.body.length > 0).length;
  const missingInputCount = deriveMissingInputPrompts(archetype).length;
  const readinessLevel: SolutionArchetypeReadinessSummary['readinessLevel'] =
    sectionsWithBody === totalSections && missingInputCount === 0
      ? 'usable'
      : sectionsWithBody >= Math.ceil(totalSections * 0.75)
        ? 'partial'
        : 'weak';
  const recommendedNextAction = deriveRecommendedNextAction(
    archetype,
    missingInputCount,
  );
  return {
    archetypeKey: archetype.key,
    totalSections,
    sectionsWithBody,
    missingInputCount,
    readinessLevel,
    recommendedNextAction,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const SOLUTION_ARCHETYPE_CANVAS_SECTION_KEYS_IN_ORDER: readonly CanonicalSectionKey[] =
  CANONICAL_SECTION_KEYS;

export const SOLUTION_ARCHETYPE_VIEW_BUILDER_VERSION = VIEW_BUILDER_VERSION;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function deriveMissingInputPrompts(
  archetype: SolutionArchetypeLike,
): readonly string[] {
  const prompts: string[] = [];
  if (archetype.currentStateInputsRequired.length === 0) {
    prompts.push(
      'Tenant has not yet supplied current-state inputs. Steward: capture from intake.',
    );
  }
  if (archetype.businessOutcomes.length === 0) {
    prompts.push(
      'Business outcomes are not yet captured. Atlas: capture sponsor outcomes before composition.',
    );
  }
  if (archetype.smesRequired.length === 0) {
    prompts.push(
      'Required SMEs are not yet named. Steward: identify SMEs during intake.',
    );
  }
  if (archetype.workshopsRequired.length === 0) {
    prompts.push(
      'Workshops required have not been scheduled. Nexus: propose the workshop slate.',
    );
  }
  if (archetype.valueMetrics.length === 0) {
    prompts.push(
      'Value metrics are not yet named. Atlas: anchor the value ledger before build.',
    );
  }
  return prompts;
}

function deriveRecommendedNextAction(
  archetype: SolutionArchetypeLike,
  missingInputCount: number,
): string {
  if (missingInputCount > 0) {
    const workshop =
      archetype.recommendedFirstWorkshop.trim().length > 0
        ? archetype.recommendedFirstWorkshop
        : 'current_state_discovery';
    return `Schedule ${workshop} to close missing inputs before composition.`;
  }
  return 'Proceed to architecture composition with the captured inputs.';
}
