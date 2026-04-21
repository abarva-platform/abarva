// C17 · Program Detail Page. Wave 3 · demo-critical.
//
// Three views per c17-program-detail.md spec:
//   1. Journey · default · 5-phase horizontal visualization
//   2. Stream · chronological activity feed
//   3. Stakeholders · grid of program participants
//
// Reads from the existing `getProgramByIdSync` mock so the demo has realistic
// data on hand without a DB roundtrip. Active-phase expansion shows
// deliverables + gate requirements inline so sponsors can see progress
// without drilling into a module page.

'use client';

import { Suspense, use, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProgramByIdSync, getViewerRole } from '@/lib/programs/mock';
import { PageShell } from '@/components/shared/layout/PageShell';
import { Body } from '@/components/shared/typography/Body';
import { ProgramDetailHeader, type ProgramView } from '@/components/programs/ProgramDetailHeader';
import { ProgramJourneyView } from '@/components/programs/ProgramJourneyView';
import { ProgramStreamView } from '@/components/programs/ProgramStreamView';
import { ProgramStakeholdersView } from '@/components/programs/ProgramStakeholdersView';

function ProgramDetailPageContent({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = use(params);
  const searchParams = useSearchParams();
  // Viewer role persists via ?role= query for demos · read here so the
  // query param stays supported even though the new Journey surface
  // doesn't yet branch on role.
  void getViewerRole(searchParams.get('role'));

  const initialView: ProgramView = (() => {
    const v = searchParams.get('view');
    if (v === 'stream' || v === 'stakeholders') return v;
    return 'journey';
  })();

  const [view, setView] = useState<ProgramView>(initialView);
  const program = getProgramByIdSync(programId);

  const handleViewChange = useCallback((next: ProgramView) => {
    setView(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (next === 'journey') url.searchParams.delete('view');
      else url.searchParams.set('view', next);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  if (!program) {
    return (
      <PageShell width="standard" padding="comfortable">
        <Body tone="muted" size="md">Program not found.</Body>
      </PageShell>
    );
  }

  return (
    <PageShell width="wide" padding="comfortable">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <ProgramDetailHeader
          program={program}
          currentView={view}
          onViewChange={handleViewChange}
        />

        {view === 'journey' ? <ProgramJourneyView program={program} /> : null}
        {view === 'stream' ? <ProgramStreamView program={program} /> : null}
        {view === 'stakeholders' ? <ProgramStakeholdersView program={program} /> : null}
      </div>
    </PageShell>
  );
}

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <PageShell width="wide" padding="comfortable">
          <Body tone="muted" size="md">Loading program…</Body>
        </PageShell>
      }
    >
      <ProgramDetailPageContent params={params} />
    </Suspense>
  );
}
