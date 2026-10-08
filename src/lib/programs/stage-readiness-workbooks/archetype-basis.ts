/**
 * What shaped a stage-readiness workbook's question set, and whether a human
 * chose it.
 *
 * The workbook's dimensions ARE the resolved blueprint's evidence families, so
 * the archetype decides every question the operator is asked. The readiness
 * loader already computes WHAT decided that archetype — `blueprintBasis`, plus
 * `unknownDeclaredArchetype` for a declaration that was supplied and discarded
 * because it named no catalog archetype. Both facts reached the workbook spec
 * builder on the `readiness` object and neither was read, so the rendered
 * workbook presented an archetype nobody had declared exactly as it presented
 * a declared one — and only in the `veryHidden` `_metadata` sheet at that, so
 * the operator filling it in could not see the archetype at all.
 *
 * AGENTS.md: identity is declared, never inferred. A workbook that grades
 * evidence against an inferred or general-case archetype has to say so.
 */

import type { DiscoveryBlueprintBasis } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

/** The two bases that mean a human's declaration decided the archetype. */
const DECLARED_BASES: readonly DiscoveryBlueprintBasis[] = [
  "declared",
  "declared_via_use_case",
];

/**
 * The exclusive phrase that asserts a human declared the archetype. Exported so
 * callers and tests anchor on this name rather than retyping a substring that a
 * neighbouring sentence could also satisfy.
 */
export const DECLARED_ARCHETYPE_MARKER =
  "That archetype is declared on this Move.";

export function isDeclaredArchetypeBasis(
  basis: DiscoveryBlueprintBasis,
): boolean {
  return DECLARED_BASES.includes(basis);
}

export interface StageReadinessArchetypeBasis {
  /** The archetype label the question set was built from. */
  archetype: string;
  /** What decided that archetype. */
  basis: DiscoveryBlueprintBasis;
  /** True only for the bases that mean a human declared it. */
  declared: boolean;
  /**
   * A declaration that WAS supplied and was discarded because it named no
   * catalog archetype. Non-null means the workbook is grading against an
   * archetype nobody declared while a declaration exists on the Move.
   */
  discardedDeclaration: string | null;
  /**
   * One operator-facing sentence for the workbook's own visible sheet. Names
   * the archetype and what decided it, and never says "declared" unless it
   * was.
   */
  statement: string;
}

function basisClause(
  archetype: string,
  basis: DiscoveryBlueprintBasis,
): string {
  switch (basis) {
    case "declared":
    case "declared_via_use_case":
      // `DECLARED_ARCHETYPE_MARKER` must not be a substring of any other
      // clause, or a reader (or a test) checking for a declaration would be
      // satisfied by the sentence that denies one. The `default` clause says
      // "has been declared", which does not contain it.
      return `These questions come from the ${archetype} archetype. ${DECLARED_ARCHETYPE_MARKER}`;
    case "inferred":
      // Keyword matching over the Move's own text picked this. Nobody chose it.
      return `These questions come from the ${archetype} archetype, which was matched from this Move's wording rather than declared. No one has confirmed it.`;
    case "default":
      return `No archetype has been declared on this Move, so these questions come from the ${archetype} question set rather than an archetype-specific one.`;
  }
}

export function buildStageReadinessArchetypeBasis(args: {
  archetype: string;
  blueprintBasis: DiscoveryBlueprintBasis;
  unknownDeclaredArchetype: string | null;
}): StageReadinessArchetypeBasis {
  const archetype = args.archetype.trim() || "general";
  const discardedDeclaration =
    args.unknownDeclaredArchetype?.trim() || null;
  const declared = isDeclaredArchetypeBasis(args.blueprintBasis);

  // A discarded declaration is stated FIRST and on every basis that carries
  // one: the operator who supplied it is the one who most needs to know it did
  // not take effect. It cannot co-occur with a declared basis — a declaration
  // that resolved is not discarded — so the two clauses never contradict.
  const statement = discardedDeclaration
    ? `"${discardedDeclaration}" was supplied as this Move's archetype but names no archetype in the catalog, so it was discarded. ${basisClause(archetype, args.blueprintBasis)}`
    : basisClause(archetype, args.blueprintBasis);

  return {
    archetype,
    basis: args.blueprintBasis,
    declared,
    discardedDeclaration,
    statement,
  };
}
