import {
  explainModuleContext,
  getModuleContext,
} from "../module-context-serving";
import type { ModuleContextReadRequest } from "../../contracts/module-context-apis";
import { containsLegacyVersionLabel } from "../../source-display-labels";

describe("module context serving contract", () => {
  const disallowedPrimaryLanguage = /\b(?:V4|V6|V7)\b/i;
  const activeTenantKeys = [
    "apex-retail",
    "first-capital-financial",
    "lakeshore-holdings",
    "lakeshore-industries",
    "meridian-health",
    "skyharbor-air",
  ];

  const appTenantAliases = [
    ["apexretail", "candidate:apex-retail:"],
    ["arcturus", "candidate:first-capital-financial:"],
    ["lakeshore", "candidate:lakeshore-holdings:"],
    ["meridian", "candidate:meridian-health:"],
    ["skyharbor", "candidate:skyharbor-air:"],
  ] as const;

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
    expect(packet.records.length).toBeGreaterThan(0);
    expect(
      packet.records.every((record) => record.agentReadiness === "agent_ready"),
    ).toBe(true);
    expect(
      packet.records.every((record) => record.sourceEvidenceIds.length > 0),
    ).toBe(true);
    expect(packet.relationshipCandidates).toHaveLength(0);
    expect(packet.guardrails.activeByDefault).toBe(true);
    expect(packet.guardrails.candidatePreviewRequiresExplicitMode).toBe(true);
    expect(packet.guardrails.candidatePreviewExplicitlyRequested).toBe(false);
    expect(packet.guardrails.defaultModuleReadsCandidateData).toBe(false);
    expect(packet.guardrails.candidateDataConsumed).toBe(false);
    expect(packet.guardrails.moveRuntimeModified).toBe(false);
    expect(packet.guardrails.moveEvidenceCreated).toBe(false);
    expect(packet.guardrails.moduleRuntimeConsumptionChanged).toBe(false);
    expect(packet.contextCompleteness).toEqual(
      expect.objectContaining({
        breadth: 100,
        relationshipCoverage: 0,
        evidenceCoverage: 100,
        overall: "Good",
      }),
    );
    expect(packet.contextCompleteness.depth).toBeGreaterThanOrEqual(90);
  });

  it.each(activeTenantKeys)(
    "serves active module context for active registry tenant %s",
    async (tenantKey) => {
      const packet = await getModuleContext(
        {
          tenantKey,
          moduleKey: "home",
          purpose: "context_summary",
          requestedDomains: [
            "enterprise_profile",
            "applications_systems",
            "data_assets_integrations",
          ],
        },
        {
          repoRoot: process.cwd(),
          generatedAt: "2026-07-14T00:00:00.000Z",
        },
      );

      expect(packet.mode).toBe("active");
      expect(packet.sourceMode).toBe("active_tenant_access");
      expect(packet.activeTenantAccessVersionId).toContain(
        `candidate:${tenantKey}:`,
      );
      expect(packet.candidateVersionId).toBeNull();
      expect(packet.records.length).toBeGreaterThan(0);
      expect(
        packet.records.every(
          (record) => record.agentReadiness === "agent_ready",
        ),
      ).toBe(true);
      expect(
        packet.records.every((record) => record.sourceEvidenceIds.length > 0),
      ).toBe(true);
      expect(packet.gaps).toHaveLength(0);
      expect(packet.guardrails.candidateDataConsumed).toBe(false);
      expect(packet.guardrails.defaultModuleReadsCandidateData).toBe(false);
      expect(packet.guardrails.moduleRuntimeConsumptionChanged).toBe(false);
    },
    30000,
  );

  it.each(activeTenantKeys)(
    "normalizes legacy version language out of active Home records for %s",
    async (tenantKey) => {
      const packet = await getModuleContext(
        {
          tenantKey,
          moduleKey: "home",
          purpose: "context_summary",
          requestedDomains: [
            "enterprise_profile",
            "functions",
            "applications_systems",
            "vendors_contracts",
            "data_assets_integrations",
            "programs_priorities",
            "risks_controls",
            "metrics_outcomes",
          ],
        },
        {
          repoRoot: process.cwd(),
          generatedAt: "2026-07-14T00:00:00.000Z",
        },
      );

      const visibleRecordText = packet.records
        .map((record) =>
          [record.title, record.summary, JSON.stringify(record.fields)].join(
            "\n",
          ),
        )
        .join("\n");

      expect(visibleRecordText).not.toMatch(disallowedPrimaryLanguage);
      expect(JSON.stringify(packet.lineage)).toMatch(
        /candidate|active|source/i,
      );
      expect(packet.evidenceRefs.length).toBeGreaterThan(0);
    },
    30000,
  );

  it.each(appTenantAliases)(
    "resolves app tenant alias %s to active canonical context",
    async (tenantKey, candidatePrefix) => {
      const packet = await getModuleContext(
        {
          tenantKey,
          moduleKey: "home",
          purpose: "context_summary",
          requestedDomains: ["enterprise_profile", "applications_systems"],
        },
        {
          repoRoot: process.cwd(),
          generatedAt: "2026-07-14T00:00:00.000Z",
        },
      );

      expect(packet.sourceMode).toBe("active_tenant_access");
      expect(packet.activeTenantAccessVersionId).toContain(candidatePrefix);
      expect(packet.records.length).toBeGreaterThan(0);
      expect(packet.guardrails.candidateDataConsumed).toBe(false);
      expect(packet.guardrails.homeReadsCandidateByDefault).toBe(false);
    },
    30000,
  );

  it("serves Meridian active module context without consuming candidate data by default", async () => {
    const packet = await getModuleContext(
      {
        tenantKey: "meridian-health",
        moduleKey: "home",
        purpose: "context_summary",
        requestedDomains: [
          "enterprise_profile",
          "applications_systems",
          "data_assets_integrations",
        ],
      },
      {
        repoRoot: process.cwd(),
        generatedAt: "2026-07-14T00:00:00.000Z",
      },
    );

    expect(packet.mode).toBe("active");
    expect(packet.sourceMode).toBe("active_tenant_access");
    expect(packet.activeTenantAccessVersionId).toContain(
      "candidate:meridian-health:",
    );
    expect(packet.candidateVersionId).toBeNull();
    expect(packet.records.length).toBeGreaterThan(0);
    expect(
      packet.records.every((record) => record.agentReadiness === "agent_ready"),
    ).toBe(true);
    expect(
      packet.records.every((record) => record.sourceEvidenceIds.length > 0),
    ).toBe(true);
    expect(packet.gaps).toHaveLength(0);
    expect(packet.guardrails.candidateDataConsumed).toBe(false);
    expect(packet.guardrails.homeReadsCandidateByDefault).toBe(false);
    expect(packet.guardrails.moduleRuntimeConsumptionChanged).toBe(false);
    expect(["Good", "Strong", "Limited"]).toContain(
      packet.contextCompleteness.overall,
    );
  });

  it("uses business-facing source labels while preserving technical lineage", async () => {
    const packet = await getModuleContext(
      {
        tenantKey: "meridian-health",
        moduleKey: "moves",
        purpose: "evidence_extract",
        requestedDomains: ["applications_systems", "data_assets_integrations"],
      },
      {
        repoRoot: process.cwd(),
        generatedAt: "2026-07-14T00:00:00.000Z",
      },
    );

    expect(packet.evidenceRefs.length).toBeGreaterThan(0);
    expect(packet.evidenceRefs.every((ref) => ref.sourceLabel)).toBe(true);
    expect(packet.evidenceRefs.map((ref) => ref.sourceLabel)).toEqual(
      expect.arrayContaining([
        "Applications & Systems",
        "Data Assets & Integrations",
      ]),
    );
    expect(
      packet.evidenceRefs.some((ref) =>
        String(ref.technicalSourceFile ?? ref.evidenceId).includes(
          "04_applications_systems.csv",
        ),
      ),
    ).toBe(true);
    expect(
      packet.evidenceRefs.some((ref) =>
        String(ref.technicalSourceFile ?? ref.evidenceId).includes(
          "05_data_assets_integrations.csv",
        ),
      ),
    ).toBe(true);
    expect(
      packet.evidenceRefs.some((ref) => containsLegacyVersionLabel(ref.sourceLabel)),
    ).toBe(false);
  });

  it("normalizes legacy raw filenames into business-facing labels for diagnostics-safe references", async () => {
    const packet = await getModuleContext(
      {
        tenantKey: "meridian-health",
        moduleKey: "moves",
        purpose: "evidence_extract",
        mode: "candidate_preview",
        requestedDomains: ["evidence_sources"],
      },
      {
        repoRoot: process.cwd(),
        generatedAt: "2026-07-14T00:00:00.000Z",
      },
    );
    const ref = packet.evidenceRefs.find((item) =>
      item.evidenceId.includes("13_evidence_sources.csv"),
    );

    expect(ref).toEqual(
      expect.objectContaining({
        sourceLabel: "Evidence Sources",
        technicalSourceFile: "13_evidence_sources.csv",
      }),
    );
    expect(containsLegacyVersionLabel(ref?.sourceLabel ?? "")).toBe(false);
  }, 30000);

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
    expect(
      packet.records.every(
        (record) => record.agentReadiness === "candidate_only",
      ),
    ).toBe(true);
    expect(
      packet.records.every((record) => record.sourceEvidenceIds.length > 0),
    ).toBe(true);
    expect(packet.domains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "applications_systems",
          acceptedRecords: 613,
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
    expect(packet.contextCompleteness.breadth).toBe(100);
    expect(packet.contextCompleteness.evidenceCoverage).toBe(100);
    expect(packet.contextCompleteness.relationshipCoverage).toBeGreaterThan(0);
    expect(["Good", "Strong", "Limited"]).toContain(
      packet.contextCompleteness.overall,
    );
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

  it("explains module context deterministically without adding module behavior", async () => {
    const request: ModuleContextReadRequest = {
      tenantKey: "skyharbor-air",
      moduleKey: "moves",
      purpose: "evidence_extract",
      mode: "candidate_preview",
      requestedDomains: ["applications_systems", "data_assets_integrations"],
      relationshipPolicy: "candidates",
    };
    const options = {
      repoRoot: process.cwd(),
      generatedAt: "2026-07-14T00:00:00.000Z",
    };

    const first = await explainModuleContext(request, options);
    const second = await explainModuleContext(request, options);

    expect(first).toEqual(second);
    expect(first.summary).toContain("Moves context has");
    expect(first.summary).toContain("not active tenant truth");
    expect(first.contextCompleteness.evidenceCoverage).toBe(100);
    expect(first.strengths).toEqual(
      expect.arrayContaining([expect.stringContaining("evidence references")]),
    );
    expect(first.unsupportedQuestions).toEqual(
      expect.arrayContaining([
        "Do not claim Move evidence was attached by the data layer.",
        "Do not claim module runtime behavior changed because this packet was generated.",
      ]),
    );
    expect(first.nextActions).toEqual(
      expect.arrayContaining([
        "Let the Moves module decide how to render or use this packet.",
      ]),
    );
    expect(first.guardrails.moveEvidenceCreated).toBe(false);
    expect(first.guardrails.moduleRuntimeConsumptionChanged).toBe(false);
  }, 30000);
});
