import { Metadata } from 'next';
import { HomeIndexPage, type HomeProgramRow } from '@/components/home/HomeIndexPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildReasoningDashboardSummary } from '@/lib/reasoning/dashboard-summary';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getProgramPortfolio } from '@/lib/programs/queries';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import type { ProgramPhaseId } from '@/lib/programs/programs-types';

export const metadata: Metadata = { title: 'Home · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const reasoning = buildReasoningDashboardSummary();
  let livePrograms: HomeProgramRow[] = [];

  if (activeClient) {
    try {
      const user = await getCurrentUser();
      const programs = await getProgramPortfolio({
        clientId: activeClient.id,
        userId: user?.personId ?? user?.clerkUserId ?? 'home-page',
      });
      livePrograms = programs
        .filter((program) => program.lifecycleState === 'approved' || program.status === 'active')
        .map((program) => {
          const rawPhase = program.currentPhase ?? 0;
          const phase = Math.max(0, Math.min(6, rawPhase)) as ProgramPhaseId;
          return {
            id: program.id,
            displayId: program.id.toUpperCase().slice(0, 12),
            name: program.name,
            phase,
            phaseLabel: PHASE_LABEL_MAP[phase] ?? `Phase ${phase}`,
            gateStatus: 'open' as const,
            href: `/programs/${program.id}`,
          };
        })
        .slice(0, 3);
    } catch {
      livePrograms = [];
    }
  }

  return (
    <HomeIndexPage
      activeTenantName={activeClient?.name ?? 'AbarVa Client'}
      hasTenantKey={Boolean(activeClient)}
      reasoning={reasoning}
      livePrograms={livePrograms}
    />
  );
}
