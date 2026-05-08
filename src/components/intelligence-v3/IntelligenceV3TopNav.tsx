// Intelligence v3 · top navigation — forwards to canonical AppTopBar.
//
// Pre-unification this component had its own white nav strip with a
// separate "Abar/Va" wordmark and tenant pill. Founder-flagged
// 2026-05-08 that navigating to /intelligence flipped the chrome to
// the legacy bar. This file is now a thin forward to the canonical
// AppTopBar (the unified black bar) so /intelligence inherits the
// same chrome as every other route.
//
// Kept as a separate export so existing callers
// (`<IntelligenceV3TopNav tenantName={…} />`) don't have to be
// rewritten — drop-in replacement.

import { AppTopBar } from '@/components/shell/AppTopBar';

interface Props {
  tenantName: string;
  /** @deprecated unused after unification — avatar now sourced from Clerk. */
  userMonogram?: string;
}

export function IntelligenceV3TopNav({ tenantName }: Props) {
  return <AppTopBar tenantName={tenantName} />;
}
