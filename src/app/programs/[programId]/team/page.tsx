'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProgramByIdSync, getViewerRole } from '@/lib/programs/mock';
import { PersonBadge } from '@/components/programs/common';
import { ProgramShell } from '@/components/programs/ProgramSurface';

function ProgramTeamPageContent({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = use(params);
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const program = getProgramByIdSync(programId);

  if (!program) {
    return <div className="programs-page programs-empty">Team not found.</div>;
  }

  return (
    <ProgramShell program={program} viewerRole={viewerRole} activeSecondary="team">
      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Team</div>
        <div className="programs-name" style={{ fontSize: 30 }}>Participants and workstreams</div>
      </div>
      <div className="programs-grid-auto">
        {program.team.map((member) => (
          <div key={member.id} className="programs-card programs-section">
            <PersonBadge person={member} suffix={member.role} />
            <div className="programs-muted" style={{ marginTop: 12, fontSize: 13 }}>
              {member.activitySummary}
            </div>
            <div className="programs-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="programs-chip">{member.workstream ?? 'Core team'}</span>
              <span className="programs-chip teal">{member.notificationState ?? 'priority'}</span>
            </div>
          </div>
        ))}
      </div>
    </ProgramShell>
  );
}

export default function ProgramTeamPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading team…</div>}>
      <ProgramTeamPageContent params={params} />
    </Suspense>
  );
}
