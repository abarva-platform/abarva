// Which of a Move's declaration-bearing fields is read as its declared
// archetype id.
//
// Two fields can carry a declaration — `functionPackKey` and
// `charter.classification.archetype` — and they hold DIFFERENT id spaces.
// `charter.classification.archetype` holds a discovery-blueprint id, which is
// what the declaration job writes and what `declared-archetype-bridge.ts`
// translates. `functionPackKey` holds a function-pack key
// (`healthcare_member_services`, `customer_care`, `legal_operations`, …), and
// only one shipped pack key is also a blueprint id.
//
// So field order alone cannot decide this. Reading `functionPackKey` first and
// unconditionally lets a pack key that names NO archetype shadow a blueprint id
// that names one: the shadowing value reaches the registry's declared arm, the
// bridge answers null for it, and resolution falls through to keyword
// inference — which hands the Move a different evidence framework and renders
// its readiness report perfectly. That is the failure
// `declared-archetype-bridge.ts` documents, arrived at from the caller's side
// instead of the map's.
//
// The rule is therefore the one `resolveDeclaredProgramArchetypeId`
// (`src/lib/programs/discovery/evidence-readiness.ts`) already applies: prefer
// the first candidate that NAMES a known archetype, so a declared identity wins
// regardless of which field carries it. When no candidate names one, the first
// non-empty value is returned unchanged, which is the pre-existing inference
// seed.
//
// Why this is a module of its own rather than a few lines in the resolver: the
// resolver is `server-only` and reachable only with the data layer mocked, so a
// rule living inside it can only be tested through that mock. The rule is a
// pure function of two strings and is asserted directly here. It is also the
// cheapest place to keep the oracle honest — the bridge, not the blueprint
// catalog, because the bridge is what the registry's declared arm actually
// consults, and importing the catalog would pull the discovery-blueprint module
// graph into a server-only resolver that deliberately avoids it.

import { registryArchetypeIdForDeclaredId } from "./declared-archetype-bridge";

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * The archetype id a human DECLARED for this Move, or null.
 *
 * `functionPackKey` is still listed first, so it still wins whenever both
 * fields name a known archetype or neither does — the only behaviour that
 * changes is the case where it names nothing and the charter declaration names
 * something.
 *
 * Deliberately does NOT consider `program.archetype`: that column holds one of
 * five coarse legacy UI labels, none of which names a registry archetype, and
 * reading it would make every Move's identity depend on a field nobody declared
 * anything in.
 */
export function resolveDeclaredArchetypeId(input: {
  functionPackKey?: unknown;
  charterClassificationArchetype?: unknown;
}): string | null {
  const candidates = [
    nonEmpty(input.functionPackKey),
    nonEmpty(input.charterClassificationArchetype),
  ].filter((value): value is string => value !== null);

  const named = candidates.find(
    (candidate) => registryArchetypeIdForDeclaredId(candidate) !== null,
  );

  return named ?? candidates[0] ?? null;
}

/**
 * The archetype id declared on a Move's charter, read defensively.
 *
 * `charter.classification` is a bare string on older Moves, so reading
 * `.archetype` off it must not throw — such a charter declares nothing and
 * resolution falls back to inference.
 *
 * The `typeof !== "object"` clause is belt-and-braces and no test can observe
 * it: JS boxes a primitive, so `"a string".archetype` is already `undefined`
 * and the function answers null either way. The only input it changes is a
 * FUNCTION carrying an `archetype` property, which `charter` — a JSONB column —
 * cannot hold. It is kept because it states the intent and matches
 * `resolveDeclaredProgramArchetypeId`, not because it is reachable; a mutation
 * removing it survives by design rather than for want of a case.
 */
export function charterDeclaredArchetypeId(
  charter: Record<string, unknown> | null | undefined,
): string | null {
  const classification = charter?.classification;
  if (!classification || typeof classification !== "object") return null;
  return nonEmpty((classification as Record<string, unknown>).archetype);
}
