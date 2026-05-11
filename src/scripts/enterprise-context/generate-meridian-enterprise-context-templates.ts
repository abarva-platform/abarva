import { ENTERPRISE_CONTEXT_TEMPLATE_TENANTS } from '../../lib/enterprise-context/template-schema';

import { generateEnterpriseContextTemplates } from './generate-enterprise-context-templates';

const meridianTenant = ENTERPRISE_CONTEXT_TEMPLATE_TENANTS.find((tenant) => tenant.tenantKey === 'meridian');

if (!meridianTenant) {
  throw new Error('Meridian tenant template config is missing.');
}

generateEnterpriseContextTemplates({
  tenants: [meridianTenant],
  outRoot: 'docs/enterprise-context/templates',
})
  .then((generated) => {
    console.log(JSON.stringify({
      tenant: meridianTenant.tenantKey,
      workbookCount: generated.length,
    }, null, 2));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
