// Board-grade Apex Costed Business-Case Pack — render contract tests.
//
// Pins the blueprint §9 acceptance bar AND the deck-layout contract: the pack
// renders as a left-menu presentation deck — a cover plus the 11 board
// sections, each a slide in the stage (present as an element even when hidden
// by default). The page-1 verdict is `shape`, payback is rendered HONESTLY as
// blocked (never a fake number), declared seed gaps are visible, and the HTML
// is fully self-contained: it opens offline with no external assets, the
// slide-switch script is INLINE (no external src).

import { renderApexCostedBusinessCaseHtml } from '../html-renderer';

const HTML = renderApexCostedBusinessCaseHtml('2026-05-20');

// The 11 board-facing sections from blueprint §9, by anchor id.
const SECTION_ANCHORS = [
  'board-answer',
  'why-now',
  'what-we-are-funding',
  'investment-case',
  'value-case',
  'payback-sensitivity',
  'roadmap',
  'risks-controls',
  'assumption-ledger',
  'evidence-appendix',
  'recommendation',
] as const;

describe('Apex Costed Business-Case Pack — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(20_000);
  });

  it('renders all 11 blueprint sections as slide elements', () => {
    for (const anchor of SECTION_ANCHORS) {
      // Each section is present as an element even when hidden by default.
      expect(HTML).toContain(`id="${anchor}"`);
      expect(HTML).toContain(`<section class="slide" id="${anchor}"`);
    }
  });

  it('opens on a cover slide and counts a 12-slide deck', () => {
    expect(HTML).toContain('id="cover"');
    expect(HTML).toContain('data-slide="1"');
    expect(HTML).toContain('data-slide="12"');
    // Slide chrome — the running "Slide N / 12" indicator on a section slide.
    expect(HTML).toContain('Slide 2 / 12');
    expect(HTML).toContain('Slide 12 / 12');
  });

  it('is a deck — a left menu rail and a switchable content stage', () => {
    expect(HTML).toContain('class="menu"');
    expect(HTML).toContain('class="stage"');
    // Twelve menu items, one per slide (cover + 11 sections).
    const menuItems = (HTML.match(/class="menu-item"/g) ?? []).length;
    expect(menuItems).toBe(12);
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

  it('answers fund/shape/kill on the board-answer section', () => {
    const boardAnswer = HTML.slice(HTML.indexOf('id="board-answer"'));
    expect(boardAnswer.toLowerCase()).toContain('shaping spend');
  });

  it('renders payback honestly as blocked — never a fabricated number', () => {
    expect(HTML.toLowerCase()).toContain('not computable');
    expect(HTML.toLowerCase()).toContain('monetisation blocked');
  });

  it('surfaces declared seed gaps, not invented values', () => {
    expect(HTML.toLowerCase()).toContain('cost per contact');
    expect(HTML.toLowerCase()).toContain('seed gap');
  });

  it('carries real inline SVG exhibits', () => {
    const svgCount = (HTML.match(/<svg/g) ?? []).length;
    expect(svgCount).toBeGreaterThanOrEqual(8);
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
