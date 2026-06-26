import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";

describe("shapeSharedAdvisorResponse", () => {
  it("replaces raw ids with display names and blocks stale agent brands", () => {
    const result = shapeSharedAdvisorResponse({
      text: [
        "Atlas should inspect LAK-AI-004 before funding LAK-AI-001.",
        "Sentinel also flagged 4d3bd1f0-8b8e-4ff8-9f4c-2bd328f5d7b3 as risky.",
        "Next: open the cited initiative and review the renewal path.",
      ].join("\n\n"),
      labels: [
        { id: "LAK-AI-004", label: "ERP modernization" },
        { id: "LAK-AI-001", label: "AI service desk rollout" },
      ],
      requireNextStep: true,
    });

    expect(result.text).toContain("aVa");
    expect(result.text).toContain("ERP modernization");
    expect(result.text).toContain("AI service desk rollout");
    expect(result.text).not.toMatch(/\b(?:Atlas|Sentinel|Nexus)\b/);
    expect(result.text).not.toMatch(/\bLAK-AI-\d{3}\b/);
    expect(result.text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i);
    expect(result.issues).toEqual([]);
  });

  it("compacts long evidence dumps while preserving a next step", () => {
    const longAnswer = [
      "Read: The budget pressure is concentrated in platform modernization, vendor renewals, and value proof.",
      "Evidence: The portfolio shows multiple programs with budget, renewal, owner, and status signals that need CIO attention.",
      "Implication: The next step is not to add another program; it is to challenge whether the existing spend has measured value.",
      "The first pressure is the vendor renewal clock because renewals can lock the company into spending before value proof exists.",
      "The second pressure is run/change imbalance because the budget mix is consuming flexibility.",
      "The third pressure is missing benefit realization because several programs carry budget without verified outcome measures.",
      "The fourth pressure is ownership clarity because programs need named accountable owners.",
      "The fifth pressure is sequencing because foundational data work must land before AI expansion.",
      "Next: ask aVa to compare vendor exposure, run/change budget, and measured-value gaps before the next governance meeting.",
    ].join("\n\n");

    const result = shapeSharedAdvisorResponse({
      text: longAnswer,
      targetChars: 650,
      hardMaxChars: 800,
      maxParagraphs: 5,
      requireNextStep: true,
    });

    expect(result.text.length).toBeLessThanOrEqual(800);
    expect(result.text).toMatch(/\bNext:/);
    expect(result.issues).toEqual([]);
  });
});
