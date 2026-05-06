// PROG-P1 · Preview programs index — direct to canonical route.
// Was: getSeedProgramsIndexPath → /tenant/[slug]/programs → /programs (double hop).
// Now: single redirect to /programs canonical.

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProgramsPreviewPage() {
  redirect('/programs');
}
