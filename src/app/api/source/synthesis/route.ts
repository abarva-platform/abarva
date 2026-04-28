// POST /api/source/synthesis
// Body: { instanceId: string; patternId: string }
// Response: streaming plain text — Sentinel's synthesis of the instance state

import Anthropic from "@anthropic-ai/sdk";
import { SOURCE_EVENT_INSTANCES } from "@/lib/source/source-event-instances";
import { PAT_SRC_AMS_001 } from "@/lib/intelligence/source-lifecycle-patterns";
import { buildSourceSynthesisContext, instanceStateHash } from "@/lib/reasoning/synthesis-context-builder";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";

// Simple in-memory cache: key → text response
// In production this would be Redis; for demo an in-process cache is sufficient.
const synthesisCache = new Map<string, string>();

const SENTINEL_SYNTHESIS_PROMPT = `You are Sentinel, AbarVa's intelligence validator on the Source surface.

Your synthesis task: given the structured state of a sourcing event (current stage, gate evaluations, missing artifacts, linked program dependencies), produce a 2–3 sentence validator's assessment in Sentinel voice.

Sentinel voice register (from brand voice spec §9):
- Validator, not advisor. Sentinel states what is verified, what is asserted without evidence, and what is unknown.
- Cite specific gate criteria by name when relevant.
- Lead with the most decision-relevant signal, not background.
- Precise. No hedging language. No generic procurement boilerplate.
- Reference the linked program dependency when it directly affects urgency.

Format: Plain prose, 40–60 words. No headers, no bullets, no markdown.

${AGENT_DEMO_SYSTEM_BLOCK}`;

export async function POST(request: Request) {
  const body = (await request.json()) as { instanceId?: string; patternId?: string };
  const instanceId = body.instanceId ?? 'ams-vendor-consolidation-2026';

  // Resolve instance (currently only AMS is typed; fallback gracefully)
  const instance = SOURCE_EVENT_INSTANCES.find(i => i.id === instanceId)
    ?? SOURCE_EVENT_INSTANCES[0];

  if (!instance) {
    return new Response(JSON.stringify({ error: "instance not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only AMS-001 pattern supported in REASON-14; extend as more patterns author
  const pattern = PAT_SRC_AMS_001;

  // Cache check
  const stateHash = instanceStateHash(instance);
  const cacheKey = `${instance.id}:${stateHash}:${pattern.version}:sentinel`;
  const cached = synthesisCache.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Cache": "HIT" },
    });
  }

  const ctx = buildSourceSynthesisContext(instance, pattern);

  // Build the structured prompt from synthesis context
  const userMessage = buildSynthesisUserMessage(ctx);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    system: SENTINEL_SYNTHESIS_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  let accumulated = '';

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          accumulated += chunk.delta.text;
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      // Cache the full response after streaming completes
      if (accumulated) {
        synthesisCache.set(cacheKey, accumulated);
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Cache": "MISS",
    },
  });
}

function buildSynthesisUserMessage(ctx: ReturnType<typeof buildSourceSynthesisContext>): string {
  const lines: string[] = [
    `Synthesize the current state of sourcing event "${ctx.instanceSnapshot['name']}" at stage ${ctx.currentStage}.`,
    '',
    `Gate status: ${ctx.gatesSummary.met} of ${ctx.gatesSummary.total} criteria met.`,
  ];

  if (ctx.gatesSummary.blocked.length > 0) {
    lines.push(`Hard gate blockers: ${ctx.gatesSummary.blocked.map(b => b.description).join('; ')}.`);
  }

  if (ctx.missingArtifacts.length > 0) {
    const hardMissing = ctx.missingArtifacts.filter(a => a.gateType === 'hard');
    if (hardMissing.length > 0) {
      lines.push(`Missing required artifacts: ${hardMissing.map(a => a.label).join(', ')}.`);
    }
  }

  const riskFlags = ctx.instanceSnapshot['riskFlags'] as string[];
  if (riskFlags?.length > 0) {
    lines.push(`Open risk flags: ${riskFlags.join('; ')}.`);
  }

  if (ctx.cascadeContext.length > 0) {
    const blocking = ctx.cascadeContext.find(c => c.severity === 'blocking');
    if (blocking) {
      lines.push(`Programme dependency: ${blocking.impact}.`);
    }
  }

  lines.push('', 'Provide Sentinel\'s 2–3 sentence validator assessment of this state.');

  return lines.join('\n');
}
