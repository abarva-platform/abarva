// Deliverable Quality Transformation — golden regression (W5)
//
// Locks the rendered transformation artifacts byte-stable. Any change to a
// renderer that alters output must consciously update these snapshots — the
// guard against silent regressions in the client-facing artifacts.

import { renderArchitectureHtml } from "@/lib/visual-system/architecture-html-renderer";
import { FIRST_CAPITAL_ARCHITECTURE } from "@/lib/visual-system/__fixtures__/first-capital-architecture";
import { buildHandoffDeck, renderDeckHtml } from "@/lib/visual-system/storyline-deck";
import { FC_HANDOFF } from "@/lib/visual-system/__fixtures__/first-capital-handoff";
import {
  buildCharter,
  renderCharterMarkdown,
} from "@/lib/deliverables/synthesis/charter-shaper";
import { FC_CHARTER } from "@/lib/deliverables/synthesis/__fixtures__/first-capital-charter";

describe("golden regression — First Capital transformation artifacts (W5)", () => {
  it("Target Architecture HTML is byte-stable", () => {
    expect(renderArchitectureHtml(FIRST_CAPITAL_ARCHITECTURE)).toMatchSnapshot();
  });

  it("Executive Handoff deck HTML is byte-stable", () => {
    expect(renderDeckHtml(buildHandoffDeck(FC_HANDOFF))).toMatchSnapshot();
  });

  it("Charter Markdown is byte-stable", () => {
    expect(renderCharterMarkdown(buildCharter(FC_CHARTER))).toMatchSnapshot();
  });
});
