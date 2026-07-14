import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeEnglishSummary } from "@/lib/home/home-english-summary";
import { buildHomeRuntimeSummarySnapshot } from "@/lib/home/home-summary-runtime";
import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

describe("buildHomeRuntimeSummarySnapshot", () => {
  it("uses active module context when Active Tenant Access is available", async () => {
    const snapshot = await buildHomeRuntimeSummarySnapshot({
      repoRoot: process.cwd(),
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      generatedAt: "2026-07-14T00:00:00.000Z",
    });

    expect(snapshot.moduleContextSummary?.sourceMode).toBe(
      "active_tenant_access",
    );
    expect(snapshot.executiveProfile.contextDepthWidth.loadedRecords).toBe(
      1970,
    );
    expect(
      snapshot.contextAreas.find(
        (area) => area.displayName === "Applications & Systems",
      )?.loadedCount,
    ).toBe(626);
    expect(snapshot.guardrails.candidateReadByDefault).toBe(false);
  });

  it("falls back to the existing Home snapshot when active access is unavailable", async () => {
    const browser = getHomeV6ContextBrowser("meridian");
    const dataQuality = buildHomeDataQualityModel({
      tenantKey: "meridian-health",
      tenantDisplayName: "Healthcare Demo",
      candidatePreviewEnabled: false,
      browser,
    });
    const englishSummary = buildHomeEnglishSummary(dataQuality);

    const snapshot = await buildHomeRuntimeSummarySnapshot({
      repoRoot: process.cwd(),
      tenantKey: "meridian-health",
      displayName: "Healthcare Demo",
      industry: "Healthcare",
      browser,
      dataQuality,
      englishSummary,
      generatedAt: "2026-07-14T00:00:00.000Z",
    });

    expect(snapshot.moduleContextSummary).toBeUndefined();
    expect(snapshot.tenantProfileHeader.displayName).toBe(
      "Meridian Health System",
    );
    expect(snapshot.guardrails.candidateReadByDefault).toBe(false);
    expect(snapshot.lineage.mode).toBe("active_home_context");
  });

  it("does not use active module context for explicit candidate preview mode", async () => {
    const snapshot = await buildHomeRuntimeSummarySnapshot({
      repoRoot: process.cwd(),
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      mode: "candidate_preview",
      generatedAt: "2026-07-14T00:00:00.000Z",
    });

    expect(snapshot.moduleContextSummary).toBeUndefined();
    expect(snapshot.lineage.mode).toBe("candidate_preview");
    expect(snapshot.guardrails.candidatePromoted).toBe(false);
  });
});
