// POST /api/source/synthesis
// Body: { instanceId: string; patternId: string }
// Response: streaming plain text — aVa's synthesis of the instance state

import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { getActiveClientRow } from "@/lib/active-client";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { summonExpertsForQuery } from "@/lib/intelligence/answer/expert-grounding";
import type { ExpertRef } from "@/lib/ava-answer/contract";
import { SOURCE_EVENT_INSTANCES } from "@/lib/source/source-event-instances";
import { PAT_SRC_AMS_001 } from "@/lib/intelligence/source-lifecycle-patterns";
import {
  buildSourceSynthesisContext,
  instanceStateHash,
} from "@/lib/reasoning/synthesis-context-builder";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { computeSynthesisEtag } from "@/lib/reasoning/synthesis-etag";
import { registerSynthesisCache } from "@/lib/reasoning/synthesis-cache-registry";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";
import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";
import { buildAgentContextContractBlock } from "@/lib/agent/module-context-contract";
import {
  MODULE_V6_ANSWER_CONTRACT_VERSION,
  buildModuleV6PacketContract,
  moduleV6PacketPromptBlock,
  type ModuleV6PacketContract,
} from "@/lib/agent/module-v6-answer-contract";
import {
  buildV6SourceEventInstanceForTenant,
  canonicalV6DemoTenantKey,
} from "@/lib/module-v6/demo-tenant-packs";

// Simple in-memory cache: key → text response
// In production this would be Redis; for demo an in-process cache is sufficient.
const synthesisCache = new Map<string, string>();
const cacheCreatedAt = new Map<string, number>();
registerSynthesisCache("source", synthesisCache, cacheCreatedAt);

const SOURCE_V6_SYNTHESIS_HEADERS = {
  "X-AbarVa-V6-Contract": MODULE_V6_ANSWER_CONTRACT_VERSION,
  "X-AbarVa-V6-Surface": "source",
  "X-AbarVa-Renderer-Policy": "placement-only",
} as const;
const SOURCE_V6_SYNTHESIS_PROMPT_VERSION =
  "source-v6-synthesis-2026-07-01-final-gaps";

const DEFAULT_SOURCE_INSTANCE_ID = "apex-retail-ams-outsourcing-2026";
const SOURCE_INSTANCE_ALIASES: Record<string, string> = {
  "ams-vendor-consolidation-2026": DEFAULT_SOURCE_INSTANCE_ID,
  "SRC-AMS-2026": DEFAULT_SOURCE_INSTANCE_ID,
};

function canonicalTenantKey(value: string | null | undefined): string {
  return canonicalV6DemoTenantKey(value);
}

function resolveSourceInstanceId(instanceId: string): string {
  return SOURCE_INSTANCE_ALIASES[instanceId] ?? instanceId;
}

function sourceJsonError(
  body: { error: string; detail?: string },
  init: ResponseInit,
): Response {
  return Response.json(body, {
    ...init,
    headers: {
      ...SOURCE_V6_SYNTHESIS_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

const AVA_SOURCE_SYNTHESIS_VOICE_AND_TASK = `You are aVa, AbarVa's intelligence validator on the Source surface.

Your synthesis task: given the structured state of a sourcing event (current stage, gate evaluations, missing artifacts, linked program dependencies), produce a 2–3 sentence validator's assessment in aVa Source voice.

aVa Source voice register:
- Validator, not advisor. aVa states what is verified, what is asserted without evidence, and what is unknown.
- Cite specific gate criteria by name when relevant.
- Lead with the most decision-relevant signal, not background.
- Precise. No hedging language. No generic procurement boilerplate.
- Reference the linked program dependency when it directly affects urgency.

Format: Plain prose, 50–80 words. No headers, no bullets, no markdown.

Visible-output requirements:
- Start the first sentence with the exact tenant display name from the V6 packet contract.
- If commercial evidence is thin or fields are not loaded, use the exact phrase "commercial evidence is DATA-THIN" and name the missing commercial fields in business language: service scope, annual cost, renewal or contract evidence.
- If commercial facts are loaded, name at least one loaded system, vendor, service, annual cost, renewal, or linked program fact before giving the action.`;

function buildAvaSynthesisPrompt(userContextBlock: string): string {
  const sourceContractBlock = buildAgentContextContractBlock({
    agent: "ava",
    module: "source",
    sources: [
      {
        type: "vendor",
        id: "source-synthesis-event",
        name: "Source sourcing event state",
        detail:
          "Vendor diligence, RFI/RFP, BAFO, contract terms, gates, missing artifacts, savings proof, adoption telemetry, and sourcing risk controls.",
      },
    ],
  });
  // F0.2 + F0.3 composition.
  return [
    AVA_SOURCE_SYNTHESIS_VOICE_AND_TASK,
    sourceContractBlock,
    userContextBlock,
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    AGENT_DEMO_SYSTEM_BLOCK,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join("\n\n");
}

function buildSourceV6VendorCommercialPacket(args: {
  tenantKey: string;
  tenantName: string;
  question: string;
  ctx: ReturnType<typeof buildSourceSynthesisContext>;
}): ModuleV6PacketContract {
  const snap = args.ctx.instanceSnapshot as {
    name?: string;
    vendorCount?: number;
    activeVendors?: string[];
    riskFlags?: string[];
    linkedPrograms?: Array<{ name: string; linkType: string }>;
  };
  const missingEvidence = [
    ...args.ctx.missingArtifacts.map((artifact) => artifact.label),
    ...args.ctx.gatesSummary.blocked.map((gate) => gate.description),
  ];
  return buildModuleV6PacketContract({
    surface: "source",
    packetType: "vendor-commercial-packet",
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    question: args.question,
    packetSummary: [
      `Sourcing event ${snap.name ?? args.ctx.instanceId}`,
      `${snap.vendorCount ?? 0} vendors`,
      `${snap.activeVendors?.length ?? 0} active vendors`,
      `${args.ctx.gatesSummary.met} of ${args.ctx.gatesSummary.total} gate criteria met`,
      `${args.ctx.missingArtifacts.length} missing artifacts`,
      `${snap.riskFlags?.length ?? 0} open risk flags`,
    ].join(". "),
    requiredEvidenceFamilies: [
      "sourcing event state",
      "vendor responses",
      "commercial gates",
      "pricing and BAFO evidence",
      "contract and renewal evidence",
      "linked program dependencies",
    ],
    availableEvidenceFamilies: [
      "event stage and gate state",
      ...(snap.activeVendors?.length ? ["active vendor list"] : []),
      ...(args.ctx.citations.length ? ["pattern citations"] : []),
      ...(args.ctx.cascadeContext.length
        ? ["linked program dependencies"]
        : []),
      ...(snap.riskFlags?.length ? ["open risk flags"] : []),
    ],
    missingEvidence: [
      ...missingEvidence,
      "service scope, annual cost, renewal or contract evidence must be explicit before award readiness is claimed",
    ],
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = (await request.json()) as {
    instanceId?: string;
    patternId?: string;
  };

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return sourceJsonError(
      { error: "no_client", detail: "No active client for AI egress policy." },
      { status: 403 },
    );
  }

  const activeTenantKey = canonicalTenantKey(activeClient.key);
  const instanceId = body.instanceId
    ? resolveSourceInstanceId(body.instanceId)
    : activeTenantKey === "apex-retail"
      ? DEFAULT_SOURCE_INSTANCE_ID
      : null;
  const v6Instance =
    activeTenantKey === "apex-retail"
      ? null
      : buildV6SourceEventInstanceForTenant(activeTenantKey, instanceId);

  if (!instanceId && !v6Instance) {
    return sourceJsonError(
      {
        error: "source_synthesis_not_available",
        detail: "No V6 Source event is loaded for the active tenant.",
      },
      { status: 404 },
    );
  }

  const instance =
    v6Instance ?? SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);

  if (!instance) {
    return sourceJsonError(
      { error: "instance not found" },
      {
        status: 404,
      },
    );
  }

  const instanceTenantKey = canonicalTenantKey(
    instance.tenantSlug ?? instance.tenantId,
  );
  if (instanceTenantKey !== activeTenantKey) {
    return sourceJsonError(
      {
        error: "wrong_client",
        detail: "Requested Source event does not belong to the active tenant.",
      },
      { status: 403 },
    );
  }

  // Only AMS-001 pattern supported in REASON-14; extend as more patterns author
  const pattern = PAT_SRC_AMS_001;

  // Build context up-front so we can attach telemetry counts to both
  // cache-hit and cache-miss responses.
  const ctx = buildSourceSynthesisContext(instance, pattern);

  // Cache check
  const stateHash = instanceStateHash(instance);
  const cacheKey = `${instance.id}:${stateHash}:${pattern.version}:ava:${MODULE_V6_ANSWER_CONTRACT_VERSION}:${SOURCE_V6_SYNTHESIS_PROMPT_VERSION}`;
  const etag = computeSynthesisEtag(cacheKey);
  const ifNoneMatch = request.headers.get("if-none-match");
  const cached = synthesisCache.get(cacheKey);

  // Conditional GET: client already has this exact synthesis cached.
  // Short-circuit with 304 — no body, but still emit ETag + X-Cache for
  // observability parity with the 200 path.
  if (cached && ifNoneMatch && ifNoneMatch === etag) {
    const event = recordSynthesisEvent({
      surface: "source",
      instanceId: instance.id,
      patternId: pattern.patternId,
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
        ...SOURCE_V6_SYNTHESIS_HEADERS,
      },
    });
  }

  if (cached) {
    const event = recordSynthesisEvent({
      surface: "source",
      instanceId: instance.id,
      patternId: pattern.patternId,
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
        ...SOURCE_V6_SYNTHESIS_HEADERS,
      },
    });
  }

  // Build the structured prompt from synthesis context
  const userMessage = buildSynthesisUserMessage(ctx);

  // F0.2 Layer 0
  const userContextBlock = await getUserContextPromptBlock();
  const systemPrompt = buildAvaSynthesisPrompt(userContextBlock);

  // Shared Context Brain (flag-gated, default OFF). When on for the tenant,
  // ground this sourcing synthesis in the Consilium expert(s) for the event
  // (e.g. AMS vendor consolidation → IT Outsourcing & Managed Services expert).
  // Flag off = byte-identical to the prior path (groundedUserMessage === userMessage).
  const sharedSourceOn = isFeatureEnabled(
    { clientKey: activeClient.key },
    "scb_shared_engine_source",
  );
  const expertGrounding = sharedSourceOn
    ? summonExpertsForQuery({ query: instance.name })
    : { experts: [] as ExpertRef[], groundingBlock: "" };
  const v6PacketContract = buildSourceV6VendorCommercialPacket({
    tenantKey: activeClient.key,
    tenantName: activeClient.name,
    question: `Synthesize Source state for ${instance.name}`,
    ctx,
  });
  const v6PacketBlock = moduleV6PacketPromptBlock(v6PacketContract);
  const groundedUserMessage = [
    expertGrounding.groundingBlock,
    v6PacketBlock,
    userMessage,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n\n");

  const preflight = await preflightAnthropicDirectClient({
    tenantId: activeClient.id,
    workflow: "source-synthesis",
    model: "claude-sonnet-4-6",
    prompt: [systemPrompt, groundedUserMessage].join("\n\n"),
    dataClass: "confidential",
    metadata: { sourceInstanceId: instance.id, surface: "source" },
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
    system: systemPrompt,
    messages: [{ role: "user", content: groundedUserMessage }],
  });

  const encoder = new TextEncoder();
  let accumulated = "";

  const event = recordSynthesisEvent({
    surface: "source",
    instanceId: instance.id,
    patternId: pattern.patternId,
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
      ...SOURCE_V6_SYNTHESIS_HEADERS,
    },
  });
}

function buildSynthesisUserMessage(
  ctx: ReturnType<typeof buildSourceSynthesisContext>,
): string {
  const lines: string[] = [
    `Synthesize the current state of sourcing event "${ctx.instanceSnapshot["name"]}" at stage ${ctx.currentStage}.`,
    "",
    `Gate status: ${ctx.gatesSummary.met} of ${ctx.gatesSummary.total} criteria met.`,
  ];

  if (ctx.gatesSummary.blocked.length > 0) {
    lines.push(
      `Hard gate blockers: ${ctx.gatesSummary.blocked.map((b) => b.description).join("; ")}.`,
    );
  }

  if (ctx.missingArtifacts.length > 0) {
    const hardMissing = ctx.missingArtifacts.filter(
      (a) => a.gateType === "hard",
    );
    if (hardMissing.length > 0) {
      lines.push(
        `Missing required artifacts: ${hardMissing.map((a) => a.label).join(", ")}.`,
      );
    }
  }

  const riskFlags = ctx.instanceSnapshot["riskFlags"] as string[];
  if (riskFlags?.length > 0) {
    lines.push(`Open risk flags: ${riskFlags.join("; ")}.`);
  }

  const activeVendors = ctx.instanceSnapshot["activeVendors"] as string[];
  if (activeVendors?.length > 0) {
    lines.push(`Active vendors in packet: ${activeVendors.join("; ")}.`);
  }

  const vendorFacts = ctx.instanceSnapshot["vendorFacts"] as
    | Array<{
        name?: string;
        status?: string;
        differentiators?: string[];
        pricingBand?: string;
        openRiskFlags?: string[];
      }>
    | undefined;
  if (vendorFacts?.length) {
    lines.push(
      `Vendor commercial facts: ${vendorFacts
        .slice(0, 4)
        .map((vendor) =>
          [
            vendor.name,
            vendor.status ? `status ${vendor.status}` : "",
            ...(vendor.differentiators ?? []).slice(0, 3),
            vendor.pricingBand ? `pricing band ${vendor.pricingBand}` : "",
            ...(vendor.openRiskFlags ?? [])
              .slice(0, 2)
              .map((flag) => `risk ${flag}`),
          ]
            .filter(Boolean)
            .join(" | "),
        )
        .join("; ")}.`,
    );
  }

  if (ctx.cascadeContext.length > 0) {
    const blocking = ctx.cascadeContext.find((c) => c.severity === "blocking");
    if (blocking) {
      lines.push(`Programme dependency: ${blocking.impact}.`);
    }
  }

  lines.push(
    "",
    "Provide aVa's 2–3 sentence validator assessment of this state. Use the V6 packet contract's exact tenantName in the opening sentence, and make the commercial evidence boundary visible.",
    'If fields are missing, include the exact phrase "commercial evidence is DATA-THIN".',
  );

  return lines.join("\n");
}
