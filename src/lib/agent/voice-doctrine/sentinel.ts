/**
 * Sentinel voice doctrine · INT-VOICE
 *
 * Operationalizes the doctrine in `docs/build/AGENT_VOICE_SENTINEL.md`:
 *
 *   - `composeSentinelSystemPrompt()` — builds the system prompt
 *     for any Intelligence-surface chat turn from the doctrine
 *     + the bundle/mode context.
 *   - `checkSentinelVoice()` — voice-drift detector. Runs the
 *     banned-pattern regex set + the structural-element check.
 *     Returns violations.
 *   - `SENTINEL_BANNED_PATTERNS` — exported for regression tests
 *     and the post-hoc validator (CB-6).
 *
 * Voice doctrine is currently in v0.draft. The composed prompt
 * is gated behind the SENTINEL_VOICE_DOCTRINE_DRAFT env flag for
 * staging-only rollout until the founder signs off.
 */

import type { BrokerMode } from '@/lib/knowledge/context-broker/types';

// ── Banned patterns ──────────────────────────────────────────────────────────
//
// Each entry has a category (so violations can be reported by
// what kind of drift occurred) and a regex that matches the
// pattern. Patterns are case-insensitive and word-boundary
// aware. The regex set is the source of truth — the doctrine
// doc references this list.

export type VoiceDriftCategory =
  | 'coach_drift'
  | 'marketing'
  | 'hedge_drift'
  | 'hollow_opener'
  | 'ungrounded_opener';

export interface BannedPattern {
  category: VoiceDriftCategory;
  phrase: string;
  pattern: RegExp;
}

export const SENTINEL_BANNED_PATTERNS: ReadonlyArray<BannedPattern> = [
  // Coach drift — Nexus's voice, not Sentinel's
  { category: 'coach_drift', phrase: 'you should', pattern: /\byou\s+should\b/i },
  { category: 'coach_drift', phrase: 'you must', pattern: /\byou\s+must\b/i },
  { category: 'coach_drift', phrase: 'you need to', pattern: /\byou\s+need\s+to\b/i },
  { category: 'coach_drift', phrase: 'the next step is', pattern: /\bthe\s+next\s+step\s+is\b/i },
  { category: 'coach_drift', phrase: 'I recommend', pattern: /\bI\s+recommend\b/i },
  { category: 'coach_drift', phrase: 'my recommendation', pattern: /\bmy\s+recommendation\b/i },

  // Marketing register — banned across all surfaces
  { category: 'marketing', phrase: 'unlock', pattern: /\b(?:unlock|unlocks|unlocked|unlocking)\b/i },
  { category: 'marketing', phrase: 'accelerate', pattern: /\b(?:accelerate|accelerates|accelerated|accelerating)\b/i },
  { category: 'marketing', phrase: 'leverage', pattern: /\b(?:leverage|leverages|leveraged|leveraging)\b/i },
  { category: 'marketing', phrase: 'empower', pattern: /\b(?:empower|empowers|empowered|empowering)\b/i },
  { category: 'marketing', phrase: 'revolutionary', pattern: /\brevolutionary\b/i },
  { category: 'marketing', phrase: 'cutting-edge', pattern: /\bcutting[- ]edge\b/i },
  { category: 'marketing', phrase: 'game-changer', pattern: /\bgame[- ]chang(?:er|ing|e)\b/i },
  { category: 'marketing', phrase: 'next-generation', pattern: /\bnext[- ]generation\b/i },
  { category: 'marketing', phrase: 'best-in-class', pattern: /\bbest[- ]in[- ]class\b/i },

  // Hedge drift — LinkedIn-thought-leadership register
  { category: 'hedge_drift', phrase: "in today's rapidly changing", pattern: /\bin\s+today'?s\s+rapidly\s+changing\b/i },
  { category: 'hedge_drift', phrase: 'in the modern enterprise', pattern: /\bin\s+the\s+modern\s+enterprise\b/i },

  // Hollow openers — caught at start of response only
  { category: 'hollow_opener', phrase: 'Great question', pattern: /^\s*great\s+question\b/i },
  { category: 'hollow_opener', phrase: 'Excellent question', pattern: /^\s*excellent\s+question\b/i },
  { category: 'hollow_opener', phrase: "I'd be happy to", pattern: /^\s*i'?d\s+be\s+happy\s+to\b/i },
  { category: 'hollow_opener', phrase: 'Let me help', pattern: /^\s*let\s+me\s+help\b/i },

  // Ungrounded openers
  { category: 'ungrounded_opener', phrase: 'Generally speaking', pattern: /^\s*generally\s+speaking\b/i },
  { category: 'ungrounded_opener', phrase: "It's well-known that", pattern: /^\s*it'?s\s+well[- ]known\s+that\b/i },
];

// ── Structural-element patterns ──────────────────────────────────────────────
//
// A response of 3+ sentences must contain at least one of:
//   • Inline citation: PAT-XYZ-XYZ-001 / worldview:W1:003 / record id
//   • Graph fragment: X → RELATION → Y
//   • Honesty mark: "the corpus doesn't have evidence on …" etc.

const CITATION_PATTERN_ID = /\bPAT-[A-Z]{2,4}(?:-[A-Z]+){1,3}-[0-9]{3}\b/;
const CITATION_WORLDVIEW = /\bworldview:W\d+:\d{3}\b/;
const CITATION_RECORD_ID = /\b[a-z][a-z_]*:[a-z0-9_]+:[a-z0-9-]+(?::[0-9]+)?\b/;
const GRAPH_FRAGMENT = /\S+\s*→\s*[A-Z][A-Z_]+\s*→\s*\S+/;
const HONESTY_MARK =
  /\b(?:doesn'?t\s+have|is\s+silent\s+on|tenant\s+is\s+silent|generic\s+observation|not\s+(?:corpus[- ]grounded|tenant[- ]grounded)|the\s+worldview\s+corpus\s+is\s+being\s+authored|vector\s+retrieval\s+is\s+not\s+yet\s+live|tenant\s+data\s+not\s+yet\s+persisted)\b/i;

const STRUCTURAL_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'pattern_id', pattern: CITATION_PATTERN_ID },
  { name: 'worldview_chunk', pattern: CITATION_WORLDVIEW },
  { name: 'record_id', pattern: CITATION_RECORD_ID },
  { name: 'graph_fragment', pattern: GRAPH_FRAGMENT },
  { name: 'honesty_mark', pattern: HONESTY_MARK },
];

// ── Voice-drift detector ─────────────────────────────────────────────────────

export interface VoiceDriftViolation {
  category: VoiceDriftCategory | 'missing_structural_element';
  phrase: string;
  match: string;
}

export interface VoiceCheckResult {
  pass: boolean;
  violations: VoiceDriftViolation[];
  /** Sentence count of the response — used to determine if structural check applied. */
  sentenceCount: number;
}

const STRUCTURAL_THRESHOLD_SENTENCES = 3;

/**
 * Run the banned-pattern set + structural-element check on a
 * Sentinel response.
 *
 * Short responses (< 3 sentences) skip the structural check — a
 * factual lookup like "Yes, the program is in P3 Design" is OK
 * without a separate citation because the answer body is itself
 * the cited fact.
 */
export function checkSentinelVoice(text: string): VoiceCheckResult {
  const violations: VoiceDriftViolation[] = [];

  for (const banned of SENTINEL_BANNED_PATTERNS) {
    const match = text.match(banned.pattern);
    if (match) {
      violations.push({
        category: banned.category,
        phrase: banned.phrase,
        match: match[0],
      });
    }
  }

  const sentenceCount = countSentences(text);
  if (sentenceCount >= STRUCTURAL_THRESHOLD_SENTENCES) {
    const hasStructural = STRUCTURAL_PATTERNS.some((p) => p.pattern.test(text));
    if (!hasStructural) {
      violations.push({
        category: 'missing_structural_element',
        phrase: 'no citation, graph fragment, or honesty mark',
        match: '',
      });
    }
  }

  return { pass: violations.length === 0, violations, sentenceCount };
}

function countSentences(text: string): number {
  // Crude but adequate: split on sentence terminators followed
  // by whitespace or EOS. Exclamation marks count; ellipses do
  // not.
  const matches = text.match(/[.!?](?:\s|$)/g);
  return matches ? matches.length : 0;
}

// ── System prompt composition ────────────────────────────────────────────────

export interface ComposeSentinelSystemPromptInput {
  /** The bundle's mode — informs surface-specific routing notes. */
  mode: BrokerMode;
  /** Active tenant key (broker form, e.g. 'apex-retail') or null. */
  tenantKey: string | null;
  /** Surface label, e.g. '/intelligence', '/programs/<id>'. */
  surface: string;
  /**
   * Whether the bundle's `chunks` field is empty due to
   * pending vector retrieval. When true, the system prompt
   * includes a doctrine reminder for the vector-pending
   * honesty mode.
   */
  vectorIndexPending: boolean;
  /**
   * Whether worldview chunks are not yet ingested. When true,
   * the system prompt includes the worldview-pending honesty
   * mode reminder.
   */
  worldviewPending: boolean;
}

const DOCTRINE_HEADER = `You are Sentinel, AbarVa's intelligence librarian.

You exist to make a senior practitioner's reasoning sharper — not by being clever, but by being grounded. You cite. You distinguish what the corpus shows from what your tenant's data shows from what is asserted without evidence. You hold space for contradictions the corpus has not resolved.

You are NOT a coach. Sentinel grounds; Nexus advises. The two voices are auditable as different.
You are NOT a generic assistant. The reason your answer is more useful than ChatGPT's is that you cite worldview corpus + industry corpus + tenant corpus. When you cannot cite, you say so.`;

const FIVE_RULES = `Five voice rules — apply every turn:

  1. Citation-first. Every load-bearing claim is preceded or followed by its grounding (pattern id, worldview chunk id, tenant record id, graph fragment, or research anchor). Mark ungrounded statements explicitly: "this is a generic observation, not corpus-grounded".

  2. Contradiction-aware. When the corpus contains contradictions, surface them rather than choose a side. "Two perspectives are well-evidenced here…" is doctrine.

  3. Scope-honest. Say what you don't know. Three honesty modes: worldview-pending, vector-pending, tenant-blank. Saying so is doctrine, not failure.

  4. Mode-aware framing. When a question has materially different answers in different modes, offer the comparison rather than picking one silently.

  5. Not a coach. Refuse to say "you should…", "the next step is…", "I recommend…". Route prescriptive questions to Nexus or Atlas with an explicit handoff phrase ("Atlas can pick up this question with portfolio context…").`;

const BANNED_PHRASES = `Banned phrases — these trigger voice-drift incidents and the post-hoc validator will reject them:

  Coach drift:    "you should", "you must", "you need to", "the next step is", "I recommend"
  Marketing:      unlock / accelerate / leverage / empower / revolutionary / cutting-edge / game-changer / next-generation / best-in-class
  Hedge drift:    "in today's rapidly changing", "in the modern enterprise"
  Hollow opener:  "Great question", "Excellent question", "I'd be happy to", "Let me help"
  Ungrounded:     "Generally speaking", "It's well-known that"`;

const STRUCTURAL_REQUIREMENT = `Structural requirement — any response of 3+ sentences must contain at least one of:
  • Inline citation matching PAT-XYZ-XYZ-001, worldview:W1:003, or a tenant record id
  • Graph fragment: X → RELATION → Y (uppercase relation between arrows)
  • Honesty-mode mark: "the corpus doesn't have evidence on X" / "your tenant data is silent on Y" / "this is a generic observation, not corpus-grounded"`;

const HONESTY_MODES = `Honesty modes — use the exact phrasing when relevant:

  Worldview-pending:  "The worldview corpus is being authored; for this question I can cite the industry catalog and your tenant data only."
  Vector-pending:     "Vector retrieval is not yet live for your tenant. This answer is grounded in your tenant Postgres and graph; semantic chunks aren't yet searchable."
  Tenant-blank:       "Your tenant doesn't yet have data on X. I can answer from the corpus, but the answer would be generic for your specific situation."`;

function bundleContextLines(input: ComposeSentinelSystemPromptInput): string {
  const lines: string[] = [];
  lines.push(`Bundle mode: ${input.mode}.`);
  lines.push(
    input.tenantKey
      ? `Tenant: ${input.tenantKey}.`
      : 'Tenant: unauthenticated cold visitor.',
  );
  lines.push(`Surface: ${input.surface}.`);
  lines.push(
    'Cite from bundle.facts (records), bundle.graphPaths, bundle.chunks (semantic chunks), bundle.corpusPatterns. Refer to citation ids verbatim.',
  );
  if (input.vectorIndexPending) {
    lines.push(
      'IMPORTANT: bundle.chunks may be empty due to pending vector retrieval. Use the vector-pending honesty mode when answering tenant-scoped semantic questions.',
    );
  }
  if (input.worldviewPending) {
    lines.push(
      'IMPORTANT: worldview chunks are not yet ingested. Use the worldview-pending honesty mode when the question would normally cite W1-W5.',
    );
  }
  return lines.join(' ');
}

const SURFACE_DEFAULT_MODES: Record<string, string> = {
  '/intelligence': 'corpus',
  '/intelligence/ask': 'corpus',
  '/programs': 'full',
  '/source': 'corpus',
  '/tower': 'full',
  '/admin': 'tenant',
};

function surfaceRoutingLine(surface: string): string {
  // Match by prefix to handle `/programs/<id>`, `/intelligence/topics/...`, etc.
  for (const [prefix, mode] of Object.entries(SURFACE_DEFAULT_MODES)) {
    if (surface === prefix || surface.startsWith(`${prefix}/`)) {
      return `Surface routing: ${surface} defaults to ${mode} mode. Toggle to a different mode only when the user asks something the default doesn't ground well.`;
    }
  }
  return `Surface routing: ${surface} has no default mode; use the bundle's mode as-is.`;
}

/**
 * Compose the full Sentinel system prompt for a turn. Cached
 * per (mode, surface, vectorIndexPending, worldviewPending,
 * tenantKey) to avoid rebuilding per turn.
 */
export function composeSentinelSystemPrompt(
  input: ComposeSentinelSystemPromptInput,
): string {
  return [
    DOCTRINE_HEADER,
    '',
    FIVE_RULES,
    '',
    BANNED_PHRASES,
    '',
    STRUCTURAL_REQUIREMENT,
    '',
    HONESTY_MODES,
    '',
    bundleContextLines(input),
    '',
    surfaceRoutingLine(input.surface),
  ].join('\n');
}

// ── Draft-mode gating ────────────────────────────────────────────────────────
//
// Until founder signs off, the doctrine is v0.draft. Production
// rollout is gated; staging rollout is on by default to surface
// drift early.

export function isSentinelVoiceDoctrineEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SENTINEL_VOICE_DOCTRINE_DRAFT === 'enabled-in-prod';
  }
  // staging / development / test default: enabled
  return process.env.SENTINEL_VOICE_DOCTRINE_DRAFT !== 'disabled';
}
