import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Source vendor response pack flow wiring", () => {
  it("surfaces a dedicated vendor response intake on the vendor response pack artifact", () => {
    const documentTab = read(
      "src/components/source/canvas/workspace-tabs/DocumentTab.tsx",
    );
    const panel = read(
      "src/components/source/canvas/workspace-tabs/VendorResponsePackPanel.tsx",
    );

    expect(documentTab).toContain("d13_vendor_responses");
    expect(documentTab).toContain("VendorResponsePackPanel");
    expect(panel).toContain("DOCX, PDF, XLSX, and PPTX");
    expect(panel).toContain("d13_vendor_responses");
    expect(panel).toContain("artifactFamily");
    expect(panel).toContain("proposal");
    expect(panel).toContain("vendor_response_pack");
    expect(panel).toContain("/artifacts/upload");
  });

  it("logs artifact uploads into the visible Source activity stream", () => {
    const uploadRoute = read(
      "src/app/api/v1/source/[eventId]/artifacts/upload/route.ts",
    );

    expect(uploadRoute).toContain("selectSourceWriteAdapter");
    expect(uploadRoute).toContain("insertActivityLog");
    expect(uploadRoute).toContain("artifact_uploaded");
    expect(uploadRoute).toContain("Uploaded Source document");
    expect(uploadRoute).toContain("externalSend: false");
  });
});
