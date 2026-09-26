import { checkProhibitions } from '../forbidden-claims';
import type { InspectedDeck } from '../../orchestrator/deck-inspection';

const deckOf = (...runs: string[]): InspectedDeck => ({
  canvasWidthIn: 13.333,
  canvasHeightIn: 7.5,
  slideCount: 1,
  slides: [
    { index: 1, textRuns: runs, visibleChars: runs.join('').length, tableCount: 0, pictureCount: 0, chartCount: 0, offCanvas: [] },
  ],
});

const PROHIBITIONS = [
  'Do not claim Databricks or medallion architecture is implemented.',
  'Do not claim a production longitudinal patient view exists.',
  'Do not claim automation savings without baseline and adoption evidence.',
];

describe('explicit claim prohibitions against a rendered deck', () => {
  it('flags an assertion of a prohibited claim', () => {
    const v = checkProhibitions(
      deckOf('The medallion architecture is implemented across the Databricks lakehouse.'),
      PROHIBITIONS,
    );
    expect(v.clean).toBe(false);
    expect(v.findings[0].matchedTerms).toEqual(expect.arrayContaining(['medallion', 'databricks']));
  });

  it('does NOT flag the compliant denial of the same claim', () => {
    // "No certified medallion architecture" carries the subject and a verb and
    // is exactly what the corpus wants the deck to say. Flagging it would make
    // the honest sentence the expensive one.
    const v = checkProhibitions(
      deckOf('No certified medallion architecture exists on the Databricks estate today.'),
      PROHIBITIONS,
    );
    expect(v.findings).toEqual([]);
  });

  it('does not flag a conditional or pending form', () => {
    const v = checkProhibitions(
      deckOf('Databricks medallion architecture is required before any benefit is claimed.'),
      PROHIBITIONS,
    );
    expect(v.findings).toEqual([]);
  });

  it('needs two distinctive terms, not one', () => {
    // "architecture" alone appears on half a target-state deck. One shared word
    // would flag everything and train the reader to ignore the check.
    const v = checkProhibitions(deckOf('The target architecture is approved.'), PROHIBITIONS);
    expect(v.findings).toEqual([]);
  });

  it('flags a savings claim made without the evidence the prohibition names', () => {
    const v = checkProhibitions(
      deckOf('Automation delivered savings of $4.0M across the service desk.'),
      ['Do not claim automation savings without baseline and adoption evidence.'],
    );
    expect(v.clean).toBe(false);
    expect(v.findings[0].assertionVerb.toLowerCase()).toContain('delivered');
  });

  it('reports what it scanned, so a vacuous run is visible', () => {
    // A run over an empty prohibition list must not read as a clean run.
    const none = checkProhibitions(deckOf('anything at all here'), []);
    expect(none.clean).toBe(true);
    expect(none.prohibitionsChecked).toBe(0);
    expect(none.sentencesScanned).toBeGreaterThan(0);
  });

  it('names the slide and the triggering sentence for review', () => {
    const v = checkProhibitions(
      deckOf('The medallion architecture is implemented on Databricks.'),
      PROHIBITIONS,
    );
    expect(v.findings[0]).toMatchObject({ slide: 1 });
    expect(v.findings[0].sentence).toContain('medallion');
  });
});
