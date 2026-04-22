// Voice filter · strips forbidden phrases + internal signal tags before
// text is rendered to the user. Per spec §2.5 + §2.7 call #6.

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\bas an AI (language )?model\b/gi,
  /\bI think\b/gi,
  /\bI believe\b/gi,
  /\bI feel\b/gi,
  /\bgreat question[!.]?/gi,
  /\blet me know if you need anything else\b/gi,
  /\bhope that helps[!.]?/gi,
  /\bI apologize\b/gi,
  /\bI'm sorry\b/gi,
  /\bI'll try my best\b/gi,
];

// Generic internal-signal tag stripper. Matches any `<foo_bar>...</foo_bar>`
// block where the tag name is snake_case ASCII and the inner content is
// mostly-JSON-shaped. Catches <engagement_ready>, <gate_approval>, and any
// future signal tag the model might emit — no per-tag patch needed.
//
// Rationale: the first instance of this class of bug was <engagement_ready>
// leaking into chat (test drive #1, morning of 2026-04-21). Second was
// <gate_approval> in the afternoon Phase 0 test drive. Generic stripper
// closes the class, not just each instance.
const INTERNAL_SIGNAL_TAG = /<([a-z][a-z0-9_]*)>([\s\S]*?)<\/\1>/g;

// Only strip tags whose content looks like a JSON object · prevents false
// positives on legitimate prose like <em>foo</em> that might slip in.
function contentLooksLikeJson(inner: string): boolean {
  const trimmed = inner.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    // Permissive · the model can emit slightly malformed JSON while streaming
    return /"\w+"\s*:\s*/.test(trimmed);
  }
}

export interface VoiceFilterResult {
  cleaned: string;
  strippedCount: number;
  issues: string[];
}

export function applyVoiceFilter(text: string): VoiceFilterResult {
  let cleaned = text;
  let strippedCount = 0;
  const issues: string[] = [];

  // 1 · Strip internal signal tags (<foo_bar>{json}</foo_bar>)
  const tagsStripped: string[] = [];
  cleaned = cleaned.replace(INTERNAL_SIGNAL_TAG, (match, tagName, inner) => {
    if (contentLooksLikeJson(String(inner))) {
      tagsStripped.push(String(tagName));
      return '';
    }
    return match;
  });
  if (tagsStripped.length > 0) {
    strippedCount += tagsStripped.length;
    issues.push(`Stripped ${tagsStripped.length} internal signal tag${tagsStripped.length === 1 ? '' : 's'} (${Array.from(new Set(tagsStripped)).join(', ')})`);
  }

  // 2 · Strip forbidden phrases
  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = cleaned.match(pattern);
    if (matches) {
      strippedCount += matches.length;
      cleaned = cleaned.replace(pattern, '');
    }
  }

  if (strippedCount > 0) {
    if (tagsStripped.length < strippedCount) {
      issues.push(`Stripped ${strippedCount - tagsStripped.length} forbidden phrase${strippedCount - tagsStripped.length === 1 ? '' : 's'}`);
    }
    cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  }
  return { cleaned, strippedCount, issues };
}

/**
 * Live-strip for streaming chat renders. Cuts content at the first
 * `<tag_name>` open so the JSON scaffold never flashes on screen while
 * waiting for the closing tag. Complements applyVoiceFilter which runs
 * post-stream.
 */
export function liveStripInternalTags(text: string): string {
  const openIdx = text.search(/<[a-z][a-z0-9_]*>/);
  if (openIdx === -1) return text;
  // Try to find the matching close tag and cut both
  const match = text.match(INTERNAL_SIGNAL_TAG);
  if (match) {
    return text.replace(INTERNAL_SIGNAL_TAG, (m, _name, inner) => (contentLooksLikeJson(String(inner)) ? '' : m)).trimEnd();
  }
  // Opening tag streamed but closing hasn't arrived · hide from the opener on
  return text.slice(0, openIdx).trimEnd();
}

// Apply the filter to any string values within a JSON payload (used for
// structured format outputs).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterPayload<T extends Record<string, any>>(payload: T): { filtered: T; strippedCount: number } {
  let strippedCount = 0;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const r = applyVoiceFilter(v);
      strippedCount += r.strippedCount;
      return r.cleaned;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) out[k] = walk(val);
      return out;
    }
    return v;
  };
  return { filtered: walk(payload) as T, strippedCount };
}
