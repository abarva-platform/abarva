import { composeHomeKnowAvaAnswer } from "@/lib/ava-answer/homeComposer";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { buildHomeKnowResponse } from "@/lib/home/know/home-know-engine";
import type {
  HomeKnowAskRequest,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
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
  const response = await buildHomeKnowResponse(input);
  return { response, answer: homeKnowResponseToAvaAnswer(response) };
}

export function homeKnowResponseToAvaAnswer(
  response: HomeKnowResponse,
): AvaAnswerPacket {
  return composeHomeKnowAvaAnswer(response);
}
