/**
 * Nexus Pricing Engine — PR3 governed-load reference-data I/O.
 *
 * The only file in `governed-load/` (besides the repositories) that talks to
 * the database directly — it fetches the current taxonomy version's roles,
 * rate bands, and seniority levels (via PR2's
 * `src/lib/pricing/reference-repository.ts`) and shapes them into the
 * `RateCardReferenceSnapshot` that `semantic-validation.ts` and
 * `coverage-report.ts` need. Kept separate from those pure modules so both
 * stay unit-testable with a hand-built snapshot fixture and zero mocking.
 */
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  getCurrentTaxonomyVersion,
  listRateBands,
  listRoles,
  listSeniorityLevels,
} from "../reference-repository";
import type { PricingModelVersionRow } from "../types";
import type { RateCardReferenceSnapshot } from "./semantic-validation";

export async function loadRateCardReferenceSnapshot(): Promise<RateCardReferenceSnapshot> {
  const taxonomy = await getCurrentTaxonomyVersion();
  if (!taxonomy) {
    throw new Error(
      "pricing_taxonomy_not_loaded: no current pricing_taxonomy_versions row — run the PR1/PR2 reference-pack loader first",
    );
  }
  const [roles, rateBands, levels] = await Promise.all([
    listRoles(taxonomy.version),
    listRateBands(taxonomy.version),
    listSeniorityLevels(taxonomy.version),
  ]);
  return {
    taxonomyVersion: taxonomy.version,
    roleCodes: new Set(roles.map((r) => r.role_code)),
    rateBandCodes: new Set(rateBands.map((r) => r.rate_band_code)),
    levelCodes: new Set(levels.map((l) => l.level_code)),
  };
}

/**
 * `pricing_model_versions` has no reader yet in PR2's
 * `reference-repository.ts` (no consumer needed one until this projection).
 * Added here rather than editing that file, to keep this PR's DB-read
 * surface additions scoped to `governed-load/`.
 */
export async function getCurrentModelVersion(): Promise<PricingModelVersionRow | null> {
  return azureRead.maybeSingle<PricingModelVersionRow>({
    table: "pricing_model_versions",
    where: { is_current: true },
    missingTable: "empty",
  });
}
