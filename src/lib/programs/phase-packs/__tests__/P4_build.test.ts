import type { PhasePack } from '../types';
import { P4_BUILD } from '../P4_build';

describe('P4 Execution Roadmap · PhasePack contract', () => {
  it('conforms to PhasePack and uses corrected strategy-tool label', () => {
    const pack: PhasePack = P4_BUILD;
    expect(pack.phase).toBe(4);
    expect(pack.label).toBe('P4 Execution Roadmap');
    expect(pack.outcome).toContain('external delivery');
    expect(pack.outcome).toContain('P4 is not where Nexus executes the build');
  });

  it('requires roadmap, milestones, success criteria, estimates, and Tower monitoring', () => {
    const dodIds = P4_BUILD.definitionOfDone.map((d) => d.id);
    expect(dodIds).toEqual(expect.arrayContaining([
      'execution-roadmap-drafted',
      'execution-milestones-defined',
      'execution-success-criteria-defined',
      'estimate-range-with-assumptions',
      'tower-monitoring-requirements-drafted',
    ]));
  });

  it('declares 8 strategy-to-execution-planning steps', () => {
    const ids = (P4_BUILD.steps ?? []).map((s) => s.id);
    expect(ids).toEqual([
      'p4-handoff-ingest',
      'p4-workstreams',
      'p4-milestones',
      'p4-estimates',
      'p4-gap-manifest',
      'p4-raci',
      'p4-governance',
      'p4-readiness',
    ]);
  });

  it('blocks accidental build-mode behavior', () => {
    expect(P4_BUILD.antiPatterns.map((a) => a.id)).toContain('accidental-build-mode');
    expect(P4_BUILD.rightQuestions.open.map((q) => q.id)).toContain('roadmap-boundary');
  });
});
