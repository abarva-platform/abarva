import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeEnglishSummary } from "@/lib/home/home-english-summary";
import {
  buildHomeSummarySnapshot,
  buildHomeSummarySnapshotFromModuleContext,
} from "@/lib/home/home-summary-snapshot";
import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";
import {
  explainModuleContext,
  getModuleContext,
} from "@/lib/enterprise-data/module-context-serving/module-context-serving";
import type { ModuleContextReadRequest } from "@/lib/enterprise-data/contracts/module-context-apis";

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

  it("keeps Home supplier-context rollups specific instead of cloning tenant totals", async () => {
    const request: ModuleContextReadRequest = {
      tenantKey: "skyharbor-air",
      moduleKey: "home" as const,
      purpose: "context_summary" as const,
      requestedDomains: [
        "enterprise_profile",
        "functions",
        "applications_systems",
        "vendors_contracts",
        "data_assets_integrations",
        "programs_priorities",
        "risks_controls",
        "metrics_outcomes",
        "relationships",
        "evidence_sources",
      ],
    };
    const moduleContext = await getModuleContext(request, {
      repoRoot: process.cwd(),
      generatedAt: "2026-07-13T12:00:00.000Z",
    });
    const explanation = await explainModuleContext(request, {
      repoRoot: process.cwd(),
      generatedAt: "2026-07-13T12:00:00.000Z",
    });
    const snapshot = buildHomeSummarySnapshotFromModuleContext({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      moduleContext,
      moduleContextExplanation: explanation,
      generatedAt: "2026-07-13T12:00:00.000Z",
      repoRoot: process.cwd(),
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

    expect(area("Applications & Systems")?.loadedCount).toBe(626);
    expect(area("Vendors & Contracts")?.loadedCount).toBe(140);
    expect(area("Data Assets")?.loadedCount).toBe(570);
    expect(area("Metrics / KPIs")?.loadedCount).toBe(136);
    expect(area("Relationships")?.loadedCount).toBe(208);
    expect(loadedSignatures.size).toBeGreaterThan(5);
  });

  it("builds an active Home snapshot from the module context serving contract", async () => {
    const request: ModuleContextReadRequest = {
      tenantKey: "skyharbor-air",
      moduleKey: "home" as const,
      purpose: "context_summary" as const,
      requestedDomains: [
        "enterprise_profile",
        "functions",
        "applications_systems",
        "vendors_contracts",
        "data_assets_integrations",
        "programs_priorities",
        "risks_controls",
        "metrics_outcomes",
        "relationships",
        "evidence_sources",
      ],
    };
    const moduleContext = await getModuleContext(request, {
      repoRoot: process.cwd(),
      generatedAt: "2026-07-14T00:00:00.000Z",
    });
    const explanation = await explainModuleContext(request, {
      repoRoot: process.cwd(),
      generatedAt: "2026-07-14T00:00:00.000Z",
    });

    const snapshot = buildHomeSummarySnapshotFromModuleContext({
      tenantKey: "skyharbor-air",
      displayName: "Airline Demo",
      industry: "Airline",
      moduleContext,
      moduleContextExplanation: explanation,
      generatedAt: "2026-07-14T00:00:00.000Z",
      repoRoot: process.cwd(),
    });
    const area = (displayName: string) =>
      snapshot.contextAreas.find((entry) => entry.displayName === displayName);

    expect(snapshot.moduleContextSummary?.sourceMode).toBe(
      "active_tenant_access",
    );
    expect(snapshot.lineage.tenantDataVersionId).toBe(
      moduleContext.activeTenantAccessVersionId,
    );
    expect(snapshot.guardrails.callsClaude).toBe(false);
    expect(snapshot.guardrails.candidateReadByDefault).toBe(false);
    expect(snapshot.tenantProfileHeader.displayName).toBe("SkyHarbor Air");
    expect(snapshot.executiveProfile.contextDepthWidth.loadedRecords).toBe(
      moduleContext.domains.reduce(
        (sum, domain) => sum + domain.acceptedRecords,
        0,
      ),
    );
    expect(area("Applications & Systems")?.loadedCount).toBeGreaterThan(600);
    expect(area("Data Assets")?.loadedCount).toBeGreaterThan(500);
    expect(snapshot.moduleContextSummary?.contextCompleteness.overall).toBe(
      "Good",
    );
    expect(snapshot.avaScope.canAnswer).toEqual(
      expect.arrayContaining([
        "What context is available for this tenant?",
      ]),
    );
  });

  it("does not let Home supplier snapshots fall back to candidate data when active access is missing", async () => {
    const request: ModuleContextReadRequest = {
      tenantKey: "meridian-health",
      moduleKey: "home" as const,
      purpose: "context_summary" as const,
      requestedDomains: ["enterprise_profile", "applications_systems"],
    };
    const moduleContext = await getModuleContext(request, {
      repoRoot: process.cwd(),
      generatedAt: "2026-07-14T00:00:00.000Z",
    });
    const explanation = await explainModuleContext(request, {
      repoRoot: process.cwd(),
      generatedAt: "2026-07-14T00:00:00.000Z",
    });

    const snapshot = buildHomeSummarySnapshotFromModuleContext({
      tenantKey: "meridian-health",
      displayName: "Healthcare Demo",
      industry: "Healthcare",
      moduleContext,
      moduleContextExplanation: explanation,
      generatedAt: "2026-07-14T00:00:00.000Z",
      repoRoot: process.cwd(),
    });

    expect(moduleContext.sourceMode).toBe("active_not_available");
    expect(moduleContext.records).toHaveLength(0);
    expect(moduleContext.guardrails.candidateDataConsumed).toBe(false);
    expect(snapshot.lineage.status).toBe("blocked");
    expect(snapshot.moduleContextSummary?.sourceMode).toBe(
      "active_not_available",
    );
    expect(snapshot.executiveProfile.contextDepthWidth.loadedRecords).toBe(0);
    expect(snapshot.avaScope.mustRefuseOrMarkUnsupported).toEqual(
      expect.arrayContaining([
        "Do not claim candidate preview data is active tenant truth.",
      ]),
    );
  });
});
