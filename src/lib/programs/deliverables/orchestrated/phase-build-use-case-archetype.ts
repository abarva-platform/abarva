// Which archetype a QUEUED Moves phase build generates against.
//
// The in-process build path resolves this in `build-request.ts` via
// `resolveMoveUseCaseArchetype`, which prefers whichever of a Move's two
// declaration-bearing fields NAMES a known archetype instead of trusting field
// order. The queued path never reaches that builder: the phase-build route
// persists a job payload, and the worker rebuilds the orchestrator request from
// the payload alone (`process-deliverable-queue.ts`, `runDeliverableForTenant`)
// because the web replica that enqueued it may be gone.
//
// So the payload's `useCaseArchetype` is whatever the route was HANDED, and
// what the route is handed is `move.archetype` — the client passes
// `archetype={move.archetype}` into `PhaseApproveAndBuild`, which posts it as
// `useCaseArchetype`. That is the coarse legacy UI column, and measured against
// the shipped catalogs **none of its values names an archetype in either the
// archetype-pack catalog or the discovery-blueprint catalog**. That column
// accepts only the five `ArchetypeKey` labels —
// `strategic_transformation`, `workflow_automation`, `platform_modernization`,
// `ai_product_enablement`, `operational_optimization` — and all five resolve
// nothing. Every queued phase build therefore composed its deliverables
// with none of the declared archetype's exhibits, tables or governance note and
// prescribed the default evidence framework — silently, rendering perfectly.
//
// The route already resolves the Move's declaration for the context extract
// (`resolveDeclaredProgramArchetypeId`); it simply never reached the payload.
// This module is that one decision, kept out of the route so it is assertable
// without standing up a request, a tenancy context and a data layer.
//
// `namesCatalogArchetype` is REUSED from the in-process rule rather than
// restated here. The oracle is the same question — does this token name an
// entry in one of the two catalogs the resolved value is looked up in — and two
// derivations of "whose archetype is this" would drift apart. The sibling rule
// in `archetypes/declared-archetype-precedence.ts` is deliberately NOT the
// oracle: it asks about the Move archetype REGISTRY, a condition this consumer
// never requires.

import { type ArchetypeConfigEnv } from "@/lib/deliverables/orchestrator/briefs/archetype-config-source";

import { namesCatalogArchetype } from "./use-case-archetype-precedence";

/** Why the queued build is generating against the archetype it resolved. */
export type PhaseBuildArchetypeBasis =
  /** The archetype the route was handed already names a known archetype. */
  | "requested_names_archetype"
  /** The request named nothing and the Move's declaration named something. */
  | "declared_substituted"
  /** Neither named an archetype; the requested value is kept as the seed. */
  | "unnamed_seed";

export interface PhaseBuildArchetypeResolution {
  useCaseArchetype: string;
  basis: PhaseBuildArchetypeBasis;
  /**
   * The declaration that was available but NOT used, when one was present and
   * the requested value won anyway. Carried so a caller can report that a
   * declaration existed and did not decide this build.
   */
  unusedDeclaration: string | null;
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * The `useCaseArchetype` a queued Moves phase build should carry.
 *
 * The requested value is still preferred whenever it names a known archetype,
 * so a caller that already sends a real archetype id is unaffected. The only
 * behaviour that changes is the case this exists for: the request names nothing
 * in either catalog and the Move's declaration names something.
 *
 * When neither names an archetype the requested value is returned UNCHANGED.
 * It is the pre-existing inference seed and still feeds the prompt's use-case
 * description and the brief-registry lookup key; replacing it with a
 * declaration that resolves nothing either would discard a real signal without
 * fixing anything. Same reasoning as the in-process rule.
 */
export function resolvePhaseBuildUseCaseArchetype(
  input: {
    requestedArchetype: unknown;
    declaredArchetypeId?: unknown;
  },
  env?: ArchetypeConfigEnv,
): PhaseBuildArchetypeResolution {
  const requested = nonEmpty(input.requestedArchetype);
  const declared = nonEmpty(input.declaredArchetypeId);

  if (requested && namesCatalogArchetype(requested, env)) {
    return {
      useCaseArchetype: requested,
      basis: "requested_names_archetype",
      unusedDeclaration: declared && declared !== requested ? declared : null,
    };
  }

  if (declared && namesCatalogArchetype(declared, env)) {
    return {
      useCaseArchetype: declared,
      basis: "declared_substituted",
      unusedDeclaration: null,
    };
  }

  return {
    useCaseArchetype: requested ?? declared ?? "",
    basis: "unnamed_seed",
    unusedDeclaration: requested && declared ? declared : null,
  };
}
