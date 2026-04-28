// S9d · Program deliverables + evidence + value readiness summary tests.
//
// Pure deterministic coverage of buildProgramReadinessSummary. No React
// rendering, no DOM, no model/API calls. Tests assert that:
// - Deliverable counts by tier and by requirement reconcile to total.
// - Required-but-stub gaps are deterministic and stable across calls.
// - Evidence + value signals are honestly reported as not_seeded with
//   prose reasons and named expected signals.
// - Value readiness names the canonical hard gates G3 + G4.
// - The view module file does not import legacy /programs, mock.ts,
//   preview, demo, Source UI, Nexus runtime, or auth.

import {
  buildProgramReadinessSummary,
  type ReadinessSignal,
} from '@/lib/programs/programs-canonical-view';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

function pickFixture(): { tenant: TenantSeedPlan; program: ProgramSeedPlan } {
  const tenant = plan.tenants.find((t) => t.tenantKey === 'apexretail');
  if (!tenant || tenant.programs.length === 0) {
    throw new Error('apexretail seed missing required programs');
  }
  return { tenant, program: tenant.programs[0] };
}

const ALL_READINESS_SIGNALS: ReadinessSignal[] = [
  'ready',
  'partial',
  'not_started',
  'not_seeded',
];

// =====================================================================
// Deliverable totals + per-requirement counts
// =====================================================================

describe('buildProgramReadinessSummary · deliverable totals', () => {
  const { program } = pickFixture();

  it('total deliverable count matches the seed', () => {
    const summary = buildProgramReadinessSummary(program);
    expect(summary.deliverableTiers.total).toBe(program.deliverables.length);
  });

  it('rich + outline + stub equals total in the deliverableTiers bucket', () => {
    const summary = buildProgramReadinessSummary(program);
    const sum = summary.deliverableTiers.rich
      + summary.deliverableTiers.outline
      + summary.deliverableTiers.stub;
    expect(sum).toBe(summary.deliverableTiers.total);
  });

  it('per-requirement totals reconcile to the seed', () => {
    for (const program of plan.programs) {
      const summary = buildProgramReadinessSummary(program);
      const expectedRequired = program.deliverables.filter((d) => d.requirement === 'required').length;
      const expectedOptional = program.deliverables.filter((d) => d.requirement === 'optional').length;
      const expectedAdditional = program.deliverables.filter((d) => d.requirement === 'additional').length;
      expect(summary.byRequirement.required.total).toBe(expectedRequired);
      expect(summary.byRequirement.optional.total).toBe(expectedOptional);
      expect(summary.byRequirement.additional.total).toBe(expectedAdditional);
      expect(
        summary.byRequirement.required.total
          + summary.byRequirement.optional.total
          + summary.byRequirement.additional.total,
      ).toBe(program.deliverables.length);
    }
  });

  it('per-requirement rich+outline+stub also reconciles per bucket', () => {
    const summary = buildProgramReadinessSummary(program);
    for (const bucket of [
      summary.byRequirement.required,
      summary.byRequirement.optional,
      summary.byRequirement.additional,
    ]) {
      expect(bucket.rich + bucket.outline + bucket.stub).toBe(bucket.total);
    }
  });
});

// =====================================================================
// Required-but-stub gaps
// =====================================================================

describe('buildProgramReadinessSummary · required-but-stub gaps', () => {
  const { program } = pickFixture();

  it('lists every required-but-stub deliverable in the seed', () => {
    const summary = buildProgramReadinessSummary(program);
    const expected = program.deliverables.filter(
      (d) => d.requirement === 'required' && d.renderTier === 'stub',
    );
    expect(summary.requiredStubGaps).toHaveLength(expected.length);
    const expectedCodes = expected.map((d) => d.deliverableCode).sort();
    const actualCodes = summary.requiredStubGaps.map((g) => g.deliverableCode).sort();
    expect(actualCodes).toEqual(expectedCodes);
  });

  it('orders gaps deterministically by phaseSpec then deliverableCode', () => {
    for (const program of plan.programs) {
      const summary = buildProgramReadinessSummary(program);
      const gaps = summary.requiredStubGaps;
      for (let i = 1; i < gaps.length; i += 1) {
        const prev = gaps[i - 1];
        const curr = gaps[i];
        if (prev.phaseSpec === curr.phaseSpec) {
          expect(prev.deliverableCode.localeCompare(curr.deliverableCode)).toBeLessThanOrEqual(0);
        } else {
          expect(prev.phaseSpec).toBeLessThanOrEqual(curr.phaseSpec);
        }
      }
    }
  });

  it('every gap entry carries a routePath that resolves to the deliverable seed route', () => {
    const summary = buildProgramReadinessSummary(program);
    for (const gap of summary.requiredStubGaps) {
      expect(typeof gap.routePath).toBe('string');
      expect(gap.routePath.length).toBeGreaterThan(0);
      expect(gap.routePath).toContain('/programs/');
    }
  });
});

// =====================================================================
// Evidence + value signals
// =====================================================================

describe('buildProgramReadinessSummary · evidence + value signals', () => {
  const { program } = pickFixture();

  it('evidence signal is honestly not_seeded with a reason', () => {
    const summary = buildProgramReadinessSummary(program);
    expect(summary.evidence.signal).toBe('not_seeded');
    expect(ALL_READINESS_SIGNALS).toContain(summary.evidence.signal);
    expect(summary.evidence.reason.toLowerCase()).toContain('seed');
    expect(summary.evidence.expectedSignals.length).toBeGreaterThanOrEqual(2);
  });

  it('value signal is honestly not_seeded with a reason', () => {
    const summary = buildProgramReadinessSummary(program);
    expect(summary.value.signal).toBe('not_seeded');
    expect(summary.value.reason.toLowerCase()).toContain('seed');
    expect(summary.value.expectedSignals.length).toBeGreaterThanOrEqual(2);
  });

  it('value readiness names the canonical hard gates G3 and G4', () => {
    const summary = buildProgramReadinessSummary(program);
    const indices = summary.value.governingGates.map((g) => g.gateIndex).sort();
    expect(indices).toEqual([3, 4]);
    expect(summary.value.governingGates[0].label).toMatch(/Design approved/i);
    expect(summary.value.governingGates[1].label).toMatch(/CXO verification/i);
  });

  it('never claims ready while seed lacks evidence/value capture', () => {
    for (const program of plan.programs) {
      const summary = buildProgramReadinessSummary(program);
      expect(summary.evidence.signal).not.toBe('ready');
      expect(summary.value.signal).not.toBe('ready');
    }
  });
});

// =====================================================================
// Determinism
// =====================================================================

describe('buildProgramReadinessSummary · determinism', () => {
  const { program } = pickFixture();

  it('produces identical results across repeated calls', () => {
    const a = buildProgramReadinessSummary(program);
    const b = buildProgramReadinessSummary(program);
    expect(a).toEqual(b);
  });

  it('is deterministic across all four canonical demo tenants', () => {
    for (const tenant of plan.tenants) {
      if (tenant.programs.length === 0) continue;
      const program = tenant.programs[0];
      const a = buildProgramReadinessSummary(program);
      const b = buildProgramReadinessSummary(program);
      expect(a).toEqual(b);
    }
  });
});

// =====================================================================
// Empty-deliverables edge case
// =====================================================================

describe('buildProgramReadinessSummary · empty deliverables', () => {
  const { program } = pickFixture();

  it('handles a program with zero deliverables without fabricating data', () => {
    const programWithoutDeliverables: ProgramSeedPlan = {
      ...program,
      deliverables: [],
    };
    const summary = buildProgramReadinessSummary(programWithoutDeliverables);
    expect(summary.deliverableTiers.total).toBe(0);
    expect(summary.byRequirement.required.total).toBe(0);
    expect(summary.byRequirement.optional.total).toBe(0);
    expect(summary.byRequirement.additional.total).toBe(0);
    expect(summary.requiredStubGaps).toHaveLength(0);
    expect(summary.evidence.signal).toBe('not_seeded');
    expect(summary.value.signal).toBe('not_seeded');
    expect(summary.summary.toLowerCase()).toContain('no deliverables seeded');
  });
});

// =====================================================================
// Module hygiene
// =====================================================================

describe('S9d module hygiene', () => {
  it('does not import legacy /programs, mock.ts, preview, demo, Source UI, Nexus runtime, or auth', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const sources = [
      path.resolve(__dirname, '../../../lib/programs/programs-canonical-view.ts'),
      path.resolve(__dirname, '../../../components/programs/ProgramCanonicalDetail.tsx'),
    ];
    for (const src of sources) {
      const content = fs.readFileSync(src, 'utf8');
      expect(content).not.toMatch(/from '@\/lib\/programs\/mock'/);
      expect(content).not.toMatch(/from '@\/app\/programs\//);
      expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/preview\//);
      expect(content).not.toMatch(/from '@\/app\/demo\//);
      expect(content).not.toMatch(/from '@\/lib\/source\//);
      expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
      expect(content).not.toMatch(/from '@\/lib\/nexus\//);
      expect(content).not.toMatch(/from '@\/lib\/auth\//);
    }
  });
});
