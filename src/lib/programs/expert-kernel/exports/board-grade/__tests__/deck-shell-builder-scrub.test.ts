// renderDeckDocument is the single HTML chokepoint for every board-grade deck
// (and the PPTX/PDF derivatives are text-extracted from that HTML). It scrubs
// builder vocabulary from the whole document while leaving the stylesheet,
// script, and legitimate domain terms intact.

import {
  renderDeckDocument,
  type DeckMeta,
  type DeckSlide,
} from "../deck-shell";

const meta = {
  brand: "AbarVa · Moves",
  artifactLabel: "Solution Architecture Pack",
  moveLabel: "Finance & Treasury Modernization",
  tenantLabel: "Lakeshore",
  tenantKey: "lakeshore",
  generatedOn: "2026-10-02",
  verdict: { label: "Draft", sub: "In progress" },
  documentTitle: "Solution Architecture Pack",
} as unknown as DeckMeta;

function slide(): DeckSlide {
  return {
    id: "arch",
    navLabel: "Architecture",
    navPreview: "Inherited from the bound Domain Function Pack.",
    render: () =>
      `<section class="slide"><p>This pack inherits the curated outline from the ` +
      `bound Domain Function Pack. The agent does not improvise the structure. ` +
      `Every figure is produced by the Moves Expert Kernel from the audited ` +
      `substrate. The design uses a private data plane in each region.</p></section>`,
  };
}

describe("renderDeckDocument scrubs builder vocabulary", () => {
  const html = renderDeckDocument(meta, [slide()]);

  it("removes builder nouns and the generation self-reference from the slide and the rail", () => {
    expect(html).not.toMatch(/Domain Function Pack/);
    expect(html).not.toMatch(/Expert Kernel/);
    expect(html).not.toMatch(/the agent does not improvise/i);
    expect(html).not.toMatch(/audited substrate/);
  });

  it("keeps the legitimate architecture term 'data plane'", () => {
    expect(html).toContain("private data plane");
  });

  it("leaves the stylesheet and script intact", () => {
    expect(html).toContain("<style>");
    expect(html).toContain("<script>");
    expect(html).toContain('id="stage"');
  });
});
