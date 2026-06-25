import { hasUsableDossierEvidence } from "../has-usable-dossier-evidence";

describe("hasUsableDossierEvidence", () => {
  it("passes a vendor dossier with zero facts but populated table, citations, and source coverage", () => {
    const result = hasUsableDossierEvidence({
      facts: [],
      tables: [
        {
          id: "vendors",
          title: "Vendor contracts",
          dimensionId: "vendor_contracts",
          columns: [{ key: "vendor", label: "Vendor" }],
          rows: [{ vendor: "Contoso" }],
          citationIds: ["c1"],
        },
      ],
      citations: [{ label: "F11", sourceKey: "F11_vendors_contracts_licenses", count: 90 }],
      sourceCoverage: [
        {
          sourceKey: "F11_vendors_contracts_licenses",
          loaded: true,
          count: 90,
          purpose: "vendor contracts",
          required: true,
        },
      ],
    });

    expect(result.usable).toBe(true);
    expect(result.evidenceChannels.facts).toBe(0);
    expect(result.evidenceChannels.tables).toBe(1);
    expect(result.evidenceChannels.citations).toBe(1);
    expect(result.evidenceChannels.sourceCoverage).toBe(1);
  });

  it("passes an application dossier with chart, graph, and citations but zero facts", () => {
    const result = hasUsableDossierEvidence({
      facts: [],
      charts: [
        {
          id: "apps-by-domain",
          title: "Apps by domain",
          kind: "bar",
          type: "bar",
          dimensionId: "application_systems",
          data: [{ label: "Finance", value: 12 }],
          sourceIds: ["F05"],
          citationIds: ["c1"],
          caveats: [],
          status: "tenant-fact",
        },
      ],
      graphs: [
        {
          id: "app-ownership",
          title: "App ownership",
          nodes: [
            { id: "app", label: "ERP", type: "application" },
            { id: "team", label: "Finance IT", type: "team" },
          ],
          edges: [{ from: "app", to: "team", label: "owned by", type: "owns" }],
          nodeTypes: ["application", "team"],
          edgeTypes: ["owns"],
          sourceIds: ["F19"],
          citationIds: ["c1"],
          confidence: "high",
          gaps: [],
          inferredEdges: false,
        },
      ],
      citations: [{ label: "F05", sourceKey: "F05_applications_systems", count: 120 }],
    });

    expect(result.usable).toBe(true);
    expect(result.evidenceChannels.facts).toBe(0);
    expect(result.evidenceChannels.charts).toBe(1);
    expect(result.evidenceChannels.graphs).toBe(1);
    expect(result.evidenceChannels.citations).toBe(1);
  });

  it("fails a truly empty dossier", () => {
    const result = hasUsableDossierEvidence({});

    expect(result.usable).toBe(false);
    expect(Object.values(result.evidenceChannels).every((count) => count === 0)).toBe(true);
    expect(result.reason).toMatch(/empty dossier/i);
  });

  it("counts sourced gaps as usable evidence but not fabricated exact answers", () => {
    const result = hasUsableDossierEvidence({
      gaps: [
        {
          gapKey: "gap-owner",
          label: "Contract owner is missing",
          impact: "Contract accountability cannot be assigned by named owner.",
          neededEvidence: ["contract owner field from F11"],
        },
      ],
      citations: [{ label: "F11", sourceKey: "F11_vendors_contracts_licenses", count: 90 }],
    });

    expect(result.usable).toBe(true);
    expect(result.evidenceChannels.gaps).toBe(1);
    expect(result.evidenceChannels.citations).toBe(1);
  });
});
