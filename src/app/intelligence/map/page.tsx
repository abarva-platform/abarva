// /intelligence/map · deep-link redirect to the integrated tab.
//
// PR-K2 (initial) shipped the Map as a standalone route. PR-K2.1
// integrates it as a native tab inside the IntelligenceV3 shell so
// the founder sees Brief + Map in the Intelligence sub-menu with
// Sentinel chat alongside the other stages. This route now redirects
// to /intelligence — the IntelligenceV3Page reads the URL hash or
// keeps Brief as default. Maintained as a stable deep-link URL.

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntelligenceMapPage() {
  redirect('/intelligence#map');
}
