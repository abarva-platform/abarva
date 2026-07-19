import { normalizeGeneratedFollowup } from "../followups";

describe("normalizeGeneratedFollowup", () => {
  it("removes policy footer prose from generated suggested questions", () => {
    expect(
      normalizeGeneratedFollowup(
        "Does Meridian have plans to validate identity linkage before committing the pilot?\n\nEvidence boundary: treat any tenant-specific numbers as not client-ready.\n\nDecision boundary: accountable owners remain the approval authority.",
      ),
    ).toBe(
      "Does Meridian have plans to validate identity linkage before committing the pilot?",
    );
  });

  it("keeps only the first generated question when prose follows it", () => {
    expect(
      normalizeGeneratedFollowup(
        "What source systems support the contact-center workflow? AbarVa can help inspect the loaded evidence next.",
      ),
    ).toBe("What source systems support the contact-center workflow?");
  });
});
