/**
 * Moves value engine — conversion rules.
 *
 * How each lever conversion may become money, checked BEFORE any number is
 * computed. A lever that breaks a rule is refused (`blocked_conversion_rule`)
 * with the rule's code; it is never silently re-shaped.
 *
 *  - cost_reduction: needs a spend `base` and a "bought less" assumption
 *    (a `driver_delta` or a `share` term) — spend that is not bought less is
 *    not saved.
 *  - volume_added: needs a `refill_share` (freed capacity is only value when
 *    it is refilled) and a `margin` (volume is valued at contribution, not
 *    revenue).
 *  - revenue: needs a `margin`.
 *  - risk_avoided: reported separately and excluded from cash (NPV, payback,
 *    breakeven) unless the case opts in.
 *  - non_cash (hours saved and the like): always $0 unless a role or
 *    contract release path resolves to a COUNTED input; then it converts to
 *    a cost reduction on the released cost only. The hours stay reported as
 *    a non-money metric either way.
 *
 * Pure, no I/O.
 */
import type {
  Lever,
  LeverConversion,
  LeverTermRole,
  RuleViolation,
  ValueCase,
} from "./types";

/** Longest horizon a case may declare, in years. */
export const MAX_HORIZON_YEARS = 10;

/** Conversions whose figure is cash unless the case says otherwise. */
export function conversionIsCash(
  conversion: LeverConversion,
  includeRiskAvoidedInCash: boolean,
): boolean {
  if (conversion === "risk_avoided") return includeRiskAvoidedInCash;
  return true;
}

function hasRole(lever: Lever, role: LeverTermRole): boolean {
  return lever.terms.some((term) => term.role === role);
}

function violation(
  lever: Lever,
  code: RuleViolation["code"],
  detail: string,
): RuleViolation {
  return { code, leverId: lever.id, detail };
}

/** Every conversion-rule violation for one lever (empty when it may be computed). */
export function leverRuleViolations(lever: Lever): RuleViolation[] {
  const out: RuleViolation[] = [];
  const driverDeltaCount = lever.terms.filter(
    (term) => term.role === "driver_delta",
  ).length;
  if (driverDeltaCount > 1) {
    out.push(
      violation(
        lever,
        "multiple_driver_delta_terms",
        "A lever has one driver; its delta may appear once in the product.",
      ),
    );
  }
  switch (lever.conversion) {
    case "cost_reduction":
      if (!hasRole(lever, "base")) {
        out.push(
          violation(
            lever,
            "cost_reduction_requires_base",
            "A cost reduction needs the spend base it reduces.",
          ),
        );
      }
      if (!hasRole(lever, "driver_delta") && !hasRole(lever, "share")) {
        out.push(
          violation(
            lever,
            "cost_reduction_requires_bought_less",
            "A cost reduction needs a bought-less assumption (a driver delta or a share of spend no longer bought).",
          ),
        );
      }
      break;
    case "volume_added":
      if (!hasRole(lever, "refill_share")) {
        out.push(
          violation(
            lever,
            "volume_added_requires_refill_share",
            "Freed capacity is value only when it is refilled; state the refill share.",
          ),
        );
      }
      if (!hasRole(lever, "margin")) {
        out.push(
          violation(
            lever,
            "volume_added_requires_margin",
            "Added volume is valued at contribution margin, not revenue.",
          ),
        );
      }
      break;
    case "revenue":
      if (!hasRole(lever, "margin")) {
        out.push(
          violation(
            lever,
            "revenue_requires_margin",
            "Revenue is valued at its margin.",
          ),
        );
      }
      break;
    case "risk_avoided":
    case "non_cash":
      break;
  }
  if (lever.releasePath && lever.conversion !== "non_cash") {
    out.push(
      violation(
        lever,
        "release_path_only_for_non_cash",
        "A release path converts non-cash value; this lever is already money.",
      ),
    );
  }
  const bounds = lever.driver.deltaBounds;
  if (
    bounds &&
    !(
      Number.isFinite(bounds.min) &&
      Number.isFinite(bounds.max) &&
      bounds.min >= 0 &&
      bounds.min <= bounds.max
    )
  ) {
    out.push(
      violation(
        lever,
        "invalid_delta_bounds",
        "Driver delta bounds must be finite with 0 ≤ min ≤ max.",
      ),
    );
  }
  return out;
}

/** Case-level violations: no levers, duplicate ids, a horizon outside 1..MAX_HORIZON_YEARS. */
export function caseRuleViolations(model: ValueCase): RuleViolation[] {
  const out: RuleViolation[] = [];
  if (model.levers.length === 0) {
    out.push({
      code: "no_levers",
      leverId: null,
      detail: "A value case needs at least one lever.",
    });
  }
  const seen = new Set<string>();
  for (const lever of model.levers) {
    if (seen.has(lever.id)) {
      out.push({
        code: "duplicate_lever_id",
        leverId: lever.id,
        detail: `Lever id ${lever.id} appears more than once.`,
      });
    }
    seen.add(lever.id);
  }
  if (
    !Number.isInteger(model.horizonYears) ||
    model.horizonYears < 1 ||
    model.horizonYears > MAX_HORIZON_YEARS
  ) {
    out.push({
      code: "invalid_horizon",
      leverId: null,
      detail: `The horizon must be a whole number of years from 1 to ${MAX_HORIZON_YEARS}.`,
    });
  }
  return out;
}
