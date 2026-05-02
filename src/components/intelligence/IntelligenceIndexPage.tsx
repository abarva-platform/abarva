// Intelligence landing - Explore Layer front door.
//
// Canonical lock: Intelligence is where users explore three substrates
// (tenant context, corpus patterns, art-of-possible industry intelligence)
// to produce two outcomes (originate new bets, validate existing bets).
// Sentinel is ambient by default; the canvas is the dominant work surface.

import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { J0FailureModeGrid } from '@/components/intelligence/J0FailureModeGrid';
import { J0AffordanceLink } from '@/components/intelligence/J0AffordanceLink';
import { J0TelemetryBridge } from '@/components/intelligence/J0TelemetryBridge';
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

const SUBSTRATES = [
  {
    title: 'What we know about you',
    label: 'Tenant substrate',
    body: 'Org structure, IT landscape, vendors, uploaded strategy artifacts, existing moves, source events, data inventory, current-state metrics, and change-failure history from the private data plane.',
    programUse: 'Grounds every answer in actual client context instead of a generic industry average.',
  },
  {
    title: 'What patterns exist',
    label: 'Corpus substrate',
    body: 'Patterns, anti-patterns, solution architectures, decision frameworks, evidence templates, vendor implementations, regulatory frames, and metric-gap records tied to the 10 failure modes.',
    programUse: 'Gives Nexus and Sentinel a senior-practitioner pattern language for diagnosing risk and naming the next control.',
  },
  {
    title: 'What is possible for you',
    label: 'Industry substrate',
    body: 'Functional-domain intelligence across front office, middle office, and back office: common bets, vendor landscape, value ranges, success patterns, failure patterns, and peer activity.',
    programUse: 'Shows what a healthcare IDN, specialty retailer, or financial-services tenant should be paying attention to now.',
  },
] as const;

const OUTCOMES = [
  {
    title: 'Originate new bets',
    body: 'When exploration matures into a candidate, register it as a Strategic Move at P0 with the conversation, patterns, risks, and foundation considerations attached as origination evidence.',
  },
  {
    title: 'Validate existing bets',
    body: 'Bring an existing Strategic Move into Intelligence for foundation readiness, pre-mortem, pattern-grounded challenge, or strategy-alignment work before commitments harden.',
  },
] as const;

const SUBMENUS = [
  {
    label: 'Today',
    href: '/intelligence',
    purpose: 'Sentinel curated entry-state: what needs attention right now.',
    canvas: 'Pressure cards, pending decisions, recent activity, and metric gaps.',
    status: 'Stage 1',
  },
  {
    label: 'By function',
    href: '/intelligence/topics',
    purpose: 'Industry exploration by front, middle, and back office.',
    canvas: 'Domain tiles and theme cards tailored to the tenant industry.',
    status: 'Stage 2',
  },
  {
    label: 'Patterns',
    href: '/intelligence/patterns',
    purpose: 'Corpus pattern catalog with failure-mode and industry filters.',
    canvas: 'Pattern list, provenance, usage, and deep dives.',
    status: 'Stage 1',
  },
  {
    label: 'Vendors',
    href: '/source/patterns',
    purpose: 'Vendor landscape intelligence and claim discipline.',
    canvas: 'Vendor plays, pricing patterns, implementation risks, and common over-promises.',
    status: 'Stage 3',
  },
  {
    label: 'Peer activity',
    href: '/intelligence/signals',
    purpose: 'Anonymized aggregate view of what peers are doing.',
    canvas: 'Activity feed by domain, event type, pattern, and time window.',
    status: 'Stage 3',
  },
  {
    label: 'My strategy',
    href: '/setup',
    purpose: 'Uploaded client strategy artifacts structured and compared to evidence.',
    canvas: 'Themes, linked moves, empirical challenges, and comparative landscape.',
    status: 'Stage 2',
  },
  {
    label: 'Sessions',
    href: '/intelligence/ask',
    purpose: 'Persistent thinking sessions that can become move evidence.',
    canvas: 'Named sessions, candidate moves, tags, exports, and return state.',
    status: 'Stage 1',
  },
] as const;

const TODAY_PRESSURES = [
  {
    level: 'High',
    title: 'Foundation readiness before P2',
    body: 'Meridian analytics modernization needs Epic, RCM, prior-auth, coding quality, and value-based-care context checked before solution claims harden.',
  },
  {
    level: 'Medium',
    title: 'Metric gaps need bet translation',
    body: 'Current-state KPI baselines should point to candidate Strategic Moves, not sit as static dashboard facts.',
  },
  {
    level: 'Watch',
    title: 'Vendor claims require contradiction checks',
    body: 'Source events should compare vendor promises against corpus patterns, tenant metrics, and settled outcomes before award.',
  },
] as const;

const FUNCTION_TILES = [
  {
    title: 'Healthcare middle office',
    themes: 'Prior auth, coding quality, ambient documentation, population health, value-based care.',
  },
  {
    title: 'Retail middle office',
    themes: 'Demand forecasting, replenishment, price/promo, inventory allocation, store labor.',
  },
  {
    title: 'Financial-services middle office',
    themes: 'Credit decisioning, fraud detection, AML compliance, market risk, commercial servicing.',
  },
] as const;

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
              [data-testid="intelligence-frontpage-hero"],
              [data-testid="intelligence-explore-shell"],
              [data-testid="intelligence-substrate-grid"],
              [data-testid="intelligence-outcome-grid"],
              [data-testid="intelligence-featured-grid"],
              [data-testid="intelligence-function-grid"] {
                grid-template-columns: 1fr !important;
              }
              [data-testid="intelligence-submenu-strip"] {
                overflow-x: auto !important;
                flex-wrap: nowrap !important;
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
              <div
                data-testid="intelligence-outcome-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                  marginTop: 20,
                }}
              >
                {OUTCOMES.map((outcome) => (
                  <OutcomeCard key={outcome.title} {...outcome} />
                ))}
              </div>
            </div>

            <CorpusProofCard
              totalCards={totalCards}
              totalPatterns={totalPatterns}
              totalAnchors={totalAnchors}
            />
          </header>

          <nav
            data-testid="intelligence-submenu-strip"
            aria-label="Intelligence explore submenus"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              background: 'rgba(253,251,246,0.72)',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 14,
              padding: 8,
              marginBottom: 14,
            }}
          >
            {SUBMENUS.map((item, index) => (
              <SubmenuLink key={item.label} item={item} active={index === 0} />
            ))}
          </nav>

          <section
            data-testid="intelligence-explore-shell"
            aria-label="Intelligence Today explore canvas"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
              gap: 14,
              alignItems: 'stretch',
              marginBottom: 24,
            }}
          >
            <SentinelAmbientPanel />
            <TodayCanvas />
          </section>

          <section aria-labelledby="substrate-title" style={{ marginBottom: 24 }}>
            <SectionHeading
              id="substrate-title"
              eyebrow="Three substrates"
              title="Every exploration composes client context, corpus patterns, and industry possibility."
              subtitle="This is why Intelligence should not look like a generic chat page. It is a browsable strategic thinking layer grounded in the tenant, the corpus, and the market."
            />
            <div
              data-testid="intelligence-substrate-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {SUBSTRATES.map((substrate) => (
                <SubstrateCard key={substrate.title} {...substrate} />
              ))}
            </div>
          </section>

          <section aria-labelledby="function-title" style={{ marginBottom: 24 }}>
            <SectionHeading
              id="function-title"
              eyebrow="By function preview"
              title="Industry depth becomes navigable by operating domain."
              subtitle="The full vision goes beyond pattern search: a user can browse functional domains, see common bets, and ask Sentinel to deepen the picture in tenant context."
            />
            <div
              data-testid="intelligence-function-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {FUNCTION_TILES.map((tile) => (
                <FunctionTile key={tile.title} {...tile} />
              ))}
            </div>
          </section>

          <section aria-labelledby="featured-title" style={{ marginBottom: 26 }}>
            <SectionHeading
              id="featured-title"
              eyebrow="Pattern anchors"
              title="Failure modes still form the spine of the work."
              subtitle={`Featured corpus IDs: ${featuredPatternIds.join(', ') || 'pattern manifest anchors pending'}. These anchors should surface inside Programs, Source, and Tower when the client context matches.`}
            />
            <div
              data-testid="intelligence-featured-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {featuredFailureModes.map((mode) => (
                <FeaturedFailureMode key={mode.failureModeId} mode={mode} />
              ))}
            </div>
          </section>

          <ScopeBoundary />

          <section style={{ marginTop: 26 }}>
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

function SubmenuLink({
  item,
  active,
}: {
  item: (typeof SUBMENUS)[number];
  active: boolean;
}) {
  return (
    <J0AffordanceLink
      href={item.href}
      affordance={`open_${item.label.toLowerCase().replace(/\s+/g, '_')}`}
      style={{
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        borderRadius: 999,
        textDecoration: 'none',
        background: active ? SHELL.INK : 'transparent',
        color: active ? SHELL.CARD_WHITE : SHELL.INK_MID,
        border: `1px solid ${active ? SHELL.INK : SHELL.CARD_LINE}`,
        fontFamily: SHELL.SANS,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {item.label}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: active ? 'rgba(250,247,241,0.62)' : SHELL.INK_MUTED,
        }}
      >
        {item.status}
      </span>
    </J0AffordanceLink>
  );
}

function SentinelAmbientPanel() {
  return (
    <aside
      aria-label="Sentinel ambient brief"
      style={{
        minHeight: 260,
        borderRadius: 18,
        background: SHELL.INK,
        color: SHELL.CARD_WHITE,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: SHELL.CARD_WHITE,
              color: SHELL.INK,
              display: 'grid',
              placeItems: 'center',
              fontFamily: SHELL.SERIF,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            Sn
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: SHELL.SERIF, fontSize: 18 }}>
              Sentinel
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(250,247,241,0.46)',
              }}
            >
              Ambient - available
            </p>
          </div>
        </div>
        <p
          style={{
            margin: '18px 0 0',
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            lineHeight: 1.45,
            color: 'rgba(250,247,241,0.82)',
            fontStyle: 'italic',
          }}
        >
          Three things matter today: foundation readiness, metric-to-bet
          translation, and vendor claim discipline. I can deepen any card or
          turn a mature thread into Strategic Move evidence.
        </p>
      </div>
      <J0AffordanceLink
        href="/intelligence/ask"
        affordance="open_sentinel_session"
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderRadius: 999,
          border: '1px solid rgba(250,247,241,0.22)',
          background: 'rgba(250,247,241,0.08)',
          color: SHELL.CARD_WHITE,
          textDecoration: 'none',
          padding: '11px 12px',
          fontFamily: SHELL.SANS,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        Ask Sentinel
        <span aria-hidden="true">open</span>
      </J0AffordanceLink>
    </aside>
  );
}

function TodayCanvas() {
  return (
    <div
      style={{
        minHeight: 260,
        borderRadius: 18,
        border: `1px solid ${SHELL.CARD_LINE}`,
        background: 'rgba(253,251,246,0.88)',
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <div>
          <p style={eyebrowStyle}>Today - default canvas</p>
          <h2
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 'clamp(26px, 2.8vw, 38px)',
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            What deserves attention before the next AI bet hardens?
          </h2>
        </div>
        <span
          style={{
            flex: '0 0 auto',
            borderRadius: 999,
            background: SHELL.MINT_BG,
            border: `1px solid ${SHELL.MINT_LINE}`,
            color: SHELL.MINT_TEXT,
            padding: '5px 9px',
            fontFamily: SHELL.MONO,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Canvas dominant
        </span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {TODAY_PRESSURES.map((pressure) => (
          <article
            key={pressure.title}
            style={{
              borderRadius: 12,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              padding: 14,
              display: 'grid',
              gridTemplateColumns: '90px minmax(0, 1fr)',
              gap: 12,
            }}
          >
            <span
              style={{
                alignSelf: 'start',
                borderRadius: 999,
                background:
                  pressure.level === 'High'
                    ? SHELL.RUST_BG
                    : pressure.level === 'Medium'
                      ? SHELL.PEACH_BG
                      : SHELL.GRAY_BG,
                color:
                  pressure.level === 'High'
                    ? SHELL.RUST_TEXT
                    : pressure.level === 'Medium'
                      ? SHELL.PEACH_TEXT
                      : SHELL.GRAY_TEXT,
                padding: '4px 8px',
                textAlign: 'center',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 800,
              }}
            >
              {pressure.level}
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: SHELL.SANS,
                  fontSize: 15,
                  color: SHELL.INK,
                }}
              >
                {pressure.title}
              </h3>
              <p style={{ ...cardParagraphStyle, marginTop: 5 }}>{pressure.body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function OutcomeCard({ title, body }: { title: string; body: string }) {
  return (
    <article
      style={{
        borderRadius: 12,
        border: `1px solid ${SHELL.CARD_LINE}`,
        background: SHELL.CARD_WHITE,
        padding: 14,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 22,
          color: SHELL.INK,
          lineHeight: 1,
        }}
      >
        {title}
      </h2>
      <p style={{ ...cardParagraphStyle, marginTop: 8 }}>{body}</p>
    </article>
  );
}

function SubstrateCard({
  title,
  label,
  body,
  programUse,
}: {
  title: string;
  label: string;
  body: string;
  programUse: string;
}) {
  return (
    <article
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 14,
        padding: 18,
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <p style={eyebrowStyle}>{label}</p>
      <h3
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 28,
          color: SHELL.INK,
          lineHeight: 1,
        }}
      >
        {title}
      </h3>
      <div>
        <Label>What is in it</Label>
        <p style={cardParagraphStyle}>{body}</p>
      </div>
      <div>
        <Label>How a program leverages it</Label>
        <p style={cardParagraphStyle}>{programUse}</p>
      </div>
    </article>
  );
}

function FunctionTile({ title, themes }: { title: string; themes: string }) {
  return (
    <article
      style={{
        background: 'linear-gradient(180deg, #fdfbf6 0%, #f7f1e6 100%)',
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 14,
        padding: 18,
      }}
    >
      <p style={eyebrowStyle}>Functional domain</p>
      <h3
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 25,
          lineHeight: 1.05,
          color: SHELL.INK,
        }}
      >
        {title}
      </h3>
      <p style={{ ...cardParagraphStyle, marginTop: 10 }}>{themes}</p>
    </article>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ margin: '0 0 12px' }}>
      <p style={eyebrowStyle}>{eyebrow}</p>
      <h2
        id={id}
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 'clamp(22px, 2vw, 30px)',
          color: SHELL.INK,
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: '8px 0 0',
          fontFamily: SHELL.SANS,
          fontSize: 13.5,
          color: SHELL.INK_SOFT,
          lineHeight: 1.5,
          maxWidth: 900,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function FeaturedFailureMode({
  mode,
}: {
  mode: (typeof J0_FAILURE_MODE_CARDS)[number];
}) {
  return (
    <article
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 14,
        padding: 18,
      }}
    >
      <p style={eyebrowStyle}>
        #{mode.failureModeId} - {mode.citedPatternIds.length} patterns -{' '}
        {mode.citedResearch.length} anchors
      </p>
      <h3
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 24,
          lineHeight: 1.05,
          color: SHELL.INK,
        }}
      >
        {mode.editorialName}
      </h3>
      <p style={{ ...cardParagraphStyle, marginTop: 10 }}>{mode.oneLineHook}</p>
      <p
        style={{
          margin: '16px 0 0',
          paddingTop: 12,
          borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          lineHeight: 1.45,
          color: SHELL.INK_MUTED,
        }}
      >
        Provenance: {mode.citedResearch[0]?.source ?? 'research anchor'} -{' '}
        {mode.lastReviewedAt}
      </p>
    </article>
  );
}

function ScopeBoundary() {
  return (
    <section
      aria-label="Intelligence scope boundary"
      style={{
        borderRadius: 16,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        background: SHELL.PEACH_BG,
        padding: 18,
        color: SHELL.INK,
      }}
    >
      <p style={{ ...eyebrowStyle, color: SHELL.PEACH_TEXT }}>Scope lock</p>
      <h2
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 26,
          lineHeight: 1.05,
        }}
      >
        Intelligence supports strategy thinking. It does not generate enterprise AI strategy from scratch.
      </h2>
      <p style={{ ...cardParagraphStyle, marginTop: 8, color: SHELL.INK_MID }}>
        The platform operationalizes the client context strategy, links it to bets,
        validates it against tenant context and industry patterns, and preserves
        the evidence trail. Partner-grade strategy development and executive
        offsite facilitation remain human work.
      </p>
    </section>
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

function Label({ children }: { children: ReactNode }) {
  return <p style={labelStyle}>{children}</p>;
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

const labelStyle = {
  margin: '0 0 4px',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
} as const;

const cardParagraphStyle = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: SHELL.INK_SOFT,
} as const;
