// INT8 · Milestone Tracker view-model integration tests.
//
// Pure deterministic coverage of milestone-tracker-view.ts.
// No React rendering, no DOM, no model calls.

import * as fs from 'fs';
import * as path from 'path';

import {
  buildMilestoneTrackerView,
  type MilestoneTrackerView,
} from '@/lib/intelligence/milestone-tracker-view';

// ─────────────────────────────────────────────────────────────────────────────
// Lib source audit — forbidden import check
// ─────────────────────────────────────────────────────────────────────────────

describe('milestone-tracker-view lib source audit', () => {
  const libPath = path.resolve(
    __dirname,
    '../../../lib/intelligence/milestone-tracker-view.ts',
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(libPath, 'utf8');
  });

  it('file exists', () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it('does not import from src/lib/source', () => {
    expect(src).not.toMatch(/@\/lib\/source/);
  });

  it('does not import from src/lib/sentinel', () => {
    expect(src).not.toMatch(/@\/lib\/sentinel/);
  });

  it('does not import from src/lib/atlas', () => {
    expect(src).not.toMatch(/@\/lib\/atlas/);
  });

  it('does not import from src/lib/nexus', () => {
    expect(src).not.toMatch(/@\/lib\/nexus/);
  });

  it('does not import from src/lib/agent', () => {
    expect(src).not.toMatch(/@\/lib\/agent/);
  });

  it('does not import from src/lib/auth', () => {
    expect(src).not.toMatch(/@\/lib\/auth/);
  });

  it('does not import from supabase (import statement only)', () => {
    expect(src).not.toMatch(/from ['"].*supabase/);
  });

  it('does not call fetch, Date.now, Math.random, or new Date', () => {
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
    expect(src).not.toMatch(/Math\.random\s*\(/);
    expect(src).not.toMatch(/new Date\s*\(/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Runtime contract
// ─────────────────────────────────────────────────────────────────────────────

describe('buildMilestoneTrackerView runtime contract', () => {
  let view: MilestoneTrackerView;

  beforeAll(() => {
    view = buildMilestoneTrackerView();
  });

  // Determinism
  it('returns deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('is pure — same input yields identical output', () => {
    const a = buildMilestoneTrackerView();
    const b = buildMilestoneTrackerView();
    expect(a).toEqual(b);
  });

  // Programme shape
  it('returns exactly 4 programmes', () => {
    expect(view.programmes).toHaveLength(4);
  });

  it('contains the four expected programme IDs', () => {
    const ids = view.programmes.map((p) => p.programmeId);
    expect(ids).toContain('APX-AMS-2026');
    expect(ids).toContain('APX-CDP-2026');
    expect(ids).toContain('APX-SA-2026');
    expect(ids).toContain('APX-DF-2026');
  });

  it('each programme has a non-empty programmeCode and programmeName', () => {
    for (const prog of view.programmes) {
      expect(prog.programmeCode.length).toBeGreaterThan(0);
      expect(prog.programmeName.length).toBeGreaterThan(0);
    }
  });

  // Milestone counts per programme
  it('APX-AMS-2026 has exactly 4 milestones', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.milestones).toHaveLength(4);
  });

  it('APX-CDP-2026 has exactly 4 milestones', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.milestones).toHaveLength(4);
  });

  it('APX-SA-2026 has exactly 4 milestones', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    expect(prog.milestones).toHaveLength(4);
  });

  it('APX-DF-2026 has exactly 4 milestones', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    expect(prog.milestones).toHaveLength(4);
  });

  // AMS milestone statuses
  it('APX-AMS-2026: M-AMS-001 is blocked', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    const ms = prog.milestones.find((m) => m.milestoneId === 'M-AMS-001')!;
    expect(ms.status).toBe('blocked');
    expect(ms.milestoneType).toBe('gate');
  });

  it('APX-AMS-2026: M-AMS-004 is blocked', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    const ms = prog.milestones.find((m) => m.milestoneId === 'M-AMS-004')!;
    expect(ms.status).toBe('blocked');
    expect(ms.milestoneType).toBe('gate');
  });

  it('APX-AMS-2026: M-AMS-002 and M-AMS-003 are at_risk', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-AMS-2026')!;
    expect(prog.milestones.find((m) => m.milestoneId === 'M-AMS-002')!.status).toBe('at_risk');
    expect(prog.milestones.find((m) => m.milestoneId === 'M-AMS-003')!.status).toBe('at_risk');
  });

  // CDP milestone statuses
  it('APX-CDP-2026: M-CDP-001 and M-CDP-004 are blocked', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.milestones.find((m) => m.milestoneId === 'M-CDP-001')!.status).toBe('blocked');
    expect(prog.milestones.find((m) => m.milestoneId === 'M-CDP-004')!.status).toBe('blocked');
  });

  it('APX-CDP-2026: M-CDP-002 and M-CDP-003 are at_risk', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026')!;
    expect(prog.milestones.find((m) => m.milestoneId === 'M-CDP-002')!.status).toBe('at_risk');
    expect(prog.milestones.find((m) => m.milestoneId === 'M-CDP-003')!.status).toBe('at_risk');
  });

  // SA milestone statuses
  it('APX-SA-2026: M-SA-003 is on_track', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    const ms = prog.milestones.find((m) => m.milestoneId === 'M-SA-003')!;
    expect(ms.status).toBe('on_track');
    expect(ms.milestoneType).toBe('review');
    expect(ms.blockerSummary).toBeNull();
  });

  it('APX-SA-2026: M-SA-001 and M-SA-002 and M-SA-004 are at_risk', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-SA-2026')!;
    expect(prog.milestones.find((m) => m.milestoneId === 'M-SA-001')!.status).toBe('at_risk');
    expect(prog.milestones.find((m) => m.milestoneId === 'M-SA-002')!.status).toBe('at_risk');
    expect(prog.milestones.find((m) => m.milestoneId === 'M-SA-004')!.status).toBe('at_risk');
  });

  // DF — fully on track
  it('APX-DF-2026: all 4 milestones are on_track', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    for (const ms of prog.milestones) {
      expect(ms.status).toBe('on_track');
    }
  });

  it('APX-DF-2026: all milestones have null blockerSummary', () => {
    const prog = view.programmes.find((p) => p.programmeId === 'APX-DF-2026')!;
    for (const ms of prog.milestones) {
      expect(ms.blockerSummary).toBeNull();
    }
  });

  // blockerSummary: blocked + at_risk items must have non-null summaries
  it('blocked milestones always have a non-null blockerSummary', () => {
    for (const prog of view.programmes) {
      for (const ms of prog.milestones) {
        if (ms.status === 'blocked') {
          expect(ms.blockerSummary).not.toBeNull();
        }
      }
    }
  });

  it('at_risk milestones always have a non-null blockerSummary', () => {
    for (const prog of view.programmes) {
      for (const ms of prog.milestones) {
        if (ms.status === 'at_risk') {
          expect(ms.blockerSummary).not.toBeNull();
        }
      }
    }
  });

  // All milestones have non-empty fields
  it('all milestones have non-empty milestoneId, milestoneName, targetPeriod, sentinelNote', () => {
    for (const prog of view.programmes) {
      for (const ms of prog.milestones) {
        expect(ms.milestoneId.length).toBeGreaterThan(0);
        expect(ms.milestoneName.length).toBeGreaterThan(0);
        expect(ms.targetPeriod.length).toBeGreaterThan(0);
        expect(ms.sentinelNote.length).toBeGreaterThan(0);
      }
    }
  });

  // Valid enum values
  it('all milestoneType values are in the valid set', () => {
    const VALID_TYPES = new Set(['gate', 'review', 'decision', 'delivery']);
    for (const prog of view.programmes) {
      for (const ms of prog.milestones) {
        expect(VALID_TYPES.has(ms.milestoneType)).toBe(true);
      }
    }
  });

  it('all milestoneStatus values are in the valid set', () => {
    const VALID_STATUSES = new Set(['on_track', 'at_risk', 'overdue', 'blocked']);
    for (const prog of view.programmes) {
      for (const ms of prog.milestones) {
        expect(VALID_STATUSES.has(ms.status)).toBe(true);
      }
    }
  });

  // Metrics
  it('metrics.totalMilestones is 16', () => {
    expect(view.metrics.totalMilestones).toBe(16);
  });

  it('metrics.blockedCount is 4', () => {
    expect(view.metrics.blockedCount).toBe(4);
  });

  it('metrics.atRiskCount is 7', () => {
    expect(view.metrics.atRiskCount).toBe(7);
  });

  it('metrics.onTrackCount is 5', () => {
    expect(view.metrics.onTrackCount).toBe(5);
  });

  it('metrics.programmesWithBlockers is 2', () => {
    expect(view.metrics.programmesWithBlockers).toBe(2);
  });

  it('metrics counts sum to totalMilestones', () => {
    const { blockedCount, atRiskCount, onTrackCount } = view.metrics;
    // Note: overdue would also count; sum of named statuses should equal total
    expect(blockedCount + atRiskCount + onTrackCount).toBe(view.metrics.totalMilestones);
  });

  it('atlasSummary is a non-empty string', () => {
    expect(typeof view.atlasSummary).toBe('string');
    expect(view.atlasSummary.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Component source probe — INT8 component integration
// ─────────────────────────────────────────────────────────────────────────────

describe('INT8 component source probe', () => {
  const componentPath = path.resolve(
    __dirname,
    '../../../components/intelligence/IntelligenceLensTabs.tsx',
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf8');
  });

  it('IntelligenceLensTabs.tsx file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('imports buildMilestoneTrackerView', () => {
    expect(src).toContain('buildMilestoneTrackerView');
  });

  it('imports from milestone-tracker-view', () => {
    expect(src).toMatch(/milestone-tracker-view/);
  });

  it('renders milestone_tracker tab case', () => {
    expect(src).toMatch(/activeTab === 'milestone_tracker'/);
  });

  it('contains MilestoneTrackerPanel function', () => {
    expect(src).toMatch(/function MilestoneTrackerPanel/);
  });

  it('contains intelligence-milestone-tracker-panel testid', () => {
    expect(src).toContain('intelligence-milestone-tracker-panel');
  });

  it('contains intelligence-milestone-tracker-disclaimer testid', () => {
    expect(src).toContain('intelligence-milestone-tracker-disclaimer');
  });

  it('disclaimer uses data-honest-disclaimer attribute', () => {
    expect(src).toContain('data-honest-disclaimer="intelligence-milestone-tracker"');
  });

  it('disclaimer starts with "Deterministic seed"', () => {
    expect(src).toMatch(/Deterministic seed.*[Mm]ilestone/);
  });

  it('does not call fetch or Date.now', () => {
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/Date\.now\s*\(/);
  });
});
