"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  HOME_LANDSCAPE_TABS,
  SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2,
  type ContextSignal,
  type EconomicRow,
  type HomeEnterpriseLandscapeV2Model,
  type HomeLandscapeTabId,
  type MetricAnchor,
  type SignalTone,
} from "./homeEnterpriseLandscapeV2Model";
import styles from "./HomeEnterpriseLandscapeV2.module.css";

const TAB_IDS = new Set<HomeLandscapeTabId>(
  HOME_LANDSCAPE_TABS.map((tab) => tab.id),
);

const LEGACY_TAB_REDIRECTS: Record<string, HomeLandscapeTabId> = {
  context: "patterns",
  architecture: "coherence",
};

const TONE_CLASS: Record<SignalTone, string> = {
  blue: styles.barBlue,
  teal: styles.barTeal,
  amber: styles.barAmber,
  slate: styles.barSlate,
  red: styles.barRed,
};

const TONE_HEX: Record<SignalTone, string> = {
  blue: "#246fc8",
  teal: "#198f82",
  amber: "#b97824",
  slate: "#66758a",
  red: "#b63b35",
};

function normalizeTabId(value: string | null): HomeLandscapeTabId | null {
  if (!value) return null;
  if (TAB_IDS.has(value as HomeLandscapeTabId))
    return value as HomeLandscapeTabId;
  return LEGACY_TAB_REDIRECTS[value] ?? null;
}

function useSelectedTab(defaultTab: HomeLandscapeTabId) {
  const [selectedTab, setSelectedTabState] =
    useState<HomeLandscapeTabId>(defaultTab);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    const normalizedView = normalizeTabId(view);
    if (!normalizedView) return;

    setSelectedTabState(normalizedView);
    if (view !== normalizedView) {
      const url = new URL(window.location.href);
      if (normalizedView === "summary") {
        url.searchParams.delete("view");
      } else {
        url.searchParams.set("view", normalizedView);
      }
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }, []);

  const setSelectedTab = useCallback((tab: HomeLandscapeTabId) => {
    setSelectedTabState(tab);
    const url = new URL(window.location.href);
    if (tab === "summary") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", tab);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  return [selectedTab, setSelectedTab] as const;
}

function SparkBar({
  item,
}: {
  item: MetricAnchor | EconomicRow | ContextSignal;
}) {
  const width = Math.max(6, Math.min(88, Math.round(item.ratio * 88)));
  return (
    <svg className={styles.spark} viewBox="0 0 120 28" aria-hidden="true">
      <rect
        className={styles.track}
        x="16"
        y="9"
        width="88"
        height="10"
        rx="5"
      />
      <rect
        className={TONE_CLASS[item.tone]}
        x="16"
        y="9"
        width={width}
        height="10"
        rx="5"
      />
    </svg>
  );
}

function ContextSignalWall({
  signals,
}: {
  signals: HomeEnterpriseLandscapeV2Model["contextSignals"];
}) {
  return (
    <div className={styles.contextSignalWall}>
      {signals.map((signal) => (
        <article className={styles.contextSignal} key={signal.label}>
          <span>{signal.label}</span>
          <strong>{signal.value}</strong>
          <p>{signal.detail}</p>
          <SparkBar item={signal} />
        </article>
      ))}
    </div>
  );
}

function SvgTextBlock({
  x,
  y,
  lines,
  className,
  textAnchor = "start",
  lineHeight = 13,
}: {
  x: number;
  y: number;
  lines: string[];
  className: string;
  textAnchor?: "start" | "middle" | "end";
  lineHeight?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={textAnchor} className={className}>
      {lines.map((line, index) => (
        <tspan x={x} dy={index === 0 ? 0 : lineHeight} key={line}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function MiniArchitectureDiagram({
  title,
  subtitle,
  children,
  ariaLabel,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <article className={styles.architectureDiagramCard}>
      <div className={styles.visualTitle}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <svg
        className={styles.architectureMiniSvg}
        viewBox="0 0 560 320"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <marker
            id={`${title.replaceAll(" ", "-").toLowerCase()}-arrow`}
            markerHeight="7"
            markerWidth="7"
            orient="auto"
            refX="6"
            refY="3.5"
          >
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#8da2bd" />
          </marker>
        </defs>
        {children}
      </svg>
    </article>
  );
}

function ArchitectureFlowMap({
  model,
}: {
  model: HomeEnterpriseLandscapeV2Model;
}) {
  const layerByTitle = new Map(
    model.architectureLayers.map((layer) => [layer.title, layer]),
  );
  const sourceLayer = layerByTitle.get("Applications and core systems");
  const integrationLayer = layerByTitle.get(
    "Integration, ETL, and event movement",
  );
  const storageLayer = layerByTitle.get("Storage, EDW, and data marts");
  const consumptionLayer = layerByTitle.get(
    "Consumption and decision surfaces",
  );
  const agentLayer = layerByTitle.get("AI agents and copilots");
  const controlLayer = layerByTitle.get("Core-system action and proof gates");

  return (
    <section
      className={styles.architectureHero}
      aria-label="Scoped current-state architecture diagrams"
    >
      <div className={styles.visualTitle}>
        <strong>Current-state architecture exhibits</strong>
        <span>
          Scoped views for Data and AI, ERP, private cloud, and digital channels
        </span>
      </div>
      <div className={styles.architectureStoryboard}>
        <MiniArchitectureDiagram
          title="Data and AI mesh"
          subtitle="Source to consumption, with governed agent loopback"
          ariaLabel="Data and AI mesh diagram showing source applications, integration, governed data products, BI, analytics, AI agents, and proof gates"
        >
          <g className={styles.miniDiagramBase}>
            <rect x="26" y="248" width="508" height="44" rx="7" />
            <SvgTextBlock
              x={44}
              y={274}
              lines={[
                "Sources",
                sourceLayer?.examples.slice(0, 4).join(" · ") ?? "",
              ]}
              className={styles.miniLabel}
            />
            <rect x="42" y="182" width="120" height="44" rx="7" />
            <SvgTextBlock
              x={102}
              y={201}
              lines={[
                "Integration",
                integrationLayer?.examples.slice(1, 4).join(" · ") ?? "",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="204" y="162" width="150" height="82" rx="12" />
            <SvgTextBlock
              x={279}
              y={185}
              lines={[
                "Governed platform",
                "Raw → processed → aggregated",
                storageLayer?.examples.slice(0, 2).join(" + ") ?? "",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="392" y="182" width="120" height="44" rx="7" />
            <SvgTextBlock
              x={452}
              y={201}
              lines={[
                "Consumption",
                consumptionLayer?.examples.slice(0, 2).join(" + ") ?? "",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="354" y="70" width="142" height="58" rx="8" />
            <SvgTextBlock
              x={425}
              y={94}
              lines={[
                "AI agents",
                agentLayer?.examples.slice(0, 2).join(" + ") ?? "",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="56" y="70" width="216" height="48" rx="8" />
            <SvgTextBlock
              x={164}
              y={91}
              lines={[
                "Role-based access",
                "identity · policy · lineage",
                "domain ownership",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
          </g>
          <g className={styles.miniDiagramFlows}>
            <path d="M102 248 L102 226" />
            <path d="M162 204 L204 204" />
            <path d="M354 204 L392 204" />
            <path d="M452 182 L425 128" />
            <path d="M354 100 L272 100" />
            <path
              d="M425 128 C392 150 374 162 346 178"
              className={styles.dashedFlow}
            />
            <path
              d="M425 128 C342 42 174 44 108 70"
              className={styles.dashedFlow}
            />
          </g>
          <SvgTextBlock
            x={280}
            y={300}
            lines={[
              "Data products are visible;",
              "finance value still needs baseline and attestation.",
            ]}
            className={styles.miniFootnote}
            textAnchor="middle"
          />
        </MiniArchitectureDiagram>

        <MiniArchitectureDiagram
          title="ERP and finance core"
          subtitle="Control-heavy path from source of record to value proof"
          ariaLabel="ERP and finance architecture diagram showing SAP, EPM, master data, controlled integration, finance reporting, and Tower proof gates"
        >
          <g className={styles.miniDiagramBase}>
            <rect x="28" y="66" width="126" height="70" rx="8" />
            <SvgTextBlock
              x={91}
              y={92}
              lines={["ERP core", "SAP S/4HANA", "finance master data"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="218" y="66" width="124" height="70" rx="8" />
            <SvgTextBlock
              x={280}
              y={92}
              lines={["Controls", "MDM · close", "reconciliation"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="406" y="66" width="126" height="70" rx="8" />
            <SvgTextBlock
              x={469}
              y={92}
              lines={["Finance view", "EPM · GL", "budget / actual"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="90" y="198" width="132" height="54" rx="8" />
            <SvgTextBlock
              x={156}
              y={220}
              lines={["Integration", "batch · API · files"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="314" y="198" width="156" height="54" rx="8" />
            <SvgTextBlock
              x={392}
              y={220}
              lines={[
                "Tower proof",
                controlLayer?.examples.slice(4, 6).join(" + ") ??
                  "baseline + attestation",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
          </g>
          <g className={styles.miniDiagramFlows}>
            <path d="M154 101 L218 101" />
            <path d="M342 101 L406 101" />
            <path d="M91 136 C94 166 116 184 156 198" />
            <path d="M469 136 C466 166 436 184 392 198" />
            <path d="M222 225 L314 225" className={styles.dashedFlow} />
          </g>
          <SvgTextBlock
            x={280}
            y={286}
            lines={[
              "ERP is slower-moving and evidence-governed;",
              "AI action stays behind approval gates.",
            ]}
            className={styles.miniFootnote}
            textAnchor="middle"
          />
        </MiniArchitectureDiagram>

        <MiniArchitectureDiagram
          title="Private cloud and mainframe"
          subtitle="Two-data-center resilience, legacy gravity, and hybrid egress"
          ariaLabel="Private cloud and mainframe architecture diagram showing two data centers, IBM mainframe, private cloud, replicated operations, integration, and cloud analytics egress"
        >
          <g className={styles.miniDiagramBase}>
            <rect x="34" y="62" width="186" height="154" rx="12" />
            <SvgTextBlock
              x={127}
              y={86}
              lines={[
                "Private DC 1",
                "IBM z/OS · CICS",
                "DB2 · MQ",
                "operations gravity",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="340" y="62" width="186" height="154" rx="12" />
            <SvgTextBlock
              x={433}
              y={86}
              lines={[
                "Private DC 2",
                "hot/warm recovery",
                "replicated controls",
              ]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="214" y="238" width="132" height="48" rx="8" />
            <SvgTextBlock
              x={280}
              y={258}
              lines={["Hybrid egress", "API · ETL · event bridge"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="212" y="118" width="136" height="52" rx="8" />
            <SvgTextBlock
              x={280}
              y={140}
              lines={["Private cloud", "VMware / OpenShift"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
          </g>
          <g className={styles.miniDiagramFlows}>
            <path d="M220 138 L340 138" />
            <path d="M340 154 L220 154" className={styles.dashedFlow} />
            <path d="M127 216 C152 236 182 250 214 260" />
            <path d="M433 216 C408 236 378 250 346 260" />
          </g>
          <SvgTextBlock
            x={280}
            y={300}
            lines={[
              "A credible airline current state shows",
              "mainframe and dual-DC resilience explicitly.",
            ]}
            className={styles.miniFootnote}
            textAnchor="middle"
          />
        </MiniArchitectureDiagram>

        <MiniArchitectureDiagram
          title="Digital airline channels"
          subtitle="Web, mobile, APIs, loyalty, and real-time experience data"
          ariaLabel="Digital airline channels architecture diagram showing airline dot com, mobile, API gateway, loyalty, passenger service, events, analytics, and personalization"
        >
          <g className={styles.miniDiagramBase}>
            <rect x="32" y="64" width="130" height="74" rx="8" />
            <SvgTextBlock
              x={97}
              y={91}
              lines={["Airline.com", "mobile · kiosks", "contact center"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="216" y="64" width="128" height="74" rx="8" />
            <SvgTextBlock
              x={280}
              y={91}
              lines={["API layer", "identity · booking", "passenger service"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="398" y="64" width="130" height="74" rx="8" />
            <SvgTextBlock
              x={463}
              y={91}
              lines={["Experience", "loyalty · offers", "service recovery"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="78" y="204" width="152" height="54" rx="8" />
            <SvgTextBlock
              x={154}
              y={226}
              lines={["Events", "clickstream · trips · cases"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
            <rect x="330" y="204" width="152" height="54" rx="8" />
            <SvgTextBlock
              x={406}
              y={226}
              lines={["Decisioning", "BI · CDP · AI assist"]}
              className={styles.miniCenterText}
              textAnchor="middle"
            />
          </g>
          <g className={styles.miniDiagramFlows}>
            <path d="M162 101 L216 101" />
            <path d="M344 101 L398 101" />
            <path d="M280 138 C244 162 204 184 154 204" />
            <path d="M230 231 L330 231" />
            <path
              d="M406 204 C430 174 448 150 463 138"
              className={styles.dashedFlow}
            />
          </g>
          <SvgTextBlock
            x={280}
            y={286}
            lines={[
              "Digital has a real-time customer-facing shape;",
              "it should not be drawn like ERP.",
            ]}
            className={styles.miniFootnote}
            textAnchor="middle"
          />
        </MiniArchitectureDiagram>
      </div>
    </section>
  );
}

function EconomicsExhibit({ rows }: { rows: EconomicRow[] }) {
  const [budget, actual, committed, aiCost] = rows;
  const uncommitted = "$0.87B";

  return (
    <div className={styles.economicsExhibit}>
      <div className={styles.economicsBridgeCard}>
        <div className={styles.visualTitle}>
          <strong>Budget commitment bridge</strong>
          <span>Known economics, unknown value</span>
        </div>
        <svg
          className={styles.bridgeSvg}
          viewBox="0 0 680 288"
          role="img"
          aria-label="Budget commitment bridge showing FY2026 actual, FY2027 budget, committed base, and value proof gap"
        >
          <defs>
            <linearGradient id="budgetBridgeBlue" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#246fc8" />
              <stop offset="1" stopColor="#198f82" />
            </linearGradient>
          </defs>
          <line
            x1="92"
            y1="170"
            x2="588"
            y2="170"
            stroke="#d9e0ea"
            strokeWidth="2"
          />
          <g>
            <rect
              x="42"
              y="84"
              width="120"
              height="132"
              rx="6"
              fill="#eef5ff"
            />
            <rect
              x="42"
              y="93"
              width="120"
              height="123"
              rx="6"
              fill="#246fc8"
              opacity="0.94"
            />
            <text
              x="102"
              y="64"
              textAnchor="middle"
              className={styles.svgLabel}
            >
              FY2026 actual
            </text>
            <text
              x="102"
              y="140"
              textAnchor="middle"
              className={styles.svgValue}
            >
              {actual.value}
            </text>
            <text
              x="102"
              y="160"
              textAnchor="middle"
              className={styles.svgDetail}
            >
              Prior-year spend
            </text>
          </g>
          <g>
            <rect
              x="230"
              y="72"
              width="136"
              height="144"
              rx="6"
              fill="#eaf6f4"
            />
            <rect
              x="230"
              y="72"
              width="136"
              height="144"
              rx="6"
              fill="url(#budgetBridgeBlue)"
              opacity="0.94"
            />
            <text
              x="298"
              y="52"
              textAnchor="middle"
              className={styles.svgLabel}
            >
              FY2027 budget
            </text>
            <text
              x="298"
              y="136"
              textAnchor="middle"
              className={styles.svgValue}
            >
              {budget.value}
            </text>
            <text
              x="298"
              y="156"
              textAnchor="middle"
              className={styles.svgDetail}
            >
              Governed scope
            </text>
          </g>
          <g>
            <rect
              x="430"
              y="111"
              width="126"
              height="105"
              rx="6"
              fill="#fff7e8"
            />
            <rect
              x="430"
              y="111"
              width="126"
              height="105"
              rx="6"
              fill="#b97824"
              opacity="0.94"
            />
            <text
              x="493"
              y="91"
              textAnchor="middle"
              className={styles.svgLabel}
            >
              Committed base
            </text>
            <text
              x="493"
              y="159"
              textAnchor="middle"
              className={styles.svgValue}
            >
              {committed.value}
            </text>
            <text
              x="493"
              y="179"
              textAnchor="middle"
              className={styles.svgDetail}
            >
              63% of budget
            </text>
          </g>
          <g>
            <rect
              x="578"
              y="140"
              width="62"
              height="76"
              rx="6"
              fill="#fff"
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              strokeWidth="2"
            />
            <text
              x="609"
              y="103"
              textAnchor="middle"
              className={styles.svgLabel}
            >
              Value proof
            </text>
            <text x="609" y="166" textAnchor="middle" className={styles.svgGap}>
              Not
            </text>
            <text x="609" y="184" textAnchor="middle" className={styles.svgGap}>
              established
            </text>
          </g>
          <path
            d="M168 144 C190 126 204 112 224 103"
            fill="none"
            stroke="#9fb3cf"
            strokeWidth="2"
          />
          <path
            d="M372 144 C396 148 408 150 424 158"
            fill="none"
            stroke="#c6a36e"
            strokeWidth="2"
          />
          <path
            d="M556 162 C566 162 570 162 574 162"
            fill="none"
            stroke="#9aa6ba"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x="298"
            y="248"
            textAnchor="middle"
            className={styles.svgFootnote}
          >
            Budget expands by $0.17B over prior-year actual; {uncommitted}{" "}
            remains outside the committed base.
          </text>
        </svg>
      </div>

      <div className={styles.economicInsightGrid}>
        <article className={styles.economicInsight}>
          <span>Constraint</span>
          <strong>63% committed</strong>
          <div className={styles.stackedBar} aria-hidden="true">
            <i className={styles.committedSlice} />
            <i className={styles.flexSlice} />
          </div>
          <p>
            Contracted economics are large enough to shape renewal timing,
            commercial rights, and portfolio flexibility.
          </p>
        </article>
        <article className={styles.economicInsight}>
          <span>Cost signal</span>
          <strong>{aiCost.value} visible</strong>
          <div className={styles.stackedBar} aria-hidden="true">
            <i className={styles.aiSlice} />
            <i className={styles.otherSlice} />
          </div>
          <p>
            AI use cost is visible, but value realization remains a Tower
            validation lane rather than a Home claim.
          </p>
        </article>
        <article className={`${styles.economicInsight} ${styles.proofGap}`}>
          <span>Publication guardrail</span>
          <strong>Claimable value not established</strong>
          <p>
            Unknown value is shown as an evidence gap, not a zero-dollar outcome
            or a savings narrative.
          </p>
        </article>
      </div>
    </div>
  );
}

function CoherenceMap({ model }: { model: HomeEnterpriseLandscapeV2Model }) {
  const edges = [
    ["Operations", "Critical platforms", false],
    ["Critical platforms", "Portfolio capacity", false],
    ["Portfolio capacity", "Coherence", false],
    ["Commercial", "Data and measures", false],
    ["Data and measures", "Controls and vendors", false],
    ["Controls and vendors", "Coherence", false],
    ["Operations", "Commercial", true],
    ["Critical platforms", "Data and measures", false],
  ] as const;
  const nodeByLabel = new Map(
    model.coherence.map((node) => [node.label, node]),
  );

  return (
    <div className={`${styles.visualPanel} ${styles.coherenceMap}`}>
      <div className={styles.visualTitle}>
        <strong>Enterprise constraint map</strong>
        <span>Relationship slice, not target architecture</span>
      </div>
      <svg
        className={styles.mapSvg}
        viewBox="0 0 1120 500"
        role="img"
        aria-label="Enterprise coherence map connecting operations, platforms, portfolio capacity, commercial, data, controls, and coherence"
      >
        <defs>
          <linearGradient id="coherenceWash" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#246fc8" stopOpacity="0.12" />
            <stop offset="0.52" stopColor="#198f82" stopOpacity="0.1" />
            <stop offset="1" stopColor="#b97824" stopOpacity="0.12" />
          </linearGradient>
          <marker
            id="coherenceArrow"
            markerHeight="9"
            markerWidth="9"
            orient="auto"
            refX="8"
            refY="4.5"
          >
            <path d="M0,0 L9,4.5 L0,9 Z" fill="#9fb3cf" />
          </marker>
        </defs>
        <rect x="28" y="24" width="1064" height="428" rx="18" fill="#fbfcff" />
        <path
          d="M134 118 C260 30, 438 54, 546 134 C684 236, 820 108, 978 206"
          fill="none"
          stroke="url(#coherenceWash)"
          strokeLinecap="round"
          strokeWidth="92"
        />
        <path
          d="M138 342 C286 232, 442 324, 554 330 C690 336, 798 394, 978 278"
          fill="none"
          stroke="url(#coherenceWash)"
          strokeLinecap="round"
          strokeWidth="96"
        />
        {edges.map(([fromLabel, toLabel, dashed]) => {
          const from = nodeByLabel.get(fromLabel);
          const to = nodeByLabel.get(toLabel);
          if (!from || !to) return null;
          return (
            <line
              key={`${fromLabel}-${toLabel}`}
              x1={from.x * 11.2}
              y1={from.y * 5}
              x2={to.x * 11.2}
              y2={to.y * 5}
              markerEnd="url(#coherenceArrow)"
              stroke="#9fb3cf"
              strokeDasharray={dashed ? "10 10" : "0"}
              strokeWidth="5"
            />
          );
        })}
        {model.coherence.map((node) => (
          <g className={styles.mapNode} key={node.label}>
            <circle
              cx={node.x * 11.2}
              cy={node.y * 5}
              r={node.label === "Coherence" ? "62" : "52"}
              fill={TONE_HEX[node.tone]}
              opacity="0.96"
            />
            <text
              x={node.x * 11.2}
              y={node.y * 5 - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize="25"
              fontWeight="800"
            >
              {node.label === "Coherence" ? "C" : node.label.split(" ")[0]}
            </text>
            <text
              x={node.x * 11.2}
              y={node.y * 5 + 76}
              textAnchor="middle"
              fontSize="21"
              fontWeight="760"
            >
              {node.label}
            </text>
            <text
              x={node.x * 11.2}
              y={node.y * 5 + 104}
              textAnchor="middle"
              fontSize="15"
              fill="#657087"
            >
              {node.detail}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function postureStateClass(value: string) {
  const normalized = value.toLowerCase().replaceAll(" ", "");
  if (normalized === "high") return styles.stateHigh;
  if (normalized === "moderate") return styles.stateModerate;
  if (normalized === "limited") return styles.stateLimited;
  if (normalized === "mixed") return styles.stateMixed;
  if (normalized === "fragmented") return styles.stateFragmented;
  if (normalized === "constrained") return styles.stateConstrained;
  if (normalized === "locked") return styles.stateLocked;
  return styles.stateSelective;
}

function TabPanels({
  model,
  selectedTab,
}: {
  model: HomeEnterpriseLandscapeV2Model;
  selectedTab: HomeLandscapeTabId;
}) {
  return (
    <div>
      <article
        className={styles.panel}
        id="summary-panel"
        role="tabpanel"
        aria-labelledby="tab-summary"
        hidden={selectedTab !== "summary"}
      >
        <div className={styles.summaryGrid}>
          <div>
            <h2>Executive read</h2>
            <p className={styles.executiveRead}>{model.executiveRead}</p>
            <div
              className={styles.identityGrid}
              aria-label="Governed enterprise anchors"
            >
              {model.anchors.map((anchor) => (
                <div className={styles.identitySignal} key={anchor.label}>
                  <span>{anchor.label}</span>
                  <b>{anchor.value}</b>
                  <small>{anchor.detail}</small>
                  <SparkBar item={anchor} />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.standoutGrid} aria-label="What stands out">
            {model.standouts.map((signal) => (
              <article className={styles.standout} key={signal.label}>
                <span>{signal.label}</span>
                <h3>{signal.title}</h3>
                <p>{signal.body}</p>
              </article>
            ))}
          </div>
        </div>
      </article>

      <article
        className={styles.panel}
        id="patterns-panel"
        role="tabpanel"
        aria-labelledby="tab-patterns"
        hidden={selectedTab !== "patterns"}
      >
        <div>
          <h2>Balanced enterprise portrait</h2>
          <p className={styles.lead}>
            Home should introduce the enterprise from recognizable operating,
            commercial, technology, data, risk, and change facts before routing
            specialist questions to other Nexus modules.
          </p>
        </div>
        <ContextSignalWall signals={model.contextSignals} />
        <div className={styles.patternGrid}>
          {model.patterns.map((pattern) => (
            <article className={styles.patternCard} key={pattern.title}>
              <span className={styles.eyebrow}>{pattern.title}</span>
              <p>{pattern.body}</p>
              <SparkBar
                item={{
                  label: pattern.title,
                  value: "",
                  detail: "",
                  ratio: pattern.tone === "blue" ? 0.86 : 0.68,
                  tone: pattern.tone,
                }}
              />
            </article>
          ))}
        </div>
      </article>

      <article
        className={styles.panel}
        id="economics-panel"
        role="tabpanel"
        aria-labelledby="tab-economics"
        hidden={selectedTab !== "economics"}
      >
        <div className={styles.economicsLayout}>
          <div>
            <h2>Economics without value overclaim</h2>
            <p className={styles.lead}>{model.economicsRead}</p>
          </div>
          <EconomicsExhibit rows={model.economics} />
          <div className={styles.economicAuditTable}>
            <div className={`${styles.economicAuditRow} ${styles.postureHead}`}>
              <div>Measure</div>
              <div>Value</div>
              <div>Read</div>
            </div>
            {model.economics.map((row) => (
              <div className={styles.economicAuditRow} key={row.label}>
                <div data-label="Measure">{row.label}</div>
                <div data-label="Value">{row.value}</div>
                <div data-label="Read">{row.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article
        className={styles.panel}
        id="posture-panel"
        role="tabpanel"
        aria-labelledby="tab-posture"
        hidden={selectedTab !== "posture"}
      >
        <div>
          <h2>Normalized enterprise posture</h2>
          <p className={styles.lead}>
            Posture is shown as a normalized read across evidence, coherence,
            flexibility, and potential. It is a planning-grade rubric, not a
            Claude-generated score.
          </p>
        </div>
        <div className={styles.postureMatrix}>
          <div className={`${styles.postureRow} ${styles.postureHead}`}>
            <div>Domain</div>
            <div>Evidence</div>
            <div>Coherence</div>
            <div>Flexibility</div>
            <div>Potential</div>
          </div>
          {model.posture.map((row) => (
            <div className={styles.postureRow} key={row.domain}>
              <div data-label="Domain" className={styles.postureDomain}>
                {row.domain}
              </div>
              <div
                data-label="Evidence"
                className={`${styles.postureCell} ${postureStateClass(
                  row.evidence,
                )}`}
              >
                {row.evidence}
              </div>
              <div
                data-label="Coherence"
                className={`${styles.postureCell} ${postureStateClass(
                  row.authority,
                )}`}
              >
                {row.authority}
              </div>
              <div
                data-label="Flexibility"
                className={`${styles.postureCell} ${postureStateClass(
                  row.valueState,
                )}`}
              >
                {row.valueState}
              </div>
              <div
                data-label="Potential"
                className={`${styles.postureCell} ${postureStateClass(
                  row.attention,
                )}`}
              >
                {row.attention}
              </div>
            </div>
          ))}
        </div>
      </article>

      <article
        className={styles.panel}
        id="coherence-panel"
        role="tabpanel"
        aria-labelledby="tab-coherence"
        hidden={selectedTab !== "coherence"}
      >
        <div className={styles.coherenceLayout}>
          <div>
            <h2>Why enterprise coherence is difficult</h2>
            <p className={styles.lead}>
              The operating model ties frontline reliability, commercial
              choices, critical platforms, data measures, portfolio capacity,
              and vendor controls into one system of constraints.
            </p>
          </div>
          <CoherenceMap model={model} />
          <div className={styles.coherenceSplit}>
            <ArchitectureFlowMap model={model} />
            <div className={styles.coherenceDecisionGrid}>
              {model.architectureDecisions.map((decision) => (
                <article
                  className={styles.architectureDecision}
                  key={decision.title}
                >
                  <span className={styles.severity}>{decision.evidence}</span>
                  <h3>{decision.title}</h3>
                  <p>{decision.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.deploymentGrid}>
            {model.architectureDeployments.map((deployment) => (
              <article className={styles.deploymentCard} key={deployment.label}>
                <span className={styles.eyebrow}>{deployment.label}</span>
                <h3>{deployment.posture}</h3>
                <p>{deployment.body}</p>
                <div className={styles.laneChipRow}>
                  {deployment.examples.map((example) => (
                    <span key={example}>{example}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </article>

      <article
        className={styles.panel}
        id="trajectory-panel"
        role="tabpanel"
        aria-labelledby="tab-trajectory"
        hidden={selectedTab !== "trajectory"}
      >
        <div>
          <h2>Four shifts define the plausible direction of travel</h2>
          <p className={styles.lead}>
            Direction language lives here, not on Summary. Each shift separates
            today, potential direction, principal gap, authority, gate, and
            module route.
          </p>
        </div>
        <div className={styles.shiftTable}>
          <div className={`${styles.shiftRow} ${styles.postureHead}`}>
            <div>Today</div>
            <div>Potential direction</div>
            <div>Principal gap</div>
            <div>Authority</div>
            <div>Gate</div>
            <div>Route</div>
          </div>
          {model.trajectory.map((row) => (
            <div className={styles.shiftRow} key={row.today}>
              <div data-label="Today">{row.today}</div>
              <div data-label="Potential direction">{row.potential}</div>
              <div data-label="Principal gap">{row.gap}</div>
              <div data-label="Authority">{row.authority}</div>
              <div data-label="Gate">{row.gate}</div>
              <div data-label="Route">{row.route}</div>
            </div>
          ))}
        </div>
      </article>

      <article
        className={styles.panel}
        id="watchlist-panel"
        role="tabpanel"
        aria-labelledby="tab-watchlist"
        hidden={selectedTab !== "watchlist"}
      >
        <div>
          <h2>Executive watchlist</h2>
          <p className={styles.lead}>
            Watch items route to the owning module instead of making Home a
            decision workspace.
          </p>
        </div>
        <div className={styles.watchGrid}>
          {model.watchlist.map((item) => (
            <article className={styles.watchCard} key={item.title}>
              <span className={styles.severity}>{item.severity}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <span className={styles.route}>{item.route}</span>
            </article>
          ))}
        </div>
      </article>

      <article
        className={styles.panel}
        id="evidence-panel"
        role="tabpanel"
        aria-labelledby="tab-evidence"
        hidden={selectedTab !== "evidence"}
      >
        <div>
          <h2>Executive confidence view</h2>
          <p className={styles.lead}>
            This view separates what is loaded, what is directional, what has
            conflicts, and which claims need source authority before they become
            production narrative.
          </p>
        </div>
        <div className={styles.evidenceGrid}>
          {model.evidence.map((item) => (
            <article className={styles.evidenceCard} key={item.label}>
              <span className={styles.eyebrow}>{item.label}</span>
              <b>{item.value}</b>
              <p>{item.detail}</p>
              <SparkBar
                item={{
                  label: item.label,
                  value: item.value,
                  detail: item.detail,
                  ratio: item.tone === "blue" ? 1 : 0.62,
                  tone: item.tone,
                }}
              />
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}

export function HomeEnterpriseLandscapeV2({
  model = SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2,
}: {
  model?: HomeEnterpriseLandscapeV2Model;
}) {
  const [selectedTab, setSelectedTab] = useSelectedTab("summary");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selectedIndex = useMemo(
    () => HOME_LANDSCAPE_TABS.findIndex((tab) => tab.id === selectedTab),
    [selectedTab],
  );

  const focusTab = useCallback(
    (index: number) => {
      const next =
        HOME_LANDSCAPE_TABS[
          (index + HOME_LANDSCAPE_TABS.length) % HOME_LANDSCAPE_TABS.length
        ];
      setSelectedTab(next.id);
      requestAnimationFrame(() => tabRefs.current[next.id]?.focus());
    },
    [setSelectedTab],
  );

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        focusTab(selectedIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusTab(selectedIndex - 1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        focusTab(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        focusTab(HOME_LANDSCAPE_TABS.length - 1);
      }
    },
    [focusTab, selectedIndex],
  );

  return (
    <main className={styles.surface}>
      <div className={styles.page}>
        <div className={styles.tenantBar}>
          <div>
            <div className={styles.eyebrow}>Home / Enterprise Landscape</div>
            <div className={styles.tenantTitle}>
              <h1>{model.tenantName}</h1>
              <span>{model.subtitle}</span>
            </div>
          </div>
          <div className={styles.statusStrip} aria-label="Page status">
            <span className={styles.statusPill}>{model.status}</span>
            <button
              className={styles.statusAction}
              type="button"
              onClick={() => setSelectedTab("evidence")}
            >
              Evidence
            </button>
          </div>
        </div>

        <section
          className={styles.canvas}
          aria-label="Enterprise Landscape canvas"
        >
          <div
            className={styles.tabList}
            role="tablist"
            aria-label="Home canvas tabs"
          >
            {HOME_LANDSCAPE_TABS.map((tab) => (
              <button
                ref={(element) => {
                  tabRefs.current[tab.id] = element;
                }}
                className={styles.tab}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selectedTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                data-tab={tab.id}
                tabIndex={selectedTab === tab.id ? 0 : -1}
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                onKeyDown={handleTabKeyDown}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <TabPanels model={model} selectedTab={selectedTab} />
        </section>

        <div className={styles.footer}>
          Enterprise Landscape | Planning-grade view | Evidence available on
          demand
        </div>
      </div>
    </main>
  );
}
