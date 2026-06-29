import { composeHomeKnowAvaAnswer } from "@/lib/ava-answer/homeComposer";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  HomeKnowAskRequest,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import { sanitizeHomeKnowVisiblePayload } from "@/lib/home/know/home-demo-safe-response";
import { answerHomeKnowFromV6 } from "@/lib/home/know/v6-home-ask";
import { toHomeKnowResponseFromV6 } from "@/lib/home/know/v6-home-know-response";
import type { AskSurfaceContext } from "@/lib/intelligence/ask";

export function shouldUseHomeKnowAgentAnswer(input: {
  query: string;
  surfaceContext: AskSurfaceContext | null;
}): boolean {
  if (input.surfaceContext?.activeTab !== "home") return false;
  return input.query.trim().length > 0;
}

export async function buildHomeKnowAgentAnswer(
  input: HomeKnowAskRequest,
): Promise<{ response: HomeKnowResponse; answer: AvaAnswerPacket }> {
  const v6Result = answerHomeKnowFromV6({
    question: input.question,
    tenantKey: input.tenantKey ?? input.client ?? "apexretail",
    includeTrace: false,
  });
  const response = sanitizeHomeKnowVisiblePayload(
    toHomeKnowResponseFromV6(v6Result, { question: input.question }),
  );
  return { response, answer: homeKnowResponseToAvaAnswer(response) };
}

export function homeKnowResponseToAvaAnswer(
  response: HomeKnowResponse,
): AvaAnswerPacket {
  return composeHomeKnowAvaAnswer(response);
}
