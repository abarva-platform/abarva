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

  it('does not flag a denial written with "nothing" or "zero"', () => {
    // Real false positive: "nothing yet finance-validated" is the compliant
    // statement, and the first version of the negation list had no "nothing".
    const v = checkProhibitions(
      deckOf('Promised value stands at $8.0M with nothing yet finance-validated by the CFO.'),
      ['Do not claim realized AI value unless tower_claim_allowed is yes.'],
    );
    expect(v.findings).toEqual([]);
  });

  it('does not flag a column header or a short label', () => {
    // "Finance-validated value" was flagged twice on a real deck. A label is not
    // a claim, and the same token supplied both the subject and the verb.
    const v = checkProhibitions(
      deckOf('FINANCE-VALIDATED', 'Finance-validated value'),
      ['Do not claim realized AI value unless tower_claim_allowed is yes.'],
    );
    expect(v.findings).toEqual([]);
  });

  it('does not flag a conditional value hypothesis', () => {
    const v = checkProhibitions(
      deckOf('Improve agent assist and next-best-action only after transcript and intent evidence is governed.'),
      ['Do not claim real-time agent assist is live.'],
    );
    expect(v.findings).toEqual([]);
  });

  it('needs a term distinctive to that prohibition, not shared boilerplate', () => {
    // Every prohibition in a governance corpus repeats "value", "claim",
    // "approved", "funding". A sentence matching only those has matched the
    // vocabulary of the list, not the subject of any item in it.
    const boilerplate = [
      'Do not claim approved funding creates value.',
      'Do not claim value without approved funding evidence.',
      'Interview context cannot create approved funding or value claims.',
    ];
    const v = checkProhibitions(
      deckOf('Approved funding of $16.0M against $6.7M incurred year to date is the current position.'),
      boilerplate,
    );
    expect(v.findings).toEqual([]);
  });

  it('catches a violation written with "and" where the prohibition used a slash', () => {
    // A planted control missed this: "HEDIS/STAR" tokenised as one term, so a
    // deck saying "HEDIS and STAR" matched only "outputs".
    const v = checkProhibitions(
      deckOf('HEDIS and STAR outputs are audited and certified by the quality office.'),
      ['Do not claim HEDIS/STAR outputs are audited.'],
    );
    expect(v.clean).toBe(false);
    expect(v.findings[0].matchedTerms).toEqual(expect.arrayContaining(['hedis', 'star']));
  });

  it('needs the sentence to engage the prohibition subject, not just its predicate', () => {
    // Real false positive: a slide citing approved funding from a budget record
    // matched "Interview context cannot create approved funding or value
    // claims" on the words after the subject. It never mentions interviews.
    const v = checkProhibitions(
      deckOf('Approved funding of $16.0M against $6.7M incurred year to date is the current position.'),
      ['Interview context cannot create approved funding or value claims.'],
    );
    expect(v.findings).toEqual([]);

    // The same prohibition still fires on a sentence that IS about interviews.
    const real = checkProhibitions(
      deckOf('Interview context from the executive workshop confirms approved funding of $16.0M is committed.'),
      ['Interview context cannot create approved funding or value claims.'],
    );
    expect(real.clean).toBe(false);
  });

  it('treats denial by quantity as a denial', () => {
    // "$0 of the $8.0M promised value is validated" denies the claim with a
    // number rather than a negation word. Three of four false positives on one
    // deck were this shape.
    const v = checkProhibitions(
      deckOf('$0 of the $8.0M promised value is finance-validated despite $16.0M of approved funding.'),
      ['Do not claim realized ROI, Tower value, or savings until measured evidence exists.'],
    );
    expect(v.findings).toEqual([]);
  });

  it('does not flag a sentence carrying the qualifier the prohibition demands', () => {
    // The most compliant sentence in the deck was flagged against the rule it
    // was satisfying.
    const v = checkProhibitions(
      deckOf('Every one is labelled a synthetic planning figure — as is the $427.2M uploaded cost base.'),
      ['Do not present the cost or KPI figures as measured. Every one is synthetic planning evidence.'],
    );
    expect(v.findings).toEqual([]);
  });

  it('does not flag a sentence naming what must still be provided', () => {
    // Listing the artifacts an owner has requested is the compliant framing; it
    // asserts nothing about realized value.
    const v = checkProhibitions(
      deckOf('Monthly usage export, KPI baseline/actual report, and a finance value attestation — the three artifacts the named business owner has already requested.'),
      ['Do not claim realized AI value unless tower_claim_allowed is partial/yes and finance_validated_value_usd is populated.'],
    );
    expect(v.findings).toEqual([]);
  });

  it('still flags the same subject asserted WITHOUT the qualifier', () => {
    // The compliance rule must not become a blanket exemption.
    const v = checkProhibitions(
      deckOf('The $427.2M cost base is measured and confirmed by Finance for the contact centre.'),
      ['Do not present the cost or KPI figures as measured.'],
    );
    expect(v.clean).toBe(false);
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
