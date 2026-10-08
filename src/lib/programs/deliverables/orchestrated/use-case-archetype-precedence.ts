// Which of a Move's declaration-bearing fields becomes the orchestrator
// request's `useCaseArchetype`.
//
// A Move can carry a declaration in two fields holding two different id
// spaces. `charter.classification.archetype` holds a discovery-blueprint /
// archetype-pack id — the value `scripts/moves/declare-discovery-archetype-job.ts`
// writes. `function_pack_key` holds a FUNCTION-pack key
// (`revenue_cycle`, `customer_care`, `payer_claims_operations`, …), which is a
// different catalog entirely.
//
// The request builder read `function_pack_key` first and UNCONDITIONALLY, so a
// function-pack key shadowed a real declaration. Measured against the shipped
// catalogs: of the 39 function-pack keys the registry declares, **none names an
// archetype pack**, and only six resolve a blueprint at all — by keyword
// INFERENCE off the key's own words, not by naming one. So every Move whose
// function pack was classified handed the orchestrator a `useCaseArchetype`
// that selects no pack, and the brief it generated carried none of the declared
// archetype's exhibits, tables, governance note or key evidence families, while
// its discovery plan prescribed the default evidence framework.
//
// This is the same defect `archetypes/declared-archetype-precedence.ts`
// documents, reached from a third call site. The rule is the same in substance
// — prefer the candidate that NAMES a known archetype, rather than trusting
// field order — but the ORACLE has to differ, and that is the whole reason this
// is a separate module rather than a reuse of that one. There, the question is
// "does this name an entry in the Move archetype REGISTRY", asked through
// `declared-archetype-bridge.ts`. Here, the only catalogs the resolved value
// will be looked up in are the archetype-pack catalog and the
// discovery-blueprint catalog, so those two have to be the oracle. A rule
// borrowed wholesale would answer a question this consumer never asks — see
// [[feedback_a_strict_reading_borrowed_for_another_question_gates_on_what_it_never_required]].
//
// Naming is asked as a KEY question against the EFFECTIVE catalogs, so an
// archetype a deploying firm configured counts as named exactly like a shipped
// one, and so keyword inference does NOT count. That distinction is load
// bearing: six function-pack keys infer a blueprint, and were inference
// accepted as naming, those six would go on shadowing a real declaration.
//
// Deliberately NOT read: `program.archetype`. That column holds one of five
// coarse legacy UI labels, none of which names an archetype in either catalog.

import {
  loadEffectiveArchetypePackCatalog,
  loadEffectiveDiscoveryBlueprintCatalog,
  type ArchetypeConfigEnv,
} from "@/lib/deliverables/orchestrator/briefs/archetype-config-source";
import { resolveArchetypeCatalogKey } from "@/lib/deliverables/orchestrator/briefs/archetype-identity";

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Whether a declared token names an entry in either catalog the resolved
 * `useCaseArchetype` is looked up in.
 *
 * Resolution goes through `resolveArchetypeCatalogKey`, the one identity rule
 * both catalogs share, so a declaration spelled `governed_data_foundation`
 * answers the UPPER_SNAKE pack catalog and the lower_snake blueprint catalog
 * alike. Either catalog is enough: an archetype that contributes only exhibits,
 * or only an evidence framework, is still an archetype this Move declared.
 */
export function namesCatalogArchetype(
  candidate: string,
  env: ArchetypeConfigEnv = process.env,
): boolean {
  const packs = loadEffectiveArchetypePackCatalog(env).catalog;
  if (resolveArchetypeCatalogKey(packs, candidate) !== null) return true;
  const blueprints = loadEffectiveDiscoveryBlueprintCatalog(env).catalog;
  return resolveArchetypeCatalogKey(blueprints, candidate) !== null;
}

/**
 * The `useCaseArchetype` for a Move's orchestrator request.
 *
 * `functionPackKey` is still listed first, so it still wins whenever both
 * fields name a known archetype or neither does. The only behaviour that
 * changes is the case this exists for: the pack key names nothing in either
 * catalog and the charter declaration names something.
 *
 * When no candidate names an archetype the first non-empty value is returned
 * unchanged — it is the pre-existing inference seed, and it still feeds the
 * prompt's use-case description and the brief-registry lookup key. Dropping it
 * in favour of the fallback would discard a real signal to fix an unrelated
 * one.
 */
export function resolveMoveUseCaseArchetype(
  input: {
    functionPackKey?: unknown;
    charterClassificationArchetype?: unknown;
    fallback: string;
  },
  env: ArchetypeConfigEnv = process.env,
): string {
  const candidates = [
    nonEmpty(input.functionPackKey),
    nonEmpty(input.charterClassificationArchetype),
  ].filter((value): value is string => value !== null);

  const named = candidates.find((candidate) =>
    namesCatalogArchetype(candidate, env),
  );

  return named ?? candidates[0] ?? input.fallback;
}

/**
 * The archetype id declared on a Move's charter, read defensively.
 *
 * `charter.classification` is a bare string on older Moves, so reading
 * `.archetype` off it must not throw. Mirrors
 * `archetypes/declared-archetype-precedence.ts`'s reader rather than importing
 * it: that module is reached through the registry bridge and pulling it in here
 * would drag the registry's module graph into the request builder for the sake
 * of four lines.
 *
 * The `typeof !== "object"` clause is stated intent, not reachable behaviour,
 * and the same is true in the sibling: JS boxes a primitive, so
 * `"platform work".archetype` is already `undefined` and this answers null
 * either way. The only input it changes is a FUNCTION carrying an `archetype`
 * property, which `charter` — a JSONB column — cannot hold. A mutation removing
 * it therefore survives because it changes nothing, not for want of a case.
 */
export function charterDeclaredUseCaseArchetype(
  charter: Record<string, unknown> | null | undefined,
): string | null {
  const classification = charter?.classification;
  if (!classification || typeof classification !== "object") return null;
  return nonEmpty((classification as Record<string, unknown>).archetype);
}
