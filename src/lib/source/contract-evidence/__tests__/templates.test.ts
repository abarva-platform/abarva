import {
  getContractEvidenceTemplatePack,
  getRequiredContractEvidenceFamilies,
} from "../templates";

describe("Source contract evidence templates", () => {
  it("prescribes the AMS minimum viable evidence pack without asking for raw invoice dumps", () => {
    const pack = getContractEvidenceTemplatePack("ams_contract_optimization");

    expect(pack.label).toBe("AMS Contract Optimization Evidence Pack");
    expect(pack.operatingRule).toContain("summarized extracts");
    expect(pack.operatingRule).toContain("Full raw invoices");
    expect(pack.templates.map((template) => template.family)).toEqual([
      "contract_baseline",
      "invoice_summary",
      "invoice_exception",
      "sla_performance",
      "ticket_volume",
      "staffing_model",
      "change_order",
      "renewal_terms",
      "evidence_reference",
    ]);
    expect(
      pack.templates.find((template) => template.family === "invoice_summary")?.notFor,
    ).toContain("raw invoice dump");
    expect(
      pack.templates.find((template) => template.family === "ticket_volume")?.sheetName,
    ).toBe("Usage / Demand Volumes");
  });

  it("marks only evidence references as optional for AMS contract optimization", () => {
    expect(getRequiredContractEvidenceFamilies("ams_contract_optimization")).toEqual([
      "contract_baseline",
      "invoice_summary",
      "invoice_exception",
      "sla_performance",
      "ticket_volume",
      "staffing_model",
      "change_order",
      "renewal_terms",
    ]);
  });

  it("drops staffing from SaaS renewal optimization but keeps usage demand evidence", () => {
    expect(getRequiredContractEvidenceFamilies("saas_renewal_optimization")).toEqual([
      "contract_baseline",
      "invoice_summary",
      "invoice_exception",
      "sla_performance",
      "ticket_volume",
      "change_order",
      "renewal_terms",
    ]);
  });
});
