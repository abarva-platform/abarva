import {
  assertsBlanketContractEvidenceAbsence,
  buildStaleHomeClaimContext,
  isStaleHomeClaim,
  sanitizeHomeNarrativeText,
} from "../stale-claim-guard";
import type { HomeReviewBundle } from "../types";

function contextWithPricing(hasPricing = true) {
  const bundle: Pick<HomeReviewBundle, "chapters" | "technologyEstate"> = {
    chapters: [],
    technologyEstate: {
      recordTypes: [
        {
          objectType: "vendor_contract",
          label: "Vendor Contracts",
          columns: ["vendorName", "annualSpendUsd", "pricingHistory"],
          rows: [
            {
              vendorName: "Alpha Systems",
              annualSpendUsd: 40,
              pricingHistory: hasPricing ? "Reviewed price history." : "",
            },
            { vendorName: "Beta Services", annualSpendUsd: 30 },
            { vendorName: "Gamma Technology", annualSpendUsd: 20 },
            { vendorName: "Delta Solutions", annualSpendUsd: 10 },
          ],
          primaryDimension: null,
          dimensionCounts: [],
        },
        {
          objectType: "data_asset_or_integration",
          label: "Data Assets",
          columns: [],
          rows: [{}, {}, {}],
          primaryDimension: null,
          dimensionCounts: [],
        },
      ],
    },
  };
  return buildStaleHomeClaimContext(bundle);
}

describe("assertsBlanketContractEvidenceAbsence", () => {
  it.each([
    "No vendor contract evidence is available.",
    "No contract-level evidence is present.",
    "Contract evidence is absent.",
    "All vendor contract evidence remains unavailable.",
    "100% of vendor contract evidence is unavailable.",
    "Vendor contract evidence is absent for all 4 declared vendor contracts.",
    "No contract evidence is available for any vendor contract.",
    "None of the vendor contracts have any contract evidence.",
    "No contract evidence is available, so approval requires more evidence.",
    "Contract evidence is absent for all declared vendor contracts in this Home record.",
    "Contract evidence is absent in the Home record.",
    "Contract evidence is unavailable in current Home record.",
    "No contract evidence is available in the current Home record.",
    "Contract evidence is absent in supplied record.",
    "No contract evidence is available in supplied evidence.",
    "No contract evidence is available in the supplied record.",
    "**Evidence gap:** No contract evidence is available.",
    "**Evidence gap:** Contract evidence is absent for all vendor contracts in this Home record.",
  ])("recognizes an explicit blanket assertion: %s", (statement) => {
    expect(assertsBlanketContractEvidenceAbsence(statement)).toBe(true);
    expect(isStaleHomeClaim(statement, contextWithPricing())).toBe(true);
    expect(isStaleHomeClaim(statement, contextWithPricing(false))).toBe(false);
  });

  it.each([
    "No causal inference is established from the contract pricing.",
    "Finance approval is absent, while contract terms are reviewed.",
    "SLA history is unavailable for all vendor contracts.",
    "No document-level evidence is available for the contracts.",
    "No executed contract documents are available.",
    "No contract approval has been recorded.",
    "Contract evidence is absent for one supplier.",
    "No contract evidence is available for a subset of contracts.",
    "Some contract evidence is unavailable.",
    "4 of 12 contracts are unavailable for review.",
    "No contract evidence supports the proposed causal inference.",
    "Contract evidence is absent for selected vendor contracts in this Home record.",
    "No contract evidence is available for a subset of contracts in supplied evidence.",
    "SLA history is unavailable for all vendor contracts in this Home record.",
    "Document-level evidence is absent in supplied evidence.",
    "**Evidence gap:** No document-level evidence is available for the contracts.",
    "**Evidence gap:** Contract evidence is absent for one supplier in this Home record.",
    "**Approval:** Finance approval is absent, while contract pricing is reviewed.",
  ])("preserves a scoped gap or unrelated negation: %s", (statement) => {
    const context = contextWithPricing();
    expect(context.vendorEvidence?.hasContractEvidence).toBe(true);
    expect(assertsBlanketContractEvidenceAbsence(statement)).toBe(false);
    expect(isStaleHomeClaim(statement, context)).toBe(false);
    expect(sanitizeHomeNarrativeText(statement, context)).toBe(statement);
  });
});

describe("isStaleHomeClaim", () => {
  const pair =
    "Alpha Systems and Beta Services together represent over a quarter of vendor spend.";

  it("preserves a valid supplier pair and its negative caveat", () => {
    const context = contextWithPricing();
    const caveat = "No causal inference is established from the contract pricing.";
    const text = `${pair} ${caveat}`;
    expect(isStaleHomeClaim(pair, context)).toBe(false);
    expect(sanitizeHomeNarrativeText(text, context)).toBe(text);
    const qualifiedPair =
      "Alpha Systems and Beta Services together represent over a quarter of contract spend, with no causal inference established.";
    expect(isStaleHomeClaim(qualifiedPair, context)).toBe(false);
  });

  it("rejects blanket record absence with loaded contracts but no evidence fields", () => {
    const context = contextWithPricing(false);
    expect(context.vendorEvidence?.hasContractEvidence).toBe(false);
    expect(
      isStaleHomeClaim("No vendor contracts are available for review.", context),
    ).toBe(true);
    for (const count of [0, undefined]) {
      const recordCountsByObjectType = new Map(context.recordCountsByObjectType);
      if (count === undefined) recordCountsByObjectType.delete("vendor_contract");
      else recordCountsByObjectType.set("vendor_contract", count);
      expect(
        isStaleHomeClaim("No vendor contracts are available for review.", {
          ...context,
          recordCountsByObjectType,
        }),
      ).toBe(false);
    }
  });

  it.each([
    ["There are 4 vendor contracts.", false],
    ["There are 9 vendor contracts.", true],
    ["There are 4 declared contracts.", false],
    ["There are 9 declared contracts.", true],
    ["There are 3 tracked data assets.", false],
    ["There are 9 tracked data assets.", true],
    ["2 of 3 tracked data assets are ready.", false],
    ["2 of 9 tracked data assets are ready.", true],
  ])("retains the count comparison for %s", (statement, stale) => {
    expect(isStaleHomeClaim(statement, contextWithPricing())).toBe(stale);
  });

  it("retains the supplier identity and concentration threshold checks", () => {
    const context = contextWithPricing();
    expect(
      isStaleHomeClaim(
        "Alpha Systems and Gamma Technology together represent over a quarter of vendor spend.",
        context,
      ),
    ).toBe(true);
    const vendorEvidence = context.vendorEvidence!;
    expect(
      isStaleHomeClaim(pair, {
        ...context,
        vendorEvidence: {
          ...vendorEvidence,
          topSuppliers: vendorEvidence.topSuppliers.map((supplier, index) => ({
            ...supplier,
            sharePct: index < 2 ? 10 : supplier.sharePct,
          })),
        },
      }),
    ).toBe(true);
  });
});
