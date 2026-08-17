/**
 * Projector registry — the declared contract between the canonical model and the products.
 *
 * The problem this solves is structural, not cosmetic. Products today are fed by three
 * independent supply chains: client intake resolves through the canonical model, operational
 * telemetry runs its own ingest into `public.tower_*`, and the corpus is assembled alongside
 * both. All three work. What is missing is any statement of which canonical types are supposed
 * to reach which product — so a type can be produced by the canonical build, consumed by
 * nothing, and nobody notices.
 *
 * `spend_value_fact` is the live example: 44 records per refresh, the client's own declared
 * spend, consumed by no product. Tower answers spend questions from metered cloud cost instead.
 * Neither number is wrong; nothing declares which one a surface used.
 *
 * A registry entry is a claim a projector makes about itself, and the coverage gate checks that
 * claim against the canonical build. It is deliberately declarative: registering a projector
 * costs one entry, and forgetting to register one is what the gate catches.
 */

/** Every object type the canonical build can emit. Sourced from canonical-tenant-data-build. */
export const CANONICAL_OBJECT_TYPES = [
  "ai_automation_use_case",
  "application_system",
  "business_function",
  "data_asset_or_integration",
  "evidence_source",
  "expert_lens",
  "industry_context_pattern",
  "infrastructure_platform",
  "managed_service_scope",
  "metric_outcome",
  "operational_process_evidence",
  "org_owner",
  "program_initiative",
  "relationship_source_row",
  "risk_or_control",
  "spend_value_fact",
  "tenant_profile",
  "vendor_contract",
  "workforce_role",
  // Added 2026-08-16 with their intake domains. These files sat in every active tenant root
  // matching no domain, so they were never read. They are largely Tower and Moves inputs —
  // which is the likely reason Tower ingests observed equivalents from live tool APIs instead.
  "benefit_realization_record",
  "capability_maturity_assessment",
  "interview_object_crosswalk",
  "kpi_outcome_observation",
  "process_performance_observation",
  "tool_usage_observation",
  "value_interview_evidence",
] as const;

export type CanonicalObjectType = (typeof CANONICAL_OBJECT_TYPES)[number];

/** The products a projector may feed. */
export type ProductSurface =
  | "home"
  | "source"
  | "tower"
  | "moves"
  | "intelligence";

/**
 * Where a projector reads from.
 *
 * `canonical` is the target state: the projector reads the shared model, so every product
 * inherits one resolution of identity. `parallel_source` records — honestly — that a projector
 * reads a store the canonical build does not populate. That is not a lie to be hidden in a
 * comment; it is a fact the coverage report should state, because it is the difference between
 * "this product is fed by the spine" and "this product has its own pipeline".
 */
export type ProjectorInput = "canonical" | "parallel_source";

/**
 * Whether the projector exists yet.
 *
 * `built` is running code. `planned` is a declared intent with its consumed types assigned —
 * which is what turns this file from an inventory into a design. Without planned entries the
 * coverage report can only say "24 types reach nothing"; with them it can say "24 types are
 * assigned to a product that has not been built yet", and the difference between those two
 * sentences is whether anyone has decided where the data is supposed to go.
 */
export type ProjectorStatus = "built" | "planned";

export interface ProjectorRegistration {
  /** Whether this projector exists or is a declared intent. */
  readonly status: ProjectorStatus;
  /** Stable id, used in reports and proof bundles. */
  readonly id: string;
  /** The product this projector feeds. */
  readonly surface: ProductSurface;
  /** Path to the implementation, so a reader can go straight to it. */
  readonly implementation: string;
  /** Where it reads from. See ProjectorInput. */
  readonly input: ProjectorInput;
  /** Canonical types this projector consumes. Empty is legal only when input is parallel_source. */
  readonly consumes: readonly CanonicalObjectType[];
  /**
   * For parallel_source projectors: the store it actually reads. Recording this makes the
   * gap measurable and gives the rehoming work a concrete target.
   */
  readonly parallelStore?: string;
  /** One line a reviewer can read without opening the implementation. */
  readonly note: string;
}

/**
 * The registry.
 *
 * Entries describe what exists today, including the parts that do not yet read canonical.
 * Registering a parallel-source projector is not an endorsement of it — it is what makes the
 * coverage report able to say "Tower is fed, but not by the spine".
 */
export const PROJECTOR_REGISTRY: readonly ProjectorRegistration[] = [
  // ---------------------------------------------------------------- built
  {
    status: "built",
    id: "source-l4-cube",
    surface: "source",
    implementation: "scripts/data-build/refresh-source-l4-cube.ts",
    input: "canonical",
    consumes: ["vendor_contract", "application_system"],
    note: "Projects contracts, vendors and scope into source.* and the consumption cube views.",
  },
  {
    status: "built",
    id: "tower-mart",
    surface: "tower",
    implementation: "src/scripts/tower/project-tower-mart.ts",
    input: "parallel_source",
    consumes: [],
    parallelStore: "public.tower_*",
    note: "Reads operational telemetry ingested from live tool APIs, not the canonical model. Rehomed onto canonical by tower-outcomes below.",
  },

  // ---------------------------------------------------------------- planned
  //
  // Every canonical type is assigned to exactly one owning product below. The assignment rule
  // is "who answers questions about this", not "who could display it" — several products can
  // render an application, but Home owns the estate, so application_system belongs to Home and
  // Source consumes it for contract scope.
  //
  // A type appearing in two projectors is legal and expected: ownership is about who is
  // accountable for the shape, not about exclusivity of read.

  {
    status: "planned",
    id: "home-landscape",
    surface: "home",
    implementation: "scripts/data-build/refresh-home-landscape.ts",
    input: "canonical",
    consumes: [
      "tenant_profile",
      "business_function",
      "org_owner",
      "workforce_role",
      "application_system",
      "data_asset_or_integration",
      "infrastructure_platform",
      "capability_maturity_assessment",
    ],
    note: "The enterprise landscape: who the company is, what it does, who owns what, and what it runs.",
  },
  {
    status: "planned",
    id: "tower-outcomes",
    surface: "tower",
    implementation: "scripts/data-build/refresh-tower-outcomes.ts",
    input: "canonical",
    consumes: [
      "spend_value_fact",
      "metric_outcome",
      "kpi_outcome_observation",
      "benefit_realization_record",
      "tool_usage_observation",
      "process_performance_observation",
      "risk_or_control",
    ],
    note: "Spend, value and delivery outcomes. Replaces the parallel tower-mart path: telemetry lands as observed facts beside the client's declared ones, and the variance between them becomes a first-class number.",
  },
  {
    status: "planned",
    id: "moves-portfolio",
    surface: "moves",
    implementation: "scripts/data-build/refresh-moves-portfolio.ts",
    input: "canonical",
    consumes: [
      "program_initiative",
      "ai_automation_use_case",
      "interview_object_crosswalk",
      "operational_process_evidence",
      "managed_service_scope",
    ],
    note: "Programs and initiatives with their evidence. interview_object_crosswalk is the linkage from what stakeholders said to the objects they meant.",
  },
  {
    status: "planned",
    id: "intelligence-corpus",
    surface: "intelligence",
    implementation: "scripts/data-build/refresh-intelligence-corpus.ts",
    input: "canonical",
    consumes: [
      "evidence_source",
      "value_interview_evidence",
      "industry_context_pattern",
      "expert_lens",
      "relationship_source_row",
    ],
    note: "Derives retrieval chunks from canonical objects so every citation resolves to an object the products also display.",
  },
];

/** Types reaching a product through a projector that actually exists today. */
export function builtCoverage(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): Set<CanonicalObjectType> {
  const covered = new Set<CanonicalObjectType>();
  for (const p of registry) {
    if (p.status !== "built" || p.input !== "canonical") continue;
    for (const t of p.consumes) covered.add(t);
  }
  return covered;
}

/** Types assigned to a product, whether or not that projector is built yet. */
export function assignedCoverage(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): Set<CanonicalObjectType> {
  const covered = new Set<CanonicalObjectType>();
  for (const p of registry) {
    if (p.input !== "canonical") continue;
    for (const t of p.consumes) covered.add(t);
  }
  return covered;
}

/**
 * Types no product claims, even on paper.
 *
 * This is the number that matters for design completeness. An unbuilt projector is scheduled
 * work; an unassigned type is a question nobody has answered — data the platform collects and
 * has not decided what to do with.
 */
export function unassignedCanonicalTypes(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): CanonicalObjectType[] {
  const assigned = assignedCoverage(registry);
  return CANONICAL_OBJECT_TYPES.filter((t) => !assigned.has(t));
}

/** Types assigned to a product whose projector has not been built. */
export function awaitingProjector(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): CanonicalObjectType[] {
  const built = builtCoverage(registry);
  const assigned = assignedCoverage(registry);
  return [...assigned].filter((t) => !built.has(t)).sort();
}

/** Products with no built projector reading the canonical model. */
export function surfacesOffSpine(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): ProductSurface[] {
  const all: ProductSurface[] = ["home", "source", "tower", "moves", "intelligence"];
  const onSpine = new Set(
    registry.filter((p) => p.status === "built" && p.input === "canonical").map((p) => p.surface),
  );
  return all.filter((s) => !onSpine.has(s));
}

export interface CoverageSummary {
  readonly canonicalTypeCount: number;
  readonly builtCount: number;
  readonly builtPercent: number;
  readonly assignedCount: number;
  readonly assignedPercent: number;
  readonly unassigned: readonly CanonicalObjectType[];
  readonly awaitingProjector: readonly CanonicalObjectType[];
  readonly surfacesOnSpine: readonly ProductSurface[];
  readonly surfacesOffSpine: readonly ProductSurface[];
  readonly plannedProjectors: readonly ProjectorRegistration[];
  readonly parallelProjectors: readonly ProjectorRegistration[];
}

export function summariseCoverage(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): CoverageSummary {
  const built = builtCoverage(registry);
  const assigned = assignedCoverage(registry);
  const total = CANONICAL_OBJECT_TYPES.length;
  return {
    canonicalTypeCount: total,
    builtCount: built.size,
    builtPercent: Math.round((built.size / total) * 100),
    assignedCount: assigned.size,
    assignedPercent: Math.round((assigned.size / total) * 100),
    unassigned: unassignedCanonicalTypes(registry),
    awaitingProjector: awaitingProjector(registry),
    surfacesOnSpine: [
      ...new Set(
        registry.filter((p) => p.status === "built" && p.input === "canonical").map((p) => p.surface),
      ),
    ],
    surfacesOffSpine: surfacesOffSpine(registry),
    plannedProjectors: registry.filter((p) => p.status === "planned"),
    parallelProjectors: registry.filter((p) => p.input === "parallel_source"),
  };
}
