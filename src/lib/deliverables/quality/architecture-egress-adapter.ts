// Governed tool-call adapter for the ArchitectureModel generation pass.
//
// Implements GovernedToolCall by routing through the EGRESS-OWNED client
// (getAnthropicDirectClient) — the governance boundary. The generation pass owns
// no client; the orchestrator injects THIS adapter, so the only production path
// is governed. Never construct a bare SDK client elsewhere.

import "server-only";

import { getAnthropicDirectClient } from "@/lib/integrations/ai-egress/anthropic-direct";
import type { GovernedToolCall } from "@/lib/visual-system/architecture-generation";

const MAX_ARCHITECTURE_STREAM_RETRIES = 2;
const RETRYABLE_ARCHITECTURE_STREAM_ERROR_RE =
  /overloaded_error|\boverloaded\b|rate_limit_error|\bterminated\b|other side closed|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|fetch failed|network (error|timeout)/i;

function isRetryableArchitectureStreamError(err: unknown): boolean {
  const candidate = err as {
    status?: unknown;
    type?: unknown;
    error?: { type?: unknown; message?: unknown };
    message?: unknown;
  } | null;
  const status = typeof candidate?.status === "number" ? candidate.status : null;
  if (status === 429 || (status !== null && status >= 500)) return true;
  const message = [
    candidate?.type,
    candidate?.error?.type,
    candidate?.error?.message,
    candidate?.message,
    err instanceof Error ? err.message : String(err),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  return RETRYABLE_ARCHITECTURE_STREAM_ERROR_RE.test(message);
}

async function streamArchitectureWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_ARCHITECTURE_STREAM_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (
        attempt === MAX_ARCHITECTURE_STREAM_RETRIES ||
        !isRetryableArchitectureStreamError(err)
      ) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** attempt));
    }
  }
  throw lastError;
}

export const governedArchitectureToolCall: GovernedToolCall = async (params) => {
  const client = getAnthropicDirectClient();
  const response = await streamArchitectureWithRetry(() =>
    client.messages
      .stream({
        model: params.model,
        max_tokens: params.maxTokens,
        system: params.system,
        tools: [params.tool as never],
        tool_choice: { type: "tool", name: params.tool.name },
        messages: [{ role: "user", content: params.userMessage }],
      })
      .finalMessage(),
  );
  const toolUse = response.content.find(
    (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use",
  );
  return {
    toolInput: toolUse ? (toolUse as { input: unknown }).input : null,
    modelId: response.model,
    stopReason: response.stop_reason,
    outputTokens: response.usage.output_tokens,
  };
};
