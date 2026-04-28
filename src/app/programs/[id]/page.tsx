// PROG-D — Program Detail route
// /programs/[id]?phase=N
//
// Server component: resolves programId + viewingPhase from params/searchParams,
// builds the view via buildProgramDetailView, renders the client shell.

import { buildProgramDetailView } from '@/lib/programs/programs-detail-view';
import { ProgramDetailPage } from '@/components/programs/ProgramDetailPage';

export const dynamic = 'force-dynamic';

export default async function ProgramDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { id } = await params;
  const { phase } = await searchParams;
  const viewingPhase = phase ? parseInt(phase, 10) : undefined;
  const view = buildProgramDetailView(id, viewingPhase);
  return <ProgramDetailPage view={view} />;
}
