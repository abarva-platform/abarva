import { checkTenantEvidenceClaims } from "../tenant-evidence-claim-guard";

describe("checkTenantEvidenceClaims", () => {
  it("passes when every numeric claim appears in the grounding text", () => {
    const grounding = "Value at stake: $2.0M. Confidence: 85%.";
    const answer = "This Move has $2.0M at stake with 85% confidence.";
    expect(checkTenantEvidenceClaims(answer, grounding)).toEqual([]);
  });

  it("flags a dollar figure not present in the grounding text", () => {
    const grounding = "Value at stake: $2.0M.";
    const answer = "This Move could realize $45M in savings.";
    const violations = checkTenantEvidenceClaims(answer, grounding);
    expect(violations.length).toBe(1);
    expect(violations[0].category).toBe("unsupported_tenant_claim");
    expect(violations[0].matchedText).toMatch(/\$45M/i);
  });

  it("flags a percentage not present in the grounding text", () => {
    const violations = checkTenantEvidenceClaims("Confidence is 92%.", "No confidence figure here.");
    expect(violations.some((v) => v.matchedText.includes("92%"))).toBe(true);
  });

  it("flags every numeric claim when grounding text is empty", () => {
    const violations = checkTenantEvidenceClaims("Savings of $10M at 20% margin.", "");
    expect(violations.length).toBe(2);
  });

  it("returns no violations when the answer has no numeric claims", () => {
    expect(checkTenantEvidenceClaims("This Move is on track.", "")).toEqual([]);
  });
});
