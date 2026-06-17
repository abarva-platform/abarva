// Old J0 corpus sub-routes (author, patterns, topics, [patternId], signals, etc.)
// These routes are dead code from before the Context/Corpus Explorer (PR #3594) and
// are not linked from product navigation.
//
// force-dynamic applies to this entire segment so next build does not attempt static
// prerender of any child page. Several children call useSearchParams() without a
// Suspense boundary, which crashes static generation.
//
// The live Context/Corpus Explorer page.tsx lives at (maestro)/intelligence/page.tsx.
// This layout only covers the old J0 subtree; it must stay until those routes are
// formally retired.

import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntelligenceSubroutesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
