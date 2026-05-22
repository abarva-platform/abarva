// Move→Source hand-off adapter — behaviour tests.
//
// `runMoveToSourceHandoff` derives a minimal mobilization plan from a
// `StrategicMove` view-model, runs the Slice 2.6 trigger, and projects the
// recommendation onto a Source-event-creation payload that carries the
// Move↔event linkage. These tests drive it from hand-built Move fixtures.

import {
  deriveMobilizationPlanFromMove,
  runMoveToSourceHandoff,
} from '../move-to-source-handoff';
import type { StrategicMove } from '@/lib/programs/types.ui';

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  return {
    id: 'move-1234',
    displayCode: 'APX-M-014',
    name: 'Contact Center AI Routing',
    tenant: { id: 't1', name: 'Apex Retail Group', industryCode: 'RETAIL' },
    archetype: 'ai_product_enablement',
    currentPhase: 3,
    phaseLabel: 'P3 Design',
    status: { key: 'on_track', text: 'On track', description: 'P3 design in progress' },
    statusColor: 'green',
    sponsor: { id: 's1', name: 'Carlos Rivera', role: 'Chief Information Officer' },
    participants: [
      { personId: 'p1', name: 'Lynne Stratham', role: 'data_sponsor' },
      { personId: 'p2', name: 'David Okafor', role: 'lead' },
    ],
    valueAtStake: {
      projected: { low: 1800000, high: 3200000, currency: 'USD' },
      verified: null,
      assumptions: null,
    },
    deliverables: [
      {
        id: 'd1',
        typeKey: 'solution_design',
        title: 'P3 Solution Design',
        status: 'draft',
        updatedAt: null,
        preview: '',
        url: '#',
      },
      {
        id: 'd2',
        typeKey: 'sourcing_strategy',
        title: 'Sourcing Strategy',
        status: 'draft',
        updatedAt: null,
        preview: '',
        url: '#',
      },
    ],
    gateCriteria: [
      {
        id: 'design_approved',
        label: 'Architecture review',
        completed: false,
        severity: 'hard',
        verified: true,
      },
    ],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: 'P3',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-05-10T00:00:00Z',
    ...overrides,
  };
}

describe('deriveMobilizationPlanFromMove', () => {
  it('projects the Move name, squad, and backlog onto a plan', () => {
    const plan = deriveMobilizationPlanFromMove(makeMove());
    expect(plan.proposedMove).toBe('Contact Center AI Routing');
    expect(plan.squad.filter((r) => r.accountable)).toHaveLength(1);
    // The sourcing_strategy deliverable is excluded from the backlog.
    expect(plan.backlog.map((e) => e.title)).toEqual(['P3 Solution Design']);
  });

  it('leans buy for a product-shaped archetype', () => {
    const plan = deriveMobilizationPlanFromMove(makeMove());
    expect(plan.deliveryLean).toBe('buy');
  });

  it('leans build for an in-house archetype', () => {
    const plan = deriveMobilizationPlanFromMove(makeMove({ archetype: 'automation' }));
    expect(plan.deliveryLean).toBe('build');
  });
});

describe('runMoveToSourceHandoff', () => {
  it('produces a seed payload for a sourcing-required Move', () => {
    const { trigger, seed } = runMoveToSourceHandoff(makeMove());
    expect(trigger.disposition).toBe('sourcing_required');
    expect(seed).not.toBeNull();
    // The Move↔event linkage is carried.
    expect(seed!.linkedProgramId).toBe('move-1234');
    expect(seed!.eventType).toBe('software');
    expect(seed!.eventName).toContain('Contact Center AI Routing');
    expect(seed!.decisionOwner).toBe('Carlos Rivera');
    // The estimated value is the midpoint of the projected band.
    expect(seed!.estimatedValueUsd).toBe(2500000);
    expect(seed!.scopeDescription).toContain('External lane scope');
  });

  it('returns no seed for a build-in-house Move', () => {
    const { trigger, seed } = runMoveToSourceHandoff(
      makeMove({ archetype: 'automation' }),
    );
    expect(trigger.disposition).toBe('build_in_house');
    expect(seed).toBeNull();
  });

  it('omits estimated value when the Move has no projected band', () => {
    const move = makeMove();
    move.valueAtStake = { projected: null, verified: null, assumptions: null };
    const { seed } = runMoveToSourceHandoff(move);
    expect(seed!.estimatedValueUsd).toBeUndefined();
  });

  it('is deterministic — same Move yields the same seed', () => {
    const a = runMoveToSourceHandoff(makeMove());
    const b = runMoveToSourceHandoff(makeMove());
    expect(a.seed).toEqual(b.seed);
  });
});
