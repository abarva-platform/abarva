import Anthropic from "@anthropic-ai/sdk";
import { requireTenancy } from "@/app/api/v1/programs/_auth";
import { getEngagementWithPhaseData } from "@/lib/programs/db-phase-queries";
import { PHASE_LABEL_MAP } from "@/lib/programs/programs-fixture";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    context?: string;
    programId?: string;
    surface?: string;
  };

  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const context = body.context ?? "";
  const programId = body.programId;
  const surface = body.surface ?? "";

  let systemPrompt: string;

  if (programId) {
    // Try to fetch real program context from DB
    let programData: Awaited<ReturnType<typeof getEngagementWithPhaseData>> =
      null;
    try {
      await requireTenancy();
      programData = await getEngagementWithPhaseData(programId);
    } catch {
      // Auth failed or DB error — fall through to context string fallback
    }

    if (programData) {
      const { engagement, evidence, gateApprovals } = programData;
      const phase = engagement.current_phase ?? 0;
      const phaseLabel = PHASE_LABEL_MAP[phase as keyof typeof PHASE_LABEL_MAP] ?? "Unknown";
      const latestGate =
        gateApprovals.length > 0
          ? `${gateApprovals[0].action} by ${gateApprovals[0].actor_name}`
          : "pending";

      systemPrompt = [
        "You are AbarVa, an AI enterprise transformation advisor.",
        `Active program: ${engagement.name} (${programId})`,
        `Current phase: P${phase} ${phaseLabel}`,
        `Evidence items: ${evidence.length} uploaded`,
        `Gate approvals: ${latestGate}`,
        surface ? `Surface: ${surface}` : "",
        "Keep responses under 200 words. Be direct, specific, actionable. Reference the program context when relevant.",
      ]
        .filter(Boolean)
        .join("\n");
    } else {
      // DB unavailable — fall back to context string
      systemPrompt = `You are AbarVa, an AI enterprise transformation advisor embedded in the Nexus platform. ${context ? `Current context: ${context}` : "Provide helpful, concise responses about AI program management."} Keep responses under 200 words. Be direct, specific, and actionable.`;
    }
  } else {
    // No programId — use context string as before
    systemPrompt = `You are AbarVa, an AI enterprise transformation advisor embedded in the Nexus platform. ${context ? `Current context: ${context}` : "Provide helpful, concise responses about AI program management."} Keep responses under 200 words. Be direct, specific, and actionable.`;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: message,
      },
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
