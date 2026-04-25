// S9f · Tower Programs pressure cards data tests.
//
// Pure deterministic coverage of the Tower-side view helper that
// consumes the S9e read model. No React rendering, no DOM, no model
// calls. The component itself is covered by typecheck + build.
//
// Tests assert that:
// - The view can be built for every canonical demo tenant.
// - View output is deterministic across calls.
// - topSeverity is stable.
// - routeHref on every card resolves to the canonical tenant program
//   detail route.
// - No card claims evidence/value as ready while the seed lacks them.
// - No card invents a dollar amount.
// - The view helper does NOT re-derive signals; it imports the S9e
//   read model exclusively (asserted by static source inspection).
// - The Tower component does not import Atlas runtime, Source UI,
//   Nexus runtime, agent runtime, legacy /programs, mock.ts, auth, or
//   migrations.

import {
  buildTowerProgramPressureView,
  TOWER_PROGRAM_PRESSURE_DEFAULT_TOP_N,
  type TowerProgramPressureView,
} from '@/lib/tower/program-pressure-view';
import {
  buildTenantProgramControlTowerSignals,
  summarizeProgramControlTowerSignals,
  type ProgramPressureSeverity,
} from '@/lib/programs/programs-control-tower-signals';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

const ALL_SEVERITIES: ProgramPressureSeverity[] = ['low', 'medium', 'high', 'critical'];

// ---------------------------------------------------------------------
// Per-tenant view generation
// ---------------------------------------------------------------------

describe('buildTowerProgramPressureView · canonical demo tenants', () => {
  it.each(plan.tenants.map((t) => [t.tenantKey, t]))(
    'builds a deterministic view for %s',
    (_key, tenantParam) => {
      const tenant = tenantParam as TenantSeedPlan;
      if (tenant.programs.length === 0) return;
      const a = buildTowerProgramPressureView(tenant);
      const b = buildTowerProgramPressureView(tenant);
      expect(a).toEqual(b);
      expect(a.tenant).toBe(tenant);
      expect(a.signals.length).toBeGreaterThan(0);
    },
  );

  it('topCards length is bounded by topN and signals.length', () => {
    for (const tenant of plan.tenants) {
      const view = buildTowerProgramPressureView(tenant, 3);
      expect(view.topCards.length).toBeLessThanOrEqual(3);
      expect(view.topCards.length).toBeLessThanOrEqual(view.signals.length);
    }
  });

  it('honors a custom topN', () => {
    const tenant = plan.tenants[0];
    const view = buildTowerProgramPressureView(tenant, 1);
    expect(view.topCards.length).toBeLessThanOrEqual(1);
  });

  it('default topN matches the published constant', () => {
    expect(TOWER_PROGRAM_PRESSURE_DEFAULT_TOP_N).toBe(5);
  });

  it('summary fields reconcile to the underlying signal list', () => {
    for (const tenant of plan.tenants) {
      const view = buildTowerProgramPressureView(tenant);
      const expectedSummary = summarizeProgramControlTowerSignals(
        buildTenantProgramControlTowerSignals(tenant),
      );
      expect(view.summary).toEqual(expectedSummary);
    }
  });
});

// ---------------------------------------------------------------------
// Strip
// ---------------------------------------------------------------------

describe('TowerProgramPressureView.strip', () => {
  const tenant = plan.tenants.find((t) => t.tenantKey === 'apexretail')!;

  it('reports total signals, top severity, programs affected, and evidence/value gap count', () => {
    const view = buildTowerProgramPressureView(tenant);
    expect(view.strip.totalSignals).toBe(String(view.signals.length));
    if (view.summary.topSeverity === null) {
      expect(view.strip.topSeverity).toBe('NONE');
    } else {
      expect(view.strip.topSeverity).toBe(view.summary.topSeverity.toUpperCase());
    }
    expect(view.strip.programsAffected).toBe(
      String(view.summary.affectedProgramCodes.length),
    );
    expect(view.strip.evidenceValueGaps).toBe(
      String(view.evidenceValueGapCount),
    );
  });

  it('top severity is one of the canonical four when signals exist', () => {
    for (const tenant of plan.tenants) {
      const view = buildTowerProgramPressureView(tenant);
      if (view.signals.length > 0) {
        expect(view.summary.topSeverity).not.toBeNull();
        expect(ALL_SEVERITIES).toContain(view.summary.topSeverity!);
      }
    }
  });

  it('top severity is stable across repeated calls', () => {
    const tenants = plan.tenants;
    for (const tenant of tenants) {
      const a = buildTowerProgramPressureView(tenant);
      const b = buildTowerProgramPressureView(tenant);
      expect(a.summary.topSeverity).toBe(b.summary.topSeverity);
    }
  });
});

// ---------------------------------------------------------------------
// Card-level invariants
// ---------------------------------------------------------------------

describe('TowerProgramPressureView.topCards · per-card invariants', () => {
  const tenants = plan.tenants;

  it('every card routeHref points back to the canonical tenant program detail route', () => {
    for (const tenant of tenants) {
      const view = buildTowerProgramPressureView(tenant);
      for (const card of view.topCards) {
        const program = tenant.programs.find((p) => p.code === card.programCode);
        expect(program).toBeDefined();
        const expected = `/tenant/${tenant.routeSlug}/programs/${program!.programSlug}`;
        expect(card.routeHref).toBe(expected);
      }
    }
  });

  it('no card claims evidence or value as ready while seed lacks them', () => {
    for (const tenant of tenants) {
      const view = buildTowerProgramPressureView(tenant);
      for (const card of view.topCards) {
        expect(card.evidenceStatus).not.toBe('ready');
        expect(card.valueStatus).not.toBe('ready');
      }
    }
  });

  it('no card invents a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const tenant of tenants) {
      const view = buildTowerProgramPressureView(tenant);
      for (const card of view.topCards) {
        expect(card.title).not.toMatch(dollarPattern);
        expect(card.summary).not.toMatch(dollarPattern);
        expect(card.recommendedAction).not.toMatch(dollarPattern);
        for (const m of card.missingInputs) {
          expect(m).not.toMatch(dollarPattern);
        }
      }
    }
  });

  it('each card carries the deterministic_seed marker', () => {
    for (const tenant of tenants) {
      const view = buildTowerProgramPressureView(tenant);
      for (const card of view.topCards) {
        expect(card.createdFrom).toBe('deterministic_seed');
      }
    }
  });

  it('cards are sorted severity-desc relative to each other', () => {
    const rank: Record<ProgramPressureSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    for (const tenant of tenants) {
      const view = buildTowerProgramPressureView(tenant);
      for (let i = 1; i < view.topCards.length; i += 1) {
        expect(rank[view.topCards[i - 1].severity]).toBeGreaterThanOrEqual(
          rank[view.topCards[i].severity],
        );
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('S9f module hygiene', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  it('the helper consumes the S9e read model and does not re-derive signals', () => {
    const src = path.resolve(__dirname, '../../../lib/tower/program-pressure-view.ts');
    const content = fs.readFileSync(src, 'utf8');
    expect(content).toMatch(
      /from '@\/lib\/programs\/programs-control-tower-signals'/,
    );
    // Forbidden: re-deriving from the canonical view module directly.
    expect(content).not.toMatch(/programs-canonical-view/);
    expect(content).not.toMatch(/programs-nexus-rail-view/);
  });

  it('the Tower component does not import Atlas, Source UI, Nexus runtime, agent runtime, or legacy /programs', () => {
    const src = path.resolve(__dirname, '../../../components/tower/ProgramPressureCards.tsx');
    const content = fs.readFileSync(src, 'utf8');
    expect(content).not.toMatch(/from '@\/lib\/atlas\//);
    expect(content).not.toMatch(/from '@\/lib\/nexus\//);
    expect(content).not.toMatch(/from '@\/lib\/agent\//);
    expect(content).not.toMatch(/from '@\/components\/agent\//);
    expect(content).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(content).not.toMatch(/from '@\/app\/programs\//);
    expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/preview\//);
    expect(content).not.toMatch(/from '@\/app\/demo\//);
    expect(content).not.toMatch(/from '@\/lib\/source\//);
    expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(content).not.toMatch(/from '@\/lib\/auth\//);
    // Affirmatively verify it consumes the S9e read model via the helper.
    expect(content).toMatch(/from '@\/lib\/tower\/program-pressure-view'/);
  });
});

// ---------------------------------------------------------------------
// Empty-tenant edge
// ---------------------------------------------------------------------

describe('Empty-tenant edge', () => {
  it('returns zero signals and topSeverity null for an empty portfolio', () => {
    const empty: TenantSeedPlan = {
      tenantKey: 'apexretail',
      routeSlug: 'apex-retail',
      displayName: 'Apex Retail',
      programs: [],
    };
    const view = buildTowerProgramPressureView(empty);
    expect(view.signals).toHaveLength(0);
    expect(view.topCards).toHaveLength(0);
    expect(view.summary.totalCount).toBe(0);
    expect(view.summary.topSeverity).toBeNull();
    expect(view.strip.totalSignals).toBe('0');
    expect(view.strip.topSeverity).toBe('NONE');
    expect(view.strip.programsAffected).toBe('0');
    expect(view.strip.evidenceValueGaps).toBe('0');
  });
});

// ---------------------------------------------------------------------
// Type completeness sanity
// ---------------------------------------------------------------------

describe('TowerProgramPressureView shape', () => {
  it('every required field is present and typed', () => {
    const tenant = plan.tenants[0];
    const view: TowerProgramPressureView = buildTowerProgramPressureView(tenant);
    expect(view.tenant).toBe(tenant);
    expect(Array.isArray(view.signals)).toBe(true);
    expect(Array.isArray(view.topCards)).toBe(true);
    expect(typeof view.evidenceValueGapCount).toBe('number');
    expect(view.summary).toBeDefined();
    expect(view.strip).toBeDefined();
  });
});
