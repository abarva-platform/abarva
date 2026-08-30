import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Source tenant identity binding", () => {
  it("uses the canonical tenant resolver for visible Source intake identity", () => {
    const source = readRepoFile("src/app/(maestro)/source/new/page.tsx");

    expect(source).toContain('from "@/lib/tenant/resolveTenant"');
    expect(source).toContain("const tenant = await resolveTenant()");
    expect(source).toContain("const clientKey = tenant?.appClientKey ?? null");
    expect(source).toContain("name: tenant?.displayName");
    expect(source).not.toContain('from "@/lib/active-client"');
  });

  it("archives the legacy portfolio route into the governed workspace", () => {
    const source = readRepoFile("src/app/(maestro)/source/portfolio/page.tsx");

    expect(source).toContain('from "next/navigation"');
    expect(source).toContain("/source/workspace");
    expect(source).toContain("sourceProvider");
    expect(source).toContain("contractId");
    expect(source).toContain("contractTab");
    expect(source).not.toContain("loadSourceV4WorkspaceSnapshot");
    expect(source).not.toContain("SourcePortfolioBookPage");
  });

  it("mounts Source 360 on the governed workspace substrate", () => {
    const source = readRepoFile("src/app/(maestro)/source/360/page.tsx");

    expect(source).toContain('from "../workspace/page"');
    expect(source).toContain('title: "Source 360 · AbarVa"');
    expect(source).toContain("export default SourceWorkspacePage");
  });

  it("keeps the Source 360 executive shell aligned to the six-tab design contract", () => {
    const source = readRepoFile(
      "src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx",
    );

    for (const label of [
      "Verdict",
      "Vendors",
      "Contracts",
      "Optimize",
      "Evidence",
      "Contract graph",
    ]) {
      expect(source).toContain(`"${label}"`);
    }
    expect(source).toContain("ClaimContract");
    expect(source).toContain("EvidencePage");
    expect(source).toContain("ContractGraphPage");
  });
});
