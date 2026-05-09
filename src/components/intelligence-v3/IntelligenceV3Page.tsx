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
import { FIRST_CAPITAL_DEMO, MERIDIAN_AOP_DEMO, APEX_RETAIL_AOP_DEMO } from './demo-data';
import { buildSentinelIntelContext } from '@/lib/intelligence-v3/sentinel-intel-context';
import {
  APEX_RETAIL_BY_FN_OUTCOMES,
  APEX_RETAIL_BY_FN_ROWS,
  APEX_RETAIL_PEER_ROWS,
  APEX_RETAIL_SESSIONS,
  APEX_RETAIL_STRATEGY_BULLETS,
  APEX_RETAIL_VENDOR_SPEND,
} from './cxo-fixtures';
import type { IntelligenceV3PageData, RetailIntelligenceStatus, StageKey } from './types';
import type { ApexRetailIntelligenceData } from '@/lib/intelligence-v3/apex-retail-live';

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
  apexRetailData?: ApexRetailIntelligenceData | null;
}

export function IntelligenceV3Page({
  data: dataProp,
  isLiveBound = false,
  apexRetailData = null,
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
  const isApexBound = Boolean(apexRetailData);
  const aopBands = isApexBound ? APEX_RETAIL_AOP_DEMO : data.aopBands ?? MERIDIAN_AOP_DEMO;
  const activeTenantName = isApexBound ? 'Apex Retail Group' : data.tenantName;
  const briefData = apexRetailData?.briefData ?? getMeridianBriefData();
  const mapData = apexRetailData?.mapData ?? getMeridianMapData();
  const sentinelOpener = isApexBound
    ? `Apex Retail intelligence is ready: ${apexRetailData?.status.patterns} retail patterns, ${apexRetailData?.status.summarizedSources}/${apexRetailData?.status.sources} summarized sources, ${apexRetailData?.status.useCases} use cases, and ${apexRetailData?.status.contradictions} open tensions. Ask me which CXO decision matters first.`
    : data.sentinelOpener;
  const surfaceContext = buildSentinelIntelContext({
    activeClient: activeTenantName,
    stage,
    isApexBound,
    status: apexRetailData?.status ?? null,
    patterns: apexRetailData?.patterns ?? [],
    todayItems: apexRetailData?.todayItems ?? [],
    aopBands,
    briefData,
    mapData,
  });

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
      <IntelligenceV3TopNav tenantName={activeTenantName} />

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

      {/* Stage tabs strip · sticky below the V3 top nav so it stays
          visible AND the Sentinel chat rail can compute its own
          sticky offset against a known stack. */}
      <div
        style={{
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: `${SPACING.sm}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
          position: 'sticky',
          top: 56,
          zIndex: 199,
        }}
      >
        <IntelligenceV3StageTabs active={stage} onChange={handleStageChange} />
      </div>

      {apexRetailData && <ApexReadinessStrip status={apexRetailData.status} />}

      {isCorpusStage ? (
        // PR-K2 corpus surfaces · render full-width (Brief/Map carry
        // their own masthead + right rail; embedding inside the v3
        // grid would squeeze them). Sentinel chat is integrated into
        // each component's left-rail design (post-AgentDock migration).
        stage === 'brief'
          ? <IntelligenceBrief data={briefData} activeClient={activeTenantName} surfaceContext={surfaceContext} />
          : <IntelligenceMap data={mapData} activeClient={activeTenantName} surfaceContext={surfaceContext} />
      ) : (
        // Non-corpus stages render through SentinelChat's <AgentDock>
        // layout · chat LEFT, workspace RIGHT, resizable splitter,
        // mode-pickable. Workspace is the existing canvas content.
        // The wrapper height = viewport - top nav (56) - stage strip
        // (~56), so the splitter has a finite box to fill.
        <div style={{ height: 'calc(100vh - 112px)', minHeight: 0 }}>
          <SentinelChat
            scopeLabel={`${activeTenantName} · this page`}
            opener={sentinelOpener}
            conversation={data.conversation}
            surfaceContext={surfaceContext}
            workspace={
              <main
                style={{
                  padding: `${SPACING.lg}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingBottom: SPACING.xxxl + 56,
                  overflowY: 'auto',
                }}
              >
                {isAopStage && <ArtOfPossibleCanvas data={aopBands} />}
                {stage === 'today' && <TodayCxoCanvas items={apexRetailData?.todayItems} />}
                {stage === 'by-function' && (
                  <ByFunctionCxoCanvas
                    rows={isApexBound ? APEX_RETAIL_BY_FN_ROWS : undefined}
                    outcomes={isApexBound ? APEX_RETAIL_BY_FN_OUTCOMES : undefined}
                  />
                )}
                {stage === 'patterns' && <PatternsCxoCanvas patterns={apexRetailData?.patterns} />}
                {stage === 'vendors' && <VendorsCxoCanvas spend={isApexBound ? APEX_RETAIL_VENDOR_SPEND : undefined} />}
                {stage === 'peer-activity' && (
                  <PeerActivityCxoCanvas
                    rows={isApexBound ? APEX_RETAIL_PEER_ROWS : undefined}
                    lead={
                      isApexBound
                        ? 'Adoption read across retail cohorts: specialty, big-box, grocery, luxury, and marketplace-first peers. The laggard signal is strongest where customer identity and item-location history are weak.'
                        : undefined
                    }
                  />
                )}
                {stage === 'my-strategy' && <MyStrategyCxoCanvas bullets={isApexBound ? APEX_RETAIL_STRATEGY_BULLETS : undefined} />}
                {stage === 'sessions' && (
                  <SessionsCxoCanvas
                    rows={isApexBound ? APEX_RETAIL_SESSIONS : undefined}
                    totalConversations={isApexBound ? 18 : undefined}
                    recentWindowCount={isApexBound ? 6 : undefined}
                  />
                )}
              </main>
            }
          />
        </div>
      )}
    </div>
  );
}

function ApexReadinessStrip({ status }: { status: RetailIntelligenceStatus }) {
  const items = [
    { label: 'Apex intelligence', value: 'Live' },
    { label: 'Retail patterns', value: status.patterns.toString() },
    { label: 'Sources summarized', value: `${status.summarizedSources}/${status.sources}` },
    { label: 'Use cases', value: status.useCases.toString() },
    { label: 'Open tensions', value: status.contradictions.toString() },
  ];

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        overflowX: 'auto',
        background: COLORS.surface2,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: `${SPACING.sm}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: SPACING.xs,
            flex: '0 0 auto',
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 13, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap' }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
