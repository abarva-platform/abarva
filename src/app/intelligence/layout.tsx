// /intelligence — public surface (per proxy.ts INT-1.3 comment:
// "/intelligence is the J0 cold landing — corpus doctrine, not tenant
// data — and is public"). Sub-paths that touch tenant data self-gate
// at their own page.tsx; the layout itself does not gate the route.

import type { ReactNode } from 'react';

export default function IntelligenceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
