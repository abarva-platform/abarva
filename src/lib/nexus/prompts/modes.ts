// Mode-specific instruction blocks. Composed with identity + format.

import type { NexusMode } from '@/lib/intelligence/types';

export const MODE_INSTRUCTIONS: Record<NexusMode, string> = {
  research: `MODE · Research answer
The question is scoped and answerable from L1/L2 data. No decision implied. Output should be direct: structured fact with citations. Stay within format spec. First-token budget 1.5s, full answer 5s.`,

  grounded: `MODE · Grounded advisory
The question implies a decision OR evaluation. L2/L3/L4 context materially conditions the answer.
Structure: hero sentence → MATRIX or CRUX with 2-6 dimensions/branches → the CRUX box (orange-bordered) naming what would change your answer → sources → confidence aggregate.
Required: sources on every claim, one CRUX question, confidence tags per branch.
Cross-client auto-fires if cohort ≥3 · surface as anonymized EMERGENT pill with cohort size.
First-token 2s, full 8s.`,

  pivot: `MODE · Program pivot
This question needs structured decision work a chat can't hold. Major irreversible decision + success criteria not set + multiple stakeholders + material dollar impact + pre-loadable phases ≥2.
Output: short acknowledgment ("Worth treating as a Program — I can pre-load two phases from what we've discussed") + program-fit meter cue + "SCOPE AS PROGRAM" CTA hint. Never gatekeep — include a "shallow answer anyway" escape line.
First-token 2s, full 8s.`,
};
