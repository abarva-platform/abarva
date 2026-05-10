import {
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

  it('compacts Nexus Originate answers into a readable decision shape', () => {
    const raw = [
      '**Demand forecasting is the highest-value AI target in merchandising.** Here\'s the ranking:',
      '**1. Demand Forecasting / Inventory Optimization** — Highest confidence - MAPE at 28.4% (target 20%); inventory turns down to 3.6x from 4.2x; stockout rate up to 4.2%; markdown rate at 12.8% (target 11%). The $248M revenue gap and EBITDA margin compression both trace directly to forecast failure.',
      '**2. Markdown / Allocation Optimization** — High confidence - Sell-through at 62% (target 70%); markdown rate rising.',
      '**Explicitly missing data** that would change ranking: promotion-level forecast accuracy, allocation drift root cause, SKU contribution margins.',
      'What do you want to do — deepen the forecasting program, or originate a Markdown Optimization move?',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/strategic-moves/new', raw);

    expect(shaped).not.toContain('**');
    expect(shaped).toContain('- Why:');
    expect(shaped).toContain('- Missing:');
    expect(shaped).toContain('- Choose:');
    expect(shaped.split('\n').length).toBeLessThanOrEqual(7);
    expect(shaped.split(/\s+/).length).toBeLessThanOrEqual(95);
  });

  it('compacts Tower Atlas answers into short readable bullets', () => {
    const raw = [
      '**Apex Retail Tower read: APX-04 is the highest risk.**',
      'Portfolio KPI evidence shows gate slippage, sponsor ambiguity, and unresolved value-baseline ownership across three programs.',
      'I recommend pausing new scope until the next gate review validates owner, baseline, and mitigation evidence.',
      'Here are several additional observations that would otherwise create a long wall of text across many lines and make the answer hard to scan.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).not.toContain('**');
    expect(shaped).toMatch(/^- Evidence:/m);
    expect(shaped).toMatch(/^- Next:/m);
    expect(shaped.split('\n').length).toBeLessThanOrEqual(5);
    expect(shaped.split(/\s+/).length).toBeLessThanOrEqual(75);
  });

  it('uses a comparison table when the answer is choosing between options', () => {
    const raw = [
      'Markdown optimization is the better second Move, but compare the two paths carefully.',
      'Demand Forecasting — Strength: directly attacks MAPE and stockouts. Weakness: already active in P0. Fit: deepen current program.',
      'Markdown Optimization — Strength: targets sell-through and margin leakage. Weakness: needs SKU margin data. Fit: originate next.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).toContain('| Option | Strength | Weakness | Fit |');
    expect(shaped).toContain('| Demand Forecasting |');
    expect(shaped).toContain('| Markdown Optimization |');
    expect(shaped).not.toContain('**');
  });

  it('uses a stat-and-stack when the answer is primarily evidence (Tower surface)', () => {
    // INT-VOICE.STRAT-2026-05-10e — moved from '/intelligence' to '/tower'.
    // The compaction template is still in scope for Tower but is a Brief A
    // violation on Intelligence; see the Intelligence prose-preservation
    // test below.
    const raw = [
      'The data says merchandising value is concentrated in forecast quality.',
      'MAPE is 28.4% against a 20% target.',
      'Inventory turns fell from 4.2x to 3.6x.',
      'Markdown rate is 12.8% against an 11% target.',
      'Source basis: Apex tenant KPI snapshot and merchandising system inventory.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/tower', raw);

    expect(shaped).toMatch(/^MAPE is 28\.4%/m);
    expect(shaped).toMatch(/^· Inventory turns fell/m);
    expect(shaped).toMatch(/^· Markdown rate is 12\.8%/m);
    expect(shaped).toMatch(/^Source:/m);
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
  });

  it('uses sequential steps when the answer explains a path', () => {
    const raw = [
      'The path is a three-step operating-model shift.',
      '1. Baseline. Confirm KPI owner, current value, target, and source system.',
      '2. Design. Map planner decisions, model suggestions, and human override points.',
      '3. Mobilize. Run one category pilot and review exception handling weekly.',
      'The outcome is a governed merchandising workflow, not a science project.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/source', raw);

    expect(shaped).toMatch(/^1\. Baseline\./m);
    expect(shaped).toMatch(/^2\. Design\./m);
    expect(shaped).toMatch(/^3\. Mobilize\./m);
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
});
