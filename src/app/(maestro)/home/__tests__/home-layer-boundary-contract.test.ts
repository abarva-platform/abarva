import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Home Layer 4 boundary contract", () => {
  it("keeps the mounted Home runtime out of Layer 1 and derived filesystem artifacts", () => {
    const homeRuntimeFiles = [
      "src/app/(maestro)/home/page.tsx",
      "src/components/home/preview/HomePreviewAppRoot.tsx",
      "src/components/home/v4/HomeV4App.tsx",
      "src/components/home/v4/ArchitecturePage.tsx",
      "src/components/home/v4/DataFlowPage.tsx",
      "src/components/home/v4/RecordBrowser.tsx",
    ];

    for (const file of homeRuntimeFiles) {
      const source = readRepoFile(file);
      expect(source).not.toContain("node:fs");
      expect(source).not.toContain("datasets/tenant-inputs");
      expect(source).not.toContain("derived/relationship-graph.json");
      expect(source).not.toContain("readDerivedRelationshipGraphEdges");
    }

    expect(
      fs.existsSync(
        path.join(ROOT, "src/lib/home/read-derived-relationship-graph.ts"),
      ),
    ).toBe(false);
  });

  it("keeps ECL demo-finding proof UI behind an explicit Home diagnostics flag", () => {
    const source = readRepoFile("src/app/(maestro)/home/preview/page.tsx");

    expect(source).toContain("function isEclDiagnosticsRequest");
    expect(source).toContain("const showEclDiagnostics");
    expect(source).toContain("isEclProvider && showEclDiagnostics");
    expect(source).not.toContain("isEclProvider ? <EclDemoFindingsPanel product=\"home\" /> : null");
  });

  it("keeps raw evidence identifiers off the executive Home surface", () => {
    const sourceLabel = readRepoFile("src/components/home/v4/source-label.ts");
    const claimCard = readRepoFile("src/components/home/preview/ClaimCard.tsx");
    const resolver = readRepoFile("src/components/home/preview/evidence-resolver.ts");

    expect(sourceLabel).toContain("Raw internal ids do not appear on the CXO surface");
    expect(sourceLabel).not.toContain("ids: evidenceIds.join");
    expect(claimCard).toContain("evidenceLabel(item)");
    expect(claimCard).not.toContain(">{item.id}");
    expect(resolver).not.toContain("Evidence id \"");
  });
});
