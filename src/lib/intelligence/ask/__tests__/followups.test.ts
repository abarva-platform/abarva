import { normalizeGeneratedFollowup } from "../followups";
import { sanitizeSuggestedQuestions } from "@/lib/agent/product-truth";

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

  it("cleans policy footer prose added by the product-truth guard", () => {
    const guarded = sanitizeSuggestedQuestions(
      [
        "The outsourced analytics vendor is at 80% maintenance load - does Meridian have plans to redistribute that work?",
      ],
      { surface: "intelligence", tenantName: "Healthcare Demo" },
    );

    expect(guarded.questions.map(normalizeGeneratedFollowup)[0]).toBe(
      "The outsourced analytics vendor is at 80% maintenance load - does Meridian have plans to redistribute that work?",
    );
  });
});
