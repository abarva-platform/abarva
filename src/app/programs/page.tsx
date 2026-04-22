'use client';

import { Suspense } from 'react';
import { getAllPrograms } from '@/lib/programs/mock';
import { ProgramsShell } from '@/components/programs/ProgramsShell';

// Single persistent Programs shell · sub-menu tabs (Portfolio · + New Program ·
// P0-P4), metadata strip on program-mode, and a phase workspace that swaps in
// place without route changes. Light editorial palette matching Home + Platform.

function ProgramsPageContent() {
  const programs = getAllPrograms();
  return <ProgramsShell programs={programs} />;
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 28, fontFamily: 'DM Sans, sans-serif', color: '#5B4D43' }}>Loading programs…</div>}>
      <ProgramsPageContent />
    </Suspense>
  );
}
