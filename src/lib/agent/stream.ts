import {
  getAnthropicDirectClient,
  type AnthropicDirectClient,
  type AnthropicTool,
} from '@/lib/integrations/ai-egress';

let client: AnthropicDirectClient | null = null;
export function getAnthropicClient(): AnthropicDirectClient {
  if (client) return client;
  client = getAnthropicDirectClient();
  return client;
}

export interface StreamTurnArgs {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
  maxTokens?: number;
  /**
   * F0.4: Optional tool list passed through to the Anthropic stream.
   * When omitted the call shape is unchanged (text-only). For routes
   * that need full multi-turn tool execution, use `runToolUseLoop`
   * from `streaming/toolUseLoop.ts` instead — this util is text-only.
   */
  tools?: AnthropicTool[];
}

export async function* streamAgentTurn(args: StreamTurnArgs): AsyncGenerator<string, string, unknown> {
  const client = getAnthropicClient();
  const stream = await client.messages.stream({
    model: args.model ?? 'claude-opus-4-7',
    max_tokens: args.maxTokens ?? 1024,
    system: args.system,
    messages: args.messages,
    ...(args.tools && args.tools.length > 0 ? { tools: args.tools } : {}),
  });

  let fullText = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text;
      yield event.delta.text;
    }
  }
  return fullText;
}
