// Intelligence landing - Explore Layer front door.
//
// Canonical lock: Intelligence is where users explore three substrates
// (tenant context, corpus patterns, art-of-possible industry intelligence)
// to produce two outcomes (originate new bets, validate existing bets).
// Submenus render natively in this page; they must not route to legacy pages.

import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { J0TelemetryBridge } from '@/components/intelligence/J0TelemetryBridge';
import { IntelligenceNativeExploreLayer } from '@/components/intelligence/IntelligenceNativeExploreLayer';
import {
  CORPUS_VERSION,
  J0_FAILURE_MODE_CARDS,
  getTotalResearchAnchorCount,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';
import { getActiveClientRow } from '@/lib/active-client';

const HEADLINE = 'Explore layer for AI bets.';

const LEDE =
  'Use Intelligence to understand what we know about this client, what patterns exist, and what art of the possible looks like in their industry, then originate stronger Strategic Moves or validate the bets already in flight.';

const FEATURED_PATTERN_IDS = new Set([
  'pattern_ai_governance_operating_model',
  'pattern_analytics_modernization',
  'pattern_ai_use_case_portfolio',
]);

export async function IntelligenceIndexPage() {
  const patternEntries = getPatternManifestEntries();
  const totalPatterns = patternEntries.length;
  const totalAnchors = getTotalResearchAnchorCount();
  const totalCards = J0_FAILURE_MODE_CARDS.length;
  const featuredFailureModes = J0_FAILURE_MODE_CARDS.slice(0, 3);
  const featuredPatternIds = patternEntries
    .filter((entry) => FEATURED_PATTERN_IDS.has(entry.id))
    .map((entry) => entry.id);

  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantKey = activeClient?.key ?? null;
  const visitorType: 'cold' | 'authenticated' =
    activeClient ? 'authenticated' : 'cold';

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: activeClient?.name ?? 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence - Explore Layer',
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
            background: `radial-gradient(circle at 12% 0%, rgba(245,226,201,0.62), transparent 28%), radial-gradient(circle at 90% 4%, rgba(221,233,217,0.76), transparent 26%), ${SHELL.PAPER}`,
            padding: '22px clamp(18px, 4vw, 52px) 56px',
            maxWidth: 1480,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <style>{`
            @media (max-width: 960px) {
              [data-testid="intelligence-frontpage-hero"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          <header
            data-testid="intelligence-frontpage-hero"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.65fr)',
              gap: 18,
              alignItems: 'stretch',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                background: 'rgba(253,251,246,0.84)',
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 18,
                padding: '26px clamp(22px, 3vw, 36px)',
                boxShadow: '0 24px 80px rgba(12,26,58,0.08)',
              }}
            >
              <p style={eyebrowStyle}>Intelligence - Explore Layer</p>
              <h1
                data-testid="intelligence-j0-headline"
                style={{
                  fontFamily: SHELL.SERIF_DISPLAY,
                  fontSize: 'clamp(38px, 5vw, 70px)',
                  fontWeight: 500,
                  color: SHELL.INK,
                  margin: 0,
                  lineHeight: 0.95,
                  letterSpacing: '-0.045em',
                  maxWidth: 860,
                }}
              >
                {HEADLINE}
              </h1>
              <p
                data-testid="intelligence-j0-subhead"
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 'clamp(15px, 1.35vw, 18px)',
                  color: SHELL.INK_MID,
                  margin: '18px 0 0',
                  lineHeight: 1.55,
                  maxWidth: 900,
                }}
              >
                {LEDE}
              </p>
            </div>

            <CorpusProofCard
              totalCards={totalCards}
              totalPatterns={totalPatterns}
              totalAnchors={totalAnchors}
            />
          </header>

          <IntelligenceNativeExploreLayer
            featuredFailureModes={featuredFailureModes}
            featuredPatternIds={featuredPatternIds}
            totalFailureModes={totalCards}
          />

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

function CorpusProofCard({
  totalCards,
  totalPatterns,
  totalAnchors,
}: {
  totalCards: number;
  totalPatterns: number;
  totalAnchors: number;
}) {
  return (
    <aside
      aria-label="Corpus proof"
      style={{
        background: SHELL.INK,
        color: SHELL.CARD_WHITE,
        borderRadius: 18,
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 280,
        boxShadow: '0 24px 80px rgba(12,26,58,0.18)',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(250,247,241,0.58)',
            fontWeight: 800,
          }}
        >
          Three substrates - two outcomes
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <StatPill value={totalCards} label="failure modes" />
          <StatPill value={totalPatterns} label="pattern records" />
          <StatPill value={totalAnchors} label="research anchors" />
          <StatPill value={CORPUS_VERSION} label="doctrine stamp" />
        </div>
      </div>
      <p
        style={{
          margin: '22px 0 0',
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          lineHeight: 1.4,
          color: 'rgba(250,247,241,0.78)',
          fontStyle: 'italic',
        }}
      >
        The purpose of exploration is always to make bets better: originate the
        next one, or validate the one already underway.
      </p>
    </aside>
  );
}

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid rgba(250,247,241,0.16)',
      }}
    >
      <span
        style={{
          fontFamily: SHELL.SERIF_DISPLAY,
          fontSize: 30,
          lineHeight: 1,
          color: SHELL.CARD_WHITE,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(250,247,241,0.56)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

const eyebrowStyle = {
  margin: '0 0 7px',
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
} as const;
