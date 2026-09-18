import { resolveContractQuestionId } from "../contract-question-identity";

describe("Source contract question identity", () => {
  it("resolves one explicit contract ID without relying on the selected page", () => {
    expect(resolveContractQuestionId("What is paid on MER-TECH-DBX-001?", null))
      .toBe("MER-TECH-DBX-001");
    expect(resolveContractQuestionId("Explain ctr-0002", null)).toBe("CTR-0002");
  });

  it("lets an explicitly asked contract supersede the selected contract", () => {
    expect(resolveContractQuestionId("Explain CTR-0002", "CTR-0006"))
      .toBe("CTR-0002");
  });

  it("keeps the selected contract for questions without an ID", () => {
    expect(resolveContractQuestionId("What evidence is missing?", "CTR-0006"))
      .toBe("CTR-0006");
  });

  it("does not select one side of a comparison", () => {
    expect(resolveContractQuestionId("Compare CTR-0002 with CTR-0006", "CTR-0006"))
      .toBeNull();
  });

  it("does not guess from a vendor name or a partial ID", () => {
    expect(resolveContractQuestionId("Show Databricks pricing", null)).toBeNull();
    expect(resolveContractQuestionId("What about MER-TECH?", null)).toBeNull();
  });
});
