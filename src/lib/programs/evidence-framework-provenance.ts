/**
 * What decided the evidence framework a phase refusal is naming.
 *
 * The Moves phase gate and the phase build both hold a Move open by listing
 * evidence slots, and both get that list from one place:
 * `loadDiscoveryEvidenceReadiness` -> `readiness.families` ->
 * `buildMoveEvidenceNeedPackets` -> `currentPhaseRequiredEvidenceGaps`. The
 * families come from a discovery blueprint, and the readiness pack already
 * records which blueprint and WHY it was chosen:
 *
 *   - `blueprintBasis` — `declared` / `declared_via_use_case` mean a human's
 *     declaration picked the framework; `inferred` means keyword matching on the
 *     Move's own text picked it; `default` means nothing matched and the
 *     general-case blueprint applied.
 *   - `unknownDeclaredArchetype` — a declaration WAS supplied and named nothing
 *     in the catalog, so it was discarded and a different framework graded the
 *     evidence. The field's own contract says to show it "rather than presenting
 *     the archetype as declared".
 *
 * Both facts stop at the packet builder, which reads only `families` and
 * `gapRegister`. So a refusal whose slots came from an inferred framework calls
 * them "Required evidence" in exactly the words it uses for a declared one. On a
 * Move whose declaration never landed, that sentence asserts a requirement no
 * one chose — and the operator has no way to tell the two cases apart.
 *
 * This module turns those two recorded facts into one honest sentence and a
 * structured verdict. It relaxes nothing: the gate still refuses, the build is
 * still not queued, the slot list is unchanged. Only the claim about where the
 * list came from changes, and only when that claim would otherwise be false.
 */

import type { DiscoveryBlueprintBasis } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

/**
 * The bases that mean a human chose the framework.
 *
 * Membership is POSITIVE on purpose. An unrecognised basis — a future value, or
 * a payload that lost the field — must read as "not declared", because the
 * sentence this module guards is the one that claims a declaration exists. A
 * ladder of negative arms would let the unknown case through as declared.
 */
const DECLARED_BASES: ReadonlySet<string> = new Set<DiscoveryBlueprintBasis>([
  "declared",
  "declared_via_use_case",
]);

/** How the framework was chosen, as the refusal should state it. */
export type EvidenceFrameworkOrigin =
  /** A declaration named this framework. */
  | "declared"
  /** A declaration was supplied, named nothing in the catalog, and was dropped. */
  | "declaration_discarded"
  /** Keyword matching on the Move's own text picked this framework. */
  | "inferred"
  /** Nothing matched; the general-case framework applied. */
  | "default"
  /** The basis was not one this build recognises. Treated as not declared. */
  | "unrecognised_basis";

export interface EvidenceFrameworkProvenance {
  /** True ONLY when a declaration chose this framework and was not discarded. */
  declared: boolean;
  origin: EvidenceFrameworkOrigin;
  /** The basis the readiness pack recorded, carried through unchanged. */
  basis: string;
  /** The framework the slots were graded against. */
  archetypeLabel: string;
  /** The declaration that named nothing and was dropped, when there was one. */
  discardedDeclaration: string | null;
  /**
   * One sentence for a refusal that lists these slots. Present for every origin
   * so a caller can report a declared framework too; `declared` says whether
   * appending it corrects a false claim or merely confirms a true one.
   */
  statement: string;
}

function boundedLabel(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : fallback;
}

function originFor(
  basis: string,
  discardedDeclaration: string | null,
): EvidenceFrameworkOrigin {
  // A discarded declaration outranks the basis: the basis then reports how the
  // REPLACEMENT framework was picked, which is true but answers a different
  // question than "was this Move's declaration honoured".
  if (discardedDeclaration) return "declaration_discarded";
  if (DECLARED_BASES.has(basis)) return "declared";
  if (basis === "inferred") return "inferred";
  if (basis === "default") return "default";
  return "unrecognised_basis";
}

function statementFor(
  origin: EvidenceFrameworkOrigin,
  archetypeLabel: string,
  discardedDeclaration: string | null,
): string {
  switch (origin) {
    case "declared":
      return `These evidence slots come from the declared ${archetypeLabel} framework.`;
    case "declaration_discarded":
      return `These evidence slots are not a declared requirement: the declaration "${discardedDeclaration}" named no framework in the catalog, so it was discarded and the ${archetypeLabel} framework graded the evidence instead. Declare the Move's framework and re-read readiness before treating this list as its requirement.`;
    case "inferred":
      return `These evidence slots are not a declared requirement: no framework was declared for this Move, so the ${archetypeLabel} framework was inferred from the Move's own text. Declare the Move's framework and re-read readiness before treating this list as its requirement.`;
    case "default":
      return `These evidence slots are not a declared requirement: no framework was declared for this Move and none was inferred, so the general-case ${archetypeLabel} framework graded the evidence. Declare the Move's framework and re-read readiness before treating this list as its requirement.`;
    // Last arm: anything this build does not recognise. It must read as NOT
    // declared, and it must say that the basis itself could not be read rather
    // than inventing a reason the framework was chosen.
    default:
      return `These evidence slots are not a declared requirement: what chose the ${archetypeLabel} framework could not be read, so no declaration can be confirmed. Declare the Move's framework and re-read readiness before treating this list as its requirement.`;
  }
}

/**
 * Resolve the provenance of the framework a readiness pack graded against.
 *
 * Pure. Takes the two fields the pack already carries plus its label, so it can
 * be called from a route, a worker, or a test without a readiness load.
 */
export function resolveEvidenceFrameworkProvenance(input: {
  blueprintBasis: unknown;
  archetypeLabel: unknown;
  unknownDeclaredArchetype: unknown;
}): EvidenceFrameworkProvenance {
  const basis =
    typeof input.blueprintBasis === "string" ? input.blueprintBasis : "";
  const archetypeLabel = boundedLabel(input.archetypeLabel, "general-case");
  const discardedDeclaration =
    typeof input.unknownDeclaredArchetype === "string" &&
    input.unknownDeclaredArchetype.trim()
      ? input.unknownDeclaredArchetype.trim().slice(0, 120)
      : null;
  const origin = originFor(basis, discardedDeclaration);
  return {
    declared: origin === "declared",
    origin,
    basis,
    archetypeLabel,
    discardedDeclaration,
    statement: statementFor(origin, archetypeLabel, discardedDeclaration),
  };
}

/**
 * The refusal `detail` a route should send, given its own wording.
 *
 * Returns `detail` byte-for-byte when the framework WAS declared (the existing
 * sentence is already true) or when no provenance could be resolved. Otherwise
 * appends the one sentence that stops "Required evidence" from asserting a
 * requirement nobody declared.
 */
export function appendEvidenceFrameworkProvenance(
  detail: string,
  provenance: EvidenceFrameworkProvenance | null | undefined,
): string {
  if (!provenance || provenance.declared) return detail;
  return `${detail} ${provenance.statement}`;
}
