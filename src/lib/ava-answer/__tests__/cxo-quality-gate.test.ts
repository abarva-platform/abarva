import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  classifyCxoAnswerMode,
  evaluateCxoAnswerQuality,
} from "@/lib/ava-answer/cxo-quality-gate";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

function answerFixture(
  overrides: Partial<AvaAnswerPacket> = {},
): AvaAnswerPacket {
  return {
    surface: "intelligence",
    mode: "ANALYZE",
    tenantKey: "morgan-street",
    question:
      "Give me the top 5 AI use cases for supply chain and rank them in a 2x2 value/complexity matrix chart.",
    intent: "chart",
    status: "answered",
    directAnswer:
      "Morgan Street should prioritize supplier-risk sensing and planning exception triage first. The loaded tenant context supports a directional read; the value case should be validated against function-level spend and process-volume evidence.",
    factsUsed: [{ id: "f1", label: "Supply chain scope", value: "loaded" }],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [
      {
        artifact: "chart",
        id: "supply-chain-ai-2x2",
        kind: "quadrant-matrix",
        title: "Supply Chain AI Value / Complexity Matrix",
        data: {
          points: [
            { label: "Supplier-risk sensing", x: 35, y: 82 },
            { label: "Planning exception triage", x: 55, y: 78 },
          ],
        },
      },
      {
        artifact: "table",
        id: "supply-chain-use-cases",
        title: "Ranked AI Use Cases",
        columns: [
          { key: "use_case", label: "Use case" },
          { key: "value", label: "Value" },
          { key: "complexity", label: "Complexity" },
        ],
        rows: [
          {
            use_case: "Supplier-risk sensing",
            value: "High",
            complexity: "Medium",
          },
        ],
      },
    ],
    citations: [
      {
        id: "c1",
        label: "Supply chain planning packet",
        sourceClass: "tenant-fact",
        excerpt: "Loaded supply chain planning and supplier-risk context.",
      },
    ],
    gaps: [],
    caveats: [
      {
        id: "caveat-1",
        label: "Directional value",
        detail: "Validate function-level process volumes before approving spend.",
      },
    ],
    nextSteps: [
      {
        id: "next-1",
        label: "Validate process volume and owner readiness.",
      },
    ],
    quality: {
      confidence: "medium",
      evidenceStrength: "partial",
      tenantGrounding: "partial",
      answerCompleteness: "complete",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
    ...overrides,
  };
}

describe("CXO answer quality gate", () => {
  it("classifies executive answer modes from the question", () => {
    expect(
      classifyCxoAnswerMode({
        question:
          "What are others in industry doing with AI and what case studies matter?",
      }),
    ).toBe("industry_trend");
    expect(
      classifyCxoAnswerMode({
        question:
          "Should Lakeshore centralize or federate AI across portfolio companies?",
      }),
    ).toBe("portfolio_comparison");
    expect(
      classifyCxoAnswerMode({
        question: "What is the sourcing decision for the AMS renewal?",
      }),
    ).toBe("sourcing_decision");
  });

  it("passes a CXO answer with direct read, table, chart, caveat, evidence, and next move", () => {
    const result = evaluateCxoAnswerQuality(answerFixture());

    expect(result.mode).toBe("strategy_insight");
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.findings).toHaveLength(0);
  });

  it("blocks model-deflection language instead of telling the user to ask Claude", () => {
    const result = evaluateCxoAnswerQuality(
      answerFixture({
        directAnswer:
          "Claude could answer this better if you go directly there.",
      }),
    );

    expect(result.passed).toBe(false);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "model-deflection-language",
          severity: "error",
        }),
      ]),
    );
  });

  it("blocks internal data-layer and Move trace language from visible CXO answers", () => {
    const result = evaluateCxoAnswerQuality(
      answerFixture({
        directAnswer:
          "The V7 substrate shows candidate_move, move_id, phase_id, artifact_id, evidence_id, and tenant_id for this case.",
      }),
    );

    expect(result.passed).toBe(false);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "internal-visible-language",
          severity: "error",
        }),
      ]),
    );
  });

  it("flags missing typed exhibits for explicit visual requests", () => {
    const result = evaluateCxoAnswerQuality(
      answerFixture({
        artifacts: [],
      }),
    );

    expect(result.passed).toBe(true);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-chart-artifact" }),
        expect.objectContaining({ code: "missing-table-artifact" }),
      ]),
    );
  });

  it("stamps validation output with CXO mode, score, and findings", () => {
    const validation = validateAvaAnswerPacket(answerFixture());

    expect(validation.passed).toBe(true);
    expect(validation.packet.quality.cxo).toEqual(
      expect.objectContaining({
        mode: "strategy_insight",
        score: 100,
        passed: true,
      }),
    );
  });
});
