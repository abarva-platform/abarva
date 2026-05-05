import {
  PHASE_LABELS,
  PHASE_LABELS_SHORT,
  PHASE_CODES,
  TOTAL_PHASES,
  getPhaseLabel,
  getPhaseLabelShort,
} from '@/lib/programs/phase-labels';

describe('phase-labels', () => {
  it('maps P0 through P5 with the doctrine labels', () => {
    expect(PHASE_LABELS[0]).toBe('P0 Originate');
    expect(PHASE_LABELS[1]).toBe('P1 Charter');
    expect(PHASE_LABELS[2]).toBe('P2 Discover & Diagnose');
    expect(PHASE_LABELS[3]).toBe('P3 Design Future State');
    expect(PHASE_LABELS[4]).toBe('P4 Roadmap & Business Case');
    expect(PHASE_LABELS[5]).toBe('P5 Mobilize & Handoff');
    expect(PHASE_LABELS[6]).toBeUndefined();
    expect(PHASE_LABELS[7]).toBeUndefined();
  });

  it('provides short rail labels for P0–P5', () => {
    expect(PHASE_LABELS_SHORT[0]).toBe('Originate');
    expect(PHASE_LABELS_SHORT[1]).toBe('Charter');
    expect(PHASE_LABELS_SHORT[2]).toBe('Diagnose');
    expect(PHASE_LABELS_SHORT[3]).toBe('Design');
    expect(PHASE_LABELS_SHORT[4]).toBe('Roadmap');
    expect(PHASE_LABELS_SHORT[5]).toBe('Mobilize');
  });

  it('exposes the canonical six-phase shape', () => {
    expect(TOTAL_PHASES).toBe(6);
    expect(PHASE_CODES).toEqual(['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);
  });

  it('returns fallback for unknown phases', () => {
    expect(getPhaseLabel(12)).toBe('P12');
    expect(getPhaseLabelShort(12)).toBe('P12');
  });

  it('defaults nullish phases to Originate', () => {
    expect(getPhaseLabel(null)).toBe('P0 Originate');
    expect(getPhaseLabel(undefined)).toBe('P0 Originate');
    expect(getPhaseLabelShort(null)).toBe('Originate');
    expect(getPhaseLabelShort(undefined)).toBe('Originate');
  });
});

