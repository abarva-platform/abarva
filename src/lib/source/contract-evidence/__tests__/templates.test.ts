import {
  getContractEvidenceTemplatePack,
  getRequiredContractEvidenceFamilies,
} from "../templates";

describe("Source contract evidence templates", () => {
  // Re-baselined 2026-09-24 (item T-756) against `e38e5b4f5` "Bind structured
  // evidence to Source artifact generation" (2026-09-08), which prepended the
  // `application_inventory` family to CONTRACT_EVIDENCE_TEMPLATES so the
  // in-scope application estate binds to the sourcing event. The family list
  // stays an ordered `toEqual` — the position of the new family is part of what
  // this pins, and loosening the assertion to a set or a subset is how the next
  // silent insertion would go unnoticed. The family is `required: false`, so the
  // two `getRequiredContractEvidenceFamilies` cases below are unaffected and
  // were not edited. The two assertions after the family list had never run
  // since 2026-09-08, because this ordered compare failed ahead of them; both
  // are unchanged and both pass.
  it("prescribes the AMS minimum viable evidence pack without asking for raw invoice dumps", () => {
    const pack = getContractEvidenceTemplatePack("ams_contract_optimization");

    expect(pack.label).toBe("AMS Contract Optimization Evidence Pack");
    expect(pack.operatingRule).toContain("summarized extracts");
    expect(pack.operatingRule).toContain("Full raw invoices");
    expect(pack.templates.map((template) => template.family)).toEqual([
      "application_inventory",
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
