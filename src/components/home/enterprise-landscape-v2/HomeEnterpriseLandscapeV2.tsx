"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const TILE_TONE_CLASS: Record<SignalTone, string> = {
  blue: styles.tileToneBlue,
  teal: styles.tileToneTeal,
  amber: styles.tileToneAmber,
  slate: styles.tileToneSlate,
  red: styles.tileToneRed,
};

function normalizeTabId(value: string | null): HomeLandscapeTabId | null {
  if (!value) return null;
  if (TAB_IDS.has(value as HomeLandscapeTabId))
    return value as HomeLandscapeTabId;
  return null;
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

interface ArchitectureTile {
  title: string;
  detail: string;
  tags?: string[];
  tone?: SignalTone;
}

interface ArchitectureLane {
  title: string;
  detail: string;
  tiles: ArchitectureTile[];
}

interface ArchitectureCanvas {
  title: string;
  subtitle: string;
  footprint: string;
  story: string;
  lanes: ArchitectureLane[];
  controls: string[];
}

const ARCHITECTURE_CANVASES: ArchitectureCanvas[] = [
  {
    title: "Data and AI platform",
    subtitle: "Source-to-consumption architecture with governed agent loopback",
    footprint: "Hybrid data estate",
    story:
      "This should read like a current-state data platform: operational sources feed integration and CDC, land in governed zones, then serve analytics, AI, and executive consumption with proof gates.",
    lanes: [
      {
        title: "Operational sources",
        detail: "Airline execution systems that generate the data exhaust",
        tiles: [
          {
            title: "Operations control",
            detail: "Network, disruption, crew pairing, turn execution",
            tags: ["Ops", "Real-time"],
            tone: "blue",
          },
          {
            title: "Passenger + commerce",
            detail: "Reservation/PSS, booking, loyalty, offers, cargo",
            tags: ["PSS", "Loyalty"],
            tone: "blue",
          },
          {
            title: "Enterprise apps",
            detail: "ERP, HR, procurement, MRO and service systems",
            tags: ["ERP", "MRO"],
            tone: "slate",
          },
        ],
      },
      {
        title: "Integration fabric",
        detail: "Movement, mediation, and mainframe-safe extraction",
        tiles: [
          {
            title: "Event + API backbone",
            detail: "Kafka streams, MuleSoft APIs, IBM MQ bridge",
            tags: ["Kafka", "MuleSoft", "MQ"],
            tone: "teal",
          },
          {
            title: "Batch + CDC",
            detail:
              "ETL/ELT, file drops, replicated feeds from systems of record",
            tags: ["ETL", "CDC", "SFTP"],
            tone: "teal",
          },
        ],
      },
      {
        title: "Data platforms",
        detail: "Raw, curated, modeled, and governed analytical stores",
        tiles: [
          {
            title: "Landing + lake zones",
            detail: "Raw ingestion, processed zone, catalog, lineage",
            tags: ["Raw", "Curated"],
            tone: "amber",
          },
          {
            title: "Enterprise warehouse",
            detail: "Teradata EDW, marts, governed financial and ops measures",
            tags: ["Teradata", "Marts"],
            tone: "amber",
          },
          {
            title: "Cloud analytics estate",
            detail:
              "Snowflake-style domain sharing, cloud object storage, data products",
            tags: ["Cloud", "Data products"],
            tone: "amber",
          },
        ],
      },
      {
        title: "Analytics + AI",
        detail:
          "Science, semantic, and agent layers do not calculate value alone",
        tiles: [
          {
            title: "Data science workbench",
            detail: "SAS, notebooks, model features, experiment lineage",
            tags: ["SAS", "ML"],
            tone: "red",
          },
          {
            title: "Agent runtime",
            detail:
              "Copilots, governed prompts, retrieval bundle, action gates",
            tags: ["Agents", "RAG", "Gates"],
            tone: "red",
          },
        ],
      },
      {
        title: "Consumption",
        detail: "Human and machine decision surfaces",
        tiles: [
          {
            title: "Executive analytics",
            detail: "Power BI, Tableau, scorecards, operating reviews",
            tags: ["BI", "CXO"],
            tone: "blue",
          },
          {
            title: "Operational decisions",
            detail: "Recovery, offers, maintenance, crew and service workflows",
            tags: ["Workflow", "Action"],
            tone: "blue",
          },
        ],
      },
    ],
    controls: [
      "Role-based access and domain ownership",
      "Catalog, lineage, and evidence references",
      "Finance baseline and attestation before value claims",
      "Approval gate before agent-to-system actions",
    ],
  },
  {
    title: "ERP and finance core",
    subtitle: "Controlled financial spine from source of record to Tower proof",
    footprint: "Control-heavy core",
    story:
      "ERP should not look like a digital channel diagram. The story is controlled master data, close/reconciliation, budget/actual traceability, and proof gates for value claims.",
    lanes: [
      {
        title: "Systems of record",
        detail: "Financial and enterprise master data foundation",
        tiles: [
          {
            title: "SAP S/4HANA / ERP",
            detail: "GL, AP/AR, cost center, asset and procurement records",
            tags: ["GL", "AP/AR", "Assets"],
            tone: "blue",
          },
          {
            title: "Finance master data",
            detail:
              "Chart of accounts, vendors, products, organization hierarchy",
            tags: ["MDM", "Controls"],
            tone: "blue",
          },
        ],
      },
      {
        title: "Controlled movement",
        detail: "Batch, API, close feeds, and reconciliation files",
        tiles: [
          {
            title: "Finance integration",
            detail: "Close calendar, allocations, GL extracts, contract feeds",
            tags: ["Batch", "API", "Files"],
            tone: "teal",
          },
          {
            title: "EPM + planning",
            detail: "Budget, forecast, actuals, scenario and variance views",
            tags: ["Budget", "Actual"],
            tone: "teal",
          },
        ],
      },
      {
        title: "Proof layer",
        detail:
          "Tower can explain value only after finance-grade evidence exists",
        tiles: [
          {
            title: "Baseline evidence",
            detail:
              "Starting cost, accountable owner, period, source file, lineage",
            tags: ["Baseline", "Owner"],
            tone: "amber",
          },
          {
            title: "Attestation",
            detail: "Finance recognition, approval, measurement state, caveats",
            tags: ["CFO", "Evidence"],
            tone: "amber",
          },
        ],
      },
      {
        title: "Executive use",
        detail: "Value narrative stays bounded by deterministic finance facts",
        tiles: [
          {
            title: "Tower view",
            detail:
              "Portfolio value state, gaps, validation status, decision route",
            tags: ["Tower", "Value"],
            tone: "red",
          },
          {
            title: "Home summary",
            detail:
              "Shows claimable value as not established when proof is absent",
            tags: ["No overclaim"],
            tone: "red",
          },
        ],
      },
    ],
    controls: [
      "Finance owns recognized value, not Claude",
      "Baseline, outcome, and attestation must be complete",
      "Contract commitments constrain modernization sequencing",
      "Unknown value remains unknown, not zero",
    ],
  },
  {
    title: "Private cloud, data centers, and mainframe",
    subtitle: "Dual-site resilience with legacy gravity and hybrid egress",
    footprint: "Airline resilience core",
    story:
      "A credible airline current-state diagram must explicitly show mainframe gravity, dual data centers, private cloud, replicated controls, and selective cloud egress.",
    lanes: [
      {
        title: "Private DC 1",
        detail: "Primary operations gravity",
        tiles: [
          {
            title: "IBM mainframe",
            detail: "z/OS, CICS transactions, DB2 records, MQ integration",
            tags: ["z/OS", "CICS", "DB2", "MQ"],
            tone: "blue",
          },
          {
            title: "Core operations",
            detail:
              "Schedule, inventory, operational state and settlement feeds",
            tags: ["Core", "Ops"],
            tone: "blue",
          },
        ],
      },
      {
        title: "Private cloud",
        detail: "Virtualized app and platform estate",
        tiles: [
          {
            title: "VMware / OpenShift",
            detail:
              "Internal platforms, service mesh, API runtime, batch workers",
            tags: ["Private cloud", "K8s"],
            tone: "teal",
          },
          {
            title: "Shared services",
            detail:
              "IAM, secrets, monitoring, logging, backup and run controls",
            tags: ["IAM", "Ops"],
            tone: "teal",
          },
        ],
      },
      {
        title: "Private DC 2",
        detail: "Recovery and resilience posture",
        tiles: [
          {
            title: "Hot / warm recovery",
            detail:
              "Replicated operational data, failover runbooks, DR controls",
            tags: ["DR", "Replication"],
            tone: "amber",
          },
          {
            title: "Continuity controls",
            detail:
              "Network segmentation, backup, privileged access, audit trail",
            tags: ["Controls", "Audit"],
            tone: "amber",
          },
        ],
      },
      {
        title: "Hybrid egress",
        detail: "Cloud is connected, not assumed as the center",
        tiles: [
          {
            title: "Cloud landing zone",
            detail: "Selective analytics, SaaS integration, external APIs",
            tags: ["Hybrid", "Cloud"],
            tone: "red",
          },
          {
            title: "Security boundary",
            detail:
              "WAF, IDS/IPS, DLP, policy enforcement and exfiltration controls",
            tags: ["WAF", "DLP"],
            tone: "red",
          },
        ],
      },
    ],
    controls: [
      "Two data centers must be first-class in the architecture read",
      "Mainframe integration is a modernization constraint, not a footnote",
      "Hybrid egress should show security and data movement boundaries",
      "Operational continuity beats generic cloud-first diagrams",
    ],
  },
  {
    title: "Digital airline channels",
    subtitle: "Customer-facing real-time path from edge to decisioning",
    footprint: "Digital channel estate",
    story:
      "Digital architecture should show experience edge, API mediation, real-time events, customer data, decisioning, and service recovery. It has a different shape from ERP.",
    lanes: [
      {
        title: "Experience edge",
        detail: "Internet-facing and contact-center channels",
        tiles: [
          {
            title: "Airline.com + mobile",
            detail: "Search, booking, check-in, trip management, offers",
            tags: ["Web", "Mobile"],
            tone: "blue",
          },
          {
            title: "Airport + service",
            detail:
              "Kiosks, contact center, disruption and service recovery flows",
            tags: ["Kiosk", "Contact"],
            tone: "blue",
          },
        ],
      },
      {
        title: "API and identity",
        detail: "Mediated access to core systems",
        tiles: [
          {
            title: "API gateway",
            detail: "Booking, profile, payment, loyalty and trip APIs",
            tags: ["API", "Gateway"],
            tone: "teal",
          },
          {
            title: "Identity + consent",
            detail:
              "Customer identity, preferences, consent and session controls",
            tags: ["IAM", "Consent"],
            tone: "teal",
          },
        ],
      },
      {
        title: "Event stream",
        detail: "Real-time behavioral and operational signals",
        tiles: [
          {
            title: "Clickstream + journey events",
            detail:
              "Search, booking, disruption, case, loyalty and offer events",
            tags: ["Events", "Journey"],
            tone: "amber",
          },
          {
            title: "Operational feedback",
            detail:
              "Irregular operations, service cases, refund and recovery signals",
            tags: ["IROPS", "Cases"],
            tone: "amber",
          },
        ],
      },
      {
        title: "Decisioning",
        detail: "Analytics and AI assist remain policy-bound",
        tiles: [
          {
            title: "CDP + personalization",
            detail:
              "Customer segments, next-best-action, offers and service recovery",
            tags: ["CDP", "Offers"],
            tone: "red",
          },
          {
            title: "Agent assist",
            detail:
              "Summaries, recommendations, handoffs, governed action controls",
            tags: ["AI assist", "Gates"],
            tone: "red",
          },
        ],
      },
    ],
    controls: [
      "Digital paths must show internet-facing controls",
      "Real-time events are separate from finance/ERP batch flows",
      "Customer data and consent belong in the diagram",
      "AI assist needs action guardrails and service recovery context",
    ],
  },
];

function ArchitectureTileCard({ tile }: { tile: ArchitectureTile }) {
  const toneClass = tile.tone ? TILE_TONE_CLASS[tile.tone] : "";

  return (
    <article className={`${styles.architectureTile} ${toneClass}`}>
      <div>
        <strong>{tile.title}</strong>
        <p>{tile.detail}</p>
      </div>
      {tile.tags?.length ? (
        <div className={styles.architectureTagRow}>
          {tile.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ArchitectureLaneCanvas({ canvas }: { canvas: ArchitectureCanvas }) {
  return (
    <article
      className={styles.architectureCanvasCard}
      aria-label={`${canvas.title} detailed architecture canvas`}
    >
      <div className={styles.architectureCanvasHeader}>
        <div>
          <span>{canvas.footprint}</span>
          <strong>{canvas.title}</strong>
          <p>{canvas.subtitle}</p>
        </div>
        <em>{canvas.story}</em>
      </div>
      <div className={styles.architectureLaneFrame}>
        <svg
          className={styles.architectureFlowOverlay}
          viewBox="0 0 1000 210"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={`${canvas.title.replaceAll(" ", "-").toLowerCase()}-flow`}
              markerHeight="8"
              markerWidth="8"
              orient="auto"
              refX="7"
              refY="4"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#8da2bd" />
            </marker>
          </defs>
          <path
            d="M78 84 C228 72 330 72 462 84 S730 102 920 84"
            className={styles.primaryArchitectureFlow}
            markerEnd={`url(#${canvas.title.replaceAll(" ", "-").toLowerCase()}-flow)`}
          />
          <path
            d="M918 142 C720 188 444 190 86 146"
            className={styles.controlArchitectureFlow}
          />
        </svg>
        <div
          className={styles.architectureLaneGrid}
          style={{
            gridTemplateColumns: `repeat(${canvas.lanes.length}, minmax(168px, 1fr))`,
          }}
        >
          {canvas.lanes.map((lane, index) => (
            <section className={styles.architectureLane} key={lane.title}>
              <div className={styles.architectureLaneTitle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{lane.title}</strong>
                  <p>{lane.detail}</p>
                </div>
              </div>
              <div className={styles.architectureTileStack}>
                {lane.tiles.map((tile) => (
                  <ArchitectureTileCard key={tile.title} tile={tile} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <div className={styles.architectureControlStrip}>
        {canvas.controls.map((control) => (
          <span key={control}>{control}</span>
        ))}
      </div>
    </article>
  );
}

function ArchitectureFlowMap({
  model,
}: {
  model: HomeEnterpriseLandscapeV2Model;
}) {
  void model;

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
        {ARCHITECTURE_CANVASES.map((canvas) => (
          <ArchitectureLaneCanvas canvas={canvas} key={canvas.title} />
        ))}
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

function splitCoherenceText(value: string) {
  if (value === "Data and measures") return ["Data and", "measures"];
  if (value === "Controls and vendors") return ["Controls and", "vendors"];
  if (value === "Portfolio capacity") return ["Portfolio", "capacity"];
  return [value];
}

function splitCoherenceDetail(value: string) {
  const parts = value.split(", ");
  if (parts.length <= 2) return [value];
  return [`${parts[0]}, ${parts[1]}`, parts.slice(2).join(", ")];
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
  const xScale = 12.4;
  const yScale = 5.45;

  return (
    <div className={`${styles.visualPanel} ${styles.coherenceMap}`}>
      <div className={styles.visualTitle}>
        <strong>Enterprise constraint map</strong>
        <span>Relationship slice, not target architecture</span>
      </div>
      <svg
        className={styles.mapSvg}
        viewBox="0 0 1280 560"
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
        <rect x="28" y="24" width="1224" height="488" rx="18" fill="#fbfcff" />
        <path
          d="M150 130 C300 38, 500 58, 626 148 C790 260, 940 128, 1140 226"
          fill="none"
          stroke="url(#coherenceWash)"
          strokeLinecap="round"
          strokeWidth="92"
        />
        <path
          d="M150 380 C320 254, 500 356, 636 362 C790 368, 930 434, 1144 310"
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
              x1={from.x * xScale}
              y1={from.y * yScale}
              x2={to.x * xScale}
              y2={to.y * yScale}
              markerEnd="url(#coherenceArrow)"
              stroke="#9fb3cf"
              strokeDasharray={dashed ? "10 10" : "0"}
              strokeWidth="5"
            />
          );
        })}
        {model.coherence.map((node) => {
          const cx = node.x * xScale;
          const cy = node.y * yScale;
          const labelLines = splitCoherenceText(node.label);
          const detailLines = splitCoherenceDetail(node.detail);
          const labelY = cy + 76;
          const detailY = labelY + 25 + (labelLines.length - 1) * 21;

          return (
            <g className={styles.mapNode} key={node.label}>
              <circle
                cx={cx}
                cy={cy}
                r={node.label === "Coherence" ? "62" : "52"}
                fill={TONE_HEX[node.tone]}
                opacity="0.96"
              />
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="23"
                fontWeight="800"
              >
                {node.label === "Coherence" ? "C" : node.label.split(" ")[0]}
              </text>
              <text
                x={cx}
                y={labelY}
                textAnchor="middle"
                fontSize="18"
                fontWeight="760"
              >
                {labelLines.map((line, index) => (
                  <tspan key={line} x={cx} dy={index === 0 ? 0 : 21}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={cx}
                y={detailY}
                textAnchor="middle"
                fontSize="13"
                fill="#657087"
              >
                {detailLines.map((line, index) => (
                  <tspan key={line} x={cx} dy={index === 0 ? 0 : 17}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
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
        id="context-panel"
        role="tabpanel"
        aria-labelledby="tab-context"
        hidden={selectedTab !== "context"}
      >
        <div className={styles.contextLayout}>
          <div>
            <h2>Loaded context, integrated into the Home story</h2>
            <p className={styles.lead}>{model.contextRead}</p>
          </div>
          <ContextSignalWall signals={model.contextSignals} />
          <div className={styles.contextDomainGrid}>
            {model.contextDomains.map((domain) => (
              <article className={styles.contextDomain} key={domain.label}>
                <span className={styles.eyebrow}>{domain.label}</span>
                <h3>{domain.title}</h3>
                <p>{domain.body}</p>
                <small>{domain.evidence}</small>
              </article>
            ))}
          </div>
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
        id="architecture-panel"
        role="tabpanel"
        aria-labelledby="tab-architecture"
        hidden={selectedTab !== "architecture"}
      >
        <div className={styles.architectureLayout}>
          <div>
            <h2>Scoped current-state architecture</h2>
            <p className={styles.lead}>{model.architectureRead}</p>
          </div>
          <ArchitectureFlowMap model={model} />
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
          <div className={styles.archetypeGrid}>
            {model.architectureArchetypes.map((archetype) => (
              <article className={styles.archetypeCard} key={archetype.title}>
                <span className={styles.eyebrow}>{archetype.route}</span>
                <h3>{archetype.title}</h3>
                <strong>{archetype.topology}</strong>
                <p>{archetype.body}</p>
                <div className={styles.laneChipRow}>
                  {archetype.examples.map((example) => (
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
