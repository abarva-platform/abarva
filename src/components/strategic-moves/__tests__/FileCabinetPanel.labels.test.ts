import {
  artifactFormatLabel,
  artifactOutputRoleLabel,
} from "../FileCabinetPanel";

describe("FileCabinetPanel artifact labels", () => {
  it("distinguishes editable deliverables from visual review companions", () => {
    expect(
      artifactOutputRoleLabel({
        outputRole: "docx_editable_phase_record",
        fileFormat: "docx",
      }),
    ).toBe("Editable deliverable");
    expect(
      artifactOutputRoleLabel({
        outputRole: "html_visual_review_companion",
        fileFormat: "html",
      }),
    ).toBe("Visual review companion");
  });

  it("uses client-facing format language", () => {
    expect(artifactFormatLabel("docx")).toBe("Word-equivalent");
    expect(artifactFormatLabel("html")).toBe("HTML review view");
    expect(artifactFormatLabel("xlsx")).toBe("Excel model");
  });
});
