import ExcelJS from "exceljs";

import { parseNormalizedVendorResponseWorkbook } from "../vendor-response-workbook";
import {
  deriveVendorResponseProfilesFromNormalized,
  deriveVendorResponseSeedInputsFromNormalized,
} from "../vendor-response-completeness-from-normalized";
import {
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
} from "../proposal-intelligence";

const HEADERS = [
  "Requirement ID",
  "Requirement category",
  "RFP section",
  "Requirement statement",
  "Requirement level",
  "Response type",
  "Evaluation criterion ID",
  "Evidence required",
  "Response disposition",
  "Response narrative",
  "Evidence reference(s)",
  "Pricing reference",
  "SLA / KPI reference",
  "Assumption / exception reference",
  "Vendor owner",
];

async function workbookBytes(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const cover = workbook.addWorksheet("Cover");
  cover.addRow(["Vendor name", "Example Services LLC"]);
  const mandatory = workbook.addWorksheet("Mandatory Items");
  mandatory.addRow(HEADERS);
  mandatory.addRow([
    "REQ-COM-001",
    "commercial and pricing",
    "Pricing",
    "Provide the recurring run price.",
    "Scored",
    "Pricing",
    "CRIT-COM-01",
    "Yes",
    "Comply",
    "Recurring run pricing is supplied in the normalized pricing schedule.",
    "Pricing Exhibit, row 12",
    "PRICE-RUN-001",
    "",
    "",
    "Commercial lead",
  ]);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function syntheticWorkbookBytes(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const cover = workbook.addWorksheet("Cover");
  cover.addRow(["Vendor name", "Example Services LLC"]);
  cover.addRow(["Status", "Completed synthetic demo response."]);
  const mandatory = workbook.addWorksheet("Mandatory Items");
  mandatory.addRow(HEADERS);
  mandatory.addRow([
    "REQ-COM-001",
    "commercial and pricing",
    "Pricing",
    "Provide the recurring run price.",
    "Scored",
    "Pricing",
    "CRIT-COM-01",
    "Yes",
    "Comply",
    "Recurring run pricing is supplied in the normalized pricing schedule.",
    "Pricing Exhibit, row 12",
    "PRICE-RUN-001",
    "",
    "",
    "Commercial lead",
  ]);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

describe("normalized vendor response workbook", () => {
  it("parses the issued workbook shape and computes traceability", async () => {
    const parsed = await parseNormalizedVendorResponseWorkbook({
      buffer: await workbookBytes(),
    });

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      vendorId: "example-services-llc",
      vendorName: "Example Services LLC",
      parserWarnings: [],
      analytics: {
        requirementCount: 1,
        requirementCoverageScore: 100,
        evidenceCoverageScore: 100,
        pricingTraceabilityScore: 100,
        criterionLinkageScore: 100,
        readyForEvaluation: "yes",
      },
      syntheticDemo: false,
    });
    expect(parsed?.rows[0]).toMatchObject({
      requirementId: "REQ-COM-001",
      responseDisposition: "Comply",
      pricingRef: "PRICE-RUN-001",
      vendorOwner: "Commercial lead",
    });
  });

  it("preserves an explicit synthetic-demo declaration from the workbook", async () => {
    const parsed = await parseNormalizedVendorResponseWorkbook({
      buffer: await syntheticWorkbookBytes(),
    });

    expect(parsed?.syntheticDemo).toBe(true);
  });

  it("derives package readiness without claiming vendor merit", async () => {
    const parsed = await parseNormalizedVendorResponseWorkbook({
      buffer: await workbookBytes(),
    });
    const seed = deriveVendorResponseSeedInputsFromNormalized([
      {
        ...parsed!,
        artifactId: "artifact-1",
        originalName: "example-response.xlsx",
        receivedAt: "2026-09-08T00:00:00.000Z",
      },
    ]);

    expect(seed[0]).toMatchObject({
      vendorName: "Example Services LLC",
      responseStatus: "submitted",
      pricingTemplateStatus: "complete",
      evidenceStatus: "Parsed",
      evidenceUsability: "usable",
      responseRiskLevel: "low",
    });
    expect(seed[0].submittedSections).toEqual(
      expect.arrayContaining(["Pricing template", "References and evidence"]),
    );
  });

  it("builds evidence-bound response intelligence without inventing bid values", async () => {
    const parsed = await parseNormalizedVendorResponseWorkbook({
      buffer: await workbookBytes(),
    });
    const profiles = deriveVendorResponseProfilesFromNormalized({
      packages: [
        {
          ...parsed!,
          artifactId: "artifact-1",
          originalName: "example-response.xlsx",
          receivedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      event: { id: "event-1", name: "Managed services sourcing" },
      tenantKey: "example-tenant",
    });

    expect(profiles).toMatchObject({
      sourceEventId: "event-1",
      tenantKey: "example-tenant",
      profileCount: 1,
      profiles: [
        {
          vendorName: "Example Services LLC",
          responseCompleteness: { percent: 100 },
          pricingSummary: {
            yearOneRunCostUsd: null,
            transitionCostUsd: null,
            optionalCostUsd: null,
          },
          readyForEvaluation: "yes",
        },
      ],
    });
    expect(profiles?.profiles[0].pricingSummary.pricingBasis).toMatch(
      /remain unclaimed until pricing facts are parsed and accepted/i,
    );
    expect(profiles?.profiles[0].evidenceProvided).toContain(
      "Pricing Exhibit, row 12",
    );
    expect(profiles?.profiles[0].extractionCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "pricing",
          evidenceReference: expect.stringContaining("PRICE-RUN-001"),
        }),
      ]),
    );
  });

  it("preserves mandatory exception lineage into evaluation holdbacks", async () => {
    const parsed = await parseNormalizedVendorResponseWorkbook({
      buffer: await workbookBytes(),
    });
    const responsePackage = {
      ...parsed!,
      artifactId: "artifact-exception",
      originalName: "example-response.xlsx",
      receivedAt: "2026-09-08T00:00:00.000Z",
      rows: [
        {
          ...parsed!.rows[0],
          requirementLevel: "Mandatory" as const,
          responseType: "Commercial exception" as const,
          responseDisposition: "Exception" as const,
          exceptionRef: "EXC-001",
        },
      ],
    };
    const profiles = deriveVendorResponseProfilesFromNormalized({
      packages: [responsePackage],
      event: { id: "event-1", name: "Managed services sourcing" },
      tenantKey: "example-tenant",
    });
    const intelligence = buildVendorChallengeIntelligence(profiles);
    const decisionView = buildVendorEvaluationDecisionView(
      profiles,
      intelligence,
      null,
    );

    expect(profiles?.profiles[0].extractionCards[0]).toMatchObject({
      type: "exception",
      requirementLevel: "Mandatory",
      sourceCategory: "commercial and pricing",
      evaluationCriterionId: "CRIT-COM-01",
    });
    expect(intelligence?.challengeLog[0]).toMatchObject({
      issueCategory: "pricing_gap",
      severity: "high",
    });
    expect(decisionView?.vendorSummaries[0].recommendation).toBe(
      "hold_until_clarified",
    );
    expect(decisionView?.recommendedAdvanceVendorIds).toEqual([]);
  });
});
