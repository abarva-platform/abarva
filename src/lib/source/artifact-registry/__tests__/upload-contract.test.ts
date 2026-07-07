import {
  inferSourceArtifactFamily,
  sourceArtifactFormatFromMime,
} from "../upload-contract";
import { isAllowedSourceArtifactMimeType } from "../mime";

describe("Source artifact upload contract", () => {
  it("maps allowed office/document mime types to registry formats", () => {
    expect(sourceArtifactFormatFromMime("application/pdf")).toBe("pdf");
    expect(
      sourceArtifactFormatFromMime(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("docx");
    expect(
      sourceArtifactFormatFromMime(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("xlsx");
    expect(sourceArtifactFormatFromMime("text/markdown")).toBe("markdown");
  });

  it("accepts text/html as a first-class artifact format (gate records, deliverables)", () => {
    // Regression: gate approval records + board-grade deliverables render to HTML and
    // persist via registerSourceArtifactUpload. text/html missing from the allowlist
    // made every such write 500 (gate-decision pre-flight, 2026-06-11).
    expect(isAllowedSourceArtifactMimeType("text/html")).toBe(true);
    expect(sourceArtifactFormatFromMime("text/html")).toBe("html");
  });

  it("honors a valid requested family over filename and stage inference", () => {
    expect(
      inferSourceArtifactFamily({
        stageKey: "orals_bafo",
        filename: "meeting-notes.md",
        requestedFamily: "pricing_workbook",
      }),
    ).toBe("pricing_workbook");
  });

  it("infers Source families from sourcing filenames before falling back to stage", () => {
    expect(
      inferSourceArtifactFamily({
        stageKey: "orals_bafo",
        filename: "vendor-pricing-rates.xlsx",
      }),
    ).toBe("pricing_workbook");
    expect(
      inferSourceArtifactFamily({
        stageKey: "selection",
        filename: "BAFO-response.pdf",
      }),
    ).toBe("bafo");
    expect(
      inferSourceArtifactFamily({
        stageKey: "scope",
        filename: "unknown-upload.pdf",
      }),
    ).toBe("scope_document");
    expect(
      inferSourceArtifactFamily({
        stageKey: "value_realization",
        filename: "unknown-upload.pdf",
      }),
    ).toBe("value_ledger");
    expect(
      inferSourceArtifactFamily({
        stageKey: "evaluation",
        filename: "value-kpi-ledger.xlsx",
      }),
    ).toBe("value_ledger");
  });
});
