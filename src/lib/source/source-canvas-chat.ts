import { composeSentinelSystemPrompt } from "@/lib/agent/voice-doctrine/sentinel";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";

import type { SourceLiveTenantContextSnapshot } from "./agent-context";
import {
  buildSourceSentinelCitationWarnings,
  buildSourceSentinelPromptEvidence,
  composeSourceSentinelEvidenceBlock,
  extractSourceSentinelEvidenceCitations,
  SOURCE_SENTINEL_GROUNDING_POSTURE,
  type SourceSentinelPromptEvidenceItem,
} from "./sentinel-chat-llm";
import type { SourceAnswerEvidenceCitation } from "./source-answer-engine";

export const SOURCE_CANVAS_CHAT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 512;

export interface SourceCanvasChatModelInput {
  prompt: string;
  briefingContext: string;
  tenantKey: string | null;
  tenantId: string;
  userId?: string;
  liveTenantContext?: SourceLiveTenantContextSnapshot;
}

export interface SourceCanvasChatModelResult {
  text: string;
  evidenceCitations: SourceAnswerEvidenceCitation[];
  warnings: string[];
}

/**
 * Call Claude with Sentinel voice for Source canvas chat.
 * Returns the answer, or throws so the caller can fall back to the
 * deterministic briefing.
 */
export async function callSourceCanvasChatModel(
  input: SourceCanvasChatModelInput,
): Promise<SourceCanvasChatModelResult> {
  if (!input.prompt.trim()) throw new Error("empty prompt");

  const promptEvidence = input.liveTenantContext
    ? buildSourceSentinelPromptEvidence(input.liveTenantContext)
    : [];
  const systemPrompt = composeSourceCanvasChatSystemPrompt({
    tenantKey: input.tenantKey,
    promptEvidence,
  });

  const userMessage = input.briefingContext
    ? `${input.briefingContext}\n\nUser question: ${input.prompt}`
    : input.prompt;

  // The audit row hashes whatever is handed to `prompt`. The system prompt now
  // carries tenant evidence excerpts, so the hash has to cover it or the audit
  // trail understates what left the boundary.
  const preflight = await preflightAnthropicDirectClient({
    tenantId: input.tenantId,
    userId: input.userId,
    workflow: "source-canvas-chat",
    model: SOURCE_CANVAS_CHAT_MODEL,
    prompt: [systemPrompt, userMessage].join("\n\nUser question:\n"),
    dataClass: "confidential",
    metadata: { surface: "source", tenantKey: input.tenantKey ?? "unknown" },
  });
  if (!preflight.ok) throw new Error(`egress blocked: ${preflight.reason}`);

  const msg = await preflight.client.messages.create({
    model: SOURCE_CANVAS_CHAT_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  if (!text.trim()) throw new Error("empty Claude response");

  const evidenceCitations = extractSourceSentinelEvidenceCitations(
    text,
    promptEvidence,
  );

  return {
    text,
    evidenceCitations,
    warnings: buildSourceSentinelCitationWarnings(text, evidenceCitations),
  };
}

/**
 * Sentinel voice, then the evidence actually loaded for this turn, then the
 * posture that makes the evidence binding. With no loaded evidence the block
 * still renders: it then instructs the model to say what is missing, which is
 * the refusal the canvas previously had no way to produce.
 */
export function composeSourceCanvasChatSystemPrompt(args: {
  tenantKey: string | null;
  promptEvidence?: readonly SourceSentinelPromptEvidenceItem[];
}): string {
  return [
    composeSentinelSystemPrompt({
      mode: "tenant",
      tenantKey: args.tenantKey,
      surface: "/source",
      vectorIndexPending: false,
      worldviewPending: false,
      worldviewHitsPresent: false,
    }),
    "",
    ...composeSourceSentinelEvidenceBlock(args.promptEvidence ?? []),
    "",
    ...SOURCE_SENTINEL_GROUNDING_POSTURE,
  ].join("\n");
}
