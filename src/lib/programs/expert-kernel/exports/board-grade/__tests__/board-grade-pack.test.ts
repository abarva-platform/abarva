// Board-grade Apex Costed Business-Case Pack — render contract tests.
//
// Pins the blueprint §9 acceptance bar: all 11 sections present, the page-1
// verdict is `shape`, payback is rendered HONESTLY as blocked (never a fake
// number), declared seed gaps are visible, and the HTML is fully
// self-contained (offline-openable, no external assets).

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

describe('Apex Costed Business-Case Pack — board-grade render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(20_000);
  });

  it('renders all 11 blueprint sections', () => {
    for (const anchor of SECTION_ANCHORS) {
      expect(HTML).toContain(`id="${anchor}"`);
    }
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

  it('is fully self-contained — no external assets', () => {
    expect(HTML).not.toMatch(/<script[^>]+src=/i);
    expect(HTML).not.toMatch(/<link[^>]+href="https?:/i);
    expect(HTML).not.toMatch(/<img[^>]+src="https?:/i);
    expect(HTML).not.toMatch(/@import\s+url\(\s*['"]?https?:/i);
  });
});
