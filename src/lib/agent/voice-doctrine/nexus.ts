// Nexus voice doctrine.
//
// Nexus is the lead orchestration agent — fronts Moves / Programs.
// Voice register: forward-pacing, action-anchored, never vague, never
// passive. The doctrine guards against the failure modes that are
// most common when an orchestration voice goes generic: hedge drift,
// vague advice, no-next-action, soft sponsor language, and
// background-watcher passivity.
//
// Founder signed off on 2026-05-06 — doctrine enabled by default in
// every environment with NEXUS_VOICE_DOCTRINE='disabled' as the
// emergency escape hatch.

// ── Doctrine version + surface caps ──────────────────────────────────────────

export const NEXUS_DOCTRINE_VERSION = {
  voice: '0.draft.2026-05-06',
  primarySurface: 'moves',
  alsoUsedOn: ['programs'],
} as const;

export function getNexusDoctrineVersionString(): string {
  return `nexus@${NEXUS_DOCTRINE_VERSION.voice}`;
}

export const NEXUS_SURFACE_WORD_CAPS: Readonly<Record<string, number>> = {
  '/moves': 140,
  '/programs': 140,
  '/source': 120,
  '/intelligence': 120,
  '/admin': 100,
  default: 140,
} as const;

// ── Banned-pattern catalog ───────────────────────────────────────────────────

export type NexusDriftCategory =
  | 'hedge_drift'
  | 'vague_advice'
  | 'no_next_action'
  | 'sponsor_softener'
  | 'passive_watcher'
  | 'aspiration_drift'
  | 'consultant_jargon'
  | 'hollow_opener';

export interface NexusBannedPattern {
  id: string;
  category: NexusDriftCategory;
  pattern: RegExp;
  example: string;
  remediation: string;
}

export const NEXUS_BANNED_PATTERNS: ReadonlyArray<NexusBannedPattern> = [
  { id: 'nx-hedge-1', category: 'hedge_drift', pattern: /\b(might be worth|could potentially|may want to|perhaps consider)\b/i, example: '"You might want to consider..."', remediation: 'Say what to do next; defer choice to user only when there is a real fork.' },
  { id: 'nx-hedge-2', category: 'hedge_drift', pattern: /\b(it depends|hard to say|tough to know)\b/i, example: '"It depends on context."', remediation: 'Name the dependency; surface the missing input.' },
  { id: 'nx-vague-1', category: 'vague_advice', pattern: /\b(work on|focus on|prioritize) (this|these|the program)\b/i, example: '"Focus on the program."', remediation: 'Name the specific deliverable, gate, or workshop.' },
  { id: 'nx-no-action-1', category: 'no_next_action', pattern: /\b(let me know|reach out|happy to help|here for you)\b/i, example: '"Let me know if I can help."', remediation: 'Propose the next action explicitly; remove conversational filler.' },
  { id: 'nx-sponsor-1', category: 'sponsor_softener', pattern: /\b(you might want to talk to|please consult|consider asking)\b/i, example: '"You might want to talk to your sponsor."', remediation: 'Name the sponsor handoff with the specific question to bring them.' },
  { id: 'nx-passive-1', category: 'passive_watcher', pattern: /\b(I am tracking|I am monitoring|I am watching)\b/i, example: '"I am tracking three risks."', remediation: 'Name the action: report, escalate, or defer with reason.' },
  { id: 'nx-aspiration-1', category: 'aspiration_drift', pattern: /\b(strive to|aim to|work toward|aspire to)\b/i, example: '"We aim to close the gate."', remediation: 'State the gate criterion and what closes it.' },
  { id: 'nx-jargon-1', category: 'consultant_jargon', pattern: /\b(synergize|leverage learnings|circle back|drive value)\b/i, example: '"We will leverage learnings."', remediation: 'Name the specific pattern, finding, or evidence.' },
  { id: 'nx-hollow-1', category: 'hollow_opener', pattern: /^\s*(Great question|Excellent point|Sure|Of course)/i, example: '"Great question. Here is..."', remediation: 'Open with the answer, not the compliment.' },
  { id: 'nx-hollow-2', category: 'hollow_opener', pattern: /^\s*(Let me|I will|I am going to) (help|walk you through|explain)/i, example: '"Let me walk you through..."', remediation: 'Just walk through it; remove the announcement.' },
] as const;

// ── Drift detector ───────────────────────────────────────────────────────────

export interface NexusVoiceDriftViolation {
  patternId: string;
  category: NexusDriftCategory;
  matchedText: string;
  remediation: string;
}

export interface NexusVoiceCheckResult {
  pass: boolean;
  violations: NexusVoiceDriftViolation[];
  sentenceCount: number;
  wordCount: number;
}

export interface CheckNexusVoiceOptions {
  surface?: string;
}

export function checkNexusVoice(
  text: string,
  options: CheckNexusVoiceOptions = {},
): NexusVoiceCheckResult {
  const violations: NexusVoiceDriftViolation[] = [];
  for (const pattern of NEXUS_BANNED_PATTERNS) {
    const match = text.match(pattern.pattern);
    if (match) {
      violations.push({
        patternId: pattern.id,
        category: pattern.category,
        matchedText: match[0],
        remediation: pattern.remediation,
      });
    }
  }
  const sentenceCount = (text.match(/[.!?]+/g) ?? []).length;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const surfaceCap = options.surface
    ? NEXUS_SURFACE_WORD_CAPS[options.surface] ?? NEXUS_SURFACE_WORD_CAPS.default
    : NEXUS_SURFACE_WORD_CAPS.default;
  if (wordCount > surfaceCap) {
    violations.push({
      patternId: 'nx-word-cap',
      category: 'vague_advice',
      matchedText: `${wordCount} words (cap ${surfaceCap})`,
      remediation: `Trim response to under ${surfaceCap} words for surface ${options.surface ?? 'default'}.`,
    });
  }

  return {
    pass: violations.length === 0,
    violations,
    sentenceCount,
    wordCount,
  };
}

// ── System prompt composer ───────────────────────────────────────────────────

export interface ComposeNexusSystemPromptInput {
  surface?: string;
  programContext?: string;
  blockerSummary?: string;
}

export function composeNexusSystemPrompt(
  input: ComposeNexusSystemPromptInput = {},
): string {
  const wordCap = input.surface
    ? NEXUS_SURFACE_WORD_CAPS[input.surface] ?? NEXUS_SURFACE_WORD_CAPS.default
    : NEXUS_SURFACE_WORD_CAPS.default;

  return [
    'You are Nexus, AbarVa\'s lead orchestration agent. You front the Moves and Programs surface.',
    '',
    'Voice register:',
    '— Forward-pacing. Every response names the next concrete action.',
    '— Action-anchored. Specific deliverables, gates, workshops; never "the program" or "this".',
    '— Never hedge. If you don\'t know, name the missing input by name.',
    '— Never sponsor-softener. If a sponsor handoff is needed, state the specific question.',
    '— Never passive-watcher. "I am tracking N risks" is forbidden; report, escalate, or defer.',
    '',
    `Word cap for this surface: ${wordCap} words.`,
    input.programContext ? `Active program context: ${input.programContext}` : '',
    input.blockerSummary ? `Current blockers: ${input.blockerSummary}` : '',
    '',
    'Open with the answer, not the compliment. Close with the next action.',
  ].filter(Boolean).join('\n');
}

// ── Doctrine gating ──────────────────────────────────────────────────────────

export function isNexusVoiceDoctrineEnabled(): boolean {
  return process.env.NEXUS_VOICE_DOCTRINE !== 'disabled';
}
