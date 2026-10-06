import {
  PHASE_LABELS,
  PHASE_LABELS_SHORT,
  PHASE_CODES,
  TOTAL_PHASES,
  getPhaseLabel,
  getPhaseLabelShort,
  getPhaseName,
  getMovesStageLabel,
  getMovesStageName,
} from '@/lib/programs/phase-labels';
import { DELIVERABLE_REGISTRY } from '@/lib/programs/deliverable-registry';
import { PRODUCT_CAPABILITY_REGISTRY } from '@/lib/agent/product-truth/capability-registry';
import { PHASE_LABELS as TEMPLATE_PHASE_LABELS } from '@/lib/programs/phase-templates/types';
import { MOVES_EXECUTION_PHASE_LABELS } from '@/lib/intelligence/ask/answer-mode-registry';

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

  it('provides phase names from the canonical label source', () => {
    expect([2, 3, 4, 5].map(getPhaseName)).toEqual([
      'Discover & Diagnose',
      'Design Future State',
      'Roadmap & Business Case',
      'Mobilize & Handoff',
    ]);
  });

  it('keeps Tower after P5 without inventing a P6 phase', () => {
    expect(getMovesStageLabel(5)).toBe('P5 Mobilize & Handoff');
    expect(getMovesStageLabel(6)).toBe('Tower Track Outcomes');
    expect(getMovesStageName(6)).toBe('Tower Track Outcomes');
  });

  it('keeps agent, template, and deliverable vocabularies aligned', () => {
    expect(MOVES_EXECUTION_PHASE_LABELS.slice(0, TOTAL_PHASES)).toEqual(
      Array.from({ length: TOTAL_PHASES }, (_, phase) => PHASE_LABELS[phase]),
    );
    expect(TEMPLATE_PHASE_LABELS).toEqual({
      P2: getPhaseName(2),
      P3: getPhaseName(3),
      P4: getPhaseName(4),
      P5: getPhaseName(5),
      TOWER: 'Track Outcomes',
    });
    for (const deliverable of DELIVERABLE_REGISTRY) {
      expect(deliverable.phaseLabel).toBe(getPhaseLabel(deliverable.phase));
    }
    const movesCapability = PRODUCT_CAPABILITY_REGISTRY.find(
      (entry) => entry.key === 'moves_p0_p5_governance',
    );
    for (const phase of [2, 3, 4, 5]) {
      expect(movesCapability?.claimGuidance).toContain(PHASE_LABELS[phase]);
    }
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
