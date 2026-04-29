// INT5 · Programme Risk Summary — integration tests.
//
// Pure deterministic coverage of programme-risk-summary-view.ts
// and the ProgrammeRiskPanel wiring in IntelligenceLensTabs.tsx.
// No React rendering, no DOM, no model calls.

import * as fs from 'fs';
import * as path from 'path';

import {
  buildProgrammeRiskSummaryView,
} from '@/lib/intelligence/programme-risk-summary-view';

// ─────────────────────────────────────────────────────────────────────────────
// Lib source audit
// ─────────────────────────────────────────────────────────────────────────────

describe('INT5 lib source audit', () => {
  const libPath = path.resolve(
    __dirname,
    '../../../lib/intelligence/programme-risk-summary-view.ts',
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(libPath, 'utf8');
  });

  it('lib file exists', () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it('exports buildProgrammeRiskSummaryView', () => {
    expect(src).toMatch(/export function buildProgrammeRiskSummaryView/);
  });

  it('does not import from src/lib/source', () => {
    expect(src).not.toMatch(/@\/lib\/source/);
  });

  it('does not import from src/lib/auth', () => {
    expect(src).not.toMatch(/@\/lib\/auth/);
  });

  it('does not import from supabase', () => {
    expect(src).not.toMatch(/from ['"].*supabase/);
  });

  it('does not call fetch', () => {
    expect(src).not.toMatch(/\bfetch\s*\(/);
  });

  it('does not call Date.now or Math.random', () => {
    expect(src).not.toMatch(/Date\.now\s*\(/);
    expect(src).not.toMatch(/Math\.random\s*\(/);
  });

  it('contains deterministicSeed: true', () => {
    expect(src).toContain('deterministicSeed: true');
  });

  it('honestDisclaimer starts with Deterministic seed', () => {
    expect(src).toContain('Deterministic seed ·');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// View-model runtime contract
// ─────────────────────────────────────────────────────────────────────────────

describe('buildProgrammeRiskSummaryView — runtime contract', () => {
  it('returns deterministicSeed: true', () => {
    expect(buildProgrammeRiskSummaryView().deterministicSeed).toBe(true);
  });

  it('is pure — same call yields identical output', () => {
    const a = buildProgrammeRiskSummaryView();
    const b = buildProgrammeRiskSummaryView();
    expect(a).toEqual(b);
  });

  it('returns exactly 4 programmes', () => {
    expect(buildProgrammeRiskSummaryView().programmes).toHaveLength(4);
  });

  it('metrics reports 4 total programmes', () => {
    expect(buildProgrammeRiskSummaryView().metrics.totalProgrammes).toBe(4);
  });

  it('APX-AMS-2026 has critical risk level', () => {
    const prog = buildProgrammeRiskSummaryView().programmes.find(
      (p) => p.programmeId === 'APX-AMS-2026',
    );
    expect(prog).toBeDefined();
    expect(prog!.riskLevel).toBe('critical');
  });

  it('APX-AMS-2026 has 3 active contradictions and 1 escalated', () => {
    const prog = buildProgrammeRiskSummaryView().programmes.find(
      (p) => p.programmeId === 'APX-AMS-2026',
    )!;
    expect(prog.activeContradictions).toBe(3);
    expect(prog.escalatedContradictions).toBe(1);
  });

  it('APX-AMS-2026 has 2 critical evidence gaps', () => {
    const prog = buildProgrammeRiskSummaryView().programmes.find(
      (p) => p.programmeId === 'APX-AMS-2026',
    )!;
    expect(prog.criticalGaps).toBe(2);
  });

  it('APX-CDP-2026 has high risk and blocked gate', () => {
    const prog = buildProgrammeRiskSummaryView().programmes.find(
      (p) => p.programmeId === 'APX-CDP-2026',
    );
    expect(prog).toBeDefined();
    expect(prog!.riskLevel).toBe('high');
    expect(prog!.gateStatus).toBe('blocked');
  });

  it('APX-SA-2026 has medium risk', () => {
    const prog = buildProgrammeRiskSummaryView().programmes.find(
      (p) => p.programmeId === 'APX-SA-2026',
    );
    expect(prog).toBeDefined();
    expect(prog!.riskLevel).toBe('medium');
  });

  it('APX-DF-2026 has low risk and no critical path item', () => {
    const prog = buildProgrammeRiskSummaryView().programmes.find(
      (p) => p.programmeId === 'APX-DF-2026',
    );
    expect(prog).toBeDefined();
    expect(prog!.riskLevel).toBe('low');
    expect(prog!.criticalPathItem).toBeNull();
  });

  it('metrics.criticalRiskCount is 1', () => {
    expect(buildProgrammeRiskSummaryView().metrics.criticalRiskCount).toBe(1);
  });

  it('metrics.highRiskCount is 1', () => {
    expect(buildProgrammeRiskSummaryView().metrics.highRiskCount).toBe(1);
  });

  it('metrics.blockedProgrammeCount is 1', () => {
    expect(buildProgrammeRiskSummaryView().metrics.blockedProgrammeCount).toBe(1);
  });

  it('metrics.needsAttentionCount is 2 (critical + high/blocked)', () => {
    expect(buildProgrammeRiskSummaryView().metrics.needsAttentionCount).toBe(2);
  });

  it('all programme IDs are unique', () => {
    const ids = buildProgrammeRiskSummaryView().programmes.map((p) => p.programmeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every programme has non-empty programmeName and riskSummary', () => {
    for (const prog of buildProgrammeRiskSummaryView().programmes) {
      expect(prog.programmeName.length).toBeGreaterThan(0);
      expect(prog.riskSummary.length).toBeGreaterThan(0);
    }
  });

  it('APX-AMS-2026 and APX-CDP-2026 have non-null criticalPathItem', () => {
    const view = buildProgrammeRiskSummaryView();
    const ams = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    const cdp = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(ams.criticalPathItem).not.toBeNull();
    expect(cdp.criticalPathItem).not.toBeNull();
  });

  it('criticalPath string is non-empty and contains AMS', () => {
    const view = buildProgrammeRiskSummaryView();
    expect(view.criticalPath.length).toBeGreaterThan(0);
    expect(view.criticalPath).toMatch(/AMS/i);
  });

  it('atlasSynthesis is non-empty', () => {
    expect(buildProgrammeRiskSummaryView().atlasSynthesis.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer starts with Deterministic seed', () => {
    expect(buildProgrammeRiskSummaryView().honestDisclaimer).toMatch(/^Deterministic seed/);
  });

  it('programmes are ordered: critical → high → medium → low', () => {
    const view = buildProgrammeRiskSummaryView();
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 0; i < view.programmes.length - 1; i++) {
      const curr = order[view.programmes[i].riskLevel] ?? 99;
      const next = order[view.programmes[i + 1].riskLevel] ?? 99;
      expect(curr).toBeLessThanOrEqual(next);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component source probe
// ─────────────────────────────────────────────────────────────────────────────

describe('INT5 component source probe', () => {
  const componentPath = path.resolve(
    __dirname,
    '../../../components/intelligence/IntelligenceLensTabs.tsx',
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf8');
  });

  it('IntelligenceLensTabs.tsx exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('references programme_risk tab key', () => {
    expect(src).toContain('programme_risk');
  });

  it('imports buildProgrammeRiskSummaryView', () => {
    expect(src).toContain('buildProgrammeRiskSummaryView');
  });

  it('renders intelligence-programme-risk-panel testid', () => {
    expect(src).toContain('intelligence-programme-risk-panel');
  });

  it('renders intelligence-programme-risk-summary testid', () => {
    expect(src).toContain('intelligence-programme-risk-summary');
  });

  it('renders intelligence-programme-risk-disclaimer testid', () => {
    expect(src).toContain('intelligence-programme-risk-disclaimer');
  });

  it('has data-honest-disclaimer="intelligence-programme-risk"', () => {
    expect(src).toContain('data-honest-disclaimer="intelligence-programme-risk"');
  });

  it('disclaimer text starts with Deterministic seed', () => {
    expect(src).toContain('Deterministic seed · Programme risk summary');
  });

  it('uses intelligence-programme-risk-{programmeId} testid pattern', () => {
    expect(src).toContain('`intelligence-programme-risk-${prog.programmeId}`');
  });

  it('does not call fetch or Date.now', () => {
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
  });
});
