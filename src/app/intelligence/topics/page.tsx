// /intelligence/topics · INT-2.3 reshape
//
// Topic grid — replaces the INT-1.7 placeholder. Renders all 10
// topics from the J1_TOPICS registry as a responsive grid.
// Public route (auth-gate-removed in INT-1.3).
//
// Per docs/build/intelligence/INT-2_DETAILED_DESIGN.md §4.1.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { J1TopicGrid } from '@/components/intelligence/J1TopicGrid';
import { J1TelemetryBridge } from '@/components/intelligence/J1TelemetryBridge';
import {
  J1_TOPICS,
  getTotalAssociatedPatternCount,
} from '@/lib/intelligence/j1-topics';
import { getActiveClientRow } from '@/lib/active-client';

export const metadata = {
  title: 'Topics · Intelligence | AbarVa',
  description:
    'AI transformation topics — what enterprises grapple with, organized by AbarVa\'s point of view, not as a wiki.',
};

export default async function IntelligenceTopicsPage() {
  const topicCount = J1_TOPICS.length;
  const patternCount = getTotalAssociatedPatternCount();

  // Tenant detection for telemetry — same pattern as J0 page.
  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantKey = activeClient?.key ?? null;
  const visitorType: 'cold' | 'authenticated' =
    activeClient ? 'authenticated' : 'cold';

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Topics',
      }}
    >
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
          data-testid="intelligence-j1-topics-page"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '32px 48px 64px',
            maxWidth: 1280,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginBottom: 20,
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
            <span aria-current="page" style={{ color: SHELL.INK_MUTED }}>
              Topics
            </span>
          </nav>

          {/* Page header */}
          <header style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              AI transformation topics · {topicCount} thesis-led ·{' '}
              {patternCount} pattern citations
            </div>
            <h1
              style={{
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: 'clamp(24px, 3.2vw, 36px)',
                fontWeight: 400,
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                maxWidth: 720,
              }}
            >
              AI transformation topics
            </h1>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                color: SHELL.INK_SOFT,
                lineHeight: 1.55,
                margin: '14px 0 0',
                maxWidth: 640,
              }}
            >
              What enterprises grapple with — organized by AbarVa&apos;s point
              of view, not as a wiki. Each topic surfaces a thesis up top
              and the corpus depth underneath.
            </p>
          </header>

          {/* The topic grid */}
          <main>
            <J1TopicGrid />
          </main>

          {/* Telemetry bridge — listens for J1 CustomEvents and forwards
              them to PostHog. */}
          <J1TelemetryBridge
            tenantKey={tenantKey}
            visitorType={visitorType}
            surface="topics_grid"
          />
        </div>
      </div>
    </AppShell>
  );
}
