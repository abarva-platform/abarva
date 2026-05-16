// Tower · Slice 3.2 — Executive Action Queue view-model unit tests.
//
// Pure deterministic coverage of executive-action-queue.ts. The QA gate
// for Tower logic requires a proven deterministic ordering, so the bulk
// of these tests assert stable ranking across every trigger type.

import {
  buildExecutiveActionQueue,
  deriveExecutiveAction,
  EXECUTIVE_ACTION_TRIGGERS,
  SEVERITY_RANK,
  type ExecutiveActionTrigger,
} from '@/lib/tower/action-queue/executive-action-queue';
import type { ValueLedgerEntry } from '@/lib/tower/ai-value-outcome-ledger';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture builder
// ─────────────────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<ValueLedgerEntry>): ValueLedgerEntry {
  const base: ValueLedgerEntry = {
    id: 'value-seed-x',
    initiative: 'Test initiative',
    category: 'productivity',
    measurementUnit: 'percent',
    projectedValue: 100,
    realizedValue: null,
    baselineValue: 0,
    varianceAbs: null,
    variancePercent: null,
    measurementOwnerRole: 'VP Test',
    counterfactual: 'comparison condition',
    counterfactualConfidence: 'medium',
    readiness: 'projected_only',
    evidenceLinkedClaimIds: [],
    governanceReviewStatus: 'not_started',
    notes: ['seed projection only'],
    seed_value: true,
    createdFrom: 'deterministic_value_outcome_ledger_seed',
  };
  return { ...base, ...overrides };
}

// One representative entry per non-`no_action` trigger.
const VALUE_LEAKAGE = makeEntry({
  id: 'value-seed-leak',
  readiness: 'measured_in_production',
  realizedValue: 70,
  varianceAbs: -30,
  variancePercent: -30,
});
const SPONSOR_GAP = makeEntry({
  id: 'value-seed-sponsor',
  governanceReviewStatus: 'flagged',
});
const ADOPTION_GAP = makeEntry({
  id: 'value-seed-adopt',
  readiness: 'measured_in_pilot',
  realizedValue: 92,
  varianceAbs: -8,
  variancePercent: -8,
});
const RENEWAL_RISK = makeEntry({
  id: 'value-seed-renew',
  readiness: 'declined',
});
const DEPENDENCY_BLOCKER = makeEntry({
  id: 'value-seed-dep',
  readiness: 'projected_only',
  baselineValue: null,
});
const VERIFY_CLAIM = makeEntry({
  id: 'value-seed-verify',
  readiness: 'baseline_set',
  baselineValue: 40,
});
const NO_ACTION = makeEntry({
  id: 'value-seed-ok',
  readiness: 'measured_in_production',
  realizedValue: 110,
  varianceAbs: 10,
  variancePercent: 10,
});

// ─────────────────────────────────────────────────────────────────────────────
// Trigger derivation
// ─────────────────────────────────────────────────────────────────────────────

describe('deriveExecutiveAction — trigger taxonomy', () => {
  const cases: Array<[string, ValueLedgerEntry, ExecutiveActionTrigger]> = [
    ['value leakage', VALUE_LEAKAGE, 'value_leakage'],
    ['sponsor gap (flagged)', SPONSOR_GAP, 'sponsor_intervention'],
    ['adoption gap', ADOPTION_GAP, 'drive_adoption'],
    ['renewal risk (declined)', RENEWAL_RISK, 'open_renewal_review'],
    ['dependency blocker', DEPENDENCY_BLOCKER, 'escalate_dependency'],
    ['verify value claim', VERIFY_CLAIM, 'verify_value_claim'],
    ['no action', NO_ACTION, 'no_action'],
  ];

  it.each(cases)('maps %s to the correct trigger', (_label, entry, trigger) => {
    expect(deriveExecutiveAction(entry).trigger).toBe(trigger);
  });

  it('produces a condition, why-it-matters, and implied action for every trigger', () => {
    for (const [, entry] of cases) {
      const verdict = deriveExecutiveAction(entry);
      expect(verdict.condition.length).toBeGreaterThan(0);
      expect(verdict.whyItMatters.length).toBeGreaterThan(0);
      expect(verdict.impliedAction.length).toBeGreaterThan(0);
    }
  });

  it('every derived trigger is a member of the closed taxonomy', () => {
    for (const [, entry] of cases) {
      expect(EXECUTIVE_ACTION_TRIGGERS).toContain(
        deriveExecutiveAction(entry).trigger,
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic ordering — the QA gate
// ─────────────────────────────────────────────────────────────────────────────

describe('buildExecutiveActionQueue — deterministic ordering', () => {
  const ALL_TRIGGERS = [
    VALUE_LEAKAGE,
    SPONSOR_GAP,
    ADOPTION_GAP,
    RENEWAL_RISK,
    DEPENDENCY_BLOCKER,
    VERIFY_CLAIM,
    NO_ACTION,
  ];

  it('excludes no_action entries from the queue', () => {
    const queue = buildExecutiveActionQueue(ALL_TRIGGERS);
    expect(queue.actions.every((a) => a.trigger !== 'no_action')).toBe(true);
    expect(queue.actionableCount).toBe(6);
  });

  it('orders by severity rank ascending (critical first)', () => {
    const queue = buildExecutiveActionQueue(ALL_TRIGGERS);
    const ranks = queue.actions.map((a) => a.severityRank);
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
    // value_leakage (critical, rank 0) is first.
    expect(queue.actions[0]?.trigger).toBe('value_leakage');
    expect(queue.actions[0]?.severityRank).toBe(SEVERITY_RANK.critical);
  });

  it('is stable: the same input yields a byte-identical order across calls', () => {
    const a = buildExecutiveActionQueue(ALL_TRIGGERS);
    const b = buildExecutiveActionQueue(ALL_TRIGGERS);
    expect(a.actions.map((x) => x.id)).toEqual(b.actions.map((x) => x.id));
  });

  it('is order-independent: shuffled input yields the same ranked order', () => {
    const forward = buildExecutiveActionQueue(ALL_TRIGGERS);
    const reversed = buildExecutiveActionQueue([...ALL_TRIGGERS].reverse());
    expect(reversed.actions.map((x) => x.id)).toEqual(
      forward.actions.map((x) => x.id),
    );
  });

  it('breaks severity ties by entryId ascending', () => {
    // Two dependency_blocker entries (same severity + trigger) sort by id.
    const e2 = makeEntry({ id: 'value-seed-dep-b', readiness: 'projected_only', baselineValue: null });
    const e1 = makeEntry({ id: 'value-seed-dep-a', readiness: 'projected_only', baselineValue: null });
    const queue = buildExecutiveActionQueue([e2, e1]);
    expect(queue.actions.map((a) => a.entryId)).toEqual([
      'value-seed-dep-a',
      'value-seed-dep-b',
    ]);
  });

  it('ranks all six trigger types in a single deterministic queue', () => {
    const queue = buildExecutiveActionQueue(ALL_TRIGGERS);
    // Within a severity tier, ties break by trigger order in
    // EXECUTIVE_ACTION_TRIGGERS: open_renewal_review precedes
    // sponsor_intervention; escalate_dependency precedes drive_adoption.
    expect(queue.actions.map((a) => a.trigger)).toEqual([
      'value_leakage', // critical
      'open_renewal_review', // high
      'sponsor_intervention', // high
      'drive_adoption', // elevated
      'escalate_dependency', // elevated
      'verify_value_claim', // watch
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Queue summary fields
// ─────────────────────────────────────────────────────────────────────────────

describe('buildExecutiveActionQueue — summary', () => {
  it('counts critical actions and per-trigger buckets', () => {
    const queue = buildExecutiveActionQueue([
      VALUE_LEAKAGE,
      SPONSOR_GAP,
      NO_ACTION,
    ]);
    expect(queue.criticalCount).toBe(1);
    expect(queue.byTrigger.value_leakage).toBe(1);
    expect(queue.byTrigger.sponsor_intervention).toBe(1);
    expect(queue.byTrigger.no_action).toBe(1);
  });

  it('byTrigger exposes every trigger key (zero allowed)', () => {
    const queue = buildExecutiveActionQueue([NO_ACTION]);
    for (const trigger of EXECUTIVE_ACTION_TRIGGERS) {
      expect(queue.byTrigger).toHaveProperty(trigger);
    }
  });

  it('produces an empty queue with an earning-as-projected headline', () => {
    const queue = buildExecutiveActionQueue([NO_ACTION]);
    expect(queue.actions).toHaveLength(0);
    expect(queue.actionableCount).toBe(0);
    expect(queue.headline.toLowerCase()).toContain('no executive action');
  });

  it('headline reflects the count and critical flag', () => {
    const queue = buildExecutiveActionQueue([VALUE_LEAKAGE, SPONSOR_GAP]);
    expect(queue.headline).toContain('2 interventions');
    expect(queue.headline).toContain('1 critical');
  });

  it('always carries the deterministic-seed marker', () => {
    expect(buildExecutiveActionQueue([]).deterministicSeed).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Canonical ledger seed
// ─────────────────────────────────────────────────────────────────────────────

describe('buildExecutiveActionQueue — canonical ledger seed', () => {
  it('builds a non-empty, deterministically ordered queue from the seed', () => {
    const a = buildExecutiveActionQueue();
    const b = buildExecutiveActionQueue();
    expect(a.actions.length).toBeGreaterThan(0);
    expect(a.actions.map((x) => x.id)).toEqual(b.actions.map((x) => x.id));
    const ranks = a.actions.map((x) => x.severityRank);
    expect([...ranks].sort((x, y) => x - y)).toEqual(ranks);
  });

  it('every queue action id is unique', () => {
    const queue = buildExecutiveActionQueue();
    const ids = queue.actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
