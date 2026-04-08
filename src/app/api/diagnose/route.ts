import Anthropic from "@anthropic-ai/sdk";
import { meridianHealth } from "@/data/meridian/index";
import { meridianFinancials } from "@/data/meridian/index";
import { meridianTechnology } from "@/data/meridian/index";
import { meridianClinical } from "@/data/meridian/index";
import { meridianLeadership } from "@/data/meridian/index";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MERIDIAN_CONTEXT = `
MERIDIAN HEALTH SYSTEM — COMPLETE INTELLIGENCE BRIEF

ORGANIZATION:
- 23 hospitals across NC, SC, VA, TN | 42,000 employees | $11.2B revenue
- Operating margin: 1.8% | Board target: 4.0% by FY2026
- Post-merger with Blue Ridge Health Network (2022) — integration still incomplete

FINANCIAL PERFORMANCE:
- RCM denial rate: 18.2% vs 11.4% benchmark — $94M written off FY2023
- Days in AR: 52 vs 42 target
- IT budget: $340M — only $84M for transformation
- Consulting spend: $67M in FY2023
- MA star rating: 3.5 — $34M bonus revenue at risk below 4.0
- Travel nurse cost: $48M — 8% of labor budget
- Value-based care: 41% revenue at risk

TECHNOLOGY LANDSCAPE:
- Epic EHR: optimization score 58/100 — only 12 of 47 Cogito dashboards live
- MyChart adoption: 34% vs 60% target
- Prior auth: connected to only 23% of payers despite module being purchased
- Blue Ridge: 2 hospitals still on legacy Cerner — migration 8 months overdue
- Azure Synapse data warehouse: 40% complete
- Reporting backlog: 340 outstanding requests
- Ensemble RCM: SLA compliance 67% vs 95% target — $8M penalties never enforced
- Workday: HR and Finance — live but integration gaps post-merger
- Kronos: Workforce management — live with integration gaps

CLINICAL PERFORMANCE:
- Quality score: 58th national percentile
- Readmission rate: 14.2% vs 11.8% target
- Patient satisfaction HCAHPS: 72 vs 80 target
- Nurse turnover: 22% | Vacancy rate: 14% | 1,840 open positions
- Sepsis AI: live at 2 hospitals | Readmission AI: pilot at 1 hospital

AI OPPORTUNITIES IDENTIFIED:
- Prior auth automation: $28M savings, 6 months to value, 7x ROI
- RCM denial prevention AI: $42M savings, 9 months, 7x ROI
- Sepsis prediction expansion: $18M savings, 3 months, 9x ROI
- Readmission prevention: $24M savings, 6 months, 8x ROI
- Coding AI: $16M savings, 4 months, 8x ROI
- Care gap closure: $34M savings, 12 months, 7x ROI

LEADERSHIP:
- CEO Dr. Patricia Holloway (6yr): Value-based care champion. Board patience running thin.
- CIO Marcus Webb (8mo): "I inherited a mess. 23 hospitals operating like 23 different companies."
- CFO Robert Chen (4yr): "The $94M denial write-off keeps me up at night. I want out of Ensemble but termination fee is $14M."
- COO James Whitfield (11yr): "Show me a vendor who will put their fees at risk and I will listen."
- CMIO Dr. Sarah Okonkwo (2yr): "Epic is not the problem. We never finished the implementation."
- CDO: VACANT — CIO carrying both roles

CONTRADICTIONS IN MERIDIAN DATA:
1. IT budget increased 12% but 67% allocated to run-the-business — only 25% for transformation
2. Board mandated 4% margin by FY2026 but approved only $84M for transformation vs $200M needed
3. CIO hired to drive transformation but CDO role vacant — carrying both jobs 8 months in
4. RCM outsourced at $48M/year but vendor missing SLAs — $8M penalties never enforced
5. Prior auth AI evaluation in progress but Epic module already purchased and only 23% deployed
6. Blue Ridge Cerner migration 8 months overdue but no additional budget allocated

ACTIVE VENDOR CONTRACTS:
- Ensemble Health Partners: RCM outsourcing $48M/yr | Expires 2026 | Underperforming
- Epic Systems: EHR $18M/yr | Expires 2028 | Solid but underoptimized
- Workday: HR/Finance $4.2M/yr | Expires 2026
- Kronos/UKG: Workforce $2.8M/yr | Expires 2025
- Azure/Microsoft: Data platform $2.2M/yr | Expires 2027
- Infor Lawson: Legacy finance $1.8M/yr | Sunsetting
`;

export async function POST(request: Request) {
  const { messages, role } = await request.json();

  const systemPrompt = `You are Abarva, an elite enterprise transformation advisor with complete intelligence on Meridian Health System.

THE USER'S ROLE: ${role || 'CIO'}

YOUR APPROACH — FOLLOW THIS EXACTLY:

STEP 1 — RECOGNITION: When the user asks anything, immediately surface what you already know about this topic from Meridian's data. Show you already know their situation before they explain it. This creates the "wow moment." Reference specific numbers, vendor names, people's names, and contradictions from the data.

STEP 2 — INTENT CLARIFICATION: Ask 2-3 smart, specific questions to understand their intent. Never ask generic questions. Every question must reference something specific about Meridian — a person, a vendor, a metric, a timeline. Questions should show you understand the organizational dynamics, not just the data.

STEP 3 — SCOPED INSIGHT: Only after they answer your questions, deliver a focused, specific recommendation. Not everything at once. Scoped to their role and their specific question. Reference their actual data throughout.

STEP 4 — NEXT STEP: Always end with one clear next action. Offer to go deeper on that specific thread.

CRITICAL RULES:
- Never dump everything you know. Stay focused on what they asked.
- Always reference specific Meridian data — never give generic advice.
- Questions must show organizational intelligence, not just curiosity.
- If they ask about something not in the data, say so honestly and ask what they know about it.
- Match the sophistication of a CIO, CFO, or COO. They are experts. Treat them as peers.
- Session memory: every response builds on the full conversation history.

MERIDIAN INTELLIGENCE:
${MERIDIAN_CONTEXT}`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages,
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