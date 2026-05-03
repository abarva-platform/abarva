'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { J0FailureModeGrid } from '@/components/intelligence/J0FailureModeGrid';
import type { FailureModeNarrativeCard } from '@/lib/intelligence/j0-failure-mode-cards';

type ExploreTabKey =
  | 'today'
  | 'by-function'
  | 'patterns'
  | 'vendors'
  | 'peer-activity'
  | 'my-strategy'
  | 'sessions';

interface ExploreTab {
  key: ExploreTabKey;
  label: string;
  purpose: string;
  canvas: string;
  status: 'Stage 1' | 'Stage 2' | 'Stage 3';
}

interface IntelligenceNativeExploreLayerProps {
  featuredFailureModes: ReadonlyArray<FailureModeNarrativeCard>;
  featuredPatternIds: readonly string[];
  totalFailureModes: number;
}

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

const SUBMENUS: readonly ExploreTab[] = [
  {
    key: 'today',
    label: 'Today',
    purpose: 'Sentinel curated entry-state: what needs attention right now.',
    canvas: 'Pressure cards, pending decisions, recent activity, and metric gaps.',
    status: 'Stage 1',
  },
  {
    key: 'by-function',
    label: 'By function',
    purpose: 'Industry exploration by front, middle, and back office.',
    canvas: 'Domain tiles and theme cards tailored to the tenant industry.',
    status: 'Stage 2',
  },
  {
    key: 'patterns',
    label: 'Patterns',
    purpose: 'Corpus pattern catalog with failure-mode and industry filters.',
    canvas: 'Pattern list, provenance, usage, and deep dives.',
    status: 'Stage 1',
  },
  {
    key: 'vendors',
    label: 'Vendors',
    purpose: 'Vendor landscape intelligence and claim discipline.',
    canvas: 'Vendor plays, pricing patterns, implementation risks, and common over-promises.',
    status: 'Stage 3',
  },
  {
    key: 'peer-activity',
    label: 'Peer activity',
    purpose: 'Anonymized aggregate view of what peers are doing.',
    canvas: 'Activity feed by domain, event type, pattern, and time window.',
    status: 'Stage 3',
  },
  {
    key: 'my-strategy',
    label: 'My strategy',
    purpose: 'Uploaded client strategy artifacts structured and compared to evidence.',
    canvas: 'Themes, linked moves, empirical challenges, and comparative landscape.',
    status: 'Stage 2',
  },
  {
    key: 'sessions',
    label: 'Sessions',
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
    move: 'Healthcare Data Analytics Modernization for Agentic Care',
  },
  {
    title: 'Retail middle office',
    themes: 'Demand forecasting, replenishment, price/promo, inventory allocation, store labor.',
    move: 'Intelligent Store Operations and Inventory Accuracy',
  },
  {
    title: 'Financial-services middle office',
    themes: 'Credit decisioning, fraud detection, AML compliance, market risk, commercial servicing.',
    move: 'Commercial Banking AI Workflow Modernization',
  },
] as const;

const VENDOR_CARDS = [
  {
    title: 'Claim discipline',
    body: 'Compare vendor promises against tenant metrics, settled outcomes, implementation patterns, and contradiction records before award.',
  },
  {
    title: 'Landscape fit',
    body: 'Show where Epic, cloud data platforms, AI copilots, RCM vendors, and integration partners fit by use case and operating model.',
  },
  {
    title: 'Source handoff',
    body: 'When vendor selection becomes real, pass the context to Source with patterns, risks, evaluation criteria, and evidence already attached.',
  },
] as const;

const PEER_ACTIVITY = [
  '4 of 14 peer specialty retailers are moving demand forecasting from pilot to replenishment workflow integration.',
  'Healthcare IDNs are prioritizing prior-auth automation only where payer workflow evidence and coding-quality baselines exist.',
  'Regional banks are shifting fraud and AML AI bets toward explainability and operational exception queues before model expansion.',
] as const;

const STRATEGY_THEMES = [
  'Uploaded strategy artifacts become tenant context, not one-off files.',
  'Themes link to Strategic Moves and current-state KPI gaps.',
  'Sentinel highlights where strategy assumptions diverge from realized outcomes or industry patterns.',
] as const;

const SESSION_CARDS = [
  {
    title: 'Healthcare analytics modernization',
    body: 'Working session on Epic, RCM, prior auth, coding accuracy, VBC metrics, and data-platform sequencing.',
  },
  {
    title: 'Retail store operations AI',
    body: 'Candidate bet exploration across inventory accuracy, labor planning, demand sensing, and source-system readiness.',
  },
  {
    title: 'Financial-services risk operations',
    body: 'Validation session for explainable AI controls, fraud operations, AML workflow, and regulatory evidence.',
  },
] as const;

export function IntelligenceNativeExploreLayer({
  featuredFailureModes,
  featuredPatternIds,
  totalFailureModes,
}: IntelligenceNativeExploreLayerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ExploreTabKey>('today');
  const active = SUBMENUS.find((tab) => tab.key === activeTab) ?? SUBMENUS[0];

  const focusCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const focus = () => {
      canvas.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      canvas.focus({ preventScroll: true });
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focus);
    } else {
      focus();
    }
  }, []);

  const activateTab = useCallback(
    (tab: ExploreTab, options: { focus?: boolean } = {}) => {
      setActiveTab(tab.key);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('intelligence_native_submenu_selected', {
            detail: { submenu: tab.key, label: tab.label },
          }),
        );
      }
      if (options.focus) focusCanvas();
    },
    [focusCanvas],
  );

  const handleSelect = useCallback((tab: ExploreTab) => {
    activateTab(tab);
  }, [activateTab]);

  const handleSentinelFocus = useCallback(() => {
    const sessionsTab = SUBMENUS.find((tab) => tab.key === 'sessions');
    if (sessionsTab) activateTab(sessionsTab, { focus: true });
  }, [activateTab]);

  return (
    <>
      <style>{`
        @media (max-width: 960px) {
          [data-testid="intelligence-explore-shell"],
          [data-testid="intelligence-substrate-grid"],
          [data-testid="intelligence-outcome-grid"],
          [data-testid="intelligence-featured-grid"],
          [data-testid="native-card-grid"] {
            grid-template-columns: 1fr !important;
          }
          [data-testid="intelligence-submenu-strip"] {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
          }
        }
      `}</style>

      <div
        data-testid="intelligence-outcome-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {OUTCOMES.map((outcome) => (
          <OutcomeCard key={outcome.title} {...outcome} />
        ))}
      </div>

      <nav
        data-testid="intelligence-submenu-strip"
        aria-label="Intelligence explore submenus"
        role="tablist"
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
        {SUBMENUS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="intelligence-native-canvas"
              data-testid={`intelligence-native-tab-${tab.key}`}
              onClick={() => handleSelect(tab)}
              style={{
                flex: '0 0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 999,
                background: isActive ? SHELL.INK : 'transparent',
                color: isActive ? SHELL.CARD_WHITE : SHELL.INK_MID,
                border: `1px solid ${isActive ? SHELL.INK : SHELL.CARD_LINE}`,
                fontFamily: SHELL.SANS,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 8,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isActive ? 'rgba(250,247,241,0.62)' : SHELL.INK_MUTED,
                }}
              >
                {tab.status}
              </span>
            </button>
          );
        })}
      </nav>

      <section
        data-testid="intelligence-explore-shell"
        aria-label="Intelligence native explore canvas"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
          gap: 14,
          alignItems: 'stretch',
          marginBottom: 24,
        }}
      >
        <SentinelAmbientPanel onFocus={handleSentinelFocus} />
        <div
          ref={canvasRef}
          id="intelligence-native-canvas"
          role="tabpanel"
          aria-label={`${active.label} canvas`}
          aria-live="polite"
          tabIndex={-1}
          data-testid="intelligence-native-canvas"
          style={{
            minWidth: 0,
            outline: 'none',
            scrollMarginTop: 24,
          }}
        >
          <ActiveCanvas
            activeTab={activeTab}
            active={active}
            featuredFailureModes={featuredFailureModes}
            featuredPatternIds={featuredPatternIds}
          />
        </div>
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
            {totalFailureModes} canonical ways enterprise AI transformation fails
          </p>
        </div>
        <J0FailureModeGrid />
      </section>
    </>
  );
}

function ActiveCanvas({
  activeTab,
  active,
  featuredFailureModes,
  featuredPatternIds,
}: {
  activeTab: ExploreTabKey;
  active: ExploreTab;
  featuredFailureModes: ReadonlyArray<FailureModeNarrativeCard>;
  featuredPatternIds: readonly string[];
}) {
  return (
    <div
      style={{
        minHeight: 330,
        borderRadius: 18,
        border: `1px solid ${SHELL.CARD_LINE}`,
        background: 'rgba(253,251,246,0.9)',
        padding: 18,
      }}
    >
      <CanvasHeader active={active} />
      {activeTab === 'today' && <TodayCanvas />}
      {activeTab === 'by-function' && <ByFunctionCanvas />}
      {activeTab === 'patterns' && (
        <PatternsCanvas
          featuredFailureModes={featuredFailureModes}
          featuredPatternIds={featuredPatternIds}
        />
      )}
      {activeTab === 'vendors' && <VendorsCanvas />}
      {activeTab === 'peer-activity' && <PeerActivityCanvas />}
      {activeTab === 'my-strategy' && <MyStrategyCanvas />}
      {activeTab === 'sessions' && <SessionsCanvas />}
    </div>
  );
}

function CanvasHeader({ active }: { active: ExploreTab }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'baseline',
        marginBottom: 14,
      }}
    >
      <div>
        <p style={eyebrowStyle}>{active.label} - native canvas</p>
        <h2
          style={{
            margin: 0,
            fontFamily: SHELL.SERIF,
            fontSize: 'clamp(26px, 2.8vw, 38px)',
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          {active.purpose}
        </h2>
        <p style={{ ...cardParagraphStyle, marginTop: 8 }}>{active.canvas}</p>
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
        Same-page
      </span>
    </div>
  );
}

function TodayCanvas() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {TODAY_PRESSURES.map((pressure) => (
        <PressureCard key={pressure.title} {...pressure} />
      ))}
    </div>
  );
}

function ByFunctionCanvas() {
  return (
    <CardGrid>
      {FUNCTION_TILES.map((tile) => (
        <article key={tile.title} style={panelCardStyle}>
          <p style={eyebrowStyle}>Functional domain</p>
          <h3 style={cardTitleStyle}>{tile.title}</h3>
          <p style={{ ...cardParagraphStyle, marginTop: 10 }}>{tile.themes}</p>
          <p style={cardFooterStyle}>Candidate move: {tile.move}</p>
        </article>
      ))}
    </CardGrid>
  );
}

function PatternsCanvas({
  featuredFailureModes,
  featuredPatternIds,
}: {
  featuredFailureModes: ReadonlyArray<FailureModeNarrativeCard>;
  featuredPatternIds: readonly string[];
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={inlineProofStyle}>
        Featured corpus IDs: {featuredPatternIds.join(', ') || 'pattern manifest anchors pending'}
      </div>
      <CardGrid>
        {featuredFailureModes.map((mode) => (
          <FeaturedFailureMode key={mode.failureModeId} mode={mode} />
        ))}
      </CardGrid>
    </div>
  );
}

function VendorsCanvas() {
  return (
    <CardGrid>
      {VENDOR_CARDS.map((card) => (
        <SimpleCanvasCard key={card.title} title={card.title} body={card.body} eyebrow="Vendor intelligence" />
      ))}
    </CardGrid>
  );
}

function PeerActivityCanvas() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {PEER_ACTIVITY.map((activity, index) => (
        <article key={activity} style={panelCardStyle}>
          <p style={eyebrowStyle}>Peer signal #{index + 1}</p>
          <p style={{ ...cardParagraphStyle, color: SHELL.INK_MID }}>{activity}</p>
        </article>
      ))}
    </div>
  );
}

function MyStrategyCanvas() {
  return (
    <CardGrid>
      {STRATEGY_THEMES.map((theme, index) => (
        <SimpleCanvasCard
          key={theme}
          title={`Strategy layer ${index + 1}`}
          body={theme}
          eyebrow="My strategy"
        />
      ))}
    </CardGrid>
  );
}

function SessionsCanvas() {
  return (
    <CardGrid>
      {SESSION_CARDS.map((session) => (
        <SimpleCanvasCard
          key={session.title}
          title={session.title}
          body={session.body}
          eyebrow="Persistent session"
        />
      ))}
    </CardGrid>
  );
}

function PressureCard({ level, title, body }: { level: string; title: string; body: string }) {
  return (
    <article
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
            level === 'High'
              ? SHELL.RUST_BG
              : level === 'Medium'
                ? SHELL.PEACH_BG
                : SHELL.GRAY_BG,
          color:
            level === 'High'
              ? SHELL.RUST_TEXT
              : level === 'Medium'
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
        {level}
      </span>
      <div>
        <h3 style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 15, color: SHELL.INK }}>
          {title}
        </h3>
        <p style={{ ...cardParagraphStyle, marginTop: 5 }}>{body}</p>
      </div>
    </article>
  );
}

function SentinelAmbientPanel({ onFocus }: { onFocus: () => void }) {
  return (
    <aside
      aria-label="Sentinel ambient brief"
      style={{
        minHeight: 330,
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
      <button
        type="button"
        onClick={onFocus}
        aria-controls="intelligence-native-canvas"
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
          padding: '11px 12px',
          fontFamily: SHELL.SANS,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Show Sessions canvas
        <span aria-hidden="true">focus right pane</span>
      </button>
    </aside>
  );
}

function OutcomeCard({ title, body }: { title: string; body: string }) {
  return (
    <article style={panelCardStyle}>
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
        ...panelCardStyle,
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

function FeaturedFailureMode({ mode }: { mode: FailureModeNarrativeCard }) {
  return (
    <article style={panelCardStyle}>
      <p style={eyebrowStyle}>
        #{mode.failureModeId} - {mode.citedPatternIds.length} patterns -{' '}
        {mode.citedResearch.length} anchors
      </p>
      <h3 style={cardTitleStyle}>{mode.editorialName}</h3>
      <p style={{ ...cardParagraphStyle, marginTop: 10 }}>{mode.oneLineHook}</p>
      <p style={cardFooterStyle}>
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
        The platform operationalizes the client strategy, links it to bets,
        validates it against tenant context and industry patterns, and preserves
        the evidence trail. Partner-grade strategy development and executive
        offsite facilitation remain human work.
      </p>
    </section>
  );
}

function SimpleCanvasCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <article style={panelCardStyle}>
      <p style={eyebrowStyle}>{eyebrow}</p>
      <h3 style={cardTitleStyle}>{title}</h3>
      <p style={{ ...cardParagraphStyle, marginTop: 10 }}>{body}</p>
    </article>
  );
}

function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="native-card-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p style={labelStyle}>{children}</p>;
}

const panelCardStyle = {
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 14,
  padding: 18,
} as const;

const cardTitleStyle = {
  margin: 0,
  fontFamily: SHELL.SERIF,
  fontSize: 24,
  lineHeight: 1.05,
  color: SHELL.INK,
} as const;

const cardFooterStyle = {
  margin: '16px 0 0',
  paddingTop: 12,
  borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  lineHeight: 1.45,
  color: SHELL.INK_MUTED,
} as const;

const inlineProofStyle = {
  borderRadius: 12,
  border: `1px solid ${SHELL.CARD_LINE}`,
  background: SHELL.PAPER_SOFT,
  color: SHELL.INK_MID,
  padding: '10px 12px',
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.04em',
} as const;

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
