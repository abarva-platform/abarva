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
import { INTERNAL_PROVIDER_CLASS, type ResolvedRate } from "./types";

export { INTERNAL_PROVIDER_CLASS };

type RateCardLine = Pick<PricingRateCardLineRow, "role_or_band_ref" | "level" | "rate_value" | "currency" | "card_version_id"> &
  Partial<Pick<PricingRateCardLineRow, "provider_ref" | "location_ref" | "unit">>;

/**
 * Units a line may state and still be an hourly rate. A card may also hold
 * day or year rates (the template allows them), but this engine prices hours
 * and never converts: hours per day and billable hours per year are the
 * client's assumptions, not ours. A line with no unit predates the column.
 */
const HOURLY_UNITS: ReadonlySet<string> = new Set(["hour", "hours", "hr", "hrs", "hourly"]);
function isHourly(line: RateCardLine): boolean {
  return line.unit === undefined || line.unit === null || HOURLY_UNITS.has(line.unit.trim().toLowerCase());
}

export interface RoleRateSnapshot {
  roles: readonly Pick<PricingRoleRow, "role_code" | "default_rate_band_code">[];
  rateBands: readonly Pick<PricingRateBandRow, "rate_band_code" | "role_code" | "level_code" | "indicative_bill_rate" | "currency">[];
  clientLines: readonly RateCardLine[];
  globalLines: readonly RateCardLine[];
}

/** The pod member's provider class and delivery location, when the caller knows them. */
export interface RateCardLineDimensions {
  providerClassCode?: string | null;
  locationCode?: string | null;
}

type LineMatch = { line: RateCardLine } | { gap: string } | null;

// A line fits a member when each dimension the line names equals the member's.
// The most specific fitting line wins: provider (4) outranks location (2),
// which outranks level (1). A line naming a provider or location the caller
// did not state is a guess, so it scores below a line that names neither; two
// equally good guesses that differ in provider or location are ambiguous and
// return no rate rather than an arbitrary one. A line at another level is
// never borrowed for a member whose level is known.
function dimensionScore(lineValue: string | null | undefined, wanted: string | null | undefined, weight: number): number | null {
  if (lineValue === null || lineValue === undefined) return 0;
  if (wanted === null || wanted === undefined) return -1;
  return lineValue === wanted ? weight : null;
}

function findLine(
  lines: RoleRateSnapshot["clientLines"],
  roleCode: string,
  defaultRateBandCode: string | null,
  levelHint: string | null,
  dims: RateCardLineDimensions,
): LineMatch {
  // A line may be authored at role grain (role_or_band_ref = role_code) or
  // rate-band grain (role_or_band_ref = the role's default_rate_band_code) —
  // matching pricing_rate_card_lines.role_or_band_ref's documented dual
  // grain (see PR2 migration comment, quoted in rate-card-repository.ts).
  const candidateRefs = [roleCode, ...(defaultRateBandCode ? [defaultRateBandCode] : [])];
  const scored: { line: RateCardLine; score: number }[] = [];
  const otherUnits = new Set<string>();
  for (const line of lines) {
    if (!candidateRefs.includes(line.role_or_band_ref)) continue;
    let levelScore: number;
    if (line.level === null) levelScore = 0;
    else if (levelHint === null) levelScore = -0.5;
    else if (line.level === levelHint) levelScore = 1;
    else continue;
    const provider = dimensionScore(line.provider_ref, dims.providerClassCode, 4);
    const location = dimensionScore(line.location_ref, dims.locationCode, 2);
    if (provider === null || location === null) continue;
    if (!isHourly(line)) {
      otherUnits.add(String(line.unit));
      continue;
    }
    scored.push({ line, score: provider + location + levelScore });
  }
  if (scored.length === 0) {
    // The card prices this role, but not per hour: say so rather than fall
    // through and silently ignore the client's card.
    return otherUnits.size > 0
      ? {
          gap:
            `the rate card prices role '${roleCode}' per ${[...otherUnits].join(" or ")}, not per hour` +
            " — add an hourly line for it; estimates never convert units",
        }
      : null;
  }
  const best = Math.max(...scored.map((c) => c.score));
  const top = scored.filter((c) => c.score === best);
  const providers = new Set(top.map((c) => c.line.provider_ref ?? null));
  const locations = new Set(top.map((c) => c.line.location_ref ?? null));
  if (providers.size > 1 || locations.size > 1) {
    const named = (values: Set<string | null>) => [...values].map((v) => v ?? "any").join(", ");
    return {
      gap:
        `the rate card has ${top.length} equally good lines for role '${roleCode}'` +
        (providers.size > 1 ? ` (providers: ${named(providers)})` : "") +
        (locations.size > 1 ? ` (locations: ${named(locations)})` : "") +
        " — state the pod member's provider class and location so one line applies",
    };
  }
  return { line: top[0].line };
}

/** Pure — resolves one role's hourly rate against an in-memory snapshot. No I/O. */
export function resolveRoleRate(
  roleCode: string,
  levelHint: string | null,
  snapshot: RoleRateSnapshot,
  dims: RateCardLineDimensions = {},
): ResolvedRate {
  const role = snapshot.roles.find((r) => r.role_code === roleCode) ?? null;
  const defaultRateBandCode = role?.default_rate_band_code ?? null;

  for (const [scope, lines] of [
    ["client", snapshot.clientLines],
    ["global", snapshot.globalLines],
  ] as const) {
    const match = findLine(lines, roleCode, defaultRateBandCode, levelHint, dims);
    if (match === null) continue;
    if ("gap" in match) {
      // Never fall through to a lower scope: that would silently ignore the card.
      return {
        resolvedFromScope: "missing",
        roleCode,
        levelCode: levelHint,
        hourlyRateCents: null,
        currency: "USD",
        rateCardVersionId: null,
        gapReason: `${scope} ${match.gap}`,
      };
    }
    const { line } = match;
    return {
      resolvedFromScope: scope,
      roleCode,
      levelCode: line.level,
      hourlyRateCents: dollarsToCents(line.rate_value),
      currency: line.currency,
      rateCardVersionId: line.card_version_id,
      gapReason: null,
      matchedProviderRef: line.provider_ref ?? null,
      matchedLocationRef: line.location_ref ?? null,
    };
  }

  if (dims.providerClassCode === INTERNAL_PROVIDER_CLASS) {
    return {
      resolvedFromScope: "missing",
      roleCode,
      levelCode: levelHint,
      hourlyRateCents: null,
      currency: "USD",
      rateCardVersionId: null,
      gapReason:
        `no client rate-card line prices internal staff for role '${roleCode}'${levelHint ? ` at level '${levelHint}'` : ""}` +
        " — internal rates come only from the client's own card, never from a supplier band",
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
