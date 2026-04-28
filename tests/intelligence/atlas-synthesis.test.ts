import { synthesizeAtlasAnswer } from '../../src/lib/intelligence/atlas-synthesis';
import { renderCitationFootnotes, renderInlineCitation } from '../../src/lib/intelligence/citation-renderer';
import { ATLAS_SYNTHESIS_WORD_CAP } from '../../src/lib/intelligence/synthesis-prompts';
import type { KnowledgePrimitive } from '../../src/lib/intelligence/indexer';

const primitives: KnowledgePrimitive[] = [
  {
    id: 'PAT-AI-ROLLOUT',
    kind: 'pattern',
    title: 'AI rollout evidence gating',
    content:
      'AI rollout should pause at each funding gate until adoption, value attribution, and control telemetry are measured together.',
    sourceId: 'pattern-doc',
    metadata: { domain: 'ai_programs' },
  },
  {
    id: 'SIG-COPILOT-ADOPTION',
    kind: 'signal',
    title: 'Copilot adoption below breakeven',
    content:
      'Copilot adoption is below breakeven when active usage trails the stated operating threshold for the eligible population.',
    sourceId: 'signal-doc',
  },
  {
    id: 'SOL-AI-ORCHESTRATION',
    kind: 'solution',
    title: 'AI portfolio orchestration',
    content:
      'The orchestration plan combines portfolio evidence, adoption thresholds, and renewal timing into a single executive decision path.',
    sourceId: 'solution-doc',
  },
];

describe('atlas synthesis', () => {
  it('synthesizes a deterministic answer with primitive citations', () => {
    const result = synthesizeAtlasAnswer({
      query: 'How should we govern Copilot rollout adoption?',
      primitives,
    });

    expect(result.deterministic).toBe(true);
    expect(result.answer).toContain('[SIG-COPILOT-ADOPTION]');
    expect(result.answer).toMatch(/\[(PAT-AI-ROLLOUT|SIG-COPILOT-ADOPTION|SOL-AI-ORCHESTRATION)/);
    expect(result.citations.map((citation) => citation.primitiveId)).toContain('SIG-COPILOT-ADOPTION');
    expect(result.wordCount).toBeLessThanOrEqual(ATLAS_SYNTHESIS_WORD_CAP);
  });

  it('uses stable fallback evidence and still cites corpus primitives for weak matches', () => {
    const result = synthesizeAtlasAnswer({
      query: 'What should Atlas do about an unrelated facilities question?',
      primitives,
      maxEvidence: 2,
    });

    expect(result.evidence.map((item) => item.primitive.id)).toEqual(['PAT-AI-ROLLOUT', 'SIG-COPILOT-ADOPTION']);
    expect(result.answer).toContain('[PAT-AI-ROLLOUT]');
    expect(result.citations).toHaveLength(2);
    expect(result.wordCount).toBeLessThanOrEqual(ATLAS_SYNTHESIS_WORD_CAP);
  });

  it('renders inline and footnote citations', () => {
    expect(renderInlineCitation(['PAT-AI-ROLLOUT', 'PAT-AI-ROLLOUT', 'SIG-COPILOT-ADOPTION'])).toBe(
      '[PAT-AI-ROLLOUT, SIG-COPILOT-ADOPTION]',
    );

    expect(
      renderCitationFootnotes([
        {
          primitiveId: 'PAT-AI-ROLLOUT',
          kind: 'pattern',
          title: 'AI rollout evidence gating',
          sourceId: 'pattern-doc',
        },
      ]),
    ).toEqual(['1. PAT-AI-ROLLOUT - AI rollout evidence gating (pattern). Source: pattern-doc.']);
  });

  it('builds the deterministic synthesis prompt without requesting a live model', () => {
    const result = synthesizeAtlasAnswer({
      query: 'Copilot adoption',
      primitives,
      maxEvidence: 1,
    });

    expect(result.prompt).toContain('Do not call a live model.');
    expect(result.prompt).toContain('SIG-COPILOT-ADOPTION');
    expect(result.prompt).toContain(`${ATLAS_SYNTHESIS_WORD_CAP} words`);
  });
});
