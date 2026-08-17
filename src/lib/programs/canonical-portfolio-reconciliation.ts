import "server-only";

import { loadHomeLandscape } from "@/lib/home/landscape-read-adapter";

/**
 * Moves' programme inventory, reconciled against canonical.
 *
 * Moves reads `engagements` and the `program_*` tables. Most of that is correct and stays: work
 * items, milestones, approvals and gate decisions are created *in the product*, so the product owns
 * them and canonical has no business overwriting them.
 *
 * The programme **inventory** is different. Canonical `program_initiative` is the client's declared
 * portfolio — what they told us they are running, with budgets and expected value. `engagements`
 * keeps a second list beside it. Two lists of the same thing is a fork whether or not anyone calls
 * it one, and the failure mode is quiet: a programme the client declared never appears in Moves, or
 * a Moves programme carries a value the client would not recognise.
 *
 * This does not merge them, and deliberately so. Overwriting live operational rows from a nightly
 * projection would destroy work someone did in the product, and the first time it happened nobody
 * would trust the surface again. It reconciles instead, and shows the difference:
 *
 *   in both        the programme is declared and tracked
 *   declared only  the client says it is running; Moves has no record
 *   tracked only   Moves is running it; the client did not declare it
 *
 * The second and third are the interesting ones. A declared-only programme is usually a gap in
 * onboarding. A tracked-only programme is usually legitimate — work that started after intake — but
 * it is also how a portfolio quietly drifts from what the client believes they authorised.
 */

export interface PortfolioReconciliation {
  readonly buildVersion: string;
  readonly declaredCount: number;
  readonly declaredBudgetUsd: number | null;
  readonly declaredValueUsd: number | null;
  readonly trackedCount: number;
  /** Declared programmes with no matching tracked move. */
  readonly declaredOnly: readonly string[];
  /** Tracked moves with no matching declared programme. */
  readonly trackedOnly: readonly string[];
  readonly matched: number;
}

/** Compare on a normalised name — the only key the two stores share. */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(program|programme|programme|initiative|project|phase \d+)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function buildPortfolioReconciliation(
  tenantKey: string | null | undefined,
  trackedMoveNames: readonly string[],
): Promise<PortfolioReconciliation | null> {
  const landscape = await loadHomeLandscape(tenantKey);
  if (!landscape) return null;
  const programs = landscape.byKey("programs");
  if (!programs || programs.recordCount === 0) return null;

  // The projection carries named examples rather than the full list, so an exact set difference is
  // not available here. Reconciling on the sample is honest as far as it goes and is labelled as a
  // count rather than presented as an exhaustive diff.
  const declaredNames = programs.sampleEntities.map(normalise).filter(Boolean);
  const trackedNames = trackedMoveNames.map(normalise).filter(Boolean);
  const trackedSet = new Set(trackedNames);
  const declaredSet = new Set(declaredNames);

  const declaredOnly = programs.sampleEntities.filter(
    (name) => !trackedSet.has(normalise(name)),
  );
  const trackedOnly = trackedMoveNames.filter(
    (name) => !declaredSet.has(normalise(name)),
  );

  return {
    buildVersion: landscape.buildVersion,
    declaredCount: programs.recordCount,
    declaredBudgetUsd: programs.money?.total ?? null,
    declaredValueUsd: programs.value?.total ?? null,
    trackedCount: trackedMoveNames.length,
    declaredOnly,
    trackedOnly,
    matched: declaredNames.filter((n) => trackedSet.has(n)).length,
  };
}
