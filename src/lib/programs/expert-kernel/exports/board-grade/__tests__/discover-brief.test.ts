// Board-grade Apex Discover Brief — render contract tests.
//
// Pins the blueprint §5 acceptance bar AND the deck-layout contract: the brief
// renders as a left-menu presentation deck — a cover plus the six §5 Discover
// Brief sections, each a slide in the stage (present as an element even when
// hidden by default). The decision verdict is `reshape` and is rendered
// honestly, the opportunity carries the mandatory seed-gap caveat, declared
// seed gaps are explicit (never blank), and the HTML is fully self-contained:
// it opens offline with no external assets, the slide-switch script is INLINE.

import { renderApexDiscoverBriefHtml } from '../discover-brief-renderer';

const HTML = renderApexDiscoverBriefHtml('2026-05-20');

// The six blueprint §5 Discover Brief sections, by anchor id.
const SECTION_ANCHORS = [
  'decision-snapshot',
  'current-state-baseline',
  'pain-and-opportunity',
  'evidence-gaps',
  'go-no-go-gate',
  'appendix',
] as const;

describe('Apex Discover Brief — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(20_000);
  });

  it('renders all six blueprint §5 sections as slide elements', () => {
    for (const anchor of SECTION_ANCHORS) {
      // Each section is present as an element even when hidden by default.
      expect(HTML).toContain(`id="${anchor}"`);
      expect(HTML).toContain(`<section class="slide" id="${anchor}"`);
    }
  });

  it('opens on a cover slide and counts a 7-slide deck', () => {
    expect(HTML).toContain('id="cover"');
    expect(HTML).toContain('data-slide="1"');
    expect(HTML).toContain('data-slide="7"');
    // Slide chrome — the running "Slide N / 7" indicator on a section slide.
    expect(HTML).toContain('Slide 2 / 7');
    expect(HTML).toContain('Slide 7 / 7');
  });

  it('is a deck — a left menu rail and a switchable content stage', () => {
    expect(HTML).toContain('class="menu"');
    expect(HTML).toContain('class="stage"');
    // Seven menu items, one per slide (cover + six sections).
    const menuItems = (HTML.match(/class="menu-item"/g) ?? []).length;
    expect(menuItems).toBe(7);
    // Prev / next deck controls are present.
    expect(HTML).toContain('id="deck-prev"');
    expect(HTML).toContain('id="deck-next"');
  });

  it('carries an inline slide-switch script — no external src', () => {
    // The slide-switch behaviour ships as an INLINE <script> ...
    expect(HTML).toMatch(/<script>[^]*data-slide[^]*<\/script>/);
    // ... wired for menu clicks and left/right arrow-key navigation.
    expect(HTML).toContain("'ArrowRight'");
    expect(HTML).toContain("'ArrowLeft'");
  });

  it('renders Discovers honest verdict — reshape, not go', () => {
    // The decision snapshot answers the §5 question with the real verdict.
    const snapshot = HTML.slice(HTML.indexOf('id="decision-snapshot"'));
    expect(snapshot).toContain('RESHAPE');
    // The verdict word is not faked up to "go".
    expect(HTML).not.toContain('GO — Discover is clean enough');
  });

  it('renders the opportunity range with a mandatory seed-gap caveat', () => {
    // Blueprint §5 hard fail: an opportunity range shown without a caveat
    // when a monetization input is missing. The caveat must be present.
    expect(HTML.toLowerCase()).toContain('directional only');
    expect(HTML).toMatch(/Caveat —/);
  });

  it('surfaces declared seed gaps explicitly — never blank', () => {
    expect(HTML.toLowerCase()).toContain('cost per contact');
    expect(HTML.toLowerCase()).toContain('seed gap');
    // The baseline table marks a missing metric as a seed gap, not blank.
    expect(HTML).toContain('Not recorded');
  });

  it('every baseline metric carries a source and a confidence', () => {
    // Blueprint §5 hard fail: baseline metrics that lack source/confidence.
    const baseline = HTML.slice(
      HTML.indexOf('id="current-state-baseline"'),
      HTML.indexOf('id="pain-and-opportunity"'),
    );
    expect(baseline).toContain('NICE CXone');
    expect(baseline).toContain('Confidence');
  });

  it('runs the go/no-go gate as a kill checklist', () => {
    const gate = HTML.slice(HTML.indexOf('id="go-no-go-gate"'));
    // The kill checklist carries pass / reshape / stop states.
    expect(gate).toContain('Kill checklist');
    expect(gate).toMatch(/chip-good">Pass|chip-warn">Reshape/);
  });

  it('carries at least four real inline SVG exhibits', () => {
    const svgCount = (HTML.match(/<svg/g) ?? []).length;
    expect(svgCount).toBeGreaterThanOrEqual(4);
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
