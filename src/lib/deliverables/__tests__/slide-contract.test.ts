export {};

import { DELIVERABLE_PROFILES } from '@/lib/deliverables/profiles/registry';
import type { DeliverableKey } from '@/lib/deliverables/profiles/types';
import { SLIDE_BANDS, judgeSlideCount, deckProfilesMissingBands } from '../slide-contract';

describe('slide contract', () => {
  it('enforces the ceiling, which is the half that matters', () => {
    const v = judgeSlideCount('business_case', 30);
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.reason).toBe('too_many');
      expect(v.message).toMatch(/ceiling of 14/);
    }
  });

  it('enforces the floor', () => {
    const v = judgeSlideCount('business_case', 4);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('too_few');
  });

  it('passes inside the band, at both edges', () => {
    expect(judgeSlideCount('business_case', 10).ok).toBe(true);
    expect(judgeSlideCount('business_case', 14).ok).toBe(true);
  });

  // A document must not be failed by a deck rule. Absence of a band is "not a
  // deck", and that has to read differently from "a deck that forgot its band".
  it('does not judge a deliverable that is not a deck', () => {
    expect(judgeSlideCount('financial_model' as DeliverableKey, 99).ok).toBe(true);
  });

  it('every profile whose renderer produces a deck declares a band', () => {
    const deckKeys = (Object.keys(DELIVERABLE_PROFILES) as DeliverableKey[]).filter(
      (k) => DELIVERABLE_PROFILES[k]?.renderer === 'pptx_storyline',
    );
    expect(deckKeys.length).toBeGreaterThan(0);
    expect(deckProfilesMissingBands(deckKeys)).toEqual([]);
  });

  // Three P3 profiles advertise `defaultFormat: pptx` while rendering
  // `html_architecture`. They SHOULD produce a deck — P3 is the phase with no
  // executive deck at all today — so the resolution is to build the renderer,
  // not to relabel the format and make the inconsistency disappear.
  //
  // Listed here so the set cannot grow quietly. The second assertion matters as
  // much as the first: an exemption that does not verify its own defect still
  // exists will outlive the fix and start protecting nothing.
  const KNOWN_FORMAT_MISMATCHES = new Set([
    'solution_approach_options',
    'target_state_architecture',
    'solution_design',
  ]);

  it('no NEW profile claims pptx as its default while rendering something else', () => {
    const liars: string[] = [];
    for (const [key, p] of Object.entries(DELIVERABLE_PROFILES)) {
      if (!p) continue;
      if (p.defaultFormat === 'pptx' && p.renderer !== 'pptx_storyline') {
        if (!KNOWN_FORMAT_MISMATCHES.has(key)) {
          liars.push(`${key}: defaultFormat=pptx renderer=${p.renderer}`);
        }
      }
    }
    expect(liars).toEqual([]);
  });

  it('every known mismatch still actually mismatches — an exemption must expire', () => {
    const healed: string[] = [];
    for (const key of KNOWN_FORMAT_MISMATCHES) {
      const p = DELIVERABLE_PROFILES[key as DeliverableKey];
      if (!p) { healed.push(`${key}: profile no longer exists`); continue; }
      const stillWrong = p.defaultFormat === 'pptx' && p.renderer !== 'pptx_storyline';
      if (!stillWrong) healed.push(`${key}: fixed — remove it from KNOWN_FORMAT_MISMATCHES`);
    }
    expect(healed).toEqual([]);
  });

  it('every band is a real range with a stated purpose', () => {
    for (const [key, band] of Object.entries(SLIDE_BANDS)) {
      if (!band) continue;
      expect(band.min).toBeGreaterThan(0);
      expect(band.max).toBeGreaterThan(band.min);
      expect(band.purpose.length).toBeGreaterThan(10);
      expect(band.max).toBeLessThanOrEqual(16);
      void key;
    }
  });
});
