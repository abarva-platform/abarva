// POST /api/programs/synthesis
// Body: { programId: string }
// Response: streaming plain text — Nexus's synthesis of the program state

import Anthropic from "@anthropic-ai/sdk";
import { APEX_RETAIL_PROGRAM_INSTANCES, APX_CDP_2026_INSTANCE } from "@/lib/programs/program-instances";
import {
  buildProgramSynthesisContext,
  programInstanceStateHash,
} from "@/lib/reasoning/program-synthesis-context-builder";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { computeSynthesisEtag } from "@/lib/reasoning/synthesis-etag";
import { registerSynthesisCache } from "@/lib/reasoning/synthesis-cache-registry";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";

// Simple in-memory cache: key → text response
// In production this would be Redis; for demo an in-process cache is sufficient.
const synthesisCache = new Map<string, string>();
const cacheCreatedAt = new Map<string, number>();
registerSynthesisCache('programs', synthesisCache, cacheCreatedAt);

const NEXUS_SYNTHESIS_PROMPT = `You are Nexus, AbarVa's program orchestrator on the Programs surface.

Your synthesis task: given the current state of a program (phase, gate status, evidence, linked dependencies), produce a 2–3 sentence maestro-voice recommendation.

Nexus voice register (from brand voice spec §9):
- Maestro, not validator. Nexus tells the client what to do NEXT, not what is wrong.
- Lead with the most actionable signal: what is the one move that unblocks the most?
- Reference the current phase and gate state. Name the dependency if it's blocking.
- Be specific about timing when relevant (e.g. "BAFO award expected May 30").
- Precise. No boilerplate. No filler.

Format: Plain prose, 40–60 words. No headers, no bullets, no markdown.

${AGENT_DEMO_SYSTEM_BLOCK}`;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = (await request.json()) as { programId?: string };
  const programId = body.programId ?? APX_CDP_2026_INSTANCE.id;

  // Resolve instance from APEX_RETAIL_PROGRAM_INSTANCES; fallback to APX_CDP_2026_INSTANCE
  const instance =
    APEX_RETAIL_PROGRAM_INSTANCES.find(i => i.id === programId) ??
    APX_CDP_2026_INSTANCE;

  // Build context up-front so we can attach telemetry counts to both
  // cache-hit and cache-miss responses.
  const ctx = buildProgramSynthesisContext(instance);

  // Cache check
  const stateHash = programInstanceStateHash(instance);
  const cacheKey = `${instance.id}:${stateHash}:${instance.patternVersion}:nexus`;
  const etag = computeSynthesisEtag(cacheKey);
  const ifNoneMatch = request.headers.get('if-none-match');
  const cached = synthesisCache.get(cacheKey);

  // Conditional GET: client already has this exact synthesis cached.
  if (cached && ifNoneMatch && ifNoneMatch === etag) {
    const event = recordSynthesisEvent({
      surface: 'programs',
      instanceId: instance.id,
      patternId: instance.patternId,
      cacheHit: true,
      latencyMs: Date.now() - startedAt,
      citationCount: ctx.citations.length,
      contradictionCount: ctx.activeContradictions.length,
      failureModeCount: ctx.failureModes.length,
      gateCount: ctx.gatesSummary.total,
    });
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "X-Cache": "HIT",
        "X-Synthesis-Event-Id": event.id,
      },
    });
  }

  if (cached) {
    const event = recordSynthesisEvent({
      surface: 'programs',
      instanceId: instance.id,
      patternId: instance.patternId,
      cacheHit: true,
      latencyMs: Date.now() - startedAt,
      citationCount: ctx.citations.length,
      contradictionCount: ctx.activeContradictions.length,
      failureModeCount: ctx.failureModes.length,
      gateCount: ctx.gatesSummary.total,
    });
    return new Response(cached, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ETag: etag,
        "X-Cache": "HIT",
        "X-Synthesis-Event-Id": event.id,
      },
    });
  }

  const snap = ctx.instanceSnapshot as {
    name: string;
    currentPhase: number;
    phaseLabel: string;
    gateStatus: string;
    evidenceCount: number;
    openBlockers: string[];
    linkedSourceEvents: Array<{ id: string; name: string; type: string }>;
  };

  // Build the structured user message from synthesis context
  const userMessage = [
    `Synthesize the next-move recommendation for program "${snap.name}" at phase ${snap.currentPhase} ${snap.phaseLabel}.`,
    `Gate status: ${snap.gateStatus}.`,
    `Evidence items on record: ${snap.evidenceCount}.`,
    snap.openBlockers.length > 0
      ? `Open blockers: ${snap.openBlockers.join('; ')}.`
      : 'No open blockers recorded.',
    snap.linkedSourceEvents.length > 0
      ? `Programme dependency: ${snap.linkedSourceEvents[0].name} — ${snap.linkedSourceEvents[0].type}.`
      : '',
    'Provide Nexus\'s 2–3 sentence next-move recommendation.',
  ]
    .filter(Boolean)
    .join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    system: NEXUS_SYNTHESIS_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  let accumulated = '';

  const event = recordSynthesisEvent({
    surface: 'programs',
    instanceId: instance.id,
    patternId: instance.patternId,
    cacheHit: false,
    latencyMs: Date.now() - startedAt,
    citationCount: ctx.citations.length,
    contradictionCount: ctx.activeContradictions.length,
    failureModeCount: ctx.failureModes.length,
    gateCount: ctx.gatesSummary.total,
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          accumulated += chunk.delta.text;
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      // Cache the full response after streaming completes
      if (accumulated) {
        synthesisCache.set(cacheKey, accumulated);
        cacheCreatedAt.set(cacheKey, Date.now());
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      ETag: etag,
      "X-Cache": "MISS",
      "X-Synthesis-Event-Id": event.id,
    },
  });
}
