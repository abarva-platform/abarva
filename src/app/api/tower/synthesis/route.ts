// POST /api/tower/synthesis
// Body: (none — Tower context is the whole portfolio)
// Response: streaming plain text — Atlas's portfolio-level synthesis quote

import Anthropic from "@anthropic-ai/sdk";
import { APEX_RETAIL_PROGRAM_INSTANCES } from "@/lib/programs/program-instances";
import { SOURCE_EVENT_INSTANCES } from "@/lib/source/source-event-instances";
import {
  buildTowerSynthesisContext,
  towerStateHash,
} from "@/lib/reasoning/tower-synthesis-context-builder";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { computeSynthesisEtag } from "@/lib/reasoning/synthesis-etag";
import { registerSynthesisCache } from "@/lib/reasoning/synthesis-cache-registry";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";

// Simple in-memory cache: key → text response
// In production this would be Redis; for demo an in-process cache is sufficient.
const synthesisCache = new Map<string, string>();
const cacheCreatedAt = new Map<string, number>();
registerSynthesisCache('tower', synthesisCache, cacheCreatedAt);

const ATLAS_SYNTHESIS_PROMPT = `You are Atlas, AbarVa's portfolio CIO-of-staff agent on the Tower surface.

Your synthesis task: given the current state of an entire portfolio (every active program plus every active source event), produce a portfolio-level read that names the single highest-leverage move.

Atlas voice register (from brand voice spec §9):
- Cross-program synthesizer. Atlas reasons about the portfolio as a single system.
- Lead with the dependency chain: which one move, if it lands, propagates the most downstream value?
- Always reference at least one program by its ID (e.g. APX-CDP-2026) and one source event by its ID (e.g. SRC-AMS-2026) — Atlas's authority comes from naming specific instances.
- Quantify portfolio scope when relevant (e.g. "across 4 programs and 1 active sourcing event").
- Precise, executive register. No filler. No hedging.

Format: Plain prose, 100–150 words. No headers, no bullets, no markdown. Single paragraph.

${AGENT_DEMO_SYSTEM_BLOCK}`;

interface ProgramSummary {
  id: string;
  name: string;
  phase: number;
  phaseLabel: string;
  gateStatus: string;
  openBlockerCount: number;
  linkedSourceEventIds: string[];
}

interface SourceSummary {
  id: string;
  name: string;
  stage: string;
  vendorCount: number;
  activeVendors: string[];
  openBlockerCount: number;
  linkedProgramIds: string[];
}

export async function POST(request: Request) {
  // Tower has no body parameters — context is the whole portfolio. We still
  // read the request to honour the If-None-Match header for ETag short-circuit.
  const startedAt = Date.now();
  const programInstances = APEX_RETAIL_PROGRAM_INSTANCES;
  const sourceEventInstances = SOURCE_EVENT_INSTANCES;

  // Build context up-front so we can attach telemetry counts to both
  // cache-hit and cache-miss responses.
  const ctx = buildTowerSynthesisContext(programInstances, sourceEventInstances);

  // Cache check
  const stateHash = towerStateHash(programInstances, sourceEventInstances);
  const cacheKey = `tower:${stateHash}:atlas:v1`;
  const etag = computeSynthesisEtag(cacheKey);
  const ifNoneMatch = request.headers.get('if-none-match');
  const cached = synthesisCache.get(cacheKey);

  // Conditional GET: client already has this exact synthesis cached.
  if (cached && ifNoneMatch && ifNoneMatch === etag) {
    const event = recordSynthesisEvent({
      surface: 'tower',
      instanceId: 'tower',
      patternId: null,
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
      surface: 'tower',
      instanceId: 'tower',
      patternId: null,
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
    programCount: number;
    sourceEventCount: number;
    pendingGateCount: number;
    activeBlockerCount: number;
    programs: ProgramSummary[];
    sourceEvents: SourceSummary[];
  };

  // Build the structured user message from the portfolio context.
  const programLines = snap.programs
    .map(
      p =>
        `  - ${p.id} "${p.name}" · phase P${p.phase} ${p.phaseLabel} · gate ${p.gateStatus}` +
        (p.openBlockerCount > 0 ? ` · ${p.openBlockerCount} open blocker(s)` : '') +
        (p.linkedSourceEventIds.length > 0
          ? ` · linked source: ${p.linkedSourceEventIds.join(', ')}`
          : ''),
    )
    .join('\n');

  const sourceLines = snap.sourceEvents
    .map(
      s =>
        `  - ${s.id} "${s.name}" · stage ${s.stage} · ${s.vendorCount} vendor(s)` +
        (s.activeVendors.length > 0 ? ` · active: ${s.activeVendors.join(', ')}` : '') +
        (s.openBlockerCount > 0 ? ` · ${s.openBlockerCount} open blocker(s)` : '') +
        (s.linkedProgramIds.length > 0
          ? ` · linked programs: ${s.linkedProgramIds.join(', ')}`
          : ''),
    )
    .join('\n');

  const userMessage = [
    `Portfolio snapshot for Apex Retail Group:`,
    `${snap.programCount} active program(s), ${snap.sourceEventCount} active source event(s).`,
    `${snap.pendingGateCount} pending gate(s) and ${snap.activeBlockerCount} active blocker(s) across the portfolio.`,
    '',
    `Active programs:`,
    programLines,
    '',
    `Active source events:`,
    sourceLines,
    '',
    `Synthesize Atlas's 100–150 word portfolio-level read. Name at least one program by ID and one source event by ID. Lead with the highest-leverage dependency chain.`,
  ].join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 350,
    system: ATLAS_SYNTHESIS_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  let accumulated = '';

  const event = recordSynthesisEvent({
    surface: 'tower',
    instanceId: 'tower',
    patternId: null,
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
