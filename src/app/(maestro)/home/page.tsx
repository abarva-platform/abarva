import { Metadata } from 'next';
import { HomeIndexPage } from '@/components/home/HomeIndexPage';
import { HomePanelGrid } from '@/components/home/HomePanelGrid';
import type { HomeProgramRow } from '@/components/home/HomeIndexPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildReasoningDashboardSummary } from '@/lib/reasoning/dashboard-summary';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getCurrentModuleAccess } from '@/lib/auth/server-module-access';
import { getProgramPortfolio } from '@/lib/programs/queries';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import type { ProgramPhaseId } from '@/lib/programs/programs-types';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata: Metadata = { title: 'Home · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';
  const moduleAccess = await getCurrentModuleAccess();
  const reasoning = buildReasoningDashboardSummary();
  let livePrograms: HomeProgramRow[] = [];
  const canUsePrograms = moduleAccess.access.modules.includes('programs');

  if (activeClient && canUsePrograms) {
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
    <>
      <HomeIndexPage
        activeTenantName={activeClientDisplayName}
        hasTenantKey={Boolean(activeClient)}
        moduleAccess={moduleAccess.access}
        reasoning={reasoning}
        livePrograms={livePrograms}
      />
      {/* H3 (2026-05-07) · Canonical Home panel grid per
           docs/build/home-refinement-package/HOME_PANELS_INVENTORY.md.
           8 panels grouped Explore / Configure / Learn. Renders below
           the existing HomeIndexPage portfolio dashboard so neither
           displaces the other. */}
      <HomePanelGrid />
    </>
  );
}
