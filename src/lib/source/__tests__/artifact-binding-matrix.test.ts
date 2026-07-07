import {
  SOURCE_ARTIFACT_RENDERABLE_FORMATS,
  buildSourceArtifactBindingMatrix,
  listSourceArtifactBindingRows,
} from "@/lib/source/artifact-binding-matrix";
import { listSourceArtifactOperations } from "@/lib/source/artifact-operations";

describe("Source artifact upload/download binding matrix", () => {
  it("proves every declared upload format is accepted by the Source upload route", () => {
    const rows = listSourceArtifactBindingRows();
    const gaps = rows.filter((row) => row.uploadFormatGaps.length > 0);

    expect(gaps).toEqual([]);
    expect(rows).toHaveLength(33);
    expect(rows.every((row) => row.supportedUploads.length > 0)).toBe(true);
  });

  it("requires every wired artifact download to be backed by a real renderer", () => {
    const rows = listSourceArtifactBindingRows();
    const wiredDownloadGaps = rows.filter(
      (row) =>
        row.operationStatus === "wired" &&
        row.missingRendererForDeclaredDownloads.length > 0,
    );

    expect(wiredDownloadGaps).toEqual([]);
  });

  it("keeps gold-standard download declarations aligned with actual renderer coverage", () => {
    const rows = listSourceArtifactBindingRows();
    const rendererDocumentationGaps = rows.filter(
      (row) => row.rendererFormatsMissingFromGoldStandard.length > 0,
    );

    expect(rendererDocumentationGaps).toEqual([]);
    expect(SOURCE_ARTIFACT_RENDERABLE_FORMATS.get("d19_pricing_workbook")).toEqual([
      "docx",
      "pdf",
      "xlsx",
    ]);
  });

  it("does not pretend the vendor response pack is fully downloadable yet", () => {
    const vendorResponsePack = listSourceArtifactBindingRows().find(
      (row) => row.artifactCode === "d13_vendor_responses",
    );

    expect(vendorResponsePack).toBeDefined();
    expect(vendorResponsePack?.bindingStatus).toBe("partial");
    expect(vendorResponsePack?.missingRendererForDeclaredDownloads).toEqual([
      "html",
    ]);
    expect(vendorResponsePack?.nextGap).toContain("vendor picker");
  });

  it("summarizes the current data-binding posture honestly", () => {
    const matrix = buildSourceArtifactBindingMatrix(
      listSourceArtifactOperations(),
      "2026-06-05T00:00:00.000Z",
    );

    expect(matrix.summary.totalArtifacts).toBe(33);
    expect(matrix.summary.uploadIntakeReady).toBe(33);
    expect(matrix.summary.wired).toBeGreaterThanOrEqual(4);
    expect(matrix.summary.partial).toBeGreaterThan(0);
    expect(matrix.rows.every((row) => row.goldStandardTocCount >= 6)).toBe(true);
    expect(
      matrix.rows.every((row) => row.goldStandardExpectationCount >= 3),
    ).toBe(true);
  });
});
