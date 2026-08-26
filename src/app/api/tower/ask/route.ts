// POST /api/tower/ask
// Body: { question: string }
// Response: streaming plain text — Ava's Tower answer to a free-text question.
//
// Server-side Tower answer endpoint. Tower's visible route uses the shared
// React aVa/Atlas AgentDock shell; this endpoint remains the lightweight
// streaming seam for Tower questions. It reads the current Tower semantic
// layer (`tower.*`) and does not fall back to retired V6/V7/CIO Tower layers.

import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalCioTowerTenantKey, canonicalCioTowerTenantDisplayName } from "@/lib/tower/metric-packet";
import { answerCurrentTowerQuestion } from "@/lib/tower/current-layer-answer";
import { demoSafeClientText } from "@/lib/client-config";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";
import { composeAllAgentDoctrineBlock } from "@/lib/agent/all-agent-doctrine";
import { CONSULTANT_ANSWER_SHAPE_CONTRACT } from "@/lib/intelligence/ask/response-policy";

// Ava's Tower voice mirrors the synthesis route (which already says Ava on the
// Tower surface). The ask path answers a single user question rather than
// synthesizing the whole portfolio, so the task line is question-shaped.
const AVA_TOWER_ASK_VOICE_AND_TASK = `You are Ava, AbarVa's portfolio CIO-of-staff agent on the Tower surface.

Your task: answer the user's question about the IT portfolio — budget, spend, vendors/renewals, AI initiatives, and which programs to scale, hold, or stop — as a portfolio-level CIO-of-staff.

Ava voice register (from brand voice spec §9):
- Cross-program synthesizer. Ava reasons about the portfolio as a single system.
- Lead with the decision implication, then the evidence.
- Reference specific programs, vendors, or initiatives by name/ID when the answer turns on them — authority comes from naming specific instances.
- Quantify portfolio scope when relevant.
- Precise, executive register. No filler. No hedging.
- Do NOT fabricate IDs, vendors, or figures. If the portfolio context for a claim is not provided, say so plainly rather than inventing it.

Format: Use the shared agent output contract. Prefer a direct lead line, then 2-4 short evidence bullets. No raw markdown emphasis.

${CONSULTANT_ANSWER_SHAPE_CONTRACT}`;

export function buildAvaTowerAskPrompt(userContextBlock: string): string {
  // Mirrors the synthesis prompt composition (voice → doctrine → user context →
  // four-layer reasoning → demo block), minus the synthesis-only access/output
  // policy blocks which the ask path does not gate financial values on yet.
  return [
    AVA_TOWER_ASK_VOICE_AND_TASK,
    composeAllAgentDoctrineBlock({ agentName: "Atlas", surface: "/tower" }),
    userContextBlock,
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    AGENT_DEMO_SYSTEM_BLOCK,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join("\n\n");
}

export async function POST(request: Request) {
  // Auth: same tenancy gate the synthesis route uses.
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const body = (await request.json().catch(() => ({}))) as {
    question?: unknown;
  };
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return new Response(
      JSON.stringify({
        error: "missing_question",
        detail: "Body must include a non-empty 'question' string.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json(
      { error: "no_client", detail: "No active client for AI egress policy." },
      { status: 403 },
    );
  }

  try {
    const tenantKey = canonicalCioTowerTenantKey(
      tenancy.clientKey ?? activeClient.key ?? tenancy.clientId,
    );
    const tenantName =
      demoSafeClientText(
        canonicalCioTowerTenantDisplayName({
          key: tenantKey,
          name: activeClient.name,
        }) ?? activeClient.name,
      ) ?? activeClient.name;
    const result = await answerCurrentTowerQuestion({
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      tenantKey,
      tenantName,
      question,
    });
    return new Response(demoSafeClientText(result.response), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Tower-Grounded": "true",
        "X-AbarVa-Tower-Layer": "tower-current",
        "X-AbarVa-Renderer-Policy": "placement-only",
        "X-AbarVa-Tower-Trace-Key": result.traceKey,
        "X-AbarVa-Tower-Validation": result.validationStatus,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(demoSafeClientText(message), {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-AbarVa-Tower-Layer": "tower-current",
        "X-AbarVa-Renderer-Policy": "placement-only",
        "X-AbarVa-Tower-Validation": "failed",
      },
    });
  }
}
