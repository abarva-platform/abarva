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
import {
  OrientationBlockPanel,
  OrientationExplorePanel,
  OrientationProvenanceBar,
} from "@/components/home/orientation/HomeOrientationPanels";
import type { OrientationPack } from "@/lib/home/orientation-pack-read-adapter";
import styles from "./HomeEnterpriseLandscapeV2.module.css";

const TAB_IDS = new Set<HomeLandscapeTabId>(
  HOME_LANDSCAPE_TABS.map((tab) => tab.id),
);

/**
 * Tabs whose content is authored for one specific tenant.
 *
 * The architecture diagrams and evidence exhibits were written for a single client. Orientation
 * tabs are derived per tenant from that tenant's own canonical build and are safe for everyone;
 * these are not. Showing them to a second tenant would put one client's architecture on another
 * client's screen — the same cross-tenant leak that put a healthcare customer's name on airline
 * contract documents.
 */
const AUTHORED_TAB_IDS: ReadonlySet<HomeLandscapeTabId> = new Set([
  "architecture",
  "architectureEvidence",
  "evidence",
]);
/**
 * Retired tab ids, kept resolvable.
 *
 * The tab set was renamed from our deliverable sections to the reader's questions. Anyone holding
 * a `?view=economics` link — a bookmark, a link in a deck, a shared URL in an email thread — would
 * otherwise land on a shell with no panel selected. Each retired id maps to the tab that now
 * answers its question.
 */
const LEGACY_TAB_ALIASES: Partial<Record<string, HomeLandscapeTabId>> = {
  claudeReview: "architectureEvidence",
  summary: "identity",
  patterns: "identity",
  context: "explore",
  economics: "estate",
  posture: "standing",
  coherence: "explore",
  trajectory: "strategy",
  watchlist: "standing",
};

const TONE_CLASS: Record<SignalTone, string> = {
  blue: styles.barBlue,
  teal: styles.barTeal,
  amber: styles.barAmber,
  slate: styles.barSlate,
  red: styles.barRed,
};


const TILE_TONE_CLASS: Record<SignalTone, string> = {
  blue: styles.tileToneBlue,
  teal: styles.tileToneTeal,
  amber: styles.tileToneAmber,
  slate: styles.tileToneSlate,
  red: styles.tileToneRed,
};

const ARCHITECTURE_EVIDENCE_DIAGRAMS = [
  {
    id: "patterns-enterprise-operating-system",
    tab: "Patterns",
    title: "Enterprise operating system pattern map",
    subtitle:
      "Review-only generated candidate showing the enterprise operating pattern across domains, economics, evidence, and governance.",
  },
  {
    id: "economics-value-control",
    tab: "Economics",
    title: "Economics and value-control architecture",
    subtitle:
      "Review-only generated candidate; economics claims remain blocked until numeric reconciliation and overlap checks pass.",
  },
  {
    id: "posture-evidence-authority",
    tab: "Posture",
    title: "Evidence and authority posture map",
    subtitle:
      "Review-only generated candidate; evidence tiers and authority gates require deterministic semantic validation.",
  },
  {
    id: "coherence-domain-architecture-index",
    tab: "Coherence",
    title: "Scoped architecture diagram index",
    subtitle:
      "Review-only generated candidate showing scoped domains for digital, ERP, data/AI, and mainframe/private-cloud views.",
  },
  {
    id: "trajectory-executive-shifts",
    tab: "Trajectory",
    title: "Executive shift and gate map",
    subtitle:
      "Review-only generated candidate; future-state shifts and gates require approved authority before publication.",
  },
] as const;

function normalizeTabId(value: string | null): HomeLandscapeTabId | null {
  if (!value) return null;
  const alias = LEGACY_TAB_ALIASES[value];
  if (alias) return alias;
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
      if (normalizedView === "identity") {
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
    if (tab === "identity") {
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

function GeneratedArchitectureEvidencePanel() {
  return (
    <div className={styles.architectureEvidenceLayout}>
      <section className={styles.reviewWarning} aria-label="Review-only status">
        <div>
          <span>Review-only generated candidate</span>
          <strong>Not semantic validated. Not approved for publication.</strong>
          <p>
            These SVGs are retained generated outputs from the audit pack. They
            are visible here so reviewers can inspect them in Home, but they are
            not used by the normal Home tabs or approved content layer.
          </p>
        </div>
        <div className={styles.reviewStatusStack}>
          <span>SVG structural pass</span>
          <span>Semantic gate not run</span>
          <span>Human approval not granted</span>
        </div>
      </section>

      <div className={styles.reviewDiagramGrid}>
        {ARCHITECTURE_EVIDENCE_DIAGRAMS.map((diagram) => (
          <figure
            className={styles.authoredDiagramExhibit}
            key={diagram.id}
            aria-label={`${diagram.title} review-only generated SVG`}
          >
            <figcaption className={styles.authoredDiagramHeader}>
              <div>
                <span>{diagram.tab} candidate</span>
                <strong>{diagram.title}</strong>
                <p>{diagram.subtitle}</p>
              </div>
              <div className={styles.authoredDiagramMeta}>
                <span>generated diagram pack</span>
                <span>blocked pending semantic validation</span>
              </div>
            </figcaption>
            <div className={styles.authoredDiagramFrame}>
              {/* Review SVGs must render exactly as retained generated output. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.authoredDiagramImage}
                src={`/api/home/architecture-review/${diagram.id}`}
                alt={`${diagram.title} review-only generated architecture candidate`}
              />
            </div>
            <div className={styles.authoredDiagramSources}>
              <span>raw response retained</span>
              <span>stored SVG equals retained output</span>
              <span>review report only</span>
            </div>
          </figure>
        ))}
      </div>
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
      "Finance owns recognized value, not narrative generation",
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



/**
 * What Home says when no pack has been built for this tenant.
 *
 * Explicitly not an error, and explicitly not an empty panel. A blank tab reads as "this client has
 * no data", which is a different and far more damaging claim than "the build has not run".
 */
function OrientationPackAbsent() {
  return (
    <div className={styles.lead}>
      <h2>Not yet generated</h2>
      <p>
        No orientation pack has been built for this client. The canonical data may still be
        present — this panel reports the state of the build, not the state of the client&apos;s
        estate. Run the orientation build to populate it.
      </p>
    </div>
  );
}

function TabPanels({
  model,
  selectedTab,
  pack,
  showAuthoredTabs,
}: {
  model: HomeEnterpriseLandscapeV2Model;
  selectedTab: HomeLandscapeTabId;
  pack: OrientationPack | null;
  showAuthoredTabs: boolean;
}) {
  return (
    <div>
      {/* Orientation tabs render the stored pack. They are data-driven rather than authored, so a
          new canonical build changes what Home says without anyone editing this file — which is the
          whole reason the pack exists. Architecture and Evidence below stay authored. */}
      {HOME_LANDSCAPE_TABS.filter((tab) => tab.blocks).map((tab) => (
        <article
          className={styles.panel}
          id={`${tab.id}-panel`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={selectedTab !== tab.id}
          key={tab.id}
        >
          {pack ? (
            <>
              <OrientationProvenanceBar pack={pack} />
              <OrientationBlockPanel pack={pack} blockIds={tab.blocks ?? []} />
            </>
          ) : (
            <OrientationPackAbsent />
          )}
        </article>
      ))}

      <article
        className={styles.panel}
        id="explore-panel"
        role="tabpanel"
        aria-labelledby="tab-explore"
        hidden={selectedTab !== "explore"}
      >
        {pack ? (
          <>
            <OrientationProvenanceBar pack={pack} />
            <OrientationExplorePanel pack={pack} />
          </>
        ) : (
          <OrientationPackAbsent />
        )}
      </article>





      {showAuthoredTabs ? (
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
      ) : null}





      {showAuthoredTabs ? (
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
      ) : null}

      {showAuthoredTabs ? (
      <article
        className={styles.panel}
        id="architectureEvidence-panel"
        role="tabpanel"
        aria-labelledby="tab-architectureEvidence"
        hidden={selectedTab !== "architectureEvidence"}
      >
        <div>
          <h2>Generated architecture evidence</h2>
          <p className={styles.lead}>
            The generated architecture exhibits are visible here for inspection
            only. They remain outside the approved Home content path until
            deterministic semantic validation and human publication approval
            pass.
          </p>
        </div>
        <GeneratedArchitectureEvidencePanel />
      </article>
      ) : null}
    </div>
  );
}

export function HomeEnterpriseLandscapeV2({
  model = SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2,
  pack = null,
  showAuthoredTabs = true,
}: {
  model?: HomeEnterpriseLandscapeV2Model;
  /** Stored orientation pack. Null until a build has run for this tenant. */
  pack?: OrientationPack | null;
  /** False for tenants the authored architecture and evidence content was not written for. */
  showAuthoredTabs?: boolean;
}) {
  const visibleTabs = useMemo(
    () =>
      HOME_LANDSCAPE_TABS.filter(
        (tab) => showAuthoredTabs || !AUTHORED_TAB_IDS.has(tab.id),
      ),
    [showAuthoredTabs],
  );
  const [selectedTab, setSelectedTab] = useSelectedTab("identity");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selectedIndex = useMemo(
    () => visibleTabs.findIndex((tab) => tab.id === selectedTab),
    [visibleTabs, selectedTab],
  );

  const focusTab = useCallback(
    (index: number) => {
      const next =
        visibleTabs[
          (index + visibleTabs.length) % visibleTabs.length
        ];
      setSelectedTab(next.id);
      requestAnimationFrame(() => tabRefs.current[next.id]?.focus());
    },
    [setSelectedTab, visibleTabs],
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
        focusTab(visibleTabs.length - 1);
      }
    },
    [focusTab, selectedIndex, visibleTabs],
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
            {visibleTabs.map((tab) => (
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
          <TabPanels
            model={model}
            selectedTab={selectedTab}
            pack={pack}
            showAuthoredTabs={showAuthoredTabs}
          />
        </section>

        <div className={styles.footer}>
          Enterprise Landscape | Planning-grade view | Evidence available on
          demand
        </div>
      </div>
    </main>
  );
}
