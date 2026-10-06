// =============================================================================
// Solution-pattern catalog — the platform-fit option set, per declared archetype
// -----------------------------------------------------------------------------
// The platform-fit gate asks a named owner one question: where does the
// capability this Move builds actually run? The shipped five options answer
// that for a Move whose capability is an AI assist sitting beside a system of
// record, and one of them names that system of record outright.
//
// A Move that declares a different kind of work is asked the same question with
// the wrong five answers. Its honest answer is not on the list, and
// `readSolutionPatternFromCharter` only returns a recognised pattern — so the
// owner either picks a label that misdescribes the Move or records nothing. A
// classification that can only be answered falsely is worse than no
// classification: it is written to the charter as a named owner's explicit
// judgement, and everything downstream reads it as one.
//
// This is the same repair the P3 option assembler already made for the A/B/C/D
// solution options: `ARCHETYPE_USE_CASE_PATTERNS` there maps a DECLARED
// archetype to the option ladder that fits it, and falls back to the generic
// ladder otherwise. The platform-fit picker was the surface that join never
// reached. Resolution follows the same rule the rest of the product follows —
// identity is DECLARED, never inferred. An exact archetype-id match wins; no
// keyword, prose, or name matching happens here, and anything undeclared or
// unrecognised keeps the shipped set unchanged.
//
// What this module does NOT do, for the same reason the original module did not:
// it does not calculate a suggested pattern. The source workbook's "Solutioning"
// tab derives one from Discovery answers; that formula is not available, so each
// set stays a named owner's explicit classification with a rationale.
// =============================================================================

export interface SolutionPatternOption {
  readonly value: string;
  readonly description: string;
  /**
   * The source model's own routing language for this pattern — surfaced in
   * the UI as context, not enforced as a governance.ts gate check in this
   * pass (see the release record's Known Gaps).
   */
  readonly routingNote: string;
}

/**
 * The three routing dispositions the source model recognises. Every option in
 * every set must carry one of them: the panel maps the note to a chip tone, and
 * an unrecognised note renders as a neutral chip that states no disposition at
 * all. `solution-pattern-catalog.test.ts` asserts this across the whole catalog.
 */
export const SOLUTION_PATTERN_ROUTING_NOTES = [
  "Proceed, standard review.",
  "Check coverage first.",
  "Challenge by default.",
] as const;

/**
 * The shipped set, unchanged. This is what every Move got before the catalog
 * existed and what every Move that declares nothing still gets, in this order.
 */
export const DEFAULT_SOLUTION_PATTERN_OPTIONS = [
  {
    value: "Build on the Platform",
    description:
      "Core functionality runs on the platform — its compute, its data, its models — inside the tenant's own boundary.",
    routingNote: "Proceed, standard review.",
  },
  {
    value: "Point Automation",
    description:
      "One system the tenant already runs and has already approved. Nothing new enters the estate.",
    routingNote: "Proceed, standard review.",
  },
  {
    value: "Embedded in a Licensed Product",
    description:
      "AI built into something the tenant already licenses for its actual job.",
    routingNote: "Check coverage first.",
  },
  {
    value: "Native to the Core Clinical System",
    description:
      "AI capabilities shipped inside the core system of record itself, running on its own data.",
    routingNote: "Check coverage first.",
  },
  {
    value: "New Third-Party Platform",
    description:
      "Data ships out to a vendor the tenant does not already have this relationship with.",
    routingNote: "Challenge by default.",
  },
] as const satisfies readonly SolutionPatternOption[];

/**
 * A governed-data-foundation Move builds a certified foundation — ownership,
 * semantic layer, lineage, quality — not an assist beside a system of record.
 * The platform-fit question still applies, and so does the routing ladder: the
 * further the governed data sits from what the tenant already runs and has
 * already approved, the harder the review. Only the five answers change, to
 * name where the GOVERNED DATA capability lives rather than where an AI assist
 * lives.
 *
 * The five-way shape and the three routing dispositions are kept deliberately
 * identical to the shipped set. This is a retargeting of the same taxonomy, not
 * a new one, and it is flagged for product review in the release record — a
 * named owner's classification vocabulary is Anand's call, not a resolver's.
 */
export const GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS = [
  {
    value: "Govern on the Platform",
    description:
      "Ownership, certified definitions, lineage and quality controls run on the platform already in place, inside the tenant's own boundary.",
    routingNote: "Proceed, standard review.",
  },
  {
    value: "Point Remediation in an Existing System",
    description:
      "Stewardship and quality rules are fixed inside one system the tenant already runs and has already approved. Nothing new enters the estate.",
    routingNote: "Proceed, standard review.",
  },
  {
    value: "Embedded in a Licensed Data Product",
    description:
      "Catalog, lineage or quality capability built into something the tenant already licenses for its actual job.",
    routingNote: "Check coverage first.",
  },
  {
    value: "Native to the Core System of Record",
    description:
      "Governance capabilities shipped inside the system that already owns the data, running on its own stores.",
    routingNote: "Check coverage first.",
  },
  {
    value: "New Third-Party Data Platform",
    description:
      "Governed data lands in a platform the tenant does not already have this relationship with.",
    routingNote: "Challenge by default.",
  },
] as const satisfies readonly SolutionPatternOption[];

/**
 * DECLARED archetype id → the platform-fit set that archetype is asked.
 *
 * Keyed by the discovery-blueprint id space a Move declares in
 * `charter.classification.archetype` — the same id space
 * `ARCHETYPE_USE_CASE_PATTERNS` (p3-option-assembler) and
 * `DECLARED_ARCHETYPE_ALIASES` (archetypes/registry) are keyed by. Every key is
 * asserted to name a known archetype, so a typo cannot sit here silently
 * matching nothing.
 */
export const SOLUTION_PATTERN_CATALOG: Readonly<
  Record<string, readonly SolutionPatternOption[]>
> = {
  governed_data_foundation: GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS,
};

/**
 * Every pattern value any set offers. Read validation uses this union, NOT the
 * resolved set: a pattern recorded under one archetype must stay readable if
 * the Move's declaration later changes, or the charter would silently lose a
 * named owner's signed classification.
 */
export const ALL_SOLUTION_PATTERN_VALUES: ReadonlySet<string> = new Set<string>(
  [
    ...DEFAULT_SOLUTION_PATTERN_OPTIONS,
    ...Object.values(SOLUTION_PATTERN_CATALOG).flat(),
  ].map((option) => option.value),
);

/** Any pattern the catalog can offer, as a literal union. */
export type SolutionPattern =
  | (typeof DEFAULT_SOLUTION_PATTERN_OPTIONS)[number]["value"]
  | (typeof GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS)[number]["value"];

/**
 * The platform-fit options a Move is asked, from its DECLARED archetype id.
 * Exact match only — no inference. Undeclared, or declared as something with no
 * configured set, keeps the shipped set unchanged.
 */
export function solutionPatternOptionsFor(
  declaredArchetypeId?: string | null,
): readonly SolutionPatternOption[] {
  const key = (declaredArchetypeId ?? "").trim().toLowerCase();
  if (!key) return DEFAULT_SOLUTION_PATTERN_OPTIONS;
  return SOLUTION_PATTERN_CATALOG[key] ?? DEFAULT_SOLUTION_PATTERN_OPTIONS;
}

/**
 * May this Move RECORD this pattern? Write validation is scoped to the resolved
 * set, so a classification that misdescribes the declared kind of work cannot
 * be written — the asymmetry with `ALL_SOLUTION_PATTERN_VALUES` above is the
 * point, not an oversight.
 */
export function isSolutionPatternAllowedFor(
  declaredArchetypeId: string | null | undefined,
  pattern: unknown,
): boolean {
  if (typeof pattern !== "string") return false;
  return solutionPatternOptionsFor(declaredArchetypeId).some(
    (option) => option.value === pattern,
  );
}
