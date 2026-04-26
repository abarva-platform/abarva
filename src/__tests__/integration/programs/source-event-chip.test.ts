// PROG16 · Source Event Chip — integration contract test.
//
// Pure TypeScript + Jest. No jsdom, no React, no model calls, no I/O.
// Verifies the deterministic view-model contract for buildProgramSourceLinkView.

import {
  buildProgramSourceLinkView,
} from '@/lib/programs/program-source-link-view';

describe('buildProgramSourceLinkView', () => {
  describe('APX-CDP-2026 (linked program)', () => {
    const view = buildProgramSourceLinkView('APX-CDP-2026');

    it('returns non-null for APX-CDP-2026', () => {
      expect(view).not.toBeNull();
    });

    it('has sourceEventId "apex-retail-ams-outsourcing-2026"', () => {
      expect(view?.sourceEventId).toBe('apex-retail-ams-outsourcing-2026');
    });

    it('has a non-empty sourceEventName', () => {
      expect(typeof view?.sourceEventName).toBe('string');
      expect((view?.sourceEventName ?? '').length).toBeGreaterThan(0);
    });

    it('has a non-empty topCommercialBlocker', () => {
      expect(typeof view?.topCommercialBlocker).toBe('string');
      expect((view?.topCommercialBlocker ?? '').length).toBeGreaterThan(0);
    });

    it('has a non-empty topBafoOpportunity', () => {
      expect(typeof view?.topBafoOpportunity).toBe('string');
      expect((view?.topBafoOpportunity ?? '').length).toBeGreaterThan(0);
    });

    it('has deterministicSeed: true', () => {
      expect(view?.deterministicSeed).toBe(true);
    });

    it('deterministicSeedCaveat contains "seed" or "Deterministic"', () => {
      const caveat = view?.deterministicSeedCaveat ?? '';
      const containsKeyword =
        caveat.toLowerCase().includes('seed') ||
        caveat.includes('Deterministic');
      expect(containsKeyword).toBe(true);
    });

    it('returns a fresh copy on each call (no shared reference)', () => {
      const viewA = buildProgramSourceLinkView('APX-CDP-2026');
      const viewB = buildProgramSourceLinkView('APX-CDP-2026');
      expect(viewA).not.toBe(viewB);
      expect(viewA).toEqual(viewB);
    });
  });

  describe('unknown program code', () => {
    it('returns null for "NONEXISTENT"', () => {
      expect(buildProgramSourceLinkView('NONEXISTENT')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(buildProgramSourceLinkView('')).toBeNull();
    });

    it('returns null for unrelated program code', () => {
      expect(buildProgramSourceLinkView('APX-CC-AI-2025')).toBeNull();
    });
  });
});
