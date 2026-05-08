'use client';

// Intelligence v3 · top-level page.
//
// Spec: docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
//       docs/design-canon/wireframe-intelligence-v3-2026-05-07.html
//
// Reframes the Intelligence surface as a pattern-to-Move funnel with
// Sentinel chat as a first-class, three-mode layout. v1 ships:
//   - Today canvas with substrate-bound blocks (currently fixture data)
//   - 7-stage tab nav (only Today canvas implemented in this slice)
//   - Three-mode chat shell (side rail · bottom expanded · collapsed)
//   - Tower link removed from this page's nav per §2.6 / Q5
//
// Deferred (next waves):
//   - 6 other stages get content
//   - Real tenant binding via AgentContextBroker
//   - LLM hookup behind Sentinel chat
//   - Chat-driven page state (Move cards mutate per conversation)
//   - Shape-into-Move click → Strategic Moves originate flow

import { useEffect, useState } from 'react';
import { COLORS, FONT, SPACING } from '@/lib/design/abarva-theme';
import { IntelligenceV3TopNav } from './IntelligenceV3TopNav';
import { IntelligenceV3StageTabs } from './IntelligenceV3StageTabs';
import { TodayCanvas } from './TodayCanvas';
import { VendorsCanvas } from './VendorsCanvas';
import { ByFunctionCanvas } from './ByFunctionCanvas';
import { PatternsCanvas } from './PatternsCanvas';
import { PeerActivityCanvas } from './PeerActivityCanvas';
import { MyStrategyCanvas } from './MyStrategyCanvas';
import { SessionsCanvas } from './SessionsCanvas';
import { SentinelChat } from './SentinelChat';
import { ArtOfPossibleBandsCanvas } from './ArtOfPossibleBandsCanvas';
import { IntelligenceMap } from '@/components/intelligence-v4/IntelligenceMap';
import { IntelligenceBrief } from '@/components/intelligence-v4/IntelligenceBrief';
import { getMeridianMapData, getMeridianBriefData } from '@/lib/knowledge-corpus/fixtures/meridian-healthcare';
import { FIRST_CAPITAL_DEMO, MERIDIAN_AOP_DEMO } from './demo-data';
import type { IntelligenceV3PageData, StageKey } from './types';
import type { VendorsData } from '@/lib/intelligence-v3/vendors-display';
import type {
  ByFunctionData,
  PeerActivityData,
  MyStrategyData,
} from '@/lib/intelligence-v3/stages-display';
import type { AIInitiative } from '@/lib/admin/ai-initiatives/queries';

interface Props {
  /** Server-side composed page data. Defaults to the demo fixture. */
  data?: IntelligenceV3PageData;
  /** True when `data` reflects real DB substrate; false for fallback. */
  isLiveBound?: boolean;
  /** Vendors stage data — null when not loaded. */
  vendorsData?: VendorsData | null;
  byFunctionData?: ByFunctionData | null;
  peerActivityData?: PeerActivityData | null;
  myStrategyData?: MyStrategyData | null;
  /** Initiatives passed through for the Patterns stage exposure overlay. */
  initiatives?: ReadonlyArray<AIInitiative> | null;
}

export function IntelligenceV3Page({
  data: dataProp,
  isLiveBound = false,
  vendorsData = null,
  byFunctionData = null,
  peerActivityData = null,
  myStrategyData = null,
  initiatives = null,
}: Props = {}) {
  const data = dataProp ?? FIRST_CAPITAL_DEMO;
  // PR-K2 · default landing is The Brief — it's the canonical
  // corpus-grounded synthesis surface. Other stages remain reachable
  // via the tab strip. URL hash (e.g. /intelligence#map) drives the
  // active stage so deep links from /intelligence/map redirect → hash
  // work without per-route page components.
  const [stage, setStage] = useState<StageKey>('brief');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      const h = window.location.hash.replace('#', '');
      if (
        h === 'map' || h === 'brief' || h === 'art-of-possible' ||
        h === 'today' || h === 'by-function' ||
        h === 'patterns' || h === 'vendors' || h === 'peer-activity' ||
        h === 'my-strategy' || h === 'sessions'
      ) {
        setStage(h as StageKey);
      }
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const handleStageChange = (next: StageKey) => {
    setStage(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = next === 'brief' ? '' : next;
      window.history.replaceState(null, '', url.toString());
    }
  };
  const isCorpusStage = stage === 'brief' || stage === 'map';
  const isAopStage = stage === 'art-of-possible';
  const aopBands = data.aopBands ?? MERIDIAN_AOP_DEMO;

  return (
    <div
      data-testid="intelligence-v3-page"
      style={{
        minHeight: '100vh',
        background: COLORS.surface,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      <IntelligenceV3TopNav tenantName={data.tenantName} />

      {!isLiveBound && !isCorpusStage && (
        <div
          role="status"
          style={{
            background: COLORS.surface2,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: `${SPACING.xs}px ${SPACING.lg}px`,
            fontFamily: FONT.body,
            fontSize: 11,
            color: COLORS.muted,
            textAlign: 'center',
          }}
        >
          Demo content shown · {data.tenantName} substrate not yet bound
        </div>
      )}

      {/* Stage tabs strip · always visible above the canvas */}
      <div
        style={{
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: `${SPACING.md}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
        }}
      >
        <IntelligenceV3StageTabs active={stage} onChange={handleStageChange} />
      </div>

      {isCorpusStage ? (
        // PR-K2 corpus surfaces · render full-width (Brief/Map carry
        // their own masthead + right rail; embedding inside the v3
        // grid would squeeze them). Sentinel chat is integrated into
        // each component's right-rail design.
        stage === 'brief'
          ? <IntelligenceBrief data={getMeridianBriefData()} />
          : <IntelligenceMap data={getMeridianMapData()} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 440px',
            alignItems: 'start',
          }}
        >
          <main
            style={{
              padding: `${SPACING.lg}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
              width: '100%',
              boxSizing: 'border-box',
              paddingBottom: SPACING.xxxl + 56, // bottom gutter for any docked chat
            }}
          >
            <Hero data={data} />

            {isAopStage && <ArtOfPossibleBandsCanvas data={aopBands} />}
            {stage === 'today' && <TodayCanvas data={data} />}
            {stage === 'vendors' &&
              (vendorsData ? <VendorsCanvas data={vendorsData} /> : <StageStub stage={stage} />)}
            {stage === 'by-function' &&
              (byFunctionData ? (
                <ByFunctionCanvas data={byFunctionData} />
              ) : (
                <StageStub stage={stage} />
              ))}
            {stage === 'patterns' && <PatternsCanvas initiatives={initiatives ?? []} />}
            {stage === 'peer-activity' &&
              (peerActivityData ? (
                <PeerActivityCanvas data={peerActivityData} />
              ) : (
                <StageStub stage={stage} />
              ))}
            {stage === 'my-strategy' &&
              (myStrategyData ? (
                <MyStrategyCanvas data={myStrategyData} />
              ) : (
                <StageStub stage={stage} />
              ))}
            {stage === 'sessions' && <SessionsCanvas data={data} />}
          </main>

          <SentinelChat
            scopeLabel={`${data.tenantName} · this page`}
            opener={data.sentinelOpener}
            conversation={data.conversation}
          />
        </div>
      )}
    </div>
  );
}

function Hero({ data }: { data: typeof FIRST_CAPITAL_DEMO }) {
  return (
    <header
      style={{
        background: COLORS.surface2,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: `${SPACING.lg}px ${SPACING.xl}px`,
        marginBottom: SPACING.lg,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: SPACING.xs,
        }}
      >
        Intelligence · {data.tenantName}
      </div>
      <h1
        style={{
          fontFamily: FONT.body,
          fontSize: 26,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.xs,
        }}
      >
        What we&apos;re seeing across {data.tenantName.split(' ').slice(0, 2).join(' ')}.
      </h1>
      <p
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.muted,
          margin: 0,
        }}
      >
        {data.stats.patterns} patterns · {data.stats.contradictions} contradictions ·{' '}
        {data.stats.syntheses} synthesis ready · {data.refreshedLabel}
      </p>
    </header>
  );
}

function StageStub({ stage }: { stage: StageKey }) {
  return (
    <section
      data-testid={`stage-stub-${stage}`}
      style={{
        border: `1px dashed ${COLORS.border}`,
        background: COLORS.card,
        borderRadius: 8,
        padding: SPACING.xxl,
        textAlign: 'center',
        color: COLORS.muted,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: SPACING.sm,
        }}
      >
        Stage · {stage}
      </div>
      <div style={{ fontFamily: FONT.body, fontSize: 14, color: COLORS.body }}>
        Content for this stage ships in a follow-up wave. The Today
        stage has the v3 IA fully wired.
      </div>
    </section>
  );
}
