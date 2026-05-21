/**
 * @jest-environment jsdom
 */
// meridian-vbc-decision-home — the function-aware decision-home reference
// surface, verified against the experience spec §3 / §4 bar
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md).
//
// The tests prove the surface:
//   • resolves the Population-Health / VBC Function Pack as its frame;
//   • renders the four §4 blocks, in order;
//   • leads with the headline answer — the answer element precedes the
//     metric strip in document order (the §3 "answer renders first" bar);
//   • surfaces the operating metrics that are off benchmark;
//   • renders a Meridian seed gap honestly where a Function-Pack-expected
//     metric has no audited Meridian value (the §3 "honest by construction"
//     bar) — never as a fabricated confident number.

import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  buildMeridianVbcDecisionHome,
  MERIDIAN_FUNCTION_KEY,
  MERIDIAN_INDUSTRY_KEY,
} from '../meridian-vbc-decision-home';
import { resolveFunctionPack } from '../function-pack-registry';
import { DecisionHomeView } from '@/components/home/decision/DecisionHomeView';

describe('buildMeridianVbcDecisionHome — Function Pack binding', () => {
  it('binds the Population-Health / VBC Function Pack as the frame', () => {
    const pack = resolveFunctionPack(MERIDIAN_INDUSTRY_KEY, MERIDIAN_FUNCTION_KEY);
    expect(pack).not.toBeNull();

    const home = buildMeridianVbcDecisionHome('Meridian Health');
    expect(home).not.toBeNull();
    expect(home!.functionLabel).toBe(pack!.functionLabel);
    // Every vital is one of the Function Pack's operating metrics — the frame
    // is inherited from the pack, not improvised.
    const packMetricKeys = new Set(pack!.operatingMetrics.map((m) => m.key));
    const vitalKeys = [...home!.vitals.off, ...home!.vitals.rest].map((v) => v.key);
    expect(vitalKeys.length).toBe(pack!.operatingMetrics.length);
    for (const key of vitalKeys) {
      expect(packMetricKeys.has(key)).toBe(true);
    }
  });

  it('assembles the four §4 blocks', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health')!;
    // 1 — the one thing
    expect(home.headline.statement.length).toBeGreaterThan(0);
    expect(home.headline.honestyClause.length).toBeGreaterThan(0);
    // 2 — decisions that need you (2–3 answer-first cards)
    expect(home.decisions.length).toBeGreaterThanOrEqual(2);
    expect(home.decisions.length).toBeLessThanOrEqual(3);
    for (const card of home.decisions) {
      expect(card.recommendedAction.length).toBeGreaterThan(0);
      expect(card.stake.length).toBeGreaterThan(0);
      expect(card.evidence.length).toBeGreaterThan(0);
      expect(card.gestureHref.length).toBeGreaterThan(0);
    }
    // 3 — the function's vitals
    expect(home.vitals.expectedCount).toBe(home.vitals.off.length + home.vitals.rest.length);
    // 4 — where you are in the cadence
    expect(home.cadence.stages.length).toBeGreaterThanOrEqual(3);
    expect(home.cadence.stages.some((s) => s.isCurrent)).toBe(true);
  });

  it('surfaces the operating metrics that are off benchmark', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health')!;
    // Meridian's audited RAF capture (58%) and quality capture (34%) both sit
    // below the Function Pack planning bands — they must be surfaced as off.
    expect(home.vitals.off.length).toBeGreaterThan(0);
    for (const vital of home.vitals.off) {
      expect(vital.state).toBe('off');
      expect(vital.meridianValue).not.toBeNull();
      // An off vital carries a read of what the value means.
      expect(vital.read.length).toBeGreaterThan(0);
    }
    const offKeys = home.vitals.off.map((v) => v.key);
    expect(offKeys).toContain('raf_score_accuracy');
    expect(offKeys).toContain('quality_composite_score');
  });

  it('renders a Function-Pack-expected metric Meridian lacks as an honest seed gap', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health')!;
    const seedGaps = home.vitals.rest.filter((v) => v.state === 'seed_gap');
    // The contract-settlement economics are not in Meridian's audited
    // substrate — they must render as seed gaps, never as numbers.
    expect(seedGaps.length).toBeGreaterThan(0);
    for (const gap of seedGaps) {
      // Honest by construction: a seed gap has NO fabricated value.
      expect(gap.meridianValue).toBeNull();
      expect(gap.read.length).toBeGreaterThan(0);
    }
    const gapKeys = seedGaps.map((v) => v.key);
    expect(gapKeys).toContain('medical_loss_ratio');
    expect(gapKeys).toContain('shared_savings_rate');
  });

  it('grounds fewer metrics than it expects — coverage is honest, not inflated', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health')!;
    expect(home.vitals.groundedCount).toBeGreaterThan(0);
    expect(home.vitals.groundedCount).toBeLessThan(home.vitals.expectedCount);
  });
});

describe('DecisionHomeView — the §3 experience bar', () => {
  it('renders the four §4 blocks in document order', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health');
    const html = renderToStaticMarkup(<DecisionHomeView home={home} />);

    const headlineAt = html.indexOf('data-testid="decision-home-headline"');
    const decisionsAt = html.indexOf('data-testid="decision-home-decisions"');
    const cadenceAt = html.indexOf('data-testid="decision-home-cadence"');

    expect(headlineAt).toBeGreaterThanOrEqual(0);
    expect(decisionsAt).toBeGreaterThanOrEqual(0);
    expect(cadenceAt).toBeGreaterThanOrEqual(0);
    // 1 → 2 → 4 in order. Block 3 (the vitals strip) is the client island
    // between 2 and 4 — asserted by the answer-before-metrics test below.
    expect(headlineAt).toBeLessThan(decisionsAt);
    expect(decisionsAt).toBeLessThan(cadenceAt);
  });

  it('leads with the answer — the headline precedes the metric strip', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health');
    const html = renderToStaticMarkup(<DecisionHomeView home={home} />);

    const headlineAt = html.indexOf('data-testid="decision-home-headline"');
    // The vitals strip's section label is the first marker of the metric
    // strip in the DOM. The answer must come before it (the §3 bar).
    const metricStripAt = html.indexOf('The function&#x27;s vitals');

    expect(headlineAt).toBeGreaterThanOrEqual(0);
    expect(metricStripAt).toBeGreaterThanOrEqual(0);
    expect(headlineAt).toBeLessThan(metricStripAt);
  });

  it('names seed gaps plainly in the vitals strip — honest coverage, not inflated', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health');
    const html = renderToStaticMarkup(<DecisionHomeView home={home} />);
    // Before any gesture, the vitals strip already states the honest coverage:
    // Meridian grounds fewer metrics than the function expects, and the rest
    // are named as seed gaps — never silently absent, never inflated.
    expect(html).toContain('honest seed gaps');
    expect(html).toContain('seed gaps)');
  });

  it('reveals seed gaps honestly when the depth gradient is expanded — "not measured", never a number', () => {
    const home = buildMeridianVbcDecisionHome('Meridian Health');
    const { container } = render(<DecisionHomeView home={home} />);

    // Before the gesture: seed gaps are NOT front-loaded — the depth
    // gradient keeps the rest of the vitals one deliberate gesture away.
    expect(container.textContent).not.toContain('Medical loss ratio (MLR)');

    // The depth gradient: one gesture reveals the rest.
    const expandButton = screen.getByRole('button', { name: /Show the remaining/i });
    fireEvent.click(expandButton);

    // Once revealed, a seed-gap metric the Function Pack expects but Meridian
    // has not measured renders the honest "not measured" marker and the
    // "Seed gap" state — never a fabricated confident number.
    expect(container.textContent).toContain('Medical loss ratio (MLR)');
    expect(container.textContent).toContain('not measured');
    expect(container.textContent).toContain('Seed gap');
  });

  it('falls back honestly when no pack is bound — never fabricates a frame', () => {
    const html = renderToStaticMarkup(<DecisionHomeView home={null} />);
    expect(html).toContain('No curated');
    expect(html).toContain('will not fabricate');
  });
});
