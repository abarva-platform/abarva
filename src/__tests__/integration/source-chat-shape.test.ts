/**
 * Integration · Source chat surface end-to-end shape contract
 * SRC-VOICE.STRAT-2026-05-10f
 *
 * Companion to intelligence-chat-shape.test.ts. The 2026-05-10 production
 * audit pattern that found the Sentinel render-bypass applies identically
 * to the Source surface: every advisor turn was passing through
 * compactConsultantChatText at render time and being mangled into a
 * structured-bullet template. Brief C explicitly requires natural advisor
 * prose; the compaction template is a Brief C violation by construction.
 *
 * This test feeds the verbatim Brief C few-shot examples through the
 * Source surface render pipeline and asserts the prose round-trips
 * without the structured-bullet template being applied.
 */

import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from '@/lib/agent/response-shape';

// Brief C Example 1 GOOD — vendor shortlist with rationale. Verbatim from
// docs/build/CURSOR_BRIEF_C_SOURCE.md.
const BRIEF_C_EXAMPLE_1_VENDOR_SHORTLIST = [
  'Three credible vendors for your specific situation, with my read on each:',
  '',
  "Algonomy is the strongest fit at the capability level. They have the most mature multi-banner specialty retail playbook, customer evidence is deep, and they've been at this long enough to have real implementation patterns rather than learning on your dime. The trade-off: they're a bigger ship. Less likely to customize deeply for Apex's specific banner structure. High confidence on capability, medium-high on fit. I'd put them at the top of the shortlist.",
  '',
  "Daisy Intelligence is a credible second. Strong work in adjacent retail (grocery, high-velocity specialty), and their assortment work specifically is more recent — fewer documented case studies than Algonomy at multi-banner specialty. Their financial health appears stable, customer references are strong. Worth shortlisting if you want a partner that will customize more aggressively.",
  '',
  "Antuit.ai is the credible third. Forecasting + assortment combined, which matches the integrated work you described. Caveat: smaller team, narrower customer base. I'd shortlist for a competitive bid but I'd be careful about depending on them as the sole vendor.",
  '',
  "I'd drop the bigger horizontal players (Salesforce Commerce Cloud, etc.) — capability is broader but assortment is not their lead, and you'd be paying for things you don't need.",
].join('\n');

// Brief C Example 2 GOOD — pushing back on a stated preference. The CXO has
// already decided; Source's job is independent advocacy.
const BRIEF_C_EXAMPLE_2_PUSH_BACK = [
  "Before we go to contract, I'd push back on locking in here. Three things I'd want you to look at:",
  '',
  'Their specialty modules — which is what you\'d be using for your specific use case — have meaningfully thinner customer evidence than their primary product. The corpus has reasonable evidence on the primary product; on the specialty modules, customer references are mostly recent and small-scale.',
  '',
  'Their financial situation worries me. Their last funding round (publicly disclosed) was at a flat valuation, and they had a leadership transition six months ago. Both are signals — not disqualifying on their own, but worth understanding before signing a 3-year contract.',
  '',
  "I'm not saying don't pick them. I'm saying don't pick them yet.",
].join('\n');

// Brief C Example 4 GOOD — honest about what's missing. Pre-fix, the
// "I don't have visibility into Apex's current AI tooling spend" line got
// promoted into a structured "- Missing: ..." bullet by extractMissingLine.
const BRIEF_C_EXAMPLE_4_MISSING_TENANT_FACT = [
  "I don't have visibility into Apex's current AI tooling spend — that would be in your procurement or finance data, not in what's connected to me. Your finance team or procurement function would have the actual numbers.",
  '',
  'What I can give you on the comparison side: pattern range from corpus for multi-banner specialty retailers your size is roughly $3-15M annual on AI tooling and platforms, but it varies enormously based on what\'s counted (do you include the analytics platform spend? POS-AI features? specialty AI vendors?). Without your actual number and a defined scope of what counts, peer comparison would be apples-to-oranges.',
  '',
  'If you want a real benchmark, the work is: get the number from finance, define the scope of what\'s included, and I can help structure a peer-comparable view from corpus pattern data and adjacent customer references.',
].join('\n');

// Brief C Example 5 GOOD — off-scope question. Lane-discipline decline.
const BRIEF_C_EXAMPLE_5_OFF_SCOPE = [
  "That's outside what I do — I'm focused on vendor selection for AI initiatives. If you need to longlist vendors, build an RFP, evaluate vendor fit, or work through contract patterns, that's where I can help.",
].join('\n');

describe('Source chat surface · render contract (SRC-VOICE.STRAT-2026-05-10f)', () => {
  describe('shapeAgentResponseForSurface(surface=source, ...)', () => {
    it('does not apply the compactConsultantChatText template to the Brief C vendor shortlist', () => {
      const shaped = shapeAgentResponseForSurface('source', BRIEF_C_EXAMPLE_1_VENDOR_SHORTLIST);

      expect(shaped).not.toMatch(/^\s*- Evidence:/m);
      expect(shaped).not.toMatch(/^\s*- Missing:/m);
      expect(shaped).not.toMatch(/^\s*- Next:/m);
      expect(shaped).not.toMatch(/^\s*- Question:/m);
      // The full Brief C reasoning round-trips, not just an 18-word headline.
      expect(shaped).toContain('Three credible vendors');
      expect(shaped).toContain('Algonomy is the strongest fit');
      expect(shaped).toContain('Daisy Intelligence is a credible second');
      expect(shaped).toContain('Antuit.ai is the credible third');
      expect(shaped).toContain("I'd drop the bigger horizontal players");
    });

    it('preserves Brief C push-back prose without rewriting it into bullets', () => {
      const shaped = shapeAgentResponseForSurface('source', BRIEF_C_EXAMPLE_2_PUSH_BACK);

      expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question):/m);
      expect(shaped).toContain("I'd push back on locking in here");
      expect(shaped).toContain('thinner customer evidence than their primary product');
      expect(shaped).toContain('flat valuation');
      expect(shaped).toContain("I'm not saying don't pick them");
    });

    it('does not promote "I don\'t have visibility into..." into a "- Missing:" bullet', () => {
      const shaped = shapeAgentResponseForSurface('source', BRIEF_C_EXAMPLE_4_MISSING_TENANT_FACT);

      // Pre-fix, extractMissingLine would lift this line into "- Missing: ..."
      expect(shaped).not.toMatch(/^\s*- Missing:/m);
      expect(shaped).not.toMatch(/^\s*- Evidence:/m);
      expect(shaped).toContain("I don't have visibility into Apex's current AI tooling spend");
      expect(shaped).toContain('pattern range from corpus');
      expect(shaped).toContain('a real benchmark');
    });

    it('preserves the Brief C off-scope decline as natural prose, not as a "- Next:" template', () => {
      const shaped = shapeAgentResponseForSurface('source', BRIEF_C_EXAMPLE_5_OFF_SCOPE);

      expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question):/m);
      expect(shaped).toContain("That's outside what I do");
      expect(shaped).toContain("longlist vendors, build an RFP, evaluate vendor fit");
    });

    it('still strips HTML markup and Markdown bold without compacting (cleanup branch preserved)', () => {
      const raw =
        '**Algonomy** is the strongest fit. The corpus shows <strong>three peer specialty retailers</strong> with positive results.';
      const shaped = shapeAgentResponseForSurface('source', raw);

      expect(shaped).not.toContain('**');
      expect(shaped).not.toContain('<strong>');
      expect(shaped).toContain('Algonomy');
      expect(shaped).toContain('three peer specialty retailers');
    });
  });

  describe('shapeStreamingAgentTextForSurface(surface=source, ...)', () => {
    it('passes streaming Brief C prose through unchanged (no structured-bullet injection during stream)', () => {
      const partial =
        "Three credible vendors for your specific situation. Algonomy is the strongest fit at the capability level. They have the most mature";
      const streaming = shapeStreamingAgentTextForSurface('source', partial);

      expect(streaming).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question):/m);
      expect(streaming).toContain('Algonomy is the strongest fit');
      expect(streaming).toContain('most mature');
    });

    it('still strips inline HTML noise mid-stream', () => {
      const streaming = shapeStreamingAgentTextForSurface(
        'source',
        'Algonomy<strong>has</strong> the deepest integration.',
      );
      expect(streaming).toBe('Algonomy has the deepest integration.');
    });
  });
});
