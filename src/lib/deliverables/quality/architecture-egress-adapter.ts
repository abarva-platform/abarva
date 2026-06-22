// Governed tool-call adapter for the ArchitectureModel generation pass.
//
// Implements GovernedToolCall by routing through the EGRESS-OWNED client
// (getAnthropicDirectClient) — the governance boundary. The generation pass owns
// no client; the orchestrator injects THIS adapter, so the only production path
// is governed. Never construct a bare SDK client elsewhere.

import "server-only";

import { getAnthropicDirectClient } from "@/lib/integrations/ai-egress/anthropic-direct";
import type { GovernedToolCall } from "@/lib/visual-system/architecture-generation";

export const governedArchitectureToolCall: GovernedToolCall = async (params) => {
  const client = getAnthropicDirectClient();
  const response = await client.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    system: params.system,
    tools: [params.tool as never],
    tool_choice: { type: "tool", name: params.tool.name },
    messages: [{ role: "user", content: params.userMessage }],
  });
  const toolUse = response.content.find(
    (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use",
  );
  return {
    toolInput: toolUse ? (toolUse as { input: unknown }).input : null,
    modelId: response.model,
  };
};
