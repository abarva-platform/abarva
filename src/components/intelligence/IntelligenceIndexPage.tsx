// I1 · INT-1.3 reshape — J0 cold-landing as the canonical /intelligence surface.
//
// Replaces the chat-dominant reshape from PR-INT-B/F. The page now leads
// with the failure-mode card grid per
// docs/build/intelligence/INT-1_DETAILED_DESIGN.md §4. The chat surface
// preserved from PR-INT-B is no longer rendered on this page; INT-1.7
// will host it at /intelligence/ask reachable from "Open Sentinel".
//
// Per the spine doc, this page is content-led not chat-led: the 10
// failure-mode cards are the primary affordance; chat is secondary.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { J0FailureModeGrid } from '@/components/intelligence/J0FailureModeGrid';
import {
  CORPUS_VERSION,
  J0_FAILURE_MODE_CARDS,
  getTotalResearchAnchorCount,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';

const HEADLINE = 'Why enterprise AI transformation fails — and how AbarVa prevents it.';

export function IntelligenceIndexPage() {
  const totalPatterns = getPatternManifestEntries().length;
  const totalAnchors = getTotalResearchAnchorCount();
  const totalCards = J0_FAILURE_MODE_CARDS.length;

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Why AI programs fail',
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
          data-testid="intelligence-j0-page"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '32px 48px 48px',
            maxWidth: 1280,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Page header zone */}
          <header
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 16,
              alignItems: 'flex-end',
              marginBottom: 28,
            }}
          >
            <div>
              <h1
                data-testid="intelligence-j0-headline"
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
                {HEADLINE}
              </h1>
              <p
                data-testid="intelligence-j0-subhead"
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                  margin: '12px 0 0',
                  letterSpacing: '0.04em',
                }}
              >
                {totalCards} failure modes · {totalPatterns} patterns ·{' '}
                {totalAnchors} research anchors · corpus {CORPUS_VERSION}
              </p>
            </div>

            <nav
              aria-label="Intelligence affordances"
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <Link
                href="/intelligence/topics"
                data-testid="intelligence-j0-affordance-browse-topics"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  background: 'transparent',
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 6,
                  textDecoration: 'none',
                }}
              >
                Browse topics →
              </Link>
              <Link
                href="/intelligence/ask"
                data-testid="intelligence-j0-affordance-open-sentinel"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  background: 'transparent',
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 6,
                  textDecoration: 'none',
                }}
              >
                Open Sentinel →
              </Link>
            </nav>
          </header>

          {/* J0 failure-mode card grid — the primary content */}
          <main>
            <J0FailureModeGrid />
          </main>
        </div>
      </div>
    </AppShell>
  );
}
