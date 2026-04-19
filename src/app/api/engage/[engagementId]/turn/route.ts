import { NextRequest } from 'next/server';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getPersonById } from '@/lib/db/person';
import { getRecentTurns, appendTurn } from '@/lib/db/turn';
import {
  getActivePatterns,
  getPeerDecisionsForPhase,
  getChainedPatterns,
} from '@/lib/graph/retrieval';
import { assembleEngagementSystemPrompt } from '@/lib/agent/prompts/engagement';
import { streamAgentTurn } from '@/lib/agent/stream';
import { getCurrentMaestro } from '@/lib/auth/maestro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ engagementId: string }> }
) {
  const { engagementId } = await params;
  const { userMessage } = await req.json();
  if (!userMessage || typeof userMessage !== 'string') {
    return new Response(JSON.stringify({ error: 'userMessage required' }), { status: 400 });
  }

  const engagement = await getEngagementByGraphId(engagementId);
  if (!engagement) {
    return new Response(JSON.stringify({ error: 'engagement not found' }), { status: 404 });
  }

  // Persist user turn first
  await appendTurn({
    engagementId: engagement.id,
    phase: engagement.current_phase,
    sender: 'user',
    text: userMessage,
  });

  // Retrieve all three layers + maestro context
  const [sponsor, recentTurns, activePatterns, peerDecisions, chainedPatterns, maestro] = await Promise.all([
    engagement.sponsor_person_id ? getPersonById(engagement.sponsor_person_id) : Promise.resolve(null),
    getRecentTurns(engagement.id, 30),
    getActivePatterns(engagementId),
    getPeerDecisionsForPhase(engagementId, engagement.current_phase),
    getChainedPatterns(engagementId),
    getCurrentMaestro(),
  ]);

  const system = assembleEngagementSystemPrompt({
    engagement, sponsor, activePatterns, peerDecisions, chainedPatterns, maestro,
  });

  const messages = recentTurns.map(t => ({
    role: t.sender === 'agent' ? 'assistant' as const : 'user' as const,
    content: t.text,
  }));

  const retrievedRefs = {
    sponsor_id: sponsor?.id ?? null,
    active_pattern_codes: activePatterns.map(p => p.code),
    chained_pattern_edges: chainedPatterns.map(c => `${c.from_code}->${c.to_code}`),
    peer_decision_choices: peerDecisions.map(d => d.choice),
    turn_history_count: recentTurns.length,
    retrieved_at: new Date().toISOString(),
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let agentFullText = '';
        const gen = streamAgentTurn({ system, messages });
        for await (const delta of gen) {
          agentFullText += delta;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'));
        }
        // Persist agent turn after streaming completes
        const savedTurn = await appendTurn({
          engagementId: engagement.id,
          phase: engagement.current_phase,
          sender: 'agent',
          text: agentFullText,
          retrievedRefs,
        });
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done', turnId: savedTurn.id }) + '\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: message }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
