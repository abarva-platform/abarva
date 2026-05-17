// Slice 1.6 — Tests for the Source-to-Move handoff builder.

import { buildSourceToMoveHandoff } from '../source-to-move-handoff';
import {
  APEX_AMS_ADVERSE_HANDOFF_INPUT,
  APEX_AMS_NO_BASELINE_HANDOFF_INPUT,
  APEX_AMS_NOT_READY_HANDOFF_INPUT,
  APEX_AMS_READY_HANDOFF_INPUT,
} from '../source-to-move-handoff-fixtures';

const ready = buildSourceToMoveHandoff(APEX_AMS_READY_HANDOFF_INPUT);
const adverse = buildSourceToMoveHandoff(APEX_AMS_ADVERSE_HANDOFF_INPUT);
const notReady = buildSourceToMoveHandoff(APEX_AMS_NOT_READY_HANDOFF_INPUT);
const noBaseline = buildSourceToMoveHandoff(APEX_AMS_NO_BASELINE_HANDOFF_INPUT);

// ── Shape ────────────────────────────────────────────────────────────────────

describe('source-to-move handoff — shape', () => {
  it('echoes the event and Move ids that link the two records', () => {
    expect(ready.eventId).toBe(APEX_AMS_READY_HANDOFF_INPUT.eventId);
    expect(ready.targetMoveId).toBe(APEX_AMS_READY_HANDOFF_INPUT.targetMoveId);
  });

  it('stamps a fixed handoff version', () => {
    expect(ready.handoffVersion).toBe('source-to-move-handoff/v1');
  });

  it('defaults the timestamp to keep the builder pure', () => {
    expect(adverse.handedOffAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('honours an explicit handoff timestamp when supplied', () => {
    expect(ready.handedOffAt).toBe('2026-02-01T00:00:00.000Z');
  });

  it('is a pure function — identical inputs yield identical output', () => {
    const again = buildSourceToMoveHandoff(APEX_AMS_READY_HANDOFF_INPUT);
    expect(again).toEqual(ready);
  });
});

// ── Sourcing recommendation ───────────────────────────────────────────────────

describe('source-to-move handoff — sourcing recommendation', () => {
  it('carries the recommended delivery model from the gate', () => {
    expect(ready.recommendedDeliveryModel).toBe(
      APEX_AMS_READY_HANDOFF_INPUT.deliveryModelGate.recommendedModel,
    );
  });

  it('plans cost against the should-cost midpoint, not the vendor quote', () => {
    expect(ready.plannedCostUsd).toBe(
      APEX_AMS_READY_HANDOFF_INPUT.shouldCost.totalPoint,
    );
    expect(ready.plannedCostUsd).not.toBe(
      APEX_AMS_READY_HANDOFF_INPUT.shouldCost.vendorQuotedCost,
    );
  });

  it('states a one-line recommendation naming the model and economics', () => {
    expect(ready.sourcingRecommendation).toContain(
      APEX_AMS_READY_HANDOFF_INPUT.deliveryModelGate.recommendedModelLabel,
    );
    expect(ready.sourcingRecommendation).toMatch(/should-cost/i);
  });
});

// ── Readiness ─────────────────────────────────────────────────────────────────

describe('source-to-move handoff — readiness', () => {
  it('reports ready when the delivery-model gate is cleared', () => {
    expect(ready.readiness).toBe('ready');
  });

  it('reports not_ready when the gate is blocked on evidence', () => {
    expect(notReady.readiness).toBe('not_ready');
  });

  it('tells a not-ready Move not to mobilize', () => {
    expect(notReady.receivingMoveGuidance).toMatch(/do not mobilize/i);
  });
});

// ── Deltas ────────────────────────────────────────────────────────────────────

describe('source-to-move handoff — deltas', () => {
  it('produces no deltas when no Move baseline is supplied', () => {
    expect(noBaseline.deltas).toHaveLength(0);
  });

  it('confirms the delivery model when the charter assumption matches', () => {
    const modelDelta = ready.deltas.find((d) => d.dimension === 'delivery_model');
    expect(modelDelta?.direction).toBe('favorable');
  });

  it('flags an adverse delta when the chartered delivery model differs', () => {
    const modelDelta = adverse.deltas.find(
      (d) => d.dimension === 'delivery_model',
    );
    expect(modelDelta?.direction).toBe('adverse');
    expect(modelDelta?.baseline).toContain('build');
  });

  it('flags an adverse cost delta with the USD swing when over budget', () => {
    const costDelta = adverse.deltas.find((d) => d.dimension === 'cost');
    expect(costDelta?.direction).toBe('adverse');
    expect(costDelta?.deltaUsd).not.toBeNull();
    expect(costDelta?.deltaUsd as number).toBeGreaterThan(0);
  });

  it('reports favorable budget headroom when should-cost is within budget', () => {
    const costDelta = ready.deltas.find((d) => d.dimension === 'cost');
    expect(costDelta?.direction).toBe('favorable');
    expect(costDelta?.deltaUsd as number).toBeLessThan(0);
  });

  it('flags an adverse incumbent delta when retention is unsupported', () => {
    const incDelta = adverse.deltas.find((d) => d.dimension === 'incumbent');
    expect(incDelta?.direction).toBe('adverse');
  });

  it('surfaces high-severity commercial risk as an adverse risk delta', () => {
    const riskDelta = adverse.deltas.find((d) => d.dimension === 'risk');
    expect(riskDelta).toBeDefined();
    expect(riskDelta?.direction).toBe('adverse');
  });

  it('guides an off-charter Move to rebaseline before kickoff', () => {
    expect(adverse.receivingMoveGuidance).toMatch(/caution/i);
  });
});

// ── Mobilization assumptions ──────────────────────────────────────────────────

describe('source-to-move handoff — mobilization assumptions', () => {
  it('produces assumptions even with no Move baseline', () => {
    expect(noBaseline.mobilizationAssumptions.length).toBeGreaterThan(0);
  });

  it('assigns each mobilization assumption a unique id', () => {
    const ids = ready.mobilizationAssumptions.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inherits a delivery-model mobilization assumption from the gate', () => {
    const fromGate = ready.mobilizationAssumptions.find(
      (m) => m.source === 'delivery_model_gate',
    );
    expect(fromGate).toBeDefined();
  });

  it('inherits a should-cost-based funding assumption', () => {
    const fromCost = ready.mobilizationAssumptions.find(
      (m) => m.source === 'should_cost',
    );
    expect(fromCost?.assumption).toMatch(/should-cost/i);
  });

  it('frames the Move under the sourcing category and buying motion', () => {
    const fromClass = ready.mobilizationAssumptions.find(
      (m) => m.source === 'classification',
    );
    expect(fromClass).toBeDefined();
  });
});

// ── Carried open items ────────────────────────────────────────────────────────

describe('source-to-move handoff — carried open items', () => {
  it('carries no open items when the gate cleared cleanly', () => {
    expect(ready.carriedOpenItems).toHaveLength(0);
  });

  it('carries the gate open questions forward when the gate is blocked', () => {
    expect(notReady.carriedOpenItems.length).toBe(
      APEX_AMS_NOT_READY_HANDOFF_INPUT.deliveryModelGate.openQuestions.length,
    );
  });

  it('assigns each carried open item a unique id', () => {
    const ids = notReady.carriedOpenItems.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
