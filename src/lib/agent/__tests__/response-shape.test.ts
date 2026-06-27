import {
  formatPercentile,
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
  stripChatMarkdownFormatting,
} from '../response-shape';

describe('agent response shape', () => {
  it('removes raw markdown emphasis without losing readable text', () => {
    expect(stripChatMarkdownFormatting('**Demand forecasting** is highest. __Missing__: SKU margins.')).toBe(
      'Demand forecasting is highest. Missing: SKU margins.',
    );
  });

  // VOICE.STRAT-2026-05-10f — Strategic Moves Originate is a Brief B advisor
  // surface and now passes through (no compaction). The compactor branch
  // itself is gone (compactStrategicMoveOriginateText is no longer wired).
  // The original assertion that the originate response compacts to a
  // {headline} / - Why: / - Missing: / - Choose: shape is retired with the
  // dispatch. See the "Strategic Moves surface — Brief B prose preservation"
  // describe block below for the new contract.
  it('Strategic Moves Originate (legacy /strategic-moves/new) passes Brief B prose through unchanged', () => {
    const raw = [
      "Demand forecasting is the highest-value AI target in merchandising — high confidence on this one.",
      'MAPE is 28.4% against a 20% target, inventory turns dropped from 4.2x to 3.6x, and the $248M revenue gap traces directly to forecast quality.',
      "I'd push back on parallel scope; sequence forecasting first and markdown optimization after the foundation is stable.",
      'What do you want to do next?',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/strategic-moves/new', raw);

    // Prose preserved, no auto-generated structural template.
    expect(shaped).not.toMatch(/^\s*- (?:Why|Evidence|Missing|Next|Question|Choose):/m);
    expect(shaped).toContain('high confidence on this one');
    expect(shaped).toContain('MAPE is 28.4%');
    expect(shaped).toContain("I'd push back on parallel scope");
  });

  it('preserves Tower Atlas prose instead of compacting into template bullets', () => {
    const raw = [
      '**Apex Retail Tower read: APX-04 is the highest risk.**',
      'Portfolio KPI evidence shows gate slippage, sponsor ambiguity, and unresolved value-baseline ownership across three programs.',
      'I recommend pausing new scope until the next gate review validates owner, baseline, and mitigation evidence.',
      'Here are several additional observations that would otherwise create a long wall of text across many lines and make the answer hard to scan.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).not.toContain('**');
    expect(shaped).toContain('Portfolio KPI evidence shows gate slippage');
    expect(shaped).toContain('I recommend pausing new scope');
    expect(shaped).not.toMatch(/^- Evidence:/m);
    expect(shaped).not.toMatch(/^- Next:/m);
  });

  it('scrubs raw portfolio signal ids from Tower copy', () => {
    const shaped = shapeAgentResponseForSurface(
      '/tower',
      'Demand Forecasting attestation is overdue — warning, signal: 39901c16-2e8b-4c8c-80aa-8a0182f26754.',
    );

    expect(shaped).not.toContain('39901c16-2e8b-4c8c-80aa-8a0182f26754');
    expect(shaped).not.toContain('signal:');
    expect(shaped).toContain('the referenced portfolio signal');
  });

  it('scrubs bare UUIDs from Tower copy even without a signal prefix', () => {
    const shaped = shapeAgentResponseForSurface(
      '/tower',
      'Demand Forecasting attestation is overdue on record 39901c16-2e8b-4c8c-80aa-8a0182f26754.',
    );

    expect(shaped).not.toContain('39901c16-2e8b-4c8c-80aa-8a0182f26754');
    expect(shaped).toContain('the referenced record');
  });

  it('adds an executable next action when Tower prose has no action cue', () => {
    const shaped = shapeAgentResponseForSurface(
      '/tower',
      'Apex Retail has pressure in value attainment. The evidence points to adoption and gate timing.',
    );

    expect(shaped).toMatch(/^- Next: open the cited initiative/m);
  });

  it('scrubs internal evidence plumbing terms from Tower copy', () => {
    const shaped = shapeAgentResponseForSurface(
      '/tower',
      'The tenant substrate has no canonical value pattern in the retrieved corpus chunk.',
    );

    expect(shaped).not.toMatch(/substrate|canonical value pattern|retrieved corpus chunk/i);
    expect(shaped).toContain('tenant evidence base');
    expect(shaped).toContain('validated benchmark pattern');
    expect(shaped).toContain('retrieved industry evidence');
  });

  it('does not turn ordinary dash-separated Tower prose into a fake comparison table', () => {
    const raw = [
      'My read: Apex Retail is past the activity question.',
      'There is a second pressure behind it - returns fraud model accuracy has slipped 8 points - so I would avoid treating this as a one-metric problem.',
      'Next step: open the signal evidence chain and assign the owner before the next governance review.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
    expect(shaped).toContain('returns fraud model accuracy has slipped');
    expect(shaped).toContain('Next');
  });

  it('preserves Tower option prose instead of synthesizing a comparison table', () => {
    const raw = [
      'Markdown optimization is the better second Move, but compare the two paths carefully.',
      'Demand Forecasting — Strength: directly attacks MAPE and stockouts. Weakness: already active in P0. Fit: deepen current program.',
      'Markdown Optimization — Strength: targets sell-through and margin leakage. Weakness: needs SKU margin data. Fit: originate next.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
    expect(shaped).toContain('Demand Forecasting');
    expect(shaped).toContain('Markdown Optimization');
    expect(shaped).not.toContain('**');
  });

  it('preserves evidence prose on the Tower surface', () => {
    const raw = [
      'The data says merchandising value is concentrated in forecast quality.',
      'MAPE is 28.4% against a 20% target.',
      'Inventory turns fell from 4.2x to 3.6x.',
      'Markdown rate is 12.8% against an 11% target.',
      'Source basis: Apex tenant KPI snapshot and merchandising system inventory.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).toContain('MAPE is 28.4%');
    expect(shaped).toContain('Inventory turns fell from 4.2x to 3.6x');
    expect(shaped).toContain('Markdown rate is 12.8%');
    expect(shaped).toContain('Source basis');
  });

  // INT-VOICE.STRAT-2026-05-10e · Intelligence surface preserves Brief A
  // prose. The 2026-05-10 Meridian audit captured every Sentinel response
  // being mangled into a structured-bullet template by
  // compactConsultantChatText at render time. Brief A explicitly requires
  // natural advisor prose; the compaction template is a Brief A violation
  // by construction. These tests lock in the prose-preservation contract.
  describe('Intelligence surface — Brief A prose preservation (INT-VOICE.STRAT-2026-05-10e)', () => {
    it('does not inject a structured-bullet template into a clean Brief A response', () => {
      // Canonical Brief A consultant response — exactly what the synthesizer
      // emits when the prompt is correctly deployed. Pre-fix, this would
      // come back as headline + - Evidence: + - Missing: + - Next: +
      // - Question: bullets. Post-fix, it round-trips structurally
      // unchanged.
      const raw = [
        'For a multi-banner specialty retailer your size, the highest-leverage bet right now is assortment optimization, and I\'d put high confidence on that.',
        'Three peer specialty retailers in the corpus saw 8-15% margin gains at the unit level, though all three also hit the COGS-margin trap on horizontal rollout — pattern I\'d want you to plan around from day one.',
        'I\'d push back on putting dynamic pricing ahead of assortment for Apex.',
        'What\'s driving the question — are you trying to build a 12-month plan, or evaluating one specific vendor pitch?',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).not.toMatch(/^- Evidence:/m);
      expect(shaped).not.toMatch(/^- Missing:/m);
      expect(shaped).not.toMatch(/^- Next:/m);
      expect(shaped).not.toMatch(/^- Question:/m);
      // Multi-paragraph natural prose stays intact. The Brief A response has
      // four sentences; after shaping it should still contain all four
      // sentence cores — not be truncated to a 18-word headline.
      expect(shaped).toContain('high confidence on that');
      expect(shaped).toContain('COGS-margin trap');
      expect(shaped).toContain("push back on putting dynamic pricing");
      expect(shaped).toContain('What\'s driving the question');
    });

    it('does not promote a "we don\'t have that" sentence into a "- Missing:" bullet', () => {
      // The 2026-05-10 Meridian audit's worst failure: a Brief A line like
      // "I don't have that in your connected data" got promoted into a
      // structured "- Missing: ..." bullet by extractMissingLine, making
      // every honest data caveat look like a server-side refusal template.
      const raw = [
        "I don't have that in your connected data — your finance team would have it directly.",
        "What I can tell you about peer benchmarks: range from corpus for IDNs your size is roughly $3-15M annual on AI tooling, but it varies enormously based on what's counted.",
        'If you want a real benchmark, get the actual number from finance and define what counts.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).not.toMatch(/^- Missing:/m);
      expect(shaped).not.toMatch(/^- Evidence:/m);
      // The honest caveat is preserved verbatim, not promoted into a bullet.
      expect(shaped).toContain("I don't have that in your connected data");
    });

    it('does not produce a headline-only summary that drops most of the response', () => {
      // The compaction template took the first sentence (max 18 words) as
      // the headline and discarded everything else that didn't match its
      // narrow extraction regexes. Make sure that no longer happens.
      const raw = [
        "The biggest failure mode at your scale is the COGS-margin trap, and it's the one I'd want you focused on.",
        'Pattern is straightforward — the model recommends a better-converting mix, revenue lifts, and margin gives the gain back because recs push toward higher-velocity items where margin is thinner.',
        'High confidence on this one.',
        "Two more worth knowing about, in order of how much I'd worry for Apex specifically: POS-integration depth, which is your specific risk; and seasonality blindness, less specific to Apex but worth flagging.",
        "For vendor evaluation specifically, that's Source's job, not mine.",
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      // All five sentences round-trip in some form.
      expect(shaped).toContain('biggest failure mode');
      expect(shaped).toContain('COGS-margin trap');
      expect(shaped).toContain('High confidence on this one');
      expect(shaped).toContain('POS-integration depth');
      expect(shaped).toContain("Source's job");
      // No structured-bullet shape.
      expect(shaped).not.toMatch(/^- (?:Evidence|Missing|Next|Question):/m);
    });

    it('still strips HTML markup and Markdown bold without compacting', () => {
      // The HTML/Markdown noise strip is preserved (it lives in
      // normalizeAgentMarkupForPlainText + stripChatMarkdownFormatting,
      // applied before the compaction branch). What's removed is the
      // compaction itself.
      const raw =
        '**Apex Retail** has three signals. The data substrate flags <strong>POS-integration</strong> as medium-confidence.';

      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).not.toContain('**');
      expect(shaped).not.toContain('<strong>');
      expect(shaped).toContain('Apex Retail');
      expect(shaped).toContain('POS-integration');
    });

    it('scrubs internal retrieval language and ids from visible advisor prose', () => {
      const raw = [
        'At the general AI industry level, not corpus-grounded for First Capital specifically, I would treat this as a control-plane issue.',
        'The worldview corpus is being authored; worldview:W1:003 frames this.',
        'sig:fcfi:002 and fcfi-data-gov-2026 are relevant.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).not.toMatch(/worldview corpus|worldview:W|sig:fcfi|fcfi-data-gov-2026/i);
      expect(shaped).not.toMatch(/not corpus-grounded/i);
      expect(shaped).toContain('control-plane issue');
      expect(shaped).toContain('data gov program');
    });

    it('removes malformed shorthand artifact blocks before rendering', () => {
      const raw =
        'My read is direct. [[artifact:pattern-match]]{"patternId":"PAT-X","name":"Internal"}[[/]] The visible answer continues.';

      const shaped = shapeStreamingAgentTextForSurface('/intelligence', raw);

      expect(shaped).toBe('My read is direct. The visible answer continues.');
      expect(shaped).not.toContain('artifact');
      expect(shaped).not.toContain('patternId');
    });

    it('removes raw evidence dumps and internal routing footer from Intelligence answers', () => {
      const raw = [
        'AI is not the first tool here. Deterministic feed certification and ownership routing should come first.',
        'SOURCES',
        'Lakeshore Holdings live Intelligence surface',
        '·',
        'tenant support',
        'Lakeshore Holdings 360 Intelligence substrate',
        '·',
        'tenant support',
        '',
        'TABLES',
        'Supporting Material',
        'SOURCE TYPE CONFIDENCE HOW IT SUPPORTS THE ANSWER',
        'Live surface tenant support 0.99 Active client evidence',
        'Next, have the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves.',
      ].join('\n');

      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).toContain('AI is not the first tool here');
      expect(shaped).toContain('Evidence trail');
      expect(shaped).toContain('Evidence drill-down');
      expect(shaped).not.toMatch(/\btenant support\b/i);
      expect(shaped).not.toMatch(/\bsupporting material\b/i);
      expect(shaped).not.toMatch(/belongs in Source,\s*Tower,\s*or Moves/i);
      expect(shaped).not.toContain('SOURCE TYPE CONFIDENCE HOW IT SUPPORTS THE ANSWER');
    });

    it('repairs high-confidence currency shorthand without corrupting operating counts', () => {
      const raw =
        'The loaded sources show 86M measured value and 9M realized value; the payments lane still runs 85,000 payments/month at 60/100 control maturity.';

      const shaped = shapeAgentResponseForSurface('/intelligence', raw);

      expect(shaped).toContain('$86M measured value');
      expect(shaped).toContain('$9M realized value');
      expect(shaped).toContain('85,000 payments/month');
      expect(shaped).toContain('60/100 control maturity');
    });
  });

  it('preserves sequential steps when the answer explains a path (Tower surface)', () => {
    const raw = [
      'The path is a three-step operating-model shift.',
      '1. Baseline. Confirm KPI owner, current value, target, and source system.',
      '2. Design. Map planner decisions, model suggestions, and human override points.',
      '3. Mobilize. Run one category pilot and review exception handling weekly.',
      'The outcome is a governed merchandising workflow, not a science project.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).toContain('1. Baseline.');
    expect(shaped).toContain('2. Design.');
    expect(shaped).toContain('3. Mobilize.');
    expect(shaped).not.toMatch(/^- Evidence:/m);
  });

  it('preserves brief narrative shape when context matters more than bullets', () => {
    const raw = [
      'Apex got here through several small merchandising decisions compounding over two seasons.',
      'Forecast overrides became normal because planners did not trust category-level signals.',
      '',
      'That made allocation look like the problem, even though the root issue was weak demand sensing.',
      'The next conversation should separate model quality from process adherence.',
    ].join('\n');

    const shaped = shapeAgentResponseForSurface('/strategic-moves/new', raw);

    expect(shaped).toContain('\n\n');
    expect(shaped).not.toMatch(/^- Evidence:/m);
    expect(shaped).not.toMatch(/^\| Option/m);
    expect(shaped.split('\n\n')).toHaveLength(2);
  });

  it('only strips raw markdown during streaming and preserves full content until final compaction', () => {
    const streaming = shapeStreamingAgentTextForSurface('/tower', '**Apex Retail** has three signals. More text is still arriving.');

    expect(streaming).toBe('Apex Retail has three signals. More text is still arriving.');
  });

  it('preserves word boundaries when compacting model HTML markup', () => {
    const raw = [
      'The live brief for Meridian Health shows three above-the-line clinical<strong>AI</strong> bets, but does not surface a dedicated clinical analytics environment inventory.',
      'What is visible points to active<strong>clinical</strong> intelligence initiatives — Population Health AI for ACOs scored at 87<strong>and</strong> flagged for origination, Ambient AI Clinical Documentation already in-flight<strong>at</strong> 82 and in design.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/intelligence', raw);

    expect(shaped).toContain('clinical AI');
    expect(shaped).toContain('active clinical');
    expect(shaped).toContain('87 and');
    expect(shaped).not.toMatch(/clinicalAI|activeclinical|87and|in-flightat/);
    expect(shaped).not.toContain('choose an action, compare options, or ask for evidence');
  });

  it('preserves word boundaries during streaming markup repair', () => {
    const streaming = shapeStreamingAgentTextForSurface(
      '/intelligence',
      'clinical<strong>AI</strong> and active<strong>clinical</strong> work scored at 87<strong>and</strong> is in-flight<strong>at</strong> 82.',
    );

    expect(streaming).toBe('clinical AI and active clinical work scored at 87 and is in-flight at 82.');
  });

  it('removes raw pattern ids from visible final responses', () => {
    const shaped = shapeAgentResponseForSurface(
      '/strategic-moves/new',
      'The CMIO sponsorship pattern [P-HC-005] is the first gate. Missing: named clinical owner.',
    );

    expect(shaped).toContain('CMIO sponsorship pattern');
    expect(shaped).not.toContain('P-HC-005');
  });

  it('removes raw use-case ids during streaming', () => {
    const streaming = shapeStreamingAgentTextForSurface(
      '/intelligence',
      'UC-HC-FRONT-001 is relevant when the data is available.',
    );

    expect(streaming).toBe('the cited pattern is relevant when the data is available.');
  });

  // VOICE.STRAT-2026-05-10f · Source surface preserves Brief C prose. The
  // 2026-05-10 Meridian production audit captured every Sentinel response
  // being mangled into a structured-bullet template by the same compactor
  // that hits Source. Brief C explicitly requires natural advisor prose
  // ("Don't bullet-point everything. Use comparison tables when they earn
  // their place — for actual head-to-head evaluation"). The shape contract
  // for Source mirrors Intelligence.
  describe('Source surface — Brief C prose preservation (VOICE.STRAT-2026-05-10f)', () => {
    it('does not inject the structured-bullet template into a Brief C vendor shortlist', () => {
      const raw = [
        'Three credible vendors for your specific situation, with my read on each:',
        "Algonomy is the strongest fit at the capability level. They have the most mature multi-banner specialty retail playbook, customer evidence is deep, and they've been at this long enough to have real implementation patterns. The trade-off: they're a bigger ship.",
        'Daisy Intelligence is a credible second. Strong work in adjacent retail, financial health appears stable.',
        "I'd drop the bigger horizontal players — capability is broader but assortment is not their lead.",
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/source', raw);

      expect(shaped).not.toMatch(/^\s*- Evidence:/m);
      expect(shaped).not.toMatch(/^\s*- Missing:/m);
      expect(shaped).not.toMatch(/^\s*- Next:/m);
      expect(shaped).not.toMatch(/^\s*- Question:/m);
      expect(shaped).toContain('Algonomy is the strongest fit');
      expect(shaped).toContain('Daisy Intelligence is a credible second');
      expect(shaped).toContain("I'd drop the bigger horizontal players");
    });

    it('does not promote a Brief C "I don\'t have visibility into..." caveat into a "- Missing:" bullet', () => {
      const raw = [
        "I don't have visibility into Apex's current AI tooling spend — that would be in your procurement or finance data, not in what's connected to me.",
        'Pattern range from corpus for multi-banner specialty retailers your size is roughly $3-15M annual on AI tooling and platforms.',
        'If you want a real benchmark, get the actual number from finance and define the scope of what counts.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/source', raw);

      expect(shaped).not.toMatch(/^\s*- Missing:/m);
      expect(shaped).not.toMatch(/^\s*- Evidence:/m);
      expect(shaped).toContain("I don't have visibility into Apex's current AI tooling spend");
    });
  });

  // VOICE.STRAT-2026-05-10f · Strategic Moves surface preserves Brief B
  // prose. Both the chat-level compaction (compactConsultantChatText) and
  // the originate-level compaction (compactStrategicMoveOriginateText)
  // were the same Brief violation by construction.
  describe('Strategic Moves surface — Brief B prose preservation (VOICE.STRAT-2026-05-10f)', () => {
    it('does not inject the structured-bullet template into a Brief B Sentinel-handoff pickup', () => {
      const raw = [
        'Picking up from your Intelligence conversation — assortment optimization for Apex, with three patterns Sentinel surfaced that need to live in the bet\'s design from the start.',
        "We're at P0 (Originate). The first real question isn't workflow — it's whether you have the sponsorship in place to actually shape this well.",
        'CIO-alone sponsorship for a merchandising AI bet fails most of the time. Before we go further, who\'s your CMO partner on this, and have you talked to them yet?',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('programs', raw);

      expect(shaped).not.toMatch(/^\s*- Evidence:/m);
      expect(shaped).not.toMatch(/^\s*- Missing:/m);
      expect(shaped).not.toMatch(/^\s*- Next:/m);
      expect(shaped).not.toMatch(/^\s*- Question:/m);
      expect(shaped).not.toMatch(/^\s*- Why:/m);
      expect(shaped).not.toMatch(/^\s*- Choose:/m);
      expect(shaped).toContain('Picking up from your Intelligence conversation');
      expect(shaped).toContain('P0 (Originate)');
      expect(shaped).toContain('CIO-alone sponsorship');
    });

    it('passes through on programs-detail surface (Move detail / phase / evidence)', () => {
      const raw = "I'd push back on advancing to charter — your sponsor structure isn't right yet, and three peer cases stalled in months 6-9. High confidence on this one.";
      const shaped = shapeAgentResponseForSurface('programs-detail', raw);

      expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question|Why|Choose):/m);
      expect(shaped).toContain("I'd push back on advancing to charter");
      expect(shaped).toContain('High confidence on this one');
    });

    it('passes through on the legacy /strategic-moves/new branch (no longer routed to compactStrategicMoveOriginateText)', () => {
      const raw = [
        "Strong opinion: assortment first, pricing second.",
        "Pricing AI works best on top of a stable assortment foundation, and trying to do them in parallel usually means redoing the pricing work in year two.",
        "Are you thinking about these as two separate Moves, or one combined Move?",
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/strategic-moves/new', raw);

      expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question|Why|Choose):/m);
      expect(shaped).toContain('Strong opinion: assortment first, pricing second');
      expect(shaped).toContain("Are you thinking about these as two separate Moves, or one combined Move?");
    });
  });

  // VOICE.STRAT-2026-05-10f · Anti-regression guard.
  //
  // Surfaces that run a Brief A/B/C-style expert-posture agent must NOT
  // be compacted. The compaction template destructures advisor prose into
  // headline + Evidence:/Missing:/Next:/Question: bullets, which violates
  // the conversational-naturalness contract from the founder-approved
  // 2026-05-10 voice doctrine package.
  //
  // If anyone in the future tries to add an expert-posture surface back
  // to shouldCompactSurface (via this module's prefix list, or via a
  // new special-case branch in shapeAgentResponseForSurface), this test
  // catches it at PR review.
  describe('shouldCompactSurface — guard against expert-posture surface compaction', () => {
    const EXPERT_POSTURE_SURFACES = [
      // Sentinel · Brief A
      'intelligence',
      '/intelligence',
      // Source · Brief C
      'source',
      '/source',
      // Nexus · Brief B (Strategic Moves / Programs)
      'programs',
      'programs-detail',
      '/programs',
      '/programs/new',
      'strategic-moves',
      'strategic-moves-new',
      'strategic-moves-workspace',
      '/strategic-moves',
    ];

    // ATLAS-CXO-QUALITY-AUDIT-2026-05-30 fix B — three invariants from the
    // Atlas CXO-quality audit. Anchor doc: docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md.
    describe('Atlas CXO-quality audit invariants', () => {
      it('does not inject the templated "Needs validation." or "Medium pending evidence." boilerplate when extractors fail', () => {
        // P0: the original code hardcoded those two strings as fallbacks
        // in extractComparisonItems lines 209-210. Every row of every
        // comparison table got the same boilerplate, reading as filler.
        // Post-fix: a row whose body has no extractable weakness/fit
        // renders as the empty-cell placeholder, not as a fake assertion.
        const raw = [
          'Comparing the two vendor candidates for the merchandising AI bet.',
          'Algonomy — directly attacks MAPE and stockouts.',
          'Daisy Intelligence — targets sell-through and margin leakage.',
        ].join(' ');

        const shaped = shapeAgentResponseForSurface('/tower', raw);

        expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
        expect(shaped).toContain('Algonomy');
        expect(shaped).toContain('Daisy Intelligence');
        expect(shaped).not.toContain('Needs validation.');
        expect(shaped).not.toContain('Medium pending evidence.');
      });

      it('emits a real strength + weakness + fit when the body actually carries them (no false-positive boilerplate detection)', () => {
        // The existing comparison-table test (above) already exercises the
        // happy path; the negative invariant is what the audit asked for.
        const raw = [
          'Markdown optimization is the better second Move, but compare the two paths carefully.',
          'Demand Forecasting — Strength: directly attacks MAPE and stockouts. Weakness: already active in P0. Fit: deepen current program.',
          'Markdown Optimization — Strength: targets sell-through and margin leakage. Weakness: needs SKU margin data. Fit: originate next.',
        ].join(' ');

        const shaped = shapeAgentResponseForSurface('/tower', raw);

        expect(shaped).toContain('directly attacks MAPE');
        expect(shaped).toContain('targets sell-through');
        expect(shaped).not.toContain('Needs validation.');
        expect(shaped).not.toContain('Medium pending evidence.');
      });

      it('never duplicates the same sentence in both Evidence: and Missing: slots (collision fix)', () => {
        // P1: the audit caught a signal-read where the same sentence was
        // rendered under Evidence: AND under Missing: because the two
        // extractors shared a source string. Post-fix: Evidence wins,
        // Missing is empty, the duplicate is gone.
        const raw = [
          'Apex Retail Tower read: APX-04 is the highest risk.',
          'KPI confidence is missing baseline ownership across three programs and the source attribution is unclear.',
          'I recommend pausing new scope until the next gate review validates owner and baseline evidence.',
        ].join(' ');

        const shaped = shapeAgentResponseForSurface('/tower', raw);

        const evidenceLine = shaped.split('\n').find((line) => line.startsWith('- Evidence:'));
        const missingLine = shaped.split('\n').find((line) => line.startsWith('- Missing:'));

        // If both slots rendered, their content must not be identical or
        // substring-overlap (the collision class from the audit).
        if (evidenceLine && missingLine) {
          const evidenceBody = evidenceLine.replace(/^- Evidence:\s*/, '').trim();
          const missingBody = missingLine.replace(/^- Missing:\s*/, '').trim();
          expect(evidenceBody).not.toBe(missingBody);
          expect(evidenceBody.includes(missingBody)).toBe(false);
          expect(missingBody.includes(evidenceBody)).toBe(false);
        }
      });

      it('never produces a naked "Xth percentile" — formatPercentile requires metric + cohort + sample size', () => {
        // P2: the audit flagged six independent percentile fields being
        // rendered as bare "Xth percentile" with no scale, cohort, or n.
        // Post-fix: formatPercentile produces a labeled string, and when
        // any required context is missing it returns the explicit
        // "metric-context unavailable" sentinel.
        const labeled = formatPercentile({
          value: 18,
          metric: 'adoption',
          cohort: 'Retail $10B–$50B',
          sampleSize: 7,
        });
        expect(labeled).toBe('18th percentile · adoption · Retail $10B–$50B cohort · n=7');

        // Missing cohort → no naked percentile, no fake labels.
        const noCohort = formatPercentile({
          value: 18,
          metric: 'adoption',
          cohort: null,
          sampleSize: 7,
        });
        expect(noCohort).toBe('metric-context unavailable');
        expect(noCohort).not.toMatch(/\d+(st|nd|rd|th)\s+percentile/);

        // Missing metric → same.
        const noMetric = formatPercentile({
          value: 42,
          metric: null,
          cohort: 'Retail $10B–$50B',
          sampleSize: 12,
        });
        expect(noMetric).toBe('metric-context unavailable');

        // Missing sample size → same.
        const noSample = formatPercentile({
          value: 42,
          metric: 'adoption',
          cohort: 'Retail $10B–$50B',
          sampleSize: null,
        });
        expect(noSample).toBe('metric-context unavailable');

        // Non-finite value → same.
        const noValue = formatPercentile({
          value: null,
          metric: 'adoption',
          cohort: 'Retail $10B–$50B',
          sampleSize: 7,
        });
        expect(noValue).toBe('metric-context unavailable');
      });

      it('formatPercentile produces correct ordinal suffixes (1st/2nd/3rd/4th/11th/21st)', () => {
        const ctx = { metric: 'adoption', cohort: 'Retail $10B–$50B', sampleSize: 7 };
        expect(formatPercentile({ ...ctx, value: 1 })).toContain('1st percentile');
        expect(formatPercentile({ ...ctx, value: 2 })).toContain('2nd percentile');
        expect(formatPercentile({ ...ctx, value: 3 })).toContain('3rd percentile');
        expect(formatPercentile({ ...ctx, value: 4 })).toContain('4th percentile');
        expect(formatPercentile({ ...ctx, value: 11 })).toContain('11th percentile');
        expect(formatPercentile({ ...ctx, value: 12 })).toContain('12th percentile');
        expect(formatPercentile({ ...ctx, value: 13 })).toContain('13th percentile');
        expect(formatPercentile({ ...ctx, value: 21 })).toContain('21st percentile');
        expect(formatPercentile({ ...ctx, value: 42 })).toContain('42nd percentile');
      });

      it('rendered Atlas output bundles never contain the boilerplate strings as fallback', () => {
        // Invariant grep test (from the brief): no rendered comparison-
        // table response contains the literal boilerplate strings as a
        // fallback when actual evidence exists. We assemble a small
        // corpus of representative comparison-table payloads, run them
        // through shapeAgentResponseForSurface, and grep the bundle.
        const payloads = [
          // Real-evidence body — exists; comparison table should still
          // not paste the boilerplate.
          'Markdown optimization is the better second Move. Demand Forecasting — Strength: attacks MAPE. Weakness: already active. Fit: deepen. Markdown Optimization — Strength: margin lift. Weakness: needs SKU data. Fit: originate.',
          // Partial-evidence body — strengths only, no weakness/fit. The
          // fix says these cells render as "—", not as boilerplate.
          'Comparing the two paths. Algonomy — proven at scale. Daisy Intelligence — sharp retail focus.',
          // Mixed: one row has all three fields, the other has only
          // strength. Boilerplate must not appear anywhere in the
          // rendered bundle.
          'Choosing between vendors. Algonomy — Strength: deep retail playbook. Weakness: bigger ship. Fit: large multi-banner. Daisy Intelligence — credible second.',
        ];

        const bundle = payloads
          .map((payload) => shapeAgentResponseForSurface('/tower', payload))
          .join('\n\n---\n\n');

        expect(bundle).not.toContain('Needs validation.');
        expect(bundle).not.toContain('Medium pending evidence.');
        expect(bundle).not.toMatch(/\b\d+(st|nd|rd|th)\s+percentile(?!\s+·)/);
      });
    });

    for (const surface of EXPERT_POSTURE_SURFACES) {
      it(`does not auto-template surface=${JSON.stringify(surface)} (Brief A/B/C contract)`, () => {
        // Feed a canonical Brief-style response with all the keywords that
        // would historically trip compaction's extractors (digits, KPI,
        // "missing", "don't have", a question). If shouldCompactSurface
        // narrowed correctly, this will round-trip without auto-generated
        // bullets. If a future change adds the surface back to compaction,
        // this assertion fails.
        const canonicalAdvisorResponse = [
          "My read is the highest-leverage bet is X, and I'd put high confidence on that.",
          'Three peer enterprises in the corpus saw 8-15% gains at the unit level, with KPI signals trending stable.',
          "I don't have your specific Q3 numbers — your finance team would have them.",
          "What's driving the question?",
        ].join(' ');

        const shaped = shapeAgentResponseForSurface(surface, canonicalAdvisorResponse);

        expect(shaped).not.toMatch(/^\s*- (?:Evidence|Missing|Next|Question|Why|Choose):/m);
        // The full advisor reasoning round-trips, not a 18-word headline.
        expect(shaped).toContain('high confidence on that');
        expect(shaped).toContain("I don't have your specific Q3 numbers");
        expect(shaped).toContain("What's driving the question");
      });
    }
  });
});
