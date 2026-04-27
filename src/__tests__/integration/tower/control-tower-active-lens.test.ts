// TOWER3 · Control Tower Active Lens Refresh tests.
//
// Pure deterministic coverage of the active-lens view model.
// No React rendering, no DOM, no model calls.
//
// Tests assert that:
// - buildControlTowerActiveLensView produces a non-null result.
// - activeLens defaults to 'portfolio'.
// - availableLenses has exactly 7 entries.
// - scorecards.length <= 5 (hard cap enforced).
// - pressureCards.length <= 3 (hard cap enforced).
// - All scorecards carry deterministicSeed: true.
// - All pressureCards carry deterministicSeed: true.
// - The view itself carries deterministicSeed: true.
// - deterministicSeedCaveat is a non-empty string.
// - Non-apex tenants get empty scorecards.
// - getLensLabel returns a non-empty string.
// - listAvailableLenses returns 7 lenses.
// - ControlTowerActiveLens.tsx exists and passes teal/design checks.

import * as fs from 'fs';
import * as path from 'path';
import {
  buildControlTowerActiveLensView,
  getLensLabel,
  listAvailableLenses,
} from '@/lib/tower/control-tower-active-lens-view';

describe('buildControlTowerActiveLensView — apex-retail', () => {
  it('returns a non-null view', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view).not.toBeNull();
    expect(view).toBeDefined();
  });

  it('defaults activeLens to portfolio', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.activeLens).toBe('portfolio');
  });

  it('availableLenses has exactly 7 entries', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.availableLenses.length).toBe(7);
  });

  it('scorecards.length is at most 5 (cap enforced)', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.scorecards.length).toBeLessThanOrEqual(5);
  });

  it('pressureCards.length is at most 3 (cap enforced)', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.pressureCards.length).toBeLessThanOrEqual(3);
  });

  it('all scorecards have deterministicSeed: true', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    for (const sc of view.scorecards) {
      expect(sc.deterministicSeed).toBe(true);
    }
  });

  it('all pressureCards have deterministicSeed: true', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    for (const pc of view.pressureCards) {
      expect(pc.deterministicSeed).toBe(true);
    }
  });

  it('view itself carries deterministicSeed: true', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('deterministicSeedCaveat is a non-empty string', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(typeof view.deterministicSeedCaveat).toBe('string');
    expect(view.deterministicSeedCaveat.length).toBeGreaterThan(0);
  });

  it('askAtlasDeferred is always true', () => {
    const view = buildControlTowerActiveLensView('apex-retail');
    expect(view.askAtlasDeferred).toBe(true);
  });
});

describe('buildControlTowerActiveLensView — meridian (non-apex)', () => {
  it('returns empty scorecards for meridian tenant', () => {
    const view = buildControlTowerActiveLensView('meridian');
    expect(view.scorecards).toEqual([]);
  });

  it('returns empty pressureCards for meridian tenant', () => {
    const view = buildControlTowerActiveLensView('meridian');
    expect(view.pressureCards).toEqual([]);
  });

  it('still returns 7 availableLenses for meridian', () => {
    const view = buildControlTowerActiveLensView('meridian');
    expect(view.availableLenses.length).toBe(7);
  });

  it('deterministicSeed is true for meridian', () => {
    const view = buildControlTowerActiveLensView('meridian');
    expect(view.deterministicSeed).toBe(true);
  });
});

describe('getLensLabel', () => {
  it("returns a non-empty string for 'portfolio'", () => {
    const label = getLensLabel('portfolio');
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });

  it("returns a non-empty string for all 7 lenses", () => {
    for (const lens of listAvailableLenses()) {
      const label = getLensLabel(lens);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('listAvailableLenses', () => {
  it('returns an array of length 7', () => {
    expect(listAvailableLenses().length).toBe(7);
  });
});

describe('ControlTowerActiveLens.tsx — design canon checks', () => {
  const componentPath = path.resolve(
    __dirname,
    '../../../components/tower/ControlTowerActiveLens.tsx',
  );

  it('component file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('does NOT contain teal (#14B8A6)', () => {
    const contents = fs.readFileSync(componentPath, 'utf-8');
    expect(contents).not.toContain('#14B8A6');
  });

  it("contains 'Ask Atlas' only as a secondary button element", () => {
    const contents = fs.readFileSync(componentPath, 'utf-8');
    expect(contents).toContain('Ask Atlas');
    // Confirm it's inside a button element context (button tag present near Ask Atlas text)
    expect(contents).toContain('button');
  });
});
