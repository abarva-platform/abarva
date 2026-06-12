import {
  CONSULTING_GRADE_DIMENSIONS,
  CONSULTING_GRADE_MIN_SCORE,
  buildConsultingGradeReviewPrompt,
  parseConsultingGradeReviewJson,
  summarizeConsultingGradeReview,
} from "../consulting-grade-rubric";

describe("consulting-grade deliverable rubric", () => {
  it("requires every dimension to score at least eight", () => {
    const review = parseConsultingGradeReviewJson({
      artifactCode: "d09_rfp_pack",
      artifactName: "RFP Package",
      raw: JSON.stringify({
        pass: true,
        overallScore: 9,
        dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
          id: dimension.id,
          score:
            dimension.id === "technical_operational_depth"
              ? CONSULTING_GRADE_MIN_SCORE - 1
              : 9,
          rationale: "Measured rationale",
          requiredFixes: ["Deepen current-state architecture."],
        })),
        unsupportedClaims: [],
        missingEvidence: [],
        rewriteGuidance: [],
      }),
    });

    expect(review.pass).toBe(false);
    expect(summarizeConsultingGradeReview(review)).toContain(
      "technical_operational_depth: 7/10",
    );
  });

  it("normalizes fenced evaluator JSON", () => {
    const review = parseConsultingGradeReviewJson({
      artifactCode: "d09_rfp_pack",
      artifactName: "RFP Package",
      raw: `\`\`\`json
{
  "pass": true,
  "overallScore": 10,
  "dimensionScores": ${JSON.stringify(
    CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      score: 8.4,
      rationale: "Passes",
      requiredFixes: []
    })),
  )},
  "unsupportedClaims": [],
  "missingEvidence": [],
  "rewriteGuidance": []
}
\`\`\``,
    });

    expect(review.pass).toBe(true);
    expect(review.dimensionScores).toHaveLength(
      CONSULTING_GRADE_DIMENSIONS.length,
    );
    expect(review.dimensionScores.every((score) => score.score === 8)).toBe(
      true,
    );
  });

  it("normalizes evaluator JSON when a model wraps the fenced block in prose", () => {
    const review = parseConsultingGradeReviewJson({
      artifactCode: "d09_rfp_pack",
      artifactName: "RFP Package",
      raw: `Here is the requested strict review:

\`\`\`json
{
  "pass": true,
  "overallScore": 9,
  "dimensionScores": ${JSON.stringify(
    CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      score: 9,
      rationale: "Passes with event-specific evidence.",
      requiredFixes: [],
    })),
  )},
  "unsupportedClaims": [],
  "missingEvidence": [],
  "rewriteGuidance": []
}
\`\`\`

Done.`,
    });

    expect(review.pass).toBe(true);
    expect(review.overallScore).toBe(9);
  });

  it("accepts common evaluator aliases for dimension ids and required fixes", () => {
    const review = parseConsultingGradeReviewJson({
      artifactCode: "d09_rfp_pack",
      artifactName: "RFP Package",
      raw: JSON.stringify({
        pass: true,
        overallScore: 9,
        dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension, index) => {
          if (index % 3 === 0) {
            return {
              dimensionId: dimension.id,
              score: 9,
              rationale: `Strong ${dimension.label}.`,
              fixes: [],
            };
          }
          if (index % 3 === 1) {
            return {
              dimension: dimension.label,
              score: 8,
              rationale: `Adequate ${dimension.label}.`,
              required_fixes: [],
            };
          }
          return {
            name: dimension.label,
            score: 9,
            rationale: `Strong ${dimension.label}.`,
            requiredFixes: [],
          };
        }),
        unsupportedClaims: [],
        missingEvidence: [],
        rewriteGuidance: [],
      }),
    });

    expect(review.pass).toBe(true);
    expect(review.dimensionScores.map((score) => score.id)).toEqual(
      CONSULTING_GRADE_DIMENSIONS.map((dimension) => dimension.id),
    );
    expect(review.dimensionScores.every((score) => score.score >= 8)).toBe(
      true,
    );
  });

  it("rejects missing dimension scores instead of silently manufacturing zeroes", () => {
    expect(() =>
      parseConsultingGradeReviewJson({
        artifactCode: "d09_rfp_pack",
        artifactName: "RFP Package",
        raw: JSON.stringify({
          pass: false,
          overallScore: 7,
          unsupportedClaims: [],
          missingEvidence: [],
          rewriteGuidance: [],
        }),
      }),
    ).toThrow("missing dimensionScores array");
  });

  it("rejects unrecognized dimension entries instead of silently manufacturing zeroes", () => {
    expect(() =>
      parseConsultingGradeReviewJson({
        artifactCode: "d09_rfp_pack",
        artifactName: "RFP Package",
        raw: JSON.stringify({
          pass: false,
          overallScore: 7,
          dimensionScores: [
            {
              dimension: "Decision strength",
              score: 7,
              rationale: "Too vague.",
              requiredFixes: ["Tighten the decision ask."],
            },
          ],
          unsupportedClaims: [],
          missingEvidence: [],
          rewriteGuidance: [],
        }),
      }),
    ).toThrow("missing rubric dimension score");
  });

  it("builds a review prompt that asks for JSON and strict scoring", () => {
    const prompt = buildConsultingGradeReviewPrompt({
      artifactCode: "d09_rfp_pack",
      artifactName: "RFP Package",
      bodyMarkdown: "# Draft",
      sourceContext: "Evidence: 300M baseline",
    });

    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("Minimum passing score: 8/10");
    expect(prompt).toContain("technical_operational_depth");
    expect(prompt).toContain("Evidence: 300M baseline");
  });
});
