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
import { IntelligenceAgentCanvas } from '@/components/intelligence/IntelligenceAgentCanvas';
import { IntelligenceReasoningModeStrip } from '@/components/intelligence/IntelligenceReasoningModeStrip';

const SENTINEL_QUOTE =
  'I am Sentinel — AbarVa\'s knowledge librarian. Ask me about the corpus, ' +
  'cite evidence against a claim, or ask me to vet a synthesis. Cards on the ' +
  'right materialize as I retrieve.';

export const metadata = {
  title: 'Sentinel · Ask | AbarVa',
  description:
    'Sentinel — AbarVa\'s knowledge librarian. Ask about the corpus, cite ' +
    'evidence, or vet a synthesis.',
};

export default async function IntelligenceAskPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Ask Sentinel',
      }}
    >
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
            <span style={{ color: SHELL.INK_MUTED }}>Ask Sentinel</span>
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
              Sentinel · knowledge librarian
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
              Ask the corpus
            </h1>
          </div>

          {/* INT-5 · Reasoning mode strip — frames Sentinel's answer scope */}
          <IntelligenceReasoningModeStrip searchParams={params} />

          {/* The agent canvas — chat dominant + reactive knowledge pane */}
          <IntelligenceAgentCanvas quote={SENTINEL_QUOTE} />
        </div>
      </div>
    </AppShell>
  );
}
