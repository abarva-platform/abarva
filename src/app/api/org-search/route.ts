import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { orgName } = await request.json();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        } as any,
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
      messages: [
        {
          role: "user",
          content: `Gather complete transformation intelligence on: ${orgName}`,
        },
      ],
    });

    const text = response.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    return Response.json({ brief: text });

  } catch (error) {
    console.error("Org search error:", error);
    return Response.json({ brief: "Error gathering intelligence. Please try again." }, { status: 500 });
  }
}
