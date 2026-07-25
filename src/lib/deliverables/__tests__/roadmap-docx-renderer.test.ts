import JSZip from "jszip";

import { renderRoadmapDetailDocx } from "../roadmap-docx-renderer";
import {
  buildRoadmapPresentationContract,
  type RoadmapContractSeed,
} from "../roadmap-presentation-contract";

function contract() {
  const seed: Omit<RoadmapContractSeed, "contractVersion"> = {
    lifecycleState: "review_draft",
    phase: 4,
    executiveConclusion:
      "A four-horizon transition builds the foundation first, proves value in one function, then scales.",
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
    ],
    decisionGates: [
      {
        name: "Funding authorized",
        betweenHorizons: "Mobilize → Establish Foundation",
      },
    ],
    valueMilestones: [
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
    ],
    workstreamItems: [
      {
        workstream: "Data",
        horizon: "Establish Foundation",
        outcome: "Trusted source identified",
        evidenceStatus: "recommended",
      },
    ],
    risks: ["Data quality of ticket text"],
    caveats: ["Timing is illustrative until a committed plan is approved."],
    lineage: {
      moveId: "move-1",
      tenantKey: "meridian",
      architectureRef: "deliv-arch-1",
    },
    appendix: ["Full workstream×horizon detail table and evidence basis."],
  };
  return buildRoadmapPresentationContract(seed);
}

describe("renderRoadmapDetailDocx — editable Word detail with appendices", () => {
  it("produces a valid .docx (zip) with a word document part", async () => {
    const buf = await renderRoadmapDetailDocx(contract());
    expect(Buffer.isBuffer(buf)).toBe(true);
    const zip = await JSZip.loadAsync(buf);
    expect(zip.file("[Content_Types].xml")).not.toBeNull();
    expect(zip.file("word/document.xml")).not.toBeNull();
  });

  it("is native editable Word (paragraphs + tables), not composed of screenshots", async () => {
    const buf = await renderRoadmapDetailDocx(contract());
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.files["word/document.xml"].async("string");
    // native paragraphs + runs + a table
    expect(doc).toMatch(/<w:p[ >]/);
    expect(doc).toMatch(/<w:t[ >]/);
    expect(doc).toMatch(/<w:tbl>/);
    // no embedded raster image (not screenshot-composed)
    expect(zip.file(/word\/media\//)).toHaveLength(0);
  });

  it("carries the executive summary up front and detail in appendices, with contract stamp + evidence labels", async () => {
    const c = contract();
    const buf = await renderRoadmapDetailDocx(c);
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.files["word/document.xml"].async("string");
    expect(doc).toContain("Executive summary");
    expect(doc).toContain("Appendix A — Workstream detail by horizon");
    expect(doc).toContain(
      "A four-horizon transition builds the foundation first",
    );
    // evidence-status labels present
    expect(doc).toMatch(/Evidence required|Recommended/);
    // provenance: the contract hash is embedded so it ties to the same source as PPTX/HTML
    expect(doc).toContain(c.contentHash);
  });
});
