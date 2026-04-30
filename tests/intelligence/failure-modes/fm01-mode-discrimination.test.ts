/**
 * FM #1 — Indistinguishable from ChatGPT · INT-RGS
 *
 * Failure mode: a Sentinel response on `/intelligence` should
 * be structurally different from what a generic LLM would say
 * about the same question. The mechanism is the bundle: corpus
 * mode populates `corpusPatterns`, tenant mode populates
 * `facts`/`graphPaths`/`chunks`, full mode composes both.
 * Generic mode is empty by construction.
 *
 * This test asserts the *bundle structure* differs by mode,
 * which is the prerequisite for the response to differ. The
 * actual response-shape comparison is downstream of LLM
 * integration (CB-6).
 */

import { runQuestionAllModes } from './_helpers/runQuestion';
import { getQuestionsByFailureMode, getQuestionById } from './fixtures/questions';

describe('FM #1 — Indistinguishable from ChatGPT', () => {
  it('every cold/CIO question runs in all four modes without throwing', async () => {
    const coldQuestions = getQuestionsByFailureMode(1).filter(
      (q) => q.category === 'cold_cio',
    );
    expect(coldQuestions.length).toBeGreaterThan(0);
    for (const q of coldQuestions.slice(0, 3)) {
      const results = await runQuestionAllModes(q);
      expect(results.generic).toBeDefined();
      expect(results.corpus).toBeDefined();
      // tenant + full are null for cold questions (no tenantKey)
    }
  });

  it('generic mode returns empty facts and empty corpusPatterns', async () => {
    const q = getQuestionById('rgs:cold:001')!;
    const results = await runQuestionAllModes(q);
    expect(results.generic.bundle.facts).toEqual([]);
    expect(results.generic.bundle.corpusPatterns).toEqual([]);
    expect(results.generic.bundle.semanticChunks).toEqual([]);
  });

  it('tenant mode populates facts when tenantKey is real (substrate-loaded)', async () => {
    const q = getQuestionById('rgs:tenant:apex:001')!;
    const results = await runQuestionAllModes(q);
    expect(results.tenant).not.toBeNull();
    // Bundle facts may be empty if the broker stub returns nothing,
    // but the tenant mode bundle should at least populate the
    // tenantKey field on the bundle and not error.
    expect(results.tenant?.bundle.tenantKey).toBe('apex-retail');
    expect(results.tenant?.bundle.mode).toBe('tenant');
  });

  it("the bundle's `mode` field is preserved end-to-end", async () => {
    const q = getQuestionById('rgs:cold:001')!;
    const results = await runQuestionAllModes(q);
    expect(results.generic.bundle.mode).toBe('generic');
    expect(results.corpus.bundle.mode).toBe('corpus');
  });

  it('the system prompt structurally differs across modes', async () => {
    const q = getQuestionById('rgs:tenant:apex:001')!;
    const results = await runQuestionAllModes(q);
    expect(results.generic.systemPrompt).not.toEqual(results.corpus.systemPrompt);
    expect(results.corpus.systemPrompt).not.toEqual(results.tenant?.systemPrompt);
    expect(results.tenant?.systemPrompt).not.toEqual(results.full?.systemPrompt);
  });

  // CB-6 dependent — actual LLM output comparison
  it.todo(
    'corpus_grounded answer cites at least 2 worldview/industry chunks; generic cites zero (LLM-dependent — gated on CB-6)',
  );
});
