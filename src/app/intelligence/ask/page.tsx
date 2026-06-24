// /intelligence/ask · INT-1.7
//
// Preserves the Sentinel chat surface that previously lived at
// /intelligence (PR-INT-B / PR-INT-F). Reachable from the J0 page
// header's "Open Sentinel →" affordance. The page is auth-gated by
// the proxy (src/proxy.ts authRequiredRoutes) because the chat
// requires a Clerk session to call the agent route.
//
// INT-5 will replace this with the full J3 mode-comparison surface
// (generic / corpus / tenant / cross-corpus toggle + reactive pane).
// At INT-1.7 we ship the existing chat preserved so the affordance
// works.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { IntelligenceReasoningModeStrip } from '@/components/intelligence/IntelligenceReasoningModeStrip';
import { SentinelReasoningCards } from '@/app/(maestro)/intelligence/ask/SentinelReasoningCards';
import { IntelligenceAskTabCookie } from './IntelligenceAskTabCookie';
import { getActiveClientRow } from '@/lib/active-client';
import { DEFAULT_CLIENT_KEY, getClientOption } from '@/lib/client-config';

export const metadata = {
  title: 'aVa Intelligence · Ask | AbarVa',
  description:
    'aVa Intelligence — advisor-style analysis grounded in tenant evidence, corpus patterns, and citations.',
};

export default async function IntelligenceAskPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;

  // STRESS-P0-002 fix: resolve the active tenant from the authenticated session
  // instead of hardcoding "Apex Retail Group" / "apexretail" in the topbar and
  // in the SentinelReasoningCards initialClient prop. The 2026-05-24 full-
  // module stress test on Meridian Health found that the page was hardcoded
  // and therefore drove Sentinel's responses to assert "you're Apex Retail"
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
            padding: 14px 12px 22px !important;
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
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '24px 48px 32px',
          }}
        >
          {/* Breadcrumb back to J0 */}
          <nav
            aria-label="Breadcrumb"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginBottom: 16,
            }}
          >
            <Link
              href="/intelligence"
              style={{
                color: SHELL.INK_SOFT,
                textDecoration: 'none',
              }}
            >
              ← Intelligence
            </Link>
            <span style={{ margin: '0 8px' }}>·</span>
            <span style={{ color: SHELL.INK_MUTED }}>Ask aVa</span>
          </nav>

          {/* Page header */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 4,
              }}
            >
              aVa Intelligence · advisor
            </div>
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 22,
                fontWeight: 700,
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              Ask aVa
            </h1>
          </div>

          {/* INT-5 · Reasoning mode strip — frames Ava's answer scope */}
          <IntelligenceReasoningModeStrip searchParams={params} />

          <SentinelReasoningCards
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
