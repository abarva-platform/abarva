import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { AiDataClass } from "@/lib/integrations/ai-egress";

// Production reasoning must be Anthropic/Claude. This is the Sentinel Ask
// synthesis runtime (Claude); it replaces the legacy direct-API runtime.
// Egress is audited via getAuditedAnthropicClient.

export const INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL =
  process.env.INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL ??
  process.env.ANTHROPIC_MODEL ??
  "claude-opus-4-7";

export const INTELLIGENCE_ASK_ANTHROPIC_SMALL_MODEL =
  process.env.INTELLIGENCE_ASK_ANTHROPIC_SMALL_MODEL ??
  process.env.ANTHROPIC_MINI_MODEL ??
  "claude-haiku-4-5-20251001";

export function isIntelligenceAskAnthropicConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(env.ANTHROPIC_API_KEY?.trim());
}

/** Concatenate the text blocks of an Anthropic Messages response. */
export function extractAnthropicResponseText(response: unknown): string {
  const content = (response as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  const chunks: string[] = [];
  for (const block of content) {
    const typed = block as { type?: unknown; text?: unknown };
    if (typed.type === "text" && typeof typed.text === "string") {
      chunks.push(typed.text);
    }
  }
  return chunks.join("");
}

/**
 * Sentinel Ask synthesis on Claude. Same arg shape as the prior direct-API
 * synthesis runtime so the synthesizer swap is a drop-in.
 */
export async function createIntelligenceAskAnthropicText(args: {
  tenantId: string;
  userId?: string;
  workflow: string;
  model: string;
  instructions?: string;
  input: string;
  maxOutputTokens: number;
  dataClass?: AiDataClass;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const prompt = args.instructions
    ? [args.instructions, args.input].join("\n\n")
    : args.input;

  const { client } = await getAuditedAnthropicClient({
    tenantId: args.tenantId,
    userId: args.userId,
    workflow: args.workflow,
    model: args.model,
    prompt,
    dataClass: args.dataClass,
    metadata: { workflow: args.workflow, ...(args.metadata ?? {}) },
  });

  const response = await client.messages.create({
    model: args.model,
    max_tokens: args.maxOutputTokens,
    ...(args.instructions ? { system: args.instructions } : {}),
    messages: [{ role: "user", content: [{ type: "text", text: args.input }] }],
  });

  return extractAnthropicResponseText(response).trim();
}
