// Archetype identity — the ONE way a declared archetype token is turned into a
// catalog entry.
//
// Two archetype catalogs read the same declared value: the discovery blueprint
// catalog (`discovery-blueprint.ts`, keyed lower_snake) and the artifact
// archetype packs (`archetype-packs.ts`, keyed UPPER_SNAKE). They are reached
// from the same request field, so they must agree on what a declaration means.
// Before this module they did not: the blueprint path normalized the token and
// the pack path did a raw, case-sensitive index, so a declaration spelled the
// way one catalog is keyed silently resolved nothing in the other — the Move
// kept its archetype-specific evidence plan and quietly lost its
// archetype-specific exhibits, tables and governance note (or the reverse).
//
// Identity is declared, never inferred: this module only ever answers with an
// entry the catalog actually declares. It is deliberately not a fuzzy matcher.

/**
 * Normalize a declared archetype token to a catalog key: trim, lowercase, and
 * collapse separators (spaces, dots, slashes, dashes) to single underscores.
 */
export function normalizeArchetypeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s./-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Resolve a DECLARED archetype token against a catalog.
 *
 * The token and every catalog key are compared in normalized form, so the two
 * archetype catalogs answer the same declaration even though one is keyed
 * UPPER_SNAKE and the other lower_snake. Matching walks the catalog's OWN
 * enumerable keys, which is why an inherited `Object.prototype` member can
 * never be returned: a plain index with a data-controlled token answered them.
 * A Move declaring the archetype `constructor` resolved to `Object` — truthy,
 * and not an entry — which then flowed into brief composition as a pack.
 *
 * Returns null when nothing was declared, when the declaration normalizes to
 * nothing, or when it does not name a catalog entry, so callers keep falling
 * through to their own fallback rather than silently mis-selecting. It is
 * deliberately not a fuzzy matcher: a multi-word inference blob normalizes to a
 * multi-word token and matches no id.
 *
 * Two keys that normalize alike would make the answer depend on key order; the
 * catalogs are pinned against that in `archetype-identity.test.ts`.
 */
export function resolveArchetypeCatalogEntry<T>(
  catalog: Readonly<Record<string, T>>,
  declaredArchetypeId: string | null | undefined,
): T | null {
  if (!declaredArchetypeId) return null;

  // A declaration of separators alone (or whitespace alone) normalizes away.
  const normalized = normalizeArchetypeId(declaredArchetypeId);
  if (!normalized) return null;

  for (const key of Object.keys(catalog)) {
    if (normalizeArchetypeId(key) === normalized) return catalog[key];
  }
  return null;
}
