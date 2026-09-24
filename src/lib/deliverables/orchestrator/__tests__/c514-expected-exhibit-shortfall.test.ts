// C-514 — the expected-exhibit shortfall must be a COUNT, not an absence nobody
// looked at.
//
// #8417 gave the synthesis pass permission to omit an exhibit rather than emit
// a placeholder one, and `renderableExhibitsFromSynthesis` enforces that with a
// bare `continue`. That is the right renderer behaviour. What did not ship with
// it is the other half of the sentence already written into
// `RenderableExhibit.data`'s own doc comment — "the quality gate should surface
// the missing visual".
//
// Before this suite the gate could not: `requiredExhibitElementsByKind` opens
// with `if (matching.length === 0) continue`, so it grades the elements of an
// exhibit that IS present and says nothing about one that is absent, and the
// only absence signal is a warning when the document has ZERO exhibits. A
// deliverable that asked for three and received one produced no warning, no
// blocker and no number — which is precisely the "blank area nobody looked at"
// failure mode.
//
// These tests drive the real `validateDeliverableQuality` with the real
// fixture. Nothing here asserts a string the implementation also produces from
// a constant: each case fixes the expected/received populations and asserts the
// two counts that follow from them.

import { validateDeliverableQuality } from "../quality-validator";
import { runDeliverableOrchestration } from "../orchestrator";
import type { ModelCaller } from "../orchestrator";
import { getArtifactBrief } from "../artifact-brief-registry";
import { amsRfpRequest, goodDocument, goodPlan } from "../__fixtures__/ams-rfp";
import type { ExpectedExhibit } from "../types";

function expected(...specs: Array<[string, ExpectedExhibit["kind"]]>): ExpectedExhibit[] {
  return specs.map(([title, kind]) => ({
    key: title.toLowerCase().replace(/\s+/g, "_"),
    title,
    kind,
    purpose: `Show ${title}.`,
    preferredFormat: "pptx",
  }));
}

describe("C-514 — expected vs received exhibits are counted", () => {
  it("counts a partial shortfall and names the exhibits that did not arrive", () => {
    const doc = goodDocument(); // ships exactly one 'matrix' exhibit
    const res = validateDeliverableQuality(doc, amsRfpRequest(), {
      expectedExhibits: expected(
        ["Service Tower Scope Map", "matrix"],
        ["Value at Stake Bridge", "chart"],
        ["Transition Sequence", "timeline"],
      ),
    });

    expect(res.metrics.expectedExhibitCount).toBe(3);
    expect(res.metrics.receivedExpectedExhibitCount).toBe(1);
    expect(res.metrics.missingExpectedExhibits).toEqual([
      "Value at Stake Bridge",
      "Transition Sequence",
    ]);

    const shortfall = res.warnings.find((w) => w.includes("expected exhibits"));
    expect(shortfall).toBeDefined();
    // The number is the point of the item: a reader must not have to infer the
    // shortfall from the absence of a slide.
    expect(shortfall).toContain("1 of 3");
    expect(shortfall).toContain("Value at Stake Bridge");
    expect(shortfall).toContain("Transition Sequence");
  });

  it("does not warn when every expected exhibit arrived", () => {
    const doc = goodDocument();
    const res = validateDeliverableQuality(doc, amsRfpRequest(), {
      expectedExhibits: expected(["Service Tower Scope Map", "matrix"]),
    });

    expect(res.metrics.expectedExhibitCount).toBe(1);
    expect(res.metrics.receivedExpectedExhibitCount).toBe(1);
    expect(res.metrics.missingExpectedExhibits).toEqual([]);
    expect(res.warnings.some((w) => w.includes("expected exhibits"))).toBe(
      false,
    );
  });

  it("credits one produced exhibit to one expected exhibit, never to two", () => {
    // Two matrices were asked for and one arrived. Matching by kind alone,
    // without consuming the match, would report 2 of 2 received and the
    // shortfall would vanish exactly where it matters most.
    const doc = goodDocument();
    const res = validateDeliverableQuality(doc, amsRfpRequest(), {
      expectedExhibits: expected(
        ["Service Tower Scope Map", "matrix"],
        ["Evaluation Weighting Matrix", "matrix"],
      ),
    });

    expect(res.metrics.receivedExpectedExhibitCount).toBe(1);
    expect(res.metrics.missingExpectedExhibits).toEqual([
      "Evaluation Weighting Matrix",
    ]);
  });

  it("reports zero received rather than staying silent when none arrived", () => {
    const doc = goodDocument();
    doc.exhibits = [];
    const res = validateDeliverableQuality(doc, amsRfpRequest(), {
      expectedExhibits: expected(["Transition Sequence", "timeline"]),
    });

    expect(res.metrics.expectedExhibitCount).toBe(1);
    expect(res.metrics.receivedExpectedExhibitCount).toBe(0);
    const shortfall = res.warnings.find((w) => w.includes("expected exhibits"));
    expect(shortfall).toContain("0 of 1");
  });

  it("the shortfall is advisory — it does not block the export on its own", () => {
    // Stated as its own case because escalating this to a blocker changes
    // whether a client artifact is refused, which is a product decision and is
    // deliberately not taken here.
    const doc = goodDocument();
    const res = validateDeliverableQuality(doc, amsRfpRequest(), {
      expectedExhibits: expected(
        ["Value at Stake Bridge", "chart"],
        ["Transition Sequence", "timeline"],
      ),
    });

    expect(res.metrics.receivedExpectedExhibitCount).toBe(0);
    expect(res.blockers.some((b) => b.includes("expected exhibits"))).toBe(
      false,
    );
  });

  it("stays silent when the brief expects no exhibits at all", () => {
    const doc = goodDocument();
    const res = validateDeliverableQuality(doc, amsRfpRequest(), {
      expectedExhibits: [],
    });

    expect(res.warnings.some((w) => w.includes("expected exhibits"))).toBe(
      false,
    );
    expect(res.metrics.expectedExhibitCount).toBe(0);
  });
});

// The half that decides whether this control exists at all. A correct counter
// the production orchestrator never hands a brief to is, from outside, the same
// as no counter — this repository has shipped that twice. So the case below
// drives `runDeliverableOrchestration` itself and reads the count off its
// returned quality result, rather than calling the validator directly.
describe("C-514 — the production orchestration path supplies the request side", () => {
  const req = amsRfpRequest();

  // Synthesis returns no `exhibits` at all — the omission #8417 permits.
  const stub: ModelCaller = async (prompt) => {
    switch (prompt.pass) {
      case "architect":
        return { text: JSON.stringify(goodPlan()), responseId: "r1" };
      case "section_draft":
        return {
          text: JSON.stringify({
            key: "sec",
            title: "Section",
            bodyMarkdown:
              "## Detail\nWe recommend proceeding. The baseline is supported by governed evidence [1]. " +
              "This section is complete and grounded. ".repeat(40),
            groundingMode: "mixed",
            citationsUsed: [1],
          }),
          responseId: "rs",
        };
      case "synthesis":
        return {
          text: JSON.stringify({
            title: "SkyHarbor Air — AMS RFP",
            recommendation:
              "We recommend issuing the RFP to the shortlisted vendors given the validated scope and the costed range.",
            nextActions: ["Issue RFP", "Brief vendors", "Open evaluation"],
            tables: [
              {
                key: "risk_register",
                title: "Risk / Issues / Dependencies",
                columns: ["Risk", "Owner"],
                rows: [["Transition risk", "PMO"]],
              },
            ],
            clientCompleteChecklist: [],
          }),
          responseId: "ry",
        };
      default:
        return { text: "{}" };
    }
  };

  it("counts the brief's exhibits against a generation that returned none", async () => {
    // Anchored to the brief the orchestrator actually resolves, so the case
    // cannot silently pass by asserting a number the brief no longer asks for.
    const briefExhibits = getArtifactBrief(req).expectedExhibits.length;
    expect(briefExhibits).toBeGreaterThan(0);

    const res = await runDeliverableOrchestration(req, stub);

    expect(res.quality?.metrics.expectedExhibitCount).toBe(briefExhibits);
    expect(res.quality?.metrics.receivedExpectedExhibitCount).toBe(0);
    expect(
      res.quality?.warnings.find((w) => w.includes("expected exhibits")),
    ).toContain(`0 of ${briefExhibits}`);
  });
});
