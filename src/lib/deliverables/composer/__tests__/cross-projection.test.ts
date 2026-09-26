import { validateCrossProjection, type MaterialClaims } from '../cross-projection';
import type { InspectedDeck } from '../../orchestrator/deck-inspection';

const deckOf = (...runs: string[]): InspectedDeck => ({
  canvasWidthIn: 13.333,
  canvasHeightIn: 7.5,
  slideCount: 1,
  slides: [
    { index: 1, textRuns: runs, visibleChars: runs.join('').length, tableCount: 0, pictureCount: 0, chartCount: 0, offCanvas: [] },
  ],
});

const CLAIMS: MaterialClaims = {
  askTerms: ['approve', 'fund'],
  selectedOptions: ['Selective Replatform'],
  headlineFigures: ['$53M', '32.6%'],
  materialDates: ['2028-06-30'],
  owners: ['Architecture Steering Committee'],
};

describe('DOCX to PPTX material consistency', () => {
  it('passes a deck that carries every material claim', () => {
    const v = validateCrossProjection(
      deckOf(
        'Approve the Selective Replatform pattern',
        '$53M identified savings; five contracts carry 32.6%',
        'Renewal 2028-06-30',
        'Architecture Steering Committee owns the gate',
      ),
      CLAIMS,
    );
    expect(v.findings).toEqual([]);
  });

  it('accepts a reformatted figure', () => {
    // The deck may write $53,000,000 where the document wrote $53M.
    const v = validateCrossProjection(
      deckOf('Approve', 'Selective Replatform', '53M in savings, 32.6% concentration', '2028-06-30', 'Architecture Steering Committee'),
      CLAIMS,
    );
    expect(v.findings).toEqual([]);
  });

  it('blocks a deck that drops the decision ask', () => {
    const v = validateCrossProjection(
      deckOf('Selective Replatform', '$53M', '32.6%', '2028-06-30', 'Architecture Steering Committee'),
      CLAIMS,
    );
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'missing_ask' }));
  });

  it('blocks a deck that never names the selected option', () => {
    const v = validateCrossProjection(
      deckOf('Approve the plan', '$53M', '32.6%', '2028-06-30', 'Architecture Steering Committee'),
      CLAIMS,
    );
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'missing_option' }));
  });

  it('blocks a deck that loses a headline figure', () => {
    const v = validateCrossProjection(
      deckOf('Approve Selective Replatform', '32.6% concentration', '2028-06-30', 'Architecture Steering Committee'),
      CLAIMS,
    );
    expect(v.findings).toContainEqual(expect.objectContaining({ kind: 'missing_figure', figure: '$53M' }));
  });

  it('blocks a deck that loses a material date or a named owner', () => {
    const v = validateCrossProjection(
      deckOf('Approve Selective Replatform', '$53M', '32.6%'),
      CLAIMS,
    );
    expect(v.findings.map((f) => f.kind).sort()).toEqual(['missing_date', 'missing_owner']);
  });
});
