import { composeHomeKnowAvaAnswer } from "@/lib/ava-answer/homeComposer";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";
import type { AskSurfaceContext } from "@/lib/intelligence/ask";

export function shouldUseHomeKnowAgentAnswer(input: {
  query: string;
  surfaceContext: AskSurfaceContext | null;
}): boolean {
  if (input.surfaceContext?.activeTab !== "home") return false;
  return input.query.trim().length > 0;
}

// buildHomeKnowAgentAnswer used to live here, composing an answer via the V6 file-reading path
// (answerHomeKnowFromV6 -> applyHomeV6ExecutiveSynthesis -> toHomeKnowResponseFromV6). That path
// expected a V6_GENERATED_MANIFEST.json under a synthetic dataset directory deleted from the repo
// in the tenant-input-standard cleanup, so it threw on every tenant, every call -- the sole caller
// (src/app/api/intelligence/ask/route.ts) now calls buildHomeKnowResponse from home-know-engine.ts
// directly instead, the same live engine /api/home/know/ask already serves real answers with.

export function homeKnowResponseToAvaAnswer(
  response: HomeKnowResponse,
): AvaAnswerPacket {
  return composeHomeKnowAvaAnswer(response);
}
