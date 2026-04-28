import { synthesizeAtlasAnswer, type AtlasSynthesisResult } from './atlas-synthesis';
import { ATLAS_SYNTHESIS_WORD_CAP } from './synthesis-prompts';

export interface IntelligenceSynthesisPageView {
  query: string;
  result: AtlasSynthesisResult;
  guardrails: string[];
  suggestedQueries: Array<{ label: string; href: string }>;
}

export interface IntelligenceAuthorPageView {
  title: string;
  status: 'deterministic_intake';
  fields: Array<{ label: string; value: string; state: 'required' | 'optional' | 'locked' }>;
  guardrails: string[];
  nextSteps: string[];
}

const DEFAULT_SYNTHESIS_QUERY = 'How should APX-CDP-2026 use T3-H03 for the P3 Design build gate?';

export function buildIntelligenceSynthesisPageView(query = DEFAULT_SYNTHESIS_QUERY): IntelligenceSynthesisPageView {
  const result = synthesizeAtlasAnswer({ query });

  return {
    query,
    result,
    guardrails: [
      'Deterministic corpus only — no live Atlas model call in I6.',
      `Atlas answer cap: ${ATLAS_SYNTHESIS_WORD_CAP} words.`,
      'Every substantive answer sentence carries corpus primitive citations.',
    ],
    suggestedQueries: [
      {
        label: 'CDP build-gate synthesis',
        href: '/intelligence/synthesize?query=How%20should%20APX-CDP-2026%20use%20T3-H03%20for%20the%20P3%20Design%20build%20gate%3F',
      },
      {
        label: 'Loyalty intelligence evidence',
        href: '/intelligence/synthesize?query=What%20evidence%20supports%20Unified%20Loyalty%20Intelligence%3F',
      },
      {
        label: 'Pattern contradiction check',
        href: '/intelligence/synthesize?query=What%20contradictions%20should%20Sentinel%20review%20before%20promotion%3F',
      },
    ],
  };
}

export function buildIntelligenceAuthorPageView(): IntelligenceAuthorPageView {
  return {
    title: 'Pattern authoring intake',
    status: 'deterministic_intake',
    fields: [
      { label: 'Pattern name', value: 'Unified Loyalty Intelligence extension', state: 'required' },
      { label: 'Tier', value: 'T3 · Use-case', state: 'required' },
      { label: 'Problem statement', value: 'Personalization logic needs a reusable CDP-plus-loyalty pattern before Build starts.', state: 'required' },
      { label: 'Evidence links', value: 'T3-H03, APX-CDP-2026, AMS Vendor C integration evidence', state: 'optional' },
      { label: 'Runtime submission', value: 'Disabled until live authoring workflow is approved.', state: 'locked' },
    ],
    guardrails: [
      'Authoring is deterministic in I6; no write to pattern registry occurs from this page.',
      'Submitted candidates must preserve source provenance before Sentinel review.',
      'Atlas may synthesize draft framing, but Sentinel validates promotion readiness.',
    ],
    nextSteps: [
      'Draft pattern summary from the required fields.',
      'Attach evidence primitives and affected program links.',
      'Route to Sentinel review before promotion into the library.',
    ],
  };
}
