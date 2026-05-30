import { getAuditedAnthropicClient } from './stream';
import { assembleTriggerDetectionPrompt, type TriggerContext } from './prompts/pattern-trigger';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

export interface DetectedTrigger {
  code: string;
  evidence: string;
}

export async function detectPatternTriggers(ctx: TriggerContext): Promise<DetectedTrigger[]> {
  try {
    if (!process.env.ANTHROPIC_API_KEY || !ctx.tenantId) return [];
    const prompt = assembleTriggerDetectionPrompt(ctx);
    const { client } = await getAuditedAnthropicClient({
      tenantId: ctx.tenantId,
      userId: ctx.userId ?? undefined,
      workflow: 'agent-pattern-trigger-detection',
      model: 'claude-haiku-4-5-20251001',
      prompt,
      dataClass: 'confidential',
      artifactId: ctx.turnId ?? undefined,
      artifactType: 'turn',
    });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as { triggers?: DetectedTrigger[] };
    if (!Array.isArray(parsed.triggers)) return [];
    return parsed.triggers.filter((t) => t && typeof t.code === 'string' && typeof t.evidence === 'string');
  } catch (err) {
    console.error('[pattern-trigger-detect]', err);
    return [];
  }
}

export async function writeTriggerEdge(
  engagementGraphNodeId: string,
  patternCode: string,
  evidence: string,
): Promise<void> {
  const client = getAzureWriteFluentClient();
  const node = await client
    .from('enterprise_graph_nodes')
    .select('client_id,tenant_key,node_id')
    .eq('node_id', engagementGraphNodeId)
    .maybeSingle();
  if (node.error || !node.data) return;

  const result = await client
    .from('enterprise_graph_edges')
    .upsert({
      client_id: node.data.client_id as string,
      tenant_key: node.data.tenant_key as string,
      edge_id: `trigger:${engagementGraphNodeId}:${patternCode}`,
      from_node_id: engagementGraphNodeId,
      to_node_id: patternCode,
      edge_type: 'TRIGGERED',
      source_segment_id: 'agent_pattern_trigger',
      source_record_id: patternCode,
      source_doc: 'agent-pattern-trigger-detection',
      source_basis: 'agent_observation',
      confidence: 0.72,
      properties: {
        evidence,
        observed_at: new Date().toISOString(),
        evidence_turn_count: 1,
      },
    }, { onConflict: 'tenant_key,edge_id' });
  if (result.error) {
    throw new Error(`writeTriggerEdge failed: ${result.error.message}`);
  }
}
