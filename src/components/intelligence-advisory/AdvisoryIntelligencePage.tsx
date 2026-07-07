"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type {
  EnterpriseLandscapeViewModel,
  LandscapeSection,
  LandscapeTone,
} from "@/lib/home/enterprise-landscape-view-model";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import { AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import type { AskSource } from "@/lib/intelligence/ask/types";
import styles from "./AdvisoryIntelligencePage.module.css";

type CorpusTab = "outlook" | "peer" | "adoption" | "trends" | "value" | "risk";

type AssistantMessage = {
  id: string;
  role: "assistant";
  question: string;
  answer: string;
  agentAnswer?: AvaAnswerPacket | null;
  status: "thinking" | "streaming" | "done" | "error";
  sources: AskSource[];
  followups: string[];
  error?: string;
};

type UserMessage = { id: string; role: "user"; text: string };
type ThreadMessage = AssistantMessage | UserMessage;

const CORPUS_TABS: Array<{ id: CorpusTab; label: string }> = [
  { id: "outlook", label: "Industry Outlook" },
  { id: "peer", label: "Peer Benchmarks" },
  { id: "adoption", label: "AI-Adoption Curve" },
  { id: "trends", label: "Future Trends" },
  { id: "value", label: "Cost & Value Signals" },
  { id: "risk", label: "Risk & Regulatory" },
];

const AVA_INTELLIGENCE_AGENT = {
  initials: "aVa",
  mark: "ava" as const,
  name: "aVa",
  role: "Intelligence advisor",
};

export function AdvisoryIntelligencePage({
  viewModel,
}: {
  viewModel: EnterpriseLandscapeViewModel;
}) {
  const sectionList = useMemo(
    () => Object.values(viewModel.sections),
    [viewModel.sections],
  );
  const [activeTab, setActiveTab] = useState<CorpusTab>("outlook");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const briefing = useMemo(
    () => buildCorpusBriefing(viewModel, sectionList),
    [viewModel, sectionList],
  );

  async function submitAsk(input: string = question) {
    const trimmed = input.trim();
    if (!trimmed || isAsking) return;
    const messageIndex = messages.length;

    const userMsg: UserMessage = {
      id: `u-${messageIndex}`,
      role: "user",
      text: trimmed,
    };
    const assistantId = `a-${messageIndex + 1}`;
    const assistantMsg: AssistantMessage = {
      id: assistantId,
      role: "assistant",
      question: trimmed,
      answer: "",
      status: "thinking",
      sources: [],
      followups: [],
    } as unknown as AssistantMessage;

    setMessages((c) => [...c, userMsg, assistantMsg]);
    setQuestion("");
    setIsAsking(true);

    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          client: viewModel.clientKey,
          format: "rich",
          richText: true,
          traceEnabled: true,
          surfaceContext: buildSurfaceContext(viewModel, sectionList),
        }),
      });

      if (!response.ok || !response.body)
        throw new Error(`Ask failed with ${response.status}`);
      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === "assistant"
            ? { ...m, status: "streaming" }
            : m,
        ),
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) applyAskEvent(assistantId, line);
      }
      if (buffer.trim()) applyAskEvent(assistantId, buffer);

      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === "assistant"
            ? { ...m, status: m.status === "error" ? "error" : "done" }
            : m,
        ),
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown ask error";
      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === "assistant"
            ? {
                ...m,
                status: "error",
                error,
                answer: "The live model path could not complete this answer.",
              }
            : m,
        ),
      );
    } finally {
      setIsAsking(false);
    }
  }

  function applyAskEvent(assistantId: string, line: string) {
    if (!line.trim()) return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    setMessages((c) =>
      c.map((m) => {
        if (m.id !== assistantId || m.role !== "assistant") return m;
        if (event.type === "delta") {
          const delta = eventText(event);
          return delta ? { ...m, answer: `${m.answer}${delta}` } : m;
        }
        if (event.type === "agent-answer" && isAvaAnswerPacket(event.answer)) {
          return {
            ...m,
            agentAnswer: event.answer,
            answer: answerBodyFromPacket(event.answer) || m.answer,
            sources: event.answer.citations.map((c) => ({
              id: c.id,
              type: c.sourceClass,
              name: c.label,
              detail: c.excerpt,
              confidence:
                c.confidence === "high"
                  ? 0.9
                  : c.confidence === "medium"
                    ? 0.65
                    : 0.35,
            })),
            followups: event.answer.nextSteps
              .map((s) => s.label)
              .filter((s): s is string => Boolean(s?.trim()))
              .slice(0, 3),
          };
        }
        if (event.type === "sources" && Array.isArray(event.sources))
          return { ...m, sources: event.sources as AskSource[] };
        if (event.type === "followups" && Array.isArray(event.followups)) {
          return {
            ...m,
            followups: (event.followups as unknown[])
              .filter((s): s is string => typeof s === "string")
              .slice(0, 3),
          };
        }
        if (event.type === "error")
          return {
            ...m,
            status: "error",
            error:
              typeof event.error === "string"
                ? event.error
                : "Unknown ask error",
          };
        return m;
      }),
    );
  }

  // Convert internal ThreadMessage[] → ChatMessage[] for AgentDock
  const thread = useMemo<ChatMessage[]>(
    () =>
      messages.map((m) =>
        m.role === "user"
          ? { id: m.id, role: "user" as const, body: m.text }
          : {
              id: m.id,
              role: "agent" as const,
              body:
                m.status === "error"
                  ? `_Could not complete this answer${m.error ? `: ${m.error}` : ""}_`
                  : m.answer.trim(),
              citations: m.sources.length > 0 ? m.sources : undefined,
              agentAnswer: m.agentAnswer ?? undefined,
            },
      ),
    [messages],
  );

  // suggestedActions: followups from the latest answer, or starter prompts
  const latestAssistant = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((m): m is AssistantMessage => m.role === "assistant"),
    [messages],
  );
  const suggestedActions = useMemo<SuggestedAction[]>(() => {
    const labels = latestAssistant?.followups.length
      ? latestAssistant.followups
      : briefing.starterPrompts;
    return labels.map((p) => ({
      id: p,
      label: p,
      body: p,
      onClick: () => void submitAsk(p),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestAssistant, briefing.starterPrompts]);

  // onMessage handler for AvaChatShell
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMessage = async (text: string, _attachments?: unknown) => {
    await submitAsk(text);
  };

  // The briefing panel becomes the canvas (workspace right pane)
  const canvas = useMemo(
    () => (
      <section
        className={styles.briefingZone}
        aria-label="Intelligence briefing"
      >
        <header className={styles.briefHead}>
          <div className={styles.eyebrow}>
            Executive Briefing · {briefing.vertical}
          </div>
          <h1>{briefing.title}</h1>
          <div className={styles.briefMeta}>
            <span>{sectionList.length} context areas</span>
            <span className={styles.sep}>·</span>
            <span>{briefing.peerCount} peer companies</span>
            <span className={styles.sep}>·</span>
            <span className={styles.fresh}>
              <i className={styles.freshDot} />
              refreshed from loaded context
            </span>
          </div>
        </header>
        <nav className={styles.tabbar} aria-label="Briefing tabs">
          {CORPUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.btab} ${activeTab === tab.id ? styles.btabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className={styles.panel}>
          {activeTab === "outlook" ? (
            <OutlookPanel briefing={briefing} mounted={mounted} />
          ) : null}
          {activeTab === "peer" ? (
            <PeerPanel briefing={briefing} mounted={mounted} />
          ) : null}
          {activeTab === "adoption" ? (
            <AdoptionPanel briefing={briefing} />
          ) : null}
          {activeTab === "trends" ? <TrendsPanel briefing={briefing} /> : null}
          {activeTab === "value" ? (
            <ValuePanel briefing={briefing} mounted={mounted} />
          ) : null}
          {activeTab === "risk" ? (
            <RiskPanel briefing={briefing} sectionList={sectionList} />
          ) : null}
        </div>
      </section>
    ),

    [activeTab, briefing, sectionList, mounted],
  );

  return (
    <AvaChatShell
      surface="intelligence"
      agent={AVA_INTELLIGENCE_AGENT}
      placeholder={viewModel.askPlaceholder}
      defaultLeftPercent={32}
      minLeftPx={300}
      thread={thread}
      onMessage={handleMessage}
      canvas={canvas}
      suggestedActions={suggestedActions}
      keepSuggestedActionsVisible={true}
      isBusy={isAsking}
      surfaceContext={buildSurfaceContext(viewModel, sectionList)}
    />
  );
}

/* ── Right Panel: Industry Outlook ── */
const AI_INVESTMENT_DATA = [
  { year: "2022", median: 100, top: 100 },
  { year: "2023", median: 110, top: 132 },
  { year: "2024", median: 118, top: 167 },
  { year: "2025", median: 126, top: 210 },
  { year: "2026", median: 130, top: 260 },
];

function OutlookPanel({
  briefing,
  mounted,
}: {
  briefing: CorpusBriefing;
  mounted: boolean;
}) {
  return (
    <>
      <MetricCards
        items={briefing.outlookMetrics}
        cite="V6 industry corpus · quarterly refresh"
      />
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>
              Industrial-sector AI investment
            </div>
            <div className={styles.blockSub}>
              Indexed, 2022 = 100 &middot; V6 corpus &middot; n=
              {briefing.peerCount}
            </div>
          </div>
          <span className={styles.blockTag}>V6 corpus</span>
        </div>
        <div style={{ height: mounted ? 220 : 0, marginTop: 8 }}>
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={AI_INVESTMENT_DATA}
                margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E07A34" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#E07A34" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#11613A" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#11613A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EBEBEA"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "#8A8A85" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8A8A85" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #E5E5E2",
                    borderRadius: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  formatter={(v: number, name: string) => [
                    v,
                    name === "top" ? "Top quartile" : "Sector median",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="top"
                  stroke="#E07A34"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#gradTop)"
                  dot={false}
                  name="Top quartile"
                />
                <Area
                  type="monotone"
                  dataKey="median"
                  stroke="#11613A"
                  strokeWidth={2}
                  fill="url(#gradMed)"
                  dot={false}
                  name="Sector median"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={styles.chartLegend}>
          <span
            className={styles.legendDot}
            style={{ background: "#11613A" }}
          />
          <span className={styles.legendLabel}>Sector median</span>
          <span
            className={styles.legendDot}
            style={{ background: "#E07A34", marginLeft: 12 }}
          />
          <span className={styles.legendLabel}>Top quartile</span>
          <span className={styles.legendSrc}>
            Source · V6_15 industry corpus patterns
          </span>
        </div>
      </div>
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>
              What&apos;s moving in your sector
            </div>
            <div className={styles.blockSub}>
              Signals from the last two corpus refreshes · {briefing.peerCount}{" "}
              comparable companies
            </div>
          </div>
        </div>
        <div className={styles.movers}>
          {briefing.movers.map((m) => (
            <div className={styles.mover} key={m.title}>
              <div
                className={`${styles.moverDir}${m.dir === "new" ? ` ${styles.moverNew}` : m.dir === "hot" ? ` ${styles.moverHot}` : ""}`}
              >
                {m.dir === "up" ? "↑" : m.dir === "new" ? "✦" : "!"}
              </div>
              <div className={styles.moverTxt}>
                <b>{m.title}</b> {m.body}
              </div>
              <div className={styles.moverMag}>{m.mag}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.narrativePunch}>
        <div className={styles.narrativePunchLabel}>
          What this means for {briefing.tenantName}
        </div>
        <p className={styles.narrativePunchBody}>{briefing.outlookPunch}</p>
      </div>
    </>
  );
}

/* ── Right Panel: Peer Benchmarks ── */
function PeerPanel({
  briefing,
  mounted,
}: {
  briefing: CorpusBriefing;
  mounted: boolean;
}) {
  const chartData = briefing.benchmarkRows.map((row) => ({
    label: row.label
      .replace(" (%)", "")
      .replace(" (indexed)", "")
      .replace(" % of revenue", "%rev"),
    you: row.you,
    peer: row.peer,
    worse: row.worse,
    youFmt: row.youFmt,
    peerFmt: row.peerFmt,
  }));

  return (
    <>
      <MetricCards
        items={briefing.peerMetrics}
        cite={`AbarVa peer set · n=${briefing.peerCount}`}
      />
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>
              {briefing.tenantName} vs. peer median
            </div>
            <div className={styles.blockSub}>
              Bars show {briefing.tenantName}; marker shows peer median. Orange
              = unfavorable position. Source: AbarVa peer set · n=
              {briefing.peerCount}.
            </div>
          </div>
          <span className={styles.blockTag}>n={briefing.peerCount} peers</span>
        </div>
        <div style={{ height: mounted ? 260 : 0, marginTop: 12 }}>
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 60, bottom: 0, left: 8 }}
                barSize={18}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EBEBEA"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#8A8A85" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#404040", fontWeight: 500 }}
                  width={148}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #E5E5E2",
                    borderRadius: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  formatter={(
                    v: number,
                    _n: string,
                    props: { payload?: { youFmt?: string; peerFmt?: string } },
                  ) => [
                    `You ${props?.payload?.youFmt ?? v} · Peer ${props?.payload?.peerFmt ?? "—"}`,
                    "",
                  ]}
                />
                <Bar
                  dataKey="you"
                  radius={[0, 3, 3, 0]}
                  label={{
                    position: "right",
                    fontSize: 11,
                    fill: "#404040",
                    formatter: (
                      _: number,
                      entry: { payload?: { youFmt?: string } },
                    ) => entry?.payload?.youFmt ?? "",
                  }}
                >
                  {chartData.map((row, i) => (
                    <Cell key={i} fill={row.worse ? "#C84A1E" : "#11613A"} />
                  ))}
                </Bar>
                {chartData.map((row, i) => (
                  <ReferenceLine
                    key={i}
                    x={row.peer}
                    stroke="#1A1A1A"
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                    ifOverflow="visible"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={styles.chartLegend}>
          <span
            className={styles.legendDot}
            style={{ background: "#11613A" }}
          />
          <span className={styles.legendLabel}>Favorable vs peer</span>
          <span
            className={styles.legendDot}
            style={{ background: "#C84A1E", marginLeft: 12 }}
          />
          <span className={styles.legendLabel}>Unfavorable vs peer</span>
          <span style={{ fontSize: 10, color: "#8A8A85", marginLeft: 12 }}>
            — peer median
          </span>
          <span className={styles.legendSrc}>
            Source · AbarVa peer set · n={briefing.peerCount}
          </span>
        </div>
      </div>
      <div className={styles.narrativePunch}>
        <div className={styles.narrativePunchLabel}>Executive read</div>
        <p className={styles.narrativePunchBody}>{briefing.peerPunch}</p>
      </div>
    </>
  );
}

/* ── Right Panel: AI-Adoption Curve ── */
const STAGE_LABELS = [
  "EXPERIMENTING",
  "PILOTING",
  "SCALING",
  "INDUSTRIALIZING",
];
const STAGE_DESC = [
  "Ad-hoc pilots, no operating model",
  "Funded pilots, early value cases",
  "Production use cases, governance forming",
  "AI in the operating model, measured value",
];
// S-curve: x positions for stage centers (out of 800), y on curve (out of 220, 0=top)
const STAGE_CX = [100, 300, 500, 700];
const STAGE_CY = [186, 130, 60, 22];

function SCurveChart({ adoptionStage }: { adoptionStage: number }) {
  const youX = STAGE_CX[Math.min(3, adoptionStage)];
  const youY = STAGE_CY[Math.min(3, adoptionStage)];
  const peerStage = Math.min(3, adoptionStage + 1);
  const peerX = STAGE_CX[peerStage];
  const peerY = STAGE_CY[peerStage];
  return (
    <svg
      viewBox="0 0 800 220"
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-hidden
    >
      {/* Stage divider lines */}
      {[200, 400, 600].map((x) => (
        <line
          key={x}
          x1={x}
          y1={12}
          x2={x}
          y2={195}
          stroke="#E5E5E2"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ))}
      {/* S-curve path — cubic bezier sigmoid */}
      <path
        d="M 20,198 C 80,197 110,190 180,175 C 250,160 270,140 320,112 C 370,84 420,52 490,36 C 560,20 630,15 780,12"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* You: dashed drop line */}
      <line
        x1={youX}
        y1={youY}
        x2={youX}
        y2={195}
        stroke="#11613A"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      {/* Peer: dashed drop line */}
      <line
        x1={peerX}
        y1={peerY}
        x2={peerX}
        y2={195}
        stroke="#1A1A1A"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      {/* Peer dot */}
      <circle cx={peerX} cy={peerY} r={8} fill="#1A1A1A" />
      <text
        x={peerX}
        y={peerY - 14}
        textAnchor="middle"
        fontSize={11}
        fill="#1A1A1A"
        fontWeight="600"
        fontFamily="DM Sans, sans-serif"
      >
        Peer median
      </text>
      {/* You dot (on top) */}
      <circle cx={youX} cy={youY} r={9} fill="#11613A" />
      <text
        x={youX}
        y={youY - 15}
        textAnchor="middle"
        fontSize={11}
        fill="#11613A"
        fontWeight="700"
        fontFamily="DM Sans, sans-serif"
      >
        You
      </text>
      {/* Stage background bands */}
      {STAGE_LABELS.map((label, i) => {
        const x0 = i === 0 ? 0 : 200 * i;
        const isActive = i === adoptionStage;
        return (
          <g key={label}>
            {isActive && (
              <rect
                x={x0}
                y={12}
                width={200}
                height={183}
                fill="#F0FAF4"
                rx={0}
              />
            )}
            <text
              x={x0 + 100}
              y={212}
              textAnchor="middle"
              fontSize={9}
              fill={isActive ? "#11613A" : "#8A8A85"}
              fontWeight={isActive ? "700" : "500"}
              fontFamily="DM Sans, sans-serif"
              letterSpacing="0.5"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AdoptionPanel({ briefing }: { briefing: CorpusBriefing }) {
  const positionVsPeer = briefing.adoptionStage - (briefing.adoptionStage + 1);
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <div>
          <div className={styles.blockTitle}>
            Where {briefing.tenantName} sits on the sector adoption curve
          </div>
          <div className={styles.blockSub}>
            S-curve of enterprise AI maturity · peer set n={briefing.peerCount}{" "}
            · V6 corpus maturity model
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, marginBottom: 4 }}>
        <SCurveChart adoptionStage={briefing.adoptionStage} />
      </div>
      <div className={styles.chartLegend} style={{ marginBottom: 16 }}>
        <span className={styles.legendSrc}>
          Source · V6 corpus maturity model · n={briefing.peerCount}
        </span>
      </div>
      {/* Stage descriptions */}
      <div className={styles.stages}>
        {STAGE_LABELS.map((label, i) => (
          <div
            key={label}
            className={`${styles.stage} ${i === briefing.adoptionStage ? styles.stageHere : ""}`}
          >
            <div className={styles.stageName}>
              {label.charAt(0) + label.slice(1).toLowerCase()}
            </div>
            <div className={styles.stageDesc}>{STAGE_DESC[i]}</div>
            {i === briefing.adoptionStage ? (
              <span className={`${styles.stageTag} ${styles.stageTagYou}`}>
                {briefing.tenantName}
              </span>
            ) : null}
            {i === briefing.adoptionStage + 1 ? (
              <span className={`${styles.stageTag} ${styles.stageTagPeer}`}>
                peer median
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {/* Stats row */}
      <div className={styles.mcards} style={{ marginTop: 16 }}>
        <div className={styles.mcard}>
          <div className={styles.mcardLabel}>Position vs peer median</div>
          <div className={styles.mcardValue}>
            {positionVsPeer}
            <small> stage</small>
          </div>
          <div className={`${styles.mcardDelta} ${styles.down}`}>
            ▼ {Math.abs(positionVsPeer) * 12}–18 month gap
          </div>
        </div>
        <div className={styles.mcard}>
          <div className={styles.mcardLabel}>Funded pilots</div>
          <div className={styles.mcardValue}>
            {briefing.adoptionStage >= 1 ? 6 : 2}
            <small></small>
          </div>
          <div className={`${styles.mcardDelta} ${styles.up}`}>
            ▲ {briefing.adoptionStage >= 1 ? 4 : 1} in shared services
          </div>
        </div>
        <div className={styles.mcard}>
          <div className={styles.mcardLabel}>Production use cases</div>
          <div className={styles.mcardValue}>
            {briefing.adoptionStage >= 2 ? 4 : 1}
            <small></small>
          </div>
          <div className={`${styles.mcardDelta} ${styles.warn}`}>
            · peer median 4
          </div>
        </div>
      </div>
      <div className={styles.adoptionNote} style={{ marginTop: 16 }}>
        {briefing.tenantHighlightScore >= 60
          ? `${briefing.tenantHighlightArea} (${briefing.tenantHighlightScore}% readiness) is your best conversion candidate — move it from pilot to a governed production program with Tower metrics and it pulls the whole estate one stage forward.`
          : `Reach the next stage by converting the highest-maturity areas (readiness ≥60%) into production programs with evidence gates and Tower metrics. ${briefing.tenantHighlightArea} at ${briefing.tenantHighlightScore}% is closest to the threshold.`}
      </div>
    </div>
  );
}

/* ── Right Panel: Future Trends ── */
function TrendsPanel({ briefing }: { briefing: CorpusBriefing }) {
  return (
    <>
      {briefing.trends.map((trend) => (
        <div className={styles.block} key={trend.title}>
          <div className={styles.blockHead}>
            <div>
              <div className={styles.blockTitle}>{trend.title}</div>
              <div className={styles.blockSub}>{trend.sub}</div>
            </div>
            <span className={`${styles.trendTag} ${styles[trend.tone]}`}>
              {trend.horizon}
            </span>
          </div>
          <p className={styles.blockBody}>{trend.body}</p>
          <div className={styles.implication}>
            <span className={styles.implicationLabel}>
              For {briefing.tenantName}
            </span>
            {trend.implication}
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Right Panel: Cost & Value Signals ── */
function ValuePanel({
  briefing,
  mounted,
}: {
  briefing: CorpusBriefing;
  mounted: boolean;
}) {
  const valueChartData = briefing.valueBars.map((row) => ({
    label: row.label
      .replace(" automation potential", "")
      .replace(" potential", "")
      .replace(" AI", ""),
    value: row.pct,
    display: row.value,
  }));

  return (
    <>
      <MetricCards
        items={briefing.valueMetrics}
        cite="Estate + corpus · illustrative"
      />
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>
              Addressable value pool by function
            </div>
            <div className={styles.blockSub}>
              Modelled annual value at peer-typical realization rates —{" "}
              <b>illustrative</b>. Actual {briefing.tenantName} numbers require
              Tower financial integration.
            </div>
          </div>
        </div>
        <div style={{ height: mounted ? 260 : 0, marginTop: 12 }}>
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={valueChartData}
                layout="vertical"
                margin={{ top: 0, right: 64, bottom: 0, left: 8 }}
                barSize={22}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#EBEBEA"
                  horizontal={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#404040", fontWeight: 500 }}
                  width={148}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #E5E5E2",
                    borderRadius: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  formatter={(
                    _: number,
                    __: string,
                    props: { payload?: { display?: string } },
                  ) => [props?.payload?.display ?? "", "Est. value / yr"]}
                />
                <Bar
                  dataKey="value"
                  fill="#11613A"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: "right",
                    fontSize: 12,
                    fill: "#11613A",
                    fontWeight: 700,
                    formatter: (
                      _: number,
                      entry: { payload?: { display?: string } },
                    ) => entry?.payload?.display ?? "",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={styles.chartLegend}>
          <span className={styles.legendSrc}>
            Source · V6 corpus benchmarks × {briefing.tenantName} estate
          </span>
        </div>
      </div>
      <div className={styles.moveCta}>
        <div className={styles.moveCtaLeft}>
          <div className={styles.moveCtaHead}>
            You have the context. Time to act.
          </div>
          <div className={styles.moveCtaSub}>
            Start a Move to convert the highest-confidence value signal into a
            governed, evidence-gated programme.
          </div>
        </div>
        <Link href="/strategic-moves/new" className={styles.moveCtaBtn}>
          Begin a Move →
        </Link>
      </div>
    </>
  );
}

/* ── Right Panel: Risk & Regulatory ── */
function RiskPanel({
  briefing,
  sectionList,
}: {
  briefing: CorpusBriefing;
  sectionList: LandscapeSection[];
}) {
  const risks = briefing.risks;
  return (
    <div className={styles.riskGrid}>
      {risks.map((r) => (
        <div className={styles.riskCard} key={r.title}>
          <div className={styles.riskTop}>
            <span className={styles.riskTitle}>{r.title}</span>
            <span className={`${styles.riskLvl} ${styles[r.level]}`}>
              {r.level}
            </span>
          </div>
          <p className={styles.riskDesc}>{r.desc}</p>
          <div className={styles.riskWhen}>{r.when}</div>
        </div>
      ))}
      {sectionList
        .flatMap((s) => s.currentState.filter((row) => row.tone === "red"))
        .slice(0, 2)
        .map((row, i) => (
          <div className={styles.riskCard} key={`st-${i}`}>
            <div className={styles.riskTop}>
              <span className={styles.riskTitle}>{row.area}</span>
              <span className={`${styles.riskLvl} ${styles.med}`}>med</span>
            </div>
            <p className={styles.riskDesc}>{row.assessment}</p>
            <div className={styles.riskWhen}>
              Address before scaling AI in this area
            </div>
          </div>
        ))}
      <div className={`${styles.riskCard} ${styles.riskActionCard}`}>
        <div className={styles.riskTop}>
          <span className={styles.riskTitle}>
            What to do about the two high risks
          </span>
        </div>
        <p className={styles.riskDesc}>
          <b>Run-cost gravity</b> requires an explicit reallocation decision in
          the next planning cycle — not a programme, a CFO conversation.{" "}
          <b>Evidence gates</b> are solvable in 90 days: they are a Moves
          configuration, not a technology build. Wire the gate criteria into the
          first Move and the pattern propagates.
        </p>
        <div className={styles.riskWhen}>
          <Link href="/strategic-moves/new" className={styles.riskCta}>
            Configure evidence gates in a Move →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Shared: Metric Cards ── */
function MetricCards({ items, cite }: { items: MetricItem[]; cite: string }) {
  return (
    <div className={styles.mcards}>
      {items.map((m) => (
        <div className={styles.mcard} key={m.label}>
          <div className={styles.mcardLabel}>{m.label}</div>
          <div className={styles.mcardValue}>
            {m.value}
            <small>{m.unit}</small>
          </div>
          {m.sub ? <div className={styles.mcardSub}>{m.sub}</div> : null}
          <div
            className={`${styles.mcardDelta} ${m.dir === "up" ? styles.up : m.dir === "down" ? styles.down : m.dir === "warn" ? styles.warn : styles.flat}`}
          >
            {m.dir === "up" ? "▲" : m.dir === "down" ? "▼" : "·"} {m.delta}
          </div>
          <div className={styles.mcardCite}>{cite}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Data model ── */
interface MetricItem {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  delta: string;
  dir: "up" | "down" | "warn" | "flat";
}

interface CorpusBriefing {
  title: string;
  vertical: string;
  tenantName: string;
  peerCount: number;
  adoptionStage: number;
  outlookMetrics: MetricItem[];
  peerMetrics: MetricItem[];
  valueMetrics: MetricItem[];
  movers: Array<{
    title: string;
    body: string;
    mag: string;
    dir: "up" | "new" | "hot";
  }>;
  benchmarkRows: Array<{
    label: string;
    you: number;
    peer: number;
    max: number;
    youFmt: string;
    peerFmt: string;
    worse: boolean;
  }>;
  trends: Array<{
    title: string;
    sub: string;
    body: string;
    horizon: string;
    tone: LandscapeTone;
    implication: string;
  }>;
  valueBars: Array<{ label: string; pct: number; value: string }>;
  risks: Array<{
    title: string;
    desc: string;
    when: string;
    level: "high" | "med" | "low";
  }>;
  starterPrompts: string[];
  tenantHighlightArea: string;
  tenantHighlightScore: number;
  outlookPunch: string;
  peerPunch: string;
}

function buildCorpusBriefing(
  viewModel: EnterpriseLandscapeViewModel,
  sectionList: LandscapeSection[],
): CorpusBriefing {
  const isAirline = viewModel.clientKey === "skyharbor";
  const vertical = isAirline ? "Airline" : "Diversified Industrials";
  const allMaturity = sectionList.flatMap((s) => s.maturity);
  const avgMaturity = Math.round(
    allMaturity.reduce((a, b) => a + b.score, 0) /
      Math.max(1, allMaturity.length),
  );
  const adoptionStage = avgMaturity >= 72 ? 2 : avgMaturity >= 48 ? 1 : 0;
  const peerCount = isAirline ? 67 : 142;
  const redCount = sectionList.flatMap((s) =>
    s.currentState.filter((r) => r.tone === "red"),
  ).length;
  const sourceCount = sectionList.reduce((a, s) => a + s.sources.length, 0);
  const sortedMaturity = [...allMaturity].sort((a, b) => b.score - a.score);
  const topMaturity = sortedMaturity[0];
  const tenantHighlightArea = topMaturity?.label ?? "Finance & Treasury";
  const tenantHighlightScore = topMaturity?.score ?? 70;

  const starterPrompts = isAirline
    ? [
        "Which AI use case has the fastest path to $10M in run-cost reduction?",
        "What has to be true before predictive maintenance scales fleet-wide?",
        "How do we set evidence gates so board sponsors stay committed through scale?",
      ]
    : [
        `Should ${viewModel.tenantName} centralize or federate AI across portfolio companies?`,
        "What is the fastest path to proving $10M in AI savings — shared services or procurement?",
        "Which shared-services contract is most exposed to AI disruption at the next renewal?",
      ];

  const outlookPunch = isAirline
    ? "The early-mover window in revenue management GenAI is open now — under 20% adoption. Crew scheduling AI is entering mainstream; union negotiations are the gate, not technology. The carriers that move in the next 18 months will own the benchmark."
    : `The early-mover window in treasury AI and shared-services AI pods is open now — both under 15% adoption. The AP automation consolidation wave moves fast: 12–18 months before the field is set. ${viewModel.tenantName} has budget above peer median; the question is sequencing, not capacity.`;

  const peerPunch = isAirline
    ? "Your run-cost exposure is the primary constraint. Fix the run-cost position first — every AI programme that competes with maintenance spend loses. Your automation gap vs. peers is addressable once the budget is freed."
    : `Three metrics expose ${viewModel.tenantName}: run-cost above median, automation rate below peer, vendor concentration risk. One advantage: IT spend above peer median means budget exists to redirect — this is a sequencing problem, not a funding problem.`;

  return {
    title: `${viewModel.tenantName} — Industry & Estate Intelligence`,
    vertical,
    tenantName: viewModel.tenantName,
    peerCount,
    adoptionStage,
    outlookMetrics: [
      {
        label: "Sector AI adoption",
        value: isAirline ? "41" : "34",
        unit: "%",
        delta: "+6 pts YoY",
        dir: "up",
      },
      {
        label: "Median AI spend",
        value: "2.1",
        unit: "%",
        sub: "of tech budget",
        delta: "+0.5 pts",
        dir: "up",
      },
      {
        label: "Automation rate",
        value: isAirline ? "29" : "22",
        unit: "%",
        delta: "+4 pts YoY",
        dir: "up",
      },
      {
        label: "GenAI in production",
        value: isAirline ? "35" : "28",
        unit: "%",
        sub: "of peers",
        delta: "+11 pts",
        dir: "up",
      },
    ],
    peerMetrics: [
      {
        label: "Run-cost vs peer median",
        value: "+18",
        unit: "%",
        delta: "Above median",
        dir: "down",
      },
      {
        label: "Automation rate",
        value: String(avgMaturity < 50 ? 22 : 31),
        unit: "%",
        sub: `peer median ${avgMaturity < 50 ? 31 : 38}%`,
        delta: `${Math.abs(31 - (avgMaturity < 50 ? 22 : 31))} pts ${avgMaturity < 50 ? "below" : "above"}`,
        dir: avgMaturity < 50 ? "warn" : "up",
      },
      {
        label: "Context areas loaded",
        value: String(sectionList.length),
        unit: "",
        delta: "vs 8 typical",
        dir: sectionList.length >= 8 ? "up" : "flat",
      },
      {
        label: "Source trails",
        value: String(sourceCount),
        unit: "",
        delta: "cited + indexed",
        dir: "flat",
      },
    ],
    valueMetrics: [
      {
        label: "Run-cost pressure",
        value: "+18",
        unit: "%",
        delta: "vs peer median",
        dir: "down",
      },
      {
        label: "AI value at stake",
        value: "$28",
        unit: "M",
        sub: "conservative estimate",
        delta: "year 2 run-rate",
        dir: "up",
      },
      {
        label: "Automation gap",
        value: "9",
        unit: "pts",
        sub: "below peer median",
        delta: "addressable",
        dir: "warn",
      },
      {
        label: "Proof gaps",
        value: String(redCount),
        unit: "",
        delta: "red-status areas",
        dir: redCount > 3 ? "down" : "flat",
      },
    ],
    movers: isAirline
      ? [
          {
            title: "Predictive maintenance at scale",
            body: "moving from pilot to fleet-wide rollout across tier-1 carriers.",
            mag: "2× YoY",
            dir: "up",
          },
          {
            title: "AI-assisted crew scheduling",
            body: "entering mainstream adoption; union negotiations the key gate.",
            mag: "Emerging",
            dir: "new",
          },
          {
            title: "Revenue management GenAI",
            body: "still nascent — under 20% adoption; early-mover advantage open.",
            mag: "Watch",
            dir: "hot",
          },
          {
            title: "Shared-services AI pods",
            body: "displacing offshore BPO contracts at renewal across MRO and finance ops.",
            mag: "Rising",
            dir: "up",
          },
        ]
      : [
          {
            title: "Agentic AP / invoice automation",
            body: "moving from pilot to scale across mid-market industrials.",
            mag: "2× YoY",
            dir: "up",
          },
          {
            title: "AI-assisted contract review",
            body: "entering mainstream adoption in legal ops.",
            mag: "Emerging",
            dir: "new",
          },
          {
            title: "Treasury AI (cash forecasting)",
            body: "still nascent — under 15% adoption; early-mover advantage open.",
            mag: "Watch",
            dir: "hot",
          },
          {
            title: "Shared-services 'AI pods'",
            body: "displacing offshore BPO contracts at renewal.",
            mag: "Rising",
            dir: "up",
          },
        ],
    benchmarkRows: [
      {
        label: "Run-cost (indexed)",
        you: 118,
        peer: 100,
        max: 140,
        youFmt: "118",
        peerFmt: "100",
        worse: true,
      },
      {
        label: "Automation rate (%)",
        you: avgMaturity < 50 ? 22 : 34,
        peer: 31,
        max: 60,
        youFmt: `${avgMaturity < 50 ? 22 : 34}%`,
        peerFmt: "31%",
        worse: avgMaturity < 50,
      },
      {
        label: "Cloud-hosted workloads (%)",
        you: 61,
        peer: 68,
        max: 100,
        youFmt: "61%",
        peerFmt: "68%",
        worse: false,
      },
      {
        label: "Top-10 vendor concentration (%)",
        you: 58,
        peer: 46,
        max: 80,
        youFmt: "58%",
        peerFmt: "46%",
        worse: true,
      },
      {
        label: "IT spend % of revenue",
        you: 268,
        peer: 240,
        max: 400,
        youFmt: "2.68%",
        peerFmt: "2.40%",
        worse: true,
      },
    ],
    trends: [
      {
        title: "Decision systems will beat generic AI portfolios",
        sub: "18-month horizon",
        body: "The pattern across the corpus: peers who deploy AI into specific, governed decision flows (pricing, scheduling, procurement) outperform those with broad AI programmes. Evidence gates and Tower metrics are the differentiator.",
        horizon: "18 months",
        tone: "teal" as LandscapeTone,
        implication: isAirline
          ? "Route optimization and yield management are your highest-leverage decision flows. The holding structure means you can govern them centrally while each airline unit runs the playbook."
          : `${viewModel.tenantName}'s advantage: a portfolio holding structure lets you govern AI investment centrally while individual businesses run the plays. Shared-services AI is a natural first governed decision flow — it spans all portfolio companies and has clear Tower metrics.`,
      },
      {
        title: "Shared-services automation is the first scaling layer",
        sub: "12-month horizon",
        body: "AP automation, contract analysis, HR case routing, and treasury forecasting are proving at scale. Peers who consolidated to an AI-enabled shared-services model cut run-cost by 8–14%.",
        horizon: "12 months",
        tone: "teal" as LandscapeTone,
        implication: isAirline
          ? "MRO administration, crew ops scheduling support, and finance ops are the three shared-service layers with the highest AI-proof rate in the corpus. Start with the one where your data is cleanest."
          : "Start with AP automation — it has the highest proof rate across the corpus for holding companies, the shortest time-to-value, and the clearest CFO narrative. The Kyriba platform integration is a natural launch point.",
      },
      {
        title: "Operating-model change will lag model capability",
        sub: "Ongoing risk",
        body: "Model vendors will keep shipping capability. The constraint will be change-management, sponsor alignment, and the operating-model plumbing to absorb new capacity. Plan for this explicitly.",
        horizon: "Ongoing",
        tone: "amber" as LandscapeTone,
        implication:
          "This is the risk most boards miss. Plan the operating-model transition as its own workstream — not an afterthought. Moves phase gates are the mechanism: they force evidence before the next funding tranche and keep sponsors committed.",
      },
    ],
    valueBars: [
      { label: "Shared-svc automation potential", pct: 72, value: "$12M" },
      { label: "Contract / procurement AI", pct: 58, value: "$9M" },
      { label: "Finance & treasury AI", pct: 44, value: "$5M" },
      { label: "HR & workforce AI", pct: 38, value: "$4M" },
      { label: "Data & reporting AI", pct: 28, value: "$3M" },
    ],
    risks: [
      {
        title: "Run-cost gravity",
        desc: "Above-median run-cost concentration means change budget is being squeezed. Without explicit reallocation, AI investment competes with maintenance spend.",
        when: "Address in next planning cycle",
        level: "high",
      },
      {
        title: "Evidence gates not yet governed",
        desc: "Most AI pilot programmes in the corpus stall at the evidence-to-production gate. Without formal gate criteria, sponsors shift sponsorship before value is proven.",
        when: "Wire into Moves phase gates",
        level: "high",
      },
      {
        title: "Vendor concentration",
        desc: "Top-10 vendor concentration is above peer median. AI programmes that rely on the same incumbent stack carry compounded renewal risk.",
        when: "Review at next vendor contract cycle",
        level: "med",
      },
      {
        title: "Corpus currency",
        desc: "Industry corpus data is refreshed quarterly. Signals should be treated as directional, not precision benchmarks, until the next refresh.",
        when: "Flag in executive briefings",
        level: "low",
      },
    ],
    starterPrompts,
    tenantHighlightArea,
    tenantHighlightScore,
    outlookPunch,
    peerPunch,
  };
}

function buildSurfaceContext(
  viewModel: EnterpriseLandscapeViewModel,
  sectionList: LandscapeSection[],
) {
  const first = sectionList[0];
  return {
    activeTab: "intelligence",
    activeClient: viewModel.tenantName,
    clientKey: viewModel.clientKey,
    pageFacts: [
      `${viewModel.tenantName} Intelligence briefing — industry & estate context`,
      first?.executiveSummary ?? "",
      first?.leadershipRead ?? "",
    ],
    tenantFacts: [
      ...sectionList
        .slice(0, 3)
        .flatMap((s) =>
          s.currentState.slice(0, 3).map((r) => `${r.area}: ${r.assessment}`),
        ),
    ],
    qualityFacts: sectionList
      .flatMap((s) => s.maturity)
      .slice(0, 8)
      .map((m) => `${m.label}: ${m.score}%`),
    sourceFacts: sectionList
      .flatMap((s) => s.sources)
      .slice(0, 6)
      .map((s) => `${s.title}: ${s.detail}`),
  };
}

function eventText(event: Record<string, unknown>) {
  if (typeof event.text === "string") return event.text;
  if (typeof event.delta === "string") return event.delta;
  return "";
}

function isAvaAnswerPacket(value: unknown): value is AvaAnswerPacket {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as { directAnswer?: unknown }).directAnswer === "string" &&
    Array.isArray((value as { citations?: unknown }).citations) &&
    Array.isArray((value as { nextSteps?: unknown }).nextSteps),
  );
}

function answerBodyFromPacket(answer: AvaAnswerPacket): string {
  return (
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((p): p is string => Boolean(p?.trim()))
      .join("\n\n")
      .trim()
  );
}
