import type { NormalizedVendorResponsePackage } from "../vendor-response-matrix";
import {
  buildSourceResponseCoverageReadModel,
  type ResponseCoverageFact,
} from "../response-coverage-read-model";

function pkg(
  overrides: Partial<NormalizedVendorResponsePackage> & {
    vendorId: string;
    vendorName: string;
  },
): NormalizedVendorResponsePackage {
  const analytics: NormalizedVendorResponsePackage["analytics"] = {
    requirementCount: 0,
    requirementCoverageScore: 0,
    mandatoryCompletenessScore: 0,
    evidenceCoverageScore: 0,
    pricingTraceabilityScore: 0,
    slaTraceabilityScore: 0,
    exceptionDisclosureScore: 0,
    criterionLinkageScore: 0,
    readyForEvaluation: "no",
    nonConformances: [],
    clarificationQuestions: [],
  };
  const responsePackage = {
    artifactId: `${overrides.vendorId}-artifact`,
    originalName: `${overrides.vendorName} response.xlsx`,
    receivedAt: "2026-09-19T00:00:00.000Z",
    syntheticDemo: false,
    parserWarnings: [],
    rows: [],
    analytics,
    ...overrides,
  };
  responsePackage.vendorId = overrides.vendorId;
  responsePackage.vendorName = overrides.vendorName;
  return responsePackage;
}

function fact(
  vendorId: string,
  requirementId: string,
  status: ResponseCoverageFact["status"],
): ResponseCoverageFact {
  return {
    vendorId,
    requirementId,
    status,
    evidenceClass: "production",
    source: "artifact_response",
  };
}

describe("source response coverage read model", () => {
  it("separates production evidence from synthetic/test responses", () => {
    const model = buildSourceResponseCoverageReadModel({
      requiredFields: ["REQ-1"],
      packages: [
        pkg({
          vendorId: "prod-vendor",
          vendorName: "Production Vendor",
          rows: [
            {
              requirementId: "REQ-1",
              category: "service scope",
              section: "Scope",
              requirement: "Confirm scope",
              requirementLevel: "Mandatory",
              responseType: "Narrative",
              evidenceRequired: true,
              responseDisposition: "Comply",
              responseNarrative: "Confirmed.",
              evidenceRefs: ["exhibit-1"],
            },
          ],
        }),
        pkg({
          vendorId: "demo-vendor",
          vendorName: "Demo Vendor",
          syntheticDemo: true,
          rows: [
            {
              requirementId: "REQ-1",
              category: "service scope",
              section: "Scope",
              requirement: "Confirm scope",
              requirementLevel: "Mandatory",
              responseType: "Narrative",
              evidenceRequired: true,
              responseDisposition: "Comply",
              responseNarrative: "Demo answer.",
              evidenceRefs: ["demo-exhibit"],
            },
          ],
        }),
      ],
    });

    expect(model.production.vendorCount).toBe(1);
    expect(model.synthetic.vendorCount).toBe(1);
    expect(model.production.claims.completeness.permitted).toBe(true);
    expect(model.synthetic.claims.completeness.permitted).toBe(false);
    expect(model.synthetic.claims.completeness.reason).toContain("synthetic");
  });

  it("reports answered, missing, and not-comparable categories per vendor", () => {
    const model = buildSourceResponseCoverageReadModel({
      requiredFields: ["REQ-1", "REQ-2", "REQ-3"],
      criticalRequiredFields: ["REQ-2"],
      packages: [
        pkg({
          vendorId: "alpha",
          vendorName: "Alpha",
          rows: [
            {
              requirementId: "REQ-1",
              category: "service scope",
              section: "Scope",
              requirement: "Confirm scope",
              requirementLevel: "Mandatory",
              responseType: "Narrative",
              evidenceRequired: true,
              responseDisposition: "Comply",
              responseNarrative: "Yes.",
              evidenceRefs: ["alpha-1"],
            },
            {
              requirementId: "REQ-2",
              category: "commercial and pricing",
              section: "Pricing",
              requirement: "Return pricing",
              requirementLevel: "Mandatory",
              responseType: "Pricing",
              evidenceRequired: true,
              responseDisposition: "Not Applicable",
              responseNarrative: "Not applicable to this option.",
              evidenceRefs: ["alpha-2"],
            },
          ],
        }),
      ],
      facts: [fact("alpha", "REQ-3", "answered")],
    });

    const alpha = model.production.vendors[0];

    expect(alpha.answered).toEqual(["REQ-1", "REQ-3"]);
    expect(alpha.notComparable).toEqual(["REQ-2"]);
    expect(alpha.missing).toEqual([]);
    expect(alpha.status).toBe("not_comparable");
  });

  it("refuses completeness and ranking claims when critical fields are absent", () => {
    const model = buildSourceResponseCoverageReadModel({
      requiredFields: ["REQ-1", "REQ-2"],
      criticalRequiredFields: ["REQ-2"],
      packages: [
        pkg({
          vendorId: "alpha",
          vendorName: "Alpha",
          rows: [
            {
              requirementId: "REQ-1",
              category: "service scope",
              section: "Scope",
              requirement: "Confirm scope",
              requirementLevel: "Mandatory",
              responseType: "Narrative",
              evidenceRequired: true,
              responseDisposition: "Comply",
              responseNarrative: "Yes.",
              evidenceRefs: ["alpha-1"],
            },
          ],
        }),
      ],
    });

    expect(model.production.vendors[0].missing).toEqual(["REQ-2"]);
    expect(model.production.claims.completeness).toEqual({
      permitted: false,
      reason:
        "Cannot claim completeness: critical required fields are absent (REQ-2).",
    });
    expect(model.production.claims.ranking.permitted).toBe(false);
    expect(model.production.claims.ranking.reason).toContain("REQ-2");
  });

  it("refuses production claims when only non-production answers exist", () => {
    const model = buildSourceResponseCoverageReadModel({
      requiredFields: ["REQ-1"],
      criticalRequiredFields: ["REQ-1"],
      packages: [
        pkg({
          vendorId: "demo-vendor",
          vendorName: "Demo Vendor",
          syntheticDemo: true,
          rows: [
            {
              requirementId: "REQ-1",
              category: "service scope",
              section: "Scope",
              requirement: "Confirm scope",
              requirementLevel: "Mandatory",
              responseType: "Narrative",
              evidenceRequired: true,
              responseDisposition: "Comply",
              responseNarrative: "Demo answer.",
              evidenceRefs: ["demo-exhibit"],
            },
          ],
        }),
      ],
    });

    expect(model.production.vendorCount).toBe(0);
    expect(model.production.claims.completeness).toEqual({
      permitted: false,
      reason:
        "Cannot claim completeness: critical required fields are absent (REQ-1).",
    });
    expect(model.production.claims.ranking.permitted).toBe(false);
  });
});
