import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { reconcileGovernedAnswerSummary } from "@/lib/source/ava/governed-answer-stream";

const governedAnswer = {
  directAnswer: "No evidence is agent-ready. Resolve the recorded evidence gaps.",
  nextSteps: [
    {
      id: "open-files",
      label: "Open Files",
      targetSurface: "source",
    },
  ],
} as AvaAnswerPacket;

describe("reconcileGovernedAnswerSummary", () => {
  it("makes the governed packet the only rendered prose answer", () => {
    const response = {
      answer: "The event has broad accepted coverage.",
      summary: "The event has broad accepted coverage.",
      noModel: false,
      sourceAnswer: { answerText: "The event has broad accepted coverage." },
      agentResponseParts: [
        {
          type: "prose",
          title: "Advisor answer",
          text: "The event has broad accepted coverage.",
        },
      ],
      nexusSummary: {
        title: "Event summary",
        summary: "The event has broad accepted coverage.",
        primaryFinding: "Coverage is complete.",
        recommendedNextAction: "Proceed.",
        confidence: "medium",
      },
    };

    expect(reconcileGovernedAnswerSummary(response, governedAnswer)).toEqual({
      ...response,
      answer: governedAnswer.directAnswer,
      summary: governedAnswer.directAnswer,
      noModel: true,
      sourceAnswer: null,
      agentResponseParts: [],
      nexusSummary: {
        ...response.nexusSummary,
        summary: governedAnswer.directAnswer,
        primaryFinding: governedAnswer.directAnswer,
        recommendedNextAction: "Open Files",
      },
    });
  });

  it("keeps the fallback response unchanged when no governed packet exists", () => {
    const response = {
      answer: "Fallback answer",
      summary: "Fallback answer",
      noModel: false,
      sourceAnswer: null,
      agentResponseParts: [],
      nexusSummary: null,
    };

    expect(reconcileGovernedAnswerSummary(response, null)).toBe(response);
  });

  it("does not invent a next action when the governed packet has none", () => {
    const response = {
      answer: "Old answer",
      summary: "Old answer",
      noModel: false,
      sourceAnswer: { answerText: "Old answer" },
      agentResponseParts: [{ type: "prose", text: "Old answer" }],
      nexusSummary: {
        title: "Event summary",
        summary: "Old answer",
        primaryFinding: "Old answer",
        recommendedNextAction: "Old next action",
        confidence: "low",
      },
    };

    const withoutNextStep = {
      ...governedAnswer,
      nextSteps: [],
    } as AvaAnswerPacket;

    expect(
      reconcileGovernedAnswerSummary(response, withoutNextStep).nexusSummary
        ?.recommendedNextAction,
    ).toBe("");
  });
});
