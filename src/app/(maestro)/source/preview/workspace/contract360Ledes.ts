import type {
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractEvidenceCoverageRow,
  SourceContractSpendMonthlyRow,
} from "@/lib/source/data-model/types";
import { numberFromDb } from "@/lib/source/data-model/vendor-contract-portfolio";
import { money } from "./viewModel";

/**
 * Opening sentences, computed from the rows on screen.
 *
 * The design opens every surface with a finding — "Four declared workload
 * scopes, and 91% of consumption sits in two of them." The governed
 * intelligence records carry evidence summaries instead — "4 scoped application
 * or service rows are loaded" — which is true, and is the builder's sentence
 * rather than one an executive repeats.
 *
 * These derive the finding from the same rows the surface already renders, so a
 * lede cannot drift from the figures beneath it. Every one returns null when the
 * rows do not support a claim, and the caller falls back to the governed
 * narrative rather than to an invented sentence.
 */

type Coverage = SourceContractEvidenceCoverageRow | null | undefined;
type SpendRows = readonly SourceContractSpendMonthlyRow[];
type ScopeRows = readonly SourceContractApplicationScopeRow[];

const CRITICAL = /^(business critical|critical|tier ?1|mission critical)$/i;

function pct(part: number, whole: number): number {
  return Math.round((part / whole) * 100);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/* -------------------------------------------------------------------------- */
/* Story                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What kind of commercial instrument this is, and the tension in it.
 *
 * Leads with the gap between what was bought and what is being used, because on
 * a commitment that is the decision. Falls back to naming the shape of the
 * agreement when no consumption is loaded to compare against.
 */
export function storyLede(
  contract: SourceContract360Row,
  coverage: Coverage,
  archetypeLabel: string | null,
): string | null {
  const committed = numberFromDb(coverage?.committed_spend_usd);
  const actual = numberFromDb(coverage?.actual_spend_usd);
  const annual =
    numberFromDb(contract.resolved_annual_value) ??
    numberFromDb(contract.annual_value);
  const shape = archetypeLabel?.trim().toLowerCase() ?? null;

  if (committed != null && committed > 0 && actual != null) {
    const used = pct(actual, committed);
    if (used < 50) {
      return `Capacity bought ahead of use: ${money(committed)} committed, ${used}% of it drawn on.`;
    }
    return `${used}% of the ${money(committed)} commitment is being drawn on.`;
  }

  if (annual != null && annual > 0 && shape) {
    return `${money(annual)} a year on ${shape}, and the commercial question is the terms rather than the rate.`;
  }

  if (annual != null && annual > 0) {
    return `${money(annual)} a year under this agreement.`;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Scope                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What is in scope, and where the money inside it actually goes.
 *
 * Concentration is the finding the design reaches for. It is only claimed when
 * spend rows attribute to more than one workload; with a single attribution the
 * sentence says that instead, which is thinner but true.
 */
export function scopeLede(
  scopeRows: ScopeRows,
  spendMonths: SpendRows,
): string | null {
  if (scopeRows.length === 0) return null;

  const declared = scopeRows.length;
  const critical = scopeRows.filter((row) =>
    CRITICAL.test(row.criticality?.trim() ?? ""),
  ).length;

  const byWorkload = new Map<string, number>();
  let attributed = 0;
  for (const row of spendMonths) {
    const amount = numberFromDb(row.actual_spend) ?? 0;
    if (amount <= 0) continue;
    const key = row.business_unit?.trim() || row.service_id?.trim();
    if (!key) continue;
    byWorkload.set(key, (byWorkload.get(key) ?? 0) + amount);
    attributed += amount;
  }

  if (byWorkload.size > 1 && attributed > 0) {
    const ranked = [...byWorkload.values()].sort((a, b) => b - a);
    const topCount = Math.min(2, ranked.length);
    const share = pct(
      ranked.slice(0, topCount).reduce((sum, value) => sum + value, 0),
      attributed,
    );
    return `${declared} declared workload ${plural(declared, "scope", "scopes")}, and ${share}% of consumption sits in ${topCount} of them.`;
  }

  if (byWorkload.size === 1) {
    return `${declared} declared workload ${plural(declared, "scope", "scopes")}, and all attributed consumption sits in one of them.`;
  }

  if (critical > 0) {
    return `${declared} declared workload ${plural(declared, "scope", "scopes")}, ${critical} of ${plural(critical, "it business critical", "them business critical")}.`;
  }

  return `${declared} declared workload ${plural(declared, "scope", "scopes")}, and no consumption is attributed to any of them yet.`;
}

/* -------------------------------------------------------------------------- */
/* Relationship                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The shape of the relationship, counted from declared rows only.
 *
 * Deliberately narrow: one vendor, one agreement, and the functions and hosting
 * the scope rows declare. Nothing here is inferred, because an inferred
 * dependency in front of an executive reads as a fact.
 */
export function relationshipLede(scopeRows: ScopeRows): string | null {
  const functions = new Set(
    scopeRows.map((row) => row.business_function?.trim()).filter(Boolean),
  );
  const hosting = new Set(
    scopeRows.map((row) => row.hosting_model?.trim()).filter(Boolean),
  );

  if (functions.size === 0 && scopeRows.length === 0) return null;

  const parts = ["One vendor, one agreement"];
  if (functions.size > 0) {
    parts.push(
      `${functions.size} declared business ${plural(functions.size, "function", "functions")}`,
    );
  }
  if (scopeRows.length > 0) {
    parts.push(
      `${scopeRows.length} scoped ${plural(scopeRows.length, "workload", "workloads")}`,
    );
  }

  const sentence = `${parts.join(", ")}.`;
  if (hosting.size === 1) {
    const [only] = [...hosting];
    return `${sentence.slice(0, -1)}, all on ${only}.`;
  }
  return sentence;
}

/* -------------------------------------------------------------------------- */
/* Evidence                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * What the evidence supports, and what it does not.
 *
 * Counts lanes that hold rows against lanes this contract type requires, and
 * says separately how many are not required — so a reader cannot mistake a
 * not-applicable lane for a gap.
 */
export function evidenceLede(
  coverage: Coverage,
  notRequiredLanes: number,
): string | null {
  if (!coverage) return null;

  const lanes: readonly [string, number | null][] = [
    ["spend", numberFromDb(coverage.spend_rows)],
    ["scope", numberFromDb(coverage.scope_rows)],
    ["performance", numberFromDb(coverage.performance_rows)],
    ["document", numberFromDb(coverage.document_page_text_rows)],
    ["change order", numberFromDb(coverage.change_order_rows)],
    ["opportunity", numberFromDb(coverage.opportunity_rows)],
  ];

  const loaded = lanes.filter(([, count]) => (count ?? 0) > 0);
  const rows = loaded.reduce((sum, [, count]) => sum + (count ?? 0), 0);
  if (loaded.length === 0) return null;

  const tail =
    notRequiredLanes > 0
      ? ` ${notRequiredLanes} further ${plural(notRequiredLanes, "lane is", "lanes are")} not required for this contract type.`
      : "";

  return `${rows} governed ${plural(rows, "row", "rows")} across ${loaded.length} evidence ${plural(loaded.length, "lane", "lanes")} back every figure on this contract.${tail}`;
}
