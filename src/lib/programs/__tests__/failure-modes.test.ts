// Slice OV2-6a — Failure-mode catalog foundation tests
// See docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md (Part A).

import {
  FAILURE_MODES,
  getFailureMode,
  getFailureModesForPhase,
} from '../failure-modes';

const CANONICAL_NAMES: readonly string[] = [
  'Lack of executive sponsorship and ownership',
  'Unclear problem definition or business objectives',
  'Lack of data foundation',
  'Lack of right talent and skills',
  'Lack of business commitment to operating-model and workflow change',
  'Late attention to governance, privacy, and risk',
  'Vendor and build-vs-buy strategy errors',
  'Pilot-to-production scaling gap',
  'Inability to measure outcomes and impact',
  'Unrealistic expectations and use-case sprawl',
];

describe('FAILURE_MODES catalog', () => {
  it('contains exactly 10 entries with ids 1..10 in order', () => {
    expect(FAILURE_MODES).toHaveLength(10);
    expect(FAILURE_MODES.map((m) => m.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('uses the canonical names from the design doc Part A', () => {
    expect(FAILURE_MODES.map((m) => m.name)).toEqual(CANONICAL_NAMES);
  });

  it('gives every entry at least two research anchors with non-empty citations', () => {
    for (const mode of FAILURE_MODES) {
      expect(mode.researchAnchors.length).toBeGreaterThanOrEqual(2);
      for (const anchor of mode.researchAnchors) {
        expect(anchor.citation.trim().length).toBeGreaterThan(0);
        expect([
          'Gartner',
          'RAND',
          'MIT/BCG',
          'McKinsey',
          'Forrester',
        ]).toContain(anchor.source);
      }
    }
  });

  it("declares only valid phase numbers (0..6) in every entry's primaryPhases", () => {
    for (const mode of FAILURE_MODES) {
      expect(mode.primaryPhases.length).toBeGreaterThan(0);
      for (const phase of mode.primaryPhases) {
        expect(Number.isInteger(phase)).toBe(true);
        expect(phase).toBeGreaterThanOrEqual(0);
        expect(phase).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('getFailureMode', () => {
  it('returns the entry whose id matches', () => {
    const fm = getFailureMode(5);
    expect(fm).not.toBeNull();
    expect(fm?.id).toBe(5);
    expect(fm?.name).toBe(
      'Lack of business commitment to operating-model and workflow change',
    );
  });

  it('returns null for an unknown id', () => {
    expect(getFailureMode(99)).toBeNull();
    expect(getFailureMode(0)).toBeNull();
  });
});

describe('getFailureModesForPhase', () => {
  it('returns every failure mode whose primaryPhases includes the given phase', () => {
    const phase0 = getFailureModesForPhase(0);
    const phase0Ids = phase0.map((m) => m.id).sort((a, b) => a - b);
    const expectedPhase0 = FAILURE_MODES.filter((m) =>
      m.primaryPhases.includes(0),
    )
      .map((m) => m.id)
      .sort((a, b) => a - b);

    expect(phase0Ids).toEqual(expectedPhase0);
    // Sanity: P0 prevents at least the sponsorship + sprawl modes per design doc.
    expect(phase0Ids).toEqual(expect.arrayContaining([1, 10]));
  });

  it('returns an empty array when no failure mode targets the phase', () => {
    // Use a clearly-out-of-range phase to assert filtering, not catalog content.
    expect(getFailureModesForPhase(99)).toEqual([]);
  });
});
