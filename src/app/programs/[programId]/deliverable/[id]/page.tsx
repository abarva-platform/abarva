'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDeliverable, getProgramByIdSync, getViewerRole } from '@/lib/programs/mock';
import { ProgramShell } from '@/components/programs/ProgramSurface';

function ProgramDeliverablePageContent({
  params,
}: {
  params: Promise<{ programId: string; id: string }>;
}) {
  const { programId, id } = use(params);
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const program = getProgramByIdSync(programId);
  const deliverable = getDeliverable(programId, id);

  if (!program || !deliverable) {
    return <div className="programs-page programs-empty">Deliverable not found.</div>;
  }

  return (
    <ProgramShell program={program} viewerRole={viewerRole}>
      <div className="programs-card programs-section">
        <div className="programs-eyebrow">Deliverable detail</div>
        <div className="programs-name" style={{ fontSize: 30 }}>{deliverable.title}</div>
        <div className="programs-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="programs-chip">{deliverable.status}</span>
          <span className="programs-chip">v{deliverable.version}</span>
          <span className="programs-chip">{deliverable.owner.name}</span>
        </div>
        <div className="programs-card programs-section" style={{ marginTop: 18 }}>
          <div className="programs-eyebrow">Summary</div>
          <div className="programs-muted">{deliverable.summary}</div>
        </div>
        <div className="programs-hero-note" style={{ marginTop: 18 }}>
          Deliverable history, approvals, and version diffs are mocked here. Real approval wiring belongs to the backend merge in Packet 12 §12.3.
        </div>
      </div>
    </ProgramShell>
  );
}

export default function ProgramDeliverablePage({
  params,
}: {
  params: Promise<{ programId: string; id: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading deliverable…</div>}>
      <ProgramDeliverablePageContent params={params} />
    </Suspense>
  );
}
