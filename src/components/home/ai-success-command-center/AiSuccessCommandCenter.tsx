"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CurrentStateArchitectureMap } from "@/components/architecture/CurrentStateArchitectureMap";
import type { AiSuccessHomeData } from "@/lib/home/readSkyHarborAiSuccessHome";

import { ArchitectureFlowDiagram } from "./ArchitectureFlowDiagram";
import styles from "./AiSuccessCommandCenter.module.css";

const SECTIONS = [
  ["executive", "Advisory perspective", "Current evidence · pending review"],
  ["posture", "AI success posture", "Budget · tools · value proof"],
  ["attention", "Leadership attention", "5 material signals"],
  [
    "architecture",
    "Current-state architecture",
    "7 layers · 444 nodes · 586 relationships",
  ],
  ["portfolio", "Portfolio choices", "6 material choices"],
  ["value", "Value realization", "Funnel stops at usage"],
  ["agenda", "Agenda and decisions", "4 open decisions"],
  ["limits", "Evidence required next", "6 stated gaps"],
] as const;

type SectionId = (typeof SECTIONS)[number][0];

const SECTION_IDS = new Set<string>(SECTIONS.map(([id]) => id));

const CHART_COLORS = [
  "#11100f",
  "#6d6861",
  "#bd720f",
  "#b3261e",
  "#1688ff",
  "#15987f",
];

export function AiSuccessCommandCenter({ data }: { data: AiSuccessHomeData }) {
  const [activeSection, setActiveSection] = useState<SectionId>("executive");
  const [architectureOverlay, setArchitectureOverlay] = useState("");
  const [selectedArchitectureRef, setSelectedArchitectureRef] = useState<
    string | undefined
  >();

  const contractRatio =
    data.moneyBars[1]?.value && data.moneyBars[0]?.value
      ? data.moneyBars[1].value / data.moneyBars[0].value
      : 0;
  const aiCostRatio =
    data.moneyBars[2]?.value && data.moneyBars[0]?.value
      ? data.moneyBars[2].value / data.moneyBars[0].value
      : 0;
  useEffect(() => {
    const requested = window.location.hash.replace("#", "");
    if (SECTION_IDS.has(requested)) setActiveSection(requested as SectionId);
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  const activeMeta =
    SECTIONS.find(([id]) => id === activeSection) ?? SECTIONS[0];
  const activeIndex = SECTIONS.findIndex(([id]) => id === activeSection) + 1;

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.rail} aria-label="Home explorer">
          <div className={styles.railIntro}>
            <div className={styles.railTitle}>Executive Review</div>
            <div className={styles.railDeck}>
              AI value, architecture and evidence posture
            </div>
          </div>
          <div className={styles.railList}>
            {SECTIONS.map(([id, label, hint], index) => (
              <button
                key={id}
                type="button"
                className={`${styles.railButton} ${
                  activeSection === id ? styles.railButtonActive : ""
                }`}
                aria-current={activeSection === id ? "page" : undefined}
                onClick={() => {
                  setActiveSection(id);
                  window.scrollTo({ top: 0, left: 0 });
                }}
              >
                <span className={styles.railNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.railText}>
                  <span className={styles.railLabel}>{label}</span>
                  <span className={styles.railHint}>{hint}</span>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.railFoot}>
            <span>Graph snapshot</span>
            <strong>{data.graphFingerprint.slice(0, 8)}</strong>
            <span>{formatDate(data.generatedAt)}</span>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.canvasChrome}>
            <div>
              <span className={styles.eyebrow}>
                {String(activeIndex).padStart(2, "0")} · SkyHarbor Global
              </span>
              <h1 className={styles.canvasTitle}>{activeMeta[1]}</h1>
              <p className={styles.canvasSubtitle}>{activeMeta[2]}</p>
            </div>
            <div className={styles.commandStats} aria-label="Review context">
              <span>
                <b>{data.graph.nodes.length}</b>
                <small>nodes</small>
              </span>
              <span>
                <b>{data.graph.edges.length}</b>
                <small>relationships</small>
              </span>
              <span>
                <b>{data.moneyBars[0]?.valueLabel ?? "$2.35B"}</b>
                <small>FY2027 budget</small>
              </span>
              <Link
                href="/intelligence/enterprise-landscape"
                className={styles.openLink}
              >
                Intelligence explorer
              </Link>
            </div>
          </header>

          <section
            className={styles.canvas}
            data-active-section={activeSection}
            aria-live="polite"
          >
            {activeSection === "executive" ? (
              <ExecutiveCanvas
                data={data}
                contractRatio={contractRatio}
                aiCostRatio={aiCostRatio}
              />
            ) : null}
            {activeSection === "posture" ? <PostureCanvas data={data} /> : null}
            {activeSection === "attention" ? (
              <AttentionCanvas data={data} />
            ) : null}
            {activeSection === "architecture" ? (
              <ArchitectureCanvas
                data={data}
                overlay={architectureOverlay}
                selectedRef={selectedArchitectureRef}
                onOverlayChange={setArchitectureOverlay}
                onSelect={setSelectedArchitectureRef}
              />
            ) : null}
            {activeSection === "portfolio" ? (
              <PortfolioCanvas data={data} />
            ) : null}
            {activeSection === "value" ? (
              <ValueCanvas data={data} />
            ) : null}
            {activeSection === "agenda" ? <AgendaCanvas data={data} /> : null}
            {activeSection === "limits" ? <LimitsCanvas data={data} /> : null}
          </section>

          <footer className={styles.footer}>
            <span>
              Design bound to export {data.datasetId}, generated{" "}
              {formatDateTime(data.generatedAt)}.
            </span>
            <span>Home summarizes and routes; it is not a workspace.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function ExecutiveCanvas({
  data,
  contractRatio,
  aiCostRatio,
}: {
  data: AiSuccessHomeData;
  contractRatio: number;
  aiCostRatio: number;
}) {
  return (
    <div className={styles.executiveGrid}>
      <div className={styles.executiveStory}>
        <div className={styles.heroMeta}>
          <span>Current-state advisory</span>
          <span>Evidence-bound</span>
          <span>Pending review</span>
        </div>
        <h2 className={styles.h1}>
          AI is scaling across SkyHarbor. Value proof has not caught up.
        </h2>
        <p className={styles.lead}>
          SkyHarbor is running AI at real scale: coding assistants, BI copilots
          and ERP copilots against operations, crew, revenue management and
          customer recovery. Adoption is uneven but genuine.
        </p>
        <p className={styles.paragraph}>
          Of 162 governed value claims, none currently meets the claimable
          threshold, and Tower establishes $0 of claimable value. The barrier is
          structural: claims carry funding without a baseline, adoption rows
          carry telemetry without an outcome, and AI touches a Tier 1/Critical
          estate.
        </p>
        <Evidence
          refs={[
            "tower.value_claim · 162",
            "ALLOWED_VALUES · FY2027 $2.35B",
            "contracts · $1.4805B",
            "FIND-ARCH-AI-PROOF-GAP",
            `snapshot ${data.graphFingerprint.slice(0, 8)}`,
          ]}
        />
      </div>
      <aside className={`${styles.panel} ${styles.moneyPanel}`}>
        <span className={styles.eyebrow}>Where the money is</span>
        <h3 className={styles.panelTitle}>and where the proof is</h3>
        <div className={styles.barList}>
          {data.moneyBars.map((bar, index) => (
            <MoneyBar
              key={bar.label}
              {...bar}
              percent={
                index === 0
                  ? 100
                  : index === 1
                    ? contractRatio * 100
                    : index === 2
                      ? aiCostRatio * 100
                      : 0
              }
            />
          ))}
        </div>
      </aside>
    </div>
  );
}

function PostureCanvas({ data }: { data: AiSuccessHomeData }) {
  return (
    <>
      <SectionHeader
        kicker="02 · Posture"
        title="AI success posture"
        copy="Deterministic values only. Unknown value is named, never rendered as $0. The one zero shown is a Tower-established zero."
      />
      <div className={styles.grid4}>
        {data.postureCards.map((card) => (
          <article key={card.label} className={styles.postureCard}>
            <div>
              <div className={styles.postureLabel}>
                <StatusDot state={card.state} />
                {card.label}
              </div>
              <div className={styles.postureValue}>{card.value}</div>
            </div>
            <p className={styles.postureNote}>{card.note}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function AttentionCanvas({ data }: { data: AiSuccessHomeData }) {
  return (
    <>
      <SectionHeader
        kicker="03 · Attention"
        title="What leadership must look at this quarter"
        copy="Five material signals, each anchored to a deterministic finding or evidence gap."
      />
      <div className={styles.twoCol}>
        <div className={styles.signals}>
          {data.attentionSignals.map((signal) => (
            <article key={signal.ref} className={styles.signal}>
              <div className={styles.signalTop}>
                <span className={styles.signalRef}>{signal.ref}</span>
                <span className={styles.signalSeverity}>{signal.severity}</span>
              </div>
              <div className={styles.signalTitle}>{signal.title}</div>
              <p className={styles.signalBody}>{signal.body}</p>
              <Evidence refs={[signal.owner, signal.destination]} />
            </article>
          ))}
        </div>
        <div className={`${styles.panel} ${styles.chartBox}`}>
          <span className={styles.eyebrow}>Claim state pressure</span>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.claimFunnel}
              layout="vertical"
              margin={{ top: 20, right: 24, bottom: 12, left: 8 }}
            >
              <CartesianGrid stroke="#eee7dc" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={124}
                tick={{ fill: "#5d554b", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#d8d0c5" }}
              />
              <Bar dataKey="claims" radius={[0, 6, 6, 0]}>
                {data.claimFunnel.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function ArchitectureCanvas({
  data,
  overlay,
  selectedRef,
  onOverlayChange,
  onSelect,
}: {
  data: AiSuccessHomeData;
  overlay: string;
  selectedRef?: string;
  onOverlayChange: (overlay: string) => void;
  onSelect: (ref: string) => void;
}) {
  return (
    <div className={styles.architectureFrame}>
      <ArchitectureFlowDiagram data={data} onSelect={onSelect} />
      <div className={styles.architectureSecondary}>
        <div className={styles.secondaryHeader}>
          <div>
            <span className={styles.eyebrow}>Detailed explorer</span>
            <h3>Evidence graph</h3>
          </div>
          <Link
            href="/intelligence/enterprise-landscape"
            className={styles.secondaryLink}
          >
            Open full explorer
          </Link>
        </div>
        <CurrentStateArchitectureMap
          graph={data.graph}
          advisory={data.advisory}
          overlay={overlay}
          selectedRef={selectedRef}
          onOverlayChange={onOverlayChange}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function PortfolioCanvas({ data }: { data: AiSuccessHomeData }) {
  return (
    <>
      <SectionHeader
        kicker="05 · Portfolio"
        title="Scale, redesign, fix or stop"
        copy="Six material initiatives are shown as recommended lanes. Approved choices are governed separately and currently empty."
      />
      <div className={styles.choiceGrid}>
        {data.portfolioChoices.map((choice) => (
          <article key={choice.ref} className={styles.choice}>
            <div className={styles.choiceLane}>{choice.lane}</div>
            <div className={styles.choiceTitle}>{choice.project}</div>
            <p className={styles.choiceMeta}>
              Approved budget <b>{money(choice.budget)}</b>
              <br />
              Evidence: {choice.evidence}
              <br />
              Next gate: {choice.gate}
            </p>
            <Evidence refs={[choice.ref]} />
          </article>
        ))}
      </div>
    </>
  );
}

function ValueCanvas({
  data,
}: {
  data: AiSuccessHomeData;
}) {
  const [selectedToolRef, setSelectedToolRef] = useState(
    data.aiToolMix[0]?.evidenceRef ?? "",
  );
  const selectedTool =
    data.aiToolMix.find((tool) => tool.evidenceRef === selectedToolRef) ??
    data.aiToolMix[0];

  return (
    <>
      <SectionHeader
        kicker="06 · Value"
        title="Value realization funnel"
        copy="Tower states are deterministic. Usage, seats and hours-saved estimates are not realized value."
      />
      <div className={styles.twoCol}>
        <div className={`${styles.panel} ${styles.chartBox}`}>
          <ResponsiveContainer width="100%" height={320}>
            <FunnelChart>
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#d8d0c5" }}
              />
              <Funnel dataKey="claims" data={data.claimFunnel} nameKey="name">
                <LabelList
                  dataKey="name"
                  position="right"
                  fill="#11100f"
                  stroke="none"
                />
                {data.claimFunnel.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
        <div className={`${styles.panel} ${styles.chartBox}`}>
          <span className={styles.eyebrow}>Observation coverage</span>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.observationQuality}
              margin={{ top: 20, right: 12, left: 0, bottom: 72 }}
            >
              <CartesianGrid stroke="#eee7dc" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#5d554b", fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: "#5d554b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#d8d0c5" }}
              />
              <Bar dataKey="count" fill="#11100f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={`${styles.panel} ${styles.panelPad}`}>
        <div className={styles.toolUsageHeader}>
          <div>
            <span className={styles.eyebrow}>AI tool evidence</span>
            <p className={styles.sectionCopy}>
              Tool usage is a telemetry lens, not a value claim. Rows below
              aggregate tool-period observations from{" "}
              {data.aiToolUsageSummary.source}; active users and seats are
              observation totals, not deduped people.
            </p>
          </div>
          <div className={styles.toolUsageStats}>
            <span>
              <b>{formatInt(data.aiToolUsageSummary.rowCount)}</b>
              tool-period rows
            </span>
            <span>
              <b>{formatInt(data.aiToolUsageSummary.activeUserObservations)}</b>
              active-user observations
            </span>
            <span>
              <b>{money(data.aiToolUsageSummary.estimatedUseCost)}</b>
              estimated use cost
            </span>
          </div>
        </div>
        <div className={styles.toolUsageGrid}>
          <div className={styles.toolUsageList}>
            {data.aiToolMix.map((tool) => (
              <button
                key={tool.evidenceRef}
                type="button"
                className={`${styles.toolUsageRow} ${
                  selectedTool?.evidenceRef === tool.evidenceRef
                    ? styles.toolUsageRowActive
                    : ""
                }`}
                onClick={() => setSelectedToolRef(tool.evidenceRef)}
                onDoubleClick={() => setSelectedToolRef(tool.evidenceRef)}
              >
                <span>
                  <b>{tool.name}</b>
                  <small>
                    {tool.vendor} · {tool.category}
                  </small>
                </span>
                <span className={styles.toolMetric}>{money(tool.cost)}</span>
                <span className={styles.toolMetric}>
                  {formatInt(tool.activeUsers)} active obs.
                </span>
              </button>
            ))}
          </div>
          {selectedTool ? (
            <aside className={styles.toolDrill}>
              <div className={styles.choiceLane}>Tool usage drill</div>
              <h3>{selectedTool.name}</h3>
              <dl>
                <div>
                  <dt>Usage grain</dt>
                  <dd>Aggregated tool-period observations for this tool</dd>
                </div>
                <div>
                  <dt>Seats</dt>
                  <dd>
                    {formatInt(selectedTool.seatsAssigned)} assigned of{" "}
                    {formatInt(selectedTool.seatsPurchased)} purchased
                  </dd>
                </div>
                <div>
                  <dt>Active-user observations</dt>
                  <dd>{formatInt(selectedTool.activeUsers)}</dd>
                </div>
                <div>
                  <dt>Estimated use cost</dt>
                  <dd>{money(selectedTool.cost)}</dd>
                </div>
                <div>
                  <dt>Evidence state</dt>
                  <dd>{selectedTool.evidence}</dd>
                </div>
                <div>
                  <dt>Governance / risk</dt>
                  <dd>
                    {selectedTool.governance}; {selectedTool.riskIssue}
                  </dd>
                </div>
              </dl>
              <Evidence refs={[selectedTool.evidenceRef, selectedTool.sourceRow]} />
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}

function AgendaCanvas({ data }: { data: AiSuccessHomeData }) {
  return (
    <>
      <SectionHeader
        kicker="07 · Agenda"
        title="What must change, and what must be decided"
        copy="Decisions are proposed routes, not approved governance outcomes."
      />
      <div className={styles.panel}>
        <table className={styles.decisionTable}>
          <thead>
            <tr>
              <th>Decision</th>
              <th>Consequence of delay</th>
              <th>Accountable</th>
              <th>Destination</th>
            </tr>
          </thead>
          <tbody>
            {data.decisions.map((item) => (
              <tr key={item.decision}>
                <td>
                  <b>{item.decision}</b>
                </td>
                <td>{item.consequence}</td>
                <td>{item.owner}</td>
                <td>{item.destination}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LimitsCanvas({ data }: { data: AiSuccessHomeData }) {
  return (
    <>
      <SectionHeader
        kicker="08 · Evidence required"
        title="Evidence required next"
        copy="Stated, not filled with inference. This is part of the product promise."
      />
      <div className={styles.limitsGrid}>
        {data.limits.map((limit) => (
          <article key={limit.title} className={styles.limit}>
            <div className={styles.choiceTitle}>{limit.title}</div>
            <p className={styles.choiceMeta}>{limit.body}</p>
            <span className={styles.chip}>Owner · {limit.owner}</span>
          </article>
        ))}
      </div>
    </>
  );
}

function SectionHeader({
  kicker,
  title,
  copy,
  right,
}: {
  kicker: string;
  title: string;
  copy: string;
  right?: string;
}) {
  return (
    <header className={styles.sectionHeader}>
      <div>
        <span className={styles.sectionKicker}>{kicker}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionCopy}>{copy}</p>
      </div>
      {right ? <span className={styles.signalRef}>{right}</span> : null}
    </header>
  );
}

function MoneyBar({
  label,
  valueLabel,
  note,
  tone,
  percent,
}: {
  label: string;
  valueLabel: string;
  note: string;
  tone: string;
  percent: number;
}) {
  return (
    <div className={styles.moneyLine}>
      <div className={styles.moneyLabel}>
        <span>{label}</span>
        <span className={styles.moneyValue}>{valueLabel}</span>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${
            tone === "amber" ? styles.fillAmber : ""
          } ${tone === "danger" ? styles.fillDanger : ""}`}
          style={{ width: `${Math.max(1, Math.min(100, percent))}%` }}
        />
      </div>
      <p className={styles.moneyNote}>{note}</p>
    </div>
  );
}

function Evidence({ refs }: { refs: string[] }) {
  return (
    <div className={styles.evidenceRow}>
      {refs.map((ref) => (
        <span key={ref} className={styles.chip}>
          {ref}
        </span>
      ))}
    </div>
  );
}

function StatusDot({ state }: { state: string }) {
  const className =
    state === "good"
      ? styles.statusGood
      : state === "directional"
        ? styles.statusDirectional
        : state === "blocked"
          ? styles.statusBlocked
          : styles.statusUnknown;
  return <span className={className} aria-hidden />;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInt(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function money(value: number) {
  if (!value) return "Not established";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
