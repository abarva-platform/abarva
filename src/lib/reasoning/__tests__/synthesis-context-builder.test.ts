/**
 * Synthesis context builder tests — REASON-14
 *
 * Deterministic: no network, no LLM calls, no randomness.
 * Uses AMS_VENDOR_CONSOLIDATION_2026_INSTANCE + PAT_SRC_AMS_001 as fixtures.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import {
  buildSourceSynthesisContext,
  instanceStateHash,
} from '@/lib/reasoning/synthesis-context-builder';

// ── buildSourceSynthesisContext ───────────────────────────────────────────────

describe('buildSourceSynthesisContext', () => {
  const ctx = buildSourceSynthesisContext(
    AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
    PAT_SRC_AMS_001,
  );

  it('returns instanceType source-event', () => {
    expect(ctx.instanceType).toBe('source-event');
  });

  it('returns patternId PAT-SRC-AMS-001', () => {
    expect(ctx.patternId).toBe('PAT-SRC-AMS-001');
  });

  it('gatesSummary.total is greater than 0', () => {
    expect(ctx.gatesSummary.total).toBeGreaterThan(0);
  });

  it('cascadeContext has at least one entry', () => {
    expect(ctx.cascadeContext.length).toBeGreaterThan(0);
  });

  it('instanceSnapshot.name equals the AMS instance name', () => {
    expect(ctx.instanceSnapshot['name']).toBe(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.name);
  });

  it('currentStage matches instance currentStage', () => {
    expect(ctx.currentStage).toBe(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.currentStage);
  });

  it('instanceId matches instance id', () => {
    expect(ctx.instanceId).toBe(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id);
  });

  it('builtAt is a recent timestamp', () => {
    expect(ctx.builtAt).toBeGreaterThan(0);
    expect(ctx.builtAt).toBeLessThanOrEqual(Date.now());
  });
});

// ── instanceStateHash ─────────────────────────────────────────────────────────

describe('instanceStateHash', () => {
  it('returns a non-empty string', () => {
    const hash = instanceStateHash(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('is deterministic — same instance produces the same hash', () => {
    const h1 = instanceStateHash(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const h2 = instanceStateHash(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    expect(h1).toBe(h2);
  });

  it('changes when currentStage changes', () => {
    const original = instanceStateHash(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const modified = instanceStateHash({
      ...AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
      currentStage: 'Selection',
    });
    expect(modified).not.toBe(original);
  });
});
