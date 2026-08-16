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

export interface ProjectorRegistration {
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
  {
    id: "source-l4-cube",
    surface: "source",
    implementation: "scripts/data-build/refresh-source-l4-cube.ts",
    input: "canonical",
    consumes: ["vendor_contract", "application_system"],
    note: "Projects contracts, vendors and scope into source.* and the consumption cube views.",
  },
  {
    id: "tower-mart",
    surface: "tower",
    implementation: "src/scripts/tower/project-tower-mart.ts",
    input: "parallel_source",
    consumes: [],
    parallelStore: "public.tower_*",
    note: "Reads operational telemetry ingested from live tool APIs, not the canonical model.",
  },
];

/** Types that reach at least one product through the canonical model. */
export function coveredCanonicalTypes(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): Set<CanonicalObjectType> {
  const covered = new Set<CanonicalObjectType>();
  for (const projector of registry) {
    if (projector.input !== "canonical") continue;
    for (const type of projector.consumes) covered.add(type);
  }
  return covered;
}

/** Canonical types produced by the build that no projector consumes. */
export function uncoveredCanonicalTypes(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): CanonicalObjectType[] {
  const covered = coveredCanonicalTypes(registry);
  return CANONICAL_OBJECT_TYPES.filter((type) => !covered.has(type));
}

/** Products with no projector reading the canonical model. */
export function surfacesOffSpine(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): ProductSurface[] {
  const all: ProductSurface[] = ["home", "source", "tower", "moves", "intelligence"];
  const onSpine = new Set(
    registry.filter((p) => p.input === "canonical").map((p) => p.surface),
  );
  return all.filter((surface) => !onSpine.has(surface));
}

export interface CoverageSummary {
  readonly canonicalTypeCount: number;
  readonly coveredTypeCount: number;
  readonly coveragePercent: number;
  readonly uncovered: readonly CanonicalObjectType[];
  readonly surfacesOnSpine: readonly ProductSurface[];
  readonly surfacesOffSpine: readonly ProductSurface[];
  readonly parallelProjectors: readonly ProjectorRegistration[];
}

export function summariseCoverage(
  registry: readonly ProjectorRegistration[] = PROJECTOR_REGISTRY,
): CoverageSummary {
  const covered = coveredCanonicalTypes(registry);
  const onSpine = [
    ...new Set(
      registry.filter((p) => p.input === "canonical").map((p) => p.surface),
    ),
  ];
  return {
    canonicalTypeCount: CANONICAL_OBJECT_TYPES.length,
    coveredTypeCount: covered.size,
    coveragePercent: Math.round((covered.size / CANONICAL_OBJECT_TYPES.length) * 100),
    uncovered: uncoveredCanonicalTypes(registry),
    surfacesOnSpine: onSpine,
    surfacesOffSpine: surfacesOffSpine(registry),
    parallelProjectors: registry.filter((p) => p.input === "parallel_source"),
  };
}
