'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProgramByIdSync, getViewerRole } from '@/lib/programs/mock';
import { ProgramShell } from '@/components/programs/ProgramSurface';

function ProgramSettingsPageContent({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = use(params);
  const searchParams = useSearchParams();
  const viewerRole = getViewerRole(searchParams.get('role'));
  const program = getProgramByIdSync(programId);

  if (!program) {
    return <div className="programs-page programs-empty">Settings not found.</div>;
  }

  return (
    <ProgramShell program={program} viewerRole={viewerRole} activeSecondary="settings">
      <div className="programs-grid-auto">
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Pattern binding</div>
          <div className="programs-name" style={{ fontSize: 26 }}>{program.patternName ?? 'Custom shape'}</div>
          <div className="programs-muted" style={{ marginTop: 8 }}>
            Pattern binding is read-only after origination in the mocked frontend, matching Packet 7.
          </div>
        </div>
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Notifications</div>
          <div className="programs-muted">Per-role notification preferences and residency controls are static placeholders until backend settings land.</div>
        </div>
        <div className="programs-card programs-section">
          <div className="programs-eyebrow">Retention</div>
          <div className="programs-muted">7-year retention, archive/delete flow, and approval requests are intentionally non-destructive stubs on this branch.</div>
        </div>
      </div>
    </ProgramShell>
  );
}

export default function ProgramSettingsPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading settings…</div>}>
      <ProgramSettingsPageContent params={params} />
    </Suspense>
  );
}
