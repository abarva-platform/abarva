import {
  validateArithmeticFormula,
  validateContractClaim,
} from "../provenance";

const sourceRef = {
  sourceSystem: "contract_document",
  sourceTable: "source.contract_clause",
  sourceRecordId: "CLAUSE-001",
  documentId: "DOC-001",
  page: "12",
};

describe("contract intelligence provenance", () => {
  it("requires a resolvable basis for each governed claim", () => {
    expect(
      validateContractClaim({
        claimId: "claim-1",
        opportunityId: "opp-1",
        contractId: "contract-1",
        role: "current_term",
        statement: "The agreement renews annually.",
        basis: "client_record",
        producedBy: "deterministic_loader",
      }).valid,
    ).toBe(false);

    expect(
      validateContractClaim({
        claimId: "claim-2",
        opportunityId: "opp-1",
        contractId: "contract-1",
        role: "current_term",
        statement: "The agreement renews annually.",
        basis: "client_record",
        sourceRefs: [sourceRef],
        producedBy: "deterministic_loader",
      }).valid,
    ).toBe(true);
  });

  it("requires generation metadata for Claude-authored content", () => {
    const result = validateContractClaim({
      claimId: "claim-3",
      opportunityId: "opp-1",
      contractId: "contract-1",
      role: "vendor_rationale",
      statement: "The vendor can preserve the relationship by carrying value forward.",
      basis: "judgment",
      producedBy: "claude",
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toContain("missing_generation_ref");
  });

  it("rejects partial ranges and unreviewed claims presented as approved", () => {
    const result = validateContractClaim({
      claimId: "claim-4",
      opportunityId: "opp-1",
      contractId: "contract-1",
      role: "sizing",
      statement: "Candidate value is between the two contract formulas.",
      basis: "calculated",
      calculationRunId: "run-1",
      amountLowUsd: 100,
      reviewStatus: "approved",
      producedBy: "deterministic_loader",
    });
    expect(result.issues.map((item) => item.code)).toEqual(
      expect.arrayContaining(["partial_range", "invalid_review"]),
    );
  });

  it("accepts declared arithmetic and rejects policy prose", () => {
    expect(
      validateArithmeticFormula(
        "monthly_spend * 12 - approved_credit",
        ["monthly_spend", "approved_credit"],
      ).valid,
    ).toBe(true);
    expect(
      validateArithmeticFormula("monthly spend x12", ["monthly_spend"]).valid,
    ).toBe(false);
    expect(
      validateArithmeticFormula("monthly_spend * unknown_rate", ["monthly_spend"]).issues.map(
        (item) => item.code,
      ),
    ).toContain("unknown_formula_input");
    expect(
      validateArithmeticFormula("monthly_spend 12", ["monthly_spend"]).issues.map(
        (item) => item.code,
      ),
    ).toContain("unsupported_formula");
  });
});
