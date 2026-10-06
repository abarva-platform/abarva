// What a person can actually DECLARE — the human end of the configurable
// archetype engine.
//
// The engine already lets a deploying firm author archetypes of its own in a
// declared JSON source: the source is validated, the archetype joins the
// effective catalog, and `resolveDiscoveryBlueprintFromConfiguredCatalog`
// resolves a Move that declares one. Every one of those steps reads the
// EFFECTIVE catalog.
//
// The two places a declaration is actually made did not. Both were bound to the
// shipped seed, so a configured archetype was reachable in generation and
// unreachable in practice:
//
//   - `listDiscoveryArchetypeOptions` builds the picker on the Move
//     origination screen. It enumerates the seed, so a configured archetype is
//     never offered — the one screen where a human declares one cannot show it.
//   - `normalizeDiscoveryArchetypeDeclaration` validates a submitted
//     declaration against the seed and THROWS `unknown_discovery_archetype`
//     otherwise. So even an operator who knew the id and submitted it by hand
//     was refused at origination.
//
// Together those meant the declared path could not be exercised end to end at
// all: nothing could get a configured archetype's id onto a Move, so the
// resolution that honours it was never reached. This module is the missing
// half — the effective catalog, offered and accepted.
//
// Identity is still declared, never inferred. Nothing here guesses: keyword
// suggestion continues to read only shipped text (see the release record's
// Known Gaps), and this module only ever answers with an entry some catalog —
// shipped or configured — actually declares.
//
// Additive by construction: with no source declared the effective catalog IS
// the seed and `applied` is empty, so the option list is the shipped list in
// the shipped order and every declaration resolves exactly as before.

import {
  configuredBlueprintOrigin,
  loadEffectiveDiscoveryBlueprintCatalog,
  type ArchetypeConfigEnv,
  type ConfiguredBlueprintOrigin,
} from "./archetype-config-source";
import {
  resolveDeclaredDiscoveryBlueprint,
  type DiscoveryBlueprint,
} from "./discovery-blueprint";

export interface EffectiveDiscoveryArchetypeOption {
  blueprintId: string;
  archetypeLabel: string;
  /**
   * Whose archetype this is — the same three states a resolution reports, so a
   * picker and a resolution cannot disagree about an entry's provenance.
   *
   * It describes the ENTRY, not the identifier: a configured source that
   * replaces a shipped archetype keeps the shipped id and is still
   * `configured_override`, because the label, evidence families and interview
   * roster the option offers came from the firm's source. The id cannot answer
   * the question a picker has to answer, which is "is this ours?".
   */
  origin: ConfiguredBlueprintOrigin;
}

/**
 * Every archetype a person may declare right now, with where it came from.
 *
 * A source that fails validation leaves the seed in force and applies nothing,
 * so this list falls back to the shipped archetypes whole. It never offers half
 * a rejected source.
 */
export function listEffectiveDiscoveryArchetypeOptions(
  env: ArchetypeConfigEnv = process.env,
): EffectiveDiscoveryArchetypeOption[] {
  const effective = loadEffectiveDiscoveryBlueprintCatalog(env);
  return Object.values(effective.catalog)
    .map(({ blueprintId, archetypeLabel }) => ({
      blueprintId,
      archetypeLabel,
      origin: configuredBlueprintOrigin(blueprintId, effective.applied),
    }))
    .sort((a, b) => a.archetypeLabel.localeCompare(b.archetypeLabel));
}

/**
 * Resolve a declared archetype token against the effective catalog.
 *
 * Matching is delegated to `resolveDeclaredDiscoveryBlueprint`, the one
 * declared-identity rule both archetype catalogs already share, so what counts
 * as naming an entry cannot drift between offering an archetype and accepting
 * it.
 *
 * Returns null — never throws — when nothing was declared or the declaration
 * names no entry, so callers keep their own fallback.
 */
export function resolveEffectiveDeclaredDiscoveryBlueprint(
  declaredArchetypeId: string | null | undefined,
  env: ArchetypeConfigEnv = process.env,
): DiscoveryBlueprint | null {
  return resolveDeclaredDiscoveryBlueprint(
    declaredArchetypeId,
    loadEffectiveDiscoveryBlueprintCatalog(env).catalog,
  );
}
