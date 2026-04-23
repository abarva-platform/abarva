import { getAllPrograms } from '@/lib/programs/mock';
import { ProgramsPreviewShell } from '@/components/programs/ProgramsPreviewShell';

export const dynamic = 'force-dynamic';

// /preview/programs · redesign sandbox for the Programs surface.
// Menu pinned at the top: Programs (portfolio) · Phase 0 · Phase 1 ·
// Phase 2 · Phase 3 · Phase 4. Everything renders inside the program
// window · no route changes when switching tabs. Live /programs stays
// untouched so both can be compared side-by-side.

export default function ProgramsPreviewPage() {
  const programs = getAllPrograms();
  return <ProgramsPreviewShell programs={programs} />;
}
