import {
  captureField,
  emptyDiscoveryShape,
  emptyDiscoveryPlan,
  shapeCompleteness,
  shapeGateReady,
  planFromShape,
  planGateReady,
  emitDiscoveryHandoff,
  dimensionsForShape,
  DEFAULT_MATURITY_DIMENSIONS,
  POINT_USE_CASE_DIMENSIONS,
  type DiscoveryShape,
  type DiscoveryPlan,
} from '../discovery-intake';

function meridianShape(): DiscoveryShape {
  const s = emptyDiscoveryShape();
  s.problem = captureField(s.problem, 'Population-health risk stratification', 'chat');
  s.foundationIntent = captureField(s.foundationIntent, 'first_of_kind', 'chat');
  s.archetype = captureField(s.archetype, 'Healthcare data-platform modernization', 'chat', { confidence: 'high' });
  s.engagementMode = captureField(s.engagementMode, 'full_strategy', 'chat');
  s.dataDomains = captureField(s.dataDomains, ['Epic Clarity', 'ERP', 'UKG Pro', 'Claims'], 'chat');
  s.sponsor = captureField(s.sponsor, 'Dr. A. Okafor, CMIO', 'chat');
  s.valueHypothesis = captureField(s.valueHypothesis, '↓ avoidable admissions', 'chat', { confidence: 'medium' });
  s.known = ['Health system on Epic', 'industry = healthcare'];
  s.openUnknowns = ['Governance maturity', 'ERP/UKG volumetrics'];
  return s;
}

describe('captureField — provenance & review semantics', () => {
  it('chat/context capture is confirmed; upload is review_pending', () => {
    const chat = captureField(undefined, 'x', 'chat');
    expect(chat.review).toBe('confirmed');
    const ctx = captureField(undefined, 'x', 'context');
    expect(ctx.review).toBe('confirmed');
    const up = captureField(undefined, 'x', 'upload', { provenance: 'file.xlsx' });
    expect(up.review).toBe('review_pending');
    expect(up.provenance).toBe('file.xlsx');
  });

  it('a confirmed upload is blessed; sources accumulate and dedupe', () => {
    let f = captureField(undefined, 'a', 'upload');
    expect(f.review).toBe('review_pending');
    f = captureField(f, 'a', 'chat', { confirmed: true });
    expect(f.review).toBe('confirmed');
    f = captureField(f, 'a', 'chat');
    expect(f.sources.sort()).toEqual(['chat', 'upload']);
  });
});

describe('shape completeness & P0→P1 gate', () => {
  it('counts captured fields and pending reviews', () => {
    const s = meridianShape();
    s.landscape = captureField(s.landscape, [], 'upload'); // review pending
    const c = shapeCompleteness(s);
    expect(c.total).toBe(8);
    expect(c.captured).toBeGreaterThanOrEqual(7);
    expect(c.pendingReview).toBe(1);
  });

  it('gate needs problem + value hypothesis + sponsor', () => {
    expect(shapeGateReady(meridianShape())).toBe(true);
    const missingSponsor = meridianShape();
    missingSponsor.sponsor = emptyDiscoveryShape().sponsor;
    expect(shapeGateReady(missingSponsor)).toBe(false);
  });
});

describe('planFromShape — seeds the matrix from domains', () => {
  it('creates a domain × dimension cell grid and one target per dimension', () => {
    const plan = planFromShape(meridianShape());
    expect(plan.domainsXDimensions).toHaveLength(4 * DEFAULT_MATURITY_DIMENSIONS.length);
    expect(plan.maturityTargets).toHaveLength(DEFAULT_MATURITY_DIMENSIONS.length);
    expect(plan.domainsXDimensions.every((c) => c.inScope)).toBe(true);
  });
});

describe('dimensionsForShape — discovery breadth flexes by use case', () => {
  function narrowShape(): DiscoveryShape {
    const s = meridianShape();
    s.engagementMode = captureField(s.engagementMode, 'point_use_case', 'chat');
    s.foundationIntent = captureField(s.foundationIntent, 'rides_existing', 'chat');
    return s;
  }

  it('full strategy → the full (broad) dimension set', () => {
    expect(dimensionsForShape(meridianShape())).toEqual(DEFAULT_MATURITY_DIMENSIONS);
  });

  it('first-of-kind (foundation build) → broad, even for a point use case', () => {
    const s = narrowShape();
    s.foundationIntent = captureField(s.foundationIntent, 'first_of_kind', 'chat');
    expect(dimensionsForShape(s)).toEqual(DEFAULT_MATURITY_DIMENSIONS);
  });

  it('point use case riding an existing foundation → the narrower core', () => {
    expect(dimensionsForShape(narrowShape())).toEqual(POINT_USE_CASE_DIMENSIONS);
    expect(POINT_USE_CASE_DIMENSIONS.length).toBeLessThan(DEFAULT_MATURITY_DIMENSIONS.length);
  });

  it('planFromShape uses the use-case-scoped breadth by default', () => {
    const narrow = planFromShape(narrowShape());
    expect(narrow.maturityTargets).toHaveLength(POINT_USE_CASE_DIMENSIONS.length);
    expect(narrow.domainsXDimensions).toHaveLength(4 * POINT_USE_CASE_DIMENSIONS.length);

    const broad = planFromShape(meridianShape());
    expect(broad.maturityTargets.length).toBeGreaterThan(narrow.maturityTargets.length);
  });
});

describe('plan P1→P2 gate', () => {
  function readyPlan(): DiscoveryPlan {
    const p = emptyDiscoveryPlan();
    p.foundationCommitment = captureField(p.foundationCommitment, 'accepted', 'chat');
    p.successMetric = captureField(p.successMetric, 'Avoidable admission rate', 'chat');
    return p;
  }
  it('needs a foundation decision (not pending) + a success metric', () => {
    expect(planGateReady(readyPlan())).toBe(true);
    const pending = readyPlan();
    pending.foundationCommitment = captureField(pending.foundationCommitment, 'pending', 'chat');
    expect(planGateReady(pending)).toBe(false);
    const noMetric = readyPlan();
    noMetric.successMetric = emptyDiscoveryPlan().successMetric;
    expect(planGateReady(noMetric)).toBe(false);
  });
});

describe('emitDiscoveryHandoff — the chain guard', () => {
  it('freezes the handoff only when both gates pass', () => {
    const shape = meridianShape();
    const plan = planFromShape(shape);
    plan.foundationCommitment = captureField(plan.foundationCommitment, 'accepted', 'chat');
    plan.successMetric = captureField(plan.successMetric, 'Avoidable admission rate', 'chat');
    const h = emitDiscoveryHandoff(shape, plan);
    expect(h.shape).toBe(shape);
    expect(h.plan).toBe(plan);
  });

  it('refuses to emit a half-formed plan (gate not ready)', () => {
    const shape = meridianShape();
    const plan = planFromShape(shape); // no foundation decision / metric
    expect(() => emitDiscoveryHandoff(shape, plan)).toThrow(/plan gate not ready/);
  });

  it('refuses to emit when the shape gate is not ready', () => {
    const shape = emptyDiscoveryShape(); // nothing captured
    const plan = emptyDiscoveryPlan();
    plan.foundationCommitment = captureField(plan.foundationCommitment, 'accepted', 'chat');
    plan.successMetric = captureField(plan.successMetric, 'm', 'chat');
    expect(() => emitDiscoveryHandoff(shape, plan)).toThrow(/shape gate not ready/);
  });
});
