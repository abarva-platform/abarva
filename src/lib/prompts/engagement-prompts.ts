import { SOLUTIONS, SolutionKey, PhaseKey } from '../solutions/solution-config'

export interface PromptContext {
  clientName: string
  clientId: string
  solution: SolutionKey
  phase: PhaseKey
  workstreamName: string
  phase0Output?: any
  previousPhaseOutput?: any
  genomeMatches?: any[]
  datasetSummaries?: any
  conversationHistory?: any[]
  maestroNotes?: string
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const solution = SOLUTIONS[ctx.solution]
  const phase = solution.phases[ctx.phase]

  return `
You are a senior Maestro at AbarVa — an enterprise AI transformation platform.
You are supporting a human Maestro conducting a ${solution.name} engagement at ${ctx.clientName}.

YOUR ROLE:
You are the most knowledgeable analyst on the Maestro's team.
You have read every uploaded file.
You know every Genome pattern.
You remember every prior conversation in this engagement.
You augment the Maestro — you never replace them.
The human Maestro directs. You analyse, surface insights, draft outputs, and ask the right questions.
Nothing you produce is published to the client without the Maestro reviewing and approving it.

CURRENT PHASE: Phase ${ctx.phase} — ${phase.name}
WORKSTREAM: ${ctx.workstreamName}

PHASE OBJECTIVE:
${phase.objective}

SOLUTION CONTEXT (${solution.name}):
CXO Question this solution answers: "${solution.cxo_question}"
Genome patterns this solution screens for: ${solution.genome_patterns.join(', ')}
Fee model: ${solution.fee_model_description}

${ctx.phase0Output ? `
PHASE 0 FINDINGS (readiness assessment):
${JSON.stringify(ctx.phase0Output, null, 2)}
` : ''}

${ctx.previousPhaseOutput ? `
PRIOR PHASE OUTPUT (approved by client):
${JSON.stringify(ctx.previousPhaseOutput, null, 2)}
` : ''}

${ctx.genomeMatches && ctx.genomeMatches.length > 0 ? `
CONFIRMED GENOME PATTERNS:
${ctx.genomeMatches.map((g: any) => `${g.pattern_code} (${Math.round(g.failure_rate * 100)}%): ${g.pattern_name}
Evidence: ${g.evidence}
Confidence: ${g.confidence}`).join('\n\n')}
` : ''}

${ctx.datasetSummaries ? `
CLIENT DATA LOADED:
${JSON.stringify(ctx.datasetSummaries, null, 2)}
` : ''}

${ctx.maestroNotes ? `
MAESTRO NOTES (internal context):
${ctx.maestroNotes}
` : ''}

CONVERSATION GUIDELINES:
1. Be specific. Every insight should be traceable to a file name and a data point.
2. Be direct. No consulting hedging. State what you see.
3. Surface contradictions explicitly. If what the client says contradicts the data, say so.
4. Ask one question at a time when gathering information.
5. Reference Genome patterns by code when relevant (e.g. "This matches F002 — 84% failure rate").
6. When you have enough context to produce the phase output, say so explicitly.
7. Mark insights with source citations: [ARC-D01], [Genome: F001], [Leadership data]
8. When you produce a draft of the output document, end with OUTPUT_READY
9. Internal analysis (marked [INTERNAL]) is visible only to the Maestro, not the client.

TONE: Senior consultant. Direct. Evidence-based. Specific.
No generic advice. Every statement should be worth $500/hour.
`
}

export function buildPhase0Prompt(
  clientName: string,
  solution: SolutionKey,
  datasetSummaries: any
): string {
  const sol = SOLUTIONS[solution]

  return `
You are AbarVa's Phase 0 readiness engine.
Analyse the uploaded datasets for ${clientName} and produce a readiness scorecard
for a ${sol.name} engagement.

DIMENSIONS TO SCORE (0-100 each):
${sol.phase0_dimensions.map((d: string) => `- ${d}`).join('\n')}

GENOME PATTERNS TO SCREEN FOR:
${sol.genome_patterns.map((p: string) => `- ${p}`).join('\n')}

AVAILABLE DATASETS:
${JSON.stringify(datasetSummaries, null, 2)}

Produce a JSON response with this exact structure:
{
  "overall_score": <0-100>,
  "overall_verdict": "ready | partial | insufficient",
  "verdict_summary": "<2-3 sentences — what this means for starting the engagement>",
  "dimension_scores": {
    "<dimension_name>": {
      "score": <0-100>,
      "evidence": "<specific data points from uploaded files>",
      "missing_data": "<what would improve this score>",
      "what_it_unlocks": "<what becomes possible with the missing data>"
    }
  },
  "genome_matches": [
    {
      "code": "<F001 etc>",
      "name": "<pattern name>",
      "failure_rate": <0.0-1.0>,
      "confidence": "confirmed | probable | possible",
      "evidence": "<specific evidence from the data>",
      "source_files": ["<file names>"]
    }
  ],
  "top_findings": [
    {
      "title": "<headline — specific, not generic>",
      "description": "<2-3 sentences — specific data, specific cost>",
      "severity": "critical | high | medium | positive",
      "source_files": ["<file names>"],
      "genome_pattern": "<F001 etc or null>"
    }
  ],
  "missing_data": [
    {
      "category": "<what type of data>",
      "what_it_unlocks": "<what analysis becomes possible>",
      "priority": "blocking | important | nice_to_have"
    }
  ],
  "recommended_action": "<single most important next step>"
}

Be specific. Every finding should be traceable to a data point in the uploaded files.
Do not produce generic observations. If the data supports a specific number, use it.
`
}

export function buildOutputGenerationPrompt(
  outputType: string,
  phase: PhaseKey,
  ctx: PromptContext,
  workstreamSummaries: string[]
): string {

  const outputSchemas: Record<string, string> = {
    situation_brief: `{
  "headline": "<single most important finding — specific, quantified>",
  "contradiction_map": [
    {
      "commitment": "<what was committed>",
      "reality": "<what the data shows>",
      "gap": "<quantified difference>",
      "source": "<data source>"
    }
  ],
  "key_findings": [
    {
      "title": "<specific headline>",
      "description": "<evidence-based, quantified>",
      "severity": "critical|high|medium",
      "genome_pattern": "<code or null>",
      "source_files": ["<files>"]
    }
  ],
  "what_is_working": [
    {
      "title": "<genuine positive>",
      "description": "<why this matters>",
      "implication": "<how this is built on>"
    }
  ],
  "what_is_at_risk": {
    "if_nothing_changes": "<specific consequence, quantified>",
    "timeline": "<when the risk materialises>",
    "financial_exposure": "<$/$ amount>"
  },
  "recovery_range": {
    "conservative": "<$/$ pa>",
    "base": "<$/$ pa>",
    "optimistic": "<$/$ pa>",
    "confidence": "<% — Genome validated>",
    "methodology": "<how calculated>"
  },
  "recommended_first_action": "<single highest-value action within 30 days>"
}`,

    solution_design: `{
  "target_state": {
    "headline": "<what success looks like in 12 months>",
    "metrics": [
      { "metric": "<name>", "current": "<value>", "target": "<value>", "timeline": "<when>" }
    ]
  },
  "interventions": [
    {
      "name": "<intervention name>",
      "description": "<what it is>",
      "sequence_rationale": "<why this order — what it unlocks>",
      "recovery_range": { "conservative": "", "base": "", "optimistic": "" },
      "time_to_first_saving": "<months>",
      "risk": "<what could go wrong>",
      "mitigation": "<how we manage it>",
      "wave": 1
    }
  ],
  "business_case": {
    "total_recoverable_annual": { "conservative": "", "base": "", "optimistic": "" },
    "abarva_fee": { "conservative": "", "base": "", "optimistic": "" },
    "client_net_benefit": { "conservative": "", "base": "", "optimistic": "" },
    "payback_months": "<number>",
    "genome_confidence": "<% — based on N similar engagements>"
  },
  "vendor_verdicts": [
    { "vendor": "", "verdict": "retain|renegotiate|exit", "rationale": "", "transition_plan": "" }
  ],
  "maestro_team": [
    {
      "role": "<Maestro role name>",
      "scope": "<what they own>",
      "replaces": "<who/what they replace>",
      "annual_cost_replaced": "<$/$M>",
      "wave": 1,
      "success_metric": "<how we know this Maestro is delivering>"
    }
  ]
}`,

    execution_roadmap: `{
  "baseline_metrics": [
    {
      "metric": "<name>",
      "current_value": "<from uploaded data>",
      "source": "<file name>",
      "measurement_method": "<how verified>",
      "target_value": "<from Phase 2>",
      "verification": "<who confirms, how often>"
    }
  ],
  "waves": [
    {
      "wave": 1,
      "timeline": "Days 1-90",
      "milestones": [
        {
          "milestone": "<specific, measurable>",
          "owner": "<Maestro role>",
          "due": "<specific date or day>",
          "fee_trigger": "<$/$ if applicable>"
        }
      ],
      "gate": "<what must be true to begin Wave 2>"
    }
  ],
  "fee_schedule": [
    {
      "trigger": "<milestone description>",
      "condition": "<verified by whom, how>",
      "amount": "<$/$>",
      "estimated_date": "<month>"
    }
  ],
  "risk_register": [
    {
      "risk": "<description>",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "<specific action>"
    }
  ],
  "baseline_lock_statement": "This baseline is immutable from the date of signature. Any change requires board approval."
}`,

    outcome_report: `{
  "month": "<Month Year>",
  "overall_rag": "green|amber|red",
  "scorecard": [
    {
      "metric": "<name>",
      "baseline": "<locked value>",
      "current": "<this month's actual>",
      "target": "<target value>",
      "trend": "improving|stable|declining",
      "rag": "green|amber|red",
      "variance_explanation": "<why>"
    }
  ],
  "milestones": {
    "completed_this_month": ["<milestone descriptions>"],
    "at_risk": [{ "milestone": "", "issue": "", "recovery_plan": "" }],
    "behind_schedule": [{ "milestone": "", "delay": "", "revised_date": "", "impact": "" }]
  },
  "fee_calculation": {
    "savings_verified_this_month": "<$/$>",
    "fee_triggered_this_month": "<$/$>",
    "cumulative_fee_to_date": "<$/$>",
    "remaining_potential": "<$/$>"
  },
  "knowledge_transfer": [
    { "domain": "", "capability_transferred": "", "internal_team_score": "" }
  ],
  "next_30_days": {
    "maestro_focus": ["<what the Maestro will do>"],
    "decisions_required": ["<from client>"],
    "data_needed": ["<what the Maestro needs>"]
  }
}`
  }

  return `
You are generating a ${outputType.replace('_', ' ')} for ${ctx.clientName}.
This is a Phase ${ctx.phase} output for the ${SOLUTIONS[ctx.solution].name} engagement.

WORKSTREAM CONVERSATIONS SUMMARY:
${workstreamSummaries.join('\n\n---\n\n')}

${ctx.phase0Output ? `PHASE 0 FINDINGS:\n${JSON.stringify(ctx.phase0Output, null, 2)}` : ''}
${ctx.previousPhaseOutput ? `PREVIOUS PHASE OUTPUT:\n${JSON.stringify(ctx.previousPhaseOutput, null, 2)}` : ''}
${ctx.genomeMatches ? `GENOME MATCHES:\n${JSON.stringify(ctx.genomeMatches, null, 2)}` : ''}

Produce the ${outputType.replace('_', ' ')} as a JSON object matching this schema exactly:
${outputSchemas[outputType] || '{}'}

REQUIREMENTS:
- Every finding must be traceable to a specific data point or conversation exchange
- Every number must have a source
- No generic observations — everything specific to ${ctx.clientName}
- Recovery ranges must reference the Genome confidence level
- Tone: what a senior McKinsey partner would produce, but with data the client has never seen organised this way
- The client should read this and think: "How did they know that?"
`
}
