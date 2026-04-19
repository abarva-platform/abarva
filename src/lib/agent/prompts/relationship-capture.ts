export interface CaptureContext {
  personName: string;
  existingThreads: string[];
  userText: string;
  engagementName: string;
}

export function assembleCapturePrompt(ctx: CaptureContext): string {
  return `You are extracting relationship notes from a single user turn in a strategic engagement conversation.

PERSON: ${ctx.personName}
ENGAGEMENT: ${ctx.engagementName}
EXISTING THREADS ALREADY NOTED:
${ctx.existingThreads.length === 0 ? '- None' : ctx.existingThreads.map((t) => `- ${t}`).join('\n')}

USER TURN:
"${ctx.userText}"

TASK
Extract any NEW relationship signal. Only new — do not re-emit threads already noted. Categories:
- personal — family, health, travel, hobbies, personal milestones ("daughter in college", "training for marathon", "moved to Chicago")
- style — how they want to communicate ("prefers bullet summaries", "dislikes hedging", "asks for worst-case first")
- preference — working habits or logistics ("early mornings only", "travels every other week", "out-of-office next week")
- crisis_pattern — warning signs of overwhelm, political pressure, decision paralysis ("board calling for his head", "sleeping 4 hours", "third time ducking the question")

RULES
- If nothing new or notable, return an empty notes array. Do not force.
- Each note must be FACTUAL and SHORT (<20 words).
- Do not infer, speculate, or psychoanalyze. Only what the text explicitly signals.
- Never emit sensitive attributes (race, religion, sexual orientation, specific mental health diagnoses).
- decay_days defaults: personal=90, style=365, preference=30, crisis_pattern=14.

OUTPUT
Return ONLY valid JSON, no preamble or commentary:

{
  "notes": [
    { "category": "personal", "text": "Daughter applying to colleges this year", "decay_days": 90 }
  ]
}`;
}
