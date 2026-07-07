/**
 * Sentinel voice doctrine · regression tests · INT-VOICE
 *
 * Tests every banned-pattern category, every honesty mode in
 * the structural-element check, and the system-prompt
 * composition for the four BrokerModes × surface routing.
 *
 * The 30 sample exchanges from AGENT_VOICE_SENTINEL.md §5 are
 * locked in `sample-exchanges.fixture.ts`; this suite asserts
 * each anti-pattern fails and each doctrine response passes.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  composeSentinelSystemPrompt,
  checkSentinelVoice,
  detectRefusalNeeded,
  getSentinelDoctrineVersionString,
  isSentinelVoiceDoctrineEnabled,
  PATTERN_LEVEL_FALLBACK,
  REFUSAL_TRIGGERS,
  SENTINEL_BANNED_PATTERNS,
  SENTINEL_DOCTRINE_VERSION,
  SURFACE_WORD_CAPS,
  type VoiceCheckResult,
} from '../sentinel';

describe('SENTINEL_BANNED_PATTERNS — completeness', () => {
  it('covers every category named in the doctrine', () => {
    const categories = new Set(SENTINEL_BANNED_PATTERNS.map((p) => p.category));
    expect(categories.has('coach_drift')).toBe(true);
    expect(categories.has('marketing')).toBe(true);
    expect(categories.has('hedge_drift')).toBe(true);
    expect(categories.has('hollow_opener')).toBe(true);
    expect(categories.has('ungrounded_opener')).toBe(true);
    expect(categories.has('retrieval_mechanics')).toBe(true);
    // INT-VOICE.STRAT-2026-05-10c — consultant-posture pivot.
    expect(categories.has('academic_disclaimer')).toBe(true);
    expect(categories.has('internal_artifact_leak')).toBe(true);
    expect(categories.has('fabricated_statistic')).toBe(true);
  });

  it('flags coach drift — "you should"', () => {
    const r = checkSentinelVoice(
      'The corpus shows three failure modes. You should escalate to your sponsor.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'coach_drift')).toBe(true);
  });

  it('flags coach drift — "the next step is"', () => {
    const r = checkSentinelVoice(
      'Your CDP program has three open contradictions. The next step is to schedule a sponsor sync. The corpus pattern PAT-PRG-CDP-001 names this.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'coach_drift')).toBe(true);
  });

  it('flags coach drift — "I recommend"', () => {
    const r = checkSentinelVoice(
      'I recommend you review your evidence ledger weekly. PAT-PRG-EVD-001 supports this cadence.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'coach_drift')).toBe(true);
  });

  it('flags marketing register — "unlock"', () => {
    const r = checkSentinelVoice(
      'AbarVa unlocks the value of your enterprise data. PAT-AI-001.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'marketing')).toBe(true);
  });

  it('flags marketing register — "leverage"', () => {
    const r = checkSentinelVoice(
      'You can leverage the corpus for more grounded answers. See PAT-AI-001.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'marketing')).toBe(true);
  });

  it('flags marketing register — "cutting-edge" / "game-changer" / "next-generation"', () => {
    expect(
      checkSentinelVoice('cutting-edge AI capabilities (PAT-AI-001)').violations.some(
        (v) => v.category === 'marketing',
      ),
    ).toBe(true);
    expect(
      checkSentinelVoice('a game-changing approach (PAT-AI-001)').violations.some(
        (v) => v.category === 'marketing',
      ),
    ).toBe(true);
    expect(
      checkSentinelVoice('next-generation enterprise software (PAT-AI-001)').violations.some(
        (v) => v.category === 'marketing',
      ),
    ).toBe(true);
  });

  it('flags hollow openers — "Great question"', () => {
    const r = checkSentinelVoice(
      'Great question! The corpus pattern PAT-PRG-PIL-001 names three failure modes.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'hollow_opener')).toBe(true);
  });

  it('flags ungrounded opener — "Generally speaking"', () => {
    const r = checkSentinelVoice(
      "Generally speaking, AI pilots fail because of organizational issues. The corpus shows three modes — see PAT-PRG-PIL-001.",
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'ungrounded_opener')).toBe(true);
  });

  it("flags hollow opener — \"It's well-known that\"", () => {
    const r = checkSentinelVoice(
      "It's well-known that AI pilots fail at scale. PAT-PRG-PIL-001 names the mechanisms.",
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'ungrounded_opener')).toBe(true);
  });

  // INT-VOICE.STRAT-2026-05-10 · Sentinel must answer general AI-strategy /
  // pattern questions like a senior advisor. Retrieval-mechanics framings
  // ("the corpus lacks…", "Tenant evidence:" headings, etc.) are over-refusal
  // surface signatures and must trip the validator.
  it('flags retrieval-mechanics drift — "the corpus lacks"', () => {
    const r = checkSentinelVoice(
      "The corpus lacks data on multi-banner specialty retailers at this exact size. PAT-AI-RET-001.",
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);
  });

  it('flags retrieval-mechanics drift — "indexed sources don\'t contain"', () => {
    const r = checkSentinelVoice(
      "The indexed sources don't contain a record on assortment optimization at Apex's scale. PAT-RET-AO-001.",
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);
  });

  it('flags retrieval-mechanics drift — "I do not have a retrieved record"', () => {
    const r = checkSentinelVoice(
      "I do not have a retrieved record covering AI bets at peer specialty retailers. PAT-AI-RET-001 sketches the shape.",
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);
  });

  it('flags retrieval-mechanics drift — "Tenant evidence:" structural heading', () => {
    const r = checkSentinelVoice(
      "Tenant evidence: none retrieved. Pattern PAT-AI-RET-001 frames the bet space.",
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);
  });

  it('flags retrieval-mechanics drift — "Pattern-level read:" structural heading', () => {
    const r = checkSentinelVoice(
      "Pattern-level read: assortment optimization sits in the merchandising-ops pattern family. PAT-RET-AO-001.",
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);
  });

  // INT-VOICE.STRAT-2026-05-10 · Verbatim regression from the 2026-05-10 Apex /
  // Carlos audit. Sentinel Intel produced this exact text on the question:
  //   "What AI bets are common at multi-banner specialty retailers our size?"
  // It must trip the validator on at least three retrieval-mechanics phrases:
  // "sources don't contain", "isn't in the available corpus", and "what the
  // sources do show". The earlier doctrine version did not flag any of these.
  it('flags the verbatim Apex / Carlos 2026-05-10 over-refusal response', () => {
    const verbatim =
      "The sources don't contain indexed benchmark data on AI bet prevalence " +
      "specifically at multi-banner specialty retailers of comparable scale. " +
      "That comparison isn't in the available corpus. " +
      "What the sources do show is Apex's own above-the-line priorities: AI " +
      "Workforce Scheduling is the one ready to move now, while Demand Sensing " +
      "and Loyalty AI Next Best Offer are strong candidates held back by data " +
      "readiness gaps.";
    const r = checkSentinelVoice(verbatim);
    expect(r.pass).toBe(false);
    const retrievalHits = r.violations
      .filter((v) => v.category === 'retrieval_mechanics')
      .map((v) => v.phrase);
    expect(retrievalHits).toEqual(
      expect.arrayContaining([
        "sources don't contain",
        "isn't in the corpus / available corpus",
        "what the sources do show",
      ]),
    );
  });

  it('flags "Limited indexed data" — the canned low-confidence prefix removed in INT-VOICE.STRAT-2026-05-10', () => {
    const r = checkSentinelVoice(
      'Limited indexed data — confidence is moderate. Three AI bets are common at peer retailers. PAT-RET-AI-001.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.phrase === 'limited indexed data')).toBe(true);
  });

  it('flags "corpus does not include" / "corpus doesn\'t include"', () => {
    const a = checkSentinelVoice(
      'The corpus does not include peer benchmarks at this exact scale. PAT-RET-AI-001 frames the bet space.',
    );
    expect(a.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);

    const b = checkSentinelVoice(
      "The corpus doesn't include vendor performance figures for that contract. Confidence: directional.",
    );
    expect(b.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);
  });

  it('flags "I did not find enough indexed evidence" — the SentinelChat empty-stream fallback', () => {
    const r = checkSentinelVoice(
      'I did not find enough indexed Intelligence evidence to answer that yet. Try a vendor or pattern.',
    );
    expect(r.violations.some((v) => v.category === 'retrieval_mechanics')).toBe(true);
  });

  it('does not flag a senior-advisor answer that uses the corpus naturally', () => {
    const r = checkSentinelVoice(
      'Three AI bets are common at multi-banner specialty retailers your size: demand forecasting, assortment optimization, and store-labor planning. Pattern PAT-RET-AI-001 captures the shape; the merchandising-ops co-sponsorship binding shows up across most successful programs. Confidence: directional until Apex KPI evidence is loaded.',
    );
    expect(r.pass).toBe(true);
    expect(r.violations).toEqual([]);
  });

  // INT-VOICE.STRAT-2026-05-10c — consultant-posture pivot. Academic /
  // cover-your-back disclaimers were how Tests 1, 2, and 4 in the 2026-05-10
  // re-test scored D1=2: Sentinel kept opening with hedges before delivering
  // the answer.
  describe('academic_disclaimer — consultant posture (INT-VOICE.STRAT-2026-05-10c)', () => {
    it('flags "based on the limited data available to me…"', () => {
      const r = checkSentinelVoice(
        'Based on the limited data available to me, three AI bets show up at peer specialty retailers. PAT-RET-AI-001.',
      );
      expect(r.violations.some((v) => v.category === 'academic_disclaimer')).toBe(true);
    });

    it('flags "at the general AI industry level, not corpus-grounded for [tenant]…"', () => {
      const r = checkSentinelVoice(
        'At the general AI industry level, not corpus-grounded for Apex specifically, four bets show up. PAT-RET-AI-001.',
      );
      const academicHits = r.violations.filter((v) => v.category === 'academic_disclaimer');
      expect(academicHits.length).toBeGreaterThanOrEqual(2);
    });

    it('flags "From a high level…" / "At a high level…" as a hedge opener', () => {
      const a = checkSentinelVoice(
        'From a high level, the assortment-optimization bet is the most-cited pattern. PAT-RET-AI-001.',
      );
      expect(a.violations.some((v) => v.category === 'academic_disclaimer')).toBe(true);

      const b = checkSentinelVoice(
        'At a high level, three things are worth knowing. PAT-RET-AI-001.',
      );
      expect(b.violations.some((v) => v.category === 'academic_disclaimer')).toBe(true);
    });

    it('flags the "On the one hand … on the other hand …" fence-sitting pattern', () => {
      const r = checkSentinelVoice(
        'On the one hand, demand sensing is a strong bet. On the other hand, it depends on data readiness. PAT-RET-AI-001.',
      );
      expect(r.violations.some((v) => v.category === 'academic_disclaimer')).toBe(true);
    });

    it('flags "It\'s important to note…" as a hedge before reasoning', () => {
      const r = checkSentinelVoice(
        "It's important to note that assortment optimization is data-dependent. The COGS-margin trap is the canonical failure mode. PAT-RET-AI-001.",
      );
      expect(r.violations.some((v) => v.category === 'academic_disclaimer')).toBe(true);
    });

    it('does not flag a consultant-posture answer that uses verbal calibration without disclaimers', () => {
      const r = checkSentinelVoice(
        "The biggest failure mode at your scale is the COGS-margin trap, and it's the one I'd want you focused on. Three peer specialty retailers in the corpus saw exactly this in months 4-7 of horizontal rollout. High confidence on this one.",
      );
      expect(r.violations.some((v) => v.category === 'academic_disclaimer')).toBe(false);
    });
  });

  // INT-VOICE.STRAT-2026-05-10c — the one firm anti-fabrication line.
  // Senior consultants reason from experience and cite where they have data;
  // they never invent precise peer-prevalence percentages or vendor market
  // shares. The validator surfaces the obvious shape of fabrication.
  describe('fabricated_statistic — anti-fabrication (INT-VOICE.STRAT-2026-05-10c)', () => {
    it('flags "73% of retailers…" peer-prevalence fabrication', () => {
      const r = checkSentinelVoice(
        '73% of retailers in your size class run AI workforce scheduling. The pattern is well-documented.',
      );
      expect(r.violations.some((v) => v.category === 'fabricated_statistic')).toBe(true);
    });

    it('flags "47% of peer specialty retailers…"', () => {
      const r = checkSentinelVoice(
        '47% of peer specialty retailers tried this and failed in months 6-9. PAT-RET-AI-001.',
      );
      expect(r.violations.some((v) => v.category === 'fabricated_statistic')).toBe(true);
    });

    it('flags "Algonomy has 89% market share" vendor-share fabrication', () => {
      const r = checkSentinelVoice(
        'Algonomy has 89% market share in retail personalization. Their pricing is aggressive.',
      );
      expect(r.violations.some((v) => v.category === 'fabricated_statistic')).toBe(true);
    });

    it('does not flag advisor framings without precise fabricated stats', () => {
      const r = checkSentinelVoice(
        'Most retailers in the corpus that tried this saw similar lifts. Three peer specialty retailers in the corpus had this exact issue in months 4-7. High confidence on the pattern shape.',
      );
      expect(r.violations.some((v) => v.category === 'fabricated_statistic')).toBe(false);
    });
  });

  describe('internal_consistency — arithmetic ranking guard (INT-VOICE.STRAT-2026-05-13a)', () => {
    it('flags ranked dollar values that are not sorted by the stated metric', () => {
      const r = checkSentinelVoice(
        'The true rank by annual spend is Salesforce $14.6M, Adobe $8.8M, AWS $13.6M.',
      );
      expect(r.pass).toBe(false);
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'ranked money values are not in descending order',
          }),
        ]),
      );
    });

    it('does not flag ranked dollar values that are sorted by the stated metric', () => {
      const r = checkSentinelVoice(
        'The true rank by annual spend is Salesforce $14.6M, AWS $13.6M, Adobe $8.8M.',
      );
      expect(r.violations.some((v) => v.category === 'internal_consistency')).toBe(false);
    });
  });

  describe('internal_consistency — phase 1 consistency guards (INT-VOICE.STRAT-2026-05-15a)', () => {
    it('flags component spend that does not reconcile to the stated total', () => {
      const r = checkSentinelVoice(
        'The Q3 exposure is Salesforce $4M, Adobe $3M, and Accenture $2M, totaling $10M. The evidence is in F200.',
      );
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'money components do not reconcile to stated total',
          }),
        ]),
      );
    });

    it('does not flag component spend that reconciles within rounding tolerance', () => {
      const r = checkSentinelVoice(
        'The Q3 exposure is Salesforce $4M, Adobe $3M, and Accenture $2M, totaling $9M. The evidence is in F200.',
      );
      expect(r.violations).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            phrase: 'money components do not reconcile to stated total',
          }),
        ]),
      );
    });

    it('flags relative month counts that conflict with an absolute date', () => {
      const r = checkSentinelVoice(
        'Adobe renewal arrives in 8 months on Sep 30, 2026, so the CIO has room to defer. The evidence is in F200.',
        { referenceDate: '2026-05-15T00:00:00.000Z' },
      );
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'relative month count conflicts with absolute date',
          }),
        ]),
      );
    });

    it('does not flag relative month counts that match an absolute date', () => {
      const r = checkSentinelVoice(
        'Adobe renewal arrives in 4 months on Sep 30, 2026, so the CIO has room to defer. The evidence is in F200.',
        { referenceDate: '2026-05-15T00:00:00.000Z' },
      );
      expect(r.violations).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            phrase: 'relative month count conflicts with absolute date',
          }),
        ]),
      );
    });

    it('flags cited pattern IDs outside the known registry', () => {
      const r = checkSentinelVoice(
        'The binding pattern is P-HC-099, and the decision should move now because the evidence says so.',
      );
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'pattern citation is not in known registry',
            match: 'P-HC-099',
          }),
        ]),
      );
    });

    it('does not flag known demo pattern citations', () => {
      const r = checkSentinelVoice(
        'The binding evidence is P-HC-014, P-FS-004, PAT-SRC-AMS-001, and F200. This is enough to form a view.',
      );
      expect(r.violations).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            phrase: 'pattern citation is not in known registry',
          }),
        ]),
      );
    });
  });

  describe('internal_consistency — phase 2 percentage bounds (G3) (INT-VOICE.STRAT-2026-05-15b)', () => {
    const RED_CORPUS = [
      'Margin compression is 142% across the portfolio, which is the binding evidence in F200.',
      'Contact-center utilization is 118% on the current roster, per P-RET-008.',
      'Adoption rate sits at 167% for the new tooling right now, see F201.',
      'Specialty market share reached 220% last quarter according to the brief.',
      'Model accuracy is 134 percent on the demand engine, the evidence shows.',
    ];

    for (const answer of RED_CORPUS) {
      it(`flags an incoherent ratio-style percentage: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              category: 'internal_consistency',
              phrase: 'ratio-style percentage exceeds 100%',
            }),
          ]),
        );
      });
    }

    const GREEN_CORPUS = [
      // The audit case — exceeding a commitment > 100% is legitimate.
      'AI initiatives are at 141% of committed value, per the Ambient AI card in F200.',
      'Run-rate spend is tracking at 115% of the annual target, the evidence shows.',
      'Year-over-year growth hit 230% on the contact-center program, per P-RET-008.',
      'The program is delivering 156% of its forecast return, well ahead of plan.',
      'Adobe spend is at 108% of budget, which the CFO will want to review.',
      // Bounded ratio nouns that stay in range — no violation.
      'Margin sits at 38% and utilization is 71%, both within the corpus range.',
      // No recognisable noun near the value — no false positive.
      'The score moved to 142 over the period, a directional read only.',
    ];

    for (const answer of GREEN_CORPUS) {
      it(`does not flag a coherent percentage: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              phrase: 'ratio-style percentage exceeds 100%',
            }),
          ]),
        );
      });
    }
  });

  describe('internal_consistency — phase 2 named-entity consistency (G5) (INT-VOICE.STRAT-2026-05-15b)', () => {
    const RED_CORPUS = [
      'Carlos Rivera owns the renewal. Charlie Rivera should be looped in before the gate, per F200.',
      'The CFO is Dana Whitmore. As Diana Whitmore noted, the budget is locked — see P-FS-004.',
      'Sam Patel raised the risk; Samuel Patel later disagreed, and the corpus backs Samuel here.',
      'Per Maria Gonzalez, the program is on track, though Marie Gonzalez flagged a delay in F201.',
    ];

    for (const answer of RED_CORPUS) {
      it(`flags a conflicting first-name spelling: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              category: 'internal_consistency',
              phrase: 'same person referred to by conflicting first names',
            }),
          ]),
        );
      });
    }

    const GREEN_CORPUS = [
      // Full name, first name only, and an initial form — all consistent.
      'Carlos Rivera owns the renewal. Carlos will brief the CFO, and C. Rivera signs the gate. See F200.',
      // Two genuinely different people — no shared last name.
      'Carlos Rivera and Dana Whitmore both reviewed the brief, per P-FS-004.',
      // Honorific does not count as a first name.
      'Dr. Maria Gonzalez leads the program; Maria Gonzalez will present at the gate.',
      // Vendor and product capitalised spans must not be read as people.
      'Salesforce Marketing Cloud and Adobe Experience Manager are the two platforms in scope.',
      // Two people sharing a surname but with the same first name — consistent.
      'Sam Patel and Sam Patel are listed twice in the roster, per F201.',
    ];

    for (const answer of GREEN_CORPUS) {
      it(`does not flag consistent or distinct names: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              phrase: 'same person referred to by conflicting first names',
            }),
          ]),
        );
      });
    }
  });
});

// INT-VOICE.STRAT-2026-05-15c · Phase 3 consistency guards — G4 currency
// units, G7 time-tense, G8 forward-reference integrity. Completes all 8
// guards from docs/agent-quality/SENTINEL-CONSISTENCY-GUARD-EXPANSION.md.
describe('internal_consistency — phase 3 consistency guards (INT-VOICE.STRAT-2026-05-15c)', () => {
  describe('G4 — currency unit consistency', () => {
    const RED_CORPUS = [
      "AWS is $13.6M, well above Adobe's $8800K on the renewal, per F200.",
      'Salesforce spend is $9.2M versus ServiceNow at $4100K, the evidence shows.',
      "The contact-center program runs $2.4M while the CDP trails at $900K — see P-RET-008.",
      "Snowflake outspends Databricks: $6M compared to $5500K, per the brief.",
    ];

    for (const answer of RED_CORPUS) {
      it(`flags a comparison line mixing $M and $K: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              category: 'internal_consistency',
              phrase: 'comparison line mixes currency units ($M with $K)',
            }),
          ]),
        );
      });
    }

    const GREEN_CORPUS = [
      // Same unit on both sides — clean comparison.
      "AWS is $13.6M, well above Adobe's $8.8M on the renewal, per F200.",
      // $B alongside $M is an expected scale jump, not a normalisation slip.
      'Enterprise capex is $1.2B versus the AI envelope at $40M, the evidence shows.',
      // Two figures, same unit, no mix.
      'Salesforce at $9.2M and ServiceNow at $4.1M both sit inside the corpus range.',
      // Mixed units but not a comparison line — a plain list is fine.
      'The Q3 line items are $4M on tooling and $300K on training, per F201.',
      // Single money value on the comparison line — nothing to mix.
      'AWS spend of $13.6M is well above the corpus median, per P-RET-008.',
    ];

    for (const answer of GREEN_CORPUS) {
      it(`does not flag a clean currency line: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              phrase: 'comparison line mixes currency units ($M with $K)',
            }),
          ]),
        );
      });
    }
  });

  describe('G7 — time-tense consistency', () => {
    const RED_CORPUS = [
      'The migration shipped Q2 and will ship again in 30 days, per F200.',
      'The Adobe contract closed last month and will close by Q3, the evidence shows.',
      'The pilot launched in March and will launch next quarter, see P-RET-008.',
      'The vendor RFP completed in April and will complete in 14 days, per F201.',
    ];

    for (const answer of RED_CORPUS) {
      it(`flags a sentence mixing past and future for one event: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              category: 'internal_consistency',
              phrase: 'sentence mixes past-tense and future-tense markers for one event',
            }),
          ]),
        );
      });
    }

    // G7 is the highest false-positive risk in the suite. This green
    // corpus is deliberately thorough — every row is a legitimate
    // sentence that names both a past and a future fact.
    const GREEN_CORPUS = [
      // A closed contract that renews is coherent — recurrence vocab.
      'The Adobe contract closed last quarter and renews next year, per F200.',
      // Contrast conjunction is the legitimate past+future pairing.
      'The migration shipped Q2, but the next phase will ship in 30 days.',
      'The pilot launched in March, though the rollout will complete by Q3.',
      // Past-only sentence — no future marker at all.
      'The contract closed last quarter and the CFO signed the renewal, per P-RET-008.',
      // Future-only sentence — no past marker at all.
      'The migration will ship in 30 days and the team will brief the gate.',
      // Past and future facts about *different* events, joined by a
      // contrast — not a self-contradiction.
      'The CDP program completed in April, whereas the demand engine will launch next month.',
      // "extends" is recurrence vocab — a finished deal that extends is fine.
      'The vendor agreement closed in March and extends through 2027, see F201.',
      // Contains "and" plus a past verb, but no hard future marker.
      'The RFP completed in April and the scoring is done, per the brief.',
      // Future marker plus "and", but no past verb.
      'The rollout will ship in 30 days and the training plan is ready.',
      // Recurrence: "continues" — a launched program that continues is coherent.
      'The contact-center pilot launched in Q1 and continues through year-end.',
    ];

    for (const answer of GREEN_CORPUS) {
      it(`does not flag a legitimate past+future sentence: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              phrase: 'sentence mixes past-tense and future-tense markers for one event',
            }),
          ]),
        );
      });
    }
  });

  describe('G8 — forward-reference integrity', () => {
    it('flags a reference to a list point beyond the declared list', () => {
      const r = checkSentinelVoice(
        'The plan has two parts.\n1. Close the gate.\n2. Brief the CFO.\nAs I noted in point 3, the evidence is in F200.',
      );
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'references a numbered point beyond the declared list',
            match: 'point 3',
          }),
        ]),
      );
    });

    it('flags a reference to a numbered point when no list is present', () => {
      const r = checkSentinelVoice(
        'As covered in item 4 above, the renewal should move now because the evidence supports it.',
      );
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'references a numbered point with no numbered list present',
          }),
        ]),
      );
    });

    it('flags a reference to a footnote beyond the declared set', () => {
      const r = checkSentinelVoice(
        'The spend is anchored in the corpus [1] and the renewal date [2]. See footnote 5 for the methodology, per F200.',
      );
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'references a footnote beyond the declared set',
          }),
        ]),
      );
    });

    it('flags a footnote reference when no footnotes exist', () => {
      const r = checkSentinelVoice(
        'The renewal math holds (see 3), and the CIO has room to defer, per P-RET-008.',
      );
      expect(r.violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'internal_consistency',
            phrase: 'references a footnote with no footnotes present',
          }),
        ]),
      );
    });

    const GREEN_CORPUS = [
      // Reference stays within the declared list.
      'The plan has three steps.\n1. Close the gate.\n2. Brief the CFO.\n3. Sign the renewal.\nAs noted in point 2, the evidence is in F200.',
      // Footnote reference stays within the declared set.
      'Spend is anchored in the corpus [1] and the renewal date [2]. See footnote 2 for the methodology, per F201.',
      // No numbered scaffold and no numbered references — nothing to check.
      'The Adobe renewal should move now because the corpus evidence supports a deferral, per P-RET-008.',
      // Years and money figures must not be read as list indices.
      'The 2026 budget is $4M and the program closed in 2025, per F200.',
      // "Footnote 1:" declares the scaffold; the reference matches.
      'The methodology is sound.\nFootnote 1: corpus range is $3-15M.\nAs footnote 1 explains, the comparison holds.',
    ];

    for (const answer of GREEN_CORPUS) {
      it(`does not flag a valid forward reference: "${answer.slice(0, 48)}…"`, () => {
        const r = checkSentinelVoice(answer);
        expect(r.violations).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              category: 'internal_consistency',
              phrase: expect.stringMatching(/references a (numbered point|footnote)/),
            }),
          ]),
        );
      });
    }
  });
});

// INT-VOICE.STRAT-2026-05-10c · Consultant posture — replaces the earlier
// "epistemic-honesty librarian with two-tier scoping" framing after the
// 2026-05-10 Apex / Carlos re-test showed it produced search-with-disclaimers
// in a senior tone, not consulting. Calibration archetype: a senior AI
// strategy consultant the user is paying $1.5K-$3K/hour. She forms opinions,
// calibrates verbally, cites where it strengthens, pushes back when warranted,
// and refuses exactly one thing — fabricating specific tenant facts or peer
// statistics.
describe('PATTERN_LEVEL_FALLBACK consultant posture — INT-VOICE.STRAT-2026-05-10c', () => {
  it('exports the senior-consultant calibration archetype', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/Consultant\s+posture/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/senior\s+AI\s+strategy\s+advisor/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/(?:not\s+a|NOT\s+a)\s+corpus\s+search/i);
  });

  it('directs Sentinel to form a view, defend it briefly, surface the reasoning', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/Form\s+a\s+view,?\s+defend\s+it\s+briefly/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/My\s+read\s+is\s+X/i);
  });

  it('requires verbal confidence calibration, not academic preambles', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/Calibrate\s+confidence\s+in\s+plain\s+language/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/high\s+confidence\s+on\s+this/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/judgment,?\s+not\s+benchmark\s+data/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(
      /Calibration\s+belongs\s+in\s+how\s+you\s+phrase\s+the\s+claim,?\s+not\s+in\s+(?:an\s+academic\s+)?preamble/i,
    );
  });

  it('directs Sentinel to cite evidence where it strengthens the argument, conversationally', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/Cite\s+evidence\s+where\s+it\s+strengthens\s+the\s+argument/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/not\s+a\s+formal\s+citation\s+requirement/i);
  });

  it('directs Sentinel to disagree when the evidence supports it', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/Disagree\s+when\s+the\s+evidence\s+supports/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/Neutral\s+presentation\s+of\s+options\s+is\s+not/i);
  });

  it('codifies the one firm anti-fabrication line — tenant facts and peer statistics', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(
      /one\s+firm\s+line[^]*do\s+not\s+fabricate\s+tenant[- ]specific\s+facts\s+or\s+peer\s+statistics/i,
    );
    expect(PATTERN_LEVEL_FALLBACK).toContain('73% of retailers');
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/(?:I\s+don'?t\s+have\s+that\s+in\s+Apex'?s?\s+connected\s+data|connected\s+data)/i);
  });

  it('forbids retrieval-mechanics framings as banned framings', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/Banned\s+framings/i);
    expect(PATTERN_LEVEL_FALLBACK).toContain('the corpus lacks');
    expect(PATTERN_LEVEL_FALLBACK).toContain('indexed data is missing');
    expect(PATTERN_LEVEL_FALLBACK).toContain('I do not have a retrieved record');
    expect(PATTERN_LEVEL_FALLBACK).toContain('Tenant evidence:');
    expect(PATTERN_LEVEL_FALLBACK).toContain('Pattern-level read:');
  });

  it('forbids academic / cover-your-back disclaimer phrasings', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/(?:Also\s+banned[^]*academic|Carlos\s+would\s+fire)/i);
    expect(PATTERN_LEVEL_FALLBACK).toContain('based on the limited data available to me');
    expect(PATTERN_LEVEL_FALLBACK).toContain('at the general AI industry level');
    expect(PATTERN_LEVEL_FALLBACK).toContain('On the one hand');
    expect(PATTERN_LEVEL_FALLBACK).toContain("It's important to note");
  });

  it('names the ~80% no-corpus-hit doctrine line as the calibration baseline', () => {
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/80\s*%/);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(/no\s+direct\s+corpus\s+hit/i);
    expect(PATTERN_LEVEL_FALLBACK).toMatch(
      /Refusing\s+or\s+over[- ]hedging\s+on\s+a\s+general\s+strategy\s+question\s+is\s+a\s+failure\s+mode,\s+not\s+honesty/i,
    );
  });

  it('is included in the Intelligence-surface system prompt', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: 'apex-retail',
      surface: '/intelligence',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    expect(prompt).toMatch(/Consultant\s+posture/i);
    expect(prompt).toMatch(/Form\s+a\s+view,?\s+defend\s+it\s+briefly/i);
  });

  it('keeps strategic operating questions in Sentinel lane instead of over-routing to Atlas / Nexus', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: 'meridian-health',
      surface: '/intelligence',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    expect(prompt).toMatch(/Operating-advisor discipline/i);
    expect(prompt).toMatch(/what should I ask my team tomorrow/i);
    expect(prompt).toMatch(/Where does X expertise fit/i);
    expect(prompt).toMatch(/How do we avoid backlash/i);
    expect(prompt).toMatch(/What should the first steering meeting decide/i);
    expect(prompt).toMatch(/must be answered directly/i);
    expect(prompt).toMatch(/Do not route away/i);
  });

  it('includes cloud data AI economics discipline for CIO platform questions', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: 'meridian-health',
      surface: '/intelligence',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    expect(prompt).toMatch(/Cloud, data, and AI-platform discipline/i);
    expect(prompt).toMatch(/AWS vs Azure vs GCP vs private cloud/i);
    expect(prompt).toMatch(/committed spend/i);
    expect(prompt).toMatch(/data egress/i);
    expect(prompt).toMatch(/Do not claim secret roadmap knowledge/i);
    expect(prompt).toMatch(/Epic remains clinical workflow gravity/i);
    expect(prompt).toMatch(/startup disruption/i);
    expect(prompt).toMatch(/RAF impact/i);
    expect(prompt).toMatch(/governed plurality/i);
  });

  it('includes the arithmetic reflection guard on Intelligence prompts', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: 'apex-retail',
      surface: '/intelligence',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    expect(prompt).toMatch(/Arithmetic and ranking reflection guard/i);
    expect(prompt).toMatch(/Adobe \$8\.8M ranks above AWS \$13\.6M/i);
    expect(prompt).toMatch(/Never explain that you performed this check/i);
  });

  it('includes the Intelligence priority slate for broad move-now questions', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: 'first-capital',
      surface: '/intelligence',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    expect(prompt).toMatch(/Intelligence priority-slate discipline/i);
    expect(prompt).toMatch(/Population Health AI for ACOs/i);
    expect(prompt).toMatch(/rank Population Health AI for ACOs as #1/i);
    expect(prompt).toMatch(/FedNow Payment Rails Modernization/i);
    expect(prompt).toMatch(/deposit retention/i);
    expect(prompt).toMatch(/exact phrase "model risk"/i);
    expect(prompt).toMatch(/Continuity fallback/i);
    expect(prompt).toMatch(/words "recommendation", "because", and "risk"/i);
  });

  it('is omitted on the Source surface, which has its own Brief C role', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: 'apex-retail',
      surface: '/source',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    // Source uses Brief C's verbatim role text — Pattern-level fallback is
    // Intelligence-only.
    expect(prompt).not.toMatch(/Consultant\s+posture/i);
    expect(prompt).not.toMatch(/Cloud, data, and AI-platform discipline/i);
    expect(prompt).not.toMatch(/Arithmetic and ranking reflection guard/i);
    expect(prompt).not.toMatch(/Intelligence priority-slate discipline/i);
    expect(prompt).toMatch(/You\s+are\s+Ava,?\s+AbarVa'?s\s+vendor\s+selection\s+agent/i);
  });
});

// SRC-VOICE.STRAT-2026-05-10 · Brief C expert posture for the Source surface.
// Asserts that composeSentinelSystemPrompt('/source') carries the verbatim
// Brief C canonical text from `docs/build/CURSOR_BRIEF_C_SOURCE.md`.
describe('Source surface — Brief C expert posture (SRC-VOICE.STRAT-2026-05-10)', () => {
  const sourcePrompt = composeSentinelSystemPrompt({
    mode: 'corpus',
    tenantKey: 'apex-retail',
    surface: '/source',
    vectorIndexPending: false,
    worldviewPending: false,
  });

  it('opens with the WHO YOU ARE / senior IT vendor selection advisor identity', () => {
    expect(sourcePrompt).toMatch(/You\s+are\s+Ava,?\s+AbarVa'?s\s+vendor\s+selection\s+agent/i);
    expect(sourcePrompt).toMatch(/WHO\s+YOU\s+ARE/);
    expect(sourcePrompt).toMatch(/senior\s+IT\s+vendor\s+selection\s+advisor/i);
    expect(sourcePrompt).toMatch(/retail,\s+healthcare,\s+and\s+financial\s+services/i);
  });

  it('explicitly disclaims being a vendor catalog / procurement workflow / comparison-table generator', () => {
    expect(sourcePrompt).toMatch(
      /NOT\s+a\s+vendor\s+catalog,?\s+a\s+procurement\s+workflow\s+tool,?\s+or\s+a\s+comparison[- ]table\s+generator/i,
    );
  });

  it('lists the three sources of intelligence (corpus + tenant + own expertise)', () => {
    expect(sourcePrompt).toMatch(/WHAT\s+YOU\s+HAVE\s+ACCESS\s+TO/);
    expect(sourcePrompt).toMatch(/industry\s+knowledge\s+corpus/i);
    expect(sourcePrompt).toMatch(/tenant'?s\s+enterprise\s+knowledge\s+layer/i);
    expect(sourcePrompt).toMatch(/own\s+deep\s+expertise/i);
  });

  it('declares the six capabilities — longlist, RFI/RFP, pricing, health, SI, decision doc', () => {
    expect(sourcePrompt).toMatch(/WHAT\s+YOU\s+DO/);
    expect(sourcePrompt).toMatch(/LONGLIST\s+GENERATION/);
    expect(sourcePrompt).toMatch(/RFI\s*\/\s*RFP\s+CONSTRUCTION/);
    expect(sourcePrompt).toMatch(/PRICING\s+INTELLIGENCE/);
    expect(sourcePrompt).toMatch(/VENDOR\s+HEALTH\s+SIGNALS/);
    expect(sourcePrompt).toMatch(/SI\s+PARTNER\s+MAPPING/);
    expect(sourcePrompt).toMatch(/DECISION\s+DOCUMENTATION/);
  });

  it('mandates the HOW YOU RESPOND posture — opinions not catalogs, push-back, ask, confidence in plain language', () => {
    expect(sourcePrompt).toMatch(/HOW\s+YOU\s+RESPOND/);
    expect(sourcePrompt).toMatch(/OPINIONS,?\s+NOT\s+CATALOGS/);
    expect(sourcePrompt).toMatch(/CONFIDENCE\s+IN\s+PLAIN\s+LANGUAGE/);
    expect(sourcePrompt).toMatch(/EVIDENCE\s+WHERE\s+IT\s+STRENGTHENS\s+THE\s+ARGUMENT/);
    expect(sourcePrompt).toMatch(/PUSH\s+BACK\s+WHEN\s+WARRANTED/);
    expect(sourcePrompt).toMatch(/ASK\s+CLARIFYING\s+QUESTIONS/);
  });

  it('declares WHAT YOU NEVER DO — anti-fabrication of vendor metrics, customer references, tenant facts, financial health', () => {
    expect(sourcePrompt).toMatch(/WHAT\s+YOU\s+NEVER\s+DO/);
    expect(sourcePrompt).toMatch(/NEVER\s+fabricate\s+vendor\s+metrics/i);
    expect(sourcePrompt).toMatch(/NEVER\s+fabricate\s+customer\s+references/i);
    expect(sourcePrompt).toMatch(/NEVER\s+fabricate\s+tenant[- ]specific\s+facts/i);
    expect(sourcePrompt).toMatch(/NEVER\s+fabricate\s+financial\s+health\s+metrics/i);
    expect(sourcePrompt).toMatch(/NEVER\s+say\s+"this\s+is\s+not\s+in\s+the\s+corpus"\s+as\s+a\s+refusal/i);
    expect(sourcePrompt).toMatch(
      /NEVER\s+recommend\s+a\s+vendor\s+based\s+on\s+the\s+user'?s\s+apparent\s+preference\s+rather\s+than\s+evidence/i,
    );
  });

  it('routes off-vendor lanes correctly — landscape → Intelligence, Move-shaping → Moves surface', () => {
    expect(sourcePrompt).toMatch(/landscape\s+questions[\s\S]{0,200}Intelligence/i);
    expect(sourcePrompt).toMatch(/Move[- ]shaping[\s\S]{0,200}Moves\s+surface/i);
  });

  it('carries the five Brief C few-shot examples', () => {
    expect(sourcePrompt).toMatch(/EXAMPLE\s+1\s*·\s*Vendor\s+shortlist\s+with\s+rationale/i);
    expect(sourcePrompt).toMatch(/EXAMPLE\s+2\s*·\s*Pushing\s+back\s+on\s+a\s+stated\s+preference/i);
    expect(sourcePrompt).toMatch(/EXAMPLE\s+3\s*·\s*Asking\s+for\s+clarification/i);
    expect(sourcePrompt).toMatch(/EXAMPLE\s+4\s*·\s*Honest\s+about\s+what'?s\s+missing/i);
    expect(sourcePrompt).toMatch(/EXAMPLE\s+5\s*·\s*Off[- ]scope\s+question/i);
  });

  it('few-shot examples demonstrate the vendor-advisor posture — opinion-led shortlist, push-back, no fabrication', () => {
    expect(sourcePrompt).toMatch(/Three\s+credible\s+vendors\s+for\s+your\s+specific\s+situation/i);
    expect(sourcePrompt).toMatch(/I'?d\s+push\s+back\s+on\s+locking\s+in\s+here/i);
    expect(sourcePrompt).toMatch(/I\s+don'?t\s+have\s+visibility\s+into\s+your\s+current/i);
    expect(sourcePrompt).toMatch(/That'?s\s+outside\s+what\s+I\s+do/i);
  });

  it('preserves the supplementary gate-discipline scaffolding (SOURCE_FIVE_RULES, specialist dispatch)', () => {
    expect(sourcePrompt).toMatch(/Five\s+voice\s+rules\s+on\s+Source/i);
    expect(sourcePrompt).toMatch(/Specialist\s+lenses/i);
    expect(sourcePrompt).toMatch(/next-action:\s*"What\s+should\s+we\s+do\s+next/i);
  });
});

// INT-VOICE.STRAT-2026-05-10d · The Ask synthesizer prompt body is the
// canonical Brief A text from `docs/build/CURSOR_BRIEF_A_SENTINEL.md` plus
// the surface-conventions footer. These assertions guard against drift from
// the canonical brief.
describe('Ask synthesizer prompt — Brief A expert posture (INT-VOICE.STRAT-2026-05-10d)', () => {
  const synthesizerSource = readFileSync(
    join(__dirname, '..', '..', '..', 'intelligence', 'ask', 'synthesizer.ts'),
    'utf8',
  );

  it('opens with the WHO YOU ARE / senior advisor identity from Brief A', () => {
    expect(synthesizerSource).toMatch(/WHO\s+YOU\s+ARE/);
    expect(synthesizerSource).toMatch(/senior\s+AI\s+strategy\s+advisor/i);
    expect(synthesizerSource).toMatch(/retail,\s+healthcare,\s+and\s+financial\s+services/i);
    expect(synthesizerSource).toMatch(/senior\s+partner\s+at\s+a\s+top[- ]tier\s+firm/i);
  });

  it('lists the three sources of intelligence (corpus + tenant + own expertise)', () => {
    expect(synthesizerSource).toMatch(/WHAT\s+YOU\s+HAVE\s+ACCESS\s+TO/);
    expect(synthesizerSource).toMatch(/industry\s+knowledge\s+corpus/i);
    expect(synthesizerSource).toMatch(/tenant'?s\s+enterprise\s+knowledge\s+layer/i);
    expect(synthesizerSource).toMatch(/your\s+own\s+deep\s+expertise/i);
  });

  it('declares the HOW YOU RESPOND posture — opinions, confidence, evidence, disagree, ask, converse', () => {
    expect(synthesizerSource).toMatch(/HOW\s+YOU\s+RESPOND/);
    expect(synthesizerSource).toMatch(/OPINIONS,?\s+NOT\s+SUMMARIES/);
    expect(synthesizerSource).toMatch(/CONFIDENCE\s+IN\s+PLAIN\s+LANGUAGE/);
    expect(synthesizerSource).toMatch(/EVIDENCE\s+WHERE\s+IT\s+STRENGTHENS\s+THE\s+ARGUMENT/);
    expect(synthesizerSource).toMatch(/DISAGREE\s+WHEN\s+WARRANTED/);
    expect(synthesizerSource).toMatch(/ASK\s+CLARIFYING\s+QUESTIONS\s+WHEN\s+THEY\s+WOULD\s+HELP/);
    expect(synthesizerSource).toMatch(/CONVERSE\s+NATURALLY/);
  });

  it('declares WHAT YOU NEVER DO — anti-fabrication, no corpus refusal, no decline-when-can-reason', () => {
    expect(synthesizerSource).toMatch(/WHAT\s+YOU\s+NEVER\s+DO/);
    expect(synthesizerSource).toMatch(
      /NEVER\s+fabricate\s+specific\s+tenant\s+facts/i,
    );
    expect(synthesizerSource).toMatch(/NEVER\s+fabricate\s+peer\s+statistics/i);
    expect(synthesizerSource).toMatch(
      /NEVER\s+say\s+"this\s+is\s+not\s+in\s+the\s+corpus"\s+as\s+a\s+refusal/i,
    );
    expect(synthesizerSource).toContain('73% of retailers');
    expect(synthesizerSource).toContain('Algonomy has 89% market share');
  });

  it('includes the arithmetic reflection guard from Sentinel-A1', () => {
    expect(synthesizerSource).toMatch(/ARITHMETIC AND RANKING REFLECTION GUARD/);
    expect(synthesizerSource).toMatch(/Adobe \$8\.8M ranks above AWS \$13\.6M/);
    expect(synthesizerSource).toMatch(/Never explain that you performed this check/);
  });

  it('declares LANE DISCIPLINE — vendor depth → Source, Move-shaping → Nexus', () => {
    expect(synthesizerSource).toMatch(/LANE\s+DISCIPLINE/);
    expect(synthesizerSource).toMatch(/Source\s+has\s+the\s+depth/i);
    expect(synthesizerSource).toMatch(/Nexus|Moves\s+surface/i);
  });

  it('carries the five Brief A few-shot examples', () => {
    expect(synthesizerSource).toMatch(/EXAMPLE\s+1\s*·\s*Strategy\s+question\s+with\s+corpus\s+evidence/i);
    expect(synthesizerSource).toMatch(/EXAMPLE\s+2\s*·\s*Question\s+about\s+a\s+vendor/i);
    expect(synthesizerSource).toMatch(/EXAMPLE\s+3\s*·\s*Question\s+requiring\s+clarification/i);
    expect(synthesizerSource).toMatch(/EXAMPLE\s+4\s*·\s*The\s+"I\s+don'?t\s+know"\s+edge\s+case/i);
    expect(synthesizerSource).toMatch(/EXAMPLE\s+5\s*·\s*Off[- ]domain\s+question/i);
  });

  it('few-shot examples demonstrate the consultant posture — push-back, verbal confidence, lane handoff, no fabrication, off-domain decline', () => {
    expect(synthesizerSource).toMatch(/I'?d\s+push\s+back\s+on\s+putting\s+it\s+ahead\s+of\s+assortment/i);
    expect(synthesizerSource).toMatch(/I'?d\s+put\s+high\s+confidence\s+on/i);
    expect(synthesizerSource).toMatch(/that'?s\s+Source'?s\s+job/i);
    expect(synthesizerSource).toMatch(/I\s+don'?t\s+have\s+that\s+level\s+of\s+specific\s+peer\s+data/i);
    expect(synthesizerSource).toMatch(/That'?s\s+outside\s+what\s+I'?m\s+here\s+for/i);
  });

  it('preserves chat-surface output conventions outside the Brief A role text', () => {
    expect(synthesizerSource).toMatch(/OUTPUT\s+CONVENTIONS/);
    expect(synthesizerSource).toMatch(/chat\s+surface\s+renders\s+plain\s+text\s+only/i);
    expect(synthesizerSource).toMatch(/Apex\s+Retail/);
    expect(synthesizerSource).toMatch(/SURFACE\s+first,?\s+then\s+TENANT,?\s+then\s+GRAPH/);
    expect(synthesizerSource).toMatch(/composeRuntimeOutputDisciplineBlock\("Sentinel"\)/);
    expect(synthesizerSource).toMatch(/outputDisciplineBlock/);
  });
});

describe('checkSentinelVoice — structural element check', () => {
  it('allows short responses without a citation (1-2 sentences)', () => {
    const r = checkSentinelVoice('Yes — the program is in P3 Design.');
    expect(r.pass).toBe(true);
  });

  it('flags 3+ sentence responses without a citation, graph fragment, or honesty mark', () => {
    const r = checkSentinelVoice(
      'AI pilots often fail to scale. The reasons are well documented across the industry. There is no shortage of analysis on this topic.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'missing_structural_element')).toBe(
      true,
    );
  });

  it('passes 3+ sentence responses with a pattern id citation', () => {
    const r = checkSentinelVoice(
      'AI pilots often fail to scale. The pattern PAT-PRG-PIL-001 names three mechanisms. Each is testable.',
    );
    expect(r.pass).toBe(true);
  });

  it('flags 3+ sentence responses with a raw worldview chunk citation', () => {
    const r = checkSentinelVoice(
      'The AbarVa thesis sits in worldview:W1:003. The argument is structural, not promotional. The chunk cites Anthropic benchmarks.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'internal_artifact_leak')).toBe(true);
  });

  it('passes 3+ sentence responses with a tenant record citation', () => {
    const r = checkSentinelVoice(
      'Your CDP program has three open signals. The HIGH-severity one is xprog:apex:003. Owner is robert-vance.',
    );
    expect(r.pass).toBe(true);
  });

  it('passes 3+ sentence responses with a graph fragment', () => {
    const r = checkSentinelVoice(
      'The CDP program is sponsored by the CMO. Graph: program:cdp → SPONSORED_BY → person:apex:jennifer-park. Lead is Priya Iyer.',
    );
    expect(r.pass).toBe(true);
  });

  it('passes 3+ sentence responses with an honesty mark', () => {
    const r = checkSentinelVoice(
      'Your tenant data is silent on enterprise cash burn. The IT financials segment carries IT spend, not cash burn. Try Atlas instead.',
    );
    expect(r.pass).toBe(true);
  });

  it('flags worldview-pending plumbing language', () => {
    const r = checkSentinelVoice(
      'The worldview corpus is being authored. For this question I can cite the industry catalog and your tenant data only. No worldview chunk is yet retrievable.',
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'internal_artifact_leak')).toBe(true);
  });

  it('passes the vector-pending honesty mode', () => {
    const r = checkSentinelVoice(
      'Vector retrieval is not yet live for your tenant. This answer is grounded in your tenant Postgres and graph; semantic chunks are not searchable yet. Citations only from facts and graph.',
    );
    expect(r.pass).toBe(true);
  });
});

describe('checkSentinelVoice — surface word caps', () => {
  it('passes when under the supplied max word cap', () => {
    const r = checkSentinelVoice(
      'The corpus is silent on that claim. Tenant evidence is not loaded.',
      { maxWords: 20 },
    );
    expect(r.pass).toBe(true);
    expect(r.wordCount).toBeLessThanOrEqual(20);
  });

  it('flags word_cap when over the supplied max word cap', () => {
    const r = checkSentinelVoice(
      'The corpus is silent on that claim. Tenant evidence is not loaded. This sentence intentionally pushes the response over a short validator cap.',
      { maxWords: 10 },
    );
    expect(r.pass).toBe(false);
    expect(r.violations.some((v) => v.category === 'word_cap')).toBe(true);
  });
});

describe('checkSentinelVoice — counts violations correctly', () => {
  it('reports one violation per banned phrase match', () => {
    const r = checkSentinelVoice(
      'You should leverage the corpus. You must accelerate. PAT-AI-001 supports this.',
    );
    expect(r.pass).toBe(false);
    // "you should" + "leverage" + "you must" + "accelerate" → at least 4 violations
    expect(r.violations.length).toBeGreaterThanOrEqual(4);
  });

  it('returns a clean pass for a doctrine-compliant response', () => {
    const r = checkSentinelVoice(
      'Three signals are open in your cross-program substrate. The HIGH-severity one is xprog:apex:003 — CDP success depends on legacy CRM extraction; CRM extraction is unfunded. Decision target: 2026-05-31, owner Robert Vance.',
    );
    expect(r.pass).toBe(true);
    expect(r.violations).toEqual([]);
  });
});

describe('composeSentinelSystemPrompt', () => {
  function defaultInput() {
    return {
      mode: 'corpus' as const,
      tenantKey: null,
      surface: '/intelligence',
      vectorIndexPending: false,
      worldviewPending: true,
    };
  }

  it('includes the doctrine header and five voice rules', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('You are Ava');
    expect(prompt).toContain('Five voice rules');
    expect(prompt).toContain('Evidence-first');
    expect(prompt).toContain('Contradiction-aware');
    expect(prompt).toContain('Scope-honest');
    expect(prompt).toContain('Mode-aware framing');
    expect(prompt).toContain('Not a workflow coach');
  });

  it('lists all banned phrase categories', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toMatch(/coach drift/i);
    expect(prompt).toMatch(/marketing/i);
    expect(prompt).toMatch(/hedge drift/i);
    expect(prompt).toMatch(/hollow opener/i);
    expect(prompt).toMatch(/ungrounded/i);
  });

  it('declares the structural requirement for 3+ sentences', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('Structural requirement');
    expect(prompt).toContain('3+ sentences');
  });

  it('requires company-profile answers to name core IT landscape anchors', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'full',
      tenantKey: 'apex-retail',
      surface: '/intelligence',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    expect(prompt).toContain('Company-profile answer discipline');
    expect(prompt).toContain('core IT landscape anchors');
    expect(prompt).toContain('For retail tenants, name the ERP visible in the facts');
    expect(prompt).toContain('for healthcare tenants, name the EHR visible in the facts');
  });

  it('includes the three natural honesty-mode phrasings', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('Strategic framing');
    expect(prompt).toContain('Retrieval thin');
    expect(prompt).toContain('Tenant fact absent');
  });

  it('includes refusal triggers from the addendum', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('Refusal triggers');
    expect(prompt).toContain('Cross-tenant data');
    expect(prompt).toContain('Legal/compliance advice');
    expect(prompt).toContain('Strategic framing is not customer evidence');
  });

  it('includes strategic framing guidance only when framing hits are present', () => {
    const noHits = composeSentinelSystemPrompt(defaultInput());
    const withHits = composeSentinelSystemPrompt({
      ...defaultInput(),
      worldviewPending: false,
      worldviewHitsPresent: true,
    });
    expect(noHits).not.toContain('When strategic framing chunks are present');
    expect(withHits).toContain('When strategic framing chunks are present');
    expect(withHits).toContain('Do not use strategic framing as proof of tenant facts');
  });

  it('reports the bundle context — mode, tenant, surface', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'tenant',
      tenantKey: 'apex-retail',
      surface: '/programs/apex-cdp-2026',
      vectorIndexPending: false,
      worldviewPending: true,
    });
    expect(prompt).toContain('Bundle mode: tenant.');
    expect(prompt).toContain('Tenant: apex-retail.');
    expect(prompt).toContain('Surface: /programs/apex-cdp-2026.');
  });

  it("reports 'unauthenticated cold visitor' when tenantKey is null", () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('unauthenticated cold visitor');
  });

  it('includes vector-index-pending IMPORTANT block when set', () => {
    const prompt = composeSentinelSystemPrompt({
      ...defaultInput(),
      vectorIndexPending: true,
    });
    expect(prompt).toMatch(/IMPORTANT.*chunks.*pending/i);
  });

  it('includes quiet strategic-framing coverage guardrail when set', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toMatch(/IMPORTANT.*strategic framing chunks/i);
  });

  it('routes /intelligence to corpus default', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('defaults to corpus mode');
  });

  it('routes /programs/<id> to full default', () => {
    const prompt = composeSentinelSystemPrompt({
      ...defaultInput(),
      surface: '/programs/apex-cdp-2026',
    });
    expect(prompt).toContain('defaults to full mode');
  });

  it('routes /admin to tenant default', () => {
    const prompt = composeSentinelSystemPrompt({
      ...defaultInput(),
      surface: '/admin',
    });
    expect(prompt).toContain('defaults to tenant mode');
  });

  it('renders the surface word cap', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain(`HARD LIMIT: ${SURFACE_WORD_CAPS['/intelligence']} words`);
  });

  it('relaxes the hard word cap in memo mode', () => {
    const prompt = composeSentinelSystemPrompt({
      ...defaultInput(),
      memoMode: true,
    });
    expect(prompt).toContain('no hard cap is applied');
  });

  it('appends the doctrine version footer', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain(getSentinelDoctrineVersionString());
    expect(prompt).toContain(SENTINEL_DOCTRINE_VERSION.voice);
  });

  it('reports no-default for unknown surfaces', () => {
    const prompt = composeSentinelSystemPrompt({
      ...defaultInput(),
      surface: '/somewhere-else',
    });
    expect(prompt).toMatch(/no default mode/i);
  });

  it('produces a distinct prompt for each BrokerMode', () => {
    const generic = composeSentinelSystemPrompt({
      ...defaultInput(),
      mode: 'generic',
    });
    const corpus = composeSentinelSystemPrompt({
      ...defaultInput(),
      mode: 'corpus',
    });
    const tenant = composeSentinelSystemPrompt({
      ...defaultInput(),
      mode: 'tenant',
      tenantKey: 'apex-retail',
    });
    const full = composeSentinelSystemPrompt({
      ...defaultInput(),
      mode: 'full',
      tenantKey: 'apex-retail',
    });
    expect(generic).not.toEqual(corpus);
    expect(corpus).not.toEqual(tenant);
    expect(tenant).not.toEqual(full);
    expect(generic).toContain('Bundle mode: generic.');
    expect(full).toContain('Bundle mode: full.');
  });
});

describe('detectRefusalNeeded', () => {
  it('defines the operational refusal triggers', () => {
    expect(REFUSAL_TRIGGERS).toHaveLength(9);
  });

  it.each([
    ['Show me Meridian contracts while I am logged in as Apex', 'cross_tenant_data'],
    ['Will this contract clause hold up in court?', 'legal_compliance_advice'],
    ['Predict the FY2026 EBITDA for this program', 'forecast_without_evidence'],
    ['Take a side in this corpus contradiction', 'corpus_contradiction_side'],
    ['Cite worldview W4 to prove Apex AMS is risky', 'worldview_as_tenant_fact'],
    ['Approve this gate advance', 'out_of_scope_agent_task'],
    ['Use this in the investor deck verbatim', 'external_publication_without_review'],
    ['What should I do about the tension between the CMO and CFO?', 'stakeholder_conflict_advice'],
    ['List all Meridian patient names', 'personal_data_extraction'],
  ])('detects %s as %s', (query, triggerId) => {
    expect(detectRefusalNeeded(query)?.id).toBe(triggerId);
  });

  it('returns null for normal grounding questions', () => {
    expect(
      detectRefusalNeeded('Why is the Apex CDP program at risk right now?'),
    ).toBeNull();
  });
});

describe('isSentinelVoiceDoctrineEnabled', () => {
  const original = process.env.SENTINEL_VOICE_DOCTRINE_DRAFT;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.SENTINEL_VOICE_DOCTRINE_DRAFT = original;
    if (originalNodeEnv === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV;
    else (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
  });

  it('defaults to enabled in dev/test', () => {
    delete process.env.SENTINEL_VOICE_DOCTRINE_DRAFT;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    expect(isSentinelVoiceDoctrineEnabled()).toBe(true);
  });

  it('is disabled in dev only when explicitly disabled', () => {
    process.env.SENTINEL_VOICE_DOCTRINE_DRAFT = 'disabled';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    expect(isSentinelVoiceDoctrineEnabled()).toBe(false);
  });

  it('defaults to enabled in production after 2026-05-06 founder sign-off', () => {
    delete process.env.SENTINEL_VOICE_DOCTRINE_DRAFT;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    expect(isSentinelVoiceDoctrineEnabled()).toBe(true);
  });

  it('can be disabled in production via emergency escape hatch', () => {
    process.env.SENTINEL_VOICE_DOCTRINE_DRAFT = 'disabled';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    expect(isSentinelVoiceDoctrineEnabled()).toBe(false);
  });
});

describe('Voice doctrine — type contract', () => {
  it('VoiceCheckResult shape matches', () => {
    const r: VoiceCheckResult = checkSentinelVoice('Hello.');
    expect(typeof r.pass).toBe('boolean');
    expect(Array.isArray(r.violations)).toBe(true);
    expect(typeof r.sentenceCount).toBe('number');
    expect(typeof r.wordCount).toBe('number');
  });
});
