import { existsSync, readFileSync } from "node:fs";

describe("Intelligence route agent shell wiring", () => {
  const maestroPageSource = readFileSync(
    "src/app/(maestro)/intelligence/page.tsx",
    "utf8",
  );
  const v2SurfaceSource = readFileSync(
    "src/components/intelligence-v2/IntelligenceV2Surface.tsx",
    "utf8",
  );

  it("renders the tenant-bound Intelligence surface through the maestro shell", () => {
    expect(maestroPageSource).toContain("AppShell");
    expect(maestroPageSource).toContain('surface="intelligence"');
    expect(maestroPageSource).toContain("IntelligenceV2Surface");
    expect(maestroPageSource).toContain("getIntelligenceBindingPayload");
    expect(maestroPageSource).toContain("notFound()");
  });

  it("does not keep a root or explorer fallback page for /intelligence", () => {
    expect(existsSync("src/app/(maestro)/intelligence/page.tsx")).toBe(true);
    expect(existsSync("src/app/intelligence/page.tsx")).toBe(false);
    expect(
      existsSync("src/components/intelligence-v4/ContextCorpusExplorerPage.tsx"),
    ).toBe(false);
    expect(maestroPageSource).not.toContain("ContextCorpusExplorerPage");
    expect(maestroPageSource).not.toContain("getAiControlTowerReadModel");
    expect(maestroPageSource).not.toContain(
      "getEnterpriseContextOverviewForTenant",
    );
  });

  it("uses the shared aVa chat shell, not the old centered ask control", () => {
    expect(v2SurfaceSource).toContain("AvaChatShell");
    expect(v2SurfaceSource).toContain('surface="intelligence"');
    expect(v2SurfaceSource).toContain('defaultLeftPercent={34}');
    expect(v2SurfaceSource).not.toContain("from \"@/components/agent-answer/AvaAsk\"");
    expect(v2SurfaceSource).not.toContain("<AvaAsk");
    expect(v2SurfaceSource).not.toContain(".iv2 .ask");
    expect(v2SurfaceSource).not.toContain("Ask anything about");
  });
});
