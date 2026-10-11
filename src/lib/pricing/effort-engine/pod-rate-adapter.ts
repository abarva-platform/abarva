/**
 * Nexus Pricing Engine — pod rate adapter (ROM increment 1).
 *
 * A thin adapter that resolves a pod member's hourly rate from the EXISTING
 * cost foundation — the committed reference pack
 * (`datasets/reference/pricing-engine-v1/`: rate bands, delivery locations,
 * provider classes) and the existing rate-card resolver
 * (`rate-card-resolver.ts#resolveRoleRate`, client → global → rate-band
 * default) — and returns it WITH its provenance, for `pod-pricer.ts`.
 *
 * ## What each basis reads
 *
 * | basis                    | base rate                           | location multiplier   | provider multiplier                 |
 * |--------------------------|-------------------------------------|-----------------------|-------------------------------------|
 * | `loaded_cost`            | band `loaded_rate`                  | `salary_multiplier`   | not applied (cost is provider-free) |
 * | `scarcity_adjusted_cost` | band `scarcity_adj_rate`            | `salary_multiplier`   | not applied                         |
 * | `bill_rate`              | `resolveRoleRate` (card line, else  | `rate_multiplier`     | class tier ÷ band benchmark tier    |
 * |                          | band `indicative_bill_rate`)        |  (band rates only)    |  (band rates only)                  |
 *
 * Every committed band carries `rate_basis = 'onshore_si_t1_benchmark'`:
 * the reference-pack generator computes `indicative_bill_rate` WITH the
 * SI-T1 tier multiplier already in it, for an onshore delivery. So a bill
 * rate for another provider class is rebased by `tier(class) ÷ tier(SI-T1)`
 * (never multiplied by the raw tier, which would apply a tier twice), and an
 * unknown band basis is refused rather than guessed.
 *
 * ## Known limit of the existing resolver, handled here explicitly
 *
 * `resolveRoleRate` matches a rate-card line on role/band and level only —
 * it ignores a line's `location_ref` and `provider_ref`. A card rate is
 * therefore used AS-IS (the tenant's committed number), with location and
 * provider multipliers shown as 1 and marked not-applied, rather than
 * layering a multiplier onto a number that may already be location- or
 * provider-specific. The location's `scarcity_multiplier` is not applied in
 * this increment (the band's own role scarcity is already in
 * `scarcity_adj_rate` / `indicative_bill_rate`).
 *
 * Pure — no I/O. A DB-backed caller loads the same rows via
 * `reference-repository.ts` (`listRateBands`, `listDeliveryLocations`,
 * `listProviderClasses`) and the rate-card repository, exactly as
 * `resolveRoleRatesForTenant` does.
 */
import type {
  PricingDeliveryLocationRow,
  PricingProviderClassRow,
  PricingRateBandRow,
} from "../types";
import { dollarsToCents } from "./money";
import type {
  PodMember,
  PodRateBasis,
  PodRateMultiplier,
  PodRateRefusal,
  PodRateResolver,
  PodToolLicence,
  ResolvedPodRate,
} from "./pod-pricer";
import { resolveRoleRate, type RoleRateSnapshot } from "./rate-card-resolver";
import type { FormulaTerm, PricingAgentCostRow } from "./types";

export type PodRateBand = Pick<
  PricingRateBandRow,
  | "rate_band_code"
  | "role_code"
  | "level_code"
  | "currency"
  | "rate_basis"
  | "loaded_rate"
  | "scarcity_adj_rate"
  | "indicative_bill_rate"
  | "confidence"
  | "approval_status"
> & { source?: string | null };
export type PodLocation = Pick<
  PricingDeliveryLocationRow,
  "location_code" | "shore_category" | "salary_multiplier" | "rate_multiplier"
> & { source_artifact?: string | null; source_row?: number | null };
export type PodProviderClass = Pick<
  PricingProviderClassRow,
  "provider_class_code" | "tier_multiplier"
> & { source_artifact?: string | null; source_row?: number | null };

export interface PodRateReference {
  basis: PodRateBasis;
  rateBands: readonly PodRateBand[];
  locations: readonly PodLocation[];
  providerClasses: readonly PodProviderClass[];
  /** Roles plus client/global rate-card lines for the existing resolver (read for `bill_rate` only). Absent = no card lines. */
  rateCard?: Pick<RoleRateSnapshot, "roles" | "clientLines" | "globalLines">;
}

/** Rate-band `rate_basis` values this adapter understands, and the provider class / shore each benchmarks. */
export const BAND_RATE_BASIS_BENCHMARKS: Readonly<
  Record<string, { providerClassCode: string; shoreCategory: string }>
> = {
  onshore_si_t1_benchmark: {
    providerClassCode: "SI-T1",
    shoreCategory: "onshore",
  },
};

const BAND_COLUMN_BY_BASIS = {
  loaded_cost: "loaded_rate",
  scarcity_adjusted_cost: "scarcity_adj_rate",
  bill_rate: "indicative_bill_rate",
} as const satisfies Record<PodRateBasis, keyof PodRateBand>;

const LOCATION_COLUMN_BY_BASIS = {
  loaded_cost: "salary_multiplier",
  scarcity_adjusted_cost: "salary_multiplier",
  bill_rate: "rate_multiplier",
} as const satisfies Record<PodRateBasis, keyof PodLocation>;

function refusal(code: string, message: string): PodRateRefusal {
  return { ok: false, code, message };
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildRate(
  member: PodMember,
  basis: PodRateBasis,
  currency: string,
  baseSource: string,
  baseLabel: string,
  baseRateCents: number,
  location: PodRateMultiplier,
  provider: PodRateMultiplier,
  notes: string[],
): ResolvedPodRate {
  const hourlyRateCents = Math.round(
    baseRateCents * location.value * provider.value,
  );
  const rateTerms: FormulaTerm[] = [
    {
      label: baseLabel,
      value: baseRateCents,
      source: baseSource,
      cellRole: "rate",
    },
    {
      label: `location ${member.locationCode}`,
      value: location.value,
      source: location.source,
      cellRole: "factor",
    },
    {
      label: "provider class",
      value: provider.value,
      source: provider.source,
      cellRole: "factor",
    },
    {
      label: "hourly rate (cents)",
      value: hourlyRateCents,
      source: "engine",
      cellRole: "result",
    },
  ];
  const describe = (m: PodRateMultiplier) =>
    `${m.value.toFixed(2)}${m.notAppliedReason ? ` (not applied: ${m.notAppliedReason})` : ""}`;
  const trace =
    `rate = ${baseLabel} ${dollars(baseRateCents)} × location ${member.locationCode} ${describe(location)} ` +
    `× provider ${describe(provider)} = ${dollars(hourlyRateCents)}/hr`;
  return {
    basis,
    currency,
    baseSource,
    baseRateCents,
    location,
    provider,
    hourlyRateCents,
    rateTerms,
    trace,
    notes,
  };
}

/**
 * Build a `PodRateResolver` over the reference pack and the existing
 * rate-card resolver. Every refusal is typed (`unknown_location`,
 * `unknown_provider_class`, `no_rate_band`, `rate_band_column_empty`,
 * `unsupported_band_rate_basis`, `rate_missing`) — never a default rate.
 */
export function createReferencePodRateResolver(
  reference: PodRateReference,
): PodRateResolver {
  const { basis } = reference;
  return (member: PodMember) => {
    const location = reference.locations.find(
      (l) => l.location_code === member.locationCode,
    );
    if (!location)
      return refusal(
        "unknown_location",
        `location '${member.locationCode}' is not in the delivery-location reference`,
      );
    const memberClass = member.providerClassCode
      ? reference.providerClasses.find(
          (p) => p.provider_class_code === member.providerClassCode,
        )
      : undefined;
    if (member.providerClassCode && !memberClass) {
      return refusal(
        "unknown_provider_class",
        `provider class '${member.providerClassCode}' is not in the provider-class reference`,
      );
    }

    // bill_rate: reuse the existing resolver's precedence (client card →
    // global card → band default); its rate IS the base rate below.
    let resolverBaseCents: number | null = null;
    if (basis === "bill_rate") {
      const resolved = resolveRoleRate(member.roleCode, member.levelCode, {
        roles: reference.rateCard?.roles ?? [],
        clientLines: reference.rateCard?.clientLines ?? [],
        globalLines: reference.rateCard?.globalLines ?? [],
        rateBands: reference.rateBands,
      });
      if (
        resolved.resolvedFromScope === "missing" ||
        resolved.hourlyRateCents === null
      ) {
        return refusal(
          "rate_missing",
          resolved.gapReason ??
            `no rate resolves '${member.roleCode}' at '${member.levelCode}'`,
        );
      }
      if (
        resolved.resolvedFromScope === "client" ||
        resolved.resolvedFromScope === "global"
      ) {
        const reason =
          "rate-card line used as-is (the existing resolver does not match a line's location_ref/provider_ref)";
        const scope =
          resolved.resolvedFromScope === "client"
            ? "client_rate_card"
            : "global_rate_card";
        return buildRate(
          member,
          basis,
          resolved.currency,
          `${scope}:${resolved.rateCardVersionId ?? "unversioned"}`,
          `${resolved.resolvedFromScope} rate card ${member.roleCode}${resolved.levelCode ? `-${resolved.levelCode}` : ""}`,
          resolved.hourlyRateCents,
          {
            source: `location:${member.locationCode}:not_applied`,
            value: 1,
            notAppliedReason: reason,
          },
          {
            source: `provider_class:${member.providerClassCode ?? "none"}:not_applied`,
            value: 1,
            notAppliedReason: reason,
          },
          [`${scope} line resolved by rate-card-resolver.ts`],
        );
      }
      resolverBaseCents = resolved.hourlyRateCents;
    }

    const bandCode = `${member.roleCode}-${member.levelCode}`;
    const band = reference.rateBands.find((b) => b.rate_band_code === bandCode);
    if (!band)
      return refusal(
        "no_rate_band",
        `no rate band '${bandCode}' (role '${member.roleCode}' is not banded at '${member.levelCode}')`,
      );
    const benchmark = BAND_RATE_BASIS_BENCHMARKS[band.rate_basis];
    if (!benchmark) {
      return refusal(
        "unsupported_band_rate_basis",
        `rate band '${bandCode}' has rate_basis '${band.rate_basis}', which this adapter does not know how to rebase`,
      );
    }
    const column = BAND_COLUMN_BY_BASIS[basis];
    const value = band[column];
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return refusal(
        "rate_band_column_empty",
        `rate band '${bandCode}' has no ${column}`,
      );
    }
    const baseRateCents = resolverBaseCents ?? dollarsToCents(value);

    const locationColumn = LOCATION_COLUMN_BY_BASIS[basis];
    const locationMultiplier: PodRateMultiplier = {
      source: `location:${member.locationCode}:${locationColumn}${location.source_artifact && location.source_row !== null && location.source_row !== undefined ? ` [${location.source_artifact} row ${location.source_row}]` : ""}`,
      value: location[locationColumn],
      notAppliedReason: null,
    };

    let providerMultiplier: PodRateMultiplier;
    if (basis === "bill_rate") {
      const benchmarkClass = reference.providerClasses.find(
        (p) => p.provider_class_code === benchmark.providerClassCode,
      );
      if (!benchmarkClass) {
        return refusal(
          "unknown_provider_class",
          `band benchmark provider class '${benchmark.providerClassCode}' is not in the provider-class reference`,
        );
      }
      const effectiveClass = memberClass ?? benchmarkClass;
      providerMultiplier = {
        source: `provider_class:${effectiveClass.provider_class_code}/${benchmarkClass.provider_class_code}${effectiveClass.source_artifact && effectiveClass.source_row !== null && effectiveClass.source_row !== undefined ? ` [${effectiveClass.source_artifact} row ${effectiveClass.source_row}]` : ""}`,
        value: round4(
          effectiveClass.tier_multiplier / benchmarkClass.tier_multiplier,
        ),
        notAppliedReason: null,
      };
    } else {
      providerMultiplier = {
        source: `provider_class:${member.providerClassCode ?? "none"}:not_applied`,
        value: 1,
        notAppliedReason:
          "provider-class tier multipliers price a provider's charge; a cost basis is provider-independent",
      };
    }

    return buildRate(
      member,
      basis,
      band.currency,
      `rate_band:${bandCode}:${column}${band.source ? ` [${band.source}]` : ""}`,
      `band ${bandCode} ${column}`,
      baseRateCents,
      locationMultiplier,
      providerMultiplier,
      [
        `band rate_basis ${band.rate_basis} (benchmark ${benchmark.providerClassCode}, ${benchmark.shoreCategory})`,
        `band confidence ${band.confidence ?? "unknown"}, approval ${band.approval_status ?? "unknown"}`,
        "location scarcity_multiplier not applied in this increment",
      ],
    );
  };
}

/**
 * Turn a reference `pricing_agent_costs` row into a pod tool-licence line.
 * Only time-based USD units are accepted (`USD/month`, `USD/<unit>/month`);
 * anything else (e.g. a one-time per-use-case cost) is refused. No
 * productivity credit is attached — a licence is a cost line only.
 */
export function toolLicenceFromAgentCost(
  row: Pick<
    PricingAgentCostRow,
    "agent_cost_code" | "cost_key" | "cost_value" | "unit"
  >,
  options: { quantity: number; weeksPerMonth: number; label?: string },
): PodToolLicence | PodRateRefusal {
  if (!/^USD\/(?:[A-Za-z-]+\/)?month$/.test(row.unit)) {
    return refusal(
      "unsupported_licence_unit",
      `agent cost '${row.agent_cost_code}' has unit '${row.unit}', not a USD-per-month licence`,
    );
  }
  if (!Number.isFinite(row.cost_value) || row.cost_value < 0) {
    return refusal(
      "invalid_licence_cost",
      `agent cost '${row.agent_cost_code}' has cost_value ${row.cost_value}`,
    );
  }
  return {
    code: row.agent_cost_code,
    label: options.label ?? row.cost_key,
    per: "month",
    quantity: options.quantity,
    costCentsPerUnit: dollarsToCents(row.cost_value),
    weeksPerMonth: options.weeksPerMonth,
    source: `agent_cost:${row.agent_cost_code}:${row.cost_key}`,
  };
}
