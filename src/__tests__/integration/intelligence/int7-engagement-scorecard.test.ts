// INT7 · Engagement Intelligence Scorecard — integration tests.
//
// Covers the deterministic view-model (lib source audit + runtime contract)
// and a component source probe for IntelligenceLensTabs.tsx.
// No React rendering, no DOM, no model calls.

import * as fs from 'fs';
import * as path from 'path';

import {
  buildEngagementScorecardView,
  type EngagementScorecardView,
  type ScorecardSignal,
} from '@/lib/intelligence/engagement-scorecard-view';

// ─────────────────────────────────────────────────────────────────────────────
// Lib source audit — import guard
// ─────────────────────────────────────────────────────────────────────────────

describe('engagement-scorecard-view lib source audit', () => {
  const libSrc = fs.readFileSync(
    path.resolve(__dirname, '../../../lib/intelligence/engagement-scorecard-view.ts'),
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

describe('buildEngagementScorecardView — runtime contract', () => {
  let view: EngagementScorecardView;

  beforeEach(() => {
    view = buildEngagementScorecardView();
  });

  // Determinism
  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('is pure — two calls return deep-equal objects', () => {
    expect(view).toEqual(buildEngagementScorecardView());
  });

  // Programme count
  it('contains exactly 4 programme scorecard rows', () => {
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

  // Per-programme signals
  it('APX-AMS-2026 overallSignal is red', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.overallSignal).toBe<ScorecardSignal>('red');
  });

  it('APX-CDP-2026 overallSignal is red', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.overallSignal).toBe<ScorecardSignal>('red');
  });

  it('APX-SA-2026 overallSignal is amber', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    expect(prog.overallSignal).toBe<ScorecardSignal>('amber');
  });

  it('APX-DF-2026 overallSignal is green', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.overallSignal).toBe<ScorecardSignal>('green');
  });

  // AMS dimensions
  it('APX-AMS-2026 has 3 activeContradictions and 1 escalated', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.activeContradictions).toBe(3);
    expect(prog.escalatedContradictions).toBe(1);
  });

  it('APX-AMS-2026 gateStatus is blocked', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.gateStatus).toBe('blocked');
  });

  it('APX-AMS-2026 evidenceConfidence is medium and criticalGapsCount is 2', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.evidenceConfidence).toBe('medium');
    expect(prog.criticalGapsCount).toBe(2);
  });

  // CDP dimensions
  it('APX-CDP-2026 gateStatus is blocked', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.gateStatus).toBe('blocked');
  });

  it('APX-CDP-2026 evidenceConfidence is low', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.evidenceConfidence).toBe('low');
  });

  it('APX-CDP-2026 patternApplicationStatus is building', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.patternApplicationStatus).toBe('building');
  });

  // SA dimensions
  it('APX-SA-2026 gateStatus is at_risk', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    expect(prog.gateStatus).toBe('at_risk');
  });

  it('APX-SA-2026 has 1 activeContradiction and 0 escalated', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    expect(prog.activeContradictions).toBe(1);
    expect(prog.escalatedContradictions).toBe(0);
  });

  // DF dimensions — the clean programme
  it('APX-DF-2026 gateStatus is clear', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.gateStatus).toBe('clear');
  });

  it('APX-DF-2026 has 0 activeContradictions', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.activeContradictions).toBe(0);
    expect(prog.escalatedContradictions).toBe(0);
  });

  it('APX-DF-2026 evidenceConfidence is high and criticalGapsCount is 0', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.evidenceConfidence).toBe('high');
    expect(prog.criticalGapsCount).toBe(0);
  });

  it('APX-DF-2026 patternApplicationStatus is strong', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.patternApplicationStatus).toBe('strong');
  });

  // Engagement summary
  it('engagementSummary.overallEngagementSignal is red', () => {
    expect(view.engagementSummary.overallEngagementSignal).toBe<ScorecardSignal>('red');
  });

  it('engagementSummary.programmesNeedingAttention is 3', () => {
    expect(view.engagementSummary.programmesNeedingAttention).toBe(3);
  });

  it('engagementSummary.gateBlockedCount is 2', () => {
    expect(view.engagementSummary.gateBlockedCount).toBe(2);
  });

  it('engagementSummary.totalCriticalItems is 4 (AMS: 1 escalated + 2 gaps, CDP: 1 gap)', () => {
    expect(view.engagementSummary.totalCriticalItems).toBe(4);
  });

  it('engagementSummary metrics match hand-counted values', () => {
    let computedAttention = 0;
    let computedCritical = 0;
    let computedBlocked = 0;
    let hasRed = false;
    let hasAmber = false;
    for (const prog of view.programmes) {
      if (prog.overallSignal !== 'green') computedAttention++;
      if (prog.overallSignal === 'red') hasRed = true;
      if (prog.overallSignal === 'amber') hasAmber = true;
      computedCritical += prog.escalatedContradictions + prog.criticalGapsCount;
      if (prog.gateStatus === 'blocked') computedBlocked++;
    }
    const expectedSignal: ScorecardSignal = hasRed ? 'red' : hasAmber ? 'amber' : 'green';
    expect(view.engagementSummary.overallEngagementSignal).toBe(expectedSignal);
    expect(view.engagementSummary.programmesNeedingAttention).toBe(computedAttention);
    expect(view.engagementSummary.totalCriticalItems).toBe(computedCritical);
    expect(view.engagementSummary.gateBlockedCount).toBe(computedBlocked);
  });

  // Non-empty text fields
  it('every programme has a non-empty sentinelOneLiner', () => {
    for (const prog of view.programmes) {
      expect(prog.sentinelOneLiner.length).toBeGreaterThan(0);
    }
  });

  it('engagementSummary.sentinelExecutiveSummary is non-empty', () => {
    expect(view.engagementSummary.sentinelExecutiveSummary.length).toBeGreaterThan(0);
  });

  it('atlasSynthesis is non-empty', () => {
    expect(view.atlasSynthesis.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component source probe
// ─────────────────────────────────────────────────────────────────────────────

describe('INT7 component source probe', () => {
  const componentPath = path.resolve(
    __dirname,
    '../../../components/intelligence/IntelligenceLensTabs.tsx',
  );

  it('IntelligenceLensTabs.tsx imports buildEngagementScorecardView', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('buildEngagementScorecardView');
  });

  it('component renders engagement_scorecard tab', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain("activeTab === 'engagement_scorecard'");
  });

  it('component contains EngagementScorecardPanel function', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toMatch(/function EngagementScorecardPanel/);
  });

  it('EngagementScorecardPanel has intelligence-engagement-scorecard-panel testid', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-engagement-scorecard-panel');
  });

  it('EngagementScorecardPanel has intelligence-engagement-scorecard-summary testid', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-engagement-scorecard-summary');
  });

  it('EngagementScorecardPanel has per-programme testids', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-scorecard-${prog.programmeId}');
  });

  it('EngagementScorecardPanel has honest disclaimer testid', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toContain('intelligence-engagement-scorecard-disclaimer');
  });

  it('disclaimer text starts with "Deterministic seed"', () => {
    const src = fs.readFileSync(componentPath, 'utf8');
    expect(src).toMatch(/Deterministic seed · Engagement scorecard/);
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
