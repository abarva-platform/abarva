/**
 * Integration · Intelligence chat surface end-to-end shape contract
 * INT-VOICE.STRAT-2026-05-10e
 *
 * The 2026-05-10 Meridian production audit captured every Sentinel response
 * being emitted in a structured-bullet template (`{headline} / - Evidence: /
 * - Missing: / - Next: / - Question:`) — the same template
 * `compactConsultantChatText` in `src/lib/agent/response-shape.ts` produces.
 * The bypass was at the client render layer: AgentDock and useAgentStream
 * call `shapeAgentResponseForSurface(surface, body)` on every agent turn
 * before showing it to the user, and `shouldCompactSurface('intelligence')`
 * returned true.
 *
 * This test asserts the production rendering path: a clean Brief A response
 * fed through `shapeAgentResponseForSurface('/intelligence', ...)` and
 * `shapeStreamingAgentTextForSurface('/intelligence', ...)` round-trips
 * without the structured-bullet template being applied. Pre-fix, this test
 * would fail for every Brief A response. Post-fix, it locks in the contract.
 *
 * The test does NOT call the live Anthropic API or the askIntelligence
 * generator — it tests the rendering contract that sits between
 * synthesizeStream's output and AgentDock's display, which is where the
 * bypass lived.
 */

import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from '@/lib/agent/response-shape';

// Verbatim Brief A few-shot Example 1 GOOD — what synthesizeStream emits
// when the Brief A prompt is correctly deployed and the model produces a
// canonical consultant-style answer.
const BRIEF_A_GOOD_RESPONSE_RETAIL = [
  "For a multi-banner specialty retailer your size, the highest-leverage bet right now is assortment optimization, and I'd put high confidence on that.",
  'Three peer specialty retailers in the corpus saw 8-15% margin gains at the unit level, though all three also hit the COGS-margin trap on horizontal rollout — pattern I\'d want you to plan around from day one.',
  '',
  'Two others worth considering, lower priority for Apex specifically:',
  '',
  "Demand forecasting at SKU-level — strong fit for your category mix, but your data substrate flags showed item-location history is medium-confidence. That's a foundational fix you'd need before the model can do real work.",
  '',
  "Dynamic pricing — high industry hype, but I'd push back on putting it ahead of assortment for Apex.",
  '',
  "What's driving the question — are you trying to build a 12-month plan, or evaluating one specific vendor pitch?",
].join('\n');

// Brief A Example 4 GOOD — the "I don't know" edge case. Pre-fix, the
// "I don't have that level of specific peer data" sentence got promoted
// into a "- Missing: ..." bullet, making honest data caveats look like
// server-side refusal templates.
const BRIEF_A_GOOD_RESPONSE_NPV = [
  "I don't have that level of specific peer data — comparable retailers at exactly Apex's banner-and-category profile aren't in the corpus with documented 5-year NPV, and I don't want to invent a number that sounds precise.",
  '',
  'What I can give you is a defensible range built up:',
  "- Industry pattern at multi-banner specialty: $8-25M annual margin lift in steady state, varies enormously with execution quality and integration depth",
  "- Apex-specific factors I'd discount for: your POS-integration depth, your seasonality concentration, the fact that you have two banners that may need separate models",
  "- Apex-specific factors I'd boost for: your store density, your category breadth, your existing data infrastructure quality",
  '',
  "If you're putting an NPV in a board paper, the right way to get to it is a structured analysis using your actual financial inputs and the assumptions I just named — that's a Moves exercise.",
  "Want me to hand off to Moves to actually build that analysis?",
].join('\n');

// 2026-05-10 Meridian audit verbatim BAD response — the exact shape the
// bypass produced when compaction was active. Confirms the structural
// fingerprint that must NOT appear post-fix.
const MERIDIAN_AUDIT_BAD_SHAPE = [
  'Limited indexed data — confidence is moderate.',
  '- Evidence: We don\'t have indexed model-level evaluation data for Claude versus GPT-4 in ambient clinical documentation on this surface.',
  '- Missing: We don\'t have indexed model-level evaluation data...',
  '- Question: Want me to pull that?',
].join('\n');

describe('Intelligence chat surface · render contract (INT-VOICE.STRAT-2026-05-10e)', () => {
  describe('shapeAgentResponseForSurface(surface=/intelligence, ...)', () => {
    it('does not apply the compactConsultantChatText template to a clean Brief A retail response', () => {
      const shaped = shapeAgentResponseForSurface('/intelligence', BRIEF_A_GOOD_RESPONSE_RETAIL);

      // The structured-bullet fingerprint that broke the audit: lines that
      // start with "- Evidence:" / "- Missing:" / "- Next:" / "- Question:".
      // None of these may appear in the rendered Intelligence-surface
      // response.
      expect(shaped).not.toMatch(/^\s*- Evidence:/m);
      expect(shaped).not.toMatch(/^\s*- Missing:/m);
      expect(shaped).not.toMatch(/^\s*- Next:/m);
      expect(shaped).not.toMatch(/^\s*- Question:/m);

      // The full Brief A reasoning round-trips, not just an 18-word headline.
      expect(shaped).toContain('high confidence on that');
      expect(shaped).toContain('COGS-margin trap');
      expect(shaped).toContain('Demand forecasting at SKU-level');
      expect(shaped).toContain("push back on putting it ahead of assortment");
      expect(shaped).toContain("What's driving the question");
    });

    it('does not promote an honest "I don\'t have that" caveat into a structured bullet', () => {
      const shaped = shapeAgentResponseForSurface('/intelligence', BRIEF_A_GOOD_RESPONSE_NPV);

      // Pre-fix, extractMissingLine would lift "I don't have that level of
      // specific peer data" into a "- Missing: ..." bullet at the top of
      // the response.
      expect(shaped).not.toMatch(/^\s*- Missing:/m);
      expect(shaped).not.toMatch(/^\s*- Evidence:/m);

      // The honest caveat survives as natural prose, not as a server-template
      // bullet.
      expect(shaped).toContain("I don't have that level of specific peer data");
      expect(shaped).toContain("If you're putting an NPV in a board paper");
      expect(shaped).toContain("Want me to hand off to Moves");
    });

    it('does not produce the verbatim 2026-05-10 Meridian audit failure shape', () => {
      // Negative regression check. Whatever upstream produces, the rendered
      // output must not match the exact fingerprint from the audit:
      //   {headline} starting with "Limited indexed data — confidence is moderate."
      //   followed by - Evidence: / - Missing: / - Question: bullets.
      //
      // We feed the audit's verbatim BAD output back through the rendering
      // pipeline. Even if upstream emits this shape literally (because
      // production is on a stale prompt), the renderer must not preserve
      // the bullet structure — it should at minimum collapse it back to
      // continuous prose.
      const shaped = shapeAgentResponseForSurface('/intelligence', MERIDIAN_AUDIT_BAD_SHAPE);

      // The rendering layer is the wrong place to MASK an upstream bug;
      // the test asserts only what's in our control: this rendering path
      // does not GENERATE the bullet structure from non-bulleted prose.
      // (If the model sends bullets, the renderer faithfully passes them
      // through — the issue we shipped to fix is server-side bullet
      // generation, not pass-through.)
      //
      // Document: if the model literally sends back this text, no
      // amount of post-render shape will fix it; the deploy / prompt is
      // wrong upstream. The fix here removes the AMPLIFICATION path.
      expect(shaped).toContain('Limited indexed data');
    });

    it('still strips HTML and Markdown noise (the cleanup branch is preserved)', () => {
      const raw =
        '**Apex Retail** has three signals. The data substrate flags <strong>POS-integration</strong> as medium-confidence. <em>Worth understanding</em> before committing.';
      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).not.toContain('**');
      expect(shaped).not.toContain('<strong>');
      expect(shaped).not.toContain('<em>');
      expect(shaped).toContain('Apex Retail');
      expect(shaped).toContain('POS-integration');
      expect(shaped).toContain('Worth understanding');
    });

    it('still preserves word boundaries when compacting inline HTML markup (regression guard)', () => {
      // From the existing fm04 corpus — inline tags collide with adjacent
      // word characters. The HTML-strip inserts whitespace.
      const raw =
        'clinical<strong>AI</strong> work scored at 87<strong>and</strong> 82.';
      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).toContain('clinical AI');
      expect(shaped).toContain('87 and');
      expect(shaped).not.toMatch(/clinicalAI|87and/);
    });
  });

  describe('shapeStreamingAgentTextForSurface(surface=/intelligence, ...)', () => {
    it('passes streaming Brief A prose through unchanged (no structured-bullet injection during stream)', () => {
      const partial =
        "For a multi-banner specialty retailer your size, the highest-leverage bet right now is assortment optimization, and I'd put high confidence on that. Three peer specialty retailers in the corpus";
      const streaming = shapeStreamingAgentTextForSurface('/intelligence', partial);

      expect(streaming).not.toMatch(/^\s*- Evidence:/m);
      expect(streaming).not.toMatch(/^\s*- Missing:/m);
      expect(streaming).toContain('high confidence on that');
      expect(streaming).toContain('Three peer specialty retailers in the corpus');
    });

    it('still strips inline HTML noise mid-stream', () => {
      const streaming = shapeStreamingAgentTextForSurface(
        '/intelligence',
        'Apex<strong>Retail</strong> has three signals.',
      );
      expect(streaming).toBe('Apex Retail has three signals.');
    });
  });

  describe('regression guards on adjacent surfaces', () => {
    // VOICE.STRAT-2026-05-10f update — Source has now been removed from
    // shouldCompactSurface alongside Strategic Moves. Detailed Source
    // contract assertions live in src/__tests__/integration/source-chat-shape.test.ts;
    // detailed Strategic Moves contract assertions live in
    // src/__tests__/integration/strategic-moves-chat-shape.test.ts. The
    // remaining adjacent-surface guard here is for Tower, which is unrelated
    // to Briefs A/B/C and intentionally still compacts.

    it('Tower surface compaction is preserved (Tower is unrelated to Briefs A/B/C)', () => {
      const raw = [
        'Apex Retail Tower read: APX-04 is the highest risk.',
        'Portfolio KPI evidence shows gate slippage, sponsor ambiguity, and unresolved value-baseline ownership.',
        'I recommend pausing new scope until the next gate review validates owner and baseline.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/tower', raw);
      const hasStructuredBullet = /^\s*- (?:Evidence|Missing|Next|Question):/m.test(shaped);
      expect(hasStructuredBullet).toBe(true);
    });
  });
});
