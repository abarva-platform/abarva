/**
 * System-prompt guardrails — banned-phrase honesty discipline (Atlas ME-1).
 *
 * The IAC archetype copy is already protected by tests
 * (`src/lib/atlas/iac/__tests__/honesty-invariants.test.ts`): no archetype may
 * use "industry standard", "everyone is doing", or "best practice" verbatim.
 *
 * But the LLM that synthesizes Atlas responses was unconstrained — the model
 * was free to use the phrases when asked. The Atlas IAC e2e (ME-1) showed the
 * phrases passing through verbatim.
 *
 * This test pins the guardrail clause into the Atlas system prompt so a future
 * prompt refactor that drops the clause fails loudly.
 */

import { createHash } from 'node:crypto';

import { buildAtlasSystemPrompt, ATLAS_PROMPT_VERSION } from '@/lib/atlas/prompt';

const BANNED_PHRASES = [
  'industry standard',
  'everyone is doing',
  'best practice',
];

describe('Atlas system prompt — banned-phrase guardrail', () => {
  const prompt = buildAtlasSystemPrompt('Apex Retail');

  it.each(BANNED_PHRASES)(
    'instructs the model not to use the literal phrase "%s"',
    (phrase) => {
      // The guard clause must mention each banned phrase verbatim so the
      // model knows exactly which strings are forbidden.
      expect(prompt.toLowerCase()).toContain(phrase.toLowerCase());
    },
  );

  it('frames the rule under an explicit Honesty discipline section', () => {
    // A future refactor that splits the prompt could drop the framing; this
    // pins the section label so the discipline stays grouped and findable.
    expect(prompt).toContain('Honesty discipline:');
  });

  it('tells the model to cite sources by name + date instead of appealing to consensus', () => {
    // The fix is not just "don't say the phrase"; it must redirect the model
    // toward specific provenance. Without this clause, the model would just
    // paraphrase ("widely adopted", "common across the industry") and defeat
    // the guard.
    expect(prompt).toMatch(/cite sources by name and date|cite sources/i);
    expect(prompt).toMatch(/cohort|peer|survey|vendor report/i);
  });

  // T-010 (2026-09-19). This case asserted that ATLAS_PROMPT_VERSION contains
  // 'banned-phrase-guard'. ATLAS_PROMPT_VERSION is a single mutable token
  // naming the LATEST prompt change, so #4037 renamed it to
  // 'tower-w7-visible-answer-contract' on 2026-06-27 and the case has been
  // unsatisfiable ever since — no prompt change could ever make it pass
  // again without reverting a later one. Pinning a historical token was
  // never the control anyway. The control the comment describes is that the
  // version MOVES whenever the prompt text moves, so downstream caches
  // invalidate and telemetry can attribute a behaviour shift. That is what
  // is asserted now: the composed prompt is fingerprinted and paired with
  // the version that shipped it.
  it('moves the prompt version whenever the composed prompt changes', () => {
    const SHIPPED_WITH_VERSION = 'tower-w7-visible-answer-contract';
    const SHIPPED_PROMPT_DIGEST =
      '55069f950f1760b90c27b6b631b44311e53804d8d69800262d1e4ceb806598eb';

    const digest = createHash('sha256')
      .update(buildAtlasSystemPrompt('Apex Retail'))
      .digest('hex');

    if (ATLAS_PROMPT_VERSION === SHIPPED_WITH_VERSION) {
      expect(
        digest === SHIPPED_PROMPT_DIGEST
          ? digest
          : `the Atlas system prompt changed while ATLAS_PROMPT_VERSION stayed ` +
            `"${SHIPPED_WITH_VERSION}". Bump the version so downstream caches ` +
            `invalidate, then update SHIPPED_WITH_VERSION and ` +
            `SHIPPED_PROMPT_DIGEST (${digest}) in this test.`,
      ).toBe(SHIPPED_PROMPT_DIGEST);
    }
  });
});
