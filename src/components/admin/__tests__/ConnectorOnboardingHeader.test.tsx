/**
 * ConnectorOnboardingHeader · Wave 2 PR-6 tests
 *
 * Tiny render test: the header surfaces an "Add connector" affordance
 * pointing at the supplied href, so the wiring from
 * `/admin/connectors?add=open` can be trusted.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectorOnboardingHeader } from '../ConnectorOnboardingHeader';

describe('ConnectorOnboardingHeader', () => {
  it('renders the Add connector CTA pointing at the supplied href', () => {
    const html = renderToStaticMarkup(
      <ConnectorOnboardingHeader addHref="/admin/connectors?add=open" />,
    );
    expect(html).toContain('data-testid="connector-onboarding-add-cta"');
    expect(html).toContain('href="/admin/connectors?add=open"');
    expect(html).toContain('Add connector');
  });
});
