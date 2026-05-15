import { getAnthropicClient } from './stream';
import { assembleTriggerDetectionPrompt, type TriggerContext } from './prompts/pattern-trigger';
import { withGraphSession } from '@/lib/graph/driver';

export interface DetectedTrigger {
  code: string;
  evidence: string;
}

export async function detectPatternTriggers(ctx: TriggerContext): Promise<DetectedTrigger[]> {
  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: assembleTriggerDetectionPrompt(ctx) }],
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
  // Gated by `graph_neo4j_enabled` — when off, the trigger edge is not
  // written (Postgres `enterprise_graph_edges` is the system of record;
  // Neo4j was a denormalized projection). See
  // `src/lib/graph/neo4j-gate.ts`.
  await withGraphSession<void>(
    'writeTriggerEdge',
    async (session) => {
      await session.run(
        `MATCH (e:Engagement {id: $eid}), (p:GenomePattern {code: $code})
         MERGE (e)-[r:TRIGGERED]->(p)
         ON CREATE SET r.first_seen_at = datetime(), r.evidence = $evidence, r.evidence_turn_count = 1, r.observed_at = datetime()
         ON MATCH SET r.last_seen_at = datetime(), r.evidence_turn_count = coalesce(r.evidence_turn_count, 1) + 1`,
        { eid: engagementGraphNodeId, code: patternCode, evidence },
      );
    },
    undefined,
  );
}
