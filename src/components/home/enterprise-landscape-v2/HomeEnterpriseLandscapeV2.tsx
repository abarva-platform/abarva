"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  HOME_LANDSCAPE_TABS,
  SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2,
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

function isTabId(value: string | null): value is HomeLandscapeTabId {
  return Boolean(value && TAB_IDS.has(value as HomeLandscapeTabId));
}

function useSelectedTab(defaultTab: HomeLandscapeTabId) {
  const [selectedTab, setSelectedTabState] =
    useState<HomeLandscapeTabId>(defaultTab);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (isTabId(view)) setSelectedTabState(view);
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

function SparkBar({ item }: { item: MetricAnchor | EconomicRow }) {
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

function BarRows({ rows }: { rows: EconomicRow[] }) {
  return (
    <div className={styles.barRows} aria-label="Economic trend rows">
      {rows.map((row) => (
        <div className={styles.metricRow} key={row.label}>
          <div className={styles.metricLabel}>
            {row.label}
            <small>{row.detail}</small>
          </div>
          <div className={styles.barTrack} aria-hidden="true">
            <div
              className={`${styles.barFill} ${TONE_CLASS[row.tone]}`}
              style={{ width: `${Math.max(3, Math.min(100, row.ratio * 100))}%` }}
            />
          </div>
          <div className={styles.metricValue}>{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function CoherenceMap({
  model,
}: {
  model: HomeEnterpriseLandscapeV2Model;
}) {
  const [a, b, c, d] = model.coherence;
  return (
    <div className={`${styles.visualPanel} ${styles.coherenceMap}`}>
      <div className={styles.visualTitle}>
        <strong>Relationship view</strong>
        <span>Governed dependency path</span>
      </div>
      <svg
        className={styles.mapSvg}
        viewBox="0 0 100 74"
        role="img"
        aria-label="Enterprise relationship map"
      >
        {[a, b, c, d].filter(Boolean).map((node, index, nodes) => {
          const next = nodes[index + 1];
          if (!next) return null;
          return (
            <line
              key={`${node.label}-${next.label}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke="#cbd5e1"
              strokeWidth="0.9"
              strokeDasharray={index === nodes.length - 2 ? "2 2" : "0"}
            />
          );
        })}
        {model.coherence.map((node) => (
          <g className={styles.mapNode} key={node.label}>
            <circle
              cx={node.x}
              cy={node.y}
              r="8"
              fill={TONE_HEX[node.tone]}
              opacity="0.96"
            />
            <text
              x={node.x}
              y={node.y + 0.8}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize="3.6"
              fontWeight="800"
            >
              {node.label
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)}
            </text>
            <text x={node.x} y={node.y + 13} textAnchor="middle" fontSize="3.2">
              {node.label}
            </text>
            <text
              x={node.x}
              y={node.y + 17}
              textAnchor="middle"
              fontSize="2.7"
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

function TabPanels({ model, selectedTab }: {
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
        id="economics-panel"
        role="tabpanel"
        aria-labelledby="tab-economics"
        hidden={selectedTab !== "economics"}
      >
        <div className={styles.twoCol}>
          <div>
            <h2>Economics without value overclaim</h2>
            <p className={styles.lead}>
              Home can show governed budget, spend, and contract posture, but
              it must not convert unknown or specialist Tower value status into
              a broad enterprise conclusion.
            </p>
          </div>
          <div className={styles.visualPanel}>
            <div className={styles.visualTitle}>
              <strong>Publication guardrail</strong>
              <span>Money stays deterministic</span>
            </div>
            <BarRows rows={model.economics} />
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
          <h2>Current posture by evidence domain</h2>
          <p className={styles.lead}>
            Posture is expressed as evidence, authority, value state, and
            attention area. It is not a Claude-generated score.
          </p>
        </div>
        <div className={styles.postureTable}>
          <div className={`${styles.postureRow} ${styles.postureHead}`}>
            <div>Domain</div>
            <div>Evidence</div>
            <div>Authority</div>
            <div>Value state</div>
            <div>Attention</div>
          </div>
          {model.posture.map((row) => (
            <div className={styles.postureRow} key={row.domain}>
              <div data-label="Domain">{row.domain}</div>
              <div data-label="Evidence">{row.evidence}</div>
              <div data-label="Authority">{row.authority}</div>
              <div data-label="Value state">{row.valueState}</div>
              <div data-label="Attention">{row.attention}</div>
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
        <div className={styles.twoCol}>
          <div>
            <h2>Enterprise coherence map</h2>
            <p className={styles.lead}>
              The map is a governed relationship slice. It explains dependency
              paths; it does not define canonical relationships or calculate
              value.
            </p>
          </div>
          <CoherenceMap model={model} />
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
          <h2>Trajectory requires authority</h2>
          <p className={styles.lead}>
            Direction language lives here, not on Summary. Each shift separates
            current state, potential direction, authority, gate, and module
            route.
          </p>
        </div>
        <div className={styles.shiftTable}>
          <div className={`${styles.shiftRow} ${styles.postureHead}`}>
            <div>Area</div>
            <div>Current</div>
            <div>Potential</div>
            <div>Authority</div>
            <div>Gate</div>
            <div>Route</div>
          </div>
          {model.trajectory.map((row) => (
            <div className={styles.shiftRow} key={row.area}>
              <div data-label="Area">{row.area}</div>
              <div data-label="Current">{row.current}</div>
              <div data-label="Potential">{row.potential}</div>
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
          <h2>Evidence and content provenance</h2>
          <p className={styles.lead}>
            This render reflects the V0.2.3 product contract. Production
            approval still requires HomeEnterpriseEvidenceV2, one Claude
            synthesis, raw-response retention, and narrative validation.
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

        <section className={styles.canvas} aria-label="Enterprise Landscape canvas">
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

