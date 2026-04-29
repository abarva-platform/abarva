import Anthropic from "@anthropic-ai/sdk";
import { meridianHealth } from "@/data/meridian";
import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import { getRelevantTools } from "@/lib/agent/tools/registry";
import { runToolUseLoop } from "@/lib/agent/streaming/toolUseLoop";

export async function POST(request: Request) {
  const { orgName, orgSize, vertical, challenge } = await request.json();

  // F0.2 Layer 0 — user context for authenticated visitors. Returns
  // empty string for the common unauthenticated marketing-funnel hit.
  const userContextBlock = await getUserContextPromptBlock();

  // Load org context if Meridian
  const isMeridian = orgName.toLowerCase().includes("meridian");
  const orgContext = isMeridian
    ? `
ORGANIZATION CONTEXT — CONFIDENTIAL:
- ${meridianHealth.org.name}: ${meridianHealth.hospitals.total} hospitals, ${meridianHealth.org.employees.toLocaleString()} employees, $${meridianHealth.org.revenue}B revenue
- Operating margin: ${meridianHealth.org.operatingMargin}% (board target: ${meridianHealth.financials.targetOperatingMargin}%)
- RCM denial rate: ${meridianHealth.technology.rcm.denialRate}% (industry benchmark: 11.4%) — $${meridianHealth.technology.rcm.denialWriteOff2023}M written off in 2023
- Epic optimization score: ${meridianHealth.technology.ehr.optimizationScore}/100 — only 12 of 47 Cogito dashboards live
- Days in AR: ${meridianHealth.technology.rcm.daysInAR} days (target: 42)
- Medicare Advantage star rating: ${meridianHealth.healthPlan.medicareAdvantage.starRating} (bonus threshold: 4.0)
- IT budget: $${meridianHealth.financials.itBudget2024}M — only $${meridianHealth.financials.itBudgetBreakdown.projectsAndTransformation}M for transformation
- CDO role: VACANT — CIO carrying both roles 8 months in
- Blue Ridge merger integration: 8 months overdue, 2 hospitals still on legacy Cerner

KEY CONTRADICTIONS DETECTED:
${meridianHealth.contradictions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

LEADERSHIP INSIGHTS:
- CIO: "${meridianHealth.interviewInsights.cio}"
- CFO: "${meridianHealth.interviewInsights.cfo}"
- COO: "${meridianHealth.interviewInsights.coo}"
- CMIO: "${meridianHealth.interviewInsights.cmio}"
`
    : "";

  const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // F0.4: Meridian diagnostic surface has no actionable tools today —
  // it's a one-shot diagnostic generator. Routing through the loop
  // anyway keeps all 4 interactive routes structurally consistent
  // (kickoff §4 F0.4) and means future tools (e.g. `start_engagement`)
  // can be added without re-plumbing the route.
  const tools = getRelevantTools('/diagnostic');

  const systemPrompt = `You are AbarVa, the world's most experienced enterprise transformation advisor.
You have deep expertise in healthcare and financial services transformations.
You have access to this organization's actual data, financials, leadership interviews, and known contradictions.
Reference specific numbers, names, and contradictions from the org data.
Never give generic advice — every insight must reference their specific situation.

${userContextBlock}Format your response with these exact sections:

## TOP 3 TRANSFORMATION CHALLENGES
(Reference specific metrics and dollar amounts)

## ROOT CAUSES
(Reference leadership quotes and contradictions detected)

## CONTRADICTIONS DETECTED
(Surface the conflicts in their own data and decisions)

## PRIORITY ACTIONS — NEXT 90 DAYS
(Specific, actionable, sequenced)

## BENCHMARK COMPARISON
(Compare their metrics to industry benchmarks with specific numbers)

## FINANCIAL IMPACT
(Quantify the cost of inaction in dollars)`;

  const userMessage = `${orgContext}

Diagnose this organization:
Organization: ${orgName}
Size: ${orgSize}
Industry: ${vertical}
Primary Challenge: ${challenge}

Provide a specific diagnosis using their actual data.`;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        await runToolUseLoop({
          client: anthropicClient,
          model: "claude-sonnet-4-6",
          maxTokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
          tools,
          toolContext: { request, surface: '/diagnostic' },
          writer: {
            write(text) {
              controller.enqueue(encoder.encode(text));
            },
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[stream error: ${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}