import { runAgentAnswerEvalHarness } from "@/lib/intelligence/answer/evals/harness";
import { GOLDEN_QUESTIONS } from "@/lib/intelligence/answer/evals/golden-questions";

describe("runAgentAnswerEvalHarness", () => {
  it("captures AgentAnswer results for the full golden set", async () => {
    const report = await runAgentAnswerEvalHarness({
      generatedAt: "2026-06-21T00:00:00.000Z",
      runId: "test-run",
    });

    expect(report.schemaVersion).toBe("scb-agent-answer-eval/v1");
    expect(report.mode).toBe("deterministic");
    expect(report.total).toBe(GOLDEN_QUESTIONS.length);
    expect(report.passCount).toBe(report.total);
    expect(report.goldenPassCount).toBe(report.total);
    expect(report.answerQualityPassCount).toBe(report.total);
    expect(report.results).toHaveLength(GOLDEN_QUESTIONS.length);
    expect(report.results[0]?.answer.surface).toBe("intelligence");
    expect(report.results[0]?.answer.expertsUsed?.length).toBeGreaterThan(0);
    expect(report.parityGate.pass).toBe(true);
    expect(report.parityGate.passRate).toBe(1);
    expect(report.packReadiness.exposableCount).toBeGreaterThan(0);
  });

  it("marks a case failed when the captured answer fails quality scoring", async () => {
    const report = await runAgentAnswerEvalHarness({
      generatedAt: "2026-06-21T00:00:00.000Z",
      answerRunner: async (question) => ({
        surface: "intelligence",
        mode: "ANALYZE",
        tenantKey: "eval",
        question: question.query,
        intent: "prose",
        status: "answered",
        directAnswer: "",
        factsUsed: [],
        metricsUsed: [],
        relationshipsUsed: [],
        artifacts: [],
        citations: [],
        expertsUsed: [{ id: question.expectedExpertId, name: "Eval Expert" }],
        gaps: [],
        caveats: [],
        nextSteps: [],
        quality: {
          confidence: "medium",
          evidenceStrength: "thin",
          tenantGrounding: "missing",
          answerCompleteness: "partial",
        },
        safety: {
          tenantFencePassed: true,
          rawIdsSuppressed: true,
          forbiddenLanguagePassed: true,
          unsupportedClaimsBlocked: true,
        },
      }),
    });

    expect(report.passCount).toBe(0);
    expect(report.answerQualityPassCount).toBe(0);
    expect(
      report.results.every((result) =>
        result.notes.some((note) => note.includes("Return a concise")),
      ),
    ).toBe(true);
  });
});
