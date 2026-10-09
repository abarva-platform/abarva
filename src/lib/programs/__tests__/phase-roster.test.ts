import {
  PHASE_ROSTER,
  getPhaseChipLabel,
  getPhaseRosterName,
} from '../phase-roster';
import {
  PHASE_CODES,
  PHASE_LABELS,
  PHASE_LABELS_SHORT,
  TOTAL_PHASES,
} from '../phase-labels';

describe('PHASE_ROSTER', () => {
  it('covers every canonical phase, in order, with no gaps', () => {
    expect(PHASE_ROSTER).toHaveLength(TOTAL_PHASES);
    expect(PHASE_ROSTER.map((entry) => entry.phase)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('includes P5 Mobilize, which the retired five-entry arrays dropped', () => {
    const last = PHASE_ROSTER[PHASE_ROSTER.length - 1];
    expect(last.phase).toBe(5);
    expect(last.code).toBe('P5');
    expect(last.shortLabel).toBe('Mobilize');
    expect(last.label).toBe('P5 Mobilize & Handoff');
  });

  it('carries no Build, Execute or Verify phase — the doctrine retired them', () => {
    const names = PHASE_ROSTER.flatMap((entry) => [entry.label, entry.shortLabel]);
    for (const retired of ['Build', 'Execute', 'Verify', 'Start', 'Intake']) {
      expect(names).not.toContain(retired);
    }
  });

  it('derives each entry from the canonical phase model rather than a literal', () => {
    for (const entry of PHASE_ROSTER) {
      expect(entry.code).toBe(PHASE_CODES[entry.phase]);
      expect(entry.label).toBe(PHASE_LABELS[entry.phase]);
      expect(entry.shortLabel).toBe(PHASE_LABELS_SHORT[entry.phase]);
    }
  });

  it('names each phase as the doctrine does, not as the drifted arrays did', () => {
    expect(PHASE_ROSTER.map((entry) => entry.shortLabel)).toEqual([
      'Originate',
      'Charter',
      'Discover',
      'Design',
      'Roadmap',
      'Mobilize',
    ]);
  });

  it('puts Discover at P2, where the drifted arrays put Design', () => {
    expect(PHASE_ROSTER[2].shortLabel).toBe('Discover');
    expect(PHASE_ROSTER[3].shortLabel).toBe('Design');
  });
});

describe('getPhaseChipLabel', () => {
  it('upper-cases the space-tight name for a monospace chip', () => {
    expect(getPhaseChipLabel(0)).toBe('ORIGINATE');
    expect(getPhaseChipLabel(1)).toBe('CHARTER');
    expect(getPhaseChipLabel(2)).toBe('DISCOVER');
    expect(getPhaseChipLabel(3)).toBe('DESIGN');
    expect(getPhaseChipLabel(4)).toBe('ROADMAP');
  });

  it('labels P5, where a five-entry array rendered a dangling separator', () => {
    expect(getPhaseChipLabel(5)).toBe('MOBILIZE');
  });

  it('never renders an empty chip for a phase outside the canonical range', () => {
    expect(getPhaseChipLabel(6)).toBe('P6');
    expect(getPhaseChipLabel(99)).toBe('P99');
    expect(getPhaseChipLabel(-1)).toBe('P-1');
  });

  it('treats an absent phase as P0 rather than blank', () => {
    expect(getPhaseChipLabel(null)).toBe('ORIGINATE');
    expect(getPhaseChipLabel(undefined)).toBe('ORIGINATE');
  });
});

describe('getPhaseRosterName', () => {
  it('names every canonical phase for prose and for model prompts', () => {
    expect(getPhaseRosterName(0)).toBe('Originate');
    expect(getPhaseRosterName(2)).toBe('Discover');
    expect(getPhaseRosterName(4)).toBe('Roadmap');
  });

  it('names P5, which a five-entry array rendered as undefined', () => {
    expect(getPhaseRosterName(5)).toBe('Mobilize');
    expect(getPhaseRosterName(5)).not.toBeUndefined();
  });

  it('falls back to a readable stand-in past the canonical range', () => {
    expect(getPhaseRosterName(6)).toBe('Phase 6');
  });

  it('treats an absent phase as P0', () => {
    expect(getPhaseRosterName(null)).toBe('Originate');
    expect(getPhaseRosterName(undefined)).toBe('Originate');
  });
});
