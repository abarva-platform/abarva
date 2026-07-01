// POST /api/programs/synthesis
// Body: { programId: string }
// Response: streaming plain text — Nexus's synthesis of the program state

import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { getActiveClientRow } from "@/lib/active-client";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { summonExpertsForQuery } from "@/lib/intelligence/answer/expert-grounding";
import type { ExpertRef } from "@/lib/ava-answer/contract";
import {
  APEX_RETAIL_PROGRAM_INSTANCES,
  APX_CDP_2026_INSTANCE,
} from "@/lib/programs/program-instances";
import {
  buildProgramSynthesisContext,
  programInstanceStateHash,
} from "@/lib/reasoning/program-synthesis-context-builder";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { computeSynthesisEtag } from "@/lib/reasoning/synthesis-etag";
import { registerSynthesisCache } from "@/lib/reasoning/synthesis-cache-registry";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";
import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";
import {
  MODULE_V6_ANSWER_CONTRACT_VERSION,
  buildModuleV6PacketContract,
  moduleV6PacketPromptBlock,
  type ModuleV6PacketContract,
} from "@/lib/agent/module-v6-answer-contract";

// Simple in-memory cache: key → text response
// In production this would be Redis; for demo an in-process cache is sufficient.
const synthesisCache = new Map<string, string>();
const cacheCreatedAt = new Map<string, number>();
registerSynthesisCache("programs", synthesisCache, cacheCreatedAt);

const MOVES_V6_SYNTHESIS_HEADERS = {
  "X-AbarVa-V6-Contract": MODULE_V6_ANSWER_CONTRACT_VERSION,
  "X-AbarVa-V6-Surface": "moves",
  "X-AbarVa-Renderer-Policy": "placement-only",
} as const;

const NEXUS_SYNTHESIS_VOICE_AND_TASK = `You are Ava, AbarVa's program orchestrator on the Programs surface.

Your synthesis task: given the current state of a program (phase, gate status, evidence, linked dependencies), produce a 2–3 sentence maestro-voice recommendation.

Nexus voice register (from brand voice spec §9):
- Maestro, not validator. Nexus tells the client what to do NEXT, not what is wrong.
- Lead with the most actionable signal: what is the one move that unblocks the most?
- Reference the current phase and gate state. Name the dependency if it's blocking.
- Be specific about timing when relevant (e.g. "BAFO award expected May 30").
- Precise. No boilerplate. No filler.

Format: Plain prose, 40–60 words. No headers, no bullets, no markdown.`;

function buildNexusSynthesisPrompt(userContextBlock: string): string {
  // F0.2 + F0.3: role/voice → user context (Layer 0) → reasoning + scope
  // + integrity instructions → demo/knowledge block.
  return [
    NEXUS_SYNTHESIS_VOICE_AND_TASK,
    userContextBlock,
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    AGENT_DEMO_SYSTEM_BLOCK,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join("\n\n");
}

function buildMovesV6ExecutionSequencePacket(args: {
  tenantKey: string;
  tenantName: string;
  question: string;
  ctx: ReturnType<typeof buildProgramSynthesisContext>;
}): ModuleV6PacketContract {
  const snap = args.ctx.instanceSnapshot as {
    name?: string;
    currentPhase?: number;
    phaseLabel?: string;
    gateStatus?: string;
    evidenceCount?: number;
    openBlockers?: string[];
    linkedSourceEvents?: Array<{ name: string; type: string }>;
  };
  const missingEvidence = [
    ...(snap.openBlockers ?? []),
    ...args.ctx.missingArtifacts.map((artifact) => artifact.label),
    ...args.ctx.gatesSummary.blocked.map((gate) => gate.description),
  ];
  return buildModuleV6PacketContract({
    surface: "moves",
    packetType: "execution-sequence-packet",
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    question: args.question,
    packetSummary: [
      `Move ${snap.name ?? args.ctx.instanceId}`,
      `phase ${snap.currentPhase ?? "unknown"} ${snap.phaseLabel ?? ""}`.trim(),
      `gate status ${snap.gateStatus ?? "unknown"}`,
      `${args.ctx.gatesSummary.met} of ${args.ctx.gatesSummary.total} gate criteria met`,
      `${snap.evidenceCount ?? 0} evidence items`,
      `${args.ctx.missingArtifacts.length} missing artifacts`,
      `${snap.linkedSourceEvents?.length ?? 0} linked Source events`,
    ].join(". "),
    requiredEvidenceFamilies: [
      "move phase state",
      "gate criteria",
      "deliverables and artifacts",
      "execution blockers",
      "linked Source dependencies",
      "decision trail",
    ],
    availableEvidenceFamilies: [
      "phase and gate state",
      ...(snap.evidenceCount ? ["move evidence"] : []),
      ...(args.ctx.citations.length ? ["pattern citations"] : []),
      ...(snap.linkedSourceEvents?.length ? ["linked Source events"] : []),
      ...(args.ctx.cascadeContext.length ? ["cross-module dependencies"] : []),
    ],
    missingEvidence,
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = (await request.json()) as { programId?: string };
  const programId = body.programId ?? APX_CDP_2026_INSTANCE.id;

  // Resolve deterministic demo instances only. Do not fall back from an
  // unknown live DB UUID to APX_CDP_2026_INSTANCE; that contaminates
  // user-created programs with unrelated CDP/BAFO/Vendor C recommendations.
  const instance =
    APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === programId) ??
    (body.programId ? null : APX_CDP_2026_INSTANCE);
  if (!instance) {
    return Response.json(
      { error: "program_synthesis_not_available" },
      { status: 404 },
    );
  }

  // Build context up-front so we can attach telemetry counts to both
  // cache-hit and cache-miss responses.
  const ctx = buildProgramSynthesisContext(instance);

  // Cache check
  const stateHash = programInstanceStateHash(instance);
  const cacheKey = `${instance.id}:${stateHash}:${instance.patternVersion}:nexus:${MODULE_V6_ANSWER_CONTRACT_VERSION}`;
  const etag = computeSynthesisEtag(cacheKey);
  const ifNoneMatch = request.headers.get("if-none-match");
  const cached = synthesisCache.get(cacheKey);

  // Conditional GET: client already has this exact synthesis cached.
  if (cached && ifNoneMatch && ifNoneMatch === etag) {
    const event = recordSynthesisEvent({
      surface: "programs",
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
        ...MOVES_V6_SYNTHESIS_HEADERS,
      },
    });
  }

  if (cached) {
    const event = recordSynthesisEvent({
      surface: "programs",
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
        ...MOVES_V6_SYNTHESIS_HEADERS,
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
      ? `Open blockers: ${snap.openBlockers.join("; ")}.`
      : "No open blockers recorded.",
    snap.linkedSourceEvents.length > 0
      ? `Programme dependency: ${snap.linkedSourceEvents[0].name} — ${snap.linkedSourceEvents[0].type}.`
      : "",
    "Provide Nexus's 2–3 sentence next-move recommendation.",
  ]
    .filter(Boolean)
    .join("\n");

  // F0.2 Layer 0
  const userContextBlock = await getUserContextPromptBlock();
  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json(
      { error: "no_client", detail: "No active client for AI egress policy." },
      { status: 403 },
    );
  }

  // Shared Context Brain (flag-gated, default OFF). When on for the tenant,
  // ground this program synthesis in the Consilium expert(s) for the program
  // subject (industry-fenced via the active client key). Flag off = byte-
  // identical to the prior path (groundedUserMessage === userMessage).
  const sharedMovesOn = isFeatureEnabled(
    { clientKey: activeClient.key },
    "scb_shared_engine_moves",
  );
  const expertGrounding = sharedMovesOn
    ? summonExpertsForQuery({ query: snap.name, clientKey: activeClient.key })
    : { experts: [] as ExpertRef[], groundingBlock: "" };
  const v6PacketContract = buildMovesV6ExecutionSequencePacket({
    tenantKey: activeClient.key,
    tenantName: activeClient.name,
    question: `Synthesize Moves execution state for ${instance.name}`,
    ctx,
  });
  const groundedUserMessage = [
    expertGrounding.groundingBlock,
    moduleV6PacketPromptBlock(v6PacketContract),
    userMessage,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n\n");

  const preflight = await preflightAnthropicDirectClient({
    tenantId: activeClient.id,
    workflow: "programs-synthesis",
    model: "claude-sonnet-4-6",
    prompt: [
      buildNexusSynthesisPrompt(userContextBlock),
      groundedUserMessage,
    ].join("\n\n"),
    dataClass: "confidential",
    metadata: { programId: instance.id, surface: "programs" },
  });
  if (!preflight.ok) {
    return new Response(preflight.reason, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const client = preflight.client;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    system: buildNexusSynthesisPrompt(userContextBlock),
    messages: [{ role: "user", content: groundedUserMessage }],
  });

  const encoder = new TextEncoder();
  let accumulated = "";

  const event = recordSynthesisEvent({
    surface: "programs",
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
      ...MOVES_V6_SYNTHESIS_HEADERS,
    },
  });
}
