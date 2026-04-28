// PROG-C — Programs Index page (wave-programs-redesign)
// Server Component: calls buildProgramsIndexView and passes view to client.
// Replaces the legacy redirect that was here.

import { Suspense } from 'react';
import { buildProgramsIndexView } from '@/lib/programs/programs-page-view';
import { ProgramsIndexPage } from '@/components/programs/ProgramsIndexPage';

export const metadata = {
  title: 'Programs | Apex Retail Group',
};

export default async function ProgramsPage() {
  const view = buildProgramsIndexView('apex-retail');

  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading...</div>}>
      <ProgramsIndexPage view={view} />
    </Suspense>
  );
}
