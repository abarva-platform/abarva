import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;
export function getAnthropicClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
  client = new Anthropic({ apiKey });
  return client;
}

export interface StreamTurnArgs {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
  maxTokens?: number;
}

export async function* streamAgentTurn(args: StreamTurnArgs): AsyncGenerator<string, string, unknown> {
  const client = getAnthropicClient();
  const stream = await client.messages.stream({
    model: args.model ?? 'claude-opus-4-7',
    max_tokens: args.maxTokens ?? 1024,
    system: args.system,
    messages: args.messages,
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
