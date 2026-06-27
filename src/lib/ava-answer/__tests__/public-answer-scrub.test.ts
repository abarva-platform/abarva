import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";

describe("scrubPublicAvaAnswerText", () => {
  it("removes SkyHarbor packet chrome, generic routing closer, and evidence appendix text", () => {
    const cleaned = scrubPublicAvaAnswerText(`aVa · intelligence
answered
high confidence
The leading edge in airline IROPS right now is the shift from decision-support tools to agentic recovery.

Next, have the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves.

Tables
evidence
Source	Type	Confidence	How IT Supports The Answer
SkyHarbor Air live Intelligence surface	tenant material	high	Active Intelligence surface: intelligence.
This panel lists the material used for the answer. It does not invent missing values or relationships.
SkyHarbor Air live Intelligence surface
·
Tenant evidence`);

    expect(cleaned).toBe(
      "The leading edge in airline IROPS right now is the shift from decision-support tools to agentic recovery.",
    );
    expect(cleaned).not.toContain("aVa · intelligence");
    expect(cleaned).not.toContain("Source, Tower, or Moves");
    expect(cleaned).not.toContain("Tables");
    expect(cleaned).not.toContain("How IT Supports The Answer");
    expect(cleaned).not.toContain("Tenant evidence");
  });

  it("removes internal supporting-material ledger wording from advisor prose", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "Here's the logic: the supporting material ledger shows three distinct value pools — IROPS agentic recovery ($270M), customer AI/Digital Concierge ($180M), and data estate rationalization ($122M).",
    );

    expect(cleaned).toContain("business context shows three distinct value pools");
    expect(cleaned).not.toMatch(/supporting material|evidence ledger|source signals/i);
  });
});
