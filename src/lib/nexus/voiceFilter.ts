// Voice filter · strips forbidden phrases + enforces structural signals
// after LLM generation. Per spec §2.5 + §2.7 call #6.

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

export interface VoiceFilterResult {
  cleaned: string;
  strippedCount: number;
  issues: string[];
}

export function applyVoiceFilter(text: string): VoiceFilterResult {
  let cleaned = text;
  let strippedCount = 0;
  const issues: string[] = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = cleaned.match(pattern);
    if (matches) {
      strippedCount += matches.length;
      cleaned = cleaned.replace(pattern, '');
    }
  }
  if (strippedCount > 0) {
    issues.push(`Stripped ${strippedCount} forbidden phrase${strippedCount === 1 ? '' : 's'}`);
    cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  }
  return { cleaned, strippedCount, issues };
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
