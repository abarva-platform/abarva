import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { VendorEvaluationScorecardPanel } from "../VendorEvaluationScorecardPanel";
import { VendorResponseProfilesPanel } from "../VendorResponseProfilesPanel";

/**
 * These panels stack a heading over supporting lines inside one cell or tile.
 * When those children render as bare inline siblings the browser puts them on
 * the same line with no separator, so a label and its description became one
 * run of text ("Normalized 5-year TCOShows cost position..."), and a tile
 * label wider than its column spilled over the neighbouring tile.
 *
 * jsdom does not lay out, so these tests pin the markup contract that makes
 * the layout correct rather than measuring pixels.
 */
const EVENT = {
  id: "65ee81ba-7bbc-4673-b0dd-13c08c5ca9ba",
  code: "SKYH-APPLICATION-MANAGED-SERVICES-2026-81A644CC",
  name: "Application managed services",
  accountName: "SkyHarbor Air",
};

function buildDecisionView() {
  const profiles = buildVendorResponseMveProfiles(EVENT);
  const challengeIntelligence = buildVendorChallengeIntelligence(profiles);
  return {
    profiles,
    decisionView: buildVendorEvaluationDecisionView(
      profiles,
      challengeIntelligence,
      buildVendorBafoInstructionPack(challengeIntelligence),
    ),
  };
}

describe("responses cell layout", () => {
  it("never renders a table cell whose stacked children would run together", () => {
    const { decisionView } = buildDecisionView();
    const html = renderToStaticMarkup(
      createElement(VendorEvaluationScorecardPanel, {
        decisionView,
        eventDisplayName: "Test event",
      }),
    );

    // Scope the check to table cells: elsewhere the parent is a grid or flex
    // container that separates its children on its own.
    const cells = html.match(/<td\b[^>]*>[\s\S]*?<\/td>/g) ?? [];
    expect(cells.length).toBeGreaterThan(0);

    // Inside a cell, an inline element immediately followed by another must
    // carry an explicit block display, otherwise the two texts collide.
    const runTogether = cells.filter((cell) =>
      /<\/(?:strong|span)><(?:strong|span)(?![^>]*display:block)/.test(cell),
    );
    expect(runTogether).toEqual([]);
  });

  it("keeps table cells as table cells so columns stay aligned", () => {
    const { decisionView } = buildDecisionView();
    const html = renderToStaticMarkup(
      createElement(VendorEvaluationScorecardPanel, {
        decisionView,
        eventDisplayName: "Test event",
      }),
    );

    // Fixing the run-together by making the <td> a grid container would drop
    // it out of table layout and break column alignment.
    expect(html).not.toMatch(/<td[^>]*display:grid/);
    expect(html).not.toMatch(/<td[^>]*display:flex/);
  });

  it("constrains profile metric tiles so a label cannot overflow its tile", () => {
    const { profiles } = buildDecisionView();
    const html = renderToStaticMarkup(
      createElement(VendorResponseProfilesPanel, { profileSet: profiles }),
    );

    expect(html).toContain("Completeness");
    // The tile must cap how wide its content can get and allow a long label to
    // wrap rather than spill sideways over the next tile.
    const tiles = html.match(/<div style="[^"]*min-width:0[^"]*"/g) ?? [];
    expect(tiles.length).toBeGreaterThan(0);
    expect(html).toMatch(/overflow-wrap:anywhere/);
  });
});
