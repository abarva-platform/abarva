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

  it("uses the canonical tenant resolver before active-client row fallback on the portfolio", () => {
    const source = readRepoFile("src/app/(maestro)/source/portfolio/page.tsx");

    expect(source).toContain('from "@/lib/tenant/resolveTenant"');
    expect(source).toContain("resolveTenant().catch(() => null)");
    expect(source).toContain(
      "const clientKey = tenant?.appClientKey ?? activeClient?.key ?? null",
    );
    expect(source).toContain("name: tenant?.displayName ?? activeClient?.name");
    expect(source).toContain("loadSourceV4WorkspaceSnapshot(clientKey)");
    expect(source).not.toContain(
      "loadSourceV4WorkspaceSnapshot(activeClient.key)",
    );
  });
});
