// INT4 · Pattern Contradiction Monitor — integration tests.
//
// Pure deterministic coverage of pattern-contradiction-monitor-view.ts
// and the ContradictionMonitorPanel wiring in IntelligenceLensTabs.tsx.
// No React rendering, no DOM, no model calls.

import * as fs from 'fs';
import * as path from 'path';

import {
  buildPatternContradictionMonitorView,
} from '@/lib/intelligence/pattern-contradiction-monitor-view';

// ─────────────────────────────────────────────────────────────────────────────
// Lib source audit
// ─────────────────────────────────────────────────────────────────────────────

describe('INT4 lib source audit', () => {
  const libPath = path.resolve(
    __dirname,
    '../../../lib/intelligence/pattern-contradiction-monitor-view.ts',
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(libPath, 'utf8');
  });

  it('lib file exists', () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it('exports buildPatternContradictionMonitorView', () => {
    expect(src).toMatch(/export function buildPatternContradictionMonitorView/);
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

describe('buildPatternContradictionMonitorView — runtime contract', () => {
  it('returns deterministicSeed: true', () => {
    expect(buildPatternContradictionMonitorView().deterministicSeed).toBe(true);
  });

  it('is pure — same call yields identical output', () => {
    const a = buildPatternContradictionMonitorView();
    const b = buildPatternContradictionMonitorView();
    expect(a).toEqual(b);
  });

  it('returns exactly 5 patterns', () => {
    expect(buildPatternContradictionMonitorView().patterns).toHaveLength(5);
  });

  it('summary reports 5 total patterns', () => {
    expect(buildPatternContradictionMonitorView().summary.totalPatterns).toBe(5);
  });

  it('4 patterns have active contradictions', () => {
    expect(buildPatternContradictionMonitorView().summary.patternsWithActiveContradictions).toBe(4);
  });

  it('6 total active contradictions', () => {
    expect(buildPatternContradictionMonitorView().summary.totalActiveContradictions).toBe(6);
  });

  it('3 high-severity active contradictions', () => {
    expect(buildPatternContradictionMonitorView().summary.highSeverityContradictions).toBe(3);
  });

  it('1 escalated contradiction', () => {
    expect(buildPatternContradictionMonitorView().summary.escalatedContradictions).toBe(1);
  });

  it('PAT-SRC-AMS-001 is critical with 3 active contradictions', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-SRC-AMS-001',
    );
    expect(pattern).toBeDefined();
    expect(pattern!.overallStatus).toBe('critical');
    expect(pattern!.activeContradictions).toBe(3);
    expect(pattern!.highSeverityCount).toBe(2);
    expect(pattern!.escalatedCount).toBe(1);
  });

  it('PAT-PRG-CDP-001 is at_risk with 1 active contradiction', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-PRG-CDP-001',
    );
    expect(pattern).toBeDefined();
    expect(pattern!.overallStatus).toBe('at_risk');
    expect(pattern!.activeContradictions).toBe(1);
  });

  it('PAT-GOV-001 is clean with 0 active contradictions', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-GOV-001',
    );
    expect(pattern).toBeDefined();
    expect(pattern!.overallStatus).toBe('clean');
    expect(pattern!.activeContradictions).toBe(0);
    expect(pattern!.contradictions).toHaveLength(0);
  });

  it('CON-AMS-001 is escalated, high severity, and blocks BAFO close', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-SRC-AMS-001',
    )!;
    const con = pattern.contradictions.find((c) => c.contradictionId === 'CON-AMS-001');
    expect(con).toBeDefined();
    expect(con!.severity).toBe('high');
    expect(con!.status).toBe('escalated');
    expect(con!.blockedItem).not.toBeNull();
    expect(con!.blockedItem).toMatch(/BAFO/i);
  });

  it('CON-AMS-002 is open and high severity', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-SRC-AMS-001',
    )!;
    const con = pattern.contradictions.find((c) => c.contradictionId === 'CON-AMS-002');
    expect(con).toBeDefined();
    expect(con!.severity).toBe('high');
    expect(con!.status).toBe('open');
  });

  it('CON-AMS-003 is investigating, medium severity, no blocked item', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-SRC-AMS-001',
    )!;
    const con = pattern.contradictions.find((c) => c.contradictionId === 'CON-AMS-003');
    expect(con).toBeDefined();
    expect(con!.severity).toBe('medium');
    expect(con!.status).toBe('investigating');
    expect(con!.blockedItem).toBeNull();
  });

  it('CON-CDP-001 is open and blocks the CDP P3 Design gate', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-PRG-CDP-001',
    )!;
    const con = pattern.contradictions.find((c) => c.contradictionId === 'CON-CDP-001');
    expect(con).toBeDefined();
    expect(con!.status).toBe('open');
    expect(con!.blockedItem).not.toBeNull();
    expect(con!.blockedItem).toMatch(/CDP/i);
  });

  it('PAT-PRG-DF-001 has 1 active and 1 resolved contradiction', () => {
    const pattern = buildPatternContradictionMonitorView().patterns.find(
      (p) => p.patternId === 'PAT-PRG-DF-001',
    )!;
    expect(pattern.activeContradictions).toBe(1);
    expect(pattern.resolvedContradictions).toBe(1);
  });

  it('all patternIds are unique', () => {
    const ids = buildPatternContradictionMonitorView().patterns.map((p) => p.patternId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all contradiction IDs across all patterns are unique', () => {
    const allCons = buildPatternContradictionMonitorView().patterns.flatMap(
      (p) => p.contradictions,
    );
    const ids = allCons.map((c) => c.contradictionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each pattern has non-empty patternTitle and patternType', () => {
    for (const pattern of buildPatternContradictionMonitorView().patterns) {
      expect(pattern.patternTitle.length).toBeGreaterThan(0);
      expect(pattern.patternType.length).toBeGreaterThan(0);
    }
  });

  it('each contradiction has a non-empty label and resolutionPath', () => {
    const allCons = buildPatternContradictionMonitorView().patterns.flatMap(
      (p) => p.contradictions,
    );
    for (const con of allCons) {
      expect(con.label.length).toBeGreaterThan(0);
      expect(con.resolutionPath).not.toBeNull();
      expect(con.resolutionPath!.length).toBeGreaterThan(0);
    }
  });

  it('activeContradictions count matches non-resolved contradictions in the array', () => {
    for (const pattern of buildPatternContradictionMonitorView().patterns) {
      const nonResolved = pattern.contradictions.filter((c) => c.status !== 'resolved').length;
      expect(pattern.activeContradictions).toBe(nonResolved);
    }
  });

  it('atlasSynthesis is non-empty', () => {
    expect(buildPatternContradictionMonitorView().atlasSynthesis.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer starts with Deterministic seed', () => {
    expect(buildPatternContradictionMonitorView().honestDisclaimer).toMatch(/^Deterministic seed/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component source probe
// ─────────────────────────────────────────────────────────────────────────────

describe('INT4 component source probe', () => {
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

  it('references contradiction_monitor tab key', () => {
    expect(src).toContain('contradiction_monitor');
  });

  it('imports buildPatternContradictionMonitorView', () => {
    expect(src).toContain('buildPatternContradictionMonitorView');
  });

  it('renders intelligence-contradiction-monitor-panel testid', () => {
    expect(src).toContain('intelligence-contradiction-monitor-panel');
  });

  it('renders intelligence-contradiction-monitor-summary testid', () => {
    expect(src).toContain('intelligence-contradiction-monitor-summary');
  });

  it('renders intelligence-contradiction-monitor-disclaimer testid', () => {
    expect(src).toContain('intelligence-contradiction-monitor-disclaimer');
  });

  it('has data-honest-disclaimer="intelligence-contradiction-monitor"', () => {
    expect(src).toContain('data-honest-disclaimer="intelligence-contradiction-monitor"');
  });

  it('disclaimer text starts with Deterministic seed', () => {
    expect(src).toContain('Deterministic seed · Contradiction monitor reflects');
  });

  it('uses intelligence-contradiction-{patternId} testid pattern', () => {
    expect(src).toContain('`intelligence-contradiction-${pattern.patternId}`');
  });

  it('does not call fetch or Date.now', () => {
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
  });
});
