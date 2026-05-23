import {
  getAnthropicDirectClient,
  preflightAnthropicDirectClient,
  type AnthropicDirectClient,
  type AnthropicTool,
} from '@/lib/integrations/ai-egress';
import type { AiDataClass } from '@/lib/integrations/ai-egress';

let client: AnthropicDirectClient | null = null;
export function getAnthropicClient(): AnthropicDirectClient {
  if (client) return client;
  client = getAnthropicDirectClient();
  return client;
}

export async function getAuditedAnthropicClient(args: {
  tenantId: string;
  userId?: string;
  workflow: string;
  prompt: string;
  model: string;
  dataClass?: AiDataClass;
  artifactId?: string;
  artifactType?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ client: AnthropicDirectClient; auditId: string; dataClass: AiDataClass }> {
  const preflight = await preflightAnthropicDirectClient(args);
  if (!preflight.ok) {
    throw new Error(preflight.reason);
  }
  return {
    client: preflight.client,
    auditId: preflight.auditId,
    dataClass: preflight.dataClass,
  };
}

export interface StreamTurnArgs {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
  maxTokens?: number;
  aiEgress: {
    tenantId?: string | null;
    userId?: string | null;
    workflow: string;
    dataClass?: AiDataClass;
    artifactId?: string | null;
    artifactType?: string;
    metadata?: Record<string, unknown>;
  };
  /**
   * F0.4: Optional tool list passed through to the Anthropic stream.
   * When omitted the call shape is unchanged (text-only). For routes
   * that need full multi-turn tool execution, use `runToolUseLoop`
   * from `streaming/toolUseLoop.ts` instead — this util is text-only.
   */
  tools?: AnthropicTool[];
}

function buildStreamAuditPrompt(args: StreamTurnArgs): string {
  const turns = args.messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');
  return [args.system, turns].filter(Boolean).join('\n\n');
}

export async function* streamAgentTurn(args: StreamTurnArgs): AsyncGenerator<string, string, unknown> {
  const model = args.model ?? 'claude-opus-4-7';
  const tenantId = args.aiEgress.tenantId?.trim();
  if (!tenantId) {
    throw new Error('AI egress denied: streamAgentTurn requires a tenantId');
  }
  const { client } = await getAuditedAnthropicClient({
    tenantId,
    userId: args.aiEgress.userId?.trim() || undefined,
    workflow: args.aiEgress.workflow,
    prompt: buildStreamAuditPrompt(args),
    model,
    dataClass: args.aiEgress.dataClass ?? 'confidential',
    artifactId: args.aiEgress.artifactId ?? undefined,
    artifactType: args.aiEgress.artifactType,
    metadata: {
      ...(args.aiEgress.metadata ?? {}),
      messageCount: args.messages.length,
      toolCount: args.tools?.length ?? 0,
      streaming: true,
    },
  });
  const stream = await client.messages.stream({
    model,
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
