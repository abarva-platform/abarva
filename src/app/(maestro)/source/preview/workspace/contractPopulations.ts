import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import type { SourceContract360Row } from "@/lib/source/data-model/types";
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
  /** Distinct contracts represented by depth or canonical archetype coverage. */
  readonly evidenceContractCount: number;
  /** Evidence contracts absent from the register, deduplicated across sources. */
  readonly unjoinedEvidenceCount: number;
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
  /** Union of register, evidence, and action contract ids used by the focus view. */
  readonly contractRecordCount: number;
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
  const actions = portfolio.impact?.actionCandidates ?? [];

  const registerIds = new Set(register.map((row) => row.contract_id));
  const depthById = new Map(depth.map((row) => [row.contract_id, row]));
  const archetypeCoverageById = new Map(
    (portfolio.archetypeCoverageRows ?? []).map((row) => [row.contract_id, row]),
  );
  const contractRecordIds = new Set([
    ...registerIds,
    ...depthById.keys(),
    ...archetypeCoverageById.keys(),
    ...actions.map((row) => row.contract_id),
  ]);

  let joinedCount = 0;
  for (const id of depthById.keys()) {
    if (registerIds.has(id)) joinedCount += 1;
  }

  let declaredInRegisterCount = 0;
  for (const contract of register) {
    const fromDepth = depthById.get(contract.contract_id);
    const fromArchetypeCoverage = archetypeCoverageById.get(contract.contract_id);
    const declared =
      isDeclaredArchetypeKey(contract.contract_archetype) ||
      isDeclaredArchetypeKey(fromDepth?.contract_archetype) ||
      isDeclaredArchetypeKey(fromArchetypeCoverage?.contract_archetype) ||
      isDeclaredArchetypeKey(contract.vendor_category);
    if (declared) declaredInRegisterCount += 1;
  }

  let declaredOutsideRegisterCount = 0;
  const nonRegisterDepthIds = new Set([
    ...depthById.keys(),
    ...archetypeCoverageById.keys(),
  ]);
  for (const id of nonRegisterDepthIds) {
    if (registerIds.has(id)) continue;
    const row = depthById.get(id);
    const archetypeCoverage = archetypeCoverageById.get(id);
    if (
      isDeclaredArchetypeKey(row?.contract_archetype) ||
      isDeclaredArchetypeKey(row?.vendor_category) ||
      isDeclaredArchetypeKey(archetypeCoverage?.contract_archetype)
    ) {
      declaredOutsideRegisterCount += 1;
    }
  }

  const depthCount = depthById.size;
  const joinRate = depthCount === 0 ? 1 : joinedCount / depthCount;
  const evidenceContractIds = new Set([
    ...depthById.keys(),
    ...archetypeCoverageById.keys(),
  ]);
  let unjoinedEvidenceCount = 0;
  for (const id of evidenceContractIds) {
    if (!registerIds.has(id)) unjoinedEvidenceCount += 1;
  }

  return {
    registerCount: register.length,
    depthCount,
    joinedCount,
    unjoinedDepthCount: depthCount - joinedCount,
    evidenceContractCount: evidenceContractIds.size,
    unjoinedEvidenceCount,
    declaredInRegisterCount,
    undeclaredInRegisterCount: Math.max(
      0,
      register.length - declaredInRegisterCount,
    ),
    declaredOutsideRegisterCount,
    populationsDisjoint: depthCount > 0 && joinRate < 0.5,
    joinRate,
    contractRecordCount: contractRecordIds.size,
  };
}

/**
 * Annual contract value belongs to the governed contract book. Evidence and
 * action rows may carry spend or candidate amounts, but those are not annual
 * contract value and must never be substituted into this total.
 *
 * The workspace displays the stated Contract 360 annual value. A resolved
 * extraction value may explain a conflict, but it does not silently replace the
 * stated field in Story, Optimize, aVa, or export-facing read paths.
 */
export function contractBookAnnualValueForContract(
  contract:
    | Pick<SourceContract360Row, "annual_value" | "resolved_annual_value">
    | null
    | undefined,
): number | null {
  return (
    numberFromDb(contract?.annual_value) ??
    numberFromDb(contract?.resolved_annual_value)
  );
}

/**
 * Sum the governed contract-book annual value across book rows. Evidence and
 * action rows may carry spend or candidate amounts, but those are not annual
 * contract value and must never be substituted into this total.
 */
export function contractBookAnnualValue(
  portfolio: SourceWorkspacePortfolioData,
): number | null {
  let total = 0;
  let sawValue = false;
  for (const contract of portfolio.contracts ?? []) {
    const value = contractBookAnnualValueForContract(contract);
    if (value == null) continue;
    sawValue = true;
    total += value;
  }
  return sawValue ? total : null;
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
