import { renderToStaticMarkup } from 'react-dom/server';

import { TenantIdentityStrip } from '../TenantIdentityStrip';

describe('TenantIdentityStrip', () => {
  it('renders the canonical tenant name for crawl-visible identity checks', () => {
    const html = renderToStaticMarkup(
      <TenantIdentityStrip clientName="Meridian Health System" surface="Tower portfolio value" />,
    );

    expect(html).toContain('Client');
    expect(html).toContain('Healthcare Demo');
    expect(html).toContain('Tower portfolio value tenant identity');
  });

  it('uses an honest unavailable label when tenant resolution fails', () => {
    const html = renderToStaticMarkup(<TenantIdentityStrip clientName={null} surface="Home queue" />);

    expect(html).toContain('Tenant context unavailable');
  });
});
