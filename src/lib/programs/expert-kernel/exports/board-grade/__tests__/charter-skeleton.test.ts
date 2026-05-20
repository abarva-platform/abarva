// Board-grade Apex Charter Business-Case Skeleton — render contract tests.
//
// Pins the blueprint §6 acceptance bar AND the deck-layout contract: the
// skeleton renders as a left-menu presentation deck — a cover plus the six §6
// Charter Skeleton sections, each a slide in the stage (present as an element
// even when hidden by default). The Charter verdict is `shape` and is rendered
// honestly (never "fund" while a critic blocker remains), cost and value are
// shown as RANGES not single points, every assumption carries an owner, the
// declared seed gaps are explicit (never blank), and the HTML is fully
// self-contained: it opens offline with no external assets, the slide-switch
// script is INLINE.

import { renderApexCharterSkeletonHtml } from '../charter-skeleton-renderer';

const HTML = renderApexCharterSkeletonHtml('2026-05-20');

// The six blueprint §6 Charter Skeleton sections, by anchor id.
const SECTION_ANCHORS = [
  'charter-answer',
  'value-hypothesis',
  'initial-cost-effort',
  'assumption-ledger',
  'kill-criteria',
  'evidence-asks',
] as const;

describe('Apex Charter Skeleton — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(20_000);
  });

  it('renders all six blueprint §6 sections as slide elements', () => {
    for (const anchor of SECTION_ANCHORS) {
      expect(HTML).toContain(`id="${anchor}"`);
      expect(HTML).toContain(`<section class="slide" id="${anchor}"`);
    }
  });

  it('opens on a cover slide and counts a 7-slide deck', () => {
    expect(HTML).toContain('id="cover"');
    expect(HTML).toContain('data-slide="1"');
    expect(HTML).toContain('data-slide="7"');
    expect(HTML).toContain('Slide 2 / 7');
    expect(HTML).toContain('Slide 7 / 7');
  });

  it('is a deck — a left menu rail and a switchable content stage', () => {
    expect(HTML).toContain('class="menu"');
    expect(HTML).toContain('class="stage"');
    // Seven menu items, one per slide (cover + six sections).
    const menuItems = (HTML.match(/class="menu-item"/g) ?? []).length;
    expect(menuItems).toBe(7);
    expect(HTML).toContain('id="deck-prev"');
    expect(HTML).toContain('id="deck-next"');
  });

  it('carries an inline slide-switch script — no external src', () => {
    expect(HTML).toMatch(/<script>[^]*data-slide[^]*<\/script>/);
    expect(HTML).toContain("'ArrowRight'");
    expect(HTML).toContain("'ArrowLeft'");
  });

  it('renders the Charter honest verdict — shape, not fund', () => {
    // The Charter answer answers the §6 question with the real verdict.
    const answer = HTML.slice(HTML.indexOf('id="charter-answer"'));
    expect(answer).toContain('SHAPE');
    // §6 hard fail: a "fund" recommendation while critic blockers remain.
    expect(HTML).not.toContain('FUND — the Charter case clears the critic');
    // The takeaway takes a position — it explicitly says shape, not fund.
    expect(HTML).toMatch(/shape, never fund/);
  });

  it('shows cost and value as ranges — never a single-point figure', () => {
    // Blueprint §6 hard fail: single-point ROI or single-point cost.
    const cost = HTML.slice(
      HTML.indexOf('id="initial-cost-effort"'),
      HTML.indexOf('id="assumption-ledger"'),
    );
    // The effort envelope is rendered as a low–high range.
    expect(cost).toMatch(/\$[\d.]+M.*to.*\$[\d.]+M/);
    expect(cost.toLowerCase()).toContain('range');
    // The value-vs-effort exhibit is present.
    expect(HTML.toLowerCase()).toContain('investment envelope');
  });

  it('gives every case-moving assumption an owner and a sensitivity', () => {
    // Blueprint §6 hard fail: assumptions with no owner or sensitivity.
    const ledger = HTML.slice(HTML.indexOf('id="assumption-ledger"'));
    expect(ledger).toContain('Owner —');
    expect(ledger).toContain('Sensitivity');
    // At least one assumption is flagged a seed-gap proxy.
    expect(ledger).toContain('Seed-gap proxy');
  });

  it('runs kill criteria with stop conditions and evidence thresholds', () => {
    const kill = HTML.slice(HTML.indexOf('id="kill-criteria"'));
    expect(kill).toContain('Evidence threshold');
    // The monetisation criterion is shown as firing — the honest read.
    expect(kill).toMatch(/chip-bad">Firing/);
  });

  it('surfaces declared seed gaps explicitly as evidence asks', () => {
    const asks = HTML.slice(HTML.indexOf('id="evidence-asks"'));
    expect(asks.toLowerCase()).toContain('cost per contact');
    expect(asks).toContain('Blocks funding');
  });

  it('preserves the honest verdict — payback-blocked monetisation', () => {
    // The Move's value rests on a seed-gap proxy — the deck must say so.
    expect(HTML.toLowerCase()).toContain('seed gap');
    expect(HTML.toLowerCase()).toContain('proxy');
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
