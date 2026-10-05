// Where a configured archetype source comes from, and whether it reaches the
// product (Phase 4/5 of the configurable archetype layer).
//
// The config CONTRACT and the overlay loader already exist next door in
// `discovery-blueprint.ts`: a deploying firm can author a JSON source, and
// `loadDiscoveryBlueprintCatalog` validates it and builds the effective
// catalog. What was missing is both ends of that seam. Nothing SUPPLIED a
// configured source — the loader's only argument was `unknown` with no
// resolver behind it — and nothing CONSUMED the effective catalog, because
// every live path calls `getDiscoveryBlueprint`, which reads the built-in seed
// directly. So "configure an archetype without shipping code" was authorable,
// validatable, and inert: an operator could write a correct source, see it
// pass, and watch generation ignore it.
//
// This module closes the supply end and names the one rule by which a
// configured source changes generated output:
//
//   A configured entry whose `blueprintId` matches the blueprint resolution
//   already chose REPLACES it.
//
// That is an override of a shipped archetype, which is the half that needs no
// change to resolution. Reaching a BRAND-NEW configured archetype by
// declaration is a different rule — the declared token has to resolve against
// the effective catalog rather than the seed — and it is deliberately not
// here; see the release record's Known Gaps.
//
// Identity is declared, never inferred: there is no search for a config file,
// no convention path, no directory scan. A source exists when an operator
// declares its path in the environment, and not otherwise. With the variable
// unset the module performs no I/O and returns the seed catalog unchanged,
// which is why this is additive on every environment that exists today.

import fs from "node:fs";

import {
  DISCOVERY_BLUEPRINT_CATALOG,
  loadDiscoveryBlueprintCatalog,
  type DiscoveryBlueprint,
} from "./discovery-blueprint";

/**
 * The slice of the environment this module reads. Narrower than
 * `NodeJS.ProcessEnv` on purpose: the only thing it needs is a lookup of one
 * declared key, and a type that demands the whole process environment forces
 * every caller — tests included — into a cast.
 */
export type ArchetypeConfigEnv = Readonly<Record<string, string | undefined>>;

/**
 * The environment variable an operator sets to declare a configured archetype
 * source. Its value is a path to a JSON file holding an array of blueprints
 * satisfying `DiscoveryBlueprintCatalogSchema`.
 */
export const ARCHETYPE_CONFIG_PATH_ENV = "ABARVA_ARCHETYPE_CONFIG_PATH";

/**
 * What the configured source is doing to the catalog right now.
 *
 * `rejected` is reported separately from `not_configured` on purpose. Both
 * leave the seed in force, so they are indistinguishable in generated output —
 * and an operator who cannot tell them apart reads a typo as "configuration
 * does nothing".
 */
export type ArchetypeConfigState = "not_configured" | "in_effect" | "rejected";

export interface ConfiguredArchetypeSource {
  /** The declared path, or null when no source is declared. */
  sourcePath: string | null;
  /** Parsed JSON from the declared path; null when unread or unparseable. */
  raw: unknown;
  /** Read/parse failures. Non-empty means the declared path yielded nothing. */
  errors: string[];
}

/**
 * Read the configured archetype source the environment declares.
 *
 * An undeclared (or blank) variable is not an error — it is the default
 * deployment, and it short-circuits before any filesystem call. A declared
 * path that cannot be read or is not JSON IS an error, and it yields no source
 * rather than a partial one, matching the loader's reject-whole contract.
 */
export function readConfiguredArchetypeSource(
  env: ArchetypeConfigEnv = process.env,
): ConfiguredArchetypeSource {
  const declaredPath = env[ARCHETYPE_CONFIG_PATH_ENV]?.trim();
  if (!declaredPath) return { sourcePath: null, raw: null, errors: [] };

  let text: string;
  try {
    text = fs.readFileSync(declaredPath, "utf8");
  } catch (error) {
    return {
      sourcePath: declaredPath,
      raw: null,
      errors: [
        `${ARCHETYPE_CONFIG_PATH_ENV}=${declaredPath} could not be read: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }

  try {
    return { sourcePath: declaredPath, raw: JSON.parse(text), errors: [] };
  } catch (error) {
    return {
      sourcePath: declaredPath,
      raw: null,
      errors: [
        `${ARCHETYPE_CONFIG_PATH_ENV}=${declaredPath} is not valid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }
}

export interface EffectiveDiscoveryBlueprintCatalog {
  /** The seed, with a validated configured source overlaid. */
  catalog: Record<string, DiscoveryBlueprint>;
  /** Archetype ids the configured source added or overrode. */
  applied: string[];
  /** Read, parse and validation failures, in that order of discovery. */
  errors: string[];
  sourcePath: string | null;
  state: ArchetypeConfigState;
}

/**
 * Build the effective catalog from the environment-declared source.
 *
 * Deliberately NOT memoised. With no source declared this does no work at all,
 * and a deployment that declares one is the first deployment that would need a
 * cache invalidation story — reading once per call keeps this slice free of a
 * staleness question nothing can yet exercise. Noted as a Known Gap.
 */
export function loadEffectiveDiscoveryBlueprintCatalog(
  env: ArchetypeConfigEnv = process.env,
): EffectiveDiscoveryBlueprintCatalog {
  const source = readConfiguredArchetypeSource(env);
  if (source.sourcePath == null) {
    return {
      catalog: { ...DISCOVERY_BLUEPRINT_CATALOG },
      applied: [],
      errors: [],
      sourcePath: null,
      state: "not_configured",
    };
  }
  if (source.errors.length > 0) {
    return {
      catalog: { ...DISCOVERY_BLUEPRINT_CATALOG },
      applied: [],
      errors: source.errors,
      sourcePath: source.sourcePath,
      state: "rejected",
    };
  }
  const loaded = loadDiscoveryBlueprintCatalog(source.raw);
  return {
    catalog: loaded.catalog,
    applied: loaded.applied,
    errors: loaded.errors,
    sourcePath: source.sourcePath,
    state: loaded.errors.length > 0 ? "rejected" : "in_effect",
  };
}

/**
 * Apply the configured source to a blueprint resolution that has already
 * happened.
 *
 * The override key is `blueprintId`, which both sides guarantee is
 * `lower_snake` — the seed writes its own ids and the schema's regex admits
 * nothing else — so this comparison needs no token normalisation and cannot
 * drift from the normaliser resolution uses.
 *
 * `applied` is the test, not catalog membership. Indexing alone looks
 * equivalent while the argument is one of the catalog's own objects, which is
 * what `getDiscoveryBlueprint` returns today — but this function is exported,
 * and a blueprint assembled elsewhere (a composed one, say) can carry a seed
 * id without being the seed entry. Indexed blindly, such a resolution is
 * silently REPLACED by the seed on a deployment that configures nothing at
 * all. Keying on what the configured source actually applied means an absent
 * source cannot change a resolution, whatever its id.
 */
export function applyConfiguredBlueprintOverride(
  resolved: DiscoveryBlueprint,
  effective: EffectiveDiscoveryBlueprintCatalog,
): DiscoveryBlueprint {
  if (!effective.applied.includes(resolved.blueprintId)) return resolved;
  return effective.catalog[resolved.blueprintId] ?? resolved;
}

export interface ConfiguredBlueprintResolution {
  blueprint: DiscoveryBlueprint;
  /** True when the configured source replaced what resolution chose. */
  overrodeSeed: boolean;
  state: ArchetypeConfigState;
  sourcePath: string | null;
  errors: string[];
}

/**
 * The entry point a generation path uses: take the blueprint resolution chose
 * from the seed, and hand back what the configured source makes of it, with
 * enough state attached that an operator can tell an inert source from an
 * absent one.
 */
export function resolveConfiguredDiscoveryBlueprint(
  resolved: DiscoveryBlueprint,
  env: ArchetypeConfigEnv = process.env,
): ConfiguredBlueprintResolution {
  const effective = loadEffectiveDiscoveryBlueprintCatalog(env);
  const blueprint = applyConfiguredBlueprintOverride(resolved, effective);
  return {
    blueprint,
    overrodeSeed: blueprint !== resolved,
    state: effective.state,
    sourcePath: effective.sourcePath,
    errors: effective.errors,
  };
}
