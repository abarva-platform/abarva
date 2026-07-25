import JSZip from "jszip";

import { renderExecutiveRoadmapPptx } from "../roadmap-pptx-renderer";
import {
  buildRoadmapPresentationContract,
  type RoadmapContractSeed,
} from "../roadmap-presentation-contract";

function contract() {
  const seed: Omit<RoadmapContractSeed, "contractVersion"> = {
    lifecycleState: "review_draft",
    phase: 4,
    executiveConclusion:
      "A four-horizon transition builds the foundation first, proves value in one function, then scales only after controls hold.",
    sponsorDecision:
      "Authorize foundation funding and confirm decision rights.",
    horizons: [
      {
        name: "Mobilize",
        outcome: "Sponsorship, funding and decision rights established.",
      },
      {
        name: "Establish Foundation",
        outcome: "Trusted data and control loop operational.",
      },
      {
        name: "Deliver Priority Outcomes",
        outcome: "One function live with a measurable result.",
      },
      {
        name: "Scale and Optimize",
        outcome: "Repeatable operating model extends value.",
      },
    ],
    decisionGates: [
      {
        name: "Funding authorized",
        betweenHorizons: "Mobilize → Establish Foundation",
      },
      { name: "Pilot value validated", betweenHorizons: "Deliver → Scale" },
    ],
    valueMilestones: [
      { name: "Baseline approved", horizon: "Mobilize" },
      {
        name: "First measurable result demonstrated",
        horizon: "Deliver Priority Outcomes",
      },
    ],
    dependencies: [
      {
        item: "ITSM text + taxonomy access",
        evidenceStatus: "evidence_required",
      },
      {
        item: "Named process/data owners",
        evidenceStatus: "client_decision_required",
      },
    ],
    workstreamItems: [],
    risks: ["Data quality of ticket text", "Control maturity"],
    caveats: ["Timing is illustrative until a committed plan is approved."],
    lineage: {
      moveId: "move-1",
      tenantKey: "meridian",
      architectureRef: "deliv-arch-1",
    },
    appendix: ["Full workstream×horizon detail."],
  };
  return buildRoadmapPresentationContract(seed);
}

describe("renderExecutiveRoadmapPptx — native editable objects, not a flattened image", () => {
  it("produces a valid .pptx (zip) with 5-6 slides", async () => {
    const buf = await renderExecutiveRoadmapPptx(contract());
    expect(Buffer.isBuffer(buf)).toBe(true);
    const zip = await JSZip.loadAsync(buf);
    // OOXML package markers
    expect(zip.file("[Content_Types].xml")).not.toBeNull();
    const slideNames = Object.keys(zip.files).filter((n) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(n),
    );
    expect(slideNames.length).toBeGreaterThanOrEqual(5);
    expect(slideNames.length).toBeLessThanOrEqual(6);
  });

  it("slides contain NATIVE editable text runs, shapes and a table (no full-slide image)", async () => {
    const buf = await renderExecutiveRoadmapPptx(contract());
    const zip = await JSZip.loadAsync(buf);
    const slideXml = await Promise.all(
      Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .map((n) => zip.files[n].async("string")),
    );
    const all = slideXml.join("\n");
    // native editable text runs
    expect(all).toMatch(/<a:t>/);
    // native shapes (text boxes / bands / gates / milestones)
    expect(all).toMatch(/<p:sp>/);
    // native table (dependencies)
    expect(all).toMatch(/<a:tbl>/);
    // NOT a flattened deck: no embedded picture as a full-slide background
    expect(all).not.toMatch(/<p:pic>/);
  });

  it("carries the message-led conclusion, evidence-status labels and the governance/contract stamp as real text", async () => {
    const c = contract();
    const buf = await renderExecutiveRoadmapPptx(c);
    const zip = await JSZip.loadAsync(buf);
    const all = (
      await Promise.all(
        Object.keys(zip.files)
          .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
          .map((n) => zip.files[n].async("string")),
      )
    ).join("\n");
    // message-led conclusion text is present verbatim (native text, editable)
    expect(all).toContain(
      "four-horizon transition builds the foundation first",
    );
    // outcome-led horizon text
    expect(all).toContain(
      "Sponsorship, funding and decision rights established.",
    );
    // evidence-status labels visible
    expect(all).toMatch(/Evidence required|Client decision required/);
    // review-draft governance state visible + contract hash stamp embedded
    expect(all).toContain("Review draft");
    expect(all).toContain(c.contentHash);
    // no unsupported precision leaked into the deck
    expect(all).not.toMatch(/\bsprint\s?\d/i);
    expect(all).not.toMatch(/\bgantt\b/i);
  });
});
