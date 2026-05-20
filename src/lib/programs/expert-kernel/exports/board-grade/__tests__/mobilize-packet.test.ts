// Board-grade Apex Mobilize & Go-Decision Packet — render contract tests.
//
// Pins the blueprint §11 / Appendix A.7 acceptance bar AND the deck-layout
// contract: the Mobilize & Go-Decision Packet renders as a left-menu
// presentation deck — a cover plus the eight §11 sections, each a slide in the
// stage (present as an element even when hidden by default). The go-decision
// verdict is the honest `no_go` (two Mobilize kill triggers fired) and is
// rendered exactly as the kernel returns it — never upgraded; the fired kill
// triggers are surfaced verbatim; the Tower handoff ties metrics to the
// Discover baseline; and the HTML is fully self-contained: it opens offline
// with no external assets, the slide-switch script is INLINE.

import { renderApexMobilizePacketHtml } from '../mobilize-packet-renderer';

const HTML = renderApexMobilizePacketHtml('2026-05-20');

// The eight blueprint §11 Mobilize & Go-Decision Packet sections, by anchor id.
const SECTION_ANCHORS = [
  'go-decision',
  'mobilization-plan',
  'owners-decision-rights',
  'adoption-change',
  'controls-readiness',
  'tower-handoff',
  'open-actions',
  'signoff',
] as const;

describe('Apex Mobilize & Go-Decision Packet — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(30_000);
  });

  it('renders all eight blueprint §11 sections as slide elements', () => {
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

  it('renders the honest go-decision — no-go, not go', () => {
    const go = HTML.slice(HTML.indexOf('id="go-decision"'));
    expect(go).toContain('NO-GO');
    // Blueprint §11 hard fail: says go while kill triggers remain.
    expect(HTML).not.toContain('GO — the Move is ready to mobilize');
  });

  it('surfaces the fired Mobilize kill triggers verbatim', () => {
    const go = HTML.slice(
      HTML.indexOf('id="go-decision"'),
      HTML.indexOf('id="mobilization-plan"'),
    );
    // Two Mobilize kill triggers fire for Apex — surfaced, never hidden.
    expect(go).toContain('measurement_unwired');
    expect(go).toContain('business_case_blocker_open');
    expect(go.toLowerCase()).toContain('fired');
  });

  it('renders a 30/60/90 mobilization plan with specific milestones', () => {
    const plan = HTML.slice(
      HTML.indexOf('id="mobilization-plan"'),
      HTML.indexOf('id="owners-decision-rights"'),
    );
    expect(plan).toContain('Days 0–30');
    expect(plan).toContain('Days 31–60');
    expect(plan).toContain('Days 61–90');
  });

  it('renders a RACI with a single accountable owner per decision', () => {
    const raci = HTML.slice(
      HTML.indexOf('id="owners-decision-rights"'),
      HTML.indexOf('id="adoption-change"'),
    );
    expect(raci).toContain('Accountable');
    // Blueprint §11 hard fail: no accountable owner.
    expect(raci).not.toContain('NOT NAMED');
    // Agent autonomy is bounded, not unbounded.
    expect(raci.toLowerCase()).toContain('autonomy');
  });

  it('renders the adoption & change approach as structure, not prose', () => {
    const ad = HTML.slice(
      HTML.indexOf('id="adoption-change"'),
      HTML.indexOf('id="controls-readiness"'),
    );
    // Blueprint §11 hard fail: adoption/change is generic prose.
    expect(ad).toContain('Change dimension');
    expect(ad.toLowerCase()).toContain('hypercare');
  });

  it('ties the Tower handoff metrics to the Discover baseline', () => {
    const tower = HTML.slice(
      HTML.indexOf('id="tower-handoff"'),
      HTML.indexOf('id="open-actions"'),
    );
    // Blueprint §11 hard fail: Tower metric not tied to baseline.
    expect(tower).toContain('Baseline');
    expect(tower).toContain('Contact Center Containment');
    // The unwired cost-per-contact metric is an honest seed gap, not dropped.
    expect(tower.toLowerCase()).toContain('seed gap');
  });

  it('gives every gate-blocking open action a named owner', () => {
    const actions = HTML.slice(
      HTML.indexOf('id="open-actions"'),
      HTML.indexOf('id="signoff"'),
    );
    // Blueprint §11 hard fail: gate blockers have no owner.
    expect(actions).toContain('Blocks go-live');
    expect(actions).toContain('Owner');
    expect(actions).not.toContain('NOT NAMED');
  });

  it('renders a signoff matrix that is not final approval', () => {
    const signoff = HTML.slice(HTML.indexOf('id="signoff"'));
    // Blueprint §11 hard fail: signoff confused with final approval.
    expect(signoff.toLowerCase()).toContain('not a final approval');
    expect(signoff).toMatch(/Blocked|Conditional/);
  });

  it('carries at least four real inline SVG exhibits', () => {
    const svgCount = (HTML.match(/<svg/g) ?? []).length;
    expect(svgCount).toBeGreaterThanOrEqual(4);
  });

  it('every section slide carries a takeaway headline', () => {
    const headlines = (HTML.match(/class="slide-headline"/g) ?? []).length;
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
