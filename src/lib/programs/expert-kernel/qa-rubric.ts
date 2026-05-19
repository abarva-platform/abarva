// Expert Kernel — qa-rubric.
//
// Deterministic pass/fail validation of a compiled business-case skeleton
// against the eight required skeleton elements (§11.2) and the kernel's
// honesty rules. The rubric is the gate: a skeleton that fails the rubric is
// not CFO-ready.
//
// Pure module: deterministic, no I/O.

import type { BusinessCaseSkeleton } from './business-case-compiler';

export interface RubricCheck {
  /** Stable check id. */
  id: string;
  /** What is being verified. */
  label: string;
  passed: boolean;
  /** Why it failed (empty when passed). */
  detail: string;
}

export interface RubricResult {
  checks: RubricCheck[];
  passed: boolean;
  passCount: number;
  failCount: number;
}

/**
 * Validate a business-case skeleton. Every check is deterministic; the
 * skeleton passes only if every check passes.
 */
export function evaluateRubric(
  skeleton: BusinessCaseSkeleton,
): RubricResult {
  const checks: RubricCheck[] = [];
  const check = (
    id: string,
    label: string,
    passed: boolean,
    detail = '',
  ): void => {
    checks.push({ id, label, passed, detail: passed ? '' : detail });
  };

  // 1 — baseline facts present, seed gaps explicit.
  check(
    'element_1_baseline',
    'Baseline facts present with explicit seed gaps',
    skeleton.baseline.metrics.length > 0 &&
      skeleton.baseline.seedGaps.every((g) => Boolean(g.seedGapReason)),
    'Baseline empty, or a seed gap is missing its reason.',
  );

  // 2 — value range present and ordered.
  const v = skeleton.valueRange;
  check(
    'element_2_value_range',
    'Value range present and well-ordered (low <= point <= high)',
    v.low <= v.point && v.point <= v.high,
    `Value range is malformed: ${JSON.stringify(v)}.`,
  );

  // 3 — effort range present and ordered.
  const e = skeleton.effortRange;
  check(
    'element_3_effort_range',
    'Cost / effort range present and well-ordered',
    e.low <= e.point && e.point <= e.high && e.point > 0,
    `Effort range is malformed or zero: ${JSON.stringify(e)}.`,
  );

  // 4 — named assumptions, each with an owner.
  check(
    'element_4_named_assumptions',
    'At least one named assumption, every assumption owned',
    skeleton.assumptions.assumptions.length > 0 &&
      skeleton.assumptions.assumptions.every((a) => a.owner.trim().length > 0),
    'No assumptions, or an assumption has no named owner.',
  );

  // 5 — sensitivity with what-breaks and top movers.
  check(
    'element_5_sensitivity',
    'Sensitivity: base/conservative/upside + what-breaks + top movers',
    skeleton.sensitivity.whatBreaksTheCase.trim().length > 0 &&
      skeleton.sensitivity.topMovers.length > 0 &&
      skeleton.sensitivity.conservative.point <= skeleton.sensitivity.base.point &&
      skeleton.sensitivity.base.point <= skeleton.sensitivity.upside.point,
    'Sensitivity missing what-breaks/top-movers, or scenarios not ordered.',
  );

  // 6 — kill criteria present.
  check(
    'element_6_kill_criteria',
    'At least one kill criterion',
    skeleton.killCriteria.length > 0,
    'No kill criteria — a CFO case must state when to stop.',
  );

  // 7 — recommendation present and valid.
  check(
    'element_7_recommendation',
    'Recommendation is fund / shape / kill with a rationale',
    ['fund', 'shape', 'kill'].includes(skeleton.recommendation) &&
      skeleton.recommendationRationale.trim().length > 0,
    'Recommendation missing or has no rationale.',
  );

  // 8 — Tower measurement handoff present.
  check(
    'element_8_tower_handoff',
    'Tower measurement handoff with at least one tracked metric',
    skeleton.towerHandoff.length > 0,
    'No Tower handoff — value must be measurable downstream.',
  );

  // Honesty rule A — the critic ran and findings are attached.
  check(
    'honesty_critic_ran',
    'Critic report attached (findings surfaced, not hidden)',
    Array.isArray(skeleton.critic.findings),
    'Critic report missing.',
  );

  // Honesty rule B — a blocker cannot coexist with a "fund" recommendation.
  check(
    'honesty_blocker_not_funded',
    'No "fund" recommendation while a critic blocker stands',
    !(skeleton.critic.hasBlocker && skeleton.recommendation === 'fund'),
    'A critic blocker is open but the Move is recommended for funding.',
  );

  // Honesty rule C — if monetisation is blocked, payback must be null.
  check(
    'honesty_monetisation_consistent',
    'Payback is null when monetisation is blocked',
    skeleton.economics.monetisable ||
      skeleton.economics.paybackMonths === null,
    'Monetisation is blocked but a payback figure was claimed.',
  );

  // Honesty rule D — every seed-gap-proxy assumption is reflected in a
  // Tower handoff readiness note or a kill criterion.
  const proxyKeys = skeleton.assumptions.seedGapProxies.map((a) => a.key);
  const proxiesAcknowledged =
    proxyKeys.length === 0 ||
    skeleton.killCriteria.some((k) =>
      k.code.includes('monetisation') || k.code.includes('baseline'),
    );
  check(
    'honesty_seed_gap_proxies_acknowledged',
    'Seed-gap proxy assumptions are reflected in a kill criterion',
    proxiesAcknowledged,
    'A seed-gap proxy assumption is not acknowledged by any kill criterion.',
  );

  const passCount = checks.filter((c) => c.passed).length;
  const failCount = checks.length - passCount;
  return { checks, passed: failCount === 0, passCount, failCount };
}
