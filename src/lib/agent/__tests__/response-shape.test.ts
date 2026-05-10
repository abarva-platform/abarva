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

  it('only strips raw markdown during streaming and preserves full content until final compaction', () => {
    const streaming = shapeStreamingAgentTextForSurface('/tower', '**Apex Retail** has three signals. More text is still arriving.');

    expect(streaming).toBe('Apex Retail has three signals. More text is still arriving.');
  });
});
