import { createHash } from 'node:crypto';
import { callModel, createSupabaseAiEgressAuditSink, loadTenantAiPolicyRecord } from '@/lib/integrations/ai-egress';

const EMBEDDING_DIMENSIONS = 1536;

type EmbeddingPayload = {
  embedding: number[];
  model?: string;
};

function deterministicEmbedding(text: string): number[] {
  const seed = createHash('sha256').update(text).digest();
  return Array.from({ length: EMBEDDING_DIMENSIONS }, (_, index) => {
    const byte = seed[index % seed.length];
    return (byte / 255) * 2 - 1;
  });
}

async function callAzureOpenAiEmbedding(text: string): Promise<EmbeddingPayload> {
  const endpoint = process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT?.replace(/\/$/, '');
  const apiKey = process.env.AZURE_OPENAI_EMBEDDING_KEY;
  const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';

  if (!endpoint || !apiKey) {
    return {
      embedding: deterministicEmbedding(text),
      model: 'deterministic-local-embedding',
    };
  }

  const response = await fetch(
    `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/embeddings?api-version=${encodeURIComponent(apiVersion)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ input: text }),
    },
  );
  if (!response.ok) {
    throw new Error(`Azure OpenAI embedding failed: ${response.status} ${await response.text()}`);
  }
  const json = await response.json() as {
    data?: Array<{ embedding?: number[] }>;
    model?: string;
  };
  const embedding = json.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error('Azure OpenAI embedding response did not include an embedding vector.');
  }
  return { embedding, model: json.model ?? deployment };
}

export async function embedPatternText(args: {
  text: string;
  clientId: string;
  userId?: string;
  patternId?: string;
}): Promise<EmbeddingPayload & { auditId: string }> {
  const policyRecord = await loadTenantAiPolicyRecord(args.clientId);
  const result = await callModel({
    tenantId: policyRecord.tenantId,
    userId: args.userId,
    workflow: 'embed-pattern',
    artifactId: args.patternId,
    artifactType: 'corpus_pattern',
    provider: 'openai-embeddings' as never,
    route: 'azure-foundry-private',
    model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large',
    prompt: args.text,
    dataClass: 'internal',
    metadata: { dimensions: EMBEDDING_DIMENSIONS },
    policy: policyRecord.policy,
    auditSink: createSupabaseAiEgressAuditSink(),
    adapter: async ({ prompt }) => {
      const payload = await callAzureOpenAiEmbedding(prompt);
      return {
        response: JSON.stringify(payload),
        model: payload.model,
      };
    },
  });

  if (!result.ok) {
    throw new Error(result.reason);
  }

  const parsed = JSON.parse(result.response) as EmbeddingPayload;
  if (!Array.isArray(parsed.embedding)) {
    throw new Error('Embedding callModel response did not include an embedding vector.');
  }
  return {
    embedding: parsed.embedding,
    model: parsed.model ?? result.model,
    auditId: result.auditId,
  };
}
