import { getModuleContext } from "../module-context-serving";

describe("module context serving contract", () => {
  it("defaults to active mode and does not consume candidate data", async () => {
    const packet = await getModuleContext(
      {
        tenantKey: "skyharbor-air",
        moduleKey: "moves",
        purpose: "evidence_extract",
        requestedDomains: ["applications_systems", "data_assets_integrations"],
        relationshipPolicy: "candidates",
      },
      {
        repoRoot: process.cwd(),
        generatedAt: "2026-07-14T00:00:00.000Z",
      },
    );

    expect(packet.mode).toBe("active");
    expect(packet.sourceMode).toBe("active_tenant_access");
    expect(packet.activeTenantAccessVersionId).toBeTruthy();
    expect(packet.candidateVersionId).toBeNull();
    expect(packet.records).toHaveLength(0);
    expect(packet.relationshipCandidates).toHaveLength(0);
    expect(packet.guardrails.activeByDefault).toBe(true);
    expect(packet.guardrails.candidatePreviewRequiresExplicitMode).toBe(true);
    expect(packet.guardrails.candidatePreviewExplicitlyRequested).toBe(false);
    expect(packet.guardrails.defaultModuleReadsCandidateData).toBe(false);
    expect(packet.guardrails.candidateDataConsumed).toBe(false);
    expect(packet.guardrails.moveRuntimeModified).toBe(false);
    expect(packet.guardrails.moveEvidenceCreated).toBe(false);
    expect(packet.guardrails.moduleRuntimeConsumptionChanged).toBe(false);
  });

  it("keeps active mode from falling back to candidate data when active access is missing", async () => {
    const packet = await getModuleContext(
      {
        tenantKey: "meridian-health",
        moduleKey: "home",
        purpose: "context_summary",
        requestedDomains: ["enterprise_profile", "applications_systems"],
      },
      {
        repoRoot: process.cwd(),
        generatedAt: "2026-07-14T00:00:00.000Z",
      },
    );

    expect(packet.mode).toBe("active");
    expect(packet.sourceMode).toBe("active_not_available");
    expect(packet.activeTenantAccessVersionId).toBeNull();
    expect(packet.candidateVersionId).toBeNull();
    expect(packet.records).toHaveLength(0);
    expect(packet.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gapId: "meridian-health:active-access-record-missing",
          severity: "blocker",
        }),
      ]),
    );
    expect(packet.guardrails.candidateDataConsumed).toBe(false);
    expect(packet.guardrails.homeReadsCandidateByDefault).toBe(false);
  });

  it("returns inactive candidate context only when candidate preview is explicit", async () => {
    const packet = await getModuleContext(
      {
        tenantKey: "skyharbor-air",
        moduleKey: "moves",
        purpose: "evidence_extract",
        mode: "candidate_preview",
        requestedDomains: ["applications_systems", "data_assets_integrations"],
        relationshipPolicy: "candidates",
        scope: {
          moveId: "move-demo",
          phase: "P2",
          targetPhase: "P3",
          useCase: "IROP recovery command",
          evidenceFamilies: ["systems", "data assets"],
        },
      },
      {
        repoRoot: process.cwd(),
        generatedAt: "2026-07-14T00:00:00.000Z",
      },
    );

    expect(packet.mode).toBe("candidate_preview");
    expect(packet.sourceMode).toBe("inactive_candidate_read_model");
    expect(packet.activeTenantAccessVersionId).toBeNull();
    expect(packet.candidateVersionId).toContain("candidate:skyharbor-air:");
    expect(packet.records.length).toBeGreaterThan(0);
    expect(packet.records.every((record) => record.agentReadiness === "candidate_only")).toBe(true);
    expect(packet.records.every((record) => record.sourceEvidenceIds.length > 0)).toBe(true);
    expect(packet.domains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "applications_systems",
          acceptedRecords: 626,
          readiness: "candidate_only",
        }),
        expect.objectContaining({
          domain: "data_assets_integrations",
          acceptedRecords: 570,
          readiness: "candidate_only",
        }),
      ]),
    );
    expect(packet.relationshipCandidates.length).toBeGreaterThan(0);
    expect(packet.guardrails.candidatePreviewExplicitlyRequested).toBe(true);
    expect(packet.guardrails.candidateDataConsumed).toBe(true);
    expect(packet.guardrails.defaultModuleReadsCandidateData).toBe(false);
    expect(packet.guardrails.moveEvidenceCreated).toBe(false);
    expect(packet.caveats.join(" ")).toContain("not active tenant truth");
  }, 30000);

  it("honors requested domains and leaves relationship candidates out unless requested", async () => {
    const packet = await getModuleContext(
      {
        tenantKey: "meridian-health",
        moduleKey: "intelligence",
        purpose: "answer_context",
        mode: "candidate_preview",
        requestedDomains: ["enterprise_profile", "vendors_contracts"],
        relationshipPolicy: "validated_only",
      },
      {
        repoRoot: process.cwd(),
        generatedAt: "2026-07-14T00:00:00.000Z",
      },
    );

    expect(packet.domains.map((domain) => domain.domain)).toEqual([
      "enterprise_profile",
      "vendors_contracts",
    ]);
    expect(new Set(packet.records.map((record) => record.domain))).toEqual(
      new Set(["enterprise_profile", "vendors_contracts"]),
    );
    expect(packet.relationshipCandidates).toHaveLength(0);
    expect(packet.guardrails.intelligenceRuntimeModified).toBe(false);
    expect(packet.guardrails.productionTenantDataWritten).toBe(false);
    expect(packet.guardrails.activeTenantAccessLayerUpdated).toBe(false);
  }, 30000);
});
