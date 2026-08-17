import "server-only";

import { loadHomeLandscape } from "@/lib/home/landscape-read-adapter";

/**
 * Tower's canonical reconciliation.
 *
 * Tower reads seven `consumption.tower_*_v1` views fed by ten collectors against live operational
 * systems — Jira, cloud cost, ServiceNow, Workday, DORA, Copilot, ERP. That pipeline works, and this
 * does not replace it. Replacing a working observed-telemetry mart with declared client figures would
 * be a downgrade: the mart knows what was actually spent.
 *
 * What is missing is the other half. The client's own declared technology budget, vendor book and
 * programme portfolio live in the canonical model and reach no product, so Tower can report what it
 * metered and nobody can ask why that differs from what the client said they would spend.
 *
 * So both bases are carried side by side and the gap between them is computed. Under the fact
 * authority rules that gap is `VARIANCE`, not `CONFLICT`: a declared budget and an observed actual
 * disagreeing is not an error to suppress, it is usually the most interesting number on the page.
 * `CONFLICT` is reserved for two sources of the *same* basis disagreeing.
 */

export interface TowerCanonicalFact {
  readonly label: string;
  /** What the client declared, from canonical. Null when they supplied nothing. */
  readonly declaredUsd: number | null;
  /** What Tower's mart metered. Null when the mart has no figure. */
  readonly observedUsd: number | null;
  /** observed − declared. Null unless both exist. */
  readonly varianceUsd: number | null;
  readonly variancePct: number | null;
  /** `variance` · `declared_only` · `observed_only` · `absent` — never a silent zero. */
  readonly status: "variance" | "declared_only" | "observed_only" | "absent";
  readonly declaredBasis: string;
}

export interface TowerCanonicalReconciliation {
  readonly buildVersion: string;
  readonly generatedAt: string | null;
  readonly facts: readonly TowerCanonicalFact[];
  /** Canonical counts Tower can quote directly — applications, platforms, vendors, programmes. */
  readonly estate: ReadonlyArray<{ label: string; count: number; named: number; evidenced: boolean }>;
}

function fact(
  label: string,
  declaredUsd: number | null,
  observedUsd: number | null,
  declaredBasis: string,
): TowerCanonicalFact {
  const both = declaredUsd !== null && observedUsd !== null && declaredUsd !== 0;
  return {
    label,
    declaredUsd,
    observedUsd,
    varianceUsd: both ? observedUsd - declaredUsd : null,
    variancePct: both ? ((observedUsd - declaredUsd) / declaredUsd) * 100 : null,
    status: both
      ? "variance"
      : declaredUsd !== null
        ? "declared_only"
        : observedUsd !== null
          ? "observed_only"
          : "absent",
    declaredBasis,
  };
}

/**
 * Build the reconciliation for a tenant.
 *
 * `observed` values come from the caller because they belong to Tower's mart and this module has no
 * business reading it — one read path per store. Returns null when the projector has not run, which
 * is a different state from "the client declared nothing" and must not be rendered as if it were.
 */
export async function buildTowerCanonicalReconciliation(
  tenantKey: string | null | undefined,
  observed: {
    budgetUsd?: number | null;
    approvedInvestmentUsd?: number | null;
    promisedBenefitUsd?: number | null;
    programCount?: number | null;
  },
): Promise<TowerCanonicalReconciliation | null> {
  const landscape = await loadHomeLandscape(tenantKey);
  if (!landscape) return null;

  const spend = landscape.byKey("spend");
  const vendors = landscape.byKey("vendors");
  const programs = landscape.byKey("programs");

  const facts: TowerCanonicalFact[] = [
    fact(
      "Technology budget",
      spend?.money?.total ?? null,
      observed.budgetUsd ?? null,
      spend?.money ? `Declared across ${spend.money.contributing} spend categories` : "Not supplied",
    ),
    fact(
      "Programme investment",
      programs?.money?.total ?? null,
      observed.approvedInvestmentUsd ?? null,
      programs?.money ? `Declared across ${programs.money.contributing} programmes` : "Not supplied",
    ),
    fact(
      "Expected programme value",
      programs?.value?.total ?? null,
      observed.promisedBenefitUsd ?? null,
      programs?.value ? `Declared across ${programs.value.contributing} programmes` : "Not supplied",
    ),
    fact(
      "Third-party contract value",
      vendors?.money?.total ?? null,
      null,
      vendors?.money ? `Declared across ${vendors.money.contributing} contracts` : "Not supplied",
    ),
  ];

  const estate = (["applications", "infrastructure", "vendors", "programs", "metrics"] as const)
    .map((key) => {
      const dimension = landscape.byKey(key);
      if (!dimension || dimension.recordCount === 0) return null;
      return {
        label: dimension.displayName,
        count: dimension.recordCount,
        named: dimension.distinctNameCount,
        evidenced: dimension.evidenceCount > 0,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    buildVersion: landscape.buildVersion,
    generatedAt: landscape.generatedAt,
    facts,
    estate,
  };
}
