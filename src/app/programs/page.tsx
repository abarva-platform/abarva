// PROG-C — Programs Index page (wave-programs-redesign)
// Server Component: calls buildProgramsIndexView and passes view to client.
// Tries real DB portfolio first; merges any non-fixture programs into the view.

import { Suspense } from 'react';
import { buildProgramsIndexView } from '@/lib/programs/programs-page-view';
import { buildPhaseSlots, PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import { ProgramsIndexPage } from '@/components/programs/ProgramsIndexPage';
import { getProgramPortfolio } from '@/lib/programs/queries';
import { getCurrentUser } from '@/lib/auth/current-user';
import type { ProgramPhaseId, ProgramRow } from '@/lib/programs/programs-types';

export const metadata = {
  title: 'Programs | Apex Retail Group',
};

export default async function ProgramsPage() {
  // Fixture view as base (always present — safe fallback)
  const view = buildProgramsIndexView('apex-retail');

  // Try DB portfolio; merge any programs not already in the fixture set
  try {
    const user = await getCurrentUser();
    if (user?.defaultClientId) {
      const ctx = { clientId: user.defaultClientId, userId: user.clerkUserId };
      const dbPrograms = await getProgramPortfolio(ctx);

      if (dbPrograms && dbPrograms.length > 0) {
        const fixtureIds = new Set(view.programs.map((p) => p.id));
        const newPrograms: ProgramRow[] = dbPrograms
          .filter((p) => !fixtureIds.has(p.id))
          .map((p) => {
            const rawPhase = p.currentPhase ?? 0;
            const currentPhase = Math.max(0, Math.min(6, rawPhase)) as ProgramPhaseId;
            const phaseLabel = PHASE_LABEL_MAP[currentPhase];
            const isIdle = p.status === 'idle';
            const nexusNote: string = isIdle
              ? `P${currentPhase} ${phaseLabel} · Idle`
              : currentPhase >= 1
              ? `P${currentPhase} ${phaseLabel} · Active`
              : 'Program created — initial setup in progress.';
            const gateStatus = currentPhase === 0 ? ('pending' as const) : ('open' as const);
            return {
              id: p.id,
              displayId: p.id.toUpperCase().slice(0, 12),
              name: p.name,
              currentPhase,
              phases: buildPhaseSlots(currentPhase),
              gateStatus,
              lastActiveLabel: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Unknown',
              nexusNote,
              actionLabel: 'Continue' as const,
              isIdle,
            };
          });
        view.programs = [...view.programs, ...newPrograms];
      }
    }
  } catch {
    // Fall back to fixture-only view
  }

  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading...</div>}>
      <ProgramsIndexPage view={view} />
    </Suspense>
  );
}
