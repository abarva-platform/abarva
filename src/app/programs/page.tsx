// PROG-C — Programs Index page (wave-programs-redesign)
// Server Component: calls buildProgramsIndexView and passes view to client.
// Replaces the legacy redirect that was here.

import { buildProgramsIndexView } from '@/lib/programs/programs-page-view';
import { ProgramsIndexPage } from '@/components/programs/ProgramsIndexPage';

export const metadata = {
  title: 'Programs | Apex Retail Group',
};

export default async function ProgramsPage() {
  const view = buildProgramsIndexView('apex-retail');

  return <ProgramsIndexPage view={view} />;
}
