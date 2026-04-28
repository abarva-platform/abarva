// /api/chat/agent · Universal agent chat endpoint
//
// Shell Layout Spec v2 §6.3 — this route is the only path to an agent response.
// AGENT_DEMO_SYSTEM_BLOCK is injected on EVERY path so the agent always knows:
//   - the AbarVa platform and 7-phase model
//   - all 6 Apex Retail programs and their current phases
//   - active patterns, Tower pressures, AMS source event
//
// Wave SHELL-V2-1 adds: tenantName, agentName, stage, surfaceContext fields.
// The "Atlas doesn't know Apex Retail" bug is architecturally impossible
// because AGENT_DEMO_SYSTEM_BLOCK is now unconditional.

import Anthropic from "@anthropic-ai/sdk";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { getEngagementWithPhaseData } from "@/lib/programs/db-phase-queries";
import { PHASE_LABEL_MAP } from "@/lib/programs/programs-fixture";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";
import { getStagePlaybook } from "@/lib/agent/stage-playbooks";
import { getCategoryPlaybook } from "@/lib/agent/service-category-playbooks";

// ── Agent voice map ────────────────────────────────────────────────────────────

const AGENT_VOICE: Record<string, string> = {
  Nexus:    "You are Nexus, AbarVa's program orchestrator. You guide program phases, track gates, surface blockers, and drive deliverable quality.",
  Sentinel: "You are Sentinel, AbarVa's intelligence librarian. You validate AI patterns, assess source events, and curate the knowledge library.",
  Atlas:    "You are Atlas, AbarVa's portfolio CIO-of-staff. You monitor pressures, triage signals, and give executive-level portfolio clarity.",
  Steward:  "You are Steward, AbarVa's governance and setup agent. You manage connectors, users, and policy compliance.",
};

const DEFAULT_VOICE = "You are an AbarVa AI advisor. Be direct, specific, and actionable.";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    // Legacy compat
    context?: string;
    // Wave SHELL-V2-1 fields (preferred)
    tenantName?: string;
    agentName?: string;
    surface?: string;
    stage?: string;
    surfaceContext?: Record<string, unknown>;
    programId?: string;
    /** Prior conversation turns for multi-turn context. Capped at 10. */
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tenantName          = body.tenantName ?? "Apex Retail Group";
  const agentName           = body.agentName  ?? "Atlas";
  const surface             = body.surface    ?? "";
  const stage               = body.stage      ?? null;
  const programId           = body.programId;
  const conversationHistory = body.conversationHistory ?? [];

  // ── Build system prompt ─────────────────────────────────────────────────────
  //
  // Three layers:
  //   1. Agent voice (who the LLM is)
  //   2. Page context (tenant, surface, stage, program data if available)
  //   3. AGENT_DEMO_SYSTEM_BLOCK (unconditional — platform + Apex demo context)

  const voiceLine = AGENT_VOICE[agentName] ?? DEFAULT_VOICE;

  const contextLines: string[] = [
    `Active tenant: ${tenantName} (locked — this is the user's client account).`,
    surface ? `Current surface: ${surface}.` : "",
    stage   ? `Workflow stage: ${stage}.` : "",
  ].filter(Boolean);

  // If we have a programId, enrich with live DB data
  if (programId) {
    try {
      await requireTenancy();
      const programData = await getEngagementWithPhaseData(programId);
      if (programData) {
        const { engagement, evidence, gateApprovals } = programData;
        const phase = engagement.current_phase ?? 0;
        const phaseLabel = PHASE_LABEL_MAP[phase as keyof typeof PHASE_LABEL_MAP] ?? "Unknown";
        const latestGate =
          gateApprovals.length > 0
            ? `${gateApprovals[0].action} by ${gateApprovals[0].actor_name}`
            : "pending";

        contextLines.push(
          `Active program: ${engagement.name} (${programId})`,
          `Current phase: P${phase} ${phaseLabel}`,
          `Evidence items: ${evidence.length} uploaded`,
          `Gate approvals: ${latestGate}`,
        );
      }
    } catch {
      // Auth failed or DB error — continue with demo context
    }
  }

  // If we have source event context, enrich with live event data
  const sc = (body.surfaceContext ?? {}) as Record<string, unknown>;
  if (sc.eventName) {
    const eventContextLines = [
      `Active source event: ${sc.eventName} (${sc.eventCode ?? ''})`,
      sc.currentStage ? `Event current stage: ${sc.currentStage}` : '',
      sc.blocker ? `Active blocker on this event: ${sc.blocker}` : 'No active blockers recorded on this event.',
      sc.valueAtStakeUsd ? `Contract value at stake: $${(Number(sc.valueAtStakeUsd) / 1_000_000).toFixed(1)}M` : '',
    ].filter(Boolean);
    contextLines.push(...eventContextLines);
  }

  // Cross-surface: inject linked program state when on Source surface
  const linkedProgramId = (body.surfaceContext?.linkedProgramCode as string) ?? null;
  if (surface === 'source' && linkedProgramId && linkedProgramId !== programId) {
    try {
      await requireTenancy();
      const linkedData = await getEngagementWithPhaseData(linkedProgramId);
      if (linkedData) {
        const { engagement: linkedEng, evidence: linkedEv, gateApprovals: linkedGates } = linkedData;
        const linkedPhase = linkedEng.current_phase ?? 0;
        const linkedPhaseLabel = PHASE_LABEL_MAP[linkedPhase as keyof typeof PHASE_LABEL_MAP] ?? 'Unknown';
        const linkedLatestGate = linkedGates.length > 0
          ? `${linkedGates[0].action} by ${linkedGates[0].actor_name}`
          : 'pending';
        contextLines.push(
          `Linked program (cross-surface): ${linkedEng.name} (${linkedProgramId})`,
          `  Current phase: P${linkedPhase} ${linkedPhaseLabel}`,
          `  Evidence items: ${linkedEv.length}`,
          `  Latest gate action: ${linkedLatestGate}`,
          `  Note: this source event outcome directly affects the linked program gate criteria.`,
        );
      }
    } catch {
      // Auth or DB error — proceed without linked program enrichment
    }
  }

  const categoryPlaybook = getCategoryPlaybook(
    (body.surfaceContext?.eventName as string) ?? '',
    (body.surfaceContext?.eventType as string) ?? undefined,
  );

  const stagePlaybook = getStagePlaybook(stage);


  const systemPrompt = [
    voiceLine,
    "",
    "Page context:",
    ...contextLines,
    categoryPlaybook ? `\nService category context:\n${categoryPlaybook}` : "",
    stagePlaybook ? `\nCurrent stage guidance:\n${stagePlaybook}` : "",
    "",
    "Response guidelines:",
    "- Keep responses under 200 words. Be direct, specific, actionable.",
    "- Reference tenant and program names from context.",
    "- Never say you don't have specific information about the tenant — use the demo context below.",
    AGENT_DEMO_SYSTEM_BLOCK,
  ].join("\n");

  // ── Stream response ─────────────────────────────────────────────────────────

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      ...conversationHistory.slice(-10),
      { role: "user", content: message },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
