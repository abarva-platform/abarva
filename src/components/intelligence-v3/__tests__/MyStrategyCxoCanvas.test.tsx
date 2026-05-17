/**
 * @jest-environment jsdom
 */
/**
 * MyStrategyCxoCanvas · Intelligence→Move hand-off (loop wiring · GAP-2).
 *
 * The bet-brief view renders a "Shape into Move" CTA for any strategy
 * bullet carrying a `betLink`. The CTA deep-links into the Strategic
 * Moves originate flow via the `fromIntelligence` query contract that
 * `/strategic-moves/new` already parses — so the originated Move joins
 * back to Intelligence in the cross-module trace viewer.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { MyStrategyCxoCanvas } from '../MyStrategyCxoCanvas';
import { APEX_RETAIL_STRATEGY_BULLETS, type StrategyBullet } from '../cxo-fixtures';

describe('MyStrategyCxoCanvas · Intelligence→Move hand-off', () => {
  it('renders a Shape into Move CTA for each bet-linked bullet', () => {
    render(<MyStrategyCxoCanvas bullets={APEX_RETAIL_STRATEGY_BULLETS} />);
    const ctas = screen.getAllByTestId('my-strategy-shape-into-move');
    const linkedCount = APEX_RETAIL_STRATEGY_BULLETS.filter((b) => b.betLink).length;
    expect(ctas).toHaveLength(linkedCount);
    expect(linkedCount).toBeGreaterThan(0);
  });

  it('CTA deep-links into /strategic-moves/new carrying the binding pattern', () => {
    render(<MyStrategyCxoCanvas bullets={APEX_RETAIL_STRATEGY_BULLETS} />);
    const cta = screen.getAllByTestId('my-strategy-shape-into-move')[0];
    const href = cta.getAttribute('href') ?? '';
    expect(href.startsWith('/strategic-moves/new?')).toBe(true);
    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.get('fromIntelligence')).toBe('1');
    expect(params.get('patternId')).toBe(APEX_RETAIL_STRATEGY_BULLETS[0].betLink!.patternId);
    expect(params.get('patternName')).toBe(APEX_RETAIL_STRATEGY_BULLETS[0].betLink!.patternName);
    expect(params.get('useCaseName')).toBeTruthy();
  });

  it('omits the CTA for bullets without a betLink', () => {
    const bullets: StrategyBullet[] = [
      { number: '01', title: 'No link', body: 'body', evidence: 'evidence' },
    ];
    render(<MyStrategyCxoCanvas bullets={bullets} />);
    expect(screen.queryByTestId('my-strategy-shape-into-move')).not.toBeInTheDocument();
  });
});
