// Door 1 — the diagnose → bridge → play flow, on a facts fixture.
//
// Exercises the deterministic engine end-to-end against the real AMS archetype
// value-lever rules: a facts map → leakage diagnosis (classified + cited) → value
// bridge (recoverable range, protected reported separately) → play (renegotiate /
// restructure / rebid) with the Door-2 handoff.

import { AMS_MANAGED_SERVICES } from '../../archetypes/registry';
import {
  buildValueBridge,
  diagnoseLeakage,
  recommendPlay,
  runSourceOptimization,
} from '../index';
import type { Door1FactMap } from '../types';

const EVENT_ID = 'evt-door1-fixture';

/**
 * A fully-cited facts fixture that fires every AMS leakage lever. Values are chosen
 * so the recoverable gap is LARGE relative to run cost (drives a rebid) and mostly
 * NON-structural (pricing/productivity dominate over scope/SLA/retained).
 */
function richFacts(): Door1FactMap {
  const cite = (doc: string, locator: string) => ({ doc, locator });
  return {
    // Volume-band pricing (incremental) — the dominant lever.
    annual_run_cost: { factKey: 'annual_run_cost', value: 10_000_000, unit: 'usd_per_year', citation: cite('run-cost-baseline.xlsx', 'Tower rollup') },
    projected_volume_decline_pct: { factKey: 'projected_volume_decline_pct', value: 20, unit: 'pct', citation: cite('inventory', 'volume trend') },
    variable_cost_share_pct: { factKey: 'variable_cost_share_pct', value: 60, unit: 'pct', citation: cite('vendor-proposal.pdf', 'pricing schedule') },
    // Productivity credits (solution_tightening → incremental).
    automatable_effort_pool: { factKey: 'automatable_effort_pool', value: 4_000_000, unit: 'usd_per_year', citation: cite('should-cost', 'automatable pool') },
    committed_credit_pct: { factKey: 'committed_credit_pct', value: 15, unit: 'pct', citation: cite('vendor-proposal.pdf', 'credit schedule') },
    // Change-order leakage (protected).
    annual_change_order_spend: { factKey: 'annual_change_order_spend', value: 1_400_000, unit: 'usd_per_year', citation: cite('contract.pdf', 'change-order log') },
    recurring_avoidable_pct: { factKey: 'recurring_avoidable_pct', value: 50, unit: 'pct', citation: cite('ticket-export.csv', 'recurring class') },
    // SLA economics (protected).
    at_risk_fee_pool: { factKey: 'at_risk_fee_pool', value: 2_000_000, unit: 'usd_per_year', citation: cite('vendor-proposal.pdf', 'SLA schedule') },
    credit_cap_pct: { factKey: 'credit_cap_pct', value: 10, unit: 'pct', citation: cite('vendor-proposal.pdf', 'credit cap') },
    chronic_miss_rate: { factKey: 'chronic_miss_rate', value: 8, unit: 'pct', citation: cite('incident-record', 'miss rate') },
    // Retained cost (risk_adjusted).
    retained_fte_delta: { factKey: 'retained_fte_delta', value: 4, unit: 'fte', citation: cite('vendor-proposal.pdf', 'retained org') },
    loaded_fte_cost: { factKey: 'loaded_fte_cost', value: 180_000, unit: 'usd_per_year', citation: cite('inventory', 'loaded cost') },
    // Transition risk (risk_adjusted).
    transition_fee: { factKey: 'transition_fee', value: 800_000, unit: 'usd', citation: cite('vendor-proposal.pdf', 'transition fee') },
    overrun_probability: { factKey: 'overrun_probability', value: 30, unit: 'pct', citation: cite('benchmark', 'overrun band') },
    overrun_cost_multiple: { factKey: 'overrun_cost_multiple', value: 0.5, unit: 'ratio', citation: cite('benchmark', 'overrun cost') },
    // Term multiplier.
    term_years: { factKey: 'term_years', value: 3, unit: 'count', citation: cite('vendor-proposal.pdf', 'term') },
  };
}

describe('Door 1 · diagnose → bridge → play', () => {
  it('diagnoses every leakage lever with a cited, banded finding', () => {
    const diagnosis = diagnoseLeakage({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts: richFacts(),
    });

    // All six AMS leakage levers fire and compute.
    expect(diagnosis.findings).toHaveLength(6);
    expect(diagnosis.needsEvidence).toHaveLength(0);
    expect(diagnosis.unlockFactKeys).toHaveLength(0);

    // Every finding is a banded, cited, classified result.
    for (const f of diagnosis.findings) {
      expect(f.status).toBe('computed');
      expect(f.low).not.toBeNull();
      expect(f.high).not.toBeNull();
      expect(f.high!).toBeGreaterThanOrEqual(f.low!);
      expect(f.citations.length).toBeGreaterThan(0);
      expect(['protected', 'risk_adjusted', 'incremental']).toContain(
        f.recoveryBucket,
      );
    }

    // Findings are sorted by high value descending.
    const highs = diagnosis.findings.map((f) => f.high!);
    expect([...highs].sort((a, b) => b - a)).toEqual(highs);
  });

  it('rolls findings into a value bridge that excludes protected from recoverable', () => {
    const diagnosis = diagnoseLeakage({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts: richFacts(),
    });
    const bridge = buildValueBridge(diagnosis);

    // Recoverable range is a positive band.
    expect(bridge.recoverableHigh).toBeGreaterThan(bridge.recoverableLow);
    expect(bridge.recoverableLow).toBeGreaterThan(0);

    // Protected value is reported separately and NOT folded into recoverable.
    expect(bridge.protectedHigh).toBeGreaterThan(0);
    const bandTotalHigh = bridge.bands.reduce((a, b) => a + b.high, 0);
    expect(bandTotalHigh).toBeCloseTo(
      bridge.recoverableHigh + bridge.protectedHigh,
      -1,
    );

    // A protected band exists and its rule keys are the SLA + change-order levers.
    const protectedBand = bridge.bands.find((b) => b.bucket === 'protected');
    expect(protectedBand).toBeDefined();
    expect(protectedBand!.contributingRuleKeys).toEqual(
      expect.arrayContaining(['AMS.ENHANCEMENT_LEAKAGE', 'AMS.SLA_ECONOMICS']),
    );
  });

  it('recommends a play with evidence-backed asks derived from the archetype', () => {
    const facts = richFacts();
    const diagnosis = diagnoseLeakage({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts,
    });
    const bridge = buildValueBridge(diagnosis);
    const play = recommendPlay({
      archetype: AMS_MANAGED_SERVICES,
      diagnosis,
      bridge,
      facts,
    });

    expect(['renegotiate', 'restructure', 'rebid']).toContain(play.kind);
    // One ask per computed finding, each with a non-empty ask string from bafoAsk.
    expect(play.asks).toHaveLength(diagnosis.findings.length);
    for (const ask of play.asks) {
      expect(ask.ask.length).toBeGreaterThan(0);
      expect(ask.high).toBeGreaterThanOrEqual(ask.low);
    }
  });

  it('is deterministic — same inputs, same optimization', () => {
    const a = runSourceOptimization({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts: richFacts(),
    });
    const b = runSourceOptimization({
      eventId: EVENT_ID,
      archetype: AMS_MANAGED_SERVICES,
      facts: richFacts(),
    });
    expect(a).toEqual(b);
  });
});
