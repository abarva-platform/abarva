import { renderToStaticMarkup } from 'react-dom/server';

import { AdminTenantTab, type TenantConfig } from '../AdminTenantTab';

describe('AdminTenantTab', () => {
  it('renders the resolved tenant config instead of the Apex fallback', () => {
    const config: TenantConfig = {
      name: 'Meridian Health',
      slug: 'meridian',
      industry: 'Healthcare',
      region: 'HEALTHCARE_IDN',
      tier: 'Enterprise',
      status: 'locked',
      contractStart: 'Tenant record',
      contractEnd: 'Tenant record',
      renewalOwner: 'Tenant success',
      programCount: 4,
      activePrograms: 4,
      dataResidency: 'Tenant configured',
      ssoProvider: 'Tenant configured',
      createdDate: 'Tenant record',
    };

    const html = renderToStaticMarkup(<AdminTenantTab config={config} />);

    expect(html).toContain('Meridian Health');
    expect(html).toContain('meridian');
    expect(html).not.toContain('Apex Retail Group');
    expect(html).not.toContain('apex-retail');
  });
});
