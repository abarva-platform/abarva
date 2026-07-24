/**
 * Nexus Pricing Engine — PR4 rate-card resolver.
 *
 * Wraps PR2's `rate-card-repository.ts` (`getCurrentRateCard`,
 * `listRateCardLines`) and PR2's `reference-repository.ts`
 * (`getRoleByCode`, `listRateBands`) — the SAME direct/inherited/missing
 * classification logic PR3's `governed-load/coverage-report.ts` already
 * proved, extended here to return a concrete resolved hourly rate rather
 * than only a coverage bucket count. This module does NOT reimplement rate
 * resolution — it composes the existing PR2/PR3 machinery.
 *
 * Precedence, matching coverage-report.ts exactly:
 *   1. `client`            — the tenant's own current CLIENT-scope rate-card
 *                             line for this role (or its default rate-band
 *                             code).
 *   2. `global`             — a GLOBAL-scope rate-card line (unseeded today,
 *                             per PR2/PR3 — kept for forward compatibility).
 *   3. `rate_band_default`  — the role's own `default_rate_band_code`
 *                             resolves to a real `pricing_rate_bands` row.
 *                             Uses that row's `indicative_bill_rate` — see
 *                             below for why.
 *   4. `missing`            — none of the above; the line's cost becomes an
 *                             honest gap, never a fabricated number.
 *
 * ## Why `indicative_bill_rate`, not `loaded_rate`
 *
 * `pricing_rate_bands` carries three numeric columns per PR2's schema:
 * `loaded_rate` (internal fully-loaded cost), `scarcity_adj_rate`, and
 * `indicative_bill_rate`. A client's own uploaded rate-card LINE
 * (`pricing_rate_card_lines.rate_value`) is a single generic value — the
 * tenant's own committed, approved number, used as-is regardless of which
 * of those three concepts it represents for them. Absent a tenant's own
 * card, this engine needs ONE global fallback number per role/level; it uses
 * `indicative_bill_rate` because that column is explicitly the "starter,
 * unapproved" placeholder value PR1 generated for exactly this kind of
 * un-committed default (see `pricing_rate_bands.approval_status =
 * 'global_starter_unapproved'` on every PR1 row) — i.e. it is already
 * labeled by PR1/PR2 as the right column for "no real approved card exists
 * yet" default pricing, as opposed to `loaded_rate` (an internal-cost
 * concept a should-cost/margin calculation would want, not a should-charge
 * default).
 */
import { getCurrentRateCard, listRateCardLines } from "../rate-card-repository";
import { getRoleByCode, listRateBands } from "../reference-repository";
import type { PricingRateBandRow, PricingRateCardLineRow, PricingRoleRow } from "../types";
import { dollarsToCents } from "./money";
import type { ResolvedRate } from "./types";

export interface RoleRateSnapshot {
  roles: readonly Pick<PricingRoleRow, "role_code" | "default_rate_band_code">[];
  rateBands: readonly Pick<PricingRateBandRow, "rate_band_code" | "role_code" | "level_code" | "indicative_bill_rate" | "currency">[];
  clientLines: readonly Pick<PricingRateCardLineRow, "role_or_band_ref" | "level" | "rate_value" | "currency" | "card_version_id">[];
  globalLines: readonly Pick<PricingRateCardLineRow, "role_or_band_ref" | "level" | "rate_value" | "currency" | "card_version_id">[];
}

function findLine(
  lines: RoleRateSnapshot["clientLines"],
  roleCode: string,
  defaultRateBandCode: string | null,
  levelHint: string | null,
): RoleRateSnapshot["clientLines"][number] | null {
  // A line may be authored at role grain (role_or_band_ref = role_code) or
  // rate-band grain (role_or_band_ref = the role's default_rate_band_code) —
  // matching pricing_rate_card_lines.role_or_band_ref's documented dual
  // grain (see PR2 migration comment, quoted in rate-card-repository.ts).
  const candidateRefs = [roleCode, ...(defaultRateBandCode ? [defaultRateBandCode] : [])];
  const matches = lines.filter((l) => candidateRefs.includes(l.role_or_band_ref));
  if (matches.length === 0) return null;
  if (levelHint) {
    const levelMatch = matches.find((l) => l.level === levelHint);
    if (levelMatch) return levelMatch;
  }
  // No level hint, or no exact level match: any line for this role is usable
  // (a role-grain line has no level dimension at all).
  return matches.find((l) => l.level === null) ?? matches[0];
}

/** Pure — resolves one role's hourly rate against an in-memory snapshot. No I/O. */
export function resolveRoleRate(roleCode: string, levelHint: string | null, snapshot: RoleRateSnapshot): ResolvedRate {
  const role = snapshot.roles.find((r) => r.role_code === roleCode) ?? null;
  const defaultRateBandCode = role?.default_rate_band_code ?? null;

  const clientLine = findLine(snapshot.clientLines, roleCode, defaultRateBandCode, levelHint);
  if (clientLine) {
    return {
      resolvedFromScope: "client",
      roleCode,
      levelCode: clientLine.level,
      hourlyRateCents: dollarsToCents(clientLine.rate_value),
      currency: clientLine.currency,
      rateCardVersionId: clientLine.card_version_id,
      gapReason: null,
    };
  }

  const globalLine = findLine(snapshot.globalLines, roleCode, defaultRateBandCode, levelHint);
  if (globalLine) {
    return {
      resolvedFromScope: "global",
      roleCode,
      levelCode: globalLine.level,
      hourlyRateCents: dollarsToCents(globalLine.rate_value),
      currency: globalLine.currency,
      rateCardVersionId: globalLine.card_version_id,
      gapReason: null,
    };
  }

  const rateBandCode = levelHint ? `${roleCode}-${levelHint}` : defaultRateBandCode;
  const band = rateBandCode ? snapshot.rateBands.find((b) => b.rate_band_code === rateBandCode) : undefined;
  if (band && band.indicative_bill_rate !== null && band.indicative_bill_rate !== undefined) {
    return {
      resolvedFromScope: "rate_band_default",
      roleCode,
      levelCode: band.level_code,
      hourlyRateCents: dollarsToCents(band.indicative_bill_rate),
      currency: band.currency,
      rateCardVersionId: null,
      gapReason: null,
    };
  }

  return {
    resolvedFromScope: "missing",
    roleCode,
    levelCode: levelHint,
    hourlyRateCents: null,
    currency: "USD",
    rateCardVersionId: null,
    gapReason: `no client rate-card line, global rate-card line, or rate-band default resolves role '${roleCode}'${
      levelHint ? ` at level '${levelHint}'` : ""
    } — this line's cost is an unpriced gap, not a fabricated number`,
  };
}

/**
 * DB-backed: loads the same shape `resolveRoleRate` needs via PR2/PR3's own
 * repository functions (never a raw query) and resolves every requested
 * role in one pass. Callers MUST pass the canonical hyphenated tenant key
 * (see PRICING_ENGINE_CURRENT_STATE.md §10) — matching every other PR2/PR3
 * pricing repository function's contract.
 */
export async function resolveRoleRatesForTenant(
  tenantKey: string,
  taxonomyVersion: number,
  roleCodes: readonly string[],
  levelHints: Readonly<Record<string, string | null>> = {},
  clientCardCode = "ENTERPRISE",
  globalCardCode = "GLOBAL-STARTER",
): Promise<Map<string, ResolvedRate>> {
  const [clientCard, globalCard, rateBands] = await Promise.all([
    getCurrentRateCard("client", tenantKey, clientCardCode),
    getCurrentRateCard("global", null, globalCardCode),
    listRateBands(taxonomyVersion),
  ]);
  const [clientLines, globalLines] = await Promise.all([
    clientCard ? listRateCardLines(clientCard.id) : Promise.resolve([]),
    globalCard ? listRateCardLines(globalCard.id) : Promise.resolve([]),
  ]);
  const roles = await Promise.all(roleCodes.map((code) => getRoleByCode(taxonomyVersion, code)));

  const snapshot: RoleRateSnapshot = {
    roles: roles.filter((r): r is PricingRoleRow => r !== null),
    rateBands,
    clientLines,
    globalLines,
  };

  const result = new Map<string, ResolvedRate>();
  for (const roleCode of roleCodes) {
    result.set(roleCode, resolveRoleRate(roleCode, levelHints[roleCode] ?? null, snapshot));
  }
  return result;
}
