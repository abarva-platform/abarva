/**
 * What a configured archetype source will ACTUALLY do, reported before it is
 * deployed.
 *
 * The loader already tells an operator that a configured source validated, and
 * which archetype ids it `applied`. That is not enough to act on, for three
 * reasons this module exists to close:
 *
 *   1. `applied` cannot tell an OVERRIDE of a shipped archetype from the
 *      ADDITION of a new one, and those two are one typo apart. A source meant
 *      to override a shipped id, written with a character wrong, adds a second
 *      archetype instead and `applied` names it exactly as if the override had
 *      taken.
 *   2. An added id is INERT. It joins the effective catalog, but blueprint
 *      resolution runs against the built-in catalog and the configured source
 *      is applied as an override only, so no declaration reaches an added
 *      archetype. `applied` reports it the same as one that is live.
 *   3. The same id twice in one source is accepted: the later entry silently
 *      replaces the earlier one and `applied` lists the id twice.
 *
 * Everything here is derived from the loader's own output — the effective
 * catalog and `applied`, in the loader's own order — so this report cannot
 * drift from the behaviour it describes. It parses nothing itself and reads no
 * file beyond the one the loader already read.
 */

import {
  loadEffectiveDiscoveryBlueprintCatalog,
  type ArchetypeConfigEnv,
  type ArchetypeConfigState,
} from "./archetype-config-source";
import { DISCOVERY_BLUEPRINT_CATALOG } from "./discovery-blueprint";

/**
 * What one entry of a configured source does to the catalog.
 *
 * `adds_inert` is named for its consequence rather than its mechanism. An
 * addition is not rejected and not broken — it is in the catalog, and it is
 * unreachable, which is the part an operator has to be told.
 */
export type ConfiguredArchetypeOutcome =
  | "overrides_shipped"
  | "adds_inert"
  | "replaced_by_later_entry";

export interface ConfiguredArchetypeEntryReport {
  /** Position in the configured source, as the loader applied it. */
  index: number;
  blueprintId: string;
  outcome: ConfiguredArchetypeOutcome;
  /**
   * True only for an entry that both survives its own source and is reachable
   * by a declared archetype. An addition is false; so is an entry a later
   * duplicate replaces.
   */
  reachableByDeclaration: boolean;
  /**
   * For an addition: the shipped id it most closely resembles, when one is
   * within a small edit distance. Null when nothing is close — an addition of
   * a genuinely new archetype should NOT be reported as a near-miss.
   */
  nearestShippedId: string | null;
}

export interface ArchetypeConfigPreflight {
  state: ArchetypeConfigState;
  sourcePath: string | null;
  /** Read, parse and validation failures from the loader, verbatim. */
  errors: string[];
  /** One row per entry the configured source applied, in source order. */
  entries: ConfiguredArchetypeEntryReport[];
  /** The built-in catalog's own ids — what an override may name. */
  shippedArchetypeIds: string[];
  /** Ids the source adds, every one of which is unreachable today. */
  inertArchetypeIds: string[];
  /** Ids the source names more than once. */
  collidingArchetypeIds: string[];
}

/**
 * The longest edit distance at which an added id is reported as a near-miss of
 * a shipped one.
 *
 * Two, not more. The shipped ids are long, multi-word and mutually unalike —
 * the closest pair differs by far more than this — so a threshold this tight
 * fires on a mistyped, dropped or doubled character and on nothing else. A
 * looser one would attach a near-miss to every deliberate addition, which is
 * the failure that matters here: a near-miss on a legitimately new archetype
 * tells an operator to "fix" a declaration that is already right.
 */
const NEAR_MISS_MAX_DISTANCE = 2;

/** Levenshtein distance, two rows. Ids are short; no need for more. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(substitution, previous[j] + 1, current[j - 1] + 1);
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * The shipped id an added one most resembles, or null when none is close.
 *
 * Exported so the threshold is testable against the real shipped ids rather
 * than against a fixture that could flatter it.
 */
export function nearestShippedArchetypeId(
  candidateId: string,
  shippedIds: readonly string[] = Object.keys(DISCOVERY_BLUEPRINT_CATALOG),
): string | null {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const shippedId of shippedIds) {
    const distance = editDistance(candidateId, shippedId);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = shippedId;
    }
  }
  return bestDistance <= NEAR_MISS_MAX_DISTANCE ? best : null;
}

/**
 * Report what the environment-declared archetype source does.
 *
 * `shippedArchetypeIds` comes from the built-in catalog, never from the
 * effective one: the effective catalog already contains the additions, so
 * classifying against it would report every entry as an override.
 */
export function preflightArchetypeConfig(
  env?: ArchetypeConfigEnv,
): ArchetypeConfigPreflight {
  const effective = loadEffectiveDiscoveryBlueprintCatalog(env);
  const shippedArchetypeIds = Object.keys(DISCOVERY_BLUEPRINT_CATALOG);
  const shipped = new Set(shippedArchetypeIds);

  // `applied` is one element per entry, in source order, duplicates included,
  // which is what makes a collision visible at all.
  const lastIndexOf = new Map<string, number>();
  effective.applied.forEach((id, index) => lastIndexOf.set(id, index));

  const entries = effective.applied.map<ConfiguredArchetypeEntryReport>(
    (blueprintId, index) => {
      const replaced = lastIndexOf.get(blueprintId) !== index;
      const overrides = shipped.has(blueprintId);
      const outcome: ConfiguredArchetypeOutcome = replaced
        ? "replaced_by_later_entry"
        : overrides
          ? "overrides_shipped"
          : "adds_inert";
      return {
        index,
        blueprintId,
        outcome,
        reachableByDeclaration: outcome === "overrides_shipped",
        nearestShippedId:
          outcome === "adds_inert"
            ? nearestShippedArchetypeId(blueprintId, shippedArchetypeIds)
            : null,
      };
    },
  );

  const inertArchetypeIds = [
    ...new Set(
      entries
        .filter((entry) => entry.outcome === "adds_inert")
        .map((entry) => entry.blueprintId),
    ),
  ];
  const collidingArchetypeIds = [
    ...new Set(
      entries
        .filter((entry) => entry.outcome === "replaced_by_later_entry")
        .map((entry) => entry.blueprintId),
    ),
  ];

  return {
    state: effective.state,
    sourcePath: effective.sourcePath,
    errors: effective.errors,
    entries,
    shippedArchetypeIds,
    inertArchetypeIds,
    collidingArchetypeIds,
  };
}

/**
 * Whether the declared source does something other than what it looks like it
 * does — the verdict a deploy step gates on.
 *
 * Exported rather than left in the operator script, so the mapping from report
 * to pass/fail is pinned by a case instead of living in four untested lines of
 * a CLI. An addition and a collision both count as a failure: each one is a
 * declaration that validated and then did not take effect.
 */
export function archetypeConfigPreflightPasses(
  report: ArchetypeConfigPreflight,
): boolean {
  return (
    report.state !== "rejected" &&
    report.inertArchetypeIds.length === 0 &&
    report.collidingArchetypeIds.length === 0
  );
}

/**
 * The operator-readable form.
 *
 * Written so that the three silent cases each read as a sentence an operator
 * can act on, and so that a source doing exactly what was intended says so in
 * one line rather than printing a clean bill of health for a typo.
 */
export function formatArchetypeConfigPreflight(
  report: ArchetypeConfigPreflight,
): string {
  const lines: string[] = [];
  if (report.state === "not_configured") {
    return "No archetype source is declared. The built-in archetypes are in force.";
  }
  lines.push(`Declared source: ${report.sourcePath ?? "(none)"}`);
  if (report.state === "rejected") {
    lines.push(
      "REJECTED — the built-in archetypes are in force, unchanged. Nothing in this source applies:",
    );
    for (const error of report.errors) lines.push(`  - ${error}`);
    return lines.join("\n");
  }

  lines.push(`In effect, ${report.entries.length} configured entr${
    report.entries.length === 1 ? "y" : "ies"
  }:`);
  for (const entry of report.entries) {
    if (entry.outcome === "overrides_shipped") {
      lines.push(
        `  [${entry.index}] ${entry.blueprintId} — overrides the built-in archetype of the same id. A Move declaring it gets this entry.`,
      );
      continue;
    }
    if (entry.outcome === "replaced_by_later_entry") {
      lines.push(
        `  [${entry.index}] ${entry.blueprintId} — IGNORED: a later entry in this same source declares the same id and wins.`,
      );
      continue;
    }
    const nearMiss = entry.nearestShippedId
      ? ` Did you mean ${entry.nearestShippedId}?`
      : "";
    lines.push(
      `  [${entry.index}] ${entry.blueprintId} — adds a new archetype, which NOTHING CAN DECLARE yet: resolution runs against the built-in archetypes and a configured source applies as an override only.${nearMiss}`,
    );
  }
  if (report.inertArchetypeIds.length > 0) {
    lines.push(
      `${report.inertArchetypeIds.length} added archetype id(s) are unreachable: ${report.inertArchetypeIds.join(", ")}`,
    );
  }
  if (report.collidingArchetypeIds.length > 0) {
    lines.push(
      `${report.collidingArchetypeIds.length} id(s) are declared more than once: ${report.collidingArchetypeIds.join(", ")}`,
    );
  }
  return lines.join("\n");
}
