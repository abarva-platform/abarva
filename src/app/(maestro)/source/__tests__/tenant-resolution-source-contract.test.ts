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
    expect(source).toContain("/source/preview/workspace");
    expect(source).toContain("sourceProvider");
    expect(source).toContain("contractId");
    expect(source).toContain("contractTab");
    expect(source).not.toContain("loadSourceV4WorkspaceSnapshot");
    expect(source).not.toContain("SourcePortfolioBookPage");
  });
});
