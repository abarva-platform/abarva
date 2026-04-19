export interface TriggerContext {
  userText: string;
  engagementName: string;
  engagementIndustry: string;
  allPatterns: Array<{ code: string; name: string; description?: string | null; category: string }>;
  alreadyTriggered: string[];
}

export function assembleTriggerDetectionPrompt(ctx: TriggerContext): string {
  return `You are detecting whether a user's message provides evidence that specific Genome failure patterns are active on this engagement.

ENGAGEMENT: ${ctx.engagementName} (${ctx.engagementIndustry})

KNOWN PATTERNS
${ctx.allPatterns.map((p) => `- ${p.code}: ${p.name} — ${p.description ?? p.category}`).join('\n')}

ALREADY TRIGGERED (do not re-emit)
${ctx.alreadyTriggered.length === 0 ? '- None' : ctx.alreadyTriggered.map((c) => `- ${c}`).join('\n')}

USER TEXT
"${ctx.userText}"

TASK
For each pattern, determine whether the user text provides EXPLICIT evidence it's active. "Explicit" means the text describes a situation that directly matches the pattern's meaning — not a vague match.

Examples:
- "Our CDO just resigned" → F007 triggered
- "We're nine months past go-live and things are worse" → F012 triggered
- "We invested $20M in analytics but can't prove it saved anything" → F008 triggered
- "We're thinking about analytics" → does NOT trigger anything. Too vague.

OUTPUT
Return ONLY JSON:

{
  "triggers": [
    { "code": "F007", "evidence": "short quote or paraphrase from the text" }
  ]
}

If nothing triggers, return { "triggers": [] }. Do not force matches.`;
}
