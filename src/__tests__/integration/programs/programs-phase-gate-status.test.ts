// S9c · Programs phase + hard-gate status rendering tests.
//
// Pure deterministic coverage of the view-model layer that S9c added.
// No React rendering, no DOM, no model/API calls. Tests assert that:
// - The six canonical phases always render in canonical order with
//   honest status labels.
// - Origination is always honestly labeled informational (pre-seed).
// - The four hard gates always render in canonical order.
// - Gate status labels are deterministic and never claim true approval
//   from the seed alone.
// - Steward readiness note prose is deterministic and references
//   missing inputs honestly.
// - The view module does not import legacy /programs, mock.ts,
//   preview, demo, Source UI, Nexus runtime, or auth.

import {
  CANONICAL_FOUR_GATES,
  CANONICAL_SIX_PHASES,
  HONEST_FALLBACK_LABELS,
  buildCanonicalHardGateStrip,
  buildCanonicalPhaseTimeline,
  buildStewardReadinessNote,
  getBlockedTransitionReason,
  getCurrentCanonicalPhase,
  getGateReadinessLabel,
  statusToCanonicalPhaseRenderStatus,
} from '@/lib/programs/programs-canonical-view';
import type {
  CanonicalHardGateRenderStatus,
  CanonicalPhaseRenderStatus,
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

const ALL_PHASE_RENDER_STATUSES: CanonicalPhaseRenderStatus[] = [
  'not_started',
  'current',
  'complete',
  'informational',
  'blocked',
  'not_seeded',
];
const ALL_GATE_RENDER_STATUSES: CanonicalHardGateRenderStatus[] = [
  'informational',
  'ready',
  'missing_inputs',
  'blocked',
  'not_wired',
];

// =====================================================================
// Phase timeline
// =====================================================================

describe('buildCanonicalPhaseTimeline', () => {
  const { program } = pickFixture();

  it('always returns the six canonical phases in order', () => {
    const entries = buildCanonicalPhaseTimeline(program);
    expect(entries).toHaveLength(6);
    expect(entries.map((e) => e.phase.index)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(entries.map((e) => e.phase.key)).toEqual([
      'origination',
      'charter',
      'diagnose',
      'design',
      'execute',
      'verify',
    ]);
  });

  it('labels Origination honestly as informational (pre-seed)', () => {
    const entries = buildCanonicalPhaseTimeline(program);
    const origination = entries.find((e) => e.phase.key === 'origination');
    expect(origination?.status).toBe('informational');
    expect(origination?.specPhase).toBeNull();
    expect(origination?.reason).toBe(HONEST_FALLBACK_LABELS.origination);
  });

  it('marks exactly one phase as current per program', () => {
    for (const program of plan.programs) {
      const entries = buildCanonicalPhaseTimeline(program);
      const currents = entries.filter((e) => e.isCurrent);
      expect(currents).toHaveLength(1);
      expect(currents[0].status).toBe('current');
    }
  });

  it('only emits status values from the canonical 6-state enum', () => {
    for (const program of plan.programs) {
      const entries = buildCanonicalPhaseTimeline(program);
      for (const entry of entries) {
        expect(ALL_PHASE_RENDER_STATUSES).toContain(entry.status);
      }
    }
  });

  it('does not invent completion data; complete phases are limited to those before current', () => {
    for (const program of plan.programs) {
      const entries = buildCanonicalPhaseTimeline(program);
      const current = entries.find((e) => e.isCurrent)!;
      const complete = entries.filter((e) => e.status === 'complete');
      for (const c of complete) {
        expect(c.phase.index).toBeLessThan(current.phase.index);
      }
    }
  });

  it('produces deterministic results across repeated calls', () => {
    const a = buildCanonicalPhaseTimeline(program);
    const b = buildCanonicalPhaseTimeline(program);
    expect(a).toEqual(b);
  });
});

describe('getCurrentCanonicalPhase', () => {
  const { program } = pickFixture();

  it('returns the current canonical phase from seed', () => {
    const phase = getCurrentCanonicalPhase(program);
    expect(phase).not.toBeNull();
    expect(phase!.index).toBeGreaterThanOrEqual(2);
    expect(phase!.index).toBeLessThanOrEqual(6);
  });

  it('matches the entry flagged isCurrent in the timeline', () => {
    for (const p of plan.programs) {
      const phase = getCurrentCanonicalPhase(p);
      const timeline = buildCanonicalPhaseTimeline(p);
      const current = timeline.find((e) => e.isCurrent);
      expect(phase?.key).toBe(current?.phase.key);
    }
  });
});

describe('statusToCanonicalPhaseRenderStatus', () => {
  it('maps the four legacy states to the new 6-state enum honestly', () => {
    expect(statusToCanonicalPhaseRenderStatus('complete')).toBe('complete');
    expect(statusToCanonicalPhaseRenderStatus('active')).toBe('current');
    expect(statusToCanonicalPhaseRenderStatus('pending')).toBe('not_started');
    expect(statusToCanonicalPhaseRenderStatus('origination_pre_seed')).toBe('informational');
  });
});

// =====================================================================
// Hard-gate strip
// =====================================================================

describe('buildCanonicalHardGateStrip', () => {
  const { program } = pickFixture();

  it('always returns the four canonical gates in order', () => {
    const entries = buildCanonicalHardGateStrip(program);
    expect(entries).toHaveLength(4);
    expect(entries.map((e) => e.gate.index)).toEqual([1, 2, 3, 4]);
    expect(entries.map((e) => e.gate.exitsPhase)).toEqual([
      'charter',
      'diagnose',
      'design',
      'verify',
    ]);
  });

  it('only emits status values from the canonical 5-state gate enum', () => {
    for (const program of plan.programs) {
      const entries = buildCanonicalHardGateStrip(program);
      for (const entry of entries) {
        expect(ALL_GATE_RENDER_STATUSES).toContain(entry.status);
      }
    }
  });

  it('never emits "ready" while the production state machine is deferred', () => {
    // S9c contract: seed-only → no gate can claim true approval.
    for (const program of plan.programs) {
      const entries = buildCanonicalHardGateStrip(program);
      for (const entry of entries) {
        expect(entry.status).not.toBe('ready');
      }
    }
  });

  it('flags the gate exiting the program’s current phase as missing_inputs with a reason', () => {
    const { program } = pickFixture();
    const entries = buildCanonicalHardGateStrip(program);
    const currents = entries.filter((e) => e.isCurrentGate);
    expect(currents.length).toBeLessThanOrEqual(1);
    if (currents.length === 1) {
      expect(currents[0].status).toBe('missing_inputs');
      expect(typeof currents[0].blockedTransitionReason).toBe('string');
      expect(currents[0].blockedTransitionReason!.length).toBeGreaterThan(20);
    }
  });

  it('flags gates ahead of the program’s current phase as not_wired', () => {
    for (const program of plan.programs) {
      const entries = buildCanonicalHardGateStrip(program);
      for (const entry of entries) {
        if (!entry.isCurrentGate && !entry.isPassed) {
          expect(entry.status).toBe('not_wired');
        }
      }
    }
  });

  it('flags gates behind the program’s current phase as informational (no fake approval)', () => {
    for (const program of plan.programs) {
      const entries = buildCanonicalHardGateStrip(program);
      for (const entry of entries) {
        if (entry.isPassed) {
          expect(entry.status).toBe('informational');
        }
      }
    }
  });

  it('produces deterministic results across repeated calls', () => {
    const a = buildCanonicalHardGateStrip(program);
    const b = buildCanonicalHardGateStrip(program);
    expect(a).toEqual(b);
  });
});

describe('getGateReadinessLabel', () => {
  it('returns canonical uppercase labels for each status', () => {
    expect(getGateReadinessLabel('informational')).toBe('INFORMATIONAL');
    expect(getGateReadinessLabel('ready')).toBe('READY');
    expect(getGateReadinessLabel('missing_inputs')).toBe('MISSING INPUTS');
    expect(getGateReadinessLabel('blocked')).toBe('BLOCKED');
    expect(getGateReadinessLabel('not_wired')).toBe('NOT WIRED');
  });
});

describe('getBlockedTransitionReason', () => {
  const { program } = pickFixture();

  it('returns null for the gates not currently active or blocked', () => {
    const passedGate = CANONICAL_FOUR_GATES[0];
    // For a program in canonical phase >= 3, G1 should be passed → null reason.
    if (program.currentPhaseSpec >= 2) {
      expect(getBlockedTransitionReason(passedGate, program)).toBeNull();
    }
  });

  it('returns a per-gate prose string when the gate is missing_inputs', () => {
    for (const program of plan.programs) {
      const entries = buildCanonicalHardGateStrip(program);
      for (const entry of entries) {
        if (entry.status === 'missing_inputs') {
          const reason = getBlockedTransitionReason(entry.gate, program);
          expect(typeof reason).toBe('string');
          expect(reason!.length).toBeGreaterThan(20);
          expect(reason!).toMatch(/seed|state machine/i);
        }
      }
    }
  });
});

// =====================================================================
// Steward readiness note
// =====================================================================

describe('buildStewardReadinessNote', () => {
  const { program } = pickFixture();

  it('returns a note with summary and four item buckets', () => {
    const note = buildStewardReadinessNote(program);
    expect(note.summary).toMatch(/Seed-informed|production state machine/i);
    expect(Array.isArray(note.ready)).toBe(true);
    expect(Array.isArray(note.missing)).toBe(true);
    expect(Array.isArray(note.blocking)).toBe(true);
    expect(Array.isArray(note.deferred)).toBe(true);
  });

  it('always declares the production state machine as deferred', () => {
    for (const program of plan.programs) {
      const note = buildStewardReadinessNote(program);
      const joined = note.deferred.join(' | ').toLowerCase();
      expect(joined).toContain('production gate state machine');
    }
  });

  it('includes the program’s current canonical phase in the ready bucket', () => {
    const note = buildStewardReadinessNote(program);
    const joined = note.ready.join(' | ');
    const current = getCurrentCanonicalPhase(program);
    expect(joined).toContain(current!.label);
  });

  it('lists at least one missing input per program (G2/G3/G4 unseeded)', () => {
    for (const program of plan.programs) {
      const note = buildStewardReadinessNote(program);
      // Every program has exactly one current canonical gate that's
      // missing inputs, except when the program is in Origination
      // (canonical 1) — which the seed cannot encode today.
      const hasCurrentGate = note.blocking.length > 0;
      if (hasCurrentGate) {
        expect(note.missing.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('produces deterministic notes across repeated calls', () => {
    const a = buildStewardReadinessNote(program);
    const b = buildStewardReadinessNote(program);
    expect(a).toEqual(b);
  });
});

// =====================================================================
// Cross-tenant determinism
// =====================================================================

describe('Cross-tenant determinism', () => {
  it.each(plan.tenants.map((t) => [t.tenantKey, t]))(
    'produces stable phase + gate view models for first program of %s',
    (_key, tenant) => {
      if ((tenant as TenantSeedPlan).programs.length === 0) return;
      const program = (tenant as TenantSeedPlan).programs[0];
      const a = {
        phases: buildCanonicalPhaseTimeline(program),
        gates: buildCanonicalHardGateStrip(program),
        steward: buildStewardReadinessNote(program),
      };
      const b = {
        phases: buildCanonicalPhaseTimeline(program),
        gates: buildCanonicalHardGateStrip(program),
        steward: buildStewardReadinessNote(program),
      };
      expect(a).toEqual(b);
    },
  );
});

// =====================================================================
// Module hygiene
// =====================================================================

describe('S9c module hygiene', () => {
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

// =====================================================================
// Sanity: canonical constants reachable
// =====================================================================

describe('Canonical constants reachable', () => {
  it('CANONICAL_SIX_PHASES is six phases in order', () => {
    expect(CANONICAL_SIX_PHASES).toHaveLength(6);
  });
  it('CANONICAL_FOUR_GATES is four gates in order', () => {
    expect(CANONICAL_FOUR_GATES).toHaveLength(4);
  });
});
