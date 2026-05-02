import { PROGRAM_PHASE_LABELS } from '../working-pane-shape';

describe('PROGRAM_PHASE_LABELS', () => {
  it('uses the canonical Programs lifecycle labels', () => {
    expect(PROGRAM_PHASE_LABELS).toMatchObject({
      P0: 'Origination',
      P1: 'Discovery',
      P2: 'Synthesis',
      P3: 'Design',
      P4: 'Execution Roadmap',
      P5: 'Approval & Mobilization',
      P6: 'Tower Handoff',
    });
  });
});
