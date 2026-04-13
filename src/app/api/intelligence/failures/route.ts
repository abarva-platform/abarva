/**
 * POST /api/intelligence/failures
 *
 * Scores all AI initiatives against the Transformation Failure Genome,
 * then asks Claude to write a sequencing narrative — the critical path.
 *
 * Body: { client: 'meridian' | 'firstcapital' | 'apexretail' }
 * Returns: { risks: InitiativeRisk[], narrative: string }
 */

import Anthropic from '@anthropic-ai/sdk'
import { scoreInitiatives, getCriticalPath } from '@/lib/intelligence/failure-genome'
import type { FailureAnalysis } from '@/lib/intelligence/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CLIENT_NAMES: Record<string, string> = {
  meridian: 'Meridian Health System',
  firstcapital: 'First Capital Financial',
  apexretail: 'Apex Retail Group',
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const clientId: string = body.client ?? 'meridian'
  const clientName = CLIENT_NAMES[clientId] ?? 'Meridian Health System'

  const risks = scoreInitiatives(clientId)
  const criticalPath = getCriticalPath(risks)

  const blocked = risks.filter(r => r.isBlocked)
  const viable = risks.filter(r => !r.isBlocked).sort((a, b) => b.successProbability - a.successProbability)

  const riskSummary = risks.map(r =>
    `${r.initiativeName} (${r.initiativeId}): ${r.successProbability}% success probability — ${r.isBlocked ? 'BLOCKED' : 'viable'} — Blocker: ${r.criticalBlocker} — Patterns: ${r.activePatterns.map(p => p.code).join(', ') || 'none'}`
  ).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are AbarVa, an enterprise transformation advisor. You are looking at ${clientName}'s AI initiative portfolio.
You have scored each initiative against the Transformation Failure Genome — seven historically validated failure patterns.

Write a sequencing narrative in 3-4 sentences. Be direct, specific, and clinically honest:
1. Name the single critical dependency that unlocks the most value (and what it unlocks)
2. Name the 1-2 initiatives that are viable right now and should start immediately
3. Name the core structural blocker that is suppressing the entire portfolio

Use specific dollar amounts and initiative names. Do not use markdown or bullet points — just flowing prose.`,
    messages: [{
      role: 'user',
      content: `${clientName} AI Portfolio Analysis:

Critical Node: ${criticalPath.criticalNode}
Locked Value: $${(criticalPath.lockedValue / 1000000).toFixed(0)}M blocked until this resolves
Blocked Initiatives: ${criticalPath.blockedInitiatives.join(', ')}

Blocked (${blocked.length}): ${blocked.map(r => r.initiativeName).join(', ')}
Viable (${viable.length}): ${viable.slice(0, 4).map(r => r.initiativeName + ' (' + r.successProbability + '%)').join(', ')}

Full Initiative Scores:
${riskSummary}

Write the sequencing narrative.`,
    }],
  })

  const narrative = message.content[0].type === 'text' ? message.content[0].text : null

  const result: FailureAnalysis = { risks, narrative }
  return Response.json(result)
}
