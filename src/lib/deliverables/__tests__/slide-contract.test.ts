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
  // These three declare `defaultFormat: pptx` while `renderer: html_architecture`
  // produces HTML. My first reading was that the declaration was wrong — it is
  // not. `registry.test.ts` asserts deliberately that board-decision and
  // architecture artifacts are PPTX finals, so the DECLARATION is the intent and
  // the RENDERER is the gap: it does not yet produce the format its profile
  // promises.
  //
  // Listed so the set cannot grow quietly, and paired with an expiry check so it
  // cannot outlive the renderer work.
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

// The CXO deck guarantee, as a test rather than an intention.
//
// PPTX has always been *reachable* for any deliverable with a structured
// document — the artifact route renders it on ?format=pptx with no profile
// check. What was missing was the DECLARATION, which is what `format_fit`
// reads. A phase deliverable that does not declare pptx produces a deck the
// quality contract then treats as a format mismatch.
describe('every phase deliverable declares a CXO deck', () => {
  const PHASE_DELIVERABLES: Record<string, string> = {
    charter: 'P1',
    discovery_report: 'P2',
    root_cause_worksheet: 'P2',
    solution_approach_options: 'P3',
    target_state_architecture: 'P3',
    solution_design: 'P3',
    operating_model_design: 'P3',
    sourcing_strategy: 'P3',
    execution_roadmap: 'P4',
    business_case: 'P4',
    tower_metrics_plan: 'P4',
    readiness_and_change_plan: 'P4',
    handoff_package: 'P5',
    value_measurement_contract: 'P5',
  };

  it('declares pptx as its default or a supporting format', () => {
    const undeclared: string[] = [];
    for (const key of Object.keys(PHASE_DELIVERABLES)) {
      const p = DELIVERABLE_PROFILES[key as DeliverableKey];
      if (!p) { undeclared.push(`${key}: profile missing`); continue; }
      const declared =
        p.defaultFormat === 'pptx' ||
        (p.supportingFormats ?? []).includes('pptx');
      if (!declared) undeclared.push(`${PHASE_DELIVERABLES[key]} ${key}`);
    }
    expect(undeclared).toEqual([]);
  });

  it('covers all five phases', () => {
    expect(new Set(Object.values(PHASE_DELIVERABLES))).toEqual(
      new Set(['P1', 'P2', 'P3', 'P4', 'P5']),
    );
  });
});
