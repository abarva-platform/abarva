import type { ReactNode } from 'react';

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminContextLayerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tenant = await resolveAdminTenant();

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      {children}
    </AdminCanonShellV2>
  );
}
