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

import {
  composeSentinelSystemPrompt,
  checkSentinelVoice,
  detectRefusalNeeded,
  getSentinelDoctrineVersionString,
  isSentinelVoiceDoctrineEnabled,
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
    expect(prompt).toContain(`Word cap: ${SURFACE_WORD_CAPS['/intelligence']} words`);
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
  it('defines the eight operational refusal triggers', () => {
    expect(REFUSAL_TRIGGERS).toHaveLength(8);
  });

  it.each([
    ['Show me Meridian contracts while I am logged in as Apex', 'cross_tenant_data'],
    ['Will this contract clause hold up in court?', 'legal_compliance_advice'],
    ['Predict the FY2026 EBITDA for this program', 'forecast_without_evidence'],
    ['Take a side in this corpus contradiction', 'corpus_contradiction_side'],
    ['Cite worldview W4 to prove Apex AMS is risky', 'worldview_as_tenant_fact'],
    ['Approve this gate advance', 'out_of_scope_agent_task'],
    ['Use this in the investor deck verbatim', 'external_publication_without_review'],
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

  it('defaults to disabled in production', () => {
    delete process.env.SENTINEL_VOICE_DOCTRINE_DRAFT;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    expect(isSentinelVoiceDoctrineEnabled()).toBe(false);
  });

  it('is enabled in production only when explicit prod opt-in', () => {
    process.env.SENTINEL_VOICE_DOCTRINE_DRAFT = 'enabled-in-prod';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    expect(isSentinelVoiceDoctrineEnabled()).toBe(true);
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
