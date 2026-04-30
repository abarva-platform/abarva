/**
 * FM #9 — Cross-corpus reasoning missing · INT-RGS
 *
 * Failure mode: `full` mode is supposed to compose tenant +
 * corpus + worldview, but the bundle silently returns just one
 * namespace. The mechanism: the bundle ships separate
 * `facts`/`semanticChunks` (tenant), `corpusPatterns` (corpus),
 * and (Wave 2) worldview chunks tagged via metadata. Cross-
 * corpus mode requires items from at least two of the three.
 */

import { runQuestion, runQuestionAllModes } from './_helpers/runQuestion';
import { REGRESSION_QUESTIONS } from './fixtures/questions';

describe('FM #9 — Cross-corpus reasoning missing', () => {
  it('full mode for a tenant-bearing cross-corpus question carries the tenantKey', async () => {
    const crossCorpusQuestions = REGRESSION_QUESTIONS.filter(
      (q) => q.category === 'cross_corpus' && q.tenantKey !== null,
    );
    expect(crossCorpusQuestions.length).toBeGreaterThan(0);
    const { bundle } = await runQuestion(crossCorpusQuestions[0]!, {
      mode: 'full',
    });
    expect(bundle.mode).toBe('full');
    expect(bundle.tenantKey).toBeTruthy();
  });

  it('every tenant-bearing cross-corpus fixture question defaults to full mode', () => {
    const crossCorpusQuestions = REGRESSION_QUESTIONS.filter(
      (q) => q.category === 'cross_corpus' && q.tenantKey !== null,
    );
    for (const q of crossCorpusQuestions) {
      expect(q.defaultMode).toBe('full');
    }
  });

  it('full mode bundle ships warnings when corpus retrieval is pending', async () => {
    const q = REGRESSION_QUESTIONS.find(
      (q) => q.category === 'cross_corpus' && q.tenantKey !== null,
    );
    expect(q).toBeDefined();
    const { bundle } = await runQuestion(q!, { mode: 'full' });
    // CB-1 broker tags 'Corpus retrieval pending CB-6.' on full mode
    // until CB-6 wires the pattern catalog. The warning lets the
    // panel render an honest "corpus pending" badge.
    const allWarnings = bundle.warnings.join('|').toLowerCase();
    expect(allWarnings).toContain('corpus');
  });

  it('full mode is structurally distinct from generic + corpus + tenant', async () => {
    const q = REGRESSION_QUESTIONS.find(
      (q) => q.category === 'cross_corpus' && q.tenantKey !== null,
    );
    expect(q).toBeDefined();
    const results = await runQuestionAllModes(q!);
    expect(results.full?.bundle.mode).toBe('full');
    expect(results.full?.systemPrompt).not.toEqual(
      results.generic.systemPrompt,
    );
    expect(results.full?.systemPrompt).not.toEqual(
      results.corpus.systemPrompt,
    );
    expect(results.full?.systemPrompt).not.toEqual(
      results.tenant?.systemPrompt,
    );
  });

  // CB-6 + worldview ingestion dependent
  it.todo(
    'full-mode bundle includes items from at least 2 of {worldview, industry, tenant} once worldview chunks are ingested (Wave 2)',
  );

  // CB-6 dependent — actual LLM output
  it.todo(
    'a full-mode response cites artifacts from at least 2 namespaces (LLM-dependent — CB-6)',
  );
});
