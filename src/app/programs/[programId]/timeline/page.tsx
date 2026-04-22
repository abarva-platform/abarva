'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProgramByIdSync, getViewerRole } from '@/lib/programs/mock';
import { MilestoneSummary } from '@/components/programs/common';
import { ProgramShell } from '@/components/programs/ProgramSurface';

function ProgramTimelinePageContent({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = use(params);
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const program = getProgramByIdSync(programId);

  if (!program) {
    return <div className="programs-page programs-empty">Timeline not found.</div>;
  }

  return (
    <ProgramShell program={program} viewerRole={viewerRole} activeSecondary="timeline">
      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Timeline</div>
        <div className="programs-name" style={{ fontSize: 30 }}>Planned versus actual</div>
        <div className="programs-muted" style={{ marginTop: 8 }}>
          Static timeline shell for the demo. Full drag-adjust behavior is post-demo per Packet 12.
        </div>
      </div>
      {program.executeData ? <MilestoneSummary milestones={program.executeData.milestones} /> : (
        <div className="programs-card programs-section">
          <div className="programs-empty">Timeline detail is seeded only for Execute-phase programs on this branch.</div>
        </div>
      )}
    </ProgramShell>
  );
}

export default function ProgramTimelinePage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading timeline…</div>}>
      <ProgramTimelinePageContent params={params} />
    </Suspense>
  );
}
