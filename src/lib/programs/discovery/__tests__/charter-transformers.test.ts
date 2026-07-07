import { emptyDiscoveryShape, emptyDiscoveryPlan, captureField } from '../discovery-intake';
import {
  embedDiscoveryShapeInCharter,
  embedDiscoveryPlanInCharter,
  readDiscoveryShapeFromCharter,
  readDiscoveryPlanFromCharter,
  readDiscoveryDataFromCharter,
  applyDiscoveryShapeIfEnabled,
} from '../charter-transformers';

describe('charter-transformers — embed/read discovery in the charter JSONB', () => {
  it('embeds the shape and preserves existing charter keys', () => {
    const charter = { version: 1, scaffold: { problem_statement: 'x' }, classification: {} };
    const shape = emptyDiscoveryShape();
    const out = embedDiscoveryShapeInCharter(charter, shape);
    expect(out.discovery_shape).toBe(shape);
    expect(out.scaffold).toBeDefined();
    expect(out.classification).toBeDefined();
    expect(out.version).toBe(1);
  });

  it('leaves the charter untouched for a null shape', () => {
    const charter = { version: 1 };
    const out = embedDiscoveryShapeInCharter(charter, null);
    expect(out.discovery_shape).toBeUndefined();
    expect(out).toBe(charter); // same reference — no-op
  });

  it('embeds the plan, creating a base when the charter is null', () => {
    const plan = emptyDiscoveryPlan();
    const out = embedDiscoveryPlanInCharter(null, plan);
    expect(out.discovery_plan).toBe(plan);
  });

  it('embeds the plan into an existing charter, preserving the shape', () => {
    const shape = emptyDiscoveryShape();
    const c1 = embedDiscoveryShapeInCharter({ version: 1 }, shape);
    const plan = emptyDiscoveryPlan();
    const c2 = embedDiscoveryPlanInCharter(c1, plan);
    expect(c2.discovery_shape).toBe(shape);
    expect(c2.discovery_plan).toBe(plan);
  });

  it('reads shape/plan back and is null-safe for legacy / malformed charters', () => {
    const shape = emptyDiscoveryShape();
    const plan = emptyDiscoveryPlan();
    let c = embedDiscoveryShapeInCharter({ version: 1 }, shape);
    c = embedDiscoveryPlanInCharter(c, plan);
    expect(readDiscoveryShapeFromCharter(c)).toBe(shape);
    expect(readDiscoveryPlanFromCharter(c)).toBe(plan);
    const data = readDiscoveryDataFromCharter(c);
    expect(data.shape).toBe(shape);
    expect(data.plan).toBe(plan);

    expect(readDiscoveryShapeFromCharter(null)).toBeNull();
    expect(readDiscoveryShapeFromCharter({})).toBeNull();
    expect(readDiscoveryShapeFromCharter({ discovery_shape: 'oops' })).toBeNull();
    expect(readDiscoveryPlanFromCharter({ discovery_plan: [1, 2] })).toBeNull();
    expect(readDiscoveryDataFromCharter(null)).toEqual({ shape: null, plan: null });
  });

  it('round-trips a captured value through the charter', () => {
    const shape = emptyDiscoveryShape();
    shape.problem = captureField(shape.problem, 'reduce avoidable admissions', 'chat');
    const c = embedDiscoveryShapeInCharter({}, shape);
    const back = readDiscoveryShapeFromCharter(c);
    expect(back?.problem.value).toBe('reduce avoidable admissions');
    expect(back?.problem.review).toBe('confirmed');
  });
});

describe('applyDiscoveryShapeIfEnabled — the P0 flag gate (S2b)', () => {
  const shape = emptyDiscoveryShape();

  it('embeds when the flag is on and a shape is present', () => {
    const out = applyDiscoveryShapeIfEnabled({ version: 1 }, shape, true);
    expect(out.discovery_shape).toBe(shape);
  });

  it('is a no-op (same reference) when the flag is off', () => {
    const c = { version: 1 };
    expect(applyDiscoveryShapeIfEnabled(c, shape, false)).toBe(c);
  });

  it('is a no-op when no shape was captured, even with the flag on', () => {
    const c = { version: 1 };
    expect(applyDiscoveryShapeIfEnabled(c, null, true)).toBe(c);
    expect(applyDiscoveryShapeIfEnabled(c, undefined, true)).toBe(c);
  });
});
