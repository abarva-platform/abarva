// Format classifier · picks 1 of 8 response formats from (mode, query).
// Lightweight heuristic; Haiku could later replace this with a learned
// classifier (spec §2.7 call #1).

import type { NexusFormat, NexusMode } from '@/lib/intelligence/types';

export interface FormatClassifierInput {
  query: string;
  mode: NexusMode;
  needsClarification: boolean;
  userOverride?: NexusFormat;
  isCounterRequest?: boolean;
}

export function classifyFormat(input: FormatClassifierInput): NexusFormat {
  if (input.userOverride) return input.userOverride;
  if (input.isCounterRequest) return 'counter_pair';
  if (input.needsClarification) return 'clarification';

  const q = input.query.toLowerCase();

  // Artifact · explicit deliverable request
  if (/\b(draft|write|one[- ]pager|brief|memo|report|pdf)\b/.test(q)) return 'artifact';

  // Matrix · comparison requested
  if (/\bvs\b|\bversus\b|\bcompare\b|\bside[- ]by[- ]side\b/.test(q)) return 'matrix';

  // CRUX · decision framing (Mode 2 default)
  if (input.mode === 'grounded' && /\bshould|which|pick|choose|decide\b/.test(q)) return 'crux';

  // Ranked list · top-N
  if (/\btop\s*\d+|ranking|best \w+|list (of|the)\b/.test(q)) return 'ranked_list';

  // One-sentence · crisp factual
  if (input.mode === 'research' && q.length < 80 && /\bwhat is|define|summary|summarize\b/.test(q)) {
    return 'one_sentence';
  }

  // Default by mode
  if (input.mode === 'grounded') return 'crux';
  if (input.mode === 'pivot') return 'crux';
  return 'one_sentence';
}
