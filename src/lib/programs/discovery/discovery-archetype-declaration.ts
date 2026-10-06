// Validation of a human's archetype declaration at Move origination.
//
// Resolution goes through the EFFECTIVE catalog (seed plus whatever a deploying
// firm's configured source puts in force), not the shipped seed. Validating
// against the seed here was what made a configured archetype undeclarable: the
// engine would honour it in generation, and this function threw
// `unknown_discovery_archetype` before it could ever be stored on a Move.
//
// With no configured source declared the effective catalog is the seed, so every
// declaration that was accepted before is accepted identically.
import { resolveEffectiveDeclaredDiscoveryBlueprint } from "@/lib/deliverables/orchestrator/briefs/archetype-declaration-surface";

export function normalizeDiscoveryArchetypeDeclaration(
  value: unknown,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error("unknown_discovery_archetype");
  const id = value.trim();
  if (!id) return null;
  if (!resolveEffectiveDeclaredDiscoveryBlueprint(id)) {
    throw new Error("unknown_discovery_archetype");
  }
  return id;
}

export function withDeclaredDiscoveryArchetype<
  T extends Record<string, unknown>,
>(classification: T, archetypeId: string | null): T & Record<string, unknown> {
  if (!archetypeId) return { ...classification };
  if (!resolveEffectiveDeclaredDiscoveryBlueprint(archetypeId)) {
    throw new Error("unknown_discovery_archetype");
  }
  return {
    ...classification,
    archetype: archetypeId,
    archetype_source: "human_declared_at_origination",
  };
}
