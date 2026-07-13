import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeEnglishSummary } from "@/lib/home/home-english-summary";
import { buildHomeSummarySnapshot } from "@/lib/home/home-summary-snapshot";
import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

describe("HomeSummarySnapshot", () => {
  it("builds a deterministic, structured active Home snapshot without model calls or writes", () => {
    const browser = getHomeV6ContextBrowser("skyharbor");
    const dataQuality = buildHomeDataQualityModel({
      tenantKey: "skyharbor-air",
      tenantDisplayName: "Airline Demo",
      browser,
      candidatePreviewEnabled: false,
    });
    const englishSummary = buildHomeEnglishSummary(dataQuality);
    const first = buildHomeSummarySnapshot({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      mode: "active_home_context",
      browser,
      dataQuality,
      englishSummary,
      generatedAt: "2026-07-13T12:00:00.000Z",
    });
    const second = buildHomeSummarySnapshot({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      mode: "active_home_context",
      browser,
      dataQuality,
      englishSummary,
      generatedAt: "2026-07-13T12:00:00.000Z",
    });

    expect(first.contractVersion).toBe("home_summary_snapshot.v1");
    expect(first.lineage.inputFingerprint).toBe(
      second.lineage.inputFingerprint,
    );
    expect(first.guardrails.callsClaude).toBe(false);
    expect(first.guardrails.productionTenantDataWritten).toBe(false);
    expect(first.guardrails.activeTenantAccessLayerUpdated).toBe(false);
    expect(first.guardrails.candidatePromoted).toBe(false);
    expect(first.contextAreas.map((area) => area.displayName)).toEqual(
      expect.arrayContaining([
        "Business Functions",
        "Applications & Systems",
        "Vendors & Contracts",
        "Data Assets",
        "Integrations",
        "Programs & Initiatives",
        "Risks & Controls",
        "Metrics / KPIs",
        "Evidence Sources",
        "Relationships",
      ]),
    );
  });

  it("keeps SkyHarbor partial active context and upstream source warnings visible", () => {
    const snapshot = buildHomeSummarySnapshot({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      browser: getHomeV6ContextBrowser("skyharbor"),
      generatedAt: "2026-07-13T12:00:00.000Z",
    });
    const text = JSON.stringify(snapshot).toLowerCase();

    expect(snapshot.lineage.mode).toBe("active_home_context");
    expect(text).toContain("partial");
    expect(text).toContain("source-rich");
    expect(text).toContain("applications");
    expect(text).toContain("relationship");
    expect(text).toContain("candidate");
    expect(snapshot.dataQualitySummary.manifestCompleteness).toMatch(
      /source-rich/i,
    );
  });

  it("separates candidate preview from default active Home truth", () => {
    const active = buildHomeSummarySnapshot({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      browser: getHomeV6ContextBrowser("skyharbor"),
      mode: "active_home_context",
      generatedAt: "2026-07-13T12:00:00.000Z",
    });
    const preview = buildHomeSummarySnapshot({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      browser: getHomeV6ContextBrowser("skyharbor"),
      mode: "candidate_preview",
      generatedAt: "2026-07-13T12:00:00.000Z",
    });

    expect(active.tenantProfileHeader.candidatePreviewStatus).toBe(
      "Not active",
    );
    expect(active.guardrails.candidateReadByDefault).toBe(false);
    expect(preview.lineage.mode).toBe("candidate_preview");
    expect(preview.tenantProfileHeader.candidatePreviewStatus).not.toBe(
      "Not active",
    );
    expect(preview.guardrails.candidatePromoted).toBe(false);
  });

  it("aligns aVa prompts and refusal scope to the same snapshot", () => {
    const snapshot = buildHomeSummarySnapshot({
      tenantKey: "meridian-health",
      displayName: "Healthcare Demo",
      industry: "Healthcare",
      browser: getHomeV6ContextBrowser("meridian"),
      generatedAt: "2026-07-13T12:00:00.000Z",
    });

    expect(snapshot.avaScope.suggestedPrompts).toEqual(
      expect.arrayContaining([
        "Explain this company in plain English.",
        "What does AbarVa know?",
        "What is missing?",
        "What can I safely ask?",
      ]),
    );
    expect(snapshot.avaScope.canAnswer.length).toBeGreaterThan(0);
    expect(
      snapshot.avaScope.mustRefuseOrMarkUnsupported.length,
    ).toBeGreaterThan(0);
    expect(snapshot.avaScope.sourceSnapshotReference).toBe(
      `${snapshot.tenantProfileHeader.tenantKey}:${snapshot.lineage.mode}`,
    );
  });

  it("uses the governed Meridian enterprise profile instead of thin Home browser labels", () => {
    const snapshot = buildHomeSummarySnapshot({
      tenantKey: "meridian-health",
      displayName: "Healthcare Demo",
      industry: "Healthcare",
      browser: getHomeV6ContextBrowser("meridian"),
      generatedAt: "2026-07-13T12:00:00.000Z",
    });
    const profile = snapshot.tenantProfileHeader;
    const firstSummaryLine =
      snapshot.executiveProfile.companySummaryFacts[0] ?? "";
    const businessSignals = snapshot.executiveProfile.businessModelSignals;
    const prioritySignals = snapshot.executiveProfile.strategicPrioritySignals;

    expect(profile.displayName).toBe("Meridian Health System");
    expect(profile.legalName).toBe("Meridian Health System");
    expect(profile.subIndustry).toBe(
      "Integrated delivery network and health plan",
    );
    expect(profile.headquarters).toBe("Sacramento, CA");
    expect(profile.revenue).toBe("$16.8B");
    expect(profile.employees).toBe("58,000");
    expect(profile.revenueVerified).toBe(true);
    expect(profile.employeesVerified).toBe(true);
    expect(profile.businessModel).toMatch(
      /Integrated provider and payer organization/i,
    );
    expect(profile.businessSegments).toEqual(
      expect.arrayContaining([
        "Clinical delivery",
        "Health plan operations",
        "Enterprise analytics",
      ]),
    );
    expect(profile.strategicPriorities).toEqual(
      expect.arrayContaining([
        "Unified clinical and claims lakehouse",
        "Payment integrity",
        "Automated close and reporting",
      ]),
    );
    expect(firstSummaryLine).toMatch(/Meridian Health System/i);
    expect(firstSummaryLine).toMatch(/Sacramento, CA/i);
    expect(firstSummaryLine).toMatch(/\$16\.8B/i);
    expect(firstSummaryLine).toMatch(/58,000 employees/i);
    expect(businessSignals.join(" ")).toMatch(
      /Integrated provider and payer organization/i,
    );
    expect(prioritySignals.join(" ")).toMatch(
      /Unified clinical and claims lakehouse/i,
    );
    expect(new Set(prioritySignals)).not.toEqual(new Set(["Healthcare Demo"]));
  });

  it("keeps Home dimension rollups specific instead of cloning tenant totals", () => {
    const snapshot = buildHomeSummarySnapshot({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      browser: getHomeV6ContextBrowser("skyharbor"),
      generatedAt: "2026-07-13T12:00:00.000Z",
    });
    const area = (displayName: string) =>
      snapshot.contextAreas.find((entry) => entry.displayName === displayName);
    const loadedSignatures = new Set(
      snapshot.contextAreas
        .filter((entry) => entry.loadedCount > 0)
        .map(
          (entry) =>
            `${entry.loadedCount}:${entry.sourceCount}:${entry.evidenceCount}`,
        ),
    );

    expect(area("Applications & Systems")?.loadedCount).toBe(956);
    expect(area("Vendors & Contracts")?.loadedCount).toBe(320);
    expect(area("Integrations")?.loadedCount).toBe(2236);
    expect(area("Metrics / KPIs")?.loadedCount).toBe(797);
    expect(area("Relationships")?.loadedCount).toBe(0);
    expect(loadedSignatures.size).toBeGreaterThan(5);
  });
});
