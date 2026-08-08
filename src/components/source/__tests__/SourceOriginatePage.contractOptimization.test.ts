import {
  buildContractOptimizationCandidateHref,
  isCapturedApprovalFact,
} from "../SourceOriginatePage";

describe("SourceOriginatePage contract optimization intake", () => {
  it("builds a contract-bound optimization intake link from a ranked candidate", () => {
    const href = buildContractOptimizationCandidateHref({
      contractId: "CTR-090",
      contractName: "Salesforce Data Platform Agreement 3",
      vendorName: "Salesforce",
      annualValueUsd: 43_500_000,
      actualAnnualSpendUsd: 37_400_000,
      weakSignalCount: 2,
      scopeSummary: "CRM platform subscriptions and data integration support.",
      decisionOwner: "VP Vendor Management",
      reason: "High spend with weak leverage signals.",
    });

    expect(href).toContain("/source/new?intent=contract-optimization");
    expect(href).toContain("contractId=CTR-090");
    expect(href).toContain(
      "contractName=Salesforce+Data+Platform+Agreement+3",
    );
    expect(href).toContain("vendorName=Salesforce");
    expect(href).toContain("annualValueUsd=43500000");
    expect(href).toContain("actualAnnualSpendUsd=37400000");
    expect(href).toContain("weakSignalCount=2");
    expect(href).toContain(
      "scopeSummary=CRM+platform+subscriptions+and+data+integration+support.",
    );
    expect(href).toContain("decisionOwner=VP+Vendor+Management");
  });

  it("does not count placeholder review prompts as captured approval facts", () => {
    expect(isCapturedApprovalFact("VP Vendor Management")).toBe(true);
    expect(isCapturedApprovalFact("Value target pending")).toBe(false);
    expect(
      isCapturedApprovalFact(
        "Confirm the named accountable owner before any external action.",
      ),
    ).toBe(false);
    expect(isCapturedApprovalFact("Not assigned")).toBe(false);
  });
});
