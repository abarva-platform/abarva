/**
 * Nexus Pricing Engine — PR4 archetype resolution.
 *
 * Pure functions over an already-loaded `EffortEnginePack` (see
 * `model-registry.ts` for how one gets loaded) — no I/O here.
 */
import type { EffortEnginePack, PricingArchetypeRow } from "./types";

export class UnknownArchetypeError extends Error {
  constructor(archetypeCode: string) {
    super(`unknown_archetype: '${archetypeCode}' is not in the loaded pack's pricing_archetypes`);
    this.name = "UnknownArchetypeError";
  }
}

export function getArchetype(pack: EffortEnginePack, archetypeCode: string): PricingArchetypeRow {
  const archetype = pack.archetypes.find((a) => a.archetype_code === archetypeCode);
  if (!archetype) throw new UnknownArchetypeError(archetypeCode);
  return archetype;
}

export function listArchetypeCodes(pack: EffortEnginePack): string[] {
  return pack.archetypes.map((a) => a.archetype_code).sort();
}
