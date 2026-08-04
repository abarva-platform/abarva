"use client";

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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { CurrentStateArchitectureMap } from "@/components/architecture/CurrentStateArchitectureMap";
import { composeHomeKnowAvaAnswer } from "@/lib/ava-answer/homeComposer";
import type { AiSuccessHomeData } from "@/lib/home/readSkyHarborAiSuccessHome";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

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

const CHART_COLORS = [
  "#11100f",
  "#6d6861",
  "#bd720f",
  "#b3261e",
  "#1688ff",
  "#15987f",
];

export function AiSuccessCommandCenter({ data }: { data: AiSuccessHomeData }) {
  const [activeSection, setActiveSection] = useState("executive");
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
  const pieData = [
    { name: "Contract-backed", value: Math.round(contractRatio * 1000) / 10 },
    {
      name: "Internal/unattributed",
      value: Math.round((1 - contractRatio) * 1000) / 10,
    },
  ];
  const advisoryPillars = [
    {
      label: "Strategic strength",
      title:
        data.advisory.strengths[0]?.headline ??
        "Evidence coverage is strong enough for real portfolio choices",
      body:
        data.advisory.strengths[0]?.body ??
        "The current-state architecture packet gives leadership a reliable starting point for sequencing decisions.",
    },
    {
      label: "Constraint",
      title:
        data.advisory.constraints[0]?.headline ??
        "Lifecycle contradictions are blocking execution",
      body:
        data.advisory.constraints[0]?.body ??
        "Critical systems need executive resolution before AI scale can be defended.",
    },
    {
      label: "Decision",
      title:
        advisoryText(data.advisory.leadershipDecisions[0], [
          "headline",
          "decision",
        ]) ?? "Resolve the first non-deferrable architecture decision",
      body:
        advisoryText(data.advisory.leadershipDecisions[0], [
          "body",
          "context",
        ]) ??
        "Architecture ambiguity should be converted into an accountable leadership decision.",
    },
  ];

  const sectionObserver = useMemo(
    () => (id: string) => (node: HTMLElement | null) => {
      if (!node || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [],
  );

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.brand}>
            Abar<span className={styles.brandVa}>Va</span>
          </span>
          <span className={styles.domain}>app.abarva.ai</span>
        </div>
        <nav className={styles.nav} aria-label="Primary">
          {["Home", "Intelligence", "Source", "Tower", "Moves"].map((item) => (
            <button
              key={item}
              className={`${styles.navItem} ${item === "Home" ? styles.navItemActive : ""}`}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.blueButton}
            onClick={() => {
              setAvaOpen(true);
              setAvaExpanded(true);
            }}
          >
            V&nbsp; Ask aVa
          </button>
          <span className={styles.tenant}>SkyHarbor Global</span>
          <span className={styles.avatar}>AK</span>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.rail}>
          <div className={styles.railTitle}>On this page</div>
          <div className={styles.railList}>
            {SECTIONS.map(([id, label, hint], index) => (
              <button
                key={id}
                type="button"
                className={`${styles.railButton} ${activeSection === id ? styles.railButtonActive : ""}`}
                onClick={() =>
                  document
                    .getElementById(id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <span className={styles.railNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className={styles.railLabel}>{label}</span>
                  <span className={styles.railHint}>{hint}</span>
                </span>
              </button>
            ))}
          </div>
          <p className={styles.railFoot}>
            Snapshot {data.graphFingerprint.slice(0, 8)} ·{" "}
            {formatDate(data.generatedAt)}. Home summarizes and routes; it is
            not a workspace.
          </p>
        </aside>

        <main className={styles.main}>
          <section
            id="executive"
            ref={sectionObserver("executive")}
            className={`${styles.section} ${styles.heroGrid}`}
          >
            <div>
              <div className={styles.heroKicker}>Architecture Advisory</div>
              <h1 className={styles.h1}>{data.advisory.title}</h1>
              <p className={styles.lead}>{data.advisory.executiveThesis}</p>
              <div className={styles.advisoryPillars}>
                {advisoryPillars.map((pillar) => (
                  <article key={pillar.label} className={styles.advisoryPillar}>
                    <span>{pillar.label}</span>
                    <strong>{pillar.title}</strong>
                    <p>{pillar.body}</p>
                  </article>
                ))}
              </div>
              <Evidence
                refs={[
                  "Claude architecture advisory",
                  "tower.value_claim · 162",
                  "ALLOWED_VALUES · FY2027 $2.35B",
                  "contracts · $1.4805B",
                  "FIND-ARCH-AI-PROOF-GAP",
                  `snapshot ${data.graphFingerprint.slice(0, 8)}`,
                ]}
              />
            </div>
            <aside className={`${styles.panel} ${styles.moneyPanel}`}>
              <span className={styles.eyebrow}>Board readout</span>
              <h2 className={styles.panelTitle}>What must be resolved first</h2>
              <p className={styles.panelBrief}>
                {advisoryText(data.advisory.transformationPriorities[0], [
                  "body",
                  "rationale",
                ]) ??
                  "Resolve the gating architecture and value-proof decisions before scaling the AI portfolio."}
              </p>
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
          </section>

          <section
            id="posture"
            ref={sectionObserver("posture")}
            className={styles.section}
          >
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
          </section>

          <section
            id="attention"
            ref={sectionObserver("attention")}
            className={styles.section}
          >
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
                      <span className={styles.signalSeverity}>
                        {signal.severity}
                      </span>
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
                      width={120}
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
          </section>

          <section
            id="architecture"
            ref={sectionObserver("architecture")}
            className={styles.section}
          >
            <SectionHeader
              kicker="04 · Current-state architecture"
              title="How SkyHarbor is positioned for AI success"
              copy="The centerpiece uses the PostgreSQL-derived ArchitectureGraph. Claude provides callouts only; it cannot create current-state nodes, edges or values."
              right="Full explorer in Intelligence →"
            />
            <div className={styles.architectureFrame}>
              <CurrentStateArchitectureMap
                graph={data.graph}
                advisory={data.advisory}
                overlay={architectureOverlay}
                selectedRef={selectedArchitectureRef}
                onOverlayChange={setArchitectureOverlay}
                onSelect={setSelectedArchitectureRef}
              />
            </div>
          </section>

          <section
            id="portfolio"
            ref={sectionObserver("portfolio")}
            className={styles.section}
          >
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
          </section>

          <section
            id="value"
            ref={sectionObserver("value")}
            className={styles.section}
          >
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
                    <Funnel
                      dataKey="claims"
                      data={data.claimFunnel}
                      nameKey="name"
                    >
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
          </section>

          <section
            id="agenda"
            ref={sectionObserver("agenda")}
            className={styles.section}
          >
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
                      <td>{item.destination} →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            id="limits"
            ref={sectionObserver("limits")}
            className={styles.section}
          >
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
          </section>

          <section className={`${styles.panel} ${styles.panelPad}`}>
            <div className={styles.twoCol}>
              <div>
                <span className={styles.eyebrow}>AI tool evidence</span>
                <p className={styles.sectionCopy}>
                  Top AI rows show adoption and directional use cost. They do
                  not establish realized value.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
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
          </section>

          <footer className={styles.footer}>
            <span>
              Design bound to export {data.datasetId}, generated{" "}
              {formatDateTime(data.generatedAt)} from
              abarva_skyharbor_current_state_dev.
            </span>
            <span>Abarva · Home V0.3 · Data-bound build</span>
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
        { id, question: trimmed, answer: null, loading: true, error: null },
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
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmed,
            tenantKey,
            client: tenantKey,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isHomeKnowResponse(payload)) {
          patchTurn({
            loading: false,
            error:
              extractError(payload) ??
              "aVa could not bind this question to the loaded Home context.",
          });
          return;
        }
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
      className={`${styles.avaDrawer} ${expanded ? styles.avaDrawerExpanded : ""}`}
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
                    Binding Home context and reasoning...
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

function isHomeKnowResponse(value: unknown): value is HomeKnowResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record.mode === "KNOW" && typeof record.intent === "string";
}

function extractError(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const error = (value as { error?: unknown }).error;
  return typeof error === "string" && error.trim() ? error : null;
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

function advisoryText(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const text = record[key];
    if (typeof text === "string" && text.trim()) return text;
  }
  return null;
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
          className={`${styles.fill} ${tone === "amber" ? styles.fillAmber : ""} ${tone === "danger" ? styles.fillDanger : ""}`}
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
