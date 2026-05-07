// /admin/ai-initiatives · AI Initiatives Registry view.
//
// Per docs/build/intelligence/ai-initiatives-package/SETUP_UI_SPEC.md.
// Three view modes (URL-param driven): By Business Goal (default) ·
// By Category · All initiatives (table). The detail page lands in
// AIR-4 at /admin/ai-initiatives/[initiativeId].

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { AIInitiativesView, type ViewMode } from '@/components/admin/ai-initiatives/AIInitiativesView';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { getActiveClientRow } from '@/lib/active-client';
import { getAIInitiativesPageData } from '@/lib/admin/ai-initiatives/queries';

export const metadata = {
  title: 'AI Initiatives | AbarVa Setup',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

function parseViewMode(raw: string | undefined): ViewMode {
  if (raw === 'category' || raw === 'table') return raw;
  return 'goal';
}

export default async function AIInitiativesPage({ searchParams }: PageProps) {
  const tenant = await resolveAdminTenant();
  const params = await searchParams;
  const view = parseViewMode(params.view);

  const clientRow = await getActiveClientRow().catch(() => null);
  const data = clientRow
    ? await getAIInitiativesPageData(clientRow.id).catch(() => ({
        categories: [],
        goals: [],
        initiatives: [],
      }))
    : { categories: [], goals: [], initiatives: [] };

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={tenant.tenantName}>
      <AIInitiativesView data={data} tenantName={tenant.tenantName} view={view} />
    </AdminCanonShellV2>
  );
}
