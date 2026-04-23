import { getAllPrograms } from '@/lib/programs/mock';
import { ProgramsCanonShell } from '@/components/programs/ProgramsCanonShell';

export const dynamic = 'force-dynamic';

// /preview/programs · canon rebuild · design package v1.1
// Source: wireframe-programs-page.html exemplar + wireframes §3.2 + component library
// Signature: animated 5-phase journey · dot halo · pop-in stage transitions
// when navigating between phases. Old preview replaced.

export default function ProgramsPreviewPage() {
  const programs = getAllPrograms();
  return <ProgramsCanonShell programs={programs} />;
}
