/**
 * Nexus Pricing Engine — pod pricer (ROM increment 1).
 *
 * Prices a block of adjusted hours by buying whole weeks of a fixed pod
 * instead of allocating hours across a role mix:
 *
 *   productive hours / week = round4(ΣFTE × hoursPerFteWeek × productiveShare)
 *   weeks                   = ceil(H / productive hours per week)
 *   member paid hours       = FTE_i × weeks × hoursPerFteWeek
 *   labor cost              = Σ hoursToCents(member paid hours, rate_i)
 *   rounding slack          = weeks × productive hours/week − H
 *
 * ## Rates come from the cost foundation, never from the caller's head
 *
 * A pod member is identified by `{ roleCode, levelCode, locationCode,
 * providerClassCode?, fte }` — codes from the committed reference pack
 * (`datasets/reference/pricing-engine-v1/`). The pricer does not accept a
 * bare hourly number: every member's rate is obtained from an injected
 * `PodRateResolver` and must arrive WITH its provenance (which rate band or
 * rate-card line, which column/basis, the location and provider-class
 * multipliers applied) as `rateTerms` that reconcile exactly to the rate.
 * `pod-rate-adapter.ts` provides the resolver over the reference pack and
 * the existing rate-card resolver; tests may inject their own.
 *
 * `productiveShare` is applied HERE ONLY — it converts paid capacity into
 * productive capacity. The hours H handed in (e.g. the engine's expected
 * hours in `pricingBasis: 'pod'`) must never also carry it.
 *
 * Whole weeks are bought, so the pod is usually paid for more capacity than
 * H needs; that excess is reported as its own `roundingSlack` line (already
 * INSIDE the labor cost, not added on top).
 *
 * Optional tool-licence lines (per pod-week or per month) are added to the
 * total as their own lines. NO productivity credit is applied for AI tools
 * in this increment — a licence never changes hours, weeks or labor cost.
 *
 * ## Unconfirmed inputs are printed, never hidden
 *
 * A member built from a pod template may carry `provenance`: its role came
 * from a proposed (unapproved) mapping, and/or its level was clamped into the
 * role's allowed range. The pricer derives the caveat sentences from those
 * flags itself (`podMemberCaveats`) — "proposed role mapping, unapproved" and
 * "level clamped from X to Y" — and writes them into the member's FTE term
 * source, its rate term source, its rate notes, its cost line, the formula
 * trace and the result's `caveats`, so a workbook or document built from the
 * result cannot present the member as confirmed. Provenance whose flags
 * contradict the member's own level is refused.
 *
 * Pure, deterministic, no I/O. Invalid input returns a typed refusal —
 * never NaN, Infinity or a silent zero.
 */
import {
  appendCostTerms,
  closeHoursTerms,
  evaluateRateTerms,
} from "./formula-terms";
import {
  applyMultiplierToCents,
  hoursToCents,
  roundHours,
  sumCents,
} from "./money";
import type { Cents, FormulaTerm } from "./types";

export interface PodMember {
  roleCode: string;
  levelCode: string;
  locationCode: string;
  /** Optional provider class (e.g. an SI tier); absent = the rate source's own benchmark class. */
  providerClassCode?: string | null;
  /** Full-time equivalents of this member in the pod. Finite, >= 0. */
  fte: number;
  /** How the member's role and level were derived, when it came from a pod template. Absent = caller-specified, no caveat. */
  provenance?: PodMemberProvenance;
}

/** The first words of the caveat on a member whose role mapping is proposed, not confirmed. */
export const PROPOSED_ROLE_MAPPING_CAVEAT = "proposed role mapping, unapproved";

export interface PodMemberProvenance {
  /** `confirmed` = an exact/alias reference match; `proposed_unapproved` = proposed by a tower + label rule, not yet approved. */
  roleMapping: "confirmed" | "proposed_unapproved";
  /** The rule that proposed the role (`GENERIC_ROLE_RULES` id), or null. */
  mappingRuleId: string | null;
  /** The pod template's role label, as written. */
  rawRoleText: string;
  /** `none` exactly when `levelCode === originalLevelCode`. */
  levelAdjustment: "none" | "clamped_up" | "clamped_down";
  /** The pod's blended level, before any clamp. */
  originalLevelCode: string;
}

/**
 * The caveat sentences a member's provenance requires, in a fixed order:
 * the proposed mapping first, then the level clamp. Empty for a member with
 * no provenance, or a confirmed, unclamped one.
 */
export function podMemberCaveats(member: PodMember): string[] {
  const p = member.provenance;
  if (!p) return [];
  const caveats: string[] = [];
  if (p.roleMapping !== "confirmed") {
    caveats.push(
      `${PROPOSED_ROLE_MAPPING_CAVEAT} ("${p.rawRoleText}" → ${member.roleCode}${p.mappingRuleId ? ` by rule ${p.mappingRuleId}` : ""})`,
    );
  }
  if (p.levelAdjustment !== "none") {
    caveats.push(`level clamped from ${p.originalLevelCode} to ${member.levelCode}`);
  }
  return caveats;
}

function withCaveats(text: string, caveats: readonly string[]): string {
  return caveats.length === 0 ? text : `${text} [${caveats.join("; ")}]`;
}

export interface PodDefinition {
  podCode: string;
  members: readonly PodMember[];
}

/** Which money a rate represents. Cost bases read the band's internal-cost columns; `bill_rate` is the should-charge rate. */
export type PodRateBasis =
  | "loaded_cost"
  | "scarcity_adjusted_cost"
  | "bill_rate";

export interface PodRateMultiplier {
  /** e.g. `location:LOC-X:salary_multiplier`, `provider_class:CONS-T1/SI-T1`. */
  source: string;
  value: number;
  /** Set when the multiplier is shown as 1 because it does not apply to this rate source/basis. */
  notAppliedReason: string | null;
}

/** A member's resolved hourly rate plus where every factor of it came from. */
export interface ResolvedPodRate {
  basis: PodRateBasis;
  currency: string;
  /** Where the base rate came from: `rate_band:<code>:<column>`, `client_rate_card:<version>`, `global_rate_card:<version>`. */
  baseSource: string;
  baseRateCents: Cents;
  location: PodRateMultiplier;
  provider: PodRateMultiplier;
  hourlyRateCents: Cents;
  /** Base rate × multipliers = hourly rate, as terms that reconcile via `evaluateRateTerms`. */
  rateTerms: readonly FormulaTerm[];
  /** e.g. "rate = band ROL-x-LVL-y loaded_rate $90.00 × location LOC-z salary_multiplier 0.35 × provider 1.00 (...) = $31.50/hr". */
  trace: string;
  /** Free-form provenance notes (band confidence/approval status, known resolver limits). */
  notes: readonly string[];
}

export interface PodRateRefusal {
  ok: false;
  code: string;
  message: string;
}

export type PodRateResolver = (
  member: PodMember,
) => ResolvedPodRate | PodRateRefusal;

export interface PodToolLicence {
  /** e.g. the agent-cost code it came from. */
  code: string;
  label: string;
  /** Charged per pod-week, or per (whole, ceil'd) month of the pod's duration. */
  per: "pod_week" | "month";
  /** Seats or units charged per period. Finite, >= 0. */
  quantity: number;
  costCentsPerUnit: Cents;
  /** Required when `per === 'month'`: weeks in one billing month. Finite, > 0. */
  weeksPerMonth?: number;
  /** Provenance, e.g. `agent_cost:<code>:<cost_key>`. */
  source: string;
}

export interface PodPricingInput {
  /** Adjusted hours to deliver (after module and program factors). Finite, >= 0. */
  adjustedHours: number;
  pod: PodDefinition;
  /** Paid hours per FTE per week. Finite, > 0. */
  hoursPerFteWeek: number;
  /** Share of paid hours that is productive delivery, 0 < share <= 1. */
  productiveShare: number;
  rateResolver: PodRateResolver;
  toolLicences?: readonly PodToolLicence[];
}

export interface PodMemberCostLine {
  member: PodMember;
  /** The resolved rate; its `notes` end with the member's caveats. */
  rate: ResolvedPodRate;
  /** `podMemberCaveats(member)` — empty when the member is confirmed and unclamped. */
  caveats: readonly string[];
  paidHours: number;
  costCents: Cents;
  /** fte × weeks × hours/week = paid hours; × hourly rate = cost (reconciles via `evaluateFormulaTerms`). */
  formulaTerms: readonly FormulaTerm[];
}

export interface PodToolLicenceLine {
  licence: PodToolLicence;
  /** Weeks (per pod_week) or whole months (per month) charged. */
  periods: number;
  costCents: Cents;
  formulaTerms: readonly FormulaTerm[];
}

export interface PodRoundingSlack {
  /** Productive capacity bought beyond what the adjusted hours need. */
  productiveHours: number;
  /** The share of `laborCostCents` that buys that slack (blended across the pod). Included in the labor cost, not additional. */
  costCents: Cents;
}

export interface PodPricingResult {
  ok: true;
  podCode: string;
  adjustedHours: number;
  totalFte: number;
  hoursPerFteWeek: number;
  productiveShare: number;
  productiveHoursPerWeek: number;
  weeks: number;
  productiveCapacityHours: number;
  memberLines: readonly PodMemberCostLine[];
  roundingSlack: PodRoundingSlack;
  laborCostCents: Cents;
  toolLicenceLines: readonly PodToolLicenceLine[];
  toolLicenceCostCents: Cents;
  /** labor + tool licences. */
  totalCostCents: Cents;
  /** Every member caveat, prefixed with the member (`ROL-x/LVL-y@LOC: proposed role mapping, unapproved (...)`). Empty = every input confirmed. */
  caveats: readonly string[];
  formulaTrace: string;
}

export type PodPricingRefusalCode =
  | "invalid_adjusted_hours"
  | "invalid_hours_per_fte_week"
  | "invalid_productive_share"
  | "empty_pod"
  | "invalid_member"
  | "invalid_member_provenance"
  | "invalid_fte"
  | "non_positive_total_fte"
  | "rate_unresolved"
  | "invalid_rate"
  | "rate_provenance_mismatch"
  | "invalid_tool_licence";

export interface PodPricingRefusal {
  ok: false;
  code: PodPricingRefusalCode;
  message: string;
  /** For `rate_unresolved`: the resolver's own refusal. */
  rateRefusal?: PodRateRefusal;
}

/** A period count this close to a whole number is that whole number (IEEE-754 division noise, never a real fraction). */
const WHOLE_PERIOD_TOLERANCE = 1e-9;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function refuse(
  code: PodPricingRefusalCode,
  message: string,
  rateRefusal?: PodRateRefusal,
): PodPricingRefusal {
  return rateRefusal
    ? { ok: false, code, message, rateRefusal }
    : { ok: false, code, message };
}

/** ceil(numerator / denominator), treating a ratio within 1e-9 of a whole number as that whole number. */
export function wholePeriods(numerator: number, denominator: number): number {
  const ratio = numerator / denominator;
  const nearest = Math.round(ratio);
  return Math.abs(ratio - nearest) <= WHOLE_PERIOD_TOLERANCE
    ? nearest
    : Math.ceil(ratio);
}

function memberLabel(m: PodMember): string {
  return `${m.roleCode}/${m.levelCode}@${m.locationCode}${m.providerClassCode ? `/${m.providerClassCode}` : ""}`;
}

function validate(input: PodPricingInput): PodPricingRefusal | null {
  if (!isFiniteNumber(input.adjustedHours) || input.adjustedHours < 0) {
    return refuse(
      "invalid_adjusted_hours",
      `adjustedHours must be a finite number >= 0, got ${String(input.adjustedHours)}`,
    );
  }
  if (!isFiniteNumber(input.hoursPerFteWeek) || input.hoursPerFteWeek <= 0) {
    return refuse(
      "invalid_hours_per_fte_week",
      `hoursPerFteWeek must be a finite number > 0, got ${String(input.hoursPerFteWeek)}`,
    );
  }
  if (
    !isFiniteNumber(input.productiveShare) ||
    input.productiveShare <= 0 ||
    input.productiveShare > 1
  ) {
    return refuse(
      "invalid_productive_share",
      `productiveShare must satisfy 0 < share <= 1, got ${String(input.productiveShare)}`,
    );
  }
  if (input.pod.members.length === 0) {
    return refuse("empty_pod", `pod '${input.pod.podCode}' has no members`);
  }
  for (const m of input.pod.members) {
    if (
      !isNonBlank(m.roleCode) ||
      !isNonBlank(m.levelCode) ||
      !isNonBlank(m.locationCode)
    ) {
      return refuse(
        "invalid_member",
        `every pod member needs a roleCode, levelCode and locationCode, got ${JSON.stringify(m)}`,
      );
    }
    const p = m.provenance;
    if (
      p &&
      ((p.roleMapping !== "confirmed" && p.roleMapping !== "proposed_unapproved") ||
        (p.levelAdjustment !== "none" &&
          p.levelAdjustment !== "clamped_up" &&
          p.levelAdjustment !== "clamped_down") ||
        (p.levelAdjustment === "none") !== (p.originalLevelCode === m.levelCode))
    ) {
      return refuse(
        "invalid_member_provenance",
        `member ${memberLabel(m)} provenance must be confirmed|proposed_unapproved with a level adjustment of none exactly when its level equals the original level, got ${JSON.stringify(p)}`,
      );
    }
    if (!isFiniteNumber(m.fte) || m.fte < 0) {
      return refuse(
        "invalid_fte",
        `member ${memberLabel(m)} fte must be a finite number >= 0, got ${String(m.fte)}`,
      );
    }
  }
  const totalFte = input.pod.members.reduce((acc, m) => acc + m.fte, 0);
  if (!(totalFte > 0)) {
    return refuse(
      "non_positive_total_fte",
      `pod '${input.pod.podCode}' total FTE must be > 0, got ${totalFte}`,
    );
  }
  for (const licence of input.toolLicences ?? []) {
    const badAmount =
      !isFiniteNumber(licence.quantity) ||
      licence.quantity < 0 ||
      !isFiniteNumber(licence.costCentsPerUnit) ||
      licence.costCentsPerUnit < 0;
    const badPeriod =
      licence.per === "month"
        ? !isFiniteNumber(licence.weeksPerMonth) || licence.weeksPerMonth <= 0
        : licence.per !== "pod_week";
    if (badAmount || badPeriod) {
      return refuse(
        "invalid_tool_licence",
        `tool licence '${licence.code}' needs quantity >= 0, cost >= 0, per pod_week|month and (per month) weeksPerMonth > 0`,
      );
    }
  }
  return null;
}

function resolveRate(
  member: PodMember,
  resolver: PodRateResolver,
): ResolvedPodRate | PodPricingRefusal {
  const resolved = resolver(member);
  if ("ok" in resolved) {
    return refuse(
      "rate_unresolved",
      `no rate for member ${memberLabel(member)}: ${resolved.code} — ${resolved.message}`,
      resolved,
    );
  }
  if (
    !isFiniteNumber(resolved.hourlyRateCents) ||
    resolved.hourlyRateCents < 0
  ) {
    return refuse(
      "invalid_rate",
      `member ${memberLabel(member)} resolved a rate of ${String(resolved.hourlyRateCents)} cents — must be finite and >= 0`,
    );
  }
  if (evaluateRateTerms(resolved.rateTerms) !== resolved.hourlyRateCents) {
    return refuse(
      "rate_provenance_mismatch",
      `member ${memberLabel(member)}'s rate terms do not reconcile to its rate (${resolved.hourlyRateCents} cents) — a rate without provenance is refused`,
    );
  }
  return resolved;
}

export function pricePod(
  input: PodPricingInput,
): PodPricingResult | PodPricingRefusal {
  const refusal = validate(input);
  if (refusal) return refusal;

  const { adjustedHours: hours, hoursPerFteWeek, productiveShare, pod } = input;

  const rates: ResolvedPodRate[] = [];
  for (const member of pod.members) {
    const rate = resolveRate(member, input.rateResolver);
    if ("ok" in rate) return rate;
    rates.push(rate);
  }

  const totalFte = roundHours(pod.members.reduce((acc, m) => acc + m.fte, 0));
  const productiveHoursPerWeek = roundHours(
    totalFte * hoursPerFteWeek * productiveShare,
  );
  const weeks = wholePeriods(hours, productiveHoursPerWeek);
  const productiveCapacityHours = roundHours(weeks * productiveHoursPerWeek);

  const memberLines: PodMemberCostLine[] = pod.members.map((member, i) => {
    const caveats = podMemberCaveats(member);
    const rate =
      caveats.length === 0 ? rates[i] : { ...rates[i], notes: [...rates[i].notes, ...caveats] };
    const paidHours = roundHours(member.fte * weeks * hoursPerFteWeek);
    const costCents = hoursToCents(paidHours, rate.hourlyRateCents);
    const terms = closeHoursTerms(
      [
        {
          label: `${memberLabel(member)} FTE`,
          value: member.fte,
          source: withCaveats("pod", caveats),
          cellRole: "count",
        },
        { label: "weeks", value: weeks, source: "engine", cellRole: "count" },
        {
          label: "paid hours per FTE-week",
          value: hoursPerFteWeek,
          source: "pod",
          cellRole: "unit_hours",
        },
      ],
      paidHours,
      "paid hours",
    );
    appendCostTerms(
      terms,
      rate.hourlyRateCents,
      withCaveats(`resolved:${rate.baseSource}`, caveats),
      costCents,
    );
    return { member, rate, caveats, paidHours, costCents, formulaTerms: terms };
  });
  const laborCostCents = sumCents(...memberLines.map((l) => l.costCents));

  const slackHours = roundHours(productiveCapacityHours - hours);
  const slackCostCents =
    productiveCapacityHours === 0
      ? 0
      : applyMultiplierToCents(
          laborCostCents,
          slackHours / productiveCapacityHours,
        );

  const toolLicenceLines: PodToolLicenceLine[] = (input.toolLicences ?? []).map(
    (licence) => {
      const periods =
        licence.per === "pod_week"
          ? weeks
          : wholePeriods(weeks, licence.weeksPerMonth as number);
      const units = roundHours(periods * licence.quantity);
      const costCents = hoursToCents(units, licence.costCentsPerUnit);
      const terms = closeHoursTerms(
        [
          {
            label: licence.per === "pod_week" ? "pod weeks" : "billing months",
            value: periods,
            source: "engine",
            cellRole: "count",
          },
          {
            label: `${licence.label} quantity`,
            value: licence.quantity,
            source: licence.source,
            cellRole: "count",
          },
        ],
        units,
        "licence units",
      );
      appendCostTerms(
        terms,
        licence.costCentsPerUnit,
        licence.source,
        costCents,
      );
      return { licence, periods, costCents, formulaTerms: terms };
    },
  );
  const toolLicenceCostCents = sumCents(
    ...toolLicenceLines.map((l) => l.costCents),
  );
  const totalCostCents = sumCents(laborCostCents, toolLicenceCostCents);

  const dollars = (cents: Cents) => `$${(cents / 100).toFixed(2)}`;
  const formulaTrace =
    `ceil(${hours} h ÷ (${totalFte} FTE × ${hoursPerFteWeek} h × ${productiveShare} productive)) = ${weeks} weeks; ` +
    memberLines
      .map(
        (l) =>
          `${withCaveats(memberLabel(l.member), l.caveats)} ${l.member.fte} FTE × ${weeks} wk × ${hoursPerFteWeek} h × ${dollars(l.rate.hourlyRateCents)}/hr = ${dollars(l.costCents)}`,
      )
      .join(" + ") +
    ` = ${dollars(laborCostCents)} labor; rounding slack ${slackHours} productive h (${dollars(slackCostCents)}, included)` +
    (toolLicenceLines.length > 0
      ? `; tool licences ${toolLicenceLines.map((l) => `${l.licence.code} ${l.periods} × ${l.licence.quantity} × ${dollars(l.licence.costCentsPerUnit)} = ${dollars(l.costCents)}`).join(" + ")}`
      : "");

  return {
    ok: true,
    podCode: pod.podCode,
    adjustedHours: hours,
    totalFte,
    hoursPerFteWeek,
    productiveShare,
    productiveHoursPerWeek,
    weeks,
    productiveCapacityHours,
    memberLines,
    roundingSlack: { productiveHours: slackHours, costCents: slackCostCents },
    laborCostCents,
    toolLicenceLines,
    toolLicenceCostCents,
    totalCostCents,
    caveats: memberLines.flatMap((l) =>
      l.caveats.map((c) => `${memberLabel(l.member)}: ${c}`),
    ),
    formulaTrace,
  };
}
