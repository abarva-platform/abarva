// Discovery-blueprint archetype id -> registry archetype id.
//
// These are two different id spaces that name the same thing. A Move DECLARES
// its archetype with a discovery-blueprint id (`governed_data_foundation`,
// written to `charter.classification.archetype` by the declaration job, and
// offered by the origination picker); the readiness/requirement framework is
// keyed by registry ids (`GOVERNED_DATA_FOUNDATION`). Without a bridge entry a
// declared identity reaches `resolveProgramArchetype` only inside the keyword
// haystack, where it competes with incidental vocabulary.
//
// Identity is declared, never inferred — so an entry here outranks every
// keyword rule in the registry's inference path.
//
// Why this is a module of its own, and why the values are string literals:
// the bridge has to be assertable against the SHIPPED BLUEPRINT CATALOG, which
// lives in the orchestrator's brief layer. Importing the registry's archetype
// objects here (or the catalog there) would couple the two id spaces in the
// module graph, which is the thing this file exists to keep separate. A guard
// suite holds every shipped blueprint id against this map instead, so a sixth
// blueprint cannot be added without a bridge entry.
//
// Measured before this map was completed: of the five declarable blueprint ids
// exactly ONE (`governed_data_foundation`) resolved through the declared-identity
// arm. The other four fell through to keyword inference, and three of those got
// an archetype whose id does not contain the matched token by design —
// `healthcare_contact_center_agent_assist` and
// `financial_services_commercial_lending_agent_assist` both landed on
// `AI_PRODUCT_DEVELOPMENT_LIFECYCLE`, because the inference rules spell their
// tokens with SPACES ("contact center") and a blueprint id spells them with
// underscores. A declared Move was handed the wrong evidence framework and the
// resulting readiness report rendered perfectly.

/**
 * Every archetype id a human can declare, mapped to the registry archetype it
 * names. Keys are lower-case blueprint ids; values are registry ids.
 *
 * `general_default` maps to the default archetype deliberately: "no particular
 * shape was declared" is what that blueprint means, and the default is what
 * inference already answered for it, so routing it through the declared arm
 * changes no answer while removing its dependence on no keyword matching.
 */
export const DECLARED_ARCHETYPE_BRIDGE: Readonly<Record<string, string>> =
  Object.freeze({
    ai_operations_customer_digital: "AI_OPERATIONS_DECISION_SUPPORT",
    financial_services_commercial_lending_agent_assist:
      "COMMERCIAL_LENDING_AGENT_ASSIST",
    general_default: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    governed_data_foundation: "GOVERNED_DATA_FOUNDATION",
    healthcare_contact_center_agent_assist: "CONTACT_CENTER_AGENT_ASSIST",
  });

/**
 * Registry archetypes that NO blueprint id names, with the reason.
 *
 * These are reachable only through the registry's keyword inference, because
 * nothing in the declaration surface offers them. Named here so that adding a
 * blueprint for one of them — or deleting one of them — is a deliberate edit
 * rather than a silent drift in the guard suite's arithmetic.
 */
export const REGISTRY_ARCHETYPES_WITH_NO_DECLARABLE_ID: readonly string[] =
  Object.freeze([
    // Source-side event shape; a Move does not declare it at origination.
    "IT_SOURCING_EVENT",
    // Reached from the analytics-repatriation vocabulary; no blueprint authored.
    "ANALYTICS_CAPABILITY_REPATRIATION",
  ]);

/**
 * The registry archetype id a declared archetype id names, or null.
 *
 * Case-insensitive and whitespace-tolerant, matching the declaration surface's
 * own reading of a declared token. Returns null — never throws — when nothing
 * was declared or the declaration names no bridged blueprint, so the caller
 * keeps its existing fallback.
 */
export function registryArchetypeIdForDeclaredId(
  declaredId: string | null | undefined,
): string | null {
  const key = (declaredId ?? "").trim().toLowerCase();
  // `hasOwn`, not a bare index: the map is a plain object, so indexing it with
  // an inherited key ("constructor", "toString") answers with a Function, and
  // a truthy non-string would be handed to `getArchetype` as a registry id.
  // It also makes the empty-string case fall out of the lookup itself rather
  // than needing a guard no well-formed input can reach.
  return Object.hasOwn(DECLARED_ARCHETYPE_BRIDGE, key)
    ? DECLARED_ARCHETYPE_BRIDGE[key]
    : null;
}
