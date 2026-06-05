import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import { getActiveClientKey, getActiveClientRow } from "@/lib/active-client";
import {
  createIntelligenceAskOpenAIText,
  INTELLIGENCE_ASK_OPENAI_SYNTHESIS_MODEL,
} from "@/lib/intelligence/ask/openai-runtime";
import { buildTenantContextBlock } from "@/lib/intelligence/persistence";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";

export async function POST(request: Request) {
  const { orgName, orgSize, vertical, challenge } = await request.json();

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json(
      { error: "no_client", detail: "No active client for AI egress policy." },
      { status: 403 },
    );
  }

  const userContextBlock = await getUserContextPromptBlock();
  const activeClientKey = await getActiveClientKey();
  const tenantContextBlock = await buildTenantContextBlock(activeClientKey);

  const systemPrompt = `You are AbarVa, a senior enterprise transformation advisor.
Use only the authenticated tenant context supplied below for organization-specific facts.
Do not use static seed files, legacy fixture data, or remembered facts.
If the tenant context does not include a number, owner, quote, date, vendor, or metric, say what is missing instead of inventing it.
Never call synthetic planning context "actual client data."
Write in short, scannable sections that a CXO can act on.

${userContextBlock}

${tenantContextBlock ?? "TENANT CONTEXT: No loader-backed tenant context was available for this diagnostic route."}

${FOUR_LAYER_REASONING_INSTRUCTIONS}

Format your response with these exact sections:

## TOP 3 TRANSFORMATION CHALLENGES
(Reference specific loaded facts when available; otherwise label the evidence gap)

## ROOT CAUSES
(Connect symptoms to operating-model, data, process, or vendor causes)

## CONTRADICTIONS DETECTED
(Surface conflicts only when the loaded tenant context supports them)

## PRIORITY ACTIONS - NEXT 90 DAYS
(Specific, actionable, sequenced)

## BENCHMARK COMPARISON
(Compare to patterns only when no tenant benchmark is loaded; label it as pattern context)

## FINANCIAL IMPACT
(Quantify only when the loaded tenant context includes enough evidence; otherwise name the missing inputs)`;

  const userMessage = `Diagnose this organization:
Organization: ${orgName}
Size: ${orgSize}
Industry: ${vertical}
Primary Challenge: ${challenge}

Provide a specific diagnosis from the loader-backed context when available. If context is thin, give a pattern-based diagnosis and label the evidence gaps.`;

  try {
    const text = await createIntelligenceAskOpenAIText({
      tenantId: activeClient.id,
      workflow: "chat-diagnostic",
      model: INTELLIGENCE_ASK_OPENAI_SYNTHESIS_MODEL,
      instructions: systemPrompt,
      input: userMessage,
      maxOutputTokens: 2048,
      dataClass: tenantContextBlock ? "confidential" : "internal",
      metadata: { surface: "/diagnostic", orgName, vertical },
    });

    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-abarva-model-provider": "openai",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "ai_egress_denied", detail: message },
      { status: 403 },
    );
  }
}
