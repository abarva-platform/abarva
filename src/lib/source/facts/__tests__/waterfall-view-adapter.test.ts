// The live adapter maps evaluator ValueLeverResult[] → the canvas value-waterfall
// view. Doctrine under test: a computed lever becomes a quantified, cited band with
// the right amounts; an insufficient lever becomes a 'insufficient_evidence' band
// with NO amount and NO $0-as-a-finding; provenance is 'live'; the roll-up totals
// only quantified bands.

import {
  buildLiveWaterfallView,
  leverResultToBandView,
  quantifiedRollup,
} from '../view/waterfall-view-adapter';
import type { ValueLeverResult } from '../evaluators/types';
import type { FactSourceCitation } from '../fact-types';

const ARCHETYPE_ID = 'AMS_MANAGED_SERVICES';

function lever(over: Partial<ValueLeverResult>): ValueLeverResult {
  return {
    key: 'AMS.ENHANCEMENT_LEAKAGE',
    name: 'Enhancement / change-order leakage',
    valueType: 'protected',
    low: 100_000,
    high: 200_000,
    confidence: 'med',
    basis: 'b',
    evidenceRefs: [
      { factKey: 'annual_change_order_spend', value: 1_000_000 },
      { factKey: 'recurring_avoidable_pct', value: 20 },
    ],
    derivationTrace: 't',
    insufficientEvidence: false,
    missingEvidence: [],
    ...over,
  };
}

const CITATIONS: Record<string, FactSourceCitation | null> = {
  annual_change_order_spend: {
    doc: 'Incumbent AMS contract',
    locator: 'Exhibit C, change-order schedule',
  },
  recurring_avoidable_pct: {
    doc: 'ServiceNow ticket export',
    locator: 'recurring-category share',
  },
};

describe('leverResultToBandView', () => {
  it('(a) a computed lever → quantified band with the right amounts + citation', () => {
    const band = leverResultToBandView(lever({}), ARCHETYPE_ID, CITATIONS);
    expect(band.state).toBe('quantified');
    expect(band.amountLow).toBe(100_000);
    expect(band.amountHigh).toBe(200_000);
    expect(band.valueType).toBe('protected');
    expect(band.confidence).toBe('med');
    expect(band.unit).toBe('usd');
    // Citation is joined from the usd-bearing input (annual_change_order_spend).
    expect(band.citation).toEqual({
      doc: 'Incumbent AMS contract',
      locator: 'Exhibit C, change-order schedule',
    });
    expect(band.id).toBe('wf.AMS.ENHANCEMENT_LEAKAGE');
  });

  it('(b) an insufficient lever → insufficient_evidence band with NO amount / NO $0 finding', () => {
    const band = leverResultToBandView(
      lever({
        insufficientEvidence: true,
        low: 0,
        high: 0,
        missingEvidence: ['recurring_avoidable_pct'],
        evidenceRefs: [
          { factKey: 'annual_change_order_spend', value: 1_000_000 },
        ],
      }),
      ARCHETYPE_ID,
      CITATIONS,
    );
    expect(band.state).toBe('insufficient_evidence');
    // No citation is attached to a needs-evidence band, and the inert 0 must never
    // be presented as a real $0 finding — the UI hides amounts for this state.
    expect(band.citation).toBeNull();
    expect(band.amountLow).toBe(0);
    expect(band.amountHigh).toBe(0);
  });

  it('returns a null citation when no consumed fact carried one', () => {
    const band = leverResultToBandView(lever({}), ARCHETYPE_ID, {});
    expect(band.state).toBe('quantified');
    expect(band.citation).toBeNull();
  });
});

describe('buildLiveWaterfallView', () => {
  it('(c) provenance is live and bands are one-per-lever in order', () => {
    const view = buildLiveWaterfallView({
      leverResults: [
        lever({ key: 'AMS.ENHANCEMENT_LEAKAGE', valueType: 'protected' }),
        lever({
          key: 'AMS.VOLUME_BAND_PRICING',
          name: 'Volume-band price flex-down',
          valueType: 'incremental_negotiated',
          low: 300_000,
          high: 500_000,
        }),
      ],
      archetypeId: ARCHETYPE_ID,
      citations: CITATIONS,
      baselineLabel: 'Incumbent run-rate',
      baselineAmount: 14_000_000,
    });
    expect(view.provenance).toBe('live');
    expect(view.baselineLabel).toBe('Incumbent run-rate');
    expect(view.baselineAmount).toBe(14_000_000);
    expect(view.bands.map((b) => b.id)).toEqual([
      'wf.AMS.ENHANCEMENT_LEAKAGE',
      'wf.AMS.VOLUME_BAND_PRICING',
    ]);
  });
});

describe('quantifiedRollup', () => {
  it('(d) totals ONLY quantified bands — insufficient bands contribute nothing', () => {
    const view = buildLiveWaterfallView({
      leverResults: [
        lever({ key: 'AMS.ENHANCEMENT_LEAKAGE', low: 100_000, high: 200_000 }),
        lever({
          key: 'AMS.VOLUME_BAND_PRICING',
          low: 300_000,
          high: 500_000,
        }),
        lever({
          key: 'AMS.SLA_ECONOMICS',
          insufficientEvidence: true,
          low: 0,
          high: 0,
        }),
      ],
      archetypeId: ARCHETYPE_ID,
      citations: CITATIONS,
      baselineLabel: 'b',
      baselineAmount: 0,
    });
    const roll = quantifiedRollup(view.bands);
    expect(roll.quantifiedBandCount).toBe(2);
    expect(roll.low).toBe(400_000);
    expect(roll.high).toBe(700_000);
  });
});
