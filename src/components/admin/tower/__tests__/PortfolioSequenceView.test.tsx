import { renderToStaticMarkup } from 'react-dom/server';

import { PortfolioSequenceView } from '../PortfolioSequenceView';
import { buildPortfolioSequenceView } from '@/lib/tower/portfolio-sequence-view';

describe('PortfolioSequenceView', () => {
  it('renders a decision-ready sequence without raw signal ids', () => {
    const html = renderToStaticMarkup(
      <PortfolioSequenceView
        model={buildPortfolioSequenceView({
          clientKey: 'apexretail',
          clientName: 'Apex Retail Group',
        })}
      />,
    );

    expect(html).toContain('data-testid="portfolio-sequence-view"');
    expect(html).toContain('What to run next');
    expect(html).toContain('scheduled moves');
    expect(html).toContain('Value overlaps to clean up');
    expect(html).not.toMatch(/signal:[0-9a-f-]{8,}/i);
  });

  it('renders the honest empty state when no sequence substrate exists', () => {
    const html = renderToStaticMarkup(
      <PortfolioSequenceView
        model={buildPortfolioSequenceView({
          clientKey: 'arcturus',
          clientName: 'First Capital Financial',
        })}
      />,
    );

    expect(html).toContain('No sequence is available for First Capital Financial yet.');
    expect(html).toContain('No portfolio-sequencing substrate');
  });
});
