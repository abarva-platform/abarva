// INT6 · Gate Readiness Checklist — integration tests.
//
// Covers the deterministic view-model (lib source audit + runtime contract)
// and a component source probe for IntelligenceLensTabs.tsx.
// No React rendering, no DOM, no model calls.

import * as fs from 'fs';
import * as path from 'path';

import {
  buildGateReadinessView,
  type GateReadinessView,
  type GateRequirementStatus,
  type GateReadinessStatus,
} from '@/lib/intelligence/gate-readiness-view';

// ─────────────────────────────────────────────────────────────────────────────
// Lib source audit — import guard
// ─────────────────────────────────────────────────────────────────────────────

describe('gate-readiness-view lib source audit', () => {
  const libSrc = fs.readFileSync(
    path.resolve(__dirname, '../../../lib/intelligence/gate-readiness-view.ts'),
    'utf8',
  );

  it('does not import from src/lib/source', () => {
    expect(libSrc).not.toMatch(/@\/lib\/source/);
  });

  it('does not import from src/lib/sentinel', () => {
    expect(libSrc).not.toMatch(/@\/lib\/sentinel/);
  });

  it('does not import from src/lib/agent', () => {
    expect(libSrc).not.toMatch(/@\/lib\/agent/);
  });

  it('does not import from src/lib/auth', () => {
    expect(libSrc).not.toMatch(/@\/lib\/auth/);
  });

  it('does not import from supabase (import statement only)', () => {
    expect(libSrc).not.toMatch(/from ['"].*supabase/);
  });

  it('does not call fetch', () => {
    expect(libSrc).not.toMatch(/\bfetch\s*\(/);
  });

  it('does not call Date.now', () => {
    expect(libSrc).not.toMatch(/Date\.now\s*\(/);
  });

  it('does not call Math.random', () => {
    expect(libSrc).not.toMatch(/Math\.random\s*\(/);
  });

  it('does not use new Date', () => {
    expect(libSrc).not.toMatch(/new Date\s*\(/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Runtime contract
// ─────────────────────────────────────────────────────────────────────────────

describe('buildGateReadinessView — runtime contract', () => {
  let view: GateReadinessView;

  beforeEach(() => {
    view = buildGateReadinessView();
  });

  // Determinism
  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('is pure — two calls return deep-equal objects', () => {
    expect(view).toEqual(buildGateReadinessView());
  });

  // Programme count
  it('contains exactly 4 programmes', () => {
    expect(view.programmes).toHaveLength(4);
  });

  it('programmes are ordered APX-AMS-2026, APX-CDP-2026, APX-SA-2026, APX-DF-2026', () => {
    expect(view.programmes.map((p) => p.programmeId)).toEqual([
      'APX-AMS-2026',
      'APX-CDP-2026',
      'APX-SA-2026',
      'APX-DF-2026',
    ]);
  });

  // Gate readiness status per programme
  it('APX-AMS-2026 gate is blocked', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.gateReadinessStatus).toBe<GateReadinessStatus>('blocked');
  });

  it('APX-CDP-2026 gate is blocked', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.gateReadinessStatus).toBe<GateReadinessStatus>('blocked');
  });

  it('APX-SA-2026 gate is at_risk', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    expect(prog.gateReadinessStatus).toBe<GateReadinessStatus>('at_risk');
  });

  it('APX-DF-2026 gate is clear', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.gateReadinessStatus).toBe<GateReadinessStatus>('clear');
  });

  // Next gate names
  it('APX-AMS-2026 next gate is Architecture Sign-off', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.nextGate).toBe('Architecture Sign-off');
  });

  it('APX-CDP-2026 next gate is Data Architecture Approval', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.nextGate).toBe('Data Architecture Approval');
  });

  it('APX-SA-2026 next gate is Pilot Go/No-Go', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    expect(prog.nextGate).toBe('Pilot Go/No-Go');
  });

  it('APX-DF-2026 next gate is Model Selection', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.nextGate).toBe('Model Selection');
  });

  // Each programme has exactly 4 requirements
  it('each programme has exactly 4 requirements', () => {
    for (const prog of view.programmes) {
      expect(prog.requirements).toHaveLength(4);
    }
  });

  // Critical-urgency blocked requirements on AMS and CDP
  it('APX-AMS-2026 has a critical-urgency blocked requirement (REQ-AMS-001)', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    const req = prog.requirements.find((r) => r.requirementId === 'REQ-AMS-001')!;
    expect(req).toBeDefined();
    expect(req.status).toBe<GateRequirementStatus>('blocked');
    expect(req.urgency).toBe('critical');
    expect(req.category).toBe('contradiction');
  });

  it('APX-CDP-2026 has a critical-urgency blocked requirement (REQ-CDP-001)', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    const req = prog.requirements.find((r) => r.requirementId === 'REQ-CDP-001')!;
    expect(req).toBeDefined();
    expect(req.status).toBe<GateRequirementStatus>('blocked');
    expect(req.urgency).toBe('critical');
    expect(req.category).toBe('contradiction');
  });

  // SA has no blocked requirements (at_risk but not blocked)
  it('APX-SA-2026 has no blocked requirements', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    const blocked = prog.requirements.filter((r) => r.status === 'blocked');
    expect(blocked).toHaveLength(0);
  });

  // DF has at least one 'met' requirement and no blocked
  it('APX-DF-2026 has no blocked or at_risk requirements', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    const nonGreen = prog.requirements.filter(
      (r) => r.status === 'blocked' || r.status === 'at_risk',
    );
    expect(nonGreen).toHaveLength(0);
  });

  it('APX-DF-2026 has at least 3 met requirements', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    const met = prog.requirements.filter((r) => r.status === 'met');
    expect(met.length).toBeGreaterThanOrEqual(3);
  });

  // Metrics
  it('metrics.totalProgrammes is 4', () => {
    expect(view.metrics.totalProgrammes).toBe(4);
  });

  it('metrics.clearCount is 1 (only APX-DF-2026)', () => {
    expect(view.metrics.clearCount).toBe(1);
  });

  it('metrics.blockedCount is 2 (AMS + CDP)', () => {
    expect(view.metrics.blockedCount).toBe(2);
  });

  it('metrics.atRiskCount is 1 (SA)', () => {
    expect(view.metrics.atRiskCount).toBe(1);
  });

  it('metrics.totalOpenRequirements is 12 (4+4+3+1)', () => {
    expect(view.metrics.totalOpenRequirements).toBe(12);
  });

  it('metrics.criticalOpenCount is 2 (one per blocked programme)', () => {
    expect(view.metrics.criticalOpenCount).toBe(2);
  });

  it('metrics match hand-counted values from programme data', () => {
    // Cross-check: compute manually from view.programmes
    let computedOpen = 0;
    let computedCritical = 0;
    let computedClear = 0;
    let computedBlocked = 0;
    let computedAtRisk = 0;
    for (const prog of view.programmes) {
      if (prog.gateReadinessStatus === 'clear')   computedClear++;
      if (prog.gateReadinessStatus === 'blocked')  computedBlocked++;
      if (prog.gateReadinessStatus === 'at_risk')  computedAtRisk++;
      for (const req of prog.requirements) {
        if (req.status !== 'met') {
          computedOpen++;
          if (req.urgency === 'critical') computedCritical++;
        }
      }
    }
    expect(view.metrics.clearCount).toBe(computedClear);
    expect(view.metrics.blockedCount).toBe(computedBlocked);
    expect(view.metrics.atRiskCount).toBe(computedAtRisk);
    expect(view.metrics.totalOpenRequirements).toBe(computedOpen);
    expect(view.metrics.criticalOpenCount).toBe(computedCritical);
  });

  // Atlas summary is non-empty
  it('atlasSummary is non-empty', () => {
    expect(view.atlasSummary.length).toBeGreaterThan(0);
  });

  // All requirements have non-empty fields
  it('every requirement has a non-empty requirementId, description, and sentinelNote', () => {
    for (const prog of view.programmes) {
      for (const req of prog.requirements) {
        expect(req.requirementId.length).toBeGreaterThan(0);
        expect(req.description.length).toBeGreaterThan(0);
        expect(req.sentinelNote.length).toBeGreaterThan(0);
      }
    }
  });

  // Category must be one of the valid values
  it('every requirement category is a valid GateRequirementCategory value', () => {
    const valid = new Set(['evidence', 'contradiction', 'stakeholder', 'technical', 'governance']);
    for (const prog of view.programmes) {
      for (const req of prog.requirements) {
        expect(valid.has(req.category)).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component source probe
// ─────────────────────────────────────────────────────────────────────────────

describe('INT6 component source probe', () => {
  const componentPath = path.resolve(
    __dirname,
    '../../../components/intelligence/IntelligenceLensTabs.tsx',
  );

  it('IntelligenceLensTabs.tsx imports buildGateReadinessView', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('buildGateReadinessView');
  });

  it('component renders gate_readiness tab', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain("activeTab === 'gate_readiness'");
  });

  it('component contains GateReadinessPanel function', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toMatch(/function GateReadinessPanel/);
  });

  it('GateReadinessPanel has intelligence-gate-readiness-panel testid', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-gate-readiness-panel');
  });

  it('GateReadinessPanel has intelligence-gate-readiness-summary testid', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-gate-readiness-summary');
  });

  it('GateReadinessPanel has per-programme testids', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-gate-readiness-${prog.programmeId}');
  });

  it('GateReadinessPanel has honest disclaimer testid', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-gate-readiness-disclaimer');
  });

  it('disclaimer text starts with "Deterministic seed"', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toMatch(/Deterministic seed · Gate readiness/);
  });

  it('component does not call fetch or Date.now', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
  });

  it('component does not import from src/lib/source', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).not.toMatch(/@\/lib\/source/);
  });
});
