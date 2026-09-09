import ExcelJS from "exceljs";

import { parseNormalizedVendorResponseWorkbook } from "../vendor-response-workbook";
import { deriveVendorResponseSeedInputsFromNormalized } from "../vendor-response-completeness-from-normalized";

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
    });
    expect(parsed?.rows[0]).toMatchObject({
      requirementId: "REQ-COM-001",
      responseDisposition: "Comply",
      pricingRef: "PRICE-RUN-001",
      vendorOwner: "Commercial lead",
    });
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
});
