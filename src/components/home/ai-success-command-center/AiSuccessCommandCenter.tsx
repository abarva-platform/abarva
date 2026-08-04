"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Pie,
  PieChart,
  ReferenceArea,
  Scatter,
  ScatterChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { CurrentStateArchitectureMap } from "@/components/architecture/CurrentStateArchitectureMap";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { composeHomeKnowAvaAnswer } from "@/lib/ava-answer/homeComposer";
import type { AiSuccessHomeData } from "@/lib/home/readSkyHarborAiSuccessHome";
import { readHomeKnowStream } from "@/lib/home/know/home-know-stream-client";

import { ArchitectureFlowDiagram } from "./ArchitectureFlowDiagram";
import styles from "./AiSuccessCommandCenter.module.css";

const SECTIONS = [
  ["executive", "Advisory perspective", "Current evidence · pending review"],
  ["posture", "AI success posture", "162 claims · $0 claimable"],
  ["attention", "Leadership attention", "5 material signals"],
  [
    "architecture",
    "Current-state architecture",
    "7 layers · 444 nodes · 586 edges",
  ],
  ["portfolio", "Portfolio choices", "6 of 150 initiatives"],
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
  const [avaOpen, setAvaOpen] = useState(false);
  const [avaExpanded, setAvaExpanded] = useState(false);

  const contractRatio =
    data.moneyBars[1]?.value && data.moneyBars[0]?.value
      ? data.moneyBars[1].value / data.moneyBars[0].value
      : 0;
  const aiCostRatio =
    data.moneyBars[2]?.value && data.moneyBars[0]?.value
      ? data.moneyBars[2].value / data.moneyBars[0].value
      : 0;
  const pieData = useMemo(
    () => [
      {
        name: "Contract-backed",
        value: Math.round(contractRatio * 1000) / 10,
      },
      {
        name: "Internal/unattributed",
        value: Math.round((1 - contractRatio) * 1000) / 10,
      },
    ],
    [contractRatio],
  );

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
                <small>flows</small>
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
              <button
                type="button"
                className={styles.askAvaCommand}
                onClick={() => {
                  setAvaOpen(true);
                  setAvaExpanded(true);
                }}
              >
                Ask aVa
              </button>
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
              <ValueCanvas data={data} pieData={pieData} />
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
      <button
        type="button"
        className={styles.avaTab}
        onClick={() => {
          setAvaOpen(true);
          setAvaExpanded(false);
        }}
      >
        <span className={styles.avaV}>V</span>
        <span className={styles.avaLabel}>Ask aVa</span>
      </button>
      <HomeCommandCenterAva
        expanded={avaExpanded}
        open={avaOpen}
        onClose={() => setAvaOpen(false)}
        onExpandChange={setAvaExpanded}
        tenantKey={data.tenantKey}
        tenantName={data.tenantName}
      />
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
  const [activeTabId, setActiveTabId] = useState(
    data.advisoryTabs[0]?.id ?? "thesis",
  );
  const activeTab =
    data.advisoryTabs.find((tab) => tab.id === activeTabId) ??
    data.advisoryTabs[0];

  return (
    <div className={styles.advisoryShell}>
      <div
        className={styles.advisoryTabs}
        role="tablist"
        aria-label="Advisory story"
      >
        {data.advisoryTabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab?.id === tab.id}
            aria-controls={`advisory-panel-${tab.id}`}
            id={`advisory-tab-${tab.id}`}
            className={`${styles.advisoryTab} ${
              activeTab?.id === tab.id ? styles.advisoryTabActive : ""
            }`}
            onClick={() => {
              setActiveTabId(tab.id);
              requestAnimationFrame(() => {
                window.scrollTo({ top: 0, left: 0 });
              });
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab ? (
        <div
          id={`advisory-panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`advisory-tab-${activeTab.id}`}
          className={`${styles.advisoryPanel} ${
            activeTab.id === "ai-shift" ? styles.advisoryPanelMatrix : ""
          }`}
        >
          <article className={styles.advisoryStory}>
            <div className={styles.heroMeta}>
              <span>{activeTab.kicker}</span>
              <span>Evidence-bound</span>
              <span>Human review required</span>
            </div>
            <h2 className={styles.h1}>{activeTab.headline}</h2>
            {activeTab.id === "ai-shift" ? (
              <AdvisoryValueMatrix data={data} />
            ) : null}
            <p className={styles.lead}>{activeTab.read}</p>
            <div className={styles.advisoryPointGrid}>
              {activeTab.points.map((point) => (
                <div key={point.label} className={styles.advisoryPoint}>
                  <span>{point.label}</span>
                  <p>{point.body}</p>
                </div>
              ))}
            </div>
            <Evidence refs={activeTab.evidenceRefs} />
          </article>

          {activeTab.id !== "ai-shift" ? (
            <aside className={`${styles.panel} ${styles.advisoryAside}`}>
              <span className={styles.eyebrow}>Executive proof stack</span>
              {activeTab.callout ? (
                <div className={styles.advisoryCallout}>
                  <span>{activeTab.callout.label}</span>
                  <strong>{activeTab.callout.value}</strong>
                  <p>{activeTab.callout.note}</p>
                </div>
              ) : null}
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AdvisoryValueMatrix({ data }: { data: AiSuccessHomeData }) {
  const matrixData = data.advisoryValueMatrix.map((idea) => ({
    ...idea,
    z:
      idea.valuePotential === "High"
        ? 520
        : idea.valuePotential === "Medium"
          ? 430
          : 340,
  }));

  return (
    <div className={styles.valueMatrixShell}>
      <div className={styles.matrixIntro}>
        <div>
          <span className={styles.eyebrow}>Value priority matrix</span>
          <h3>Where the first dollar goes</h3>
        </div>
        <p>
          Value potential x execution readiness. Use this as a workshop frame:
          outside-in value ideas move only when source owners validate the
          evidence gate.
        </p>
      </div>
      <div
        className={styles.matrixChartCard}
        aria-label="AI use case priority matrix"
      >
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 20, right: 24, bottom: 34, left: 40 }}>
            <CartesianGrid stroke="#ffffff" strokeWidth={1.5} />
            <ReferenceArea x1={0} x2={33.33} y1={0} y2={33.33} fill="#eef2f6" />
            <ReferenceArea
              x1={0}
              x2={33.33}
              y1={33.33}
              y2={66.66}
              fill="#eef2f6"
            />
            <ReferenceArea
              x1={0}
              x2={33.33}
              y1={66.66}
              y2={100}
              fill="#f3ead6"
            />
            <ReferenceArea
              x1={33.33}
              x2={66.66}
              y1={0}
              y2={33.33}
              fill="#eef2f6"
            />
            <ReferenceArea
              x1={33.33}
              x2={66.66}
              y1={33.33}
              y2={66.66}
              fill="#f3ead6"
            />
            <ReferenceArea
              x1={33.33}
              x2={66.66}
              y1={66.66}
              y2={100}
              fill="#dcece5"
            />
            <ReferenceArea
              x1={66.66}
              x2={100}
              y1={0}
              y2={33.33}
              fill="#f3ead6"
            />
            <ReferenceArea
              x1={66.66}
              x2={100}
              y1={33.33}
              y2={66.66}
              fill="#dcece5"
            />
            <ReferenceArea
              x1={66.66}
              x2={100}
              y1={66.66}
              y2={100}
              fill="#dcece5"
            />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 100]}
              ticks={[16.66, 50, 83.33]}
              tickFormatter={readinessTick}
              tick={{ fill: "#5f6f88", fontSize: 11, fontWeight: 800 }}
              axisLine={{ stroke: "rgba(12, 26, 58, 0.26)" }}
              tickLine={false}
              label={{
                value: "Execution readiness",
                position: "insideBottom",
                offset: -24,
                fill: "#0c1a3a",
                fontSize: 11,
                fontWeight: 800,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 100]}
              ticks={[16.66, 50, 83.33]}
              tickFormatter={readinessTick}
              tick={{ fill: "#5f6f88", fontSize: 11, fontWeight: 800 }}
              axisLine={{ stroke: "rgba(12, 26, 58, 0.26)" }}
              tickLine={false}
              label={{
                value: "Value potential",
                angle: -90,
                position: "insideLeft",
                fill: "#0c1a3a",
                fontSize: 11,
                fontWeight: 800,
              }}
            />
            <ZAxis type="number" dataKey="z" range={[620, 1220]} />
            <Tooltip content={<MatrixTooltipContent />} />
            <Scatter data={matrixData} isAnimationActive={false}>
              {matrixData.map((idea) => (
                <Cell key={idea.id} fill={matrixColor(idea.zone)} />
              ))}
              <LabelList
                dataKey="shortLabel"
                position="inside"
                fill="#ffffff"
                fontSize={9.5}
                fontWeight={900}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.matrixLegend}>
        <span>
          <i className={styles.legendInvest} />
          Invest now
        </span>
        <span>
          <i className={styles.legendBuild} />
          Build selectively
        </span>
        <span>
          <i className={styles.legendMonitor} />
          Monitor
        </span>
      </div>
      <div className={styles.matrixIdeaList}>
        {data.advisoryValueMatrix.map((idea) => (
          <article key={idea.id}>
            <span>{idea.zone.replace("-", " ")}</span>
            <strong>{idea.title}</strong>
            <p>{idea.note}</p>
            <small>{idea.evidenceGate}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function readinessTick(value: number) {
  if (value < 34) return "Low";
  if (value < 67) return "Medium";
  return "High";
}

function matrixColor(
  zone: AiSuccessHomeData["advisoryValueMatrix"][number]["zone"],
) {
  if (zone === "invest") return "#173e6d";
  if (zone === "build") return "#9b6418";
  return "#66758d";
}

function MatrixTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: AiSuccessHomeData["advisoryValueMatrix"][number];
  }>;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const idea = payload[0].payload;
  return (
    <div className={styles.matrixTooltip}>
      <span>{idea.zone.replace("-", " ")}</span>
      <strong>{idea.title}</strong>
      <p>{idea.note}</p>
      <small>{idea.evidenceGate}</small>
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
  pieData,
}: {
  data: AiSuccessHomeData;
  pieData: Array<{ name: string; value: number }>;
}) {
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
            <FunnelChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#d8d0c5" }}
              />
              <Funnel
                dataKey="claims"
                data={data.claimFunnel}
                nameKey="name"
                isAnimationActive={false}
              >
                {data.claimFunnel.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <div className={styles.funnelLegend} aria-label="Claim funnel stages">
            {data.claimFunnel.map((stage, index) => (
              <span key={stage.name}>
                <i
                  style={{
                    background: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <b>{stage.name}</b>
                {stage.claims}
              </span>
            ))}
          </div>
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
                tickFormatter={formatObservationLabel}
                tick={{ fill: "#5d554b", fontSize: 10 }}
                angle={-28}
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
        <div className={styles.twoColTight}>
          <div>
            <span className={styles.eyebrow}>AI tool evidence</span>
            <p className={styles.sectionCopy}>
              Top AI rows show adoption and directional use cost. They do not
              establish realized value.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={86}
                paddingAngle={3}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#d8d0c5" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function formatObservationLabel(value: string) {
  return value.replace(" present", "").replace("business metric", "business");
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

type HomeAvaTurn = {
  id: string;
  question: string;
  answer: AvaAnswerPacket | null;
  loading: boolean;
  error: string | null;
  status: string | null;
};

const HOME_AVA_SUGGESTIONS = [
  "What is the highest-leverage architecture decision on this page?",
  "Draw the value-proof funnel and explain where it breaks.",
  "Show the loaded context dimensions in a table.",
  "Which current-state architecture dependencies block AI scale?",
  "What should go to Tower, Source, Moves, or Intelligence next?",
];

function HomeCommandCenterAva({
  expanded,
  open,
  onClose,
  onExpandChange,
  tenantKey,
  tenantName,
}: {
  expanded: boolean;
  open: boolean;
  onClose: () => void;
  onExpandChange: (expanded: boolean) => void;
  tenantKey: string;
  tenantName: string;
}) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<HomeAvaTurn[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, turns.length]);

  const ask = useCallback(
    async (rawQuestion: string) => {
      const trimmed = rawQuestion.trim();
      if (!trimmed) return;
      const id = newTurnId();
      setQuestion("");
      resetTextarea(textareaRef.current);
      setTurns((current) => [
        ...current,
        {
          id,
          question: trimmed,
          answer: null,
          loading: true,
          error: null,
          status: "Starting Home context lookup...",
        },
      ]);

      const patchTurn = (
        patch: Partial<Omit<HomeAvaTurn, "id" | "question">>,
      ) =>
        setTurns((current) =>
          current.map((turn) =>
            turn.id === id ? { ...turn, ...patch } : turn,
          ),
        );

      try {
        const response = await fetch("/api/home/know/ask", {
          method: "POST",
          headers: {
            Accept: "application/x-ndjson",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmed,
            tenantKey,
            client: tenantKey,
            stream: true,
          }),
        });
        const payload = await readHomeKnowStream(response, (event) => {
          if (event.label) patchTurn({ status: event.label });
        });
        patchTurn({
          loading: false,
          answer: composeHomeKnowAvaAnswer(payload),
        });
      } catch {
        patchTurn({
          loading: false,
          error: "aVa could not reach the Home KNOW provider.",
        });
      }
    },
    [tenantKey],
  );

  if (!open) return null;

  return (
    <aside
      aria-label="Ask aVa about Home knowledge"
      className={`${styles.avaDrawer} ${
        expanded ? styles.avaDrawerExpanded : ""
      }`}
    >
      <header className={styles.avaDrawerHeader}>
        <div className={styles.avaTitleBlock}>
          <AvaAskMark />
          <div>
            <div className={styles.avaDrawerTitle}>Ask aVa</div>
            <p>Home KNOW reasoning for {tenantName}</p>
          </div>
        </div>
        <div className={styles.avaDrawerActions}>
          <button
            type="button"
            onClick={() => onExpandChange(!expanded)}
            aria-label={expanded ? "Collapse aVa" : "Expand aVa"}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
          <button type="button" onClick={onClose} aria-label="Close aVa">
            Close
          </button>
        </div>
      </header>
      <div className={styles.avaDrawerBody}>
        {turns.length === 0 ? (
          <div className={styles.avaStarter}>
            <p>
              aVa binds questions to the Home context and knowledge layer, then
              renders tables, charts, relationship exhibits, and evidence-bound
              caveats through the shared answer renderer.
            </p>
            <div className={styles.avaSuggestionGrid}>
              {HOME_AVA_SUGGESTIONS.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => void ask(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.avaThread} aria-label="aVa conversation">
            {turns.map((turn) => (
              <article className={styles.avaTurn} key={turn.id}>
                <div className={styles.avaQuestion}>{turn.question}</div>
                {turn.loading ? (
                  <div className={styles.avaLoading} role="status">
                    {turn.status ?? "Binding Home context and reasoning..."}
                  </div>
                ) : turn.error ? (
                  <div className={styles.avaError} role="status">
                    {turn.error}
                  </div>
                ) : turn.answer ? (
                  <div className={styles.avaAnswer}>
                    <AgentAnswerRenderer
                      answer={turn.answer}
                      showChrome={expanded}
                      showExport={expanded}
                    />
                  </div>
                ) : null}
              </article>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
      <form
        className={styles.avaPrompt}
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <textarea
          ref={textareaRef}
          aria-label="Ask aVa"
          placeholder="Ask aVa about the Home context, architecture, proof gaps, or next decisions..."
          rows={1}
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value);
            resizeTextarea(event.currentTarget);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void ask(question);
            }
          }}
        />
        <button type="submit" disabled={!question.trim()}>
          Ask
        </button>
      </form>
      <div className={styles.avaGuardrail}>
        Home can summarize and reason over loaded context. Write actions,
        promotions, baseline activation, and publication still require human
        approval.
      </div>
    </aside>
  );
}

function newTurnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(150, el.scrollHeight)}px`;
}

function resetTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
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

function money(value: number) {
  if (!value) return "Not established";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
