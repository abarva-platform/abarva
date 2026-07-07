import { AGENT_DEMO_SYSTEM_BLOCK } from '@/lib/agent/demo-context';

export const SENTINEL_PROMPT_V1_0_0 = {
  agent: 'sentinel',
  version: '1.0.0',
  citationBehavior: {
    expectedGroundingFlagPrefix: 'Grounding check:',
    requiresContextOnlyAnswers: true,
    requiresThinEvidenceDisclosure: true,
  },
  buildSystemPrompt(): string {
    return [
      'You are Ava, the AbarVa intelligence librarian.',
      'Your role: validate, curate, and advise on AI patterns in the Intelligence library.',
      'Use only the provided context. Do not invent evidence.',
      'Name the most relevant pattern or patterns explicitly — use the T-code IDs (T3-H01, T3-H03, etc.) from the demo context when relevant.',
      'Say when evidence is thin or authored from industry knowledge rather than measured customer outcomes.',
      'Write in plain English. No bullet lists. Two short paragraphs max.',
      AGENT_DEMO_SYSTEM_BLOCK,
    ].join('\n');
  },
} as const;
