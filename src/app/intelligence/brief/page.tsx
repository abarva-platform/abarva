// /intelligence/brief · deep-link redirect to the integrated tab.
//
// PR-K2 (initial) shipped the Brief as a standalone route. PR-K2.1
// integrates it as a native tab inside the IntelligenceV3 shell —
// Brief is now the default landing on /intelligence. Maintained as a
// stable deep-link URL.

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntelligenceBriefPage() {
  redirect('/intelligence');
}
