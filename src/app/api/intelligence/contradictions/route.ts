/**
 * POST /api/intelligence/contradictions
 *
 * Runs deterministic contradiction detection from typed client data,
 * then enriches each finding with Claude-generated narrative.
 *
 * Body: { clientId: string }
 * Returns: Contradiction[] — typed findings with finding + recommendation
 */

import Anthropic from '@anthropic-ai/sdk'
import { detectContradictions } from '@/lib/intelligence/contradictions'
import type { Contradiction, RawContradiction } from '@/lib/intelligence/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { clientId = 'meridian' } = await request.json()

  const raw: RawContradiction[] = detectContradictions(clientId)

  // Build a structured prompt asking Claude to enrich each contradiction
  const contradictionsText = raw.map(c => `
ID: ${c.id}
Title: ${c.title}
Severity: ${c.severity}
Data Point A — ${c.dataPointA.label} (${c.dataPointA.source}): ${c.dataPointA.value}
Data Point B — ${c.dataPointB.label} (${c.dataPointB.source}): ${c.dataPointB.value}
Gap: ${c.gap}
Financial Impact: ${c.financialImpact}
Confidence: ${c.confidence}%
`).join('\n---\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are AbarVa, the world's most experienced enterprise transformation advisor.
You have been given a set of contradictions detected by comparing documented commitments against measured actuals in a client's data.
Each contradiction is real — derived from typed data fields. Your job is to add expert interpretation and a specific action.

For each contradiction, provide exactly two fields:
- "finding": 1-2 sentences of expert interpretation — why this matters, what it signals about leadership or governance failures. Be direct and specific. Name the mechanism of failure.
- "recommendation": 1-2 sentences of specific, sequenced action. Start with a verb. Reference the actual numbers.

Respond ONLY with a valid JSON array in this exact structure:
[
  { "id": "C001", "finding": "...", "recommendation": "..." },
  ...
]

No commentary, no preamble, no markdown code blocks — just the raw JSON array.`,
    messages: [{
      role: 'user',
      content: `Enrich these ${raw.length} contradictions detected in client data:\n\n${contradictionsText}`,
    }],
  })

  let enrichments: Array<{ id: string; finding: string; recommendation: string }> = []
  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    enrichments = JSON.parse(responseText)
  } catch {
    // If Claude returns anything malformed, use empty enrichments — detection still works
    enrichments = raw.map(c => ({ id: c.id, finding: '', recommendation: '' }))
  }

  const enrichmentMap = Object.fromEntries(enrichments.map(e => [e.id, e]))

  const contradictions: Contradiction[] = raw.map(c => ({
    ...c,
    finding: enrichmentMap[c.id]?.finding || '',
    recommendation: enrichmentMap[c.id]?.recommendation || '',
  }))

  return Response.json(contradictions)
}
