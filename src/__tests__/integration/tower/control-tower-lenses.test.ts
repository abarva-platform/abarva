/**
 * W32C — Control Tower Lens Tests
 *
 * Tests for src/lib/tower/control-tower-active-lens-view.ts
 * Covers all 7 lenses for apex-retail and meridian tenants.
 */

import {
  buildControlTowerActiveLensView,
  getLensLabel,
  listAvailableLenses,
  type TowerLens,
  type ControlTowerActiveLensView,
} from '@/lib/tower/control-tower-active-lens-view';

// ===========================================================================
// getLensLabel
// ===========================================================================

describe('getLensLabel', () => {
  it('portfolio → Portfolio', () => expect(getLensLabel('portfolio')).toBe('Portfolio'));
  it('adoption → Adoption', () => expect(getLensLabel('adoption')).toBe('Adoption'));
  it('value → Value', () => expect(getLensLabel('value')).toBe('Value'));
  it('risk → Risk', () => expect(getLensLabel('risk')).toBe('Risk'));
  it('cost → Cost', () => expect(getLensLabel('cost')).toBe('Cost'));
  it('productivity → Productivity', () => expect(getLensLabel('productivity')).toBe('Productivity'));
  it('tech_data_readiness → Tech / Data Readiness', () =>
    expect(getLensLabel('tech_data_readiness')).toBe('Tech / Data Readiness'));
});

// ===========================================================================
// listAvailableLenses
// ===========================================================================

describe('listAvailableLenses', () => {
  it('returns 7 lenses', () => {
    expect(listAvailableLenses()).toHaveLength(7);
  });

  it('includes all required lenses', () => {
    const lenses = listAvailableLenses();
    const required: TowerLens[] = [
      'portfolio', 'adoption', 'value', 'risk', 'cost', 'productivity', 'tech_data_readiness',
    ];
    for (const l of required) {
      expect(lenses).toContain(l);
    }
  });
});

// ===========================================================================
// buildControlTowerActiveLensView — structure
// ===========================================================================

describe('buildControlTowerActiveLensView — structure', () => {
  it('deterministicSeed is true', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('askAtlasDeferred is always true', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.askAtlasDeferred).toBe(true);
  });

  it('availableLenses has 7 entries', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.availableLenses).toHaveLength(7);
  });

  it('defaults to portfolio lens', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.activeLens).toBe('portfolio');
  });

  it('lensLabel matches activeLens', () => {
    const view = buildControlTowerActiveLensView('apex-retail', 'adoption');
    expect(view.lensLabel).toBe('Adoption');
  });
});

// ===========================================================================
// Portfolio lens — apex-retail
// ===========================================================================

describe('portfolio lens — apex-retail', () => {
  let view: ControlTowerActiveLensView;

  beforeEach(() => {
    view = buildControlTowerActiveLensView('apex-retail', 'portfolio');
  });

  it('has 3 scorecards', () => {
    expect(view.scorecards).toHaveLength(3);
  });

  it('has 2 pressure cards', () => {
    expect(view.pressureCards).toHaveLength(2);
  });

  it('lensDetail is null for portfolio', () => {
    expect(view.lensDetail).toBeNull();
  });

  it('BAFO scorecard is at_risk', () => {
    const sc = view.scorecards.find((s) => s.scorecardId === 'sc-apex-portfolio-ams-bafo');
    expect(sc?.status).toBe('at_risk');
  });

  it('value baseline scorecard is blocked', () => {
    const sc = view.scorecards.find((s) => s.scorecardId === 'sc-apex-portfolio-value-baseline');
    expect(sc?.status).toBe('blocked');
  });
});

// ===========================================================================
// Adoption lens — apex-retail
// ===========================================================================

describe('adoption lens — apex-retail', () => {
  let view: ControlTowerActiveLensView;

  beforeEach(() => {
    view = buildControlTowerActiveLensView('apex-retail', 'adoption');
  });

  it('has scorecards for adoption', () => {
    expect(view.scorecards.length).toBeGreaterThan(0);
  });

  it('lensDetail is non-null for adoption', () => {
    expect(view.lensDetail).not.toBeNull();
  });

  it('lensDetail.lensId is adoption', () => {
    expect(view.lensDetail?.lensId).toBe('adoption');
  });

  it('lensDetail.primaryQuestion is non-empty', () => {
    expect(view.lensDetail?.primaryQuestion.length).toBeGreaterThan(0);
  });

  it('lensDetail.dataMissing is non-empty (honest gap disclosure)', () => {
    expect(view.lensDetail?.dataMissing.length).toBeGreaterThan(0);
  });

  it('lensDetail.atlasRecommendation is non-empty', () => {
    expect(view.lensDetail?.atlasRecommendation.length).toBeGreaterThan(0);
  });

  it('lensDetail.lowContextDisclosure is null for apex-retail', () => {
    expect(view.lensDetail?.lowContextDisclosure).toBeNull();
  });

  it('lensDetail.deterministicSeed is true', () => {
    expect(view.lensDetail?.deterministicSeed).toBe(true);
  });

  it('lensDetail.caveat is non-empty', () => {
    expect(view.lensDetail?.caveat.length).toBeGreaterThan(0);
  });

  it('CDP pre-activation signal mentioned', () => {
    const signal = view.lensDetail?.topSignal ?? '';
    expect(signal.toLowerCase()).toContain('cdp');
  });
});

// ===========================================================================
// Value lens — apex-retail
// ===========================================================================

describe('value lens — apex-retail', () => {
  let view: ControlTowerActiveLensView;

  beforeEach(() => {
    view = buildControlTowerActiveLensView('apex-retail', 'value');
  });

  it('lensDetail is non-null', () => {
    expect(view.lensDetail).not.toBeNull();
  });

  it('lensDetail.lensId is value', () => {
    expect(view.lensDetail?.lensId).toBe('value');
  });

  it('$2.4M CDP value referenced in top signal or scorecard', () => {
    const inTopSignal = view.lensDetail?.topSignal.includes('2.4M') ?? false;
    const inScorecard = view.scorecards.some((s) => s.summary.includes('2.4M'));
    expect(inTopSignal || inScorecard).toBe(true);
  });

  it('value baseline scorecard is blocked', () => {
    const sc = view.scorecards.find((s) => s.scorecardId === 'sc-apex-value-cdp-baseline');
    expect(sc?.status).toBe('blocked');
  });

  it('lensDetail.lowContextDisclosure is null for apex-retail', () => {
    expect(view.lensDetail?.lowContextDisclosure).toBeNull();
  });

  it('evidenceBasis references Workshop 5 for CDP value', () => {
    const sc = view.scorecards.find((s) => s.scorecardId === 'sc-apex-value-cdp-baseline');
    expect(sc?.evidenceBasis.toLowerCase()).toContain('workshop');
  });
});

// ===========================================================================
// Risk lens — apex-retail
// ===========================================================================

describe('risk lens — apex-retail', () => {
  let view: ControlTowerActiveLensView;

  beforeEach(() => {
    view = buildControlTowerActiveLensView('apex-retail', 'risk');
  });

  it('lensDetail is non-null', () => {
    expect(view.lensDetail).not.toBeNull();
  });

  it('lensDetail.lensId is risk', () => {
    expect(view.lensDetail?.lensId).toBe('risk');
  });

  it('BAFO risk scorecard is at_risk', () => {
    const sc = view.scorecards.find((s) => s.scorecardId === 'sc-apex-risk-bafo-incomplete');
    expect(sc?.status).toBe('at_risk');
  });

  it('connector stubs scorecard is blocked', () => {
    const sc = view.scorecards.find((s) => s.scorecardId === 'sc-apex-risk-connector-stubs');
    expect(sc?.status).toBe('blocked');
  });

  it('risk has at least 1 pressure card', () => {
    expect(view.pressureCards.length).toBeGreaterThan(0);
  });

  it('top signal mentions BAFO and connectors', () => {
    const signal = view.lensDetail?.topSignal ?? '';
    expect(signal.toLowerCase()).toContain('bafo');
    expect(signal.toLowerCase()).toContain('connector');
  });

  it('lensDetail.lowContextDisclosure is null for apex-retail', () => {
    expect(view.lensDetail?.lowContextDisclosure).toBeNull();
  });
});

// ===========================================================================
// Meridian — all lenses show low-context disclosure
// ===========================================================================

describe('meridian — low-context lenses', () => {
  const lenses: TowerLens[] = ['adoption', 'value', 'risk', 'cost', 'productivity', 'tech_data_readiness'];

  for (const lens of lenses) {
    it(`${lens} lens has lowContextDisclosure for meridian`, () => {
      const view = buildControlTowerActiveLensView('meridian', lens);
      expect(view.lensDetail?.lowContextDisclosure).not.toBeNull();
      expect((view.lensDetail?.lowContextDisclosure ?? '').length).toBeGreaterThan(0);
    });

    it(`${lens} lens deterministicSeed is true for meridian`, () => {
      const view = buildControlTowerActiveLensView('meridian', lens);
      expect(view.deterministicSeed).toBe(true);
    });
  }

  it('portfolio lens for meridian has empty scorecards', () => {
    const view = buildControlTowerActiveLensView('meridian', 'portfolio');
    expect(view.scorecards).toHaveLength(0);
  });
});

// ===========================================================================
// Scorecard and pressure card constraints
// ===========================================================================

describe('scorecard and pressure card constraints', () => {
  const allLenses: TowerLens[] = [
    'portfolio', 'adoption', 'value', 'risk', 'cost', 'productivity', 'tech_data_readiness',
  ];

  for (const lens of allLenses) {
    it(`${lens} — scorecards max 5`, () => {
      const view = buildControlTowerActiveLensView('apex-retail', lens);
      expect(view.scorecards.length).toBeLessThanOrEqual(5);
    });

    it(`${lens} — pressureCards max 3`, () => {
      const view = buildControlTowerActiveLensView('apex-retail', lens);
      expect(view.pressureCards.length).toBeLessThanOrEqual(3);
    });
  }
});
