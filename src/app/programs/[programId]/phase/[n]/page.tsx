'use client';

import { Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProgramPhaseSync, getViewerRole } from '@/lib/programs/mock';
import { ProgramSurface } from '@/components/programs/ProgramSurface';

function ProgramPhasePageContent({
  params,
}: {
  params: Promise<{ programId: string; n: string }>;
}) {
  const { programId, n } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const program = getProgramPhaseSync(programId, Number(n));

  if (!program) {
    return <div className="programs-page programs-empty">Program phase not found.</div>;
  }

  return (
    <ProgramSurface
      programId={program.id}
      viewerRole={viewerRole}
      program={program}
      onPhaseNavigate={(phaseNumber) => router.push(`/programs/${program.id}/phase/${phaseNumber}`)}
      onModuleOpen={(moduleKey) => router.push(`/programs/${program.id}/module/${moduleKey}`)}
      onAdvancePhase={async () => ({ ok: true, message: 'Mock phase advance queued.' })}
    />
  );
}

export default function ProgramPhasePage({
  params,
}: {
  params: Promise<{ programId: string; n: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading phase…</div>}>
      <ProgramPhasePageContent params={params} />
    </Suspense>
  );
}
