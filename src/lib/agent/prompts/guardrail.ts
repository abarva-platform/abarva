export interface GuardrailContext {
  draftResponse: string;
  knownContext: {
    personName: string;
    personRole: string;
    personOrganization: string;
    engagementName: string;
    engagementIndustry: string;
    currentPhase: number;
    activePatterns: string[];
    personalThreads: string[];
  };
}

export function assembleGuardrailPrompt(ctx: GuardrailContext): string {
  return `You are checking whether an AI agent's draft response violates the "never ask a question whose answer is already known" rule.

KNOWN CONTEXT (the agent had access to all of this when generating the draft)
- Person: ${ctx.knownContext.personName}, ${ctx.knownContext.personRole} at ${ctx.knownContext.personOrganization}
- Engagement: ${ctx.knownContext.engagementName} (industry: ${ctx.knownContext.engagementIndustry})
- Current phase: ${ctx.knownContext.currentPhase}
- Active Genome patterns: ${ctx.knownContext.activePatterns.join(', ') || 'none'}
- Personal threads already noted: ${ctx.knownContext.personalThreads.join(', ') || 'none'}

DRAFT RESPONSE
"""
${ctx.draftResponse}
"""

TASK
Check if the draft asks any question whose answer is already in the known context. Examples of violations:
- Asks person's name, role, or organization
- Asks what industry the engagement is in
- Asks what phase they're in
- Asks about a pattern already flagged as active
- Re-asks a personal thread already noted

Clarifying and following-up on details is FINE. Asking for elaboration is FINE. Only flag when the draft asks for information that's EXPLICITLY already known.

OUTPUT
Return ONLY JSON:

{
  "violation": true | false,
  "violation_reason": "If true, one sentence explaining what known-known was asked about. Empty string if false."
}

No commentary, no markdown.`;
}
