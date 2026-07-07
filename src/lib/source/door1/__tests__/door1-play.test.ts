// Door 1 — the play decision + Door-2 rebid handoff + insufficient-evidence honesty.

import { AMS_MANAGED_SERVICES } from '../../archetypes/registry';
import { runSourceOptimization } from '../index';
import type { Door1FactMap } from '../types';

const EVENT_ID = 'evt-play-fixture';
const cite = (doc: string, locator: string) => ({ doc, locator });

/** A large, non-structural gap on a modest run-cost basis → rebid. */
function rebidFacts(): Door1FactMap {
  return {
    // Small run-cost anchor so the recoverable gap is a LARGE share of it.
    annual_run_cost: { factKey: 'annual_run_cost', value: 3_000_000, unit: 'usd_per_year', citation: cite('baseline', 'run cost') },
    projected_volume_decline_pct: { factKey: 'projected_volume_decline_pct', value: 30, unit: 'pct', citation: cite('inv', 'decline') },
    variable_cost_share_pct: { factKey: 'variable_cost_share_pct', value: 70, unit: 'pct', citation: cite('vendor', 'variable') },
    automatable_effort_pool: { factKey: 'automatable_effort_pool', value: 3_000_000, unit: 'usd_per_year', citation: cite('should-cost', 'pool') },
    committed_credit_pct: { factKey: 'committed_credit_pct', value: 20, unit: 'pct', citation: cite('vendor', 'credit') },
    term_years: { factKey: 'term_years', value: 3, unit: 'count', citation: cite('vendor', 'term') },
  };
}

describe('Door 1 · play + rebid handoff', () => {
  it('recommends a rebid and emits a Door-2 handoff carrying the value thesis', () => {
    const opt = runSourceOptimization({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts: rebidFacts(),
    });

    expect(opt.play.kind).toBe('rebid');
    const handoff = opt.play.handoff;
    expect(handoff).not.toBeNull();
    expect(handoff!.escalate).toBe(true);
    expect(handoff!.archetypeId).toBe(AMS_MANAGED_SERVICES.id);
    expect(handoff!.sourceEventId).toBe(EVENT_ID);
    expect(handoff!.entryStage).toBe('strategy');
    // The value thesis is the recoverable range from the bridge.
    expect(handoff!.valueThesisLow).toBe(opt.bridge.recoverableLow);
    expect(handoff!.valueThesisHigh).toBe(opt.bridge.recoverableHigh);
    expect(handoff!.reason.length).toBeGreaterThan(0);
  });

  it('does NOT emit a handoff when the play is not a rebid', () => {
    // A tiny, well-evidenced gap on a huge run-cost basis → renegotiate.
    const facts: Door1FactMap = {
      annual_run_cost: { factKey: 'annual_run_cost', value: 50_000_000, unit: 'usd_per_year', citation: cite('baseline', 'run cost') },
      annual_change_order_spend: { factKey: 'annual_change_order_spend', value: 200_000, unit: 'usd_per_year', citation: cite('contract', 'co log') },
      recurring_avoidable_pct: { factKey: 'recurring_avoidable_pct', value: 30, unit: 'pct', citation: cite('tickets', 'recurring') },
      term_years: { factKey: 'term_years', value: 2, unit: 'count', citation: cite('vendor', 'term') },
    };
    const opt = runSourceOptimization({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts,
    });
    expect(opt.play.kind).not.toBe('rebid');
    expect(opt.play.handoff).toBeNull();
  });

  it('renders insufficient_evidence — never a guess — when a required fact is missing', () => {
    // change-order spend present but recurring_avoidable_pct (citationRequired) absent.
    const facts: Door1FactMap = {
      annual_change_order_spend: { factKey: 'annual_change_order_spend', value: 1_000_000, unit: 'usd_per_year', citation: cite('contract', 'co log') },
      term_years: { factKey: 'term_years', value: 3, unit: 'count', citation: cite('vendor', 'term') },
    };
    const opt = runSourceOptimization({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts,
    });

    // No computed findings; the enhancement-leakage lever needs evidence.
    expect(opt.diagnosis.findings).toHaveLength(0);
    const enhancement = opt.diagnosis.needsEvidence.find(
      (f) => f.ruleKey === 'AMS.ENHANCEMENT_LEAKAGE',
    );
    expect(enhancement).toBeDefined();
    expect(enhancement!.status).toBe('insufficient_evidence');
    expect(enhancement!.low).toBeNull();
    expect(enhancement!.missingFactKeys).toContain('recurring_avoidable_pct');
    expect(opt.diagnosis.unlockFactKeys).toContain('recurring_avoidable_pct');

    // With nothing recoverable, the bridge is empty and the play is renegotiate.
    expect(opt.bridge.recoverableHigh).toBe(0);
    expect(opt.play.kind).toBe('renegotiate');
    expect(opt.play.handoff).toBeNull();
  });

  it('only runs leakage levers (not competitive-only value types)', () => {
    const opt = runSourceOptimization({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts: rebidFacts(),
    });
    // Every finding + needs-evidence entry maps to a Door-1 recovery bucket.
    for (const f of [...opt.diagnosis.findings, ...opt.diagnosis.needsEvidence]) {
      expect(['protected', 'risk_adjusted', 'incremental']).toContain(
        f.recoveryBucket,
      );
    }
  });
});
