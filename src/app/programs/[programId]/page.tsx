'use client';

import { Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProgramByIdSync, getViewerRole } from '@/lib/programs/mock';
import { ProgramSurface } from '@/components/programs/ProgramSurface';

function ProgramDetailPageContent({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const program = getProgramByIdSync(programId);

  if (!program) {
    return <div className="programs-page programs-empty">Program not found.</div>;
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

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading program…</div>}>
      <ProgramDetailPageContent params={params} />
    </Suspense>
  );
}
