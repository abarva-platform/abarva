import { buildPortfolioSequenceView } from '../portfolio-sequence-view';

describe('buildPortfolioSequenceView', () => {
  it.each([
    ['apexretail', 'Apex Retail Group'],
    ['meridian', 'Meridian Health System'],
    ['skyharbor', 'SkyHarbor Air'],
  ])('builds a four-quarter portfolio sequence for %s', (clientKey, clientName) => {
    const model = buildPortfolioSequenceView({ clientKey, clientName });

    expect(model.clientName).toBe(clientName);
    expect(model.quarters).toHaveLength(4);
    expect(model.scheduledMoves).toBeGreaterThan(0);
    expect(model.sequenceValueLabel).toMatch(/^\$/);
    expect(JSON.stringify(model)).not.toMatch(/signal:[0-9a-f-]{8,}/i);
  });

  it('keeps signature-client sequence content scoped to the requested client', () => {
    const meridian = JSON.stringify(buildPortfolioSequenceView({
      clientKey: 'meridian',
      clientName: 'Meridian Health System',
    }));
    const skyharbor = JSON.stringify(buildPortfolioSequenceView({
      clientKey: 'skyharbor',
      clientName: 'SkyHarbor Air',
    }));

    expect(meridian).toContain('Ambient Clinical Documentation');
    expect(meridian).not.toContain('Store Associate Productivity AI');
    expect(meridian).not.toContain('Crew Recovery AI');
    expect(skyharbor).toContain('Crew Recovery AI');
    expect(skyharbor).not.toContain('Ambient Clinical Documentation');
  });

  it('returns an honest empty state for clients without sequencing substrate', () => {
    const model = buildPortfolioSequenceView({
      clientKey: 'arcturus',
      clientName: 'First Capital Financial',
    });

    expect(model.dataBasis).toBe('empty');
    expect(model.quarters).toEqual([]);
    expect(model.disclosure).toContain('No portfolio-sequencing substrate');
  });
});
