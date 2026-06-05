import { preflightOpenAIDirectClient } from "@/lib/integrations/ai-egress";
import type { AiDataClass } from "@/lib/integrations/ai-egress";

export const INTELLIGENCE_ASK_OPENAI_SYNTHESIS_MODEL =
  process.env.INTELLIGENCE_ASK_OPENAI_SYNTHESIS_MODEL ??
  process.env.OPENAI_MODEL ??
  "gpt-5.1";

export const INTELLIGENCE_ASK_OPENAI_SMALL_MODEL =
  process.env.INTELLIGENCE_ASK_OPENAI_SMALL_MODEL ??
  process.env.OPENAI_MINI_MODEL ??
  "gpt-4o-mini";

export function isIntelligenceAskOpenAIConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim());
}

export async function createIntelligenceAskOpenAIText(args: {
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
  const preflight = await preflightOpenAIDirectClient({
    tenantId: args.tenantId,
    userId: args.userId,
    workflow: args.workflow,
    model: args.model,
    prompt,
    dataClass: args.dataClass,
    metadata: args.metadata,
  });
  if (!preflight.ok) {
    throw new Error(`OpenAI egress denied: ${preflight.reason}`);
  }

  const response = await preflight.client.responses.create({
    model: args.model,
    instructions: args.instructions,
    input: args.input,
    max_output_tokens: args.maxOutputTokens,
    store: false,
    metadata: {
      workflow: args.workflow,
      ...(args.metadata ?? {}),
    },
  });

  return extractOpenAIResponseText(response).trim();
}

function extractOpenAIResponseText(response: unknown): string {
  const directText = (response as { output_text?: unknown }).output_text;
  if (typeof directText === "string") return directText;

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  const chunks: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      const text = (block as { text?: unknown }).text;
      if (typeof text === "string") chunks.push(text);
    }
  }
  return chunks.join("");
}
