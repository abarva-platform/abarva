import {
  artifactTypeForUpload,
  safeArtifactSlug,
} from "../route";

describe("Move artifact upload route helpers", () => {
  it("keeps separate uploaded evidence files as separate current artifacts", () => {
    const shared = { family: "uploaded_evidence" as const, phase: 1 };
    const first = artifactTypeForUpload({
      ...shared,
      body: Buffer.from("current state process packet"),
      fileName: "current-state-process-packet.md",
    });
    const second = artifactTypeForUpload({
      ...shared,
      body: Buffer.from("application integration landscape"),
      fileName: "application-integration-landscape.csv",
    });
    const third = artifactTypeForUpload({
      ...shared,
      body: Buffer.from("outcome baseline KPI packet"),
      fileName: "outcome-baseline-kpi-packet.csv",
    });

    expect(new Set([first, second, third]).size).toBe(3);
    expect(first).toMatch(/^uploaded_evidence_p1_current_state_process_packet_[a-f0-9]{12}$/);
    expect(second).toMatch(/^uploaded_evidence_p1_application_integration_landscape_[a-f0-9]{12}$/);
    expect(third).toMatch(/^uploaded_evidence_p1_outcome_baseline_kpi_packet_[a-f0-9]{12}$/);
  });

  it("versions the same uploaded evidence file when filename and content match", () => {
    const args = {
      body: Buffer.from("same reviewed content"),
      family: "uploaded_evidence" as const,
      fileName: "Review Notes.pdf",
      phase: 2,
    };

    expect(artifactTypeForUpload(args)).toBe(artifactTypeForUpload(args));
  });

  it("does not change non-evidence artifact family keys", () => {
    expect(
      artifactTypeForUpload({
        body: Buffer.from("template"),
        family: "template",
        fileName: "Discovery Template.docx",
        phase: 2,
      }),
    ).toBe("template");
    expect(safeArtifactSlug("Discovery Template.docx")).toBe("discovery_template");
  });
});
