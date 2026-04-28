// TOWER2 · Atlas Executive Brief Canvas · integration tests
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
// - buildAtlasExecutiveBriefView('apex-retail') returns non-null
// - briefTitle is non-empty
// - topValueSignal.deterministicSeed === true
// - topRiskSignal.signalType === 'risk'
// - adoptionSignal.signalType === 'adoption'
// - portfolioReadiness.deterministicSeed === true
// - missingData has 3 items for apex-retail
// - recommendedExecutiveAction is non-empty
// - deterministicSeed === true
// - deterministicSeedCaveat contains 'seed' or 'Deterministic'
// - commercialSignalNote for apex-retail is non-null
// - buildAtlasExecutiveBriefView('arcturus').portfolioReadiness.readinessScore === 'not_ready'
// - AtlasExecutiveBriefCanvas.tsx exists
// - AtlasExecutiveBriefCanvas.tsx contains 'ATLAS'
// - AtlasExecutiveBriefCanvas.tsx does NOT contain '#14B8A6'

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  buildAtlasExecutiveBriefView,
  type AtlasExecutiveBriefView,
} from '@/lib/tower/atlas-executive-brief-canvas';

const apexView: AtlasExecutiveBriefView = buildAtlasExecutiveBriefView('apex-retail');
const arcturusView: AtlasExecutiveBriefView = buildAtlasExecutiveBriefView('arcturus');

const COMPONENT_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'components',
  'tower',
  'AtlasExecutiveBriefCanvas.tsx',
);

const COMPONENT_SOURCE = fs.readFileSync(COMPONENT_PATH, 'utf8');

// -------------------------------------------------------------------------
// View model assertions
// -------------------------------------------------------------------------

describe('buildAtlasExecutiveBriefView — apex-retail', () => {
  it('returns a non-null view', () => {
    expect(apexView).not.toBeNull();
  });

  it('briefTitle is non-empty', () => {
    expect(apexView.briefTitle.length).toBeGreaterThan(0);
  });

  it('topValueSignal.deterministicSeed === true', () => {
    expect(apexView.topValueSignal.deterministicSeed).toBe(true);
  });

  it('topRiskSignal.signalType === "risk"', () => {
    expect(apexView.topRiskSignal.signalType).toBe('risk');
  });

  it('adoptionSignal.signalType === "adoption"', () => {
    expect(apexView.adoptionSignal.signalType).toBe('adoption');
  });

  it('portfolioReadiness.deterministicSeed === true', () => {
    expect(apexView.portfolioReadiness.deterministicSeed).toBe(true);
  });

  it('missingData has exactly 3 items', () => {
    expect(apexView.missingData).toHaveLength(3);
  });

  it('recommendedExecutiveAction is non-empty', () => {
    expect(apexView.recommendedExecutiveAction.length).toBeGreaterThan(0);
  });

  it('deterministicSeed === true', () => {
    expect(apexView.deterministicSeed).toBe(true);
  });

  it('deterministicSeedCaveat contains "seed" or "Deterministic"', () => {
    const caveat = apexView.deterministicSeedCaveat;
    const matches = caveat.includes('seed') || caveat.includes('Deterministic');
    expect(matches).toBe(true);
  });

  it('commercialSignalNote is non-null for apex-retail', () => {
    expect(apexView.commercialSignalNote).not.toBeNull();
  });
});

describe('buildAtlasExecutiveBriefView — arcturus', () => {
  it('portfolioReadiness.readinessScore === "not_ready"', () => {
    expect(arcturusView.portfolioReadiness.readinessScore).toBe('not_ready');
  });
});

// -------------------------------------------------------------------------
// Component file assertions
// -------------------------------------------------------------------------

describe('AtlasExecutiveBriefCanvas.tsx static checks', () => {
  it('component file exists', () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });

  it('contains "ATLAS"', () => {
    expect(COMPONENT_SOURCE).toContain('ATLAS');
  });

  it('does NOT contain "#14B8A6" (teal is banned)', () => {
    expect(COMPONENT_SOURCE).not.toContain('#14B8A6');
  });
});
