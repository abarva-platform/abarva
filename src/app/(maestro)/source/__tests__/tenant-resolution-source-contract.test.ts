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
    expect(source).toContain("/source");
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

  it("mounts the canonical Source route on the governed workspace substrate", () => {
    const source = readRepoFile("src/app/(maestro)/source/page.tsx");

    expect(source).toContain('from "./workspace/page"');
    expect(source).toContain('title: "Source · AbarVa"');
    expect(source).toContain("export default SourceWorkspacePage");
    expect(source).not.toContain('redirect("/source/workspace")');
  });

  it("keeps the Source 360 executive shell aligned to the command-center design contract", () => {
    const source = readRepoFile(
      "src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx",
    );
    const labelsMatch = source.match(
      /const PAGE_LABELS = \[([\s\S]*?)\] as const;/,
    );
    const pageLabelsSource = labelsMatch?.[1] ?? "";

    expect(pageLabelsSource).toBeTruthy();
    for (const label of [
      "Command",
      "Contracts",
      "Levers",
      "Evidence",
      "Coverage",
    ]) {
      expect(pageLabelsSource).toContain(`"${label}"`);
    }
    for (const oldLabel of [
      "Verdict",
      "Vendors",
      "Optimize",
      "Contract graph",
    ]) {
      expect(pageLabelsSource).not.toContain(`"${oldLabel}"`);
    }
    expect(source).not.toContain("SourceWorkspaceAppNav");
    expect(source).not.toContain('aria-label="Main application navigation"');
    expect(source).toContain('aria-label="Source workspace navigation"');
    expect(source).toContain("SourceCommandKpiStrip");
    expect(source).toContain("PortfolioPage");
    expect(source).toContain("CoveragePage");
    expect(source).toContain("EvidencePage");
    expect(source).not.toContain("sw-v2-action-toolbar-buttons");
  });

  it("keeps the route loading shell aligned to the live command-center navigation", () => {
    const source = readRepoFile(
      "src/app/(maestro)/source/workspace/SourceWorkspaceLoadingShell.tsx",
    );

    expect(source).not.toContain('aria-label="Main application navigation"');
    expect(source).not.toContain(
      'aria-current={label === "Source" ? "page" : undefined}',
    );
    for (const label of [
      "Command",
      "Contracts",
      "Levers",
      "Evidence",
      "Coverage",
    ]) {
      expect(source).toContain(`"${label}"`);
    }
    for (const oldLabel of [
      "Verdict",
      "Vendors",
      "Optimize",
      "Contract graph",
    ]) {
      expect(source).not.toContain(`"${oldLabel}"`);
    }
    expect(source).toContain("Preparing Source command center.");
  });
});
