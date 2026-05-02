// PROG-C — Programs Index page (wave-programs-redesign)
// Server Component: calls buildProgramsIndexView and passes view to client.
// Tries real DB portfolio first; merges any non-fixture programs into the view.

import { Suspense } from 'react';
import { getActiveClientRow } from '@/lib/active-client';
import type { ClientKey } from '@/lib/client-config';
import { buildProgramsIndexView, type ProgramsIndexTenant } from '@/lib/programs/programs-page-view';
import { buildPhaseSlots, PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import { ProgramsIndexPage } from '@/components/programs/ProgramsIndexPage';
import { getProgramPortfolio } from '@/lib/programs/queries';
import { getCurrentUser } from '@/lib/auth/current-user';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { requireProductModule } from '@/lib/auth/server-module-access';
import type { ProgramPhaseId, ProgramRow } from '@/lib/programs/programs-types';

export const metadata = {
  title: 'Programs | AbarVa Nexus',
};

export const dynamic = 'force-dynamic';

const PROGRAM_TENANT_BY_CLIENT_KEY: Record<ClientKey, ProgramsIndexTenant> = {
  apexretail: 'apex-retail',
  meridian: 'meridian-health',
  arcturus: 'first-capital',
  keystone: 'keystone-energy',
};

export default async function ProgramsPage() {
  await requireProductModule('programs');
  const activeClient = await getActiveClientRow();
  const tenant = activeClient ? PROGRAM_TENANT_BY_CLIENT_KEY[activeClient.key] : 'apex-retail';
  const view = buildProgramsIndexView(tenant);
  let allowedProgramIds: Set<string> | null = null;

  // Try DB portfolio; merge only rows scoped to the active client UUID.
  try {
    const user = await getCurrentUser();
    if (activeClient) {
      const ctx = {
        clientId: activeClient.id,
        userId: user?.personId ?? (user?.clerkUserId ? `clerk:${user.clerkUserId}` : 'programs-page'),
        role: user?.primaryRole,
      };
      const policy = await loadUserProgramAccessPolicy(ctx);
      allowedProgramIds = policy.programIdsAllowed ? new Set(policy.programIdsAllowed) : null;
      const dbPrograms = await getProgramPortfolio(ctx);

      if (dbPrograms && dbPrograms.length > 0) {
        // Build a name→fixture-index map so DB programs can update fixture entries
        // when they match by name (DB IDs are UUIDs; fixture IDs are short strings).
        const fixtureIdxByName = new Map<string, number>();
        view.programs.forEach((p, i) => fixtureIdxByName.set(p.name.toLowerCase(), i));

        const fixtureIds = new Set(view.programs.map((p) => p.id));
        const newPrograms: ProgramRow[] = [];

        for (const p of dbPrograms) {
          const rawPhase = p.currentPhase ?? 0;
          const currentPhase = Math.max(0, Math.min(6, rawPhase)) as ProgramPhaseId;
          const phaseLabel = PHASE_LABEL_MAP[currentPhase];
          const lifecycleState = p.lifecycleState ?? (p.status === 'active' ? 'approved' : null);
          const waitingForSetupApproval = lifecycleState === 'submitted_for_approval';
          const completed = lifecycleState === 'completed' || p.status === 'completed';
          const approvedForP0 = lifecycleState === 'approved' && currentPhase === 0;
          const isIdle = p.status === 'idle' || waitingForSetupApproval;
          const gateStatus = completed
            ? ('completed' as const)
            : waitingForSetupApproval ? ('pending' as const) : ('open' as const);
          const lifecycleNote = waitingForSetupApproval
            ? 'Submitted for Setup approval — Phase 0 locked'
            : completed
            ? `P${currentPhase} ${phaseLabel} · Completed — Tower observing`
            : approvedForP0
            ? 'Approved for Phase 0 — complete Origination criteria'
            : currentPhase >= 1
            ? `P${currentPhase} ${phaseLabel} · Active`
            : 'Program created — initial setup in progress.';

          // If the DB program name matches a fixture program, update the fixture entry
          // to reflect the real DB phase (e.g. APX-CDP-2026 after gate approval to P3)
          const fixtureIdx = fixtureIdxByName.get(p.name.toLowerCase());
          if (fixtureIdx !== undefined) {
            const existing = view.programs[fixtureIdx];
            view.programs[fixtureIdx] = {
              ...existing,
              currentPhase,
              phases: buildPhaseSlots(currentPhase),
              gateStatus,
              nexusNote: lifecycleNote,
              isCompleted: completed,
              lastActiveLabel: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : existing.lastActiveLabel,
            };
            continue;
          }

          // Otherwise append as a new row if not in fixture by ID
          if (!fixtureIds.has(p.id)) {
            newPrograms.push({
              id: p.id,
              displayId: p.id.toUpperCase().slice(0, 12),
              name: p.name,
              currentPhase,
              phases: buildPhaseSlots(currentPhase),
              gateStatus,
              lastActiveLabel: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Unknown',
              nexusNote: lifecycleNote,
              actionLabel: waitingForSetupApproval ? ('Review' as const) : ('Continue' as const),
              isIdle,
              isCompleted: completed,
            });
          }
        }
        view.programs = [...view.programs, ...newPrograms];
      }
    }
  } catch {
    // Fall back to fixture-only view
  }

  if (allowedProgramIds) {
    view.programs = view.programs.filter((program) =>
      allowedProgramIds!.has(program.id) ||
      allowedProgramIds!.has(program.displayId.toLowerCase()) ||
      allowedProgramIds!.has(program.displayId),
    );
  }

  view.totalActive = view.programs.filter((program) => !program.isIdle && !program.isCompleted).length;
  view.gatesPending = view.programs.filter((program) => program.gateStatus === 'pending').length;
  view.idleCount = view.programs.filter((program) => program.isIdle).length;

  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading...</div>}>
      <ProgramsIndexPage view={view} hasTenantKey={Boolean(activeClient)} />
    </Suspense>
  );
}
