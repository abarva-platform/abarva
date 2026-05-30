import { callModel, type AiDataClass, type AiModelAdapter } from '@/lib/integrations/ai-egress';
import { createSentinelAiAuditSink, loadSentinelClientPolicy } from './db';

const DEFAULT_MODEL = 'claude-sentinel-reasoning';

async function callAzureFoundryClaude(prompt: string, model: string): Promise<string | null> {
  const endpoint = process.env.AZURE_FOUNDRY_CLAUDE_ENDPOINT?.replace(/\/$/, '');
  const apiKey = process.env.AZURE_FOUNDRY_CLAUDE_KEY;
  if (!endpoint || !apiKey) return null;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Azure Foundry Claude call failed: ${response.status} ${await response.text()}`);
  }
  const json = await response.json() as {
    content?: Array<{ type?: string; text?: string }>;
    choices?: Array<{ message?: { content?: string } }>;
    output_text?: string;
  };
  return json.output_text
    ?? json.choices?.[0]?.message?.content
    ?? json.content?.filter((block) => block.type === 'text').map((block) => block.text).filter(Boolean).join('\n')
    ?? null;
}

function createSentinelAdapter(fallbackResponse: string): AiModelAdapter {
  return async ({ prompt, model }) => {
    const foundryResponse = await callAzureFoundryClaude(prompt, model ?? DEFAULT_MODEL);
    return {
      response: foundryResponse ?? fallbackResponse,
      model: foundryResponse ? (model ?? DEFAULT_MODEL) : 'deterministic-sentinel-fallback',
    };
  };
}

export async function callSentinelModel(args: {
  clientId: string;
  userId?: string | null;
  workflow: string;
  prompt: string;
  dataClass?: AiDataClass;
  fallbackResponse: string;
  metadata?: Record<string, unknown>;
}): Promise<{ text: string; auditId: string | null; denied: boolean }> {
  const { clientId, policy } = await loadSentinelClientPolicy(args.clientId);
  // PRE-W4-PR-6: stamp intended + resolved tenant on every audit row.
  // `args.clientId` is what the caller asked for (slug or UUID); the
  // resolved `clientId` is what the policy loader returned.
  const result = await callModel({
    tenantId: clientId,
    userId: args.userId ?? undefined,
    workflow: args.workflow,
    provider: 'anthropic',
    route: 'azure-foundry-private',
    model: DEFAULT_MODEL,
    prompt: args.prompt,
    dataClass: args.dataClass ?? 'internal',
    metadata: {
      ...(args.metadata ?? {}),
      packet: 'P11',
      agent: 'Sentinel',
    },
    policy,
    auditSink: createSentinelAiAuditSink({
      intendedTenantKey: args.clientId,
      resolvedTenantKey: clientId,
      tenantId: clientId,
    }),
    adapter: createSentinelAdapter(args.fallbackResponse),
  });

  if (!result.ok) {
    return {
      text: args.fallbackResponse,
      auditId: result.auditId,
      denied: true,
    };
  }
  return {
    text: result.response || args.fallbackResponse,
    auditId: result.auditId,
    denied: false,
  };
}
