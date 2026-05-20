// Board-grade Apex Master Move Dossier — render contract tests.
//
// Pins the blueprint §4 / Appendix A.8 acceptance bar AND the deck-layout
// contract: the Master Move Dossier renders as a left-menu presentation deck
// — a cover plus the nine §4 sections, each a slide in the stage (present as
// an element even when hidden by default). The dossier is the "assembled
// book": §9 lists and links EVERY sibling board-grade artifact deck for the
// Move. The honest Move verdict (`shape`), the blocked payback and the `no_go`
// go-decision are rendered exactly as the kernel returns them — never
// upgraded; declared seed gaps stay declared; and the HTML is fully
// self-contained: it opens offline with no external assets, the slide-switch
// script is INLINE.

import { renderApexMasterDossierHtml } from '../master-dossier-renderer';
import { buildApexMasterMoveDossier } from '../master-dossier-model';

const HTML = renderApexMasterDossierHtml('2026-05-20');

// The nine blueprint §4 Master Move Dossier sections, by anchor id.
const SECTION_ANCHORS = [
  'executive-answer',
  'board-memo',
  'decision-timeline',
  'evidence-and-gaps',
  'solution-delivery',
  'economics',
  'roadmap-mobilization',
  'tower-measurement',
  'downloads-signoff',
] as const;

describe('Apex Master Move Dossier — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(30_000);
  });

  it('renders the cover plus all nine blueprint §4 sections as slide elements', () => {
    expect(HTML).toContain('id="cover"');
    for (const anchor of SECTION_ANCHORS) {
      expect(HTML).toContain(`id="${anchor}"`);
      expect(HTML).toContain(`<section class="slide" id="${anchor}"`);
    }
  });

  it('opens on a cover slide and counts a 10-slide deck', () => {
    expect(HTML).toContain('data-slide="1"');
    expect(HTML).toContain('data-slide="10"');
    expect(HTML).toContain('Slide 2 / 10');
    expect(HTML).toContain('Slide 10 / 10');
  });

  it('is a deck — a left menu rail and a switchable content stage', () => {
    expect(HTML).toContain('class="menu"');
    expect(HTML).toContain('class="stage"');
    const menuItems = (HTML.match(/class="menu-item"/g) ?? []).length;
    expect(menuItems).toBe(10);
    expect(HTML).toContain('id="deck-prev"');
    expect(HTML).toContain('id="deck-next"');
  });

  it('carries an inline slide-switch script — no external src', () => {
    expect(HTML).toMatch(/<script>[^]*data-slide[^]*<\/script>/);
    expect(HTML).toContain("'ArrowRight'");
    expect(HTML).toContain("'ArrowLeft'");
  });

  it('the executive answer is the first section and answers shape/fund/kill', () => {
    const answer = HTML.slice(
      HTML.indexOf('id="executive-answer"'),
      HTML.indexOf('id="board-memo"'),
    );
    // §4 acceptance bar: if the case is not fundable, the first screen says so.
    expect(answer).toContain('SHAPE');
    expect(answer.toLowerCase()).toContain('not yet fundable');
    // Honest verdict — never upgraded to a fund.
    expect(HTML).not.toContain('FUND — the case clears the board-grade bar');
  });

  it('renders the blocker strip and a blocked payback in the executive answer', () => {
    const answer = HTML.slice(
      HTML.indexOf('id="executive-answer"'),
      HTML.indexOf('id="board-memo"'),
    );
    expect(answer.toLowerCase()).toContain('blocker');
    expect(answer).toContain('Blocked');
  });

  it('renders the board memo as scannable prose with callout metrics', () => {
    const memo = HTML.slice(
      HTML.indexOf('id="board-memo"'),
      HTML.indexOf('id="decision-timeline"'),
    );
    expect(memo).toContain('memo-callout');
    // §4 hard fail: no explicit "what not to fund yet".
    expect(memo.toLowerCase()).toContain('do not fund yet');
  });

  it('renders the decision timeline with phase revision markers', () => {
    const tl = HTML.slice(
      HTML.indexOf('id="decision-timeline"'),
      HTML.indexOf('id="evidence-and-gaps"'),
    );
    expect(tl).toContain('Discover');
    expect(tl).toContain('Charter');
    expect(tl).toContain('Mobilize');
    // The revision markers — each phase shows when it was reviewed.
    expect(tl.toLowerCase()).toContain('reviewed');
  });

  it('makes the seed gaps explicit in the evidence section — never blank', () => {
    const ev = HTML.slice(
      HTML.indexOf('id="evidence-and-gaps"'),
      HTML.indexOf('id="solution-delivery"'),
    );
    expect(ev).toContain('Seed gap');
    expect(ev).toContain('Cost per contact (labour)');
    // §2 hard rule: missing data is declared, not hidden.
    expect(ev.toLowerCase()).toContain('not recorded');
  });

  it('renders the solution & delivery model with a build/buy/partner boundary', () => {
    const sol = HTML.slice(
      HTML.indexOf('id="solution-delivery"'),
      HTML.indexOf('id="economics"'),
    );
    expect(sol.toLowerCase()).toContain('agent-assist');
  });

  it('renders economics with a blocked payback — no fabricated crossing', () => {
    const econ = HTML.slice(
      HTML.indexOf('id="economics"'),
      HTML.indexOf('id="roadmap-mobilization"'),
    );
    // §6 hard fail: payback shown when monetization is blocked.
    expect(econ.toLowerCase()).toContain('not claimable');
    expect(econ.toLowerCase()).toContain('seed gap');
  });

  it('renders the roadmap with a RACI that names an accountable owner', () => {
    const road = HTML.slice(
      HTML.indexOf('id="roadmap-mobilization"'),
      HTML.indexOf('id="tower-measurement"'),
    );
    expect(road).toContain('Accountable');
    expect(road).not.toContain('NOT NAMED');
    expect(road).toContain('Blocks go-live');
  });

  it('ties the Tower handoff metrics to the Discover baseline', () => {
    const tower = HTML.slice(
      HTML.indexOf('id="tower-measurement"'),
      HTML.indexOf('id="downloads-signoff"'),
    );
    expect(tower).toContain('Baseline');
    expect(tower).toContain('Contact Center Containment');
    expect(tower.toLowerCase()).toContain('seed gap');
  });

  it('§9 lists and links every sibling board-grade artifact deck', () => {
    const downloads = HTML.slice(HTML.indexOf('id="downloads-signoff"'));
    // The seven sibling decks for the Apex Contact Center AI Routing Move.
    const SIBLING_HREFS = [
      '/api/v1/moves/board-grade-business-case',
      '/api/v1/moves/board-grade-discover-brief',
      '/api/v1/moves/board-grade-solution-architecture',
      '/api/v1/moves/board-grade-estimate-model',
      '/api/v1/moves/board-grade-mobilize-packet',
      '/api/v1/moves/board-grade-charter-skeleton',
      '/api/v1/moves/board-grade-cfo-pack',
    ];
    for (const href of SIBLING_HREFS) {
      expect(downloads).toContain(`href="${href}"`);
    }
    // The Costed pack additionally links its editable PowerPoint.
    expect(downloads).toContain(
      'href="/api/v1/moves/board-grade-business-case?format=pptx"',
    );
    // The dossier never links itself as a sibling.
    expect(downloads).not.toContain(
      'href="/api/v1/moves/board-grade-master-dossier"',
    );
  });

  it('§9 stays in sync with the registry — exactly seven sibling artifacts', () => {
    const dossier = buildApexMasterMoveDossier('2026-05-20');
    expect(dossier.sections.downloadsSignoff.artifacts).toHaveLength(7);
    for (const a of dossier.sections.downloadsSignoff.artifacts) {
      expect(a.id).not.toBe('master-dossier');
      expect(a.htmlHref.length).toBeGreaterThan(0);
    }
  });

  it('renders a signoff matrix that is not a final approval', () => {
    const signoff = HTML.slice(HTML.indexOf('id="downloads-signoff"'));
    expect(signoff.toLowerCase()).toContain('not a final approval');
    expect(signoff).toMatch(/Blocked|Conditional/);
  });

  it('carries at least four real inline SVG exhibits', () => {
    const svgCount = (HTML.match(/<svg/g) ?? []).length;
    expect(svgCount).toBeGreaterThanOrEqual(4);
  });

  it('every section slide carries a takeaway headline', () => {
    const headlines = (HTML.match(/class="slide-headline"/g) ?? []).length;
    expect(headlines).toBe(9);
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

  it('preserves the honest verdict on the view-model', () => {
    const dossier = buildApexMasterMoveDossier('2026-05-20');
    expect(dossier.verdict).toBe('shape');
    expect(dossier.goDecision).toBe('no_go');
    expect(dossier.paybackBlocked).toBe(true);
  });
});
