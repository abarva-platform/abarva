import { buildIntelligenceAuthorPageView, buildIntelligenceSynthesisPageView } from '@/lib/intelligence/intelligence-i6-view';
import { ATLAS_SYNTHESIS_WORD_CAP } from '@/lib/intelligence/synthesis-prompts';

describe('Intelligence I6 synthesis and authoring views', () => {
  it('builds deterministic Atlas synthesis within the word cap with citations', () => {
    const view = buildIntelligenceSynthesisPageView('How should APX-CDP-2026 use T3-H03?');

    expect(view.result.deterministic).toBe(true);
    expect(view.result.wordCount).toBeLessThanOrEqual(ATLAS_SYNTHESIS_WORD_CAP);
    expect(view.result.citations.length).toBeGreaterThan(0);
    expect(view.guardrails).toContain(`Atlas answer cap: ${ATLAS_SYNTHESIS_WORD_CAP} words.`);
  });

  it('exposes suggested synthesis queries and authoring handoff', () => {
    const view = buildIntelligenceSynthesisPageView();

    expect(view.suggestedQueries.map((query) => query.href)).toContain(
      '/intelligence/synthesize?query=What%20evidence%20supports%20Unified%20Loyalty%20Intelligence%3F',
    );
  });

  it('keeps authoring deterministic and registry-write disabled', () => {
    const view = buildIntelligenceAuthorPageView();

    expect(view.status).toBe('deterministic_intake');
    expect(view.fields.some((field) => field.state === 'locked' && field.value.includes('Disabled'))).toBe(true);
    expect(view.guardrails.join(' ')).toContain('no write to pattern registry');
  });
});
