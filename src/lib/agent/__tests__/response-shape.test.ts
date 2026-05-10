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

  it('uses a stat-and-stack when the answer is primarily evidence', () => {
    const raw = [
      'The data says merchandising value is concentrated in forecast quality.',
      'MAPE is 28.4% against a 20% target.',
      'Inventory turns fell from 4.2x to 3.6x.',
      'Markdown rate is 12.8% against an 11% target.',
      'Source basis: Apex tenant KPI snapshot and merchandising system inventory.',
    ].join(' ');

    const shaped = shapeAgentResponseForSurface('/intelligence', raw);

    expect(shaped).toMatch(/^MAPE is 28\.4%/m);
    expect(shaped).toMatch(/^· Inventory turns fell/m);
    expect(shaped).toMatch(/^· Markdown rate is 12\.8%/m);
    expect(shaped).toMatch(/^Source:/m);
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
