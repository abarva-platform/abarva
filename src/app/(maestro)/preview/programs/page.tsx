import { getAllPrograms } from '@/lib/programs/mock';
import { ProgramsIridescentShell } from '@/components/programs/ProgramsIridescentShell';

export const dynamic = 'force-dynamic';

// /preview/programs · iridescent canon build · matches
// abarva_program_page_in_new_aesthetic.html (Apr 23, 2026).
// Two zones: iridescent cream hero (radial glow) + dark content
// where the conversation is the primary left-column star.
// Deliverables render as a compact chip row, not a column.
// Phase-pop animation preserved across tab switches.

export default function ProgramsPreviewPage() {
  const programs = getAllPrograms();
  return <ProgramsIridescentShell programs={programs} />;
}
