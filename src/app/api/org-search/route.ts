import {
  CONSERVATIVE_TENANT_AI_POLICY,
  callModel,
  createAnthropicDirectTextAdapter,
  createMemoryAiEgressAuditSink,
  type AnthropicTool,
  type TenantAiPolicy,
} from "@/lib/integrations/ai-egress";

const PUBLIC_ORG_SEARCH_POLICY: TenantAiPolicy = {
  ...CONSERVATIVE_TENANT_AI_POLICY,
  allowExternalAI: true,
  kernelOnlyMode: false,
  allowClaude: true,
  maxDataClass: 'public',
  requireRedaction: false,
  promptResponseRetentionDays: 7,
};

export async function POST(request: Request) {
  const { orgName } = await request.json();

  try {
    const prompt = `Gather complete transformation intelligence on: ${orgName}`;
    const result = await callModel({
      tenantId: '00000000-0000-0000-0000-000000000000',
      workflow: 'public-org-search',
      provider: 'anthropic',
      route: 'anthropic-direct',
      model: 'claude-sonnet-4-6',
      prompt,
      dataClass: 'public',
      policy: PUBLIC_ORG_SEARCH_POLICY,
      auditSink: createMemoryAiEgressAuditSink(),
      adapter: createAnthropicDirectTextAdapter({
        model: 'claude-sonnet-4-6',
        maxTokens: 4096,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          } as unknown as AnthropicTool,
        ],
        system: `You are AbarVa's intelligence gathering engine. When given an organization name, search for and synthesize all publicly available information relevant to enterprise transformation.

Search for and extract:
1. Financial performance — revenue, margins, growth, key metrics
2. Leadership team — C-suite names, tenure, recent quotes
3. Technology landscape — known vendors, recent tech investments, job posting signals
4. Strategic priorities — from earnings calls, press releases, annual reports
5. Recent news — last 90 days, announcements, challenges, acquisitions
6. Known transformation challenges — what problems are they publicly struggling with

Then produce a structured intelligence brief with these exact sections:

## ORGANIZATION OVERVIEW
Key facts, size, market position

## FINANCIAL PERFORMANCE
Revenue, margins, key financial metrics with actual numbers

## LEADERSHIP TEAM
Key executives with names, roles, tenure, and any public quotes

## TECHNOLOGY LANDSCAPE
Known systems, vendors, recent tech investments, signals from job postings

## STRATEGIC PRIORITIES
What they are publicly focused on

## TRANSFORMATION CHALLENGES
Top 3 likely pain points based on evidence gathered

## INTELLIGENCE CONFIDENCE
Score out of 100 and what is missing

## RECOMMENDED DATA LOADS
What internal data would most improve this analysis, in priority order`,
      }),
    });

    if (!result.ok) {
      return Response.json({ brief: result.reason }, { status: 403 });
    }

    return Response.json({ brief: result.response });

  } catch (error) {
    console.error("Org search error:", error);
    return Response.json({ brief: "Error gathering intelligence. Please try again." }, { status: 500 });
  }
}
