import {
  buildPhaseWorkflow,
  type PhaseEvidenceSignal,
  type PhaseGateSignal,
} from '../phase-workflow';

const ev = (
  priority: PhaseEvidenceSignal['priority'],
  status: PhaseEvidenceSignal['status'],
): PhaseEvidenceSignal => ({ priority, status });
const g = (completed: boolean, severity: PhaseGateSignal['severity'] = 'hard'): PhaseGateSignal => ({
  completed,
  severity,
});

describe('buildPhaseWorkflow — deterministic, real-signal task model', () => {
  it('all required evidence in + all hard gates met → advance is unlocked', () => {
    const wf = buildPhaseWorkflow({
      phaseLabel: 'P2 · Discover',
      nextPhaseLabel: 'P3 · Design',
      evidence: [ev('required', 'covered'), ev('required', 'waived'), ev('optional', 'missing')],
      gate: [g(true), g(true), g(false, 'soft')],
    });
    expect(wf.canAdvance).toBe(true);
    expect(wf.doneCount).toBe(2);
    expect(wf.tasks.find((t) => t.id === 'evidence')!.status).toBe('done');
    expect(wf.tasks.find((t) => t.id === 'gate')!.status).toBe('done');
    expect(wf.tasks.find((t) => t.id === 'advance')!.status).toBe('active');
    expect(wf.tasks.find((t) => t.id === 'advance')!.title).toContain('P3 · Design');
  });

  it('missing required evidence → evidence active, gate todo, advance locked', () => {
    const wf = buildPhaseWorkflow({
      phaseLabel: 'P2',
      nextPhaseLabel: 'P3',
      evidence: [ev('required', 'covered'), ev('required', 'missing')],
      gate: [g(false)],
    });
    expect(wf.canAdvance).toBe(false);
    expect(wf.tasks.find((t) => t.id === 'evidence')!.status).toBe('active');
    expect(wf.tasks.find((t) => t.id === 'evidence')!.progressLabel).toBe('1 of 2 in');
    // gate is genuinely unmet AND evidence isn't done → sequenced to "todo"
    expect(wf.tasks.find((t) => t.id === 'gate')!.status).toBe('todo');
    expect(wf.tasks.find((t) => t.id === 'advance')!.status).toBe('locked');
  });

  it('evidence done but a hard gate unmet → gate active, advance locked', () => {
    const wf = buildPhaseWorkflow({
      phaseLabel: 'P2',
      nextPhaseLabel: 'P3',
      evidence: [ev('required', 'covered')],
      gate: [g(true), g(false)],
    });
    expect(wf.tasks.find((t) => t.id === 'gate')!.status).toBe('active');
    expect(wf.tasks.find((t) => t.id === 'gate')!.progressLabel).toBe('1 of 2 met');
    expect(wf.canAdvance).toBe(false);
  });

  it('counts only HARD gates for done; soft criteria do not block', () => {
    const wf = buildPhaseWorkflow({
      phaseLabel: 'P2',
      nextPhaseLabel: 'P3',
      evidence: [ev('required', 'covered')],
      gate: [g(true, 'hard'), g(false, 'soft')],
    });
    expect(wf.tasks.find((t) => t.id === 'gate')!.status).toBe('done');
    expect(wf.canAdvance).toBe(true);
  });

  it('no next phase → advance task reads "hand off to Tower"', () => {
    const wf = buildPhaseWorkflow({
      phaseLabel: 'P5',
      nextPhaseLabel: null,
      evidence: [ev('required', 'covered')],
      gate: [g(true)],
    });
    expect(wf.tasks.find((t) => t.id === 'advance')!.title.toLowerCase()).toContain('tower');
  });

  it('falls back to the full set when nothing is marked required (no vacuous "done")', () => {
    const wf = buildPhaseWorkflow({
      phaseLabel: 'P2',
      nextPhaseLabel: 'P3',
      evidence: [ev('recommended', 'missing'), ev('optional', 'covered')],
      gate: [],
    });
    // 1 of 2 satisfied → not done
    expect(wf.tasks.find((t) => t.id === 'evidence')!.status).toBe('active');
    expect(wf.tasks.find((t) => t.id === 'evidence')!.progressLabel).toBe('1 of 2 in');
  });
});
