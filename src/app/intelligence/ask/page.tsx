// /intelligence/ask · INT-1.7
//
// Preserves the aVa Intelligence chat surface. Reachable from the J0 page
// header's "Ask aVa" affordance. The page is auth-gated by
// the proxy (src/proxy.ts authRequiredRoutes) because the chat
// requires a Clerk session to call the agent route.
//
// INT-5 will replace this with the full J3 mode-comparison surface
// (generic / corpus / tenant / cross-corpus toggle + reactive pane).
// At INT-1.7 we ship the existing chat preserved so the affordance
// works.

import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AvaReasoningCards } from '@/app/(maestro)/intelligence/ask/AvaReasoningCards';
import { IntelligenceAskTabCookie } from './IntelligenceAskTabCookie';
import { getActiveClientRow } from '@/lib/active-client';
import { DEFAULT_CLIENT_KEY, getClientOption } from '@/lib/client-config';

export const metadata = {
  title: 'aVa Intelligence · Ask | AbarVa',
  description:
    'aVa Intelligence — advisor-style analysis grounded in tenant evidence, corpus patterns, and citations.',
};

export default async function IntelligenceAskPage() {
  // STRESS-P0-002 fix: resolve the active tenant from the authenticated session
  // instead of hardcoding "Apex Retail Group" / "apexretail" in the topbar and
  // in the AvaReasoningCards initialClient prop. The 2026-05-24 full-
  // module stress test on Meridian Health found that the page was hardcoded
  // and therefore drove aVa responses to assert "you're Apex Retail"
  // regardless of which tenant the user authenticated as.
  const activeClient = await getActiveClientRow(null).catch(() => null);
  const activeClientKey = activeClient?.key ?? DEFAULT_CLIENT_KEY;
  const activeClientDisplayName =
    activeClient?.name ?? getClientOption(activeClientKey).name;

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: 'Intelligence · Ask aVa',
      }}
    >
      <IntelligenceAskTabCookie />
      <style>{`
        @media (max-width: 640px) {
          [data-testid="intelligence-ask-page"] {
            padding: 0 !important;
          }
        }
      `}</style>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          data-testid="intelligence-ask-page"
          style={{
            flex: 1,
            overflow: 'hidden',
            background: SHELL.PAPER,
            padding: 0,
            minHeight: 0,
          }}
        >
          <AvaReasoningCards
            initialClient={activeClientKey}
            initialClientDisplayName={activeClientDisplayName}
          />
        </div>
      </div>
    </AppShell>
  );
}

// Per-request render (tenant-scoped reads / useSearchParams CSR bailout) — no static prerender.
export const dynamic = 'force-dynamic';
