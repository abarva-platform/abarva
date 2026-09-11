import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type { SourceWorkspacePortfolioData } from "./live/portfolioAdapter";

/**
 * Contract populations, derived once.
 *
 * Source reads two collections that both describe "contracts" and are not the
 * same set:
 *
 *   register  — `portfolio.contracts`, the contract book: header rows carrying
 *               vendor, value and dates.
 *   depth     — `portfolio.impact.evidenceCoverage`, one row per contract that
 *               has evidence loaded, carrying the archetype and lane counts.
 *
 * They join on `contract_id`, and the join is not guaranteed: a depth row whose
 * id is absent from the register describes a contract the book does not
 * contain. Panels that derived their own counts from whichever collection was
 * nearest produced figures that looked like a partition and were not — a
 * declared-archetype count taken from depth rendered beside an unmapped count
 * taken from the register sums past the size of either.
 *
 * Every count on the coverage, contracts and evidence surfaces comes from here,
 * and every one of them names the population it counts.
 */

export interface ContractPopulations {
  /** Header rows in the contract book. */
  readonly registerCount: number;
  /** Contracts with evidence loaded, whatever book they belong to. */
  readonly depthCount: number;
  /** Depth rows whose contract_id is present in the register. */
  readonly joinedCount: number;
  /**
   * Depth rows whose contract_id is absent from the register. These describe
   * contracts the book does not contain, so they can never be a slice of it.
   */
  readonly unjoinedDepthCount: number;
  /** Register contracts carrying a declared archetype. */
  readonly declaredInRegisterCount: number;
  /** Register contracts with no declared archetype. Partitions with the above. */
  readonly undeclaredInRegisterCount: number;
  /** Declared archetypes held on depth rows that are not in the register. */
  readonly declaredOutsideRegisterCount: number;
  /**
   * True when the two collections are effectively disjoint. A coverage
   * percentage over the register is meaningless in that state, because the
   * evidence describes different contracts.
   */
  readonly populationsDisjoint: boolean;
  /** Share of depth rows that join to the register, 0-1. */
  readonly joinRate: number;
}

const UNDECLARED_ARCHETYPE_KEYS = new Set([
  "",
  "unknown",
  "unmapped",
  "unclassified",
  "not_established",
  "not established",
  "uncategorized",
  "uncategorised",
  "other",
  "n/a",
  "na",
  "none",
  "-",
  "—",
]);

/**
 * A declared archetype is one somebody reviewed and recorded. Placeholder text
 * standing in for "we have not classified this" is not a declaration, and
 * counting it as one is how an unclassified book reports itself as mapped.
 */
export function isDeclaredArchetypeKey(
  value: string | null | undefined,
): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 && !UNDECLARED_ARCHETYPE_KEYS.has(normalized);
}

export function contractPopulations(
  portfolio: SourceWorkspacePortfolioData,
): ContractPopulations {
  const register = portfolio.contracts ?? [];
  const depth = portfolio.impact?.evidenceCoverage ?? [];

  const registerIds = new Set(register.map((row) => row.contract_id));
  const depthById = new Map(depth.map((row) => [row.contract_id, row]));

  let joinedCount = 0;
  for (const id of depthById.keys()) {
    if (registerIds.has(id)) joinedCount += 1;
  }

  let declaredInRegisterCount = 0;
  for (const contract of register) {
    const fromDepth = depthById.get(contract.contract_id);
    const declared =
      isDeclaredArchetypeKey(contract.contract_archetype) ||
      isDeclaredArchetypeKey(fromDepth?.contract_archetype) ||
      isDeclaredArchetypeKey(contract.vendor_category);
    if (declared) declaredInRegisterCount += 1;
  }

  let declaredOutsideRegisterCount = 0;
  for (const [id, row] of depthById) {
    if (registerIds.has(id)) continue;
    if (
      isDeclaredArchetypeKey(row.contract_archetype) ||
      isDeclaredArchetypeKey(row.vendor_category)
    ) {
      declaredOutsideRegisterCount += 1;
    }
  }

  const depthCount = depthById.size;
  const joinRate = depthCount === 0 ? 1 : joinedCount / depthCount;

  return {
    registerCount: register.length,
    depthCount,
    joinedCount,
    unjoinedDepthCount: depthCount - joinedCount,
    declaredInRegisterCount,
    undeclaredInRegisterCount: Math.max(
      0,
      register.length - declaredInRegisterCount,
    ),
    declaredOutsideRegisterCount,
    populationsDisjoint: depthCount > 0 && joinRate < 0.5,
    joinRate,
  };
}

/**
 * Sum a lane across depth rows.
 *
 * Returns `null` rather than `0` when no row in the population carries the
 * lane at all. Zero asserts "we looked and found none"; null means "not
 * loaded", and the two must not render the same way.
 */
export function sumDepthLane(
  rows: readonly { readonly [key: string]: unknown }[],
  field: string,
): number | null {
  let total = 0;
  let sawValue = false;
  for (const row of rows) {
    const value = numberFromDb(row[field] as never);
    if (value == null) continue;
    sawValue = true;
    total += value;
  }
  return sawValue ? total : null;
}

/** `0` is a finding; a dash is the absence of one. */
export function countOrDash(value: number | null | undefined): string {
  return value == null ? "—" : String(value);
}
