import JSZip from "jszip";

import { renderRoadmapPreviewHtml } from "../roadmap-preview-html-renderer";
import { renderRoadmapDetailDocx } from "../roadmap-docx-renderer";
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
    workstreamItems: [],
    risks: ["Data quality of ticket text"],
    caveats: ["Timing is illustrative until a committed plan is approved."],
    lineage: {
      moveId: "move-1",
      tenantKey: "meridian",
      architectureRef: "deliv-arch-1",
    },
    appendix: ["Full detail."],
  };
  return buildRoadmapPresentationContract(seed);
}

async function pptxText(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  return (
    await Promise.all(
      Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .map((n) => zip.files[n].async("string")),
    )
  ).join("\n");
}

async function docxText(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  return zip.files["word/document.xml"].async("string");
}

describe("cross-format synchronization — HTML, DOCX, PPTX derive from ONE contract", () => {
  it("all three embed the SAME contract version + content hash", async () => {
    const c = contract();
    const html = renderRoadmapPreviewHtml(c);
    const docx = await docxText(await renderRoadmapDetailDocx(c));
    const pptx = await pptxText(await renderExecutiveRoadmapPptx(c));
    for (const out of [html, docx, pptx]) {
      expect(out).toContain(c.contentHash);
      expect(out).toContain(c.contractVersion);
    }
  });

  it("all three carry the same executive conclusion", async () => {
    const c = contract();
    const needle = "four-horizon transition builds the foundation first";
    const html = renderRoadmapPreviewHtml(c);
    const docx = await docxText(await renderRoadmapDetailDocx(c));
    const pptx = await pptxText(await renderExecutiveRoadmapPptx(c));
    for (const out of [html, docx, pptx]) expect(out).toContain(needle);
  });

  it("all three carry the same governance/lifecycle state (review draft) and evidence discipline", async () => {
    const c = contract();
    const html = renderRoadmapPreviewHtml(c);
    const docx = await docxText(await renderRoadmapDetailDocx(c));
    const pptx = await pptxText(await renderExecutiveRoadmapPptx(c));
    for (const out of [html, docx, pptx]) {
      expect(out).toContain("Review draft");
      expect(out).toMatch(/Evidence required/);
    }
  });

  it("HTML labels itself the in-product preview, not the client deliverable", () => {
    const html = renderRoadmapPreviewHtml(contract());
    expect(html).toContain("In-product preview");
    expect(html).toMatch(/not the client deliverable/i);
  });

  it("changing the contract changes the hash embedded in all three (no stale drift)", async () => {
    const a = contract();
    const b = buildRoadmapPresentationContract({
      lifecycleState: "exit_approved_final",
      phase: 4,
      executiveConclusion: a.executiveConclusion,
      sponsorDecision: a.sponsorDecision,
      horizons: a.horizons,
      decisionGates: a.decisionGates,
      valueMilestones: a.valueMilestones,
      dependencies: a.dependencies,
      workstreamItems: a.workstreamItems,
      risks: a.risks,
      caveats: a.caveats,
      lineage: a.lineage,
      appendix: a.appendix,
    });
    expect(b.contentHash).not.toBe(a.contentHash);
    expect(renderRoadmapPreviewHtml(b)).toContain(b.contentHash);
    expect(renderRoadmapPreviewHtml(b)).not.toContain(a.contentHash);
  });
});
