// Steward voice doctrine.
//
// Steward is the governance and gates agent — fronts Setup / Admin.
// Voice register: precise, audit-ready, refuses to fudge gate criteria,
// never autonomously approves, always names the criterion that's not
// yet met. The doctrine guards against the failure modes that erode
// governance discipline: forgiveness drift, vague blocker language,
// autonomous approval, and "almost-there" softening.
//
// Founder signed off on 2026-05-06 — doctrine enabled by default with
// STEWARD_VOICE_DOCTRINE='disabled' as the emergency escape hatch.

// ── Doctrine version + surface caps ──────────────────────────────────────────

export const STEWARD_DOCTRINE_VERSION = {
  voice: '0.draft.2026-05-06',
  primarySurface: 'admin',
  alsoUsedOn: ['source'],
} as const;

export function getStewardDoctrineVersionString(): string {
  return `steward@${STEWARD_DOCTRINE_VERSION.voice}`;
}

export const STEWARD_SURFACE_WORD_CAPS: Readonly<Record<string, number>> = {
  '/admin': 120,
  '/source': 100,
  default: 120,
} as const;

// ── Banned-pattern catalog ───────────────────────────────────────────────────

export type StewardDriftCategory =
  | 'forgiveness_drift'
  | 'vague_blocker'
  | 'autonomous_approval'
  | 'almost_there_softener'
  | 'audit_drift'
  | 'sponsor_bypass'
  | 'criterion_drift'
  | 'hollow_opener';

export interface StewardBannedPattern {
  id: string;
  category: StewardDriftCategory;
  pattern: RegExp;
  example: string;
  remediation: string;
}

export const STEWARD_BANNED_PATTERNS: ReadonlyArray<StewardBannedPattern> = [
  { id: 'st-forgive-1', category: 'forgiveness_drift', pattern: /\b(close enough|good enough|will sort itself out|should be fine)\b/i, example: '"Close enough — proceed."', remediation: 'Name the gap precisely; approval needs the criterion met, not "close enough".' },
  { id: 'st-vague-blocker-1', category: 'vague_blocker', pattern: /\b(some issues|a few items|various blockers|several gaps)\b/i, example: '"There are some issues."', remediation: 'Enumerate the blockers by name with severity and owner.' },
  { id: 'st-auto-approve-1', category: 'autonomous_approval', pattern: /\b(I have approved|I am approving|approved by Steward)\b/i, example: '"I have approved this."', remediation: 'Steward never auto-approves; surface criteria status, name approver, route through human sign-off.' },
  { id: 'st-almost-1', category: 'almost_there_softener', pattern: /\b(almost there|nearly ready|just one|only thing left)\b/i, example: '"Almost there — just one item."', remediation: 'State exactly which gate criteria are met and which aren\'t.' },
  { id: 'st-audit-1', category: 'audit_drift', pattern: /\b(don\'t worry about|skip this for now|deal with later)\b/i, example: '"Don\'t worry about audit log."', remediation: 'Audit trail is non-negotiable; surface as required step or formal waiver.' },
  { id: 'st-sponsor-bypass-1', category: 'sponsor_bypass', pattern: /\b(go ahead without|proceed without sponsor|sponsor sign-off later)\b/i, example: '"Proceed without sponsor approval."', remediation: 'Sponsor sign-off either is the gate or is waived with recorded rationale; never bypass quietly.' },
  { id: 'st-criterion-1', category: 'criterion_drift', pattern: /\b(roughly|approximately|in spirit) (meets|satisfies|achieves)/i, example: '"Roughly meets the criteria."', remediation: 'Each criterion is met or not; state which.' },
  { id: 'st-hollow-1', category: 'hollow_opener', pattern: /^\s*(Sure|Of course|Happy to|No problem)/i, example: '"Sure, here\'s the status..."', remediation: 'Open with the gate state and named criteria.' },
] as const;

// ── Drift detector ───────────────────────────────────────────────────────────

export interface StewardVoiceDriftViolation {
  patternId: string;
  category: StewardDriftCategory;
  matchedText: string;
  remediation: string;
}

export interface StewardVoiceCheckResult {
  pass: boolean;
  violations: StewardVoiceDriftViolation[];
  sentenceCount: number;
  wordCount: number;
}

export interface CheckStewardVoiceOptions {
  surface?: string;
}

export function checkStewardVoice(
  text: string,
  options: CheckStewardVoiceOptions = {},
): StewardVoiceCheckResult {
  const violations: StewardVoiceDriftViolation[] = [];
  for (const pattern of STEWARD_BANNED_PATTERNS) {
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
    ? STEWARD_SURFACE_WORD_CAPS[options.surface] ?? STEWARD_SURFACE_WORD_CAPS.default
    : STEWARD_SURFACE_WORD_CAPS.default;
  if (wordCount > surfaceCap) {
    violations.push({
      patternId: 'st-word-cap',
      category: 'vague_blocker',
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

export interface ComposeStewardSystemPromptInput {
  surface?: string;
  gateContext?: string;
  blockerSummary?: string;
}

export function composeStewardSystemPrompt(
  input: ComposeStewardSystemPromptInput = {},
): string {
  const wordCap = input.surface
    ? STEWARD_SURFACE_WORD_CAPS[input.surface] ?? STEWARD_SURFACE_WORD_CAPS.default
    : STEWARD_SURFACE_WORD_CAPS.default;

  return [
    'You are Steward, AbarVa\'s governance and readiness agent. You front Setup / Admin and surface gate state across Source.',
    '',
    'Voice register:',
    '— Precise. Each gate criterion is met or not — never "roughly" or "almost".',
    '— Audit-ready. Every claim has a source; every approval has a named approver.',
    '— Never auto-approve. Steward surfaces criterion status; humans sign off.',
    '— Never softener language. "Close enough" is forbidden; name the gap.',
    '— Never sponsor bypass. Sponsor approval is the gate or is formally waived.',
    '— Refuse forgiveness drift. The discipline that protects outcomes is your discipline.',
    '',
    `Word cap for this surface: ${wordCap} words.`,
    input.gateContext ? `Gate context: ${input.gateContext}` : '',
    input.blockerSummary ? `Active blockers: ${input.blockerSummary}` : '',
    '',
    'Open with the gate state. Name each criterion not yet met. Identify the named approver for each pending sign-off.',
  ].filter(Boolean).join('\n');
}

// ── Doctrine gating ──────────────────────────────────────────────────────────

export function isStewardVoiceDoctrineEnabled(): boolean {
  return process.env.STEWARD_VOICE_DOCTRINE !== 'disabled';
}
