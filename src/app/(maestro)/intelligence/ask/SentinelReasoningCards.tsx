"use client";

import { useMemo, useState } from "react";
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
  type SuggestedAction,
} from "@/components/agent/AgentDock";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { EvidenceBasis } from "@/components/intelligence/EvidenceBasis";
import { SHELL } from "@/lib/shell/shell-tokens";
import type { AgentAnswer } from "@/lib/intelligence/answer/agent-answer";
import type { SentinelReasoningStage } from "@/lib/agents/sentinel-reasoning";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type { CoverageReport } from "@/lib/knowledge/coverage";
import { ensureIntelligenceAskTabId } from "@/app/intelligence/ask/IntelligenceAskTabCookie";

type StreamEvent =
  | {
      type: "session";
      sessionId?: string;
      tabId?: string;
      priorTurnCount?: number;
    }
  | {
      type: "classified";
      classification?: {
        intent?: string;
        confidence?: number;
        reason?: string;
      };
    }
  | { type: "sentinel-stage"; stage?: SentinelReasoningStage }
  | { type: "delta"; text?: string }
  | { type: "sources"; sources?: AskSource[]; coverageReport?: CoverageReport }
  | { type: "agent-answer"; answer?: AgentAnswer }
  | { type: "done"; telemetryEventId?: string }
  | { type: "error"; error?: string };

const AVA_INTELLIGENCE_AGENT = {
  initials: "Av",
  name: "Ava",
  role: "Intelligence advisor",
};

const DEFAULT_SUGGESTIONS: SuggestedAction[] = [
  {
    id: "portfolio-risk",
    label: "Where is the portfolio risk concentrated?",
    body: "Where is the portfolio risk concentrated, and what evidence supports that read?",
  },
  {
    id: "scale-hold-kill",
    label: "Which AI bets should we scale, hold, or stop?",
    body: "Which AI investments should leadership scale, hold, or stop, and why?",
  },
  {
    id: "board-read",
    label: "Give me the board-level interpretation",
    body: "Give me the board-level interpretation of the current enterprise context, with the tradeoffs and gaps called out.",
  },
];

function eventFromLine(line: string): StreamEvent | null {
  try {
    return JSON.parse(line) as StreamEvent;
  } catch {
    return null;
  }
}

function summarizeStagesForThread(stages: SentinelReasoningStage[]): string {
  const ordered = [...stages].sort((a, b) => a.sequence - b.sequence);
  if (ordered.length === 0) return "";
  return ordered
    .map((stage) => `${stage.name}: ${stage.content}`)
    .join("\n\n");
}

function answerBodyForThread(answer: AgentAnswer): string {
  const prose = answer.prose.trim();
  if (prose) return prose;
  const artifactCount =
    answer.tables.length + answer.charts.length + answer.graphs.length;
  if (artifactCount > 0) {
    return "I found structured evidence for this. Review the canvas for the table, chart, graph, citations, and gaps.";
  }
  if (answer.gaps.length > 0) {
    return `I found gaps rather than a complete answer: ${answer.gaps.join("; ")}`;
  }
  return "Ava returned an answer shell without a renderable narrative.";
}

function messageWithAttachments(text: string, attachments: AttachmentRef[]): string {
  if (attachments.length === 0) return text;
  const names = attachments.map((attachment) => attachment.file_name).join(", ");
  const previews = attachments
    .filter((attachment) => attachment.extracted_text_preview?.trim())
    .map(
      (attachment) =>
        `--- attachment: ${attachment.file_name} (${attachment.mime}) ---\n${attachment.extracted_text_preview}\n--- end attachment ---`,
    )
    .join("\n\n");
  const visible = text ? `${text}\n\n[attached: ${names}]` : `[attached: ${names}]`;
  return previews ? `${visible}\n\n${previews}` : visible;
}

interface SentinelReasoningCardsProps {
  initialClient: string;
  initialClientDisplayName: string;
}

export function SentinelReasoningCards({
  initialClient,
  initialClientDisplayName,
}: SentinelReasoningCardsProps) {
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [cards, setCards] = useState<SentinelReasoningStage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<AgentAnswer | null>(null);
  const [evidenceSources, setEvidenceSources] = useState<AskSource[]>([]);
  const [coverageReport, setCoverageReport] = useState<CoverageReport | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);

  const finalAction = useMemo(
    () => cards.find((card) => card.oneClickAction)?.oneClickAction ?? null,
    [cards],
  );

  const setAgentTurn = (id: string, patch: Partial<ChatMessage>) => {
    setThread((prev) =>
      prev.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)),
    );
  };

  async function shapeMoves() {
    if (!finalAction) return;
    const href =
      finalAction.href ??
      (sessionId
        ? `/programs/new?fromIntelligence=1&intelligenceSessionId=${encodeURIComponent(sessionId)}&sourceTitle=${encodeURIComponent("Ava Intelligence Ask")}`
        : null);
    if (!finalAction.payload.parentMoveInstanceId) {
      if (href) {
        window.location.assign(href);
        return;
      }
      setActionState("Open this from a parent Move to instantiate in the DAG.");
      return;
    }
    setActionState("Calling DAG shape endpoint...");
    try {
      const response = await fetch(finalAction.endpoint, {
        method: finalAction.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAction.payload),
      });
      if (!response.ok) {
        setActionState("DAG API pending; proposals are staged for Moves handoff.");
        return;
      }
      const body = await response.json().catch(() => ({}));
      const count =
        typeof body?.createdCount === "number"
          ? body.createdCount
          : Array.isArray(body?.moves)
            ? body.moves.length
            : Array.isArray(body?.data?.result?.createdInstances)
              ? body.data.result.createdInstances.length
              : finalAction.payload.proposals.length;
      setActionState(`${count} Move proposals sent to the dependency DAG.`);
    } catch {
      setActionState("DAG API pending; proposals are staged for Moves handoff.");
    }
  }

  async function ask(text: string, attachments: AttachmentRef[]) {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    const userBody = messageWithAttachments(trimmed, attachments);
    const messageForApi = userBody;
    const now = Date.now();
    const userTurnId = `intelligence-user-${now}`;
    const agentTurnId = `intelligence-agent-${now}`;

    setCurrentQuestion(trimmed || "Attached context");
    setCurrentAnswer(null);
    setCards([]);
    setEvidenceSources([]);
    setCoverageReport(undefined);
    setError(null);
    setActionState(null);
    setStatus("streaming");
    setThread((prev) => [
      ...prev,
      { id: userTurnId, role: "user", body: userBody },
      {
        id: agentTurnId,
        role: "agent",
        body: "Reading tenant evidence, corpus patterns, and expert context...",
      },
    ]);

    let accumulatedText = "";
    let sawRenderableAnswer = false;

    const handleEvent = (event: StreamEvent) => {
      if (event.type === "session" && event.sessionId) {
        setSessionId(event.sessionId);
        return;
      }
      if (event.type === "sentinel-stage" && event.stage) {
        sawRenderableAnswer = true;
        const stage = event.stage;
        setCards((prev) => {
          const next = [
            ...prev.filter((card) => card.id !== stage.id),
            stage,
          ].sort((a, b) => a.sequence - b.sequence);
          setAgentTurn(agentTurnId, { body: summarizeStagesForThread(next) });
          return next;
        });
        return;
      }
      if (event.type === "delta" && event.text) {
        sawRenderableAnswer = true;
        accumulatedText += event.text;
        setAgentTurn(agentTurnId, { body: accumulatedText });
        return;
      }
      if (event.type === "sources") {
        const sources = Array.isArray(event.sources) ? event.sources : [];
        setEvidenceSources(sources);
        setCoverageReport(event.coverageReport);
        if (sources.length > 0) {
          setAgentTurn(agentTurnId, { citations: sources });
        }
        return;
      }
      if (event.type === "agent-answer" && event.answer) {
        sawRenderableAnswer = true;
        setCurrentAnswer(event.answer);
        setAgentTurn(agentTurnId, { body: answerBodyForThread(event.answer) });
        return;
      }
      if (event.type === "done" && event.telemetryEventId) {
        setAgentTurn(agentTurnId, { feedbackEventId: event.telemetryEventId });
        return;
      }
      if (event.type === "error") {
        throw new Error(event.error ?? "Ava stream error");
      }
    };

    try {
      const tabId = ensureIntelligenceAskTabId();
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: messageForApi,
          client: initialClient,
          tabId,
          richText: true,
          surfaceContext: {
            clientKey: initialClient,
            activeClient: initialClientDisplayName,
            activeTab: "intelligence-advisor-chat",
          },
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Ava request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = eventFromLine(line);
          if (event) handleEvent(event);
        }
      }

      if (buffer.trim()) {
        const event = eventFromLine(buffer);
        if (event) handleEvent(event);
      }

      if (!sawRenderableAnswer) {
        setAgentTurn(agentTurnId, {
          body: "I could not form a usable Intelligence answer from the response stream. Please try again.",
        });
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Ava could not complete the request.";
      setError(message);
      setStatus("error");
      setAgentTurn(agentTurnId, {
        body: `Ava could not complete that request: ${message}`,
      });
    }
  }

  const workspace = (
    <section
      data-testid="sentinel-reasoning-workspace"
      style={{
        minHeight: "min(760px, calc(100svh - 184px))",
        background: SHELL.PAPER,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 20px",
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: SHELL.INK_MUTED,
              marginBottom: 5,
            }}
          >
            Intelligence canvas
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 24,
              lineHeight: 1.15,
              color: SHELL.INK,
            }}
          >
            Current answer, evidence, and exhibits.
          </h2>
        </div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color:
              status === "error"
                ? "#9F1D1D"
                : status === "streaming"
                  ? "#7A5A00"
                  : SHELL.INK_MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            whiteSpace: "nowrap",
          }}
        >
          {status === "streaming" ? "Working" : status}
        </div>
      </div>

      <div style={{ padding: 20, display: "grid", gap: 14 }}>
        {currentQuestion ? (
          <div
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              padding: "12px 14px",
              background: "#FFFFFF",
              color: SHELL.INK,
              fontFamily: SHELL.SANS,
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            <strong style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>
              CURRENT QUESTION
            </strong>
            <div style={{ marginTop: 6 }}>{currentQuestion}</div>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            style={{
              border: "1px solid rgba(159,29,29,0.24)",
              borderRadius: 8,
              padding: 12,
              color: "#9F1D1D",
              background: "#FFF6F4",
              fontFamily: SHELL.SANS,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        {!currentQuestion && cards.length === 0 && !currentAnswer ? (
          <div
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              padding: 18,
              background: "#FFFFFF",
              color: SHELL.INK_MUTED,
              fontFamily: SHELL.SANS,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            Ask Ava for an advisor read. The conversation stays in the chat rail;
            this canvas holds the answer evidence, expert reasoning blocks, tables,
            charts, graphs, citations, and handoffs.
          </div>
        ) : null}

        {currentAnswer ? <AgentAnswerRenderer answer={currentAnswer} /> : null}

        {[...cards]
          .sort((a, b) => a.sequence - b.sequence)
          .map((card) => (
            <details
              key={card.id}
              open
              data-testid={`sentinel-stage-card-${card.id}`}
              style={{
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 8,
                background: "#FFFFFF",
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  listStyle: "none",
                  cursor: "pointer",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
                }}
              >
                <span
                  style={{
                    fontFamily: SHELL.SERIF,
                    fontSize: 18,
                    color: SHELL.INK,
                  }}
                >
                  {card.sequence}. {card.name}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 11,
                    color: SHELL.GRAY_TEXT,
                  }}
                >
                  {Math.round(card.confidence * 100)}%
                </span>
              </summary>
              <div style={{ padding: 14, display: "grid", gap: 12 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: SHELL.SANS,
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: SHELL.INK,
                  }}
                >
                  {card.content}
                </p>
                {card.dissent ? (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SHELL.SANS,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: SHELL.INK_MUTED,
                    }}
                  >
                    {card.dissent}
                  </p>
                ) : null}
                {card.citations.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {card.citations.map((citation) => (
                      <a
                        key={`${citation.sourceType}:${citation.id}:${citation.version ?? ""}`}
                        href={citation.url ?? "#"}
                        style={{
                          border: `1px solid ${SHELL.CARD_LINE}`,
                          borderRadius: 999,
                          padding: "5px 8px",
                          color: SHELL.INK,
                          textDecoration: "none",
                          fontFamily: SHELL.MONO,
                          fontSize: 10,
                          background: "#FFFFFF",
                        }}
                      >
                        {citation.id}
                        {citation.version ? ` v${citation.version}` : ""}
                      </a>
                    ))}
                  </div>
                ) : null}
                {card.oneClickAction ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => void shapeMoves()}
                      style={{
                        border: `1px solid ${SHELL.INK}`,
                        background: SHELL.INK,
                        color: SHELL.PAPER,
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontFamily: SHELL.MONO,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      {card.oneClickAction.label}
                    </button>
                    {actionState ? (
                      <span
                        style={{
                          fontFamily: SHELL.SANS,
                          fontSize: 12,
                          color: SHELL.INK_MUTED,
                        }}
                      >
                        {actionState}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </details>
          ))}

        {evidenceSources.length > 0 ? (
          <EvidenceBasis
            sources={evidenceSources}
            coverageReport={coverageReport}
            tone="light"
          />
        ) : null}
      </div>
    </section>
  );

  return (
    <AgentDock
      agent={AVA_INTELLIGENCE_AGENT}
      surface="intelligence"
      defaultMode="side-rail"
      defaultLeftPercent={32}
      minLeftPx={320}
      surfaceContext={{
        clientKey: initialClient,
        activeClient: initialClientDisplayName,
        activeTab: "intelligence-advisor-chat",
      }}
      suggestedActions={DEFAULT_SUGGESTIONS}
      thread={thread}
      onMessage={ask}
      workspace={workspace}
      isAgentBusy={status === "streaming"}
    />
  );
}
