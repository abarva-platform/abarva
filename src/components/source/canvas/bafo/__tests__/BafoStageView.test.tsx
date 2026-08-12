import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BafoStageView } from "../BafoStageView";

describe("BafoStageView", () => {
  it("renders deterministic conservative, base, and stretch scenario guidance", () => {
    const html = renderToStaticMarkup(
      createElement(BafoStageView, {
        event: {
          id: "source-event-test",
          name: "Application managed services sourcing event",
          currentStageKey: "bafo",
        },
        documentWorkspace: createElement("div", null, "Document workspace"),
      }),
    );

    expect(html).toContain("Prepare the BAFO question pack");
    expect(html).toContain("What can we realistically improve in BAFO?");
    expect(html).toContain("Base-case upside to test");
    expect(html).toContain("Vendors with blockers");
    expect(html).toContain("Conservative");
    expect(html).toContain("Base");
    expect(html).toContain("Stretch");
    expect(html).toContain("Best useful ask");
    expect(html).toContain("Blocked");
    expect(html).toContain("Not quantified");
    expect(html).toContain("Deterministic seed");
    expect(html).toContain("not live predictions");
    expect(html).toContain("Prepare negotiation brief");
    expect(html).toContain("Human approval is required");
    expect(html).toContain("Document workspace");
  });
});
