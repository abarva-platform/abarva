import { retrieveCuratedDossierSources } from "./curated-dossier";

const mockLoadCuratedSemanticDossier = jest.fn();

jest.mock("@/lib/semantic-dossiers", () => ({
  loadCuratedSemanticDossier: (...args: unknown[]) =>
    mockLoadCuratedSemanticDossier(...args),
}));

describe("retrieveCuratedDossierSources", () => {
  beforeEach(() => {
    mockLoadCuratedSemanticDossier.mockReset();
  });

  it("returns no sources when no tenant key is resolvable", async () => {
    const result = await retrieveCuratedDossierSources("what's our vendor spend?", {});
    expect(result).toEqual({ sources: [], averageConfidence: 0 });
    expect(mockLoadCuratedSemanticDossier).not.toHaveBeenCalled();
  });

  it("converts a loaded curated dossier into a single AskSource carrying facts, measures, and gaps", async () => {
    mockLoadCuratedSemanticDossier.mockResolvedValue({
      canonicalTenantKey: "skyharbor-air",
      promptVersion: "semantic2-crown-jewel-v1",
      dossierVersion: "2026-08-01",
      builtAt: "2026-08-01T00:00:00.000Z",
      branchOptions: [],
      dossier: {
        route: { primaryDimension: "vendors_contracts", intent: "decide", targetSurface: "intelligence" },
        dimensionSummary: "Vendor and contract exposure for SkyHarbor Air.",
        facts: [
          { label: "Top vendor", value: "Salesforce", sourceKey: "s1", confidence: "high" },
          { label: "Weak-leverage contracts", value: 69, sourceKey: "s2", confidence: "medium" },
        ],
        metrics: [
          { metricKey: "m1", label: "Annual contract value", value: "1.48B", unit: "USD", sourceKeys: ["s1"] },
        ],
        gaps: [
          { gapKey: "g1", label: "Application scope", impact: "No scope rows loaded for this tenant.", neededEvidence: [] },
        ],
      },
    });

    const result = await retrieveCuratedDossierSources("what's our vendor spend?", {
      tenantAppClientKey: "skyharbor",
    });

    expect(mockLoadCuratedSemanticDossier).toHaveBeenCalledWith({
      tenantKey: "skyharbor",
      question: "what's our vendor spend?",
    });
    expect(result.sources).toHaveLength(1);
    const [source] = result.sources;
    expect(source.type).toBe("TENANT");
    expect(source.id).toBe("curated-dossier:skyharbor-air:vendors_contracts");
    expect(source.detail).toContain("Top vendor: Salesforce (high)");
    expect(source.detail).toContain("Annual contract value: 1.48B USD");
    expect(source.detail).toContain("Application scope: No scope rows loaded for this tenant.");
    expect(result.averageConfidence).toBeGreaterThan(0);
  });

  it("degrades to an empty result, not an error, when no eligible dossier exists", async () => {
    mockLoadCuratedSemanticDossier.mockRejectedValue(
      new Error("No active curated Semantic2 dossier found"),
    );

    const result = await retrieveCuratedDossierSources("what's our vendor spend?", {
      tenantAppClientKey: "skyharbor",
    });

    expect(result).toEqual({ sources: [], averageConfidence: 0 });
  });
});
