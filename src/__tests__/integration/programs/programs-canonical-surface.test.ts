// S9 · Programs canonical index/detail proof tests.
//
// Pure deterministic coverage of the canonical view-model layer the
// canonical components consume. No React rendering, no DOM, no model
// calls. Tests assert that:
// - Six canonical phases and four canonical hard gates are represented
//   exactly once in the contract.
// - Spec-phase → canonical-phase mapping is 1↔1 across the 5 spec
//   phases the seed exposes.
// - Portfolio summarization counts are stable across the four canonical
//   demo tenants.
// - Per-program summarization includes a canonical phase mapping and
//   deterministic deliverable tier counts.
// - Deterministic prose helpers do not crash on edge inputs.
// - The canonical view module does not import legacy /programs / mock
//   modules (verified by inspecting the module's import graph).

import {
  CANONICAL_FOUR_GATES,
  CANONICAL_SIX_PHASES,
  HONEST_FALLBACK_LABELS,
  buildPortfolioGuidance,
  buildProgramEditorial,
  countDeliverableTiers,
  mapSpecPhaseToCanonicalIndex,
  statusForCanonicalPhase,
  summarizePortfolio,
  summarizeProgram,
} from '@/lib/programs/programs-canonical-view';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Constants and structural invariants
// ---------------------------------------------------------------------

describe('Canonical six phases', () => {
  it('lists the six canonical phases in order', () => {
    expect(CANONICAL_SIX_PHASES).toHaveLength(6);
    expect(CANONICAL_SIX_PHASES.map((p) => p.key)).toEqual([
      'origination',
      'charter',
      'diagnose',
      'design',
      'execute',
      'verify',
    ]);
    expect(CANONICAL_SIX_PHASES.map((p) => p.index)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('every phase has a non-empty label and summary', () => {
    for (const phase of CANONICAL_SIX_PHASES) {
      expect(phase.label.length).toBeGreaterThan(0);
      expect(phase.summary.length).toBeGreaterThan(0);
    }
  });
});

describe('Canonical four hard gates', () => {
  it('lists the four canonical gates in order', () => {
    expect(CANONICAL_FOUR_GATES).toHaveLength(4);
    expect(CANONICAL_FOUR_GATES.map((g) => g.index)).toEqual([1, 2, 3, 4]);
    expect(CANONICAL_FOUR_GATES.map((g) => g.exitsPhase)).toEqual([
      'charter',
      'diagnose',
      'design',
      'verify',
    ]);
  });

  it('every gate label names the canonical exit phase concept', () => {
    expect(CANONICAL_FOUR_GATES[0].label).toMatch(/Charter signed/i);
    expect(CANONICAL_FOUR_GATES[1].label).toMatch(/CXO interview/i);
    expect(CANONICAL_FOUR_GATES[2].label).toMatch(/Design approved/i);
    expect(CANONICAL_FOUR_GATES[3].label).toMatch(/CXO verification/i);
  });
});

// ---------------------------------------------------------------------
// Phase mapping
// ---------------------------------------------------------------------

describe('mapSpecPhaseToCanonicalIndex', () => {
  it('maps spec 1..5 to canonical 2..6 (Origination is pre-seed)', () => {
    expect(mapSpecPhaseToCanonicalIndex(1)).toBe(2);
    expect(mapSpecPhaseToCanonicalIndex(2)).toBe(3);
    expect(mapSpecPhaseToCanonicalIndex(3)).toBe(4);
    expect(mapSpecPhaseToCanonicalIndex(4)).toBe(5);
    expect(mapSpecPhaseToCanonicalIndex(5)).toBe(6);
  });
});

describe('statusForCanonicalPhase', () => {
  const program: Pick<ProgramSeedPlan, 'currentPhaseSpec'> = { currentPhaseSpec: 3 };

  it('marks Origination as pre-seed regardless of program state', () => {
    expect(statusForCanonicalPhase(program, 1)).toBe('origination_pre_seed');
  });

  it('marks phases before the current canonical phase as complete', () => {
    expect(statusForCanonicalPhase(program, 2)).toBe('complete');
    expect(statusForCanonicalPhase(program, 3)).toBe('complete');
  });

  it('marks the program’s current canonical phase as active', () => {
    // spec=3 → canonical=4 (Design)
    expect(statusForCanonicalPhase(program, 4)).toBe('active');
  });

  it('marks phases after the current canonical phase as pending', () => {
    expect(statusForCanonicalPhase(program, 5)).toBe('pending');
    expect(statusForCanonicalPhase(program, 6)).toBe('pending');
  });
});

// ---------------------------------------------------------------------
// Deliverable tier counting
// ---------------------------------------------------------------------

describe('countDeliverableTiers', () => {
  it('returns zeros for an empty list', () => {
    expect(countDeliverableTiers([])).toEqual({ rich: 0, outline: 0, stub: 0, total: 0 });
  });

  it('counts each tier with a stable total', () => {
    const tiers = countDeliverableTiers([
      // @ts-expect-error fixture only needs renderTier
      { renderTier: 'rich' },
      // @ts-expect-error fixture only needs renderTier
      { renderTier: 'rich' },
      // @ts-expect-error fixture only needs renderTier
      { renderTier: 'outline' },
      // @ts-expect-error fixture only needs renderTier
      { renderTier: 'stub' },
    ]);
    expect(tiers).toEqual({ rich: 2, outline: 1, stub: 1, total: 4 });
  });
});

// ---------------------------------------------------------------------
// Per-tenant summarization across the four canonical demo tenants
// ---------------------------------------------------------------------

describe('summarizePortfolio · canonical demo tenants', () => {
  const plan = buildAllProgramsSeedPlan();
  const TENANT_KEYS = ['apexretail', 'meridian', 'arcturus', 'keystone'] as const;

  it.each(TENANT_KEYS)(
    'produces a deterministic summary for %s',
    (tenantKey) => {
      const tenant = plan.tenants.find((t) => t.tenantKey === tenantKey);
      expect(tenant).toBeDefined();
      const a = summarizePortfolio(tenant!);
      const b = summarizePortfolio(tenant!);
      expect(a).toEqual(b);
      expect(a.programCount).toBe(tenant!.programs.length);
      expect(a.programCount).toBeGreaterThan(0);
      // counts sum back to programCount
      const totalByPhase = Object.values(a.programsByCanonicalPhase).reduce(
        (sum, n) => sum + n,
        0,
      );
      expect(totalByPhase).toBe(a.programCount);
    },
  );

  it('every recommendation references a real program slug for the tenant', () => {
    for (const tenant of plan.tenants) {
      const summary = summarizePortfolio(tenant);
      if (summary.programCount > 0) {
        expect(summary.recommendedFirstProgramSlug).not.toBeNull();
        const slugs = new Set(tenant.programs.map((p) => p.programSlug));
        expect(slugs.has(summary.recommendedFirstProgramSlug!)).toBe(true);
      } else {
        expect(summary.recommendedFirstProgramSlug).toBeNull();
      }
    }
  });

  it('returns null recommendation for an empty portfolio', () => {
    const empty: TenantSeedPlan = {
      tenantKey: 'apexretail',
      routeSlug: 'apex-retail',
      displayName: 'Apex Retail',
      programs: [],
    };
    const summary = summarizePortfolio(empty);
    expect(summary.programCount).toBe(0);
    expect(summary.recommendedFirstProgramSlug).toBeNull();
  });
});

// ---------------------------------------------------------------------
// Per-program summarization
// ---------------------------------------------------------------------

describe('summarizeProgram', () => {
  const plan = buildAllProgramsSeedPlan();

  it('produces a canonical phase view for every seeded program', () => {
    for (const program of plan.programs) {
      const view = summarizeProgram(program);
      expect(view.code).toBe(program.code);
      expect(view.name).toBe(program.name);
      expect(view.currentPhaseSpec).toBe(program.currentPhaseSpec);
      expect(view.currentCanonicalPhase.index).toBe(
        mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec),
      );
      expect(view.deliverableTiers.total).toBe(program.deliverables.length);
    }
  });
});

// ---------------------------------------------------------------------
// Editorial helpers
// ---------------------------------------------------------------------

describe('buildPortfolioGuidance', () => {
  const plan = buildAllProgramsSeedPlan();

  it('produces deterministic prose across the canonical tenants', () => {
    for (const tenant of plan.tenants) {
      const summary = summarizePortfolio(tenant);
      const a = buildPortfolioGuidance(tenant, summary);
      const b = buildPortfolioGuidance(tenant, summary);
      expect(a).toBe(b);
      expect(a.length).toBeGreaterThan(20);
      expect(a).toContain(tenant.displayName);
    }
  });

  it('returns an onboarding line for an empty portfolio', () => {
    const empty: TenantSeedPlan = {
      tenantKey: 'apexretail',
      routeSlug: 'apex-retail',
      displayName: 'Apex Retail',
      programs: [],
    };
    const summary = summarizePortfolio(empty);
    const prose = buildPortfolioGuidance(empty, summary);
    expect(prose).toMatch(/no seeded programs/i);
  });
});

describe('buildProgramEditorial', () => {
  const plan = buildAllProgramsSeedPlan();

  it('names the canonical phase and program code', () => {
    for (const program of plan.programs.slice(0, 4)) {
      const view = summarizeProgram(program);
      const prose = buildProgramEditorial(view);
      expect(prose).toContain(program.code);
      expect(prose).toContain(view.currentCanonicalPhase.label);
    }
  });

  it('handles programs with zero deliverables (informational only)', () => {
    const view = summarizeProgram({
      ...plan.programs[0],
      deliverables: [],
    });
    const prose = buildProgramEditorial(view);
    expect(prose).toMatch(/No deliverables seeded yet\./i);
  });
});

// ---------------------------------------------------------------------
// Honest fallback labels
// ---------------------------------------------------------------------

describe('Honest fallback labels', () => {
  it('exposes labels for unseeded data surfaces', () => {
    expect(HONEST_FALLBACK_LABELS.gateState).toMatch(/not yet wired/i);
    expect(HONEST_FALLBACK_LABELS.valueAtStake).toMatch(/Projected value/i);
    expect(HONEST_FALLBACK_LABELS.riskRegister).toMatch(/Risk register/i);
    expect(HONEST_FALLBACK_LABELS.decisionsPending).toMatch(/Decisions/i);
    expect(HONEST_FALLBACK_LABELS.origination).toMatch(/Origination/i);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · canonical view should not import legacy/mock paths
// ---------------------------------------------------------------------

describe('Canonical view module hygiene', () => {
  it('does not import src/lib/programs/mock.ts or legacy /programs surfaces', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const sources = [
      path.resolve(__dirname, '../../../lib/programs/programs-canonical-view.ts'),
      path.resolve(__dirname, '../../../components/programs/ProgramsCanonicalIndex.tsx'),
      path.resolve(__dirname, '../../../components/programs/ProgramCanonicalDetail.tsx'),
    ];
    for (const src of sources) {
      const content = fs.readFileSync(src, 'utf8');
      expect(content).not.toMatch(/from '@\/lib\/programs\/mock'/);
      expect(content).not.toMatch(/from '@\/app\/programs\//);
      expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/preview\//);
      expect(content).not.toMatch(/from '@\/app\/demo\//);
      expect(content).not.toMatch(/from '@\/lib\/nexus\//);
      expect(content).not.toMatch(/from '@\/lib\/agent\//);
    }
  });
});
