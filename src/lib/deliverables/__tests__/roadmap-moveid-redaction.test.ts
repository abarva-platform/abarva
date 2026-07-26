import JSZip from "jszip";

import {
  buildRoadmapPresentationContract,
  opaqueMoveRef,
} from "../roadmap-presentation-contract";
import { renderRoadmapPreviewHtml } from "../roadmap-preview-html-renderer";
import { renderRoadmapDetailDocx } from "../roadmap-docx-renderer";
import { renderExecutiveRoadmapPptx } from "../roadmap-pptx-renderer";

const MOVE_UUID = "3fc8e69f-ec3c-4f41-9311-2cf997d3e7f6";

function contract() {
  return buildRoadmapPresentationContract({
    lifecycleState: "review_draft",
    phase: 4,
    executiveConclusion:
      "A four-stage transition builds trusted data first, proves value, then scales only after controls hold.",
    sponsorDecision: "Authorize foundation funding.",
    horizons: [{ name: "Mobilize", outcome: "Funding set." }],
    decisionGates: [{ name: "Funding authorized" }],
    valueMilestones: [{ name: "First result" }],
    dependencies: [{ item: "data", evidenceStatus: "evidence_required" }],
    workstreamItems: [],
    risks: [],
    caveats: [],
    lineage: { moveId: MOVE_UUID, tenantKey: "meridian" },
    appendix: ["detail"],
  });
}

describe("PR16 — no raw Move UUID in client-facing outputs", () => {
  it("opaqueMoveRef is a stable non-UUID token", () => {
    const ref = opaqueMoveRef(MOVE_UUID);
    expect(ref).toMatch(/^move-[0-9a-f]{10}$/);
    expect(ref).not.toContain(MOVE_UUID);
    expect(opaqueMoveRef(MOVE_UUID)).toBe(ref); // deterministic
  });

  it("HTML preview shows the opaque ref, never the raw UUID", () => {
    const html = renderRoadmapPreviewHtml(contract());
    expect(html).not.toContain(MOVE_UUID);
    expect(html).toContain(opaqueMoveRef(MOVE_UUID));
    expect(html).toContain("tenant meridian"); // cover name is safe
  });

  it("DOCX contains the opaque ref, never the raw UUID", async () => {
    const buf = await renderRoadmapDetailDocx(contract());
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.files["word/document.xml"].async("string");
    expect(xml).not.toContain(MOVE_UUID);
    expect(xml).toContain(opaqueMoveRef(MOVE_UUID));
  });

  it("PPTX slides never contain the raw UUID", async () => {
    const buf = await renderExecutiveRoadmapPptx(contract());
    const zip = await JSZip.loadAsync(buf);
    const slides = (
      await Promise.all(
        Object.keys(zip.files)
          .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
          .map((n) => zip.files[n].async("string")),
      )
    ).join("\n");
    expect(slides).not.toContain(MOVE_UUID);
  });
});
