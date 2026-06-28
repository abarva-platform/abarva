import JSZip from "jszip";

import {
  buildPhaseWordEquivalentDocx,
  phaseWordEquivalentFileName,
} from "../phase-word-equivalent";

describe("phase Word-equivalent deliverable", () => {
  it("renders a real editable DOCX with the phase-end document sections", async () => {
    const bytes = await buildPhaseWordEquivalentDocx({
      artifact: "discovery_report",
      phase: 2,
      moveName: "Lakeshore Back-office Automation",
      title: "Current State Process and Diagnostic",
      html: "<html><body><h1>Current-state process flow</h1><p>AP exception aging and handoff friction.</p></body></html>",
      generationMode: "draft",
      reviewStatus: "review_required",
      qualityStatus: "Draft quality passed",
      goldenBarStatus: "Passed with caveats",
      context: {
        moveId: "move-1",
        tenantKey: "lakeshore",
        useCase: "Back-office automation",
        currentState: "AP exception handling relies on manual triage.",
        gaps: ["Named sponsor approval is still required."],
        rootCauses: ["Invoice exception work is split across process owners."],
        metricsThatMatter: [
          {
            label: "Exception volume",
            value: "1,200/month",
            source: "Client-loaded operational evidence",
          },
        ],
        evidenceMap: [
          {
            claim: "AP exceptions drive manual work",
            source: "Discovery workshop notes",
          },
        ],
        decisions: [],
        humanApprovalNotes: [],
      },
    });

    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 2).toString("latin1")).toBe("PK");
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file("word/document.xml")!.async("string");
    const text = xml.replace(/<[^>]+>/g, " ");
    expect(text).toContain("Executive Summary");
    expect(text).toContain("Storyline and Narrative Arc");
    expect(text).toContain("Workshop and Session Evidence Required");
    expect(text).toContain("Client-to-Complete Fields");
    expect(text).toContain("Derived Visualization Inventory");
    expect(text).toContain("AbarVa-generated visualizations derived from client-loaded evidence");
  });

  it("uses a client-readable docx filename", () => {
    expect(
      phaseWordEquivalentFileName({
        title: "Current State Process and Diagnostic",
        artifact: "discovery_report",
        version: 3,
      }),
    ).toBe(
      "current-state-process-and-diagnostic-editable-phase-deliverable-v3.docx",
    );
  });
});
