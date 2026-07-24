/**
 * Nexus Pricing Engine — PR3 governed-load rate coverage report.
 *
 * For a given tenant, classifies every canonical `pricing_roles` row into
 * exactly one bucket:
 *
 *   - `direct`    — the tenant's own current, approved CLIENT-scope
 *                   `pricing_rate_cards` row has a line pricing this role
 *                   (matched by role_code OR the role's own
 *                   default_rate_band_code, since a rate-card line may be
 *                   authored at either grain — see
 *                   `pricing_rate_card_lines.role_or_band_ref`'s comment in
 *                   the PR2 migration).
 *   - `inherited` — no tenant-specific line, but either (a) a GLOBAL-scope
 *                   `pricing_rate_cards` row covers it, or (b) the role's
 *                   `default_rate_band_code` resolves to a real
 *                   `pricing_rate_bands` row (the taxonomy-level default —
 *                   this is the fallback that actually exists today, since
 *                   PR1/PR2 never seeded a `global` scope_type
 *                   `pricing_rate_cards` row).
 *   - `missing`   — neither exists. Surfaced explicitly and never hidden —
 *                   per the PR3 brief, this bucket matters most.
 *
 * `buildRateCardCoverageReport` is the real, DB-backed entry point.
 * `computeCoverageFromSnapshot` is the pure core so tests (and the
 * projection function below) can run it against an in-memory fixture
 * without a database.
 */
import {
  getCurrentRateCard,
  listRateCardLines,
} from "../rate-card-repository";
import { getCurrentTaxonomyVersion, listRateBands, listRoles } from "../reference-repository";
import type { PricingRateBandRow, PricingRateCardLineRow, PricingRoleRow } from "../types";
import { CLIENT_ENTERPRISE_RATE_CARD_CODE, GLOBAL_STARTER_RATE_CARD_CODE } from "./constants";
import type { RateCardCoverageReport, RoleCoverageEntry } from "./types";

export interface CoverageSnapshot {
  tenantKey: string;
  taxonomyVersion: number;
  roles: readonly PricingRoleRow[];
  rateBands: readonly PricingRateBandRow[];
  clientLines: readonly PricingRateCardLineRow[];
  globalLines: readonly PricingRateCardLineRow[];
}

export function computeCoverageFromSnapshot(
  snapshot: CoverageSnapshot,
): RateCardCoverageReport {
  const rateBandCodesForRole = new Map<string, Set<string>>();
  for (const band of snapshot.rateBands) {
    const set = rateBandCodesForRole.get(band.role_code) ?? new Set<string>();
    set.add(band.rate_band_code);
    rateBandCodesForRole.set(band.role_code, set);
  }
  const rateBandExists = new Set(snapshot.rateBands.map((b) => b.rate_band_code));

  const clientRefs = new Set(snapshot.clientLines.map((l) => l.role_or_band_ref));
  const globalRefs = new Set(snapshot.globalLines.map((l) => l.role_or_band_ref));

  const direct: RoleCoverageEntry[] = [];
  const inherited: RoleCoverageEntry[] = [];
  const missing: RoleCoverageEntry[] = [];

  for (const role of snapshot.roles) {
    const candidateRefs = [role.role_code, ...(role.default_rate_band_code ? [role.default_rate_band_code] : [])];
    const entryBase = {
      roleCode: role.role_code,
      canonicalName: role.canonical_name,
      towerCode: role.tower_code,
    };

    if (candidateRefs.some((ref) => clientRefs.has(ref))) {
      direct.push({ ...entryBase, resolvedVia: "client_rate_card_line" });
      continue;
    }

    if (candidateRefs.some((ref) => globalRefs.has(ref))) {
      inherited.push({ ...entryBase, resolvedVia: "global_rate_card_line" });
      continue;
    }

    if (role.default_rate_band_code && rateBandExists.has(role.default_rate_band_code)) {
      inherited.push({ ...entryBase, resolvedVia: "rate_band_default" });
      continue;
    }

    missing.push(entryBase);
  }

  const totalRoles = snapshot.roles.length;
  const coveredCount = direct.length + inherited.length;
  const coveragePct = totalRoles === 0 ? 0 : Math.round((coveredCount / totalRoles) * 1000) / 10;

  return {
    tenantKey: snapshot.tenantKey,
    taxonomyVersion: snapshot.taxonomyVersion,
    totalRoles,
    direct: { count: direct.length, roles: direct },
    inherited: { count: inherited.length, roles: inherited },
    missing: { count: missing.length, roles: missing },
    coveragePct,
  };
}

export interface BuildRateCardCoverageReportOptions {
  cardCode?: string;
}

export async function buildRateCardCoverageReport(
  tenantKey: string,
  options: BuildRateCardCoverageReportOptions = {},
): Promise<RateCardCoverageReport> {
  const cardCode = options.cardCode ?? CLIENT_ENTERPRISE_RATE_CARD_CODE;

  const taxonomy = await getCurrentTaxonomyVersion();
  if (!taxonomy) {
    throw new Error(
      "pricing_taxonomy_not_loaded: no current pricing_taxonomy_versions row — run the PR1/PR2 reference-pack loader first",
    );
  }

  const [roles, rateBands, clientCard, globalCard] = await Promise.all([
    listRoles(taxonomy.version),
    listRateBands(taxonomy.version),
    getCurrentRateCard("client", tenantKey, cardCode),
    getCurrentRateCard("global", null, GLOBAL_STARTER_RATE_CARD_CODE),
  ]);

  const [clientLines, globalLines] = await Promise.all([
    clientCard ? listRateCardLines(clientCard.id) : Promise.resolve([]),
    globalCard ? listRateCardLines(globalCard.id) : Promise.resolve([]),
  ]);

  return computeCoverageFromSnapshot({
    tenantKey,
    taxonomyVersion: taxonomy.version,
    roles,
    rateBands,
    clientLines,
    globalLines,
  });
}
