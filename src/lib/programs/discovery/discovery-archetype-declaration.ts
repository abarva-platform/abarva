import { resolveDeclaredDiscoveryBlueprint } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

export function normalizeDiscoveryArchetypeDeclaration(
  value: unknown,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error("unknown_discovery_archetype");
  const id = value.trim();
  if (!id) return null;
  if (!resolveDeclaredDiscoveryBlueprint(id)) {
    throw new Error("unknown_discovery_archetype");
  }
  return id;
}

export function withDeclaredDiscoveryArchetype<
  T extends Record<string, unknown>,
>(classification: T, archetypeId: string | null): T & Record<string, unknown> {
  if (!archetypeId) return { ...classification };
  if (!resolveDeclaredDiscoveryBlueprint(archetypeId)) {
    throw new Error("unknown_discovery_archetype");
  }
  return {
    ...classification,
    archetype: archetypeId,
    archetype_source: "human_declared_at_origination",
  };
}
