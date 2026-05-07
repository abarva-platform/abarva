// /admin/ai-initiatives/[initiativeId] · Per-initiative detail.
//
// Per docs/build/intelligence/ai-initiatives-package/SETUP_UI_SPEC.md.
// 7 tabs (URL-param driven via ?tab=): Overview · KPIs · Stakeholders ·
// Decisions · Vendors · Scenarios · Provenance.

import { notFound } from 'next/navigation';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import {
  InitiativeDetailView,
  type DetailTab,
} from '@/components/admin/ai-initiatives/InitiativeDetailView';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { getActiveClientRow } from '@/lib/active-client';
import { getInitiativeDetail } from '@/lib/admin/ai-initiatives/detail-queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ initiativeId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const VALID_TABS: ReadonlyArray<DetailTab> = [
  'overview',
  'kpis',
  'stakeholders',
  'decisions',
  'vendors',
  'scenarios',
  'provenance',
];

function parseTab(raw: string | undefined): DetailTab {
  if (raw && (VALID_TABS as ReadonlyArray<string>).includes(raw)) return raw as DetailTab;
  return 'overview';
}

export async function generateMetadata({ params }: PageProps) {
  const { initiativeId } = await params;
  return {
    title: `${initiativeId} · AI Initiatives | AbarVa Setup`,
  };
}

export default async function AIInitiativeDetailPage({ params, searchParams }: PageProps) {
  const tenant = await resolveAdminTenant();
  const { initiativeId } = await params;
  const sp = await searchParams;
  const tab = parseTab(sp.tab);

  const clientRow = await getActiveClientRow().catch(() => null);
  if (!clientRow) {
    notFound();
  }

  const detail = await getInitiativeDetail(clientRow.id, initiativeId).catch(() => null);
  if (!detail) {
    notFound();
  }

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={tenant.tenantName}>
      <InitiativeDetailView detail={detail} tab={tab} />
    </AdminCanonShellV2>
  );
}
