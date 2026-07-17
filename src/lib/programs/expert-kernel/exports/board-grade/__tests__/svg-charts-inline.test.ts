import { CHART, inlineChart } from '../svg-charts';

describe('inlineChart', () => {
  it('renders mixed positive and negative vertical bars without invalid dimensions', () => {
    const svg = inlineChart({
      type: 'bar',
      title: 'Value vs. Complexity',
      data: [
        { label: 'Payment integrity', score: 43 },
        { label: 'Contact center AI', score: -2 },
        { label: 'Lakehouse foundation', score: -12 },
      ],
      xKey: 'label',
      yKey: 'score',
    });

    expect(svg).not.toMatch(/\bheight="-/);
    expect(svg).not.toMatch(/\bwidth="-/);
    expect(svg).toContain(`fill="${CHART.negative}"`);
    expect(svg).toContain('-12');
  });

  it('renders mixed positive and negative horizontal bars without invalid dimensions', () => {
    const svg = inlineChart({
      type: 'horizontal-bar',
      title: 'Directional readiness',
      data: [
        { label: 'Ready', score: 55 },
        { label: 'Blocked', score: -18 },
      ],
      xKey: 'label',
      yKey: 'score',
    });

    expect(svg).not.toMatch(/\bheight="-/);
    expect(svg).not.toMatch(/\bwidth="-/);
    expect(svg).toContain(`fill="${CHART.negative}"`);
    expect(svg).toContain('-18');
  });
});
