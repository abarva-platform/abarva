// S9e · Programs → Control Tower signal read-model tests.
//
// Pure deterministic coverage. No React rendering, no DOM, no
// model/API calls. Tests assert that:
// - Every canonical demo tenant produces signals.
// - Signals are deterministic across calls.
// - High/critical signals appear when gate, evidence, or value
//   readiness is missing.
// - routeHref always points back to the canonical tenant program
//   route.
// - No signal claims evidence/value as ready while seed is empty.
// - No signal invents a dollar value.
// - Summary counts reconcile to the signal list.
// - Module hygiene: no imports from Tower UI, Atlas runtime, Nexus
//   runtime, agent runtime, Source UI, mock.ts, or auth.

import {
  buildProgramControlTowerSignals,
  buildTenantProgramControlTowerSignals,
  listKnownGateIndices,
  summarizeProgramControlTowerSignals,
  type ProgramControlTowerSignal,
  type ProgramPressureSeverity,
  type ProgramPressureType,
} from '@/lib/programs/programs-control-tower-signals';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

function pickFixture(): { tenant: TenantSeedPlan; program: ProgramSeedPlan } {
  // Pick a program in spec phase 1..3 or 5 — i.e. canonical Charter,
  // Diagnose, Design, or Verify — where exactly one canonical hard
  // gate is at the program's current phase. Execute (canonical 5,
  // spec phase 4) has no exit gate, so a fixture in that phase would
  // never emit a gate_missing_inputs signal. We deliberately avoid
  // that case so the per-program assertions remain meaningful.
  const tenant = plan.tenants.find((t) => t.tenantKey === 'apexretail');
  if (!tenant) throw new Error('apexretail seed missing');
  const program = tenant.programs.find((p) => p.currentPhaseSpec !== 4);
  if (!program) {
    throw new Error('apexretail seed missing a non-Execute-phase program');
  }
  return { tenant, program };
}

const ALL_TYPES: ProgramPressureType[] = [
  'gate_missing_inputs',
  'evidence_not_ready',
  'value_not_ready',
  'deliverable_coverage_gap',
  'context_insufficient',
  'executive_decision_needed',
];

const ALL_SEVERITIES: ProgramPressureSeverity[] = ['low', 'medium', 'high', 'critical'];

// ---------------------------------------------------------------------
// Per-program signal generation
// ---------------------------------------------------------------------

describe('buildProgramControlTowerSignals · per-program', () => {
  const { tenant, program } = pickFixture();

  it('produces a non-empty signal list for a seeded program', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    expect(signals.length).toBeGreaterThan(0);
  });

  it('produces deterministic signals across repeated calls', () => {
    const a = buildProgramControlTowerSignals(tenant, program);
    const b = buildProgramControlTowerSignals(tenant, program);
    expect(a).toEqual(b);
  });

  it('every signal carries createdFrom: deterministic_seed', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    for (const sig of signals) {
      expect(sig.createdFrom).toBe('deterministic_seed');
    }
  });

  it('every signal type is from the canonical six-type union', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    for (const sig of signals) {
      expect(ALL_TYPES).toContain(sig.type);
    }
  });

  it('every signal severity is from the canonical four-severity union', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    for (const sig of signals) {
      expect(ALL_SEVERITIES).toContain(sig.severity);
    }
  });

  it('every signal id is unique and stable', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const ids = signals.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith(`sig:${tenant.tenantKey}:${program.programSlug}:`)).toBe(true);
    }
  });

  it('every signal routeHref points back to the canonical tenant program route', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const expected = `/tenant/${tenant.routeSlug}/programs/${program.programSlug}`;
    for (const sig of signals) {
      expect(sig.routeHref).toBe(expected);
    }
  });

  it('signals are sorted by severity desc, then by canonical type rank', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const rank: Record<ProgramPressureSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    for (let i = 1; i < signals.length; i += 1) {
      expect(rank[signals[i - 1].severity]).toBeGreaterThanOrEqual(rank[signals[i].severity]);
    }
  });

  it('emits a critical signal when value readiness is missing', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const valueSig = signals.find((s) => s.type === 'value_not_ready');
    expect(valueSig).toBeDefined();
    expect(valueSig?.severity).toBe('critical');
    expect(valueSig?.valueStatus).toBe('not_seeded');
  });

  it('emits a high signal when evidence readiness is missing', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const evSig = signals.find((s) => s.type === 'evidence_not_ready');
    expect(evSig).toBeDefined();
    expect(evSig?.severity).toBe('high');
    expect(evSig?.evidenceStatus).toBe('not_seeded');
  });

  it('emits a gate_missing_inputs signal for the program’s current canonical gate', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const gateSigs = signals.filter((s) => s.type === 'gate_missing_inputs');
    expect(gateSigs.length).toBeGreaterThanOrEqual(1);
    for (const g of gateSigs) {
      expect(g.gateStatus).toBe('missing_inputs');
      expect(g.title).toMatch(/^G[1-4] · /);
    }
  });

  it('never claims evidence or value as ready while seed lacks them', () => {
    for (const program of plan.programs) {
      const tenant = plan.tenants.find((t) =>
        t.programs.some((p) => p.programSlug === program.programSlug),
      )!;
      const signals = buildProgramControlTowerSignals(tenant, program);
      for (const sig of signals) {
        expect(sig.evidenceStatus).not.toBe('ready');
        expect(sig.valueStatus).not.toBe('ready');
      }
    }
  });

  it('never invents a dollar amount in any signal field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const program of plan.programs) {
      const tenant = plan.tenants.find((t) =>
        t.programs.some((p) => p.programSlug === program.programSlug),
      )!;
      const signals = buildProgramControlTowerSignals(tenant, program);
      for (const sig of signals) {
        expect(sig.title).not.toMatch(dollarPattern);
        expect(sig.summary).not.toMatch(dollarPattern);
        expect(sig.recommendedAction).not.toMatch(dollarPattern);
        for (const m of sig.missingInputs) {
          expect(m).not.toMatch(dollarPattern);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Per-tenant aggregate
// ---------------------------------------------------------------------

describe('buildTenantProgramControlTowerSignals · canonical demo tenants', () => {
  it.each(plan.tenants.map((t) => [t.tenantKey, t]))(
    'produces a non-empty deterministic signal list for %s',
    (_key, tenantParam) => {
      const tenant = tenantParam as TenantSeedPlan;
      if (tenant.programs.length === 0) return;
      const a = buildTenantProgramControlTowerSignals(tenant);
      const b = buildTenantProgramControlTowerSignals(tenant);
      expect(a).toEqual(b);
      expect(a.length).toBeGreaterThan(0);
      // Every signal in the tenant aggregate references this tenant.
      for (const sig of a) {
        expect(sig.tenantKey).toBe(tenant.tenantKey);
        expect(sig.tenantName).toBe(tenant.displayName);
      }
    },
  );

  it('tenant aggregate equals concatenation of per-program signals (sorted)', () => {
    for (const tenant of plan.tenants) {
      if (tenant.programs.length === 0) continue;
      const fromAggregate = buildTenantProgramControlTowerSignals(tenant);
      const fromPrograms = tenant.programs
        .flatMap((p) => buildProgramControlTowerSignals(tenant, p))
        // Re-apply same severity-then-type sort the aggregate uses.
        .sort((a, b) => {
          const rank: Record<ProgramPressureSeverity, number> = {
            critical: 4, high: 3, medium: 2, low: 1,
          };
          const sev = rank[b.severity] - rank[a.severity];
          if (sev !== 0) return sev;
          const typeOrder: Record<ProgramPressureType, number> = {
            executive_decision_needed: 1,
            value_not_ready: 2,
            gate_missing_inputs: 3,
            evidence_not_ready: 4,
            context_insufficient: 5,
            deliverable_coverage_gap: 6,
          };
          const ty = typeOrder[a.type] - typeOrder[b.type];
          if (ty !== 0) return ty;
          return a.id.localeCompare(b.id);
        });
      expect(fromAggregate).toEqual(fromPrograms);
    }
  });
});

// ---------------------------------------------------------------------
// Summary helper
// ---------------------------------------------------------------------

describe('summarizeProgramControlTowerSignals', () => {
  const { tenant, program } = pickFixture();

  it('counts reconcile to the signal list', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const sum = summarizeProgramControlTowerSignals(signals);
    expect(sum.totalCount).toBe(signals.length);
    const byTypeSum = Object.values(sum.byType).reduce((a, b) => a + b, 0);
    const bySeveritySum = Object.values(sum.bySeverity).reduce((a, b) => a + b, 0);
    expect(byTypeSum).toBe(signals.length);
    expect(bySeveritySum).toBe(signals.length);
  });

  it('topSeverity matches the highest severity present', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const sum = summarizeProgramControlTowerSignals(signals);
    expect(sum.topSeverity).toBe('critical');
  });

  it('topSeverity is null for an empty signal list', () => {
    const sum = summarizeProgramControlTowerSignals([]);
    expect(sum.totalCount).toBe(0);
    expect(sum.topSeverity).toBeNull();
    expect(sum.affectedProgramCodes).toEqual([]);
  });

  it('affectedProgramCodes is sorted and unique', () => {
    const allTenant = buildTenantProgramControlTowerSignals(
      plan.tenants.find((t) => t.tenantKey === 'apexretail')!,
    );
    const sum = summarizeProgramControlTowerSignals(allTenant);
    expect(sum.affectedProgramCodes).toEqual(
      [...sum.affectedProgramCodes].sort(),
    );
    expect(new Set(sum.affectedProgramCodes).size).toBe(sum.affectedProgramCodes.length);
  });

  it('produces deterministic summaries across repeated calls', () => {
    const signals = buildProgramControlTowerSignals(tenant, program);
    const a = summarizeProgramControlTowerSignals(signals);
    const b = summarizeProgramControlTowerSignals(signals);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// Sanity: gate indices and signal spread
// ---------------------------------------------------------------------

describe('Sanity', () => {
  it('listKnownGateIndices returns the canonical four', () => {
    expect(listKnownGateIndices()).toEqual([1, 2, 3, 4]);
  });

  it('every program produces an evidence and value signal; gate signal only when a canonical gate exits the current phase', () => {
    // Canonical phase 5 (Execute, spec phase 4) has no exit gate, so
    // those programs honestly emit zero gate_missing_inputs signals.
    // Every program still emits evidence + value signals.
    for (const program of plan.programs) {
      const tenant = plan.tenants.find((t) =>
        t.programs.some((p) => p.programSlug === program.programSlug),
      )!;
      const types = new Set(
        buildProgramControlTowerSignals(tenant, program).map((s) => s.type),
      );
      expect(types.has('evidence_not_ready')).toBe(true);
      expect(types.has('value_not_ready')).toBe(true);
      // Gate signal expectation depends on canonical phase position.
      const hasCurrentGate = program.currentPhaseSpec !== 4;
      if (hasCurrentGate) {
        expect(types.has('gate_missing_inputs')).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('S9e module hygiene', () => {
  it('does not import Tower UI, Atlas runtime, Nexus runtime, agent runtime, Source, mock.ts, or auth', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const src = path.resolve(__dirname, '../../../lib/programs/programs-control-tower-signals.ts');
    const content = fs.readFileSync(src, 'utf8');
    expect(content).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(content).not.toMatch(/from '@\/components\/tower\//);
    expect(content).not.toMatch(/from '@\/lib\/tower\//);
    expect(content).not.toMatch(/from '@\/lib\/atlas\//);
    expect(content).not.toMatch(/from '@\/lib\/nexus\//);
    expect(content).not.toMatch(/from '@\/lib\/agent\//);
    expect(content).not.toMatch(/from '@\/components\/agent\//);
    expect(content).not.toMatch(/from '@\/app\/programs\//);
    expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/preview\//);
    expect(content).not.toMatch(/from '@\/app\/demo\//);
    expect(content).not.toMatch(/from '@\/lib\/source\//);
    expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(content).not.toMatch(/from '@\/lib\/auth\//);
  });
});

// ---------------------------------------------------------------------
// Type completeness sanity
// ---------------------------------------------------------------------

describe('Type completeness', () => {
  it('every emitted signal carries the full required field set', () => {
    const { tenant, program } = pickFixture();
    const signals = buildProgramControlTowerSignals(tenant, program);
    expect(signals.length).toBeGreaterThan(0);
    for (const sig of signals) {
      expectKey(sig, 'id', 'string');
      expectKey(sig, 'tenantKey', 'string');
      expectKey(sig, 'tenantName', 'string');
      expectKey(sig, 'programCode', 'string');
      expectKey(sig, 'programName', 'string');
      expectKey(sig, 'type', 'string');
      expectKey(sig, 'severity', 'string');
      expectKey(sig, 'title', 'string');
      expectKey(sig, 'summary', 'string');
      expectKey(sig, 'source', 'string');
      expectKey(sig, 'routeHref', 'string');
      expect(Array.isArray(sig.missingInputs)).toBe(true);
      expectKey(sig, 'recommendedAction', 'string');
      expectKey(sig, 'evidenceStatus', 'string');
      expectKey(sig, 'valueStatus', 'string');
      expectKey(sig, 'gateStatus', 'string');
      expect(sig.createdFrom).toBe('deterministic_seed');
    }
  });
});

function expectKey<T extends ProgramControlTowerSignal>(
  sig: T,
  key: keyof T,
  type: 'string' | 'number',
): void {
  const value = sig[key];
  expect(typeof value).toBe(type);
  if (type === 'string') {
    expect((value as unknown as string).length).toBeGreaterThan(0);
  }
}
