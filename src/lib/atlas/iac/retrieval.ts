/**
 * Initiative-Archetype Corpus (IAC) — retrieval functions.
 *
 * Pure, deterministic, side-effect-free. Atlas composition (Wave 3) wires
 * these into its prompt-assembly path. Wave 2 archetype slices do not need
 * to touch this file.
 */

import type { InitiativeArchetype } from './types';
import { INITIATIVE_ARCHETYPES } from './registry';

/**
 * Return a single archetype by its stable key, or `null` when not found.
 * Pure and deterministic.
 */
export function getArchetype(archetypeKey: string): InitiativeArchetype | null {
  if (typeof archetypeKey !== 'string' || archetypeKey.length === 0) {
    return null;
  }
  const found = INITIATIVE_ARCHETYPES.find((a) => a.archetypeKey === archetypeKey);
  return found ?? null;
}

/**
 * Return all archetypes in the registry. The returned array is a copy so
 * callers cannot mutate the registry by accident.
 */
export function listArchetypes(): InitiativeArchetype[] {
  return INITIATIVE_ARCHETYPES.slice();
}

/**
 * Find an archetype by loose, case-insensitive includes-match against the
 * `archetypeKey` or the tokens of the `label`. Honest `null` when no match.
 *
 * The match is intentionally conservative — it does not synonym-expand or
 * stem; that is Atlas composition's job (Wave 3) where the full prompt
 * context is available. This helper is the deterministic fallback Atlas
 * uses when it has a strong hint and wants a single canonical entry back.
 */
export function findArchetypeByLooseMatch(text: string): InitiativeArchetype | null {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }
  const needle = text.toLowerCase().trim();

  for (const archetype of INITIATIVE_ARCHETYPES) {
    if (needle.includes(archetype.archetypeKey.toLowerCase())) {
      return archetype;
    }
    const keyWithSpaces = archetype.archetypeKey.replace(/_/g, ' ').toLowerCase();
    if (needle.includes(keyWithSpaces)) {
      return archetype;
    }
    const label = archetype.label.toLowerCase();
    if (needle.includes(label)) {
      return archetype;
    }
    const labelTokens = label.split(/\s+/).filter((t) => t.length >= 4);
    if (labelTokens.length > 0 && labelTokens.every((t) => needle.includes(t))) {
      return archetype;
    }
  }
  return null;
}
