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
import { assembleRetrievalContext } from '@/lib/agent/retrieval';
import { formatRetrievedContext } from '@/lib/agent/retrieval-format';
import { assembleCrossClientContext, formatCrossClientBlock } from '@/lib/graph/cross-client';
import { getServerSupabase } from '@/lib/supabase-server';
import { streamAgentTurn } from '@/lib/agent/stream';
import { TurnTrace } from '@/lib/agent/trace';
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
import { syncPhaseOneArtifactsFromTurns } from '@/lib/deliverables/live-sync';
import { phaseOpenerFor } from '@/lib/nexus/gateLifecycle';
import { checkGuardrail } from '@/lib/agent/guardrail';
import { detectPatternTriggers, writeTriggerEdge } from '@/lib/agent/pattern-trigger';
import { getAllGenomePatterns } from '@/lib/graph/retrieval';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { createOutcomeFeeInvoice, isStripeConfigured } from '@/lib/billing/stripe';
import { logAudit } from '@/lib/audit/log';
import { assembleMaestroContextBlock } from '@/lib/agent/prompts/_shared/maestro-context';
import { assembleUserContextBlock } from '@/lib/agent/prompts/_shared/user-context';
import { getUserContextPromptBlock } from '@/lib/agent/userContext';
import { assembleTopicIntelligenceBlock } from '@/lib/agent/prompts/_shared/topic-intelligence';
import { updateMaestroProfile } from '@/lib/agent/maestro-extractor';
import { parseChoicesFromText } from '@/lib/agent/parse-choices';

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

  // Trace captures retrieval + graph + stream steps for the "why did Nexus
  // say this?" drawer. Persisted post-stream via trace.persist().
  const trace = new TurnTrace(null, engagement.id);
  const tRetrievalStart = Date.now();

  // Retrieve all three layers + maestro context + personal threads
  const [sponsor, recentTurns, activePatterns, peerDecisions, chainedPatterns, maestro] = await Promise.all([
    engagement.sponsor_person_id ? getPersonById(engagement.sponsor_person_id) : Promise.resolve(null),
    getRecentTurns(engagement.id, 30),
    getActivePatterns(engagementId),
    getPeerDecisionsForPhase(engagementId, engagement.current_phase),
    getChainedPatterns(engagementId),
    getCurrentMaestro(),
  ]);

  trace.record({
    label: 'cypher.active_patterns',
    kind: 'graph',
    latencyMs: Date.now() - tRetrievalStart,
    count: activePatterns.length,
    summary: activePatterns.map((p) => p.code).join(', ') || 'none active',
  });
  trace.record({
    label: 'cypher.peer_decisions',
    kind: 'graph',
    latencyMs: 0,
    count: peerDecisions.length,
  });
  trace.record({
    label: 'cypher.chained_patterns',
    kind: 'graph',
    latencyMs: 0,
    count: chainedPatterns.length,
  });

  const personalThreads = sponsor
    ? await getActivePersonalThreads(sponsor.id)
    : [];

  // F0.2 Layer 0 — signed-in user block. Distinct from the maestro
  // context below: the maestro is the person assigned to run this
  // engagement; the signed-in user is whoever is reading the chat.
  // Often the same person, but not always.
  const [signedInUserContextBlock, maestroContextBlock, userContextBlock, topicIntelligenceBlock] = await Promise.all([
    getUserContextPromptBlock(),
    maestro
      ? assembleMaestroContextBlock({ personId: maestro.id, personName: maestro.name })
      : Promise.resolve(''),
    maestro
      ? assembleUserContextBlock({ personId: maestro.id, displayName: maestro.name })
      : Promise.resolve(''),
    trace.capture(
      'topic-intelligence assembly',
      'graph',
      () =>
        assembleTopicIntelligenceBlock({
          engagementId: engagement.id,
          currentPhase: engagement.current_phase,
          recentTurns: recentTurns.map((t) => ({ sender: t.sender, text: t.text })),
        }),
      (block) => ({
        count: block ? 1 : 0,
        summary: block ? `${block.split('TOPIC INTELLIGENCE:').length - 1} topic blocks` : 'no topics assigned',
      }),
    ),
  ]);

  const messages = recentTurns.map(t => ({
    role: t.sender === 'agent' ? 'assistant' as const : 'user' as const,
    content: t.text,
  }));

  // Pack B Phase 6 · retrieval merge. Empty-safe — returns empty chunks when
  // OPENAI_API_KEY / PINECONE_API_KEY missing, or when namespaces are empty.
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const retrievalCtx = lastUser
    ? await trace.capture(
        'pinecone.global+client fan-out',
        'retrieval',
        () =>
          assembleRetrievalContext({
            engagementId: engagement.id,
            clientId: null,
            industry: (engagement.industry_code as 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL' | 'GENERAL' | null) ?? null,
            currentPhase: engagement.current_phase,
            userQuery: lastUser.content,
            turnHistory: messages,
          }),
        (ctx) => ({
          count: ctx.clientChunks.length + ctx.industryChunks.length + ctx.topicChunks.length,
          summary: `client:${ctx.clientChunks.length} industry:${ctx.industryChunks.length} topic:${ctx.topicChunks.length}`,
        }),
      )
    : null;
  const retrievedContextBlock = retrievalCtx ? formatRetrievedContext(retrievalCtx) : '';

  // Pack K · cross-client context. Look up client via engagement.id (EngagementRow
  // doesn't expose client_id yet). Empty-safe — if no partnerships / shared vendors,
  // formatCrossClientBlock returns '' and the prompt assembler filters it.
  let crossClientBlock = '';
  try {
    const sb = getServerSupabase();
    const { data: engRow } = await sb
      .from('engagements')
      .select('client_id, client:clients(id, name)')
      .eq('id', engagement.id)
      .maybeSingle();
    const client = (engRow as { client: { id: string; name: string } | null } | null)?.client;
    if (client) {
      const ccCtx = await assembleCrossClientContext(client.id, client.name);
      crossClientBlock = formatCrossClientBlock(ccCtx);
    }
  } catch (err) {
    console.error('[cross-client-context]', err);
  }

  const system = assembleEngagementSystemPrompt({
    engagement, sponsor, activePatterns, peerDecisions, chainedPatterns, maestro, personalThreads,
    maestroContextBlock,
    userContextBlock,
    signedInUserContextBlock,
    topicIntelligenceBlock,
    retrievedContextBlock: [retrievedContextBlock, crossClientBlock].filter(Boolean).join('\n\n'),
  });

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
        // Pack D Principle 1 · cognitive stages. Beacons based on data that
        // already resolved before the stream opened. Lets the UI render
        // "thinking" italic stages above the bubble until the first delta.
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'stage', label: 'Checking pattern library', detail: `${activePatterns.length} active patterns` }) + '\n'));
        if (retrievalCtx) {
          const chunkCount = retrievalCtx.clientChunks.length + retrievalCtx.industryChunks.length + retrievalCtx.topicChunks.length;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'stage', label: 'Pulling industry + client context', detail: `${chunkCount} chunks` }) + '\n'));
        }
        if (peerDecisions.length > 0) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'stage', label: 'Pulling peer decisions', detail: `${peerDecisions.length} precedents` }) + '\n'));
        }
        if (topicIntelligenceBlock && topicIntelligenceBlock.trim().length > 0) {
          const topicCount = topicIntelligenceBlock.split('TOPIC INTELLIGENCE:').length - 1;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'stage', label: 'Pulling topic playbooks', detail: `${topicCount} assigned` }) + '\n'));
        }
        if (chainedPatterns.length > 0) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'stage', label: 'Traversing chained patterns', detail: `${chainedPatterns.length} edges` }) + '\n'));
        }

        const tStreamStart = Date.now();
        let agentFullText = '';
        const gen = streamAgentTurn({ system, messages });
        for await (const delta of gen) {
          agentFullText += delta;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'));
        }
        trace.record({
          label: 'claude-opus stream',
          kind: 'stream',
          latencyMs: Date.now() - tStreamStart,
          count: agentFullText.length,
          summary: `~${Math.round(agentFullText.length / 4)} output tokens`,
        });
        // Extract <choices> block before persisting + emit to client
        const { text: cleanedAgentText, choices: turnChoices } = parseChoicesFromText(agentFullText);
        if (turnChoices.length > 0) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'choices', choices: turnChoices }) + '\n'),
          );
        }
        // Persist agent turn (text with <choices> stripped) after streaming completes
        const savedTurn = await appendTurn({
          engagementId: engagement.id,
          phase: engagement.current_phase,
          sender: 'agent',
          text: cleanedAgentText,
          retrievedRefs,
        });

        // Persist reasoning trace keyed to the agent turn. Non-blocking from
        // the client's POV — fire-and-forget so we don't block the 'done' event.
        void (async () => {
          try {
            const traceForTurn = new TurnTrace(savedTurn.id, engagement.id);
            for (const step of trace.snapshot().steps) traceForTurn.record(step);
            await traceForTurn.persist();
          } catch (err) {
            console.error('[trace-persist]', err);
          }
        })();

        // Background: Maestro profile extraction on the user's input
        if (maestro && userMessage.trim().length > 30) {
          void (async () => {
            try {
              await updateMaestroProfile({
                maestroPersonId: maestro.id,
                turnId: savedUserTurn.id,
                turnText: userMessage,
                engagementId: engagement.id,
                engagementIndustry: engagement.industry_code,
              });
            } catch (err) {
              console.error('[maestro-extractor-bg]', err);
            }
          })();
        }
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

        // Phase 1 starter artifacts should keep pace with the live diagnostic
        // thread rather than freezing at the gate-passed seed content.
        try {
          const syncedArtifacts = await syncPhaseOneArtifactsFromTurns({
            engagementId: engagement.id,
            currentPhase: engagement.current_phase,
            userTurn: savedUserTurn,
            agentTurn: savedTurn,
            decisions: parseDecisionBlocks(agentFullText),
            gateApproval: parseGateApprovalBlock(agentFullText),
          });
          if (syncedArtifacts > 0) {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'deliverables_live_synced', count: syncedArtifacts }) + '\n'),
            );
          }
        } catch (err) {
          console.error('[deliverables-live-sync]', err);
        }

        // Gate approval detection — emit event BEFORE 'done' so UI can show toast.
        // Approver fallback chain: sponsor → maestro → caller → null. Intake-
        // created engagements frequently have no sponsor linked yet (inline
        // persona creation races the gate approval), so gating processing on
        // sponsor-present silently drops the approval. Prefer the most
        // authoritative signer we can find; the gate advances either way.
        const gateApproval = parseGateApprovalBlock(agentFullText);
        if (gateApproval) {
          const approverId = sponsor?.id ?? maestro?.id ?? null;
          try {
            const updated = await recordGateApproval({
              engagementId: engagement.id,
              phase: gateApproval.phase,
              approvedByPersonId: approverId,
              approvalText: gateApproval.approval_text,
              summary: gateApproval.summary,
            });
            await logAudit({
              actorPersonId: approverId,
              action: 'engagement.gate_approved',
              targetTable: 'engagements',
              targetId: engagement.id,
              oldValue: { phase: gateApproval.phase, gate_status: 'pending' },
              newValue: { phase: updated.current_phase, gate_status: 'approved' },
              metadata: {
                approval_text: gateApproval.approval_text,
                summary: gateApproval.summary,
                approver_fallback: sponsor ? 'sponsor' : maestro ? 'maestro' : 'none',
              },
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

            // Auto-open the next phase · Nexus leads with the opener so the
            // Maestro isn't left staring at an empty console after approval.
            // The opener is persisted as a proper agent turn so the thread
            // stays coherent on reload and is emitted via SSE so the client
            // renders it immediately without polling.
            const opener = phaseOpenerFor(updated.current_phase);
            if (opener && updated.current_phase !== gateApproval.phase) {
              try {
                const openerTurn = await appendTurn({
                  engagementId: engagement.id,
                  phase: updated.current_phase,
                  sender: 'agent',
                  text: opener,
                });
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'phase_opener',
                      phase: updated.current_phase,
                      turnId: openerTurn.id,
                      text: opener,
                    }) + '\n',
                  ),
                );
              } catch (err) {
                console.error('[phase-opener]', err);
              }
            }

            // Phase 4 gate with a non-zero outcome fee → auto-invoice via Stripe
            if (
              gateApproval.phase === 4 &&
              engagement.outcome_fee_usd &&
              engagement.outcome_fee_usd > 0 &&
              isStripeConfigured()
            ) {
              void createOutcomeFeeInvoice(engagement.id, engagement.outcome_fee_usd).catch((err) =>
                console.error('[outcome-invoice]', err),
              );
            }
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
