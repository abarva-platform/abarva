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

  it('bumps the prompt version so downstream caches invalidate', () => {
    // Prompt versions are part of telemetry; the guardrail change must be
    // reflected so we can attribute behavior shifts in post-merge dashboards.
    expect(ATLAS_PROMPT_VERSION).toContain('banned-phrase-guard');
  });
});
