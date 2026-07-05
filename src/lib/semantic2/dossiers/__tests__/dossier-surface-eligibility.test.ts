import {
  businessLanguageClean,
  classifyTenantScope,
  detectDossierContentIssues,
  evaluateDossierSurfaceEligibility,
} from "../index";

const readyOrgDossier = {
  tenantKey: "lakeshore-holdings",
  dimensionKey: "organization_leadership",
  coverage: { score: 0.76, confidence: 0.82 },
  facts: Array.from({ length: 30 }, (_, index) => ({
    fact_id: `F${index + 1}`,
    entity: index % 2 === 0 ? "Office of CIO" : "Shared IT Services",
    entityType: index % 2 === 0 ? "Role" : "Org team",
    label: index % 3 === 0 ? "Technology leader" : "Business function",
    value:
      index % 3 === 0
        ? "CIO accountability for enterprise technology"
        : "Shared services operations",
    confidence: 0.83,
  })),
  entities: [
    { name: "Office of CIO", type: "Role", confidence: 0.9 },
    { name: "Shared IT Services", type: "Org team", confidence: 0.8 },
    { name: "Finance Operations", type: "Business function", confidence: 0.8 },
    { name: "Kyriba", type: "Application or system", confidence: 0.8 },
    { name: "Enterprise Platforms", type: "Org team", confidence: 0.8 },
  ],
  relationships: [
    {
      from: "Office of CIO",
      relationship: "leader owns function",
      to: "Finance Operations",
      confidence: 0.83,
    },
    {
      from: "Shared IT Services",
      relationship: "team owns system",
      to: "Kyriba",
      confidence: 0.82,
    },
    {
      from: "Finance Operations",
      relationship: "is supported by",
      to: "Kyriba",
      confidence: 0.81,
    },
  ],
  citations: [
    {
      label: "Leadership roster extract",
      source_area: "Business organization evidence",
      confidence: 0.85,
    },
    {
      label: "IT ownership worksheet",
      source_area: "IT organization evidence",
      confidence: 0.85,
    },
    {
      label: "Application ownership matrix",
      source_area: "Application systems evidence",
      confidence: 0.85,
    },
  ],
  gaps: [],
  derived_insights: [
    {
      insight: "Technology accountability is visible by role and domain.",
      why_it_matters:
        "This can support a role-level operating model without inventing a person-level HR tree.",
      supporting_fact_ids: ["F1"],
      confidence: "high",
    },
  ],
};

const oldBrokenDossier = {
  tenantKey: "lakeshore-holdings",
  dimensionKey: "organization_leadership",
  coverage: { score: 0.38, confidence: 0.4 },
  facts: Array.from({ length: 120 }, (_, index) => ({
    fact_id: `F${String(index + 1).padStart(3, "0")}`,
    entity: "enterprise source material:source reference",
    entityType: "Evidence item",
    dimension: "Organization and Leadership",
    label:
      index < 40
        ? ""
        : "Admin upload lakeshore holdings d19 personas workforce csv persona name",
    value:
      index < 40
        ? index % 2 === 0
          ? "required"
          : "defined"
        : '{"raw":"Treasury analyst","value":"Treasury analyst","column":"persona_name"}',
    confidence: 0.78,
    citation_ids: [`C${index + 1}`],
  })),
  entities: [],
  relationships: [],
  citations: [
    {
      label: "Enterprise context source support",
      source_area: "Enterprise context",
      confidence: 0.78,
    },
  ],
  derived_insights: [],
};

describe("semantic2 dossier tenant scope policy", () => {
  it("allows canonical runtime tenants and maps known aliases", () => {
    expect(classifyTenantScope("skyharbor-air")).toMatchObject({
      scopeType: "runtime_client",
      surfaceEligible: true,
    });
    expect(classifyTenantScope("apexretail")).toMatchObject({
      canonicalTenantKey: "apex-retail",
      surfaceEligible: true,
    });
    expect(classifyTenantScope("morgan-street")).toMatchObject({
      canonicalTenantKey: "lakeshore-holdings",
      scopeType: "runtime_client",
      surfaceEligible: true,
    });
  });

  it("blocks global, unknown, archived, uuid, and lab-only tenant scopes", () => {
    expect(classifyTenantScope("global")).toMatchObject({
      scopeType: "global_corpus",
      surfaceEligible: false,
    });
    expect(classifyTenantScope("unknown")).toMatchObject({
      scopeType: "unknown",
      surfaceEligible: false,
    });
    expect(classifyTenantScope("archived:first-capital")).toMatchObject({
      scopeType: "archived_client",
      surfaceEligible: false,
    });
    expect(
      classifyTenantScope("0834e0e7-5b56-46fe-9912-5aa9bc0d66c9"),
    ).toMatchObject({ scopeType: "system_bucket", surfaceEligible: false });
    expect(classifyTenantScope("roosevelt-holdings")).toMatchObject({
      scopeType: "lab_only",
      surfaceEligible: false,
    });
  });
});

describe("semantic2 dossier content detector", () => {
  it("fails the old source-reference skeleton instead of rubber-stamping it", () => {
    expect(businessLanguageClean(oldBrokenDossier)).toBe(false);
    const issues = detectDossierContentIssues(oldBrokenDossier);
    expect(issues.map((issue) => issue.term)).toEqual(
      expect.arrayContaining([
        "source reference",
        "enterprise source material",
        "evidence item",
        "json-shaped value",
      ]),
    );
  });

  it("passes clean business-language dossier values", () => {
    expect(
      detectDossierContentIssues(readyOrgDossier).filter(
        (issue) => issue.severity === "blocker",
      ),
    ).toHaveLength(0);
  });
});

describe("semantic2 dossier surface eligibility", () => {
  it("marks a clean relationship-aware organization dossier ready", () => {
    expect(
      evaluateDossierSurfaceEligibility({ dossier: readyOrgDossier }),
    ).toMatchObject({
      surfaceEligible: true,
      eligibilityLevel: "ready",
    });
  });

  it("blocks organization leadership when relationships are missing", () => {
    const result = evaluateDossierSurfaceEligibility({
      dossier: { ...readyOrgDossier, relationships: [] },
    });
    expect(result.surfaceEligible).toBe(false);
    expect(result.reasons.join(" ")).toContain("Relationships 0 is below 3");
  });

  it("blocks JSON-shaped values and generic source-reference labels", () => {
    const result = evaluateDossierSurfaceEligibility({
      dossier: oldBrokenDossier,
    });
    expect(result.surfaceEligible).toBe(false);
    expect(result.eligibilityLevel).toBe("blocked");
    expect(result.metrics.blockerLeaks).toBeGreaterThan(0);
  });

  it("fails generic citation stubs even when counts look high", () => {
    const result = evaluateDossierSurfaceEligibility({
      dossier: {
        ...readyOrgDossier,
        citations: Array.from({ length: 5 }, () => ({
          label: "Generic source support",
          source_area: "",
          confidence: 0.8,
        })),
      },
    });
    expect(result.surfaceEligible).toBe(false);
    expect(result.reasons.join(" ")).toContain("Usable citations 0 is below 3");
  });

  it("keeps archived or global dossiers out of runtime surfaces even if quality is otherwise good", () => {
    expect(
      evaluateDossierSurfaceEligibility({
        dossier: { ...readyOrgDossier, tenantKey: "archived:first-capital" },
      }),
    ).toMatchObject({ surfaceEligible: false, eligibilityLevel: "blocked" });
    expect(
      evaluateDossierSurfaceEligibility({
        dossier: { ...readyOrgDossier, tenantKey: "global" },
      }),
    ).toMatchObject({ surfaceEligible: false, eligibilityLevel: "blocked" });
  });
});
