// Format specs · 8 output shapes per Packet 3. The composer emits structured
// JSON that matches the NexusTurnPayload shape so the UI can render without
// parsing prose.

import type { NexusFormat } from '@/lib/intelligence/types';

export const FORMAT_INSTRUCTIONS: Record<NexusFormat, string> = {
  one_sentence: `FORMAT · ONE-SENTENCE
Return JSON: { "format": "one_sentence", "answer": "<single sentence>", "confidence": "high|medium|low", "sources": [<1 source pill>] }.
Max 1 sentence + 1 citation.`,

  matrix: `FORMAT · MATRIX / COMPARISON
Return JSON: { "format": "matrix", "hero": "<short directional sentence>", "dimensions": [ { "name": "<dimension>", "values": [ { "option": "<name>", "value": "<cell>", "winner": true|false, "confidence": "high|medium|low" } ] } ], "sources": [...] }.
Max 6 dimensions · max 4 options per dimension. Mark winner cells explicitly.`,

  crux: `FORMAT · CRUX
Return JSON: { "format": "crux", "framing": "<1-sentence framing>", "crux": "<the fork — what actually decides this>", "branches": [ { "verdict": "Pick X if...", "condition": "<condition>", "confidence": "high|medium|low" } ], "sources": [...] }.
3-5 branches max. More → collapse least-likely into "edge cases".`,

  ranked_list: `FORMAT · RANKED LIST
Return JSON: { "format": "ranked_list", "framing": "<why this order matters>", "items": [ { "title": "<item>", "rationale": "<1-line>", "source": <source pill>, "confidence": "..." } ], "sources": [...] }.
Max 10 items. Order matters — explain in framing.`,

  artifact: `FORMAT · ARTIFACT
Return JSON: { "format": "artifact", "artifact_type": "brief|memo|chart|one_pager|custom_html", "artifact_html": "<cream-paper HTML>", "artifact_metadata": { "title": "...", "prepared_for": "...", "date": "..." } }.
Full HTML render · cream paper · Georgia serif body · print-ready.`,

  clarification: `FORMAT · CLARIFICATION
Return JSON: { "format": "clarification", "question": "<1-sentence fork>", "options": [ { "label": "...", "context": "<1-line>" } ] }.
Max 3 tap-options + "type your own" escape exists at UI layer.`,

  counter_pair: `FORMAT · COUNTER-PAIR
Return JSON: { "format": "counter_pair", "counter_card": <nested format payload>, "tiebreaker": { "question": "<empirical question>", "resolver": "<who/what resolves it>", "effort": "<short estimate>" } }.
Used for capability 6 · must name what evidence settles it.`,

  idk: `FORMAT · I DON'T KNOW
Return JSON: { "format": "idk", "why_dont_know": "<what's outside the foundation>", "who_would_know": "<person or source>" }.
Honest. No apology. No "I'll try my best".`,
};
