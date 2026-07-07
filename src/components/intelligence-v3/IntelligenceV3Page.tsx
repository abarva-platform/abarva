"use client";

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

import { useEffect, useState } from "react";
import Link from "next/link";
import { COLORS, FONT, SPACING } from "@/lib/design/abarva-theme";
import { IntelligenceV3TopNav } from "./IntelligenceV3TopNav";
import { IntelligenceV3StageTabs } from "./IntelligenceV3StageTabs";
import { IntelligenceBriefDownload } from "./IntelligenceBriefDownload";
import { TodayCxoCanvas } from "./TodayCxoCanvas";
import { ByFunctionCxoCanvas } from "./ByFunctionCxoCanvas";
import { PatternsCxoCanvas } from "./PatternsCxoCanvas";
import { VendorsCxoCanvas } from "./VendorsCxoCanvas";
import { PeerActivityCxoCanvas } from "./PeerActivityCxoCanvas";
import { MyStrategyCxoCanvas } from "./MyStrategyCxoCanvas";
import { SessionsCxoCanvas } from "./SessionsCxoCanvas";
import { SentinelChat } from "./SentinelChat";
import { ArtOfPossibleCanvas } from "./ArtOfPossibleCanvas";
import { EnterpriseContextCanvas } from "./EnterpriseContextCanvas";
import { IntelligenceMap } from "@/components/intelligence-v4/IntelligenceMap";
import { IntelligenceBrief } from "@/components/intelligence-v4/IntelligenceBrief";
import { CorpusNotSeededState } from "@/components/intelligence-v4/CorpusNotSeededState";
import {
  EMPTY_AOP_DEMO,
  FIRST_CAPITAL_AOP_DEMO,
  FIRST_CAPITAL_DEMO,
  MERIDIAN_AOP_DEMO,
  APEX_RETAIL_AOP_DEMO,
} from "./demo-data";
import { buildSentinelIntelContext } from "@/lib/intelligence-v3/sentinel-intel-context";
import type { EnterpriseContextOverview } from "@/lib/enterprise-context/intelligence-read-model";
import {
  APEX_RETAIL_BY_FN_OUTCOMES,
  APEX_RETAIL_BY_FN_ROWS,
  APEX_RETAIL_PEER_ROWS,
  APEX_RETAIL_SESSIONS,
  APEX_RETAIL_STRATEGY_BULLETS,
  APEX_RETAIL_VENDOR_SPEND,
  BY_FN_OUTCOMES,
} from "./cxo-fixtures";
import type {
  IntelligenceV3PageData,
  RetailIntelligenceStatus,
  StageKey,
} from "./types";
import type { ApexRetailIntelligenceData } from "@/lib/intelligence-v3/apex-retail-live";
import type { IntelligenceCorpusData } from "@/lib/intelligence-v3/corpus-types";
import type {
  ByFunctionData,
  PeerActivityData,
  MyStrategyData,
} from "@/lib/intelligence-v3/stages-display";
import type {
  VendorsData,
  VendorRollup,
} from "@/lib/intelligence-v3/vendors-display";
import type {
  ByFnRow,
  PatternRow,
  PeerRow,
  StrategyBullet,
  VendorSpendRow,
} from "./cxo-fixtures";

interface Props {
  /** Server-side composed page data. Defaults to the demo fixture. */
  data?: IntelligenceV3PageData;
  /** True when `data` reflects real DB substrate; false for fallback. */
  isLiveBound?: boolean;
  vendorsData?: VendorsData | null;
  byFunctionData?: ByFunctionData | null;
  peerActivityData?: PeerActivityData | null;
  myStrategyData?: MyStrategyData | null;
  initiatives?: readonly unknown[];
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
  vendorsData = null,
  byFunctionData = null,
  peerActivityData = null,
  myStrategyData = null,
}: Props = {}) {
  const data = dataProp ?? FIRST_CAPITAL_DEMO;
  // PR-K2 · default landing is The Brief — it's the canonical
  // corpus-grounded synthesis surface. Other stages remain reachable
  // via the tab strip. URL hash (e.g. /intelligence#map) drives the
  // active stage so deep links from /intelligence/map redirect → hash
  // work without per-route page components.
  const [stage, setStage] = useState<StageKey>("brief");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const h = window.location.hash.replace("#", "");
      if (
        h === "map" ||
        h === "brief" ||
        h === "art-of-possible" ||
        h === "enterprise-context" ||
        h === "today" ||
        h === "by-function" ||
        h === "patterns" ||
        h === "vendors" ||
        h === "peer-activity" ||
        h === "my-strategy" ||
        h === "sessions"
      ) {
        setStage(h as StageKey);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const handleStageChange = (next: StageKey) => {
    setStage(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = next === "brief" ? "" : next;
      window.history.replaceState(null, "", url.toString());
    }
  };
  const isCorpusStage = stage === "brief" || stage === "map";
  const isAopStage = stage === "art-of-possible";
  const corpusData = intelligenceCorpusData ?? apexRetailData;
  const normalizedClientKey = (clientKey ?? "").toLowerCase();
  const normalizedTenantName = data.tenantName.toLowerCase();
  const isApexClient =
    normalizedClientKey === "apexretail" ||
    normalizedClientKey === "apex-retail" ||
    normalizedTenantName.includes("apex retail");
  const isApexBound =
    Boolean(apexRetailData) || (isApexClient && Boolean(corpusData?.status));
  const hasBoundCorpus = Boolean(corpusData?.briefData && corpusData?.mapData);
  const isFirstCapitalBound =
    normalizedClientKey === "arcturus" ||
    normalizedClientKey === "firstcapital" ||
    normalizedTenantName.includes("first capital");
  const isMeridianClient =
    normalizedClientKey === "meridian" ||
    normalizedClientKey === "meridian-health" ||
    normalizedTenantName.includes("meridian health");
  const shouldUseEmptyNonCorpusFixtures =
    !isApexBound && !isFirstCapitalBound && !isMeridianClient;
  const hasEnterpriseContext =
    Boolean(enterpriseContextOverview) &&
    ((enterpriseContextOverview?.counts.records ?? 0) > 0 ||
      (enterpriseContextOverview?.counts.facts ?? 0) > 0 ||
      (enterpriseContextOverview?.counts.evidence ?? 0) > 0);
  const isNonCorpusSubstrateBound = isLiveBound || hasEnterpriseContext;
  const shouldUseLiveSubstrateForSkyline =
    isLiveBound && !isApexBound && !isFirstCapitalBound && !isMeridianClient;
  const byFunctionRows = buildByFunctionRows(byFunctionData);
  const byFunctionOutcomes = isApexBound
    ? APEX_RETAIL_BY_FN_OUTCOMES
    : BY_FN_OUTCOMES;
  const mappedPatterns = mapCorpusPatterns(intelligenceCorpusData?.patterns);
  const mappedVendors = mapVendorsData(vendorsData);
  const mappedPeerRows = mapPeerRows(peerActivityData);
  const mappedStrategyBullets = mapStrategyBullets(myStrategyData);
  const aopBands = isApexBound
    ? APEX_RETAIL_AOP_DEMO
    : isFirstCapitalBound
      ? FIRST_CAPITAL_AOP_DEMO
      : isMeridianClient
        ? (data.aopBands ?? MERIDIAN_AOP_DEMO)
        : (data.aopBands ?? EMPTY_AOP_DEMO);
  // Corpus surfaces (Brief / Map) render only when a tenant-specific
  // corpus payload is explicitly supplied by the server resolver. When
  // absent, we keep the honest not-seeded state instead of inventing
  // ranked bets or value figures.
  const briefData = corpusData?.briefData ?? null;
  const mapData = corpusData?.mapData ?? null;
  const activeTenantName = isApexBound
    ? "Apex Retail Group"
    : isFirstCapitalBound
      ? "First Capital Financial"
      : data.tenantName;
  const sentinelOpener = isApexBound
    ? `Apex Retail intelligence is ready: ${corpusData?.status?.patterns} retail patterns, ${corpusData?.status?.summarizedSources}/${corpusData?.status?.sources} summarized sources, ${corpusData?.status?.useCases} use cases, and ${corpusData?.status?.contradictions} open tensions. Ask me which CXO decision matters first.`
    : hasBoundCorpus
      ? `${activeTenantName}'s Intelligence corpus is ready: ${briefData?.bets.length ?? 0} ranked bets, ${mapData?.totalUseCases ?? 0} mapped use cases, and ${briefData?.patternsTriggered.length ?? 0} triggered patterns. Ask me which CXO decision matters first.`
      : hasEnterpriseContext
        ? `${activeTenantName}'s Enterprise Context is loaded: ${enterpriseContextOverview?.counts.records ?? 0} records, ${enterpriseContextOverview?.counts.facts ?? 0} facts, and ${enterpriseContextOverview?.counts.evidence ?? 0} evidence rows. Ask me about the current state, vendors, systems, owners, risks, or gaps visible on this page.`
        : data.sentinelOpener;
  const enterpriseVendorSpend = mapEnterpriseContextVendors(
    enterpriseContextOverview,
  );
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
        minHeight: "100vh",
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
            textAlign: "center",
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACING.lg,
          flexWrap: "wrap",
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: `${SPACING.sm}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
          position: "sticky",
          top: 56,
          zIndex: 199,
        }}
      >
        <IntelligenceV3StageTabs active={stage} onChange={handleStageChange} />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
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
              textDecoration: "none",
              whiteSpace: "nowrap",
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

      {isApexBound && corpusData?.status && (
        <ApexReadinessStrip status={corpusData.status} />
      )}

      {isCorpusStage ? (
        // PR-K2 corpus surfaces · render full-width (Brief/Map carry
        // their own masthead + right rail; embedding inside the v3
        // grid would squeeze them). Sentinel chat is integrated into
        // each component's left-rail design (post-AgentDock migration).
        //
        // No-fabrication rule: Brief/Map only render when the server
        // supplies tenant-specific `briefData` / `mapData`. Otherwise
        // the honest "not yet seeded" state renders.
        stage === "brief" ? (
          briefData ? (
            <IntelligenceBrief
              data={briefData}
              activeClient={activeTenantName}
              surfaceContext={surfaceContext}
            />
          ) : (
            <CorpusNotSeededState stage="brief" tenantName={activeTenantName} />
          )
        ) : mapData ? (
          <IntelligenceMap
            data={mapData}
            activeClient={activeTenantName}
            surfaceContext={surfaceContext}
          />
        ) : (
          <CorpusNotSeededState stage="map" tenantName={activeTenantName} />
        )
      ) : (
        // Non-corpus stages render through SentinelChat's <AgentDock>
        // layout · chat LEFT, workspace RIGHT, resizable splitter,
        // mode-pickable. Workspace is the existing canvas content.
        // The wrapper height = viewport - top nav (56) - stage strip
        // (~56), so the splitter has a finite box to fill.
        <div style={{ height: "calc(100vh - 112px)", minHeight: 0 }}>
          <SentinelChat
            scopeLabel={`${activeTenantName} · this page`}
            opener={sentinelOpener}
            conversation={data.conversation}
            surfaceContext={surfaceContext}
            workspace={
              <main
                style={{
                  padding: `${SPACING.lg}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
                  width: "100%",
                  boxSizing: "border-box",
                  paddingBottom: SPACING.xxxl + 56,
                  overflowY: "auto",
                }}
              >
                {isAopStage && <ArtOfPossibleCanvas data={aopBands} />}
                {stage === "enterprise-context" && (
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
                {stage === "today" && (
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
                {stage === "by-function" && (
                  <ByFunctionCxoCanvas
                    rows={
                      isApexBound
                        ? APEX_RETAIL_BY_FN_ROWS
                        : isMeridianClient
                          ? undefined
                          : shouldUseLiveSubstrateForSkyline
                            ? byFunctionRows
                            : []
                    }
                    outcomes={
                      isApexBound
                        ? APEX_RETAIL_BY_FN_OUTCOMES
                        : isMeridianClient
                          ? undefined
                          : shouldUseLiveSubstrateForSkyline
                            ? byFunctionOutcomes
                            : []
                    }
                  />
                )}
                {stage === "patterns" && (
                  <PatternsCxoCanvas
                    patterns={
                      isApexBound
                        ? apexRetailData?.patterns
                        : isFirstCapitalBound
                          ? []
                          : isMeridianClient
                            ? undefined
                            : shouldUseLiveSubstrateForSkyline
                              ? mappedPatterns
                              : []
                    }
                  />
                )}
                {stage === "vendors" && (
                  <VendorsCxoCanvas
                    spend={
                      isApexBound
                        ? APEX_RETAIL_VENDOR_SPEND
                        : isMeridianClient
                          ? undefined
                          : enterpriseVendorSpend.length > 0
                            ? enterpriseVendorSpend
                            : shouldUseLiveSubstrateForSkyline
                              ? mappedVendors
                              : []
                    }
                  />
                )}
                {stage === "peer-activity" && (
                  <PeerActivityCxoCanvas
                    rows={
                      isApexBound
                        ? APEX_RETAIL_PEER_ROWS
                        : isMeridianClient
                          ? undefined
                          : shouldUseLiveSubstrateForSkyline
                            ? mappedPeerRows
                            : []
                    }
                    lead={
                      isApexBound
                        ? "Adoption read across retail cohorts: specialty, big-box, grocery, luxury, and marketplace-first peers. The laggard signal is strongest where customer identity and item-location history are weak."
                        : isFirstCapitalBound
                          ? `${activeTenantName} substrate not yet bound · peer cohort view will surface once initiatives are loaded.`
                          : shouldUseLiveSubstrateForSkyline
                            ? undefined
                            : undefined
                    }
                  />
                )}
                {stage === "my-strategy" && (
                  <MyStrategyCxoCanvas
                    bullets={
                      isApexBound
                        ? APEX_RETAIL_STRATEGY_BULLETS
                        : isMeridianClient
                          ? undefined
                          : shouldUseLiveSubstrateForSkyline
                            ? mappedStrategyBullets
                            : []
                    }
                  />
                )}
                {stage === "sessions" && (
                  <SessionsCxoCanvas
                    rows={
                      isApexBound
                        ? APEX_RETAIL_SESSIONS
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? []
                          : undefined
                    }
                    totalConversations={
                      isApexBound
                        ? 18
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? 0
                          : undefined
                    }
                    recentWindowCount={
                      isApexBound
                        ? 6
                        : isFirstCapitalBound || shouldUseEmptyNonCorpusFixtures
                          ? 0
                          : undefined
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
    { label: "Apex intelligence", value: "Live" },
    { label: "Retail patterns", value: status.patterns.toString() },
    {
      label: "Sources summarized",
      value: `${status.summarizedSources}/${status.sources}`,
    },
    { label: "Use cases", value: status.useCases.toString() },
    { label: "Open tensions", value: status.contradictions.toString() },
  ];

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACING.lg,
        overflowX: "auto",
        background: COLORS.surface2,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: `${SPACING.sm}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: SPACING.xs,
            flex: "0 0 auto",
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: COLORS.muted,
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.ink,
              whiteSpace: "nowrap",
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildByFunctionRows(
  byFunctionData: ByFunctionData | null,
  forceMeridianOutcomes = false,
): ReadonlyArray<ByFnRow> {
  if (!byFunctionData || forceMeridianOutcomes) return [];

  if (byFunctionData.functions.length === 0) return [];

  return byFunctionData.functions.map((rollup) => {
    const initiativeRefs = rollup.initiatives.map(
      (initiative) => initiative.displayId,
    );
    const healthyRef = rollup.initiatives.find(
      (initiative) => initiative.statusFlag === "healthy",
    )?.displayId;
    const alignedRef = rollup.initiatives.find(
      (initiative) => initiative.alignedCallout,
    )?.displayId;
    const riskRef = rollup.initiatives.find((initiative) =>
      ["stalled", "cost_overrun", "duplication_risk", "value_lag"].includes(
        initiative.statusFlag,
      ),
    )?.displayId;

    const fallbackRef = initiativeRefs.at(0);

    return {
      function: rollup.function,
      cells: [
        {
          state: healthyRef
            ? "in-flight"
            : rollup.counts.healthy > 0
              ? "in-flight"
              : "empty",
          ref: healthyRef,
        },
        {
          state: alignedRef
            ? "candidate"
            : rollup.counts.aligned > 0
              ? "candidate"
              : "empty",
          ref: alignedRef,
        },
        {
          state: riskRef ? "risk" : rollup.counts.atRisk > 0 ? "risk" : "empty",
          ref: riskRef,
        },
        { state: fallbackRef ? "candidate" : "empty", ref: fallbackRef },
      ],
    };
  });
}

function mapCorpusPatterns(
  patterns: PatternRow[] | undefined,
): ReadonlyArray<PatternRow> {
  return patterns ?? [];
}

function mapVendorsData(
  vendorsData: VendorsData | null,
): ReadonlyArray<VendorSpendRow> {
  if (!vendorsData || vendorsData.vendors.length === 0) return [];

  return vendorsData.vendors
    .map((vendor) => mapVendorRow(vendor))
    .sort(
      (a, b) => b.spendUsdM - a.spendUsdM || a.vendor.localeCompare(b.vendor),
    );
}

function mapVendorRow(vendor: VendorRollup): VendorSpendRow {
  const spendUsdM = +(vendor.totalContractValueUsd ?? 0) / 1_000_000;
  const health = mapVendorHealth(vendor.worstFinancialHealth);
  const spendLabel =
    vendor.totalContractValueUsd === null
      ? "Not sized"
      : `$${spendUsdM.toFixed(1)}M`;
  const renewsInMonths = monthsUntilDate(vendor.earliestRenewal);
  const vendorName = vendor.vendorName;
  const topInitiative = vendor.initiatives[0];
  const initiativeCount = vendor.totalInitiatives;
  const renewalCount = vendor.earliestRenewal
    ? `renewal ${vendor.earliestRenewal}`
    : "renewal window not set";

  return {
    vendor: vendorName,
    category: inferVendorCategory(
      vendorName,
      topInitiative?.initiativeStatusFlag,
    ),
    subcategory: `${topInitiative?.initiativeStatusFlag ?? "Operational"} · ${initiativeCount} initiative${initiativeCount === 1 ? "" : "s"}`,
    spendUsdM: Number.parseFloat(spendUsdM.toFixed(2)),
    spendLabel,
    tier:
      vendor.totalInitiatives > 4
        ? "incumbent"
        : initiativeCount > 1
          ? "challenger"
          : "emerging",
    health,
    renewsInMonths,
    takeaway: `${initiativeCount} tied initiative${initiativeCount === 1 ? "" : "s"} · ${renewalCount}.`,
  };
}

function inferVendorCategory(
  vendorName: string,
  statusFlag: string | null,
): VendorSpendRow["category"] {
  const normalizedVendorName = vendorName.toLowerCase();
  const normalizedStatus = statusFlag?.toLowerCase() ?? "";

  if (
    /(aws|azure|gcp|oracle|dell|hp|cisco|hpe|vmware|datacenter|storage|server|network)/.test(
      normalizedVendorName,
    )
  ) {
    return "hardware-cloud";
  }

  if (
    /(accenture|deloitte|consult|partner|services|slalom|bain|advis|si|consulting)/.test(
      normalizedVendorName,
    ) ||
    /(stalled|value_lag|duplication_risk|cost_overrun)/.test(normalizedStatus)
  ) {
    return "services-si";
  }

  return "software-saas";
}

function mapVendorHealth(
  health: VendorRollup["worstFinancialHealth"],
): VendorSpendRow["health"] {
  if (health === "at_risk" || health === "watch") {
    return health === "at_risk" ? "risk" : "watch";
  }
  return "healthy";
}

function monthsUntilDate(dateString: string | null): number | null {
  if (!dateString) return null;
  const renewalDate = Date.parse(dateString);
  if (Number.isNaN(renewalDate)) return null;
  const now = Date.now();
  const msInMonth = 1000 * 60 * 60 * 24 * 30.4375;
  if (renewalDate < now) return 0;
  return Math.round((renewalDate - now) / msInMonth);
}

function mapPeerRows(
  peerActivityData: PeerActivityData | null,
): ReadonlyArray<PeerRow> {
  if (!peerActivityData || peerActivityData.signals.length === 0) return [];

  return peerActivityData.signals.map((signal) => {
    const base =
      signal.peerMedian === 0
        ? 0
        : (signal.tenantValue / signal.peerMedian) * 100;
    const adoptionPct = Number.isFinite(base)
      ? clamp(Math.round(base), 0, 100)
      : 50;
    const ref = signal.initiativeDisplayId
      ? ` ${signal.initiativeDisplayId}`
      : "";

    return {
      cohort: `${signal.quarter} · ${signal.kpiName}${ref}`,
      size: Math.min(
        24,
        Math.max(1, Math.round(Math.abs(signal.deltaPctVsPeer) + 1)),
      ),
      outcome:
        signal.deltaPctVsPeer > 0
          ? "Stronger than peer"
          : signal.deltaPctVsPeer < 0
            ? "Weak vs peer"
            : "On par with peer",
      adoptionPct,
      delta:
        signal.deltaPctVsPeer > 0
          ? `+${Math.round(signal.deltaPctVsPeer)}% vs peer`
          : `${Math.round(signal.deltaPctVsPeer)}% vs peer`,
    };
  });
}

function mapStrategyBullets(
  strategy: MyStrategyData | null,
): ReadonlyArray<StrategyBullet> {
  if (!strategy || strategy.themes.length === 0) return [];

  return strategy.themes.map((theme, index) => {
    const committed =
      theme.committedAnnualUsd >= 1_000_000
        ? `${(theme.committedAnnualUsd / 1_000_000).toFixed(1)}M`
        : "$0";
    const riskCount = theme.atRiskCount;

    return {
      number: String(index + 1).padStart(2, "0"),
      title: theme.goalName,
      body: `${theme.strategicContext} ${
        theme.initiativeCount > 0
          ? `The goal has ${theme.initiativeCount} initiative${theme.initiativeCount === 1 ? "" : "s"} tied to ${theme.measuredValueUsd > 0 ? "measured" : "estimated"} value.`
          : ""
      }`,
      evidence: `${theme.goalId} · $${committed} committed · ${riskCount > 0 ? `${riskCount} at-risk signal` : "no major risk signal"}`,
      betLink: theme.initiatives[0]
        ? {
            patternId: theme.initiatives[0].initiativeId,
            patternName: theme.initiatives[0].name,
            useCaseName: theme.goalName,
          }
        : undefined,
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
