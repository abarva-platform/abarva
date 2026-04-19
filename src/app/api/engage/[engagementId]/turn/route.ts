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
import { captureRelationshipNotes } from '@/lib/agent/capture';
import { appendPersonalThreads } from '@/lib/db/person';
import {
  appendRelationshipNote,
  getActivePersonalThreads,
} from '@/lib/db/relationship-note';
import {
  parseGateApprovalBlock,
  parseDecisionBlocks,
  parseActualMetricsBlock,
  parseOutcomeFeeBlock,
} from '@/lib/agent/parse';
import {
  recordGateApproval,
  appendDecision,
  updateActualMetrics,
  proposeOutcomeFee,
} from '@/lib/db/engagement';
import { generateDeliverableForPhase } from '@/lib/deliverables/generate';
import { checkGuardrail } from '@/lib/agent/guardrail';
import { detectPatternTriggers, writeTriggerEdge } from '@/lib/agent/pattern-trigger';
import { getAllGenomePatterns } from '@/lib/graph/retrieval';
import { getCurrentPerson } from '@/lib/auth/maestro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  // Role gate: sponsors can only act on their own engagement; maestros on any.
  // Signed-out callers pass through (auth is enforced by the proxy/middleware).
  try {
    const caller = await getCurrentPerson();
    if (caller) {
      const isMaestro = caller.role === 'maestro';
      const isSponsor = engagement.sponsor_person_id === caller.id;
      const isCoSponsor = engagement.co_sponsor_person_id === caller.id;
      if (!isMaestro && !isSponsor && !isCoSponsor) {
        return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
      }
    }
  } catch (err) {
    console.warn('[engage.turn.role-gate]', err);
  }

  // Persist user turn first
  const savedUserTurn = await appendTurn({
    engagementId: engagement.id,
    phase: engagement.current_phase,
    sender: 'user',
    text: userMessage,
  });

  // Retrieve all three layers + maestro context + personal threads
  const [sponsor, recentTurns, activePatterns, peerDecisions, chainedPatterns, maestro] = await Promise.all([
    engagement.sponsor_person_id ? getPersonById(engagement.sponsor_person_id) : Promise.resolve(null),
    getRecentTurns(engagement.id, 30),
    getActivePatterns(engagementId),
    getPeerDecisionsForPhase(engagementId, engagement.current_phase),
    getChainedPatterns(engagementId),
    getCurrentMaestro(),
  ]);

  const personalThreads = sponsor
    ? await getActivePersonalThreads(sponsor.id)
    : [];

  const system = assembleEngagementSystemPrompt({
    engagement, sponsor, activePatterns, peerDecisions, chainedPatterns, maestro, personalThreads,
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
        // Guardrail check (v1: log violations, don't regenerate — avoid janky UX)
        void (async () => {
          try {
            const check = await checkGuardrail({
              draftResponse: agentFullText,
              knownContext: {
                personName: sponsor?.name ?? 'unknown',
                personRole: sponsor?.role ?? '',
                personOrganization: sponsor?.organization ?? '',
                engagementName: engagement.name,
                engagementIndustry: engagement.industry_code,
                currentPhase: engagement.current_phase,
                activePatterns: activePatterns.map((p) => `${p.code} ${p.name}`),
                personalThreads,
              },
            });
            if (check.violation) {
              console.warn('[guardrail-violation]', {
                engagement_id: engagement.id,
                turn_id: savedTurn.id,
                reason: check.reason,
              });
            }
          } catch (err) {
            console.error('[guardrail-runner]', err);
          }
        })();

        // Decision logging (Phase 3) — append each block, non-blocking for stream close
        try {
          const decisions = parseDecisionBlocks(agentFullText);
          for (const d of decisions) {
            await appendDecision(engagement.id, d);
          }
          if (decisions.length > 0) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'decisions_logged', count: decisions.length }) + '\n'),
            );
          }
        } catch (err) {
          console.error('[decision-log]', err);
        }

        // Actual metrics capture (Phase 4)
        try {
          const actual = parseActualMetricsBlock(agentFullText);
          if (actual && actual.items.length > 0) {
            await updateActualMetrics(engagement.id, actual.items);
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'actual_metrics_captured', count: actual.items.length }) + '\n'),
            );
          }
        } catch (err) {
          console.error('[actual-metrics]', err);
        }

        // Outcome fee proposal (Phase 4)
        try {
          const fee = parseOutcomeFeeBlock(agentFullText);
          if (fee) {
            await proposeOutcomeFee(engagement.id, fee.fee_amount_usd);
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'outcome_fee_proposed', amount: fee.fee_amount_usd }) + '\n'),
            );
          }
        } catch (err) {
          console.error('[outcome-fee]', err);
        }

        // Gate approval detection — emit event BEFORE 'done' so UI can show toast
        const gateApproval = parseGateApprovalBlock(agentFullText);
        if (gateApproval && sponsor) {
          try {
            const updated = await recordGateApproval({
              engagementId: engagement.id,
              phase: gateApproval.phase,
              approvedByPersonId: sponsor.id,
              approvalText: gateApproval.approval_text,
              summary: gateApproval.summary,
            });
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'gate_approved',
                  phase: gateApproval.phase,
                  new_phase: updated.current_phase,
                }) + '\n',
              ),
            );
            // Fire deliverable generation in background — do not block stream close
            void generateDeliverableForPhase(engagement.id, gateApproval.phase).catch((err) =>
              console.error('[deliverable]', err),
            );
          } catch (err) {
            console.error('[gate-approval]', err);
          }
        }

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done', turnId: savedTurn.id }) + '\n'));
        controller.close();

        // Auto pattern-trigger detection — fires alongside relationship capture
        if (userMessage.trim().length > 30) {
          void (async () => {
            try {
              const allPatterns = await getAllGenomePatterns();
              const alreadyTriggered = activePatterns.map((p) => p.code);
              const triggers = await detectPatternTriggers({
                userText: userMessage,
                engagementName: engagement.name,
                engagementIndustry: engagement.industry_code,
                allPatterns: allPatterns.map((p) => ({ code: p.code, name: p.name, category: p.category })),
                alreadyTriggered,
              });
              for (const t of triggers) {
                await writeTriggerEdge(engagement.graph_node_id, t.code, t.evidence);
              }
            } catch (err) {
              console.error('[pattern-trigger]', err);
            }
          })();
        }

        // Fire capture loop in background — never blocks the response.
        // Skip if no sponsor, message too short, or any error inside. Missed
        // captures are fine; broken conversations are not.
        if (sponsor && userMessage.trim().length > 30) {
          void (async () => {
            try {
              const existing = await getActivePersonalThreads(sponsor.id);
              const notes = await captureRelationshipNotes({
                personName: sponsor.name,
                existingThreads: existing,
                userText: userMessage,
                engagementName: engagement.name,
              });
              for (const n of notes) {
                await appendRelationshipNote({
                  personId: sponsor.id,
                  category: n.category,
                  noteText: n.text,
                  sourceTurnId: savedUserTurn.id,
                  sourceEngagementId: engagement.id,
                  decayDays: n.decay_days,
                });
              }
              const mirror = notes
                .filter((n) => n.category === 'personal' || n.category === 'preference')
                .map((n) => n.text);
              if (mirror.length > 0) {
                await appendPersonalThreads(sponsor.id, mirror);
              }
            } catch (err) {
              console.error('[capture-loop]', err);
            }
          })();
        }
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
