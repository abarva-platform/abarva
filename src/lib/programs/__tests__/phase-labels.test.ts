import { PHASE_LABELS, getPhaseLabel } from '@/lib/programs/phase-labels';

describe('phase-labels', () => {
  it('maps P0 through P7', () => {
    expect(PHASE_LABELS[0]).toBe('P0 Originate');
    expect(PHASE_LABELS[1]).toBe('P1 Charter');
    expect(PHASE_LABELS[2]).toBe('P2 Diagnose');
    expect(PHASE_LABELS[3]).toBe('P3 Solution Design');
    expect(PHASE_LABELS[4]).toBe('P4 Build');
    expect(PHASE_LABELS[5]).toBe('P5 Execute');
    expect(PHASE_LABELS[6]).toBe('P6 Verify');
    expect(PHASE_LABELS[7]).toBe('P7 Handoff');
  });

  it('returns fallback for unknown phases', () => {
    expect(getPhaseLabel(12)).toBe('P12');
  });
});

