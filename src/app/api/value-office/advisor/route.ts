import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { retrieveContext } from '@/lib/retrieval'
import { buildAbarNexusProvenance } from '@/lib/value-office/abarnexus'
import { getAdvisorClientContext, type AdvisorClientContext } from '@/lib/value-office/context'
import { persistAdvisorResult } from '@/lib/value-office/server'
import type { AdvisorResult } from '@/lib/value-office/types'
import { validateAdvisorResult } from '@/lib/value-office/validation'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function extractJson<T>(text: string): T {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  if (fenced) return JSON.parse(fenced[1]) as T

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(text.slice(start, end + 1)) as T
  }
  throw new Error('Advisor returned invalid JSON')
}

function buildSystemPrompt(clientContext: AdvisorClientContext, ragContext: string) {
  return `You are AbarVa AI Value Office, a rigorous enterprise AI value advisor.

Your job is to pressure-test a proposed AI use case for a CXO or Maestro.
You do not hype ideas. You refine them, split them if needed, identify what good looks like, and say what evidence is required.

CLIENT CONTEXT:
- Client: ${clientContext.name}
- Vertical: ${clientContext.vertical}
- Tagline: ${clientContext.tagline}
- Top pressures:
${clientContext.top_pressures.map(item => `  - ${item}`).join('\n')}
- Known contradictions:
${clientContext.contradictions.map(item => `  - ${item}`).join('\n')}
- Current priorities:
${clientContext.current_priorities.map(item => `  - ${item}`).join('\n')}
- Internal dataset summary:
${clientContext.dataset_summary.length ? clientContext.dataset_summary.map(item => `  - ${item}`).join('\n') : '  - No additional client dataset summary available'}
- AbarNexus normalized records:
${clientContext.abarnexus_summary.length ? clientContext.abarnexus_summary.map(item => `  - ${item}`).join('\n') : '  - No recent normalized AbarNexus records available'}

RETRIEVED INDUSTRY CONTEXT:
${ragContext || 'No additional benchmark context retrieved.'}

RULES:
1. Be direct and specific.
2. Split broad ideas into smaller use cases if necessary.
3. Prefer evidence-backed value categories over generic AI aspiration.
4. Recommend a solution pattern, not low-level technical implementation detail.
5. Treat baselines and evidence sources as first-class requirements.
6. Return valid JSON only. No markdown, no commentary outside the JSON object.

Return this exact shape:
{
  "refined_title": "string",
  "use_case_type": "string",
  "executive_summary": "string",
  "business_problem": "string",
  "why_now": "string",
  "target_users": "string",
  "workflows_in_scope": ["string"],
  "systems_in_scope": ["string"],
  "value_hypothesis": "string",
  "solution_pattern": {
    "entry_point": "string",
    "control_plane": "string",
    "ai_layer": "string",
    "data_layer": "string",
    "systems_of_record": ["string"],
    "human_in_loop": "string",
    "notes": "string"
  },
  "readiness": {
    "overall": number,
    "data": number,
    "workflow": number,
    "sponsorship": number,
    "governance": number,
    "integration": number,
    "notes": "string"
  },
  "value_contracts": [
    {
      "category": "string",
      "where_value_lost": "string",
      "target_state": "string",
      "baseline_metric": "string",
      "baseline_value": "string",
      "target_metric": "string",
      "target_value": "string",
      "unit": "string",
      "evidence_source": "string",
      "evidence_owner": "string",
      "review_cadence": "string",
      "confidence_grade": "Gold|Silver|Bronze",
      "notes": "string"
    }
  ],
  "evidence_sources": [
    {
      "source_name": "string",
      "source_type": "string",
      "integration_mode": "manual_input|extract_upload|scheduled_feed|direct_integration",
      "status": "needed|identified|available|connected|proxy_only",
      "system_name": "string",
      "owner_name": "string",
      "details": {"key":"value"}
    }
  ],
  "recommendation": {
    "type": "strong_candidate|pilot_first|redesign_before_funding|split_into_smaller_use_cases|weak_value_case",
    "summary": "string",
    "rationale": "string",
    "strengths": ["string"],
    "risks": ["string"],
    "missing_data": ["string"],
    "next_actions": ["string"]
  },
  "confidence_score": number
}`
}

function buildUserPrompt(input: { idea: string; clientId: string; sponsorName?: string; sponsorRole?: string }) {
  return `Evaluate this AI use case idea for ${input.clientId}.

Idea:
${input.idea}

${input.sponsorName ? `Sponsor name: ${input.sponsorName}` : ''}
${input.sponsorRole ? `Sponsor role: ${input.sponsorRole}` : ''}

Think like a strong transformation advisor. The answer should be suitable for turning directly into an AI Value Office record.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientId = String(body.clientId || '').trim()
    const idea = String(body.idea || '').trim()
    const sponsorName = body.sponsorName ? String(body.sponsorName).trim() : ''
    const sponsorRole = body.sponsorRole ? String(body.sponsorRole).trim() : ''

    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })
    if (!idea) return NextResponse.json({ error: 'idea required' }, { status: 400 })

    const clerkAuth = await auth().catch(() => null)
    const createdBy = clerkAuth?.userId || 'local-advisor'

    const clientContext = await getAdvisorClientContext(clientId, idea)
    const ragContext = await retrieveContext(
      `${clientContext.vertical} ${idea} AI value realization baseline workflow evidence readiness`,
      clientContext.vertical.toLowerCase().includes('health')
        ? 'healthcare'
        : clientContext.vertical.toLowerCase().includes('financial')
          ? 'finserv'
          : clientContext.vertical.toLowerCase().includes('retail')
            ? 'retail'
            : 'universal',
      4,
    )

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2400,
      system: buildSystemPrompt(clientContext, ragContext),
      messages: [{ role: 'user', content: buildUserPrompt({ idea, clientId, sponsorName, sponsorRole }) }],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    let advisorResult: AdvisorResult
    try {
      advisorResult = validateAdvisorResult(extractJson<AdvisorResult>(text))
    } catch (error: any) {
      return NextResponse.json(
        { error: `Invalid advisor output: ${error.message}` },
        { status: 400 },
      )
    }

    const provenance = buildAbarNexusProvenance({
      vertical: clientContext.vertical,
      datasetSummary: clientContext.dataset_summary,
      missingData: advisorResult.recommendation.missing_data,
      hasRetrievedContext: Boolean(ragContext.trim()),
    })
    const persisted = await persistAdvisorResult({
      clientId,
      submittedIdea: idea,
      createdBy,
      sponsorName,
      sponsorRole,
      advisorResult,
    })

    return NextResponse.json({
      schemaReady: persisted.schemaReady,
      persisted: persisted.schemaReady,
      useCaseId: persisted.useCaseId,
      advisorResult,
      provenance,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
