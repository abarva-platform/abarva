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

  it('is omitted on the Source surface, which keeps its prescriptive gate posture', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: 'apex-retail',
      surface: '/source',
      vectorIndexPending: false,
      worldviewPending: false,
    });
    expect(prompt).not.toMatch(/Consultant\s+posture/i);
  });
});

// INT-VOICE.STRAT-2026-05-10c · The Ask synthesizer prompt is the primary
// lever for Sentinel's voice on the Intelligence surface. We assert against
// the raw prompt source since it is not exported as a constant. This guards
// against the prompt drifting away from the consultant posture.
describe('Ask synthesizer prompt — consultant posture (INT-VOICE.STRAT-2026-05-10c)', () => {
  const synthesizerSource = readFileSync(
    join(__dirname, '..', '..', '..', 'intelligence', 'ask', 'synthesizer.ts'),
    'utf8',
  );

  it('opens with the senior-consultant archetype, not librarian / search-index framing', () => {
    expect(synthesizerSource).toMatch(/senior\s+AI[- ]strategy\s+consultant/i);
    expect(synthesizerSource).toMatch(/CXO\s+at\s+a\s+\$1B\+/i);
    expect(synthesizerSource).toMatch(/(?:NOT\s+a\s+corpus\s+search|NOT\s+a\s+librarian|NOT\s+a\s+neutral\s+summary)/);
  });

  it('mandates the CORE POSTURE — opinions, verbal confidence, conversational citations, disagreement', () => {
    expect(synthesizerSource).toMatch(/CORE\s+POSTURE/);
    expect(synthesizerSource).toMatch(/Form\s+a\s+view,?\s+defend\s+it\s+briefly/i);
    expect(synthesizerSource).toMatch(/Calibrate\s+confidence\s+in\s+plain\s+language/i);
    expect(synthesizerSource).toMatch(/Cite\s+evidence\s+where\s+it\s+strengthens\s+the\s+argument/i);
    expect(synthesizerSource).toMatch(/Disagree\s+when\s+the\s+evidence\s+supports\s+disagreement/i);
  });

  it('declares the one firm line — anti-fabrication of tenant facts and peer statistics', () => {
    expect(synthesizerSource).toMatch(
      /THE\s+ONE\s+FIRM\s+LINE[^]*DO\s+NOT\s+FABRICATE\s+TENANT[- ]SPECIFIC\s+FACTS\s+OR\s+PEER\s+STATISTICS/i,
    );
    expect(synthesizerSource).toContain('73% of retailers');
    expect(synthesizerSource).toContain('Algonomy has 89% market share');
  });

  it('lists banned retrieval-mechanics framings', () => {
    expect(synthesizerSource).toMatch(/BANNED\s+FRAMINGS/);
    expect(synthesizerSource).toContain('the sources don\'t contain');
    expect(synthesizerSource).toContain('what the sources do show');
  });

  it('lists banned academic / cover-your-back disclaimer phrasings', () => {
    expect(synthesizerSource).toMatch(/ALSO\s+BANNED[^]*academic/i);
    expect(synthesizerSource).toContain('based on the limited data available to me');
    expect(synthesizerSource).toContain('at the general AI industry level');
    expect(synthesizerSource).toContain('On the one hand');
  });

  it('carries both worked examples — common bets AND failure modes — with verbatim BAD anchors', () => {
    expect(synthesizerSource).toMatch(/EXAMPLE\s+1[^]*common\s+AI\s+bets/i);
    expect(synthesizerSource).toMatch(/EXAMPLE\s+2[^]*failure\s+modes/i);
    // The verbatim Apex / Carlos 2026-05-10 BAD responses are anchors so
    // the model learns the exact shape to avoid.
    expect(synthesizerSource).toContain("The sources don't contain indexed benchmark data on AI bet prevalence");
    expect(synthesizerSource).toContain("Assortment optimization failure modes are not well-indexed");
  });

  it('GOOD examples demonstrate consultant posture — opinions, verbal confidence, push-back / handoff', () => {
    // Example 1 GOOD: opens with a view, names the binding pattern, ends
    // with a push-back line ("I'd push back on anyone proposing Loyalty
    // NBO before the customer-data foundation is real").
    expect(synthesizerSource).toMatch(/I'?d\s+push\s+back\s+on\s+anyone\s+proposing/i);
    // Example 2 GOOD: opens with "the biggest failure mode is X — and it's
    // the one I'd want you focused on", uses verbal confidence ("high
    // confidence on this one"), ends with a handoff to Source.
    expect(synthesizerSource).toMatch(/biggest\s+failure\s+mode/i);
    expect(synthesizerSource).toMatch(/high\s+confidence\s+on\s+this\s+one/i);
    expect(synthesizerSource).toMatch(/that'?s\s+Source'?s\s+job/i);
  });

  it('explicitly bans pivoting to "what the sources do show" as a substitute', () => {
    expect(synthesizerSource).toMatch(
      /Do\s+not\s+pivot\s+to\s+["']?what\s+the\s+sources\s+do\s+show["']?\s+as\s+a\s+substitute/i,
    );
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

  it('passes 3+ sentence responses with a worldview chunk citation', () => {
    const r = checkSentinelVoice(
      'The AbarVa thesis sits in worldview:W1:003. The argument is structural, not promotional. The chunk cites Anthropic benchmarks.',
    );
    expect(r.pass).toBe(true);
  });

  it('passes 3+ sentence responses with a tenant record citation', () => {
    const r = checkSentinelVoice(
      'Your CDP program has three open signals. The HIGH-severity one is xprog:apex:003. Owner is robert-vance.',
    );
    expect(r.pass).toBe(true);
  });

  it('passes 3+ sentence responses with a graph fragment', () => {
    const r = checkSentinelVoice(
      'The CDP program is sponsored by the CMO. Graph: program:apex-cdp-2026 → SPONSORED_BY → person:apex:jennifer-park. Lead is Priya Iyer.',
    );
    expect(r.pass).toBe(true);
  });

  it('passes 3+ sentence responses with an honesty mark', () => {
    const r = checkSentinelVoice(
      'Your tenant data is silent on enterprise cash burn. The IT financials segment carries IT spend, not cash burn. Try Atlas instead.',
    );
    expect(r.pass).toBe(true);
  });

  it('passes the worldview-pending honesty mode', () => {
    const r = checkSentinelVoice(
      'The worldview corpus is being authored. For this question I can cite the industry catalog and your tenant data only. No worldview chunk is yet retrievable.',
    );
    expect(r.pass).toBe(true);
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
    expect(prompt).toContain('You are Sentinel');
    expect(prompt).toContain('Five voice rules');
    expect(prompt).toContain('Citation-first');
    expect(prompt).toContain('Contradiction-aware');
    expect(prompt).toContain('Scope-honest');
    expect(prompt).toContain('Mode-aware framing');
    expect(prompt).toContain('Not a coach');
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

  it('includes the three honesty-mode phrasings', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('Worldview-pending');
    expect(prompt).toContain('Vector-pending');
    expect(prompt).toContain('Tenant-blank');
  });

  it('includes refusal triggers from the addendum', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toContain('Refusal triggers');
    expect(prompt).toContain('Cross-tenant data');
    expect(prompt).toContain('Legal/compliance advice');
    expect(prompt).toContain('Worldview is strategic framing, not customer evidence');
  });

  it('includes worldview guidance only when worldview hits are present', () => {
    const noHits = composeSentinelSystemPrompt(defaultInput());
    const withHits = composeSentinelSystemPrompt({
      ...defaultInput(),
      worldviewPending: false,
      worldviewHitsPresent: true,
    });
    expect(noHits).not.toContain('When worldview chunks are present');
    expect(withHits).toContain('When worldview chunks are present');
    expect(withHits).toContain('Do not use worldview chunks as proof of tenant facts');
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

  it('includes worldview-pending IMPORTANT block when set', () => {
    const prompt = composeSentinelSystemPrompt(defaultInput());
    expect(prompt).toMatch(/IMPORTANT.*worldview/i);
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
