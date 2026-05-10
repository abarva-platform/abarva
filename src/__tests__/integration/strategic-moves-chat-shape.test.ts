/**
 * Integration · Strategic Moves chat surface end-to-end shape contract
 * MOV-VOICE.STRAT-2026-05-10f
 *
 * Companion to intelligence-chat-shape.test.ts and source-chat-shape.test.ts.
 * The 2026-05-10 production audit pattern that found the Sentinel render-
 * bypass applies identically to the Nexus / Strategic Moves surfaces. Brief
 * B explicitly requires natural advisor prose and the consultant posture
 * for bet-shaping; the compaction templates (compactConsultantChatText for
 * the chat surfaces, compactStrategicMoveOriginateText for the originate
 * surface) were both Brief B violations by construction.
 *
 * This test feeds the verbatim Brief B few-shot examples through the
 * Strategic Moves render pipeline at all three relevant surface keys
 * (`programs`, `programs-detail`, and the legacy `/strategic-moves/new`)
 * and asserts the prose round-trips without the structured-bullet template
 * being applied.
 */

import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from '@/lib/agent/response-shape';

// Brief B Example 1 GOOD — picking up from a Sentinel handoff. Tests Nexus
// continuity reading + sponsor-structure push-back. Verbatim from
// docs/build/CURSOR_BRIEF_B_NEXUS.md.
const BRIEF_B_EXAMPLE_1_HANDOFF_PICKUP = [
  "Picking up from your Intelligence conversation — assortment optimization for Apex, with three patterns Sentinel surfaced that need to live in the bet's design from the start: merchandising-ops co-sponsorship as binding, the COGS-margin trap as the dominant failure mode, and your POS-integration depth as a tenant-specific risk.",
  '',
  "We're at P0 (Originate). The first real question isn't workflow — it's whether you have the sponsorship in place to actually shape this well. CIO-alone sponsorship for a merchandising AI bet fails most of the time. Before we go further, who's your CMO partner on this, and have you talked to them yet?",
  '',
  "If you have CMO sponsorship: we can charter quickly. If you don't yet: that's the work for this week, and the rest of the Move is premature without it.",
  '',
  "What's the sponsor situation right now?",
].join('\n');

// Brief B Example 2 GOOD — pushing back on premature scope. Verifies the
// consultant-grade push-back prose isn't templated into bullets.
const BRIEF_B_EXAMPLE_2_PUSH_BACK_SCOPE = [
  "I'd push back on that hard. Three peer specialty retailers in the corpus tried horizontal rollout across multiple banners in year one — all three saw adoption stall in months 6-9, and one had to redo the foundation work entirely. The COGS-margin trap is the dominant failure mode, and it concentrates exactly when you scale fast.",
  '',
  'My read: scope this as banner-by-banner, with your strongest banner first as the proof case. Probably 18-24 months to full enterprise coverage, not 12. That\'s slower than you want, but it\'s the difference between a Move that works and one that becomes a turnaround project in 18 months.',
  '',
  'Two questions that sharpen this: (1) which banner has the cleanest data substrate? Start there. (2) What\'s driving the 12-month timeline — is it real urgency, or is it a board commitment that could be reframed?',
].join('\n');

// Brief B Example 3 GOOD — honest about what's missing on the NPV question.
// Pre-fix, the "I can't give you a number with high confidence yet" line
// got promoted into a structured bullet, making honest data caveats look
// like server-side templates.
const BRIEF_B_EXAMPLE_3_HONEST_NPV = [
  "I can't give you a number with high confidence yet — we're at P0/P1, and a CFO-defensible NPV requires P2 (Discover & Diagnose) work that hasn't happened yet.",
  '',
  "What I can give you is the structure of the analysis you'd need:",
  '',
  '- Margin lift assumption — has to come from your actual category economics, not industry benchmarks. Pattern range from corpus is 8-15% margin gain at the unit level for specialty retail, but execution variance is huge.',
  '- COGS-margin trap discount — meaningful. I\'d want at least a 30% haircut on year-one numbers to plan for the recovery period after the trap hits.',
  '- Integration cost — depends entirely on your POS situation. We\'d need IT\'s actual estimate, not a vendor\'s.',
  '- Time-to-value — 12-18 months minimum at this complexity, not the 6-9 vendors will quote.',
  '',
  "That's not an NPV. It's the shape of one.",
].join('\n');

// Brief B Example 4 GOOD — off-scope question. Lane-discipline decline.
const BRIEF_B_EXAMPLE_4_OFF_SCOPE = [
  "That's outside what I do — I'm focused on shaping AI bets through the Move discipline. If you want to charter a Move, refine an in-flight initiative, or work through a business case, that's where I add value.",
].join('\n');

describe('Strategic Moves chat surface · render contract (MOV-VOICE.STRAT-2026-05-10f)', () => {
  // Strategic Moves uses three different surface keys depending on the page
  // (`programs` for the index/originate, `programs-detail` for move detail/
  // phase/evidence, legacy `/strategic-moves/new` for the originate compactor
  // branch). All three must preserve Brief B prose.
  const STRATEGIC_MOVES_SURFACES: ReadonlyArray<{ key: string; label: string }> = [
    { key: 'programs', label: 'Strategic Moves index / originate (surface=programs)' },
    { key: 'programs-detail', label: 'Strategic Moves detail / phase / evidence (surface=programs-detail)' },
    { key: '/strategic-moves/new', label: 'Legacy originate path (/strategic-moves/new)' },
  ];

  for (const { key, label } of STRATEGIC_MOVES_SURFACES) {
    describe(label, () => {
      it('does not inject the structured-bullet template into the Brief B Sentinel-handoff pickup', () => {
        const shaped = shapeAgentResponseForSurface(key, BRIEF_B_EXAMPLE_1_HANDOFF_PICKUP);

        expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question|Why|Choose):/m);
        expect(shaped).toContain('Picking up from your Intelligence conversation');
        expect(shaped).toContain('merchandising-ops co-sponsorship');
        expect(shaped).toContain('P0 (Originate)');
        expect(shaped).toContain('CIO-alone sponsorship for a merchandising AI bet fails');
        expect(shaped).toContain("What's the sponsor situation right now?");
      });

      it('preserves Brief B push-back prose without rewriting scope advice into bullets', () => {
        const shaped = shapeAgentResponseForSurface(key, BRIEF_B_EXAMPLE_2_PUSH_BACK_SCOPE);

        expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question|Why|Choose):/m);
        expect(shaped).toContain("I'd push back on that hard");
        expect(shaped).toContain('Three peer specialty retailers in the corpus');
        expect(shaped).toContain('COGS-margin trap');
        expect(shaped).toContain('My read: scope this as banner-by-banner');
        expect(shaped).toContain('18-24 months to full enterprise coverage, not 12');
      });

      it('does not promote "I can\'t give you a number" into a "- Missing:" bullet', () => {
        const shaped = shapeAgentResponseForSurface(key, BRIEF_B_EXAMPLE_3_HONEST_NPV);

        // The honest "I can't give you a number with high confidence yet"
        // caveat survives as natural prose, not as a server-template bullet.
        expect(shaped).not.toMatch(/^\s*- Missing:/m);
        expect(shaped).not.toMatch(/^\s*- Evidence:/m);
        expect(shaped).not.toMatch(/^\s*- Next:/m);
        expect(shaped).not.toMatch(/^\s*- Question:/m);
        expect(shaped).toContain("I can't give you a number with high confidence yet");
        expect(shaped).toContain("a CFO-defensible NPV requires P2");
        expect(shaped).toContain("That's not an NPV. It's the shape of one");
      });

      it('preserves the Brief B off-scope decline as natural prose', () => {
        const shaped = shapeAgentResponseForSurface(key, BRIEF_B_EXAMPLE_4_OFF_SCOPE);

        expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question|Why|Choose):/m);
        expect(shaped).toContain("That's outside what I do");
        expect(shaped).toContain("shaping AI bets through the Move discipline");
        expect(shaped).toContain('charter a Move');
      });

      it('still strips HTML markup and Markdown bold without compacting', () => {
        const raw =
          "**P0 (Originate)** — your sponsor structure isn't right yet. The <strong>COGS-margin trap</strong> is the dominant failure mode.";
        const shaped = shapeAgentResponseForSurface(key, raw);

        expect(shaped).not.toContain('**');
        expect(shaped).not.toContain('<strong>');
        expect(shaped).toContain('P0 (Originate)');
        expect(shaped).toContain('COGS-margin trap');
      });
    });
  }

  describe('shapeStreamingAgentTextForSurface — Strategic Moves variants', () => {
    it('passes streaming Brief B prose through unchanged on programs surface', () => {
      const partial =
        "I'd push back on that hard. Three peer specialty retailers in the corpus tried horizontal rollout across multiple banners";
      const streaming = shapeStreamingAgentTextForSurface('programs', partial);

      expect(streaming).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question):/m);
      expect(streaming).toContain("I'd push back on that hard");
      expect(streaming).toContain('Three peer specialty retailers in the corpus');
    });

    it('still strips inline HTML noise mid-stream on programs-detail surface', () => {
      const streaming = shapeStreamingAgentTextForSurface(
        'programs-detail',
        'P0<strong>Originate</strong> requires sponsor confirmation.',
      );
      expect(streaming).toBe('P0 Originate requires sponsor confirmation.');
    });
  });
});
