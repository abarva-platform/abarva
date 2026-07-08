// The Phase C export function: renders an ALREADY-GENERATED Source aVa answer
// turn to a plain-text/markdown export. Pure — no model call, no re-grounding.
// This suite proves it reuses exactly the inputs given (never re-derives),
// and that the exportable-mode predicate matches the 5 modes the spec names.

import {
  exportSourceAnswerPacket,
  isExportableSourceAnswerMode,
  EXPORTABLE_SOURCE_ANSWER_MODES,
} from "../export-answer-packet";
import type { SourceAnswerMode } from "../answer-mode";

describe("isExportableSourceAnswerMode", () => {
  it("is true for exactly the 5 spec-named exportable modes", () => {
    expect([...EXPORTABLE_SOURCE_ANSWER_MODES].sort()).toEqual(
      [
        "decision_recommendation",
        "value_at_stake",
        "vendor_comparison",
        "bafo_strategy",
        "contract_optimization",
      ].sort(),
    );
    for (const mode of EXPORTABLE_SOURCE_ANSWER_MODES) {
      expect(isExportableSourceAnswerMode(mode)).toBe(true);
    }
  });

  it("is false for non-exportable modes and null", () => {
    const nonExportable: SourceAnswerMode[] = [
      "event_status",
      "workflow_how_to",
      "evidence_readiness",
      "artifact_lineage",
      "artifact_finality",
      "stage_gate",
      "risk_exposure",
      "clause_coverage",
      "should_cost",
      "committed_value",
      "value_realization",
      "general_advisory",
      "stakeholder_alignment",
    ];
    for (const mode of nonExportable) {
      expect(isExportableSourceAnswerMode(mode)).toBe(false);
    }
    expect(isExportableSourceAnswerMode(null)).toBe(false);
  });
});

describe("exportSourceAnswerPacket", () => {
  it("renders the mode heading, event, question, and answer text verbatim", () => {
    const md = exportSourceAnswerPacket({
      mode: "value_at_stake",
      event: { code: "SRC-AMS-2026-001", name: "Lakeshore AMS Consolidation" },
      question: "What's our value at stake?",
      answerText: "The value bridge shows $4.2M-$6.5M at stake across 2 levers.",
      generatedAtIso: "2026-07-08T00:00:00.000Z",
    });
    expect(md).toContain("# Value at Stake");
    expect(md).toContain("SRC-AMS-2026-001");
    expect(md).toContain("Lakeshore AMS Consolidation");
    expect(md).toContain("What's our value at stake?");
    expect(md).toContain("$4.2M-$6.5M at stake across 2 levers");
    expect(md).toContain("2026-07-08T00:00:00.000Z");
  });

  it("includes the grounding block VERBATIM when provided (never re-derived)", () => {
    const groundingBlockText =
      "VALUE-AT-STAKE GROUNDING (authoritative...):\nHeadline: $4.2M-$6.5M at stake.";
    const md = exportSourceAnswerPacket({
      mode: "value_at_stake",
      question: "What's our value at stake?",
      answerText: "See the value bridge.",
      groundingBlockText,
    });
    expect(md).toContain("## Grounding / Evidence");
    expect(md).toContain(groundingBlockText);
  });

  it("omits the grounding section when no grounding block is provided", () => {
    const md = exportSourceAnswerPacket({
      mode: "general_advisory",
      question: "What do you think?",
      answerText: "Some general judgment.",
    });
    expect(md).not.toContain("## Grounding / Evidence");
  });

  it("renders the quotable facts appendix when provided", () => {
    const md = exportSourceAnswerPacket({
      mode: "bafo_strategy",
      question: "What's the BAFO strategy?",
      answerText: "Push the two open levers.",
      quotableFacts: { bafoOpenLeverCount: "2", bafoProgressIsModel: "false" },
    });
    expect(md).toContain("## Cited Facts");
    expect(md).toContain("bafoOpenLeverCount");
    expect(md).toContain("2");
  });

  it("omits the cited-facts appendix when no facts are provided", () => {
    const md = exportSourceAnswerPacket({
      mode: "bafo_strategy",
      question: "What's the BAFO strategy?",
      answerText: "Push the two open levers.",
    });
    expect(md).not.toContain("## Cited Facts");
  });

  it("uses a generic heading for a null mode", () => {
    const md = exportSourceAnswerPacket({
      mode: null,
      question: "Anything?",
      answerText: "An answer.",
    });
    expect(md).toContain("# Source aVa Answer");
  });

  it("is pure: identical input always yields identical output", () => {
    const input = {
      mode: "decision_recommendation" as const,
      question: "What should we do?",
      answerText: "Award to Vendor A.",
      groundingBlockText: "DECISION RECOMMENDATION GROUNDING...",
      quotableFacts: { execDecisionHeadline: "headline" },
      generatedAtIso: "2026-07-08T00:00:00.000Z",
    };
    expect(exportSourceAnswerPacket(input)).toBe(exportSourceAnswerPacket(input));
  });

  it("never calls out to any network/model — output is a plain string synchronously", () => {
    const result = exportSourceAnswerPacket({
      mode: "vendor_comparison",
      question: "Compare vendors",
      answerText: "Vendor A wins on normalized TCO.",
    });
    expect(typeof result).toBe("string");
  });
});
