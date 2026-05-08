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
import { TodayCxoCanvas } from './TodayCxoCanvas';
import { ByFunctionCxoCanvas } from './ByFunctionCxoCanvas';
import { PatternsCxoCanvas } from './PatternsCxoCanvas';
import { VendorsCxoCanvas } from './VendorsCxoCanvas';
import { PeerActivityCxoCanvas } from './PeerActivityCxoCanvas';
import { MyStrategyCxoCanvas } from './MyStrategyCxoCanvas';
import { SessionsCxoCanvas } from './SessionsCxoCanvas';
import { SentinelChat } from './SentinelChat';
import { ArtOfPossibleCanvas } from './ArtOfPossibleCanvas';
import { IntelligenceMap } from '@/components/intelligence-v4/IntelligenceMap';
import { IntelligenceBrief } from '@/components/intelligence-v4/IntelligenceBrief';
import { getMeridianMapData, getMeridianBriefData } from '@/lib/knowledge-corpus/fixtures/meridian-healthcare';
import { FIRST_CAPITAL_DEMO, MERIDIAN_AOP_DEMO } from './demo-data';
import type { IntelligenceV3PageData, StageKey } from './types';

interface Props {
  /** Server-side composed page data. Defaults to the demo fixture. */
  data?: IntelligenceV3PageData;
  /** True when `data` reflects real DB substrate; false for fallback. */
  isLiveBound?: boolean;
  /**
   * Legacy server-loaded props (vendorsData, byFunctionData, etc.)
   * are accepted for back-compat but ignored — PR-K2.4 CXO canvases
   * use their own embedded Meridian fixtures until the live overlay
   * lands in PR-K3+.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vendorsData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  byFunctionData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  peerActivityData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myStrategyData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initiatives?: any;
}

export function IntelligenceV3Page({
  data: dataProp,
  isLiveBound = false,
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
            {isAopStage && <ArtOfPossibleCanvas data={aopBands} />}
            {stage === 'today' && <TodayCxoCanvas />}
            {stage === 'by-function' && <ByFunctionCxoCanvas />}
            {stage === 'patterns' && <PatternsCxoCanvas />}
            {stage === 'vendors' && <VendorsCxoCanvas />}
            {stage === 'peer-activity' && <PeerActivityCxoCanvas />}
            {stage === 'my-strategy' && <MyStrategyCxoCanvas />}
            {stage === 'sessions' && <SessionsCxoCanvas />}
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

