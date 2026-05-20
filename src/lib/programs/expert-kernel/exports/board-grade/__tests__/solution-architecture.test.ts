// Board-grade Apex Solution Architecture Pack — render contract tests.
//
// Pins the blueprint §7 acceptance bar AND the deck-layout contract: the pack
// renders as a left-menu presentation deck — a cover plus the nine §7 Solution
// Architecture Pack sections, each a slide in the stage (present as an element
// even when hidden by default). Every section carries a real inline-SVG
// architecture diagram; the target-state pattern is named explicitly with the
// rejected alternatives; the build/buy/partner boundary is unambiguous; the
// gap-state CDP node renders AS a gap; the recommended pattern is the human-
// in-the-loop agent, never full autonomy; and the HTML is fully self-contained
// — it opens offline with no external assets, the slide-switch script INLINE.

import { renderApexSolutionArchitectureHtml } from '../solution-architecture-renderer';
import { buildApexSolutionArchitecture } from '../solution-architecture-model';

const HTML = renderApexSolutionArchitectureHtml('2026-05-20');

// The nine blueprint §7 Solution Architecture Pack sections, by anchor id.
const SECTION_ANCHORS = [
  'architecture-decision',
  'context-view',
  'logical-architecture',
  'data-flow',
  'integration-map',
  'build-buy-partner',
  'human-accountability',
  'controls-and-risks',
  'open-decisions',
] as const;

describe('Apex Solution Architecture Pack — board-grade deck render', () => {
  it('is a valid standalone HTML document', () => {
    expect(HTML.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(HTML.length).toBeGreaterThan(40_000);
  });

  it('renders all nine blueprint §7 sections as slide elements', () => {
    for (const anchor of SECTION_ANCHORS) {
      expect(HTML).toContain(`id="${anchor}"`);
      expect(HTML).toContain(`<section class="slide" id="${anchor}"`);
    }
  });

  it('opens on a cover slide and counts a 10-slide deck', () => {
    expect(HTML).toContain('id="cover"');
    expect(HTML).toContain('data-slide="1"');
    expect(HTML).toContain('data-slide="10"');
    // Slide chrome — the running "Slide N / 10" indicator on a section slide.
    expect(HTML).toContain('Slide 2 / 10');
    expect(HTML).toContain('Slide 10 / 10');
  });

  it('is a deck — a left menu rail and a switchable content stage', () => {
    expect(HTML).toContain('class="menu"');
    expect(HTML).toContain('class="stage"');
    // Ten menu items, one per slide (cover + nine sections).
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

  it('names the target-state architecture pattern explicitly', () => {
    // Blueprint §7: the target-state pattern must be NAMED, not implied.
    const decision = HTML.slice(HTML.indexOf('id="architecture-decision"'));
    expect(decision).toContain('human-in-the-loop');
    expect(decision.toLowerCase()).toContain('broker-mediated');
    // The rejected alternatives are named alongside it.
    expect(decision).toMatch(/Rejected/);
  });

  it('recommends human-in-the-loop, not full autonomy (§7 hard fail)', () => {
    // Blueprint §7 hard fail: full autonomy recommended where evidence
    // requires human accountability. The selected option is the HITL agent.
    const arch = buildApexSolutionArchitecture('2026-05-20');
    expect(arch.targetPattern.name.toLowerCase()).toContain(
      'human-in-the-loop',
    );
    // The full agentic workflow appears, but as a REJECTED option.
    const rejectedNames = arch.targetPattern.rejected.map((r) =>
      r.name.toLowerCase(),
    );
    expect(rejectedNames.some((n) => n.includes('autonom'))).toBe(true);
  });

  it('carries at least four real inline SVG architecture diagrams', () => {
    // Blueprint §7 hard fail: a Solution Architecture Pack with no diagram.
    const svgCount = (HTML.match(/<svg/g) ?? []).length;
    expect(svgCount).toBeGreaterThanOrEqual(4);
  });

  it('renders a diagram on every section slide', () => {
    for (const anchor of SECTION_ANCHORS) {
      const start = HTML.indexOf(`id="${anchor}"`);
      const nextIdx = SECTION_ANCHORS.map((a) => HTML.indexOf(`id="${a}"`))
        .filter((i) => i > start)
        .sort((a, b) => a - b)[0];
      const section = HTML.slice(start, nextIdx ?? HTML.length);
      expect(section).toContain('<svg');
    }
  });

  it('makes the build/buy/partner boundary unambiguous (§7 hard fail)', () => {
    // Blueprint §7 hard fail: build/buy/partner boundary unclear.
    const boundary = HTML.slice(HTML.indexOf('id="build-buy-partner"'));
    expect(boundary).toContain('Buy');
    expect(boundary).toContain('Partner');
    expect(boundary).toContain('Retain');
  });

  it('keeps data sources and control points visible (§7 hard fail)', () => {
    // Blueprint §7 hard fail: data sources / control points invisible.
    const dataFlow = HTML.slice(
      HTML.indexOf('id="data-flow"'),
      HTML.indexOf('id="integration-map"'),
    );
    expect(dataFlow.toLowerCase()).toContain('data sources');
    expect(dataFlow.toLowerCase()).toContain('control point');
  });

  it('renders gap-state nodes AS gaps — never backfilled', () => {
    // The kernel CDP node is a declared gap; it must read as a gap.
    expect(HTML).toContain('CDP');
    // The integration table marks the gap explicitly.
    const integration = HTML.slice(HTML.indexOf('id="integration-map"'));
    expect(integration).toMatch(/chip-bad">Gap/);
  });

  it('carries a privacy / control review for the sensitive workflow', () => {
    // Blueprint §7 hard fail: sensitive workflow lacks privacy/security
    // /control review. The transcript-privacy blocker must be rendered.
    const controls = HTML.slice(HTML.indexOf('id="controls-and-risks"'));
    expect(controls.toLowerCase()).toContain('transcript');
    expect(controls.toLowerCase()).toContain('privacy');
    expect(controls).toMatch(/chip-bad">Blocker/);
  });

  it('shows the eight §4 reference controls in the control overlay', () => {
    const arch = buildApexSolutionArchitecture('2026-05-20');
    expect(arch.sections.controlsAndRisks.controls.length).toBe(8);
  });

  it('runs an open-decision queue with gate-blocking decisions', () => {
    const open = HTML.slice(HTML.indexOf('id="open-decisions"'));
    expect(open).toMatch(/chip-bad">Blocks gate/);
  });

  it('renders the conditional architecture verdict honestly', () => {
    // The verdict is `conditional` — production-shaped on §4, but blockers
    // remain. It is not faked up to a clean `shape`.
    const arch = buildApexSolutionArchitecture('2026-05-20');
    expect(arch.verdict).toBe('conditional');
    expect(HTML).toContain('CONDITIONAL');
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

  it('is deterministic — same input yields the same document', () => {
    expect(renderApexSolutionArchitectureHtml('2026-05-20')).toBe(HTML);
  });
});
