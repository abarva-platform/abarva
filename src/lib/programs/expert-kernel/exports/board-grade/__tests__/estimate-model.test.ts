// Board-grade Apex Estimate & Financial Model — render contract tests.
//
// Pins the blueprint §8 / Appendix A.4 acceptance bar AND the deck-layout
// contract: the Estimate & Financial Model renders as a left-menu presentation
// deck — a cover plus the eight §8 sections, each a slide in the stage
// (present as an element even when hidden by default). The recommendation is
// the honest `shape` and is rendered faithfully, payback is shown as BLOCKED
// (a monetization seed gap), declared seed gaps are explicit (never blank),
// the rate-card source is shown, and the HTML is fully self-contained: it
// opens offline with no external assets, the slide-switch script is INLINE.

import { renderApexEstimateModelHtml } from '../estimate-model-renderer';

const HTML = renderApexEstimateModelHtml('2026-05-20');

// The eight blueprint §8 Estimate & Financial Model sections, by anchor id.
const SECTION_ANCHORS = [
  'executive-summary',
  'baseline-inputs',
  'workstream-estimate',
  'role-mix-by-phase',
  'rate-card',
  'value-forecast',
  'sensitivity',
  'roadmap-cash-flow',
] as const;

describe('Apex Estimate & Financial Model — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(30_000);
  });

  it('renders all eight blueprint §8 sections as slide elements', () => {
    for (const anchor of SECTION_ANCHORS) {
      expect(HTML).toContain(`id="${anchor}"`);
      expect(HTML).toContain(`<section class="slide" id="${anchor}"`);
    }
  });

  it('opens on a cover slide and counts a 9-slide deck', () => {
    expect(HTML).toContain('id="cover"');
    expect(HTML).toContain('data-slide="1"');
    expect(HTML).toContain('data-slide="9"');
    expect(HTML).toContain('Slide 2 / 9');
    expect(HTML).toContain('Slide 9 / 9');
  });

  it('is a deck — a left menu rail and a switchable content stage', () => {
    expect(HTML).toContain('class="menu"');
    expect(HTML).toContain('class="stage"');
    // Nine menu items, one per slide (cover + eight sections).
    const menuItems = (HTML.match(/class="menu-item"/g) ?? []).length;
    expect(menuItems).toBe(9);
    expect(HTML).toContain('id="deck-prev"');
    expect(HTML).toContain('id="deck-next"');
  });

  it('carries an inline slide-switch script — no external src', () => {
    expect(HTML).toMatch(/<script>[^]*data-slide[^]*<\/script>/);
    expect(HTML).toContain("'ArrowRight'");
    expect(HTML).toContain("'ArrowLeft'");
  });

  it('renders the honest recommendation — shape, not fund', () => {
    const summary = HTML.slice(HTML.indexOf('id="executive-summary"'));
    expect(summary).toContain('SHAPE');
    // The verdict is not faked up to "fund".
    expect(HTML).not.toContain('FUND — the estimate holds and the case pays');
  });

  it('preserves the honest blocked payback — never a fake crossing', () => {
    // Blueprint §8 hard fail: payback shown when monetization is blocked.
    expect(HTML.toLowerCase()).toContain('payback');
    expect(HTML).toContain('Payback not computable');
    expect(HTML.toLowerCase()).toContain('blocked');
  });

  it('surfaces declared seed gaps explicitly — never blank', () => {
    const baseline = HTML.slice(
      HTML.indexOf('id="baseline-inputs"'),
      HTML.indexOf('id="workstream-estimate"'),
    );
    expect(baseline.toLowerCase()).toContain('cost per contact');
    expect(baseline).toContain('Seed gap');
    expect(baseline).toContain('Not recorded');
    // Each seed gap carries an explicit decision impact.
    expect(baseline).toContain('Decision impact');
  });

  it('costs all eight workstreams — not a generic six-role model', () => {
    const ws = HTML.slice(
      HTML.indexOf('id="workstream-estimate"'),
      HTML.indexOf('id="role-mix-by-phase"'),
    );
    // Blueprint §8 hard fail: a complex estimate collapsed to six roles.
    expect(ws).toContain('eight workstreams');
    // Business-change effort is present and labelled (a §8 hard fail to omit).
    expect(ws).toContain('Business change');
  });

  it('shows the rate-card source — never hidden', () => {
    const rc = HTML.slice(
      HTML.indexOf('id="rate-card"'),
      HTML.indexOf('id="value-forecast"'),
    );
    // Blueprint §8 hard fail: rate-card source not shown.
    expect(rc).toContain('RATE-CARD SOURCE');
    // The client-override path is visible (a §8 hard fail to hide).
    expect(rc.toLowerCase()).toContain('override');
  });

  it('shows the value as a haircut bridge, not raw optimism', () => {
    const vf = HTML.slice(
      HTML.indexOf('id="value-forecast"'),
      HTML.indexOf('id="sensitivity"'),
    );
    expect(vf.toLowerCase()).toContain('haircut');
    expect(vf.toLowerCase()).toContain('gross');
  });

  it('shows sensitivity as three scenarios — never one point', () => {
    const sens = HTML.slice(
      HTML.indexOf('id="sensitivity"'),
      HTML.indexOf('id="roadmap-cash-flow"'),
    );
    expect(sens).toContain('Conservative');
    expect(sens).toContain('Upside');
    expect(sens.toLowerCase()).toContain('what breaks the case');
  });

  it('carries at least six real inline SVG exhibits', () => {
    const svgCount = (HTML.match(/<svg/g) ?? []).length;
    expect(svgCount).toBeGreaterThanOrEqual(6);
  });

  it('every section slide carries a takeaway headline', () => {
    const headlines = (HTML.match(/class="slide-headline"/g) ?? []).length;
    // One per section slide (eight); the cover has its own title.
    expect(headlines).toBe(8);
  });

  it('expands every slide for print via an @media print block', () => {
    expect(HTML).toMatch(/@media print/);
    expect(HTML).toMatch(/page-break-after/);
  });

  it('is fully self-contained — no external assets', () => {
    expect(HTML).not.toMatch(/<script[^>]+src=/i);
    expect(HTML).not.toMatch(/<link[^>]+href="https?:/i);
    expect(HTML).not.toMatch(/<img[^>]+src="https?:/i);
    expect(HTML).not.toMatch(/@import\s+url\(\s*['"]?https?:/i);
  });
});
