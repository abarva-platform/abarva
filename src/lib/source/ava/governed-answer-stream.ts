import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

interface GovernedSummaryResponse {
  answer: string;
  summary: string;
  noModel: boolean;
  sourceAnswer: unknown;
  agentResponseParts: unknown[];
  nexusSummary: {
    summary: string;
    primaryFinding: string;
    recommendedNextAction: string;
  } | null;
}

export function reconcileGovernedAnswerSummary<
  TResponse extends GovernedSummaryResponse,
>(response: TResponse, answer: AvaAnswerPacket | null): TResponse {
  if (!answer) return response;

  const recommendedNextAction = answer.nextSteps?.[0]?.label ?? "";

  return {
    ...response,
    answer: answer.directAnswer,
    summary: answer.directAnswer,
    noModel: true,
    sourceAnswer: null,
    agentResponseParts: [],
    nexusSummary: response.nexusSummary
      ? {
          ...response.nexusSummary,
          summary: answer.directAnswer,
          primaryFinding: answer.directAnswer,
          recommendedNextAction,
        }
      : null,
  };
}
