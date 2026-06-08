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
import Link from 'next/link';
import { COLORS, FONT, SPACING } from '@/lib/design/abarva-theme';
import { IntelligenceV3TopNav } from './IntelligenceV3TopNav';
import { IntelligenceV3StageTabs } from './IntelligenceV3StageTabs';
import { IntelligenceBriefDownload } from './IntelligenceBriefDownload';
import { TodayCxoCanvas } from './TodayCxoCanvas';
import { ByFunctionCxoCanvas } from './ByFunctionCxoCanvas';
import { PatternsCxoCanvas } from './PatternsCxoCanvas';
import { VendorsCxoCanvas } from './VendorsCxoCanvas';
import { PeerActivityCxoCanvas } from './PeerActivityCxoCanvas';
import { MyStrategyCxoCanvas } from './MyStrategyCxoCanvas';
import { SessionsCxoCanvas } from './SessionsCxoCanvas';
import { SentinelChat } from './SentinelChat';
import { ArtOfPossibleCanvas } from './ArtOfPossibleCanvas';
import { EnterpriseContextCanvas } from './EnterpriseContextCanvas';
import { IntelligenceMap } from '@/components/intelligence-v4/IntelligenceMap';
import { IntelligenceBrief } from '@/components/intelligence-v4/IntelligenceBrief';
import { CorpusNotSeededState } from '@/components/intelligence-v4/CorpusNotSeededState';
import {
  EMPTY_AOP_DEMO,
  FIRST_CAPITAL_AOP_DEMO,
  FIRST_CAPITAL_DEMO,
  MERIDIAN_AOP_DEMO,
  APEX_RETAIL_AOP_DEMO,
} from './demo-data';
import { buildSentinelIntelContext } from '@/lib/intelligence-v3/sentinel-intel-context';
import type { EnterpriseContextOverview } from '@/lib/enterprise-context/intelligence-read-model';
import {
  APEX_RETAIL_BY_FN_OUTCOMES,
  APEX_RETAIL_BY_FN_ROWS,
  APEX_RETAIL_PEER_ROWS,
  APEX_RETAIL_SESSIONS,
  APEX_RETAIL_STRATEGY_BULLETS,
  APEX_RETAIL_VENDOR_SPEND,
  type VendorSpendRow,
} from './cxo-fixtures';
import type { IntelligenceV3PageData, RetailIntelligenceStatus, StageKey } from './types';
import type { ApexRetailIntelligenceData } from '@/lib/intelligence-v3/apex-retail-live';
import type { IntelligenceCorpusData } from '@/lib/intelligence-v3/corpus-types';

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
  intelligenceCorpusData?: IntelligenceCorpusData | null;
  /** @deprecated Use intelligenceCorpusData. Kept for older tests/callers. */
  apexRetailData?: ApexRetailIntelligenceData | null;
  clientKey?: string | null;
  enterpriseContextOverview?: EnterpriseContextOverview | null;
}

export function IntelligenceV3Page({
  data: dataProp,
  isLiveBound = false,
  intelligenceCorpusData = null,
  apexRetailData = null,
  clientKey = null,
  enterpriseContextOverview = null,
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
        h === 'enterprise-context' ||
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
  const corpusData = intelligenceCorpusData ?? apexRetailData;
  const normalizedClientKey = (clientKey ?? '').toLowerCase();
  const normalizedTenantName = data.tenantName.toLowerCase();
  const isApexClient =
    normalizedClientKey === 'apexretail' ||
    normalizedClientKey === 'apex-retail' ||
    normalizedTenantName.includes('apex retail');
  const isApexBound = Boolean(apexRetailData) || (isApexClient && Boolean(corpusData?.status));
  const hasBoundCorpus = Boolean(corpusData?.briefData && corpusData?.mapData);
  const isFirstCapitalBound =
    normalizedClientKey === 'arcturus' ||
    normalizedClientKey === 'firstcapital' ||
    normalizedTenantName.includes('first capital');
  const isMeridianClient =
    normalizedClientKey === 'meridian' ||
    normalizedClientKey === 'meridian-health' ||
    normalizedTenantName.includes('meridian health');
  const shouldUseEmptyNonCorpusFixtures =
    !isApexBound && !isFirstCapitalBound && !isMeridianClient;
  const hasEnterpriseContext =
    Boolean(enterpriseContextOverview) &&
    (
      (enterpriseContextOverview?.counts.records ?? 0) > 0 ||
      (enterpriseContextOverview?.counts.facts ?? 0) > 0 ||
      (enterpriseContextOverview?.counts.evidence ?? 0) > 0
    );
  const isNonCorpusSubstrateBound = isLiveBound || hasEnterpriseContext;
  const aopBands = isApexBound
    ? APEX_RETAIL_AOP_DEMO
    : isFirstCapitalBound
      ? FIRST_CAPITAL_AOP_DEMO
      : isMeridianClient
        ? data.aopBands ?? MERIDIAN_AOP_DEMO
        : data.aopBands ?? EMPTY_AOP_DEMO;
  // Corpus surfaces (Brief / Map) render only when a tenant-specific
  // corpus payload is explicitly supplied by the server resolver. When
  // absent, we keep the honest not-seeded state instead of inventing
  // ranked bets or value figures.
  const briefData = corpusData?.briefData ?? null;
  const mapData = corpusData?.mapData ?? null;
  const activeTenantName = isApexBound
    ? 'Apex Retail Group'
    : isFirstCapitalBound
      ? 'First Capital Financial'
      : data.tenantName;
  const sentinelOpener = isApexBound
    ? `Apex Retail intelligence is ready: ${corpusData?.status?.patterns} retail patterns, ${corpusData?.status?.summarizedSources}/${corpusData?.status?.sources} summarized sources, ${corpusData?.status?.useCases} use cases, and ${corpusData?.status?.contradictions} open tensions. Ask me which CXO decision matters first.`
    : hasBoundCorpus
      ? `${activeTenantName}'s Intelligence corpus is ready: ${briefData?.bets.length ?? 0} ranked bets, ${mapData?.totalUseCases ?? 0} mapped use cases, and ${briefData?.patternsTriggered.length ?? 0} triggered patterns. Ask me which CXO decision matters first.`
    : hasEnterpriseContext
      ? `${activeTenantName}'s Enterprise Context is loaded: ${enterpriseContextOverview?.counts.records ?? 0} records, ${enterpriseContextOverview?.counts.facts ?? 0} facts, and ${enterpriseContextOverview?.counts.evidence ?? 0} evidence rows. Ask me about the current state, vendors, systems, owners, risks, or gaps visible on this page.`
    : data.sentinelOpener;
  const enterpriseVendorSpend = mapEnterpriseContextVendors(enterpriseContextOverview);
  const surfaceContext = buildSentinelIntelContext({
    activeClient: activeTenantName,
    clientKey,
    stage,
    isApexBound,
    hasBoundCorpus,
    status: corpusData?.status ?? null,
    patterns: corpusData?.patterns ?? [],
    todayItems: corpusData?.todayItems ?? [],
    aopBands,
    briefData,
    mapData,
    enterpriseContext: enterpriseContextOverview,
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

      {!isNonCorpusSubstrateBound && !isCorpusStage && (
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.lg,
          flexWrap: 'wrap',
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: `${SPACING.sm}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
          position: 'sticky',
          top: 56,
          zIndex: 199,
        }}
      >
        <IntelligenceV3StageTabs active={stage} onChange={handleStageChange} />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.md,
          }}
        >
          {/* Audit 2026-05-22: the bet-selection facet at
              /intelligence/decision ("which bet first") was built and
              tested but had no inbound nav link — unreachable. Wire it
              into the Intelligence stage strip as a first-class
              destination so users can reach it. */}
          <Link
            href="/intelligence/decision"
            prefetch={false}
            data-testid="intelligence-decision-link"
            style={{
              fontFamily: FONT.body,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.surface,
              background: COLORS.navy,
              border: `1px solid ${COLORS.navy}`,
              borderRadius: 6,
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Which bet first →
          </Link>
          {/* G9: every Intelligence surface produces a downloadable CXO
              brief. Present for all 3 tenants — for Meridian / First
              Capital the brief is honestly partly-sparse (no seeded
              corpus), which is correct, not a bug. */}
          <IntelligenceBriefDownload clientKey={clientKey} />
        </div>
      </div>

      {isApexBound && corpusData?.status && <ApexReadinessStrip status={corpusData.status} />}

      {isCorpusStage ? (
        // PR-K2 corpus surfaces · render full-width (Brief/Map carry
        // their own masthead + right rail; embedding inside the v3
        // grid would squeeze them). Sentinel chat is integrated into
        // each component's left-rail design (post-AgentDock migration).
        //
        // No-fabrication rule: Brief/Map only render when the server
        // supplies tenant-specific `briefData` / `mapData`. Otherwise
        // the honest "not yet seeded" state renders.
        stage === 'brief'
          ? briefData
            ? <IntelligenceBrief data={briefData} activeClient={activeTenantName} surfaceContext={surfaceContext} />
            : <CorpusNotSeededState stage="brief" tenantName={activeTenantName} />
          : mapData
            ? <IntelligenceMap data={mapData} activeClient={activeTenantName} surfaceContext={surfaceContext} />
            : <CorpusNotSeededState stage="map" tenantName={activeTenantName} />
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
                {stage === 'enterprise-context' && (
                  <EnterpriseContextCanvas
                    overview={enterpriseContextOverview}
                    tenantName={activeTenantName}
                  />
                )}
                {/*
                  L2-L8 / SkyHarbor fix: each V3 canvas previously had
                  `= MERIDIAN_*` as its default prop value and the page only
                  overrode it when `isApexBound`. Result: First Capital and
                  later SkyHarbor silently rendered Meridian fixtures
                  (Vendors stage showed Epic / Innovaccer / Abridge / Cohere
                  on non-healthcare tenants). Until tenant-specific fixtures
                  are shipped, pass `[]` / `0` so the canvases render their
                  empty state rather than another tenant's content. Meridian
                  still falls through to the Meridian default (`undefined` →
                  `MERIDIAN_*` inside the canvas), so Meridian's surface is
                  unchanged.
                */}
                {stage === 'today' && (
                  <TodayCxoCanvas
                    items={
                      isApexBound
                        ? apexRetailData?.todayItems
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                  />
                )}
                {stage === 'by-function' && (
                  <ByFunctionCxoCanvas
                    rows={
                      isApexBound
                        ? APEX_RETAIL_BY_FN_ROWS
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                    outcomes={
                      isApexBound
                        ? APEX_RETAIL_BY_FN_OUTCOMES
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                  />
                )}
                {stage === 'patterns' && (
                  <PatternsCxoCanvas
                    patterns={
                      isApexBound
                        ? apexRetailData?.patterns
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                  />
                )}
                {stage === 'vendors' && (
                  <VendorsCxoCanvas
                    spend={
                      isApexBound
                        ? APEX_RETAIL_VENDOR_SPEND
                        : enterpriseVendorSpend.length > 0
                          ? enterpriseVendorSpend
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                  />
                )}
                {stage === 'peer-activity' && (
                  <PeerActivityCxoCanvas
                    rows={
                      isApexBound
                        ? APEX_RETAIL_PEER_ROWS
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                    lead={
                      isApexBound
                        ? 'Adoption read across retail cohorts: specialty, big-box, grocery, luxury, and marketplace-first peers. The laggard signal is strongest where customer identity and item-location history are weak.'
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? `${activeTenantName} substrate not yet bound · peer cohort view will surface once initiatives are loaded.`
                          : undefined
                    }
                  />
                )}
                {stage === 'my-strategy' && (
                  <MyStrategyCxoCanvas
                    bullets={
                      isApexBound
                        ? APEX_RETAIL_STRATEGY_BULLETS
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                  />
                )}
                {stage === 'sessions' && (
                  <SessionsCxoCanvas
                    rows={
                      isApexBound
                        ? APEX_RETAIL_SESSIONS
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                    totalConversations={
                      isApexBound ? 18 : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures ? 0 : undefined
                    }
                    recentWindowCount={
                      isApexBound ? 6 : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures ? 0 : undefined
                    }
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

function mapEnterpriseContextVendors(
  overview: EnterpriseContextOverview | null | undefined,
): ReadonlyArray<VendorSpendRow> {
  return (overview?.vendorSpendRows ?? []).map((row) => ({
    vendor: row.vendor,
    category: row.category,
    subcategory: row.subcategory,
    spendUsdM: row.spendUsdM,
    spendLabel: row.spendLabel,
    tier: row.tier,
    health: row.health,
    renewsInMonths: row.renewsInMonths,
    takeaway: row.takeaway,
  }));
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
