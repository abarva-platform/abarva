// Board-grade Apex CFO Pack — render contract tests.
//
// Pins the blueprint §10 acceptance bar AND the deck-layout contract: the CFO
// Pack renders as a left-menu presentation deck — a cover plus the seven §10
// sections, each a slide in the stage (present as an element even when hidden
// by default). The pack reads as a financial CHALLENGE, not advocacy: it has
// an explicit do-not-fund section, a sensitivity / downside view, the next
// gate on the first slide, the honest verdict (`shape` — payback blocked), and
// the declared seed gaps are explicit (never blank). The HTML is fully
// self-contained: it opens offline with no external assets, the slide-switch
// script is INLINE.

import { renderApexCfoPackHtml } from '../cfo-pack-renderer';

const HTML = renderApexCfoPackHtml('2026-05-20');

// The seven blueprint §10 CFO Pack sections, by anchor id.
const SECTION_ANCHORS = [
  'the-answer',
  'the-case',
  'assumptions',
  'what-would-make-it-wrong',
  'what-not-to-fund-yet',
  'tower-measurement',
  'evidence-and-gaps',
] as const;

describe('Apex CFO Pack — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(20_000);
  });

  it('renders all seven blueprint §10 sections as slide elements', () => {
    for (const anchor of SECTION_ANCHORS) {
      expect(HTML).toContain(`id="${anchor}"`);
      expect(HTML).toContain(`<section class="slide" id="${anchor}"`);
    }
  });

  it('opens on a cover slide and counts an 8-slide deck', () => {
    expect(HTML).toContain('id="cover"');
    expect(HTML).toContain('data-slide="1"');
    expect(HTML).toContain('data-slide="8"');
    expect(HTML).toContain('Slide 2 / 8');
    expect(HTML).toContain('Slide 8 / 8');
  });

  it('is a deck — a left menu rail and a switchable content stage', () => {
    expect(HTML).toContain('class="menu"');
    expect(HTML).toContain('class="stage"');
    // Eight menu items, one per slide (cover + seven sections).
    const menuItems = (HTML.match(/class="menu-item"/g) ?? []).length;
    expect(menuItems).toBe(8);
    expect(HTML).toContain('id="deck-prev"');
    expect(HTML).toContain('id="deck-next"');
  });

  it('carries an inline slide-switch script — no external src', () => {
    expect(HTML).toMatch(/<script>[^]*data-slide[^]*<\/script>/);
    expect(HTML).toContain("'ArrowRight'");
    expect(HTML).toContain("'ArrowLeft'");
  });

  it('renders the honest finance verdict — shaping spend only, not capital', () => {
    const answer = HTML.slice(HTML.indexOf('id="the-answer"'));
    // The first slide answers what finance is asked to approve.
    expect(answer).toContain('APPROVE SHAPING SPEND ONLY');
    // It does not fake an unconditional capital approval.
    expect(HTML).not.toContain('APPROVE CAPITAL — the costed case clears');
  });

  it('puts the next gate on the first slide — found in under a minute', () => {
    // Blueprint §10 hard fail: CFO cannot identify the next gate quickly.
    const answer = HTML.slice(
      HTML.indexOf('id="the-answer"'),
      HTML.indexOf('id="the-case"'),
    );
    // The deck HTML-escapes the ampersand — match the escaped form.
    expect(answer).toContain('Design &amp; Plan');
    expect(answer.toLowerCase()).toContain('next gate');
  });

  it('has an explicit do-not-fund section — what to withhold', () => {
    // Blueprint §10 hard fail: no do-not-fund section.
    const hold = HTML.slice(HTML.indexOf('id="what-not-to-fund-yet"'));
    expect(hold.toLowerCase()).toContain('do-not-fund checklist');
    expect(hold).toContain('Withhold');
    expect(hold).toContain('Release condition');
    // Unfunded autonomy is one of the explicit holdbacks.
    expect(hold.toLowerCase()).toContain('autonomy');
  });

  it('shows a sensitivity / downside view — what breaks the case', () => {
    // Blueprint §10 hard fail: no sensitivity or downside case.
    const wrong = HTML.slice(HTML.indexOf('id="what-would-make-it-wrong"'));
    expect(wrong.toLowerCase()).toContain('what breaks the case');
    expect(wrong.toLowerCase()).toContain('downside');
    expect(wrong.toLowerCase()).toContain('tornado');
  });

  it('reads as financial challenge — payback is shown as blocked', () => {
    // Payback rests on a seed-gap proxy — the pack must say payback is blocked.
    expect(HTML).toContain('Blocked');
    expect(HTML.toLowerCase()).toContain('not computable');
    // The value is honestly framed as a proxy ceiling, not a return.
    expect(HTML.toLowerCase()).toContain('proxy ceiling');
  });

  it('gives every Tower metric a baseline, target, cadence and owner', () => {
    const tower = HTML.slice(HTML.indexOf('id="tower-measurement"'));
    expect(tower).toContain('Baseline');
    expect(tower).toContain('Cadence');
    // The financial metric is honestly carried as a seed gap.
    expect(tower).toContain('Not recorded — seed gap');
  });

  it('surfaces declared seed gaps explicitly — never blank', () => {
    const evidence = HTML.slice(HTML.indexOf('id="evidence-and-gaps"'));
    expect(evidence.toLowerCase()).toContain('seed gap');
    expect(evidence.toLowerCase()).toContain('cost per contact');
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
