import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { retrieveContext } from '@/lib/retrieval'
import { getAdvisorClientContext, type AdvisorClientContext } from '@/lib/value-office/context'
import { getValueOfficeUseCase, refineValueOfficeUseCase } from '@/lib/value-office/server'
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

function buildSystemPrompt(
  clientContext: AdvisorClientContext,
  currentRecord: NonNullable<Awaited<ReturnType<typeof getValueOfficeUseCase>>['item']>,
  ragContext: string,
) {
  return `You are AbarVa AI Value Office, a rigorous enterprise AI value advisor.

Your job is to refine an existing enterprise AI use case after a user follow-up.
You should act like a sharp transformation advisor, not a generic chatbot.

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

CURRENT RECORD:
- Title: ${currentRecord.title}
- Business problem: ${currentRecord.business_problem || 'Unknown'}
- Why now: ${currentRecord.why_now || 'Unknown'}
- Use case type: ${currentRecord.use_case_type || 'Unknown'}
- Workflow scope: ${currentRecord.workflow_summary || 'Unknown'}
- Value hypothesis: ${currentRecord.value_hypothesis || 'Unknown'}
- Current recommendation: ${currentRecord.latest_recommendation?.summary || currentRecord.recommendation_summary || 'Unknown'}
- Current readiness notes: ${typeof currentRecord.readiness === 'object' && 'notes' in currentRecord.readiness ? currentRecord.readiness.notes : 'Unknown'}
- Existing value contracts:
${currentRecord.value_contracts.map(item => `  - ${item.category}: baseline=${item.baseline_metric} target=${item.target_metric} evidence=${item.evidence_source}`).join('\n') || '  - None'}
- Existing evidence sources:
${currentRecord.evidence_sources.map(item => `  - ${item.source_name} (${item.integration_mode}, ${item.status})`).join('\n') || '  - None'}

CONVERSATION SO FAR:
${currentRecord.conversation.slice(-8).map(item => `[${item.role}] ${item.content}`).join('\n') || 'No conversation history'}

RETRIEVED INDUSTRY CONTEXT:
${ragContext || 'No additional benchmark context retrieved.'}

RULES:
1. Incorporate the user's latest message and refine the use case.
2. Tighten the recommendation if the new information changes the decision.
3. Keep the response opinionated and grounded in measurable value.
4. Update value contracts and evidence sources where needed.
5. Return valid JSON only. No markdown.

Return this exact shape:
{
  "assistant_message": "string",
  "advisor_result": {
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
  }
}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ useCaseId: string }> },
) {
  try {
    const body = await request.json()
    const message = String(body.message || '').trim()
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const { useCaseId } = await params
    const existing = await getValueOfficeUseCase(useCaseId)
    if (!existing.schemaReady) {
      return NextResponse.json({ error: 'AI Value Office schema not deployed yet' }, { status: 400 })
    }
    if (!existing.item) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 })
    }

    const clerkAuth = await auth().catch(() => null)
    const updatedBy = clerkAuth?.userId || 'local-advisor'
    const clientContext = await getAdvisorClientContext(
      existing.item.client_id,
      `${existing.item.title} ${message}`,
    )
    const ragContext = await retrieveContext(
      `${clientContext.vertical} ${existing.item.title} ${message} AI value realization evidence baselines workflow`,
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
      max_tokens: 2600,
      system: buildSystemPrompt(clientContext, existing.item, ragContext),
      messages: [
        {
          role: 'user',
          content: `Latest user follow-up:\n${message}\n\nRefine the AI Value Office record accordingly.`,
        },
      ],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    let assistantMessage = ''
    let advisorResult: AdvisorResult
    try {
      const parsed = extractJson<{ assistant_message: string; advisor_result: AdvisorResult }>(text)
      assistantMessage = String(parsed.assistant_message || '').trim()
      if (!assistantMessage) {
        throw new Error('assistant_message must be a non-empty string')
      }
      advisorResult = validateAdvisorResult(parsed.advisor_result)
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Invalid advisor refinement output',
          details: error.message,
        },
        { status: 400 },
      )
    }

    const persisted = await refineValueOfficeUseCase({
      useCaseId,
      updatedBy,
      userMessage: message,
      assistantMessage,
      advisorResult,
    })

    const refreshed = persisted.schemaReady ? await getValueOfficeUseCase(useCaseId) : { schemaReady: false, item: null }

    return NextResponse.json({
      schemaReady: persisted.schemaReady,
      assistantMessage,
      advisorResult,
      item: refreshed.item,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
