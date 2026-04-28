import { AbarVaSourceDashboard, SourceCanonShell } from '@/components/source';
import { getSourceDashboardData } from '@/lib/source/queries';

export const dynamic = 'force-dynamic';

export default async function SourceDashboardPage() {
  const dashboard = await getSourceDashboardData();

  return (
    <SourceCanonShell
      activeRoute="dashboard"
      title="Source Dashboard"
      summary="AbarVa Source is the Nexus-led workflow for enterprise sourcing decisions: what is active, what is waiting, where value is at stake, and what action should happen next."
    >
      <AbarVaSourceDashboard data={dashboard} />
    </SourceCanonShell>
  );
}
