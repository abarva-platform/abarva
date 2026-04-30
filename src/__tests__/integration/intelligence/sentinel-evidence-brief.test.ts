// INTEL3 · Sentinel Evidence Brief tests.
//
// Pure deterministic tests over the sentinel-brief-evidence-view helper plus
// static hygiene checks over the SentinelEvidenceBrief component source file.

import * as fs from 'fs';
import * as path from 'path';
import {
  buildSentinelEvidenceBriefView,
} from '@/lib/intelligence/sentinel-brief-evidence-view';

const COMPONENT_PATH = path.resolve(
  __dirname,
  '../../../../src/components/intelligence/SentinelEvidenceBrief.tsx'
);

describe('buildSentinelEvidenceBriefView — apex-retail (rich tenant)', () => {
  const view = buildSentinelEvidenceBriefView('apex-retail');

  it('returns non-null', () => {
    expect(view).not.toBeNull();
  });

  it('tenantSlug is apex-retail', () => {
    expect(view.tenantSlug).toBe('apex-retail');
  });

  it('contextUsed is non-empty', () => {
    expect(view.contextUsed.length).toBeGreaterThan(0);
  });

  it('evidenceConfidenceLevel is non-empty', () => {
    expect(view.evidenceConfidenceLevel).toBeTruthy();
  });

  it('evidenceConfidenceReason is non-empty', () => {
    expect(view.evidenceConfidenceReason.length).toBeGreaterThan(0);
  });

  it('confirmedEvidence has 3 items for apex-retail', () => {
    expect(view.confirmedEvidence).toHaveLength(3);
  });

  it('missingEvidence has 3 items for apex-retail', () => {
    expect(view.missingEvidence).toHaveLength(3);
  });

  it('all confirmedEvidence items have deterministicSeed: true', () => {
    view.confirmedEvidence.forEach(ev => {
      expect(ev.deterministicSeed).toBe(true);
    });
  });

  it('all missingEvidence items have deterministicSeed: true', () => {
    view.missingEvidence.forEach(ev => {
      expect(ev.deterministicSeed).toBe(true);
    });
  });

  it('deterministicSeedCaveat contains "seed" or "Deterministic"', () => {
    const caveat = view.deterministicSeedCaveat;
    expect(caveat.includes('seed') || caveat.includes('Deterministic')).toBe(true);
  });
});

describe('buildSentinelEvidenceBriefView — thin/shell tenants', () => {
  it('meridian evidenceConfidenceLevel is insufficient', () => {
    const view = buildSentinelEvidenceBriefView('meridian');
    expect(view.evidenceConfidenceLevel).toBe('insufficient');
  });

});

describe('SentinelEvidenceBrief component — static hygiene', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(COMPONENT_PATH, 'utf-8');
  });

  it('SentinelEvidenceBrief.tsx exists', () => {
    expect(fs.existsSync(COMPONENT_PATH)).toBe(true);
  });

  it('SentinelEvidenceBrief.tsx contains SENTINEL', () => {
    expect(source).toContain('SENTINEL');
  });

  it('SentinelEvidenceBrief.tsx does not contain #14B8A6 (teal)', () => {
    expect(source).not.toContain('#14B8A6');
  });
});
