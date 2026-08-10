import {
  buildContractOptimizationCandidateHref,
  isCapturedApprovalFact,
  isReviewableContractScope,
  SOURCE_INTAKE_CATEGORY_PICKER_DEFAULT_OPEN,
  SOURCE_INTAKE_CATEGORIES,
} from "../SourceOriginatePage";
import { SOURCE_CATEGORY_IDS } from "@/lib/source/taxonomy/category-taxonomy";

describe("SourceOriginatePage contract optimization intake", () => {
  it("uses the canonical Source taxonomy categories for the intake picker", () => {
    expect(SOURCE_INTAKE_CATEGORIES.map((category) => category.id)).toEqual([
      ...SOURCE_CATEGORY_IDS,
    ]);
  });

  it("keeps the category picker open by default so the canonical categories are selectable", () => {
    expect(SOURCE_INTAKE_CATEGORY_PICKER_DEFAULT_OPEN).toBe(true);
  });

  it("builds a contract-bound Optimize module link from a ranked candidate", () => {
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

    expect(href).toBe("/source/optimize?contractId=CTR-090");
    expect(href).toContain("contractId=CTR-090");
    expect(href).not.toContain("contractName=");
    expect(href).not.toContain("vendorName=");
    expect(href).not.toContain("annualValueUsd=");
    expect(href).not.toContain("actualAnnualSpendUsd=");
    expect(href).not.toContain("weakSignalCount=");
    expect(href).not.toContain("scopeSummary=");
    expect(href).not.toContain("decisionOwner=");
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

  it("does not treat synthetic fallback scope as reviewable approval scope", () => {
    const syntheticScope =
      "Fictional contract supporting airline technology services for Salesforce; annual value covers only the contract-backed portion of FY2027 vendor spend.";

    expect(isCapturedApprovalFact(syntheticScope)).toBe(true);
    expect(isReviewableContractScope(syntheticScope)).toBe(false);
    expect(
      isReviewableContractScope(
        "CRM platform subscriptions and data integration support.",
      ),
    ).toBe(true);

    const href = buildContractOptimizationCandidateHref({
      contractId: "CTR-090",
      contractName: "Salesforce Data Platform Agreement 3",
      vendorName: "Salesforce",
      annualValueUsd: 43_500_000,
      actualAnnualSpendUsd: 37_400_000,
      weakSignalCount: 2,
      scopeSummary: syntheticScope,
      decisionOwner: "VP Vendor Management",
      reason: "High spend with weak leverage signals.",
    });

    expect(href).not.toContain("scopeSummary=");
    expect(href).not.toContain("Fictional");
  });
});
