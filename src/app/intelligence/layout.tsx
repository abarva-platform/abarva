// /intelligence sub-routes (old J0 corpus pages: [patternId], patterns, topics, etc.)
// are still rendered outside the (maestro) group and must NOT inherit the root
// app layout's Clerk auth initialisation — that breaks static prerender of pattern
// detail pages during `next build`. This passthrough keeps the layout segment
// boundary so Next.js isolates these routes from the Clerk-aware root layout.
//
// The live Context/Corpus Explorer (page.tsx + loading.tsx) was moved to
// (maestro)/intelligence/ in PR #3594 so that surface gets AppChrome + global nav.
// The old J0 sub-routes remain here until they are formally retired.

import type { ReactNode } from 'react';

export default function IntelligenceSubroutesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
