// I1 · INT-1.8 agent-anchor reshape — Sentinel embedded on the /intelligence
// landing so the agent is the primary entry point, not a click-through.
//
// INT-1.3 moved the chat surface to /intelligence/ask; INT-1.8 reverses
// that decision in response to founder feedback: "i need to click twice
// into the details...then bring up sentinel...what is the vision for this
// page and how can we make it better?"
//
// New layout:
//   1. Compact header (headline + corpus stats + Browse topics link)
//   2. IntelligenceAgentCanvas — Sentinel chat + reactive pane (fills viewport)
//   3. Failure mode library — J0 grid scrolls below
//
// /intelligence/ask is preserved for backward compatibility — it still
// renders the full canvas at a dedicated URL.
//
// INT-1.5 telemetry is preserved — J0TelemetryBridge still bridges all
// PostHog events.

import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { J0FailureModeGrid } from '@/components/intelligence/J0FailureModeGrid';
import { J0AffordanceLink } from '@/components/intelligence/J0AffordanceLink';
import { J0TelemetryBridge } from '@/components/intelligence/J0TelemetryBridge';
import { IntelligenceAgentCanvas } from '@/components/intelligence/IntelligenceAgentCanvas';
import {
  CORPUS_VERSION,
  J0_FAILURE_MODE_CARDS,
  getTotalResearchAnchorCount,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';
import { getActiveClientRow } from '@/lib/active-client';

const HEADLINE = 'Why enterprise AI transformation fails — and how AbarVa prevents it.';

const SENTINEL_QUOTE =
  "I am Sentinel — AbarVa's knowledge librarian. Ask me what the corpus knows, " +
  'cite evidence against a claim, or ask me to vet a synthesis. ' +
  'Cards on the right materialize as I retrieve.';

export async function IntelligenceIndexPage() {
  const totalPatterns = getPatternManifestEntries().length;
  const totalAnchors = getTotalResearchAnchorCount();
  const totalCards = J0_FAILURE_MODE_CARDS.length;

  // Tenant detection for telemetry. Cold visitors get tenantKey=null +
  // visitorType='cold'; authenticated users get the broker tenant key
  // and visitorType='authenticated'. PostHog can segment on these.
  // Failures here are non-fatal — we log nothing and pass null tenant.
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
        context: 'Intelligence · Sentinel',
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
            padding: '24px 48px 48px',
            maxWidth: 1440,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Compact page header — corpus identity + Browse topics */}
          <header
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 16,
              alignItems: 'flex-end',
              marginBottom: 20,
            }}
          >
            <div>
              <h1
                data-testid="intelligence-j0-headline"
                style={{
                  fontFamily: SHELL.SERIF_DISPLAY,
                  fontSize: 'clamp(20px, 2.4vw, 28px)',
                  fontWeight: 400,
                  color: SHELL.INK,
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: '-0.012em',
                  maxWidth: 680,
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
                  margin: '8px 0 0',
                  letterSpacing: '0.04em',
                }}
              >
                {totalCards} failure modes · {totalPatterns} patterns ·{' '}
                {totalAnchors} research anchors · corpus {CORPUS_VERSION}
              </p>
            </div>

            <nav
              aria-label="Intelligence affordances"
              style={{ display: 'flex', gap: 8 }}
            >
              <J0AffordanceLink
                href="/intelligence/topics"
                affordance="browse_topics"
                testid="intelligence-j0-affordance-browse-topics"
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
              </J0AffordanceLink>
            </nav>
          </header>

          {/* Sentinel agent canvas — primary anchor, fills most of the viewport */}
          <IntelligenceAgentCanvas
            quote={SENTINEL_QUOTE}
            heightCss="calc(100vh - 210px)"
          />

          {/* Failure mode library — scrolls below the agent canvas */}
          <section style={{ marginTop: 40 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 20,
                borderTop: `1px solid ${SHELL.CARD_LINE}`,
                paddingTop: 24,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: SHELL.INK_MUTED,
                  fontWeight: 700,
                }}
              >
                Failure mode library
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                }}
              >
                {totalCards} canonical ways enterprise AI transformation fails
              </p>
            </div>
            <J0FailureModeGrid />
          </section>

          {/* Telemetry bridge — listens for J0 CustomEvents and forwards
              them to PostHog. No-render client island so the page stays RSC. */}
          <J0TelemetryBridge
            tenantKey={tenantKey}
            visitorType={visitorType}
            corpusVersion={CORPUS_VERSION}
            totalPatterns={totalPatterns}
            totalResearchAnchors={totalAnchors}
          />
        </div>
      </div>
    </AppShell>
  );
}
