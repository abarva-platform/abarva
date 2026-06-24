"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { AttachmentRef, ChatMessage } from "@/components/agent/AgentDock";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { AvaCanvas, AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import { EvidenceBasis } from "@/components/intelligence/EvidenceBasis";
import { SHELL } from "@/lib/shell/shell-tokens";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
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
  | { type: "agent-answer"; answer?: AvaAnswerPacket }
  | { type: "done"; telemetryEventId?: string }
  | { type: "error"; error?: string };

type WorkspaceTab = "answer" | "evidence" | "experts" | "corpus" | "artifacts";

const AVA_INTELLIGENCE_AGENT = {
  initials: "aVa",
  mark: "ava" as const,
  name: "aVa",
  role: "Intelligence advisor",
};

function eventFromLine(line: string): StreamEvent | null {
  try {
    return JSON.parse(line) as StreamEvent;
  } catch {
    return null;
  }
}

function messageWithAttachments(
  text: string,
  attachments: AttachmentRef[],
): string {
  if (attachments.length === 0) return text;
  const names = attachments
    .map((attachment) => attachment.file_name)
    .join(", ");
  const previews = attachments
    .filter((attachment) => attachment.extracted_text_preview?.trim())
    .map(
      (attachment) =>
        `--- attachment: ${attachment.file_name} (${attachment.mime}) ---\n${attachment.extracted_text_preview}\n--- end attachment ---`,
    )
    .join("\n\n");
  const visible = text
    ? `${text}\n\n[attached: ${names}]`
    : `[attached: ${names}]`;
  return previews ? `${visible}\n\n${previews}` : visible;
}

function InsightTile({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div style={INSIGHT_TILE_STYLE}>
      <div style={CARD_EYEBROW_STYLE}>{eyebrow}</div>
      <h3 style={INSIGHT_TITLE_STYLE}>{title}</h3>
      <p style={BODY_TEXT_STYLE}>{body}</p>
    </div>
  );
}

function EmptyTabMessage({ text }: { text: string }) {
  return (
    <div style={CARD_STYLE}>
      <p style={MUTED_BODY_TEXT_STYLE}>{text}</p>
    </div>
  );
}

function answerForThread(answer: AvaAnswerPacket): AvaAnswerPacket {
  return {
    ...answer,
    surface: "intelligence",
    directAnswer: answer.directAnswer || "aVa returned structured evidence for this answer.",
  };
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
  const [currentAnswer, setCurrentAnswer] = useState<AvaAnswerPacket | null>(
    null,
  );
  const [currentNarrative, setCurrentNarrative] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("answer");
  const [evidenceSources, setEvidenceSources] = useState<AskSource[]>([]);
  const [coverageReport, setCoverageReport] = useState<
    CoverageReport | undefined
  >(undefined);
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
        ? `/programs/new?fromIntelligence=1&intelligenceSessionId=${encodeURIComponent(sessionId)}&sourceTitle=${encodeURIComponent("aVa Intelligence Ask")}`
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
        setActionState(
          "DAG API pending; proposals are staged for Moves handoff.",
        );
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
      setActionState(
        "DAG API pending; proposals are staged for Moves handoff.",
      );
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
    setCurrentNarrative("");
    setActiveTab("answer");
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
          setAgentTurn(agentTurnId, {
            body:
              accumulatedText.trim() ||
              "I found expert reasoning blocks and am forming the answer...",
          });
          return next;
        });
        return;
      }
      if (event.type === "delta" && event.text) {
        sawRenderableAnswer = true;
        accumulatedText += event.text;
        setCurrentNarrative(accumulatedText);
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
        setCurrentNarrative(event.answer.directAnswer);
        setAgentTurn(agentTurnId, {
          body: event.answer.directAnswer,
          agentAnswer: answerForThread(event.answer),
        });
        return;
      }
      if (event.type === "done" && event.telemetryEventId) {
        setAgentTurn(agentTurnId, { feedbackEventId: event.telemetryEventId });
        return;
      }
      if (event.type === "error") {
        throw new Error(event.error ?? "aVa stream error");
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
        throw new Error(`aVa request failed (${response.status})`);
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
          : "aVa could not complete the request.";
      setError(message);
      setStatus("error");
      setAgentTurn(agentTurnId, {
        body: `aVa could not complete that request: ${message}`,
      });
    }
  }

  const sortedCards = [...cards].sort((a, b) => a.sequence - b.sequence);
  const expertRefs = currentAnswer?.expertsUsed ?? [];
  const answerCitations = currentAnswer?.citations ?? [];
  const corpusSources = evidenceSources.filter((source) =>
    [
      "PATTERN",
      "RESEARCH",
      "REGULATION",
      "BENCHMARK",
      "INSIGHT",
      "WORLDVIEW",
    ].includes(source.type),
  );
  const artifactCount = currentAnswer?.artifacts.length ?? 0;
  const tabItems: Array<{
    id: WorkspaceTab;
    label: string;
    count?: number;
  }> = [
    { id: "answer", label: "Answer" },
    {
      id: "evidence",
      label: "Evidence",
      count: evidenceSources.length + answerCitations.length,
    },
    {
      id: "experts",
      label: "Experts",
      count: expertRefs.length + sortedCards.length,
    },
    { id: "corpus", label: "Corpus", count: corpusSources.length },
    { id: "artifacts", label: "Artifacts", count: artifactCount },
  ];

  const workspaceTabContent = (() => {
    if (
      !currentQuestion &&
      !currentAnswer &&
      !currentNarrative &&
      sortedCards.length === 0
    ) {
      return (
        <div style={EMPTY_CANVAS_STYLE}>
          <div style={INSIGHT_GRID_STYLE}>
            <InsightTile
              eyebrow="Advisor read"
              title="Ask a business question."
              body="aVa will keep the conversation on the left and build the analysis workspace here."
            />
            <InsightTile
              eyebrow="Evidence"
              title="Citations stay inspectable."
              body="Tenant facts, corpus patterns, expert lenses, tables, charts, and graphs land in this canvas."
            />
            <InsightTile
              eyebrow="Explore"
              title="Browse what supports the answer."
              body="Switch tabs to inspect sources, relevant experts, corpus patterns, and generated artifacts."
            />
          </div>
        </div>
      );
    }

    if (activeTab === "evidence") {
      return (
        <div style={CANVAS_STACK_STYLE}>
          {evidenceSources.length > 0 ? (
            <EvidenceBasis
              sources={evidenceSources}
              coverageReport={coverageReport}
              tone="light"
            />
          ) : null}
          {answerCitations.length > 0 ? (
            <div style={CARD_STYLE}>
              <h3 style={CARD_TITLE_STYLE}>Answer citations</h3>
              <div style={PILL_GRID_STYLE}>
                {answerCitations.map((citation) => (
                  <span key={citation.id} style={PILL_STYLE}>
                    {citation.label || citation.id}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {evidenceSources.length === 0 && answerCitations.length === 0 ? (
            <EmptyTabMessage text="No citations were attached to this answer yet." />
          ) : null}
        </div>
      );
    }

    if (activeTab === "experts") {
      return (
        <div style={CANVAS_STACK_STYLE}>
          {expertRefs.length > 0 ? (
            <div style={CARD_STYLE}>
              <h3 style={CARD_TITLE_STYLE}>Consilium experts</h3>
              <div style={PILL_GRID_STYLE}>
                {expertRefs.map((expert) => (
                  <span key={expert.id} style={PILL_STYLE}>
                    {expert.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {sortedCards.length > 0 ? (
            <div style={CANVAS_STACK_STYLE}>
              {sortedCards.map((card) => (
                <details
                  key={card.id}
                  open
                  data-testid={`sentinel-stage-card-${card.id}`}
                  style={CARD_STYLE}
                >
                  <summary style={STAGE_SUMMARY_STYLE}>
                    <span>
                      {card.sequence}. {card.name}
                    </span>
                    <span style={STAGE_CONFIDENCE_STYLE}>
                      {Math.round(card.confidence * 100)}%
                    </span>
                  </summary>
                  <div style={STAGE_BODY_STYLE}>
                    <p style={BODY_TEXT_STYLE}>{card.content}</p>
                    {card.dissent ? (
                      <p style={MUTED_BODY_TEXT_STYLE}>{card.dissent}</p>
                    ) : null}
                    {card.citations.length > 0 ? (
                      <div style={PILL_GRID_STYLE}>
                        {card.citations.map((citation) => (
                          <span key={citation.id} style={PILL_STYLE}>
                            {citation.label || citation.id} ·{" "}
                            {citation.sourceType}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {card.oneClickAction ? (
                      <div
                        style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                      >
                        <button
                          type="button"
                          onClick={() => void shapeMoves()}
                          style={PRIMARY_ACTION_STYLE}
                        >
                          {card.oneClickAction.label}
                        </button>
                        {actionState ? (
                          <span style={MUTED_BODY_TEXT_STYLE}>
                            {actionState}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          ) : null}
          {expertRefs.length === 0 && sortedCards.length === 0 ? (
            <EmptyTabMessage text="No named expert pack or reasoning block was attached yet." />
          ) : null}
        </div>
      );
    }

    if (activeTab === "corpus") {
      return (
        <div style={CANVAS_STACK_STYLE}>
          {corpusSources.length > 0 ? (
            corpusSources.map((source) => (
              <div
                key={`${source.type}:${source.id ?? source.name}`}
                style={CARD_STYLE}
              >
                <div style={CARD_EYEBROW_STYLE}>
                  {source.type.toLowerCase()}
                </div>
                <h3 style={CARD_TITLE_STYLE}>{source.name}</h3>
                <p style={BODY_TEXT_STYLE}>{source.detail}</p>
              </div>
            ))
          ) : (
            <EmptyTabMessage text="No corpus pattern or benchmark source was attached yet." />
          )}
        </div>
      );
    }

    if (activeTab === "artifacts") {
      return currentAnswer ? (
        <AgentAnswerRenderer answer={currentAnswer} />
      ) : (
        <EmptyTabMessage text="No typed tables, charts, or graphs were attached yet." />
      );
    }

    return (
      <div style={CANVAS_STACK_STYLE}>
        {currentQuestion ? (
          <div style={QUESTION_CARD_STYLE}>
            <strong style={MONO_LABEL_STYLE}>Current question</strong>
            <div style={{ marginTop: 6 }}>{currentQuestion}</div>
          </div>
        ) : null}
        {error ? (
          <div role="alert" style={ERROR_STYLE}>
            {error}
          </div>
        ) : null}
        {currentAnswer ? (
          <AgentAnswerRenderer answer={currentAnswer} />
        ) : currentNarrative.trim() ? (
          <div style={CARD_STYLE}>
            <h3 style={CARD_TITLE_STYLE}>Advisor answer</h3>
            <p style={ANSWER_TEXT_STYLE}>{currentNarrative}</p>
          </div>
        ) : status === "streaming" ? (
          <div style={CARD_STYLE}>
            <h3 style={CARD_TITLE_STYLE}>Working</h3>
            <p style={BODY_TEXT_STYLE}>
              aVa is reading tenant evidence, corpus patterns, and expert
              context.
            </p>
          </div>
        ) : null}
      </div>
    );
  })();

  const workspace = (
    <AvaCanvas
      eyebrow="Intelligence canvas"
      title="Explore the answer, evidence, experts, and corpus."
      status={status === "streaming" ? "Working" : status}
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as WorkspaceTab)}
      testId="sentinel-reasoning-workspace"
      tabTestIdPrefix="intelligence-workspace-tab"
    >
      <div data-testid={`intelligence-workspace-panel-${activeTab}`}>
        {workspaceTabContent}
      </div>
    </AvaCanvas>
  );

  return (
    <AvaChatShell
      surface="intelligence"
      defaultLeftPercent={32}
      minLeftPx={320}
      agent={AVA_INTELLIGENCE_AGENT}
      placeholder="Ask aVa about this enterprise context..."
      surfaceContext={{
        clientKey: initialClient,
        activeClient: initialClientDisplayName,
        activeTab: "intelligence-advisor-chat",
      }}
      suggestedActions={[]}
      thread={thread}
      onMessage={ask}
      canvas={workspace}
      isBusy={status === "streaming"}
    />
  );
}

const CANVAS_STACK_STYLE: CSSProperties = {
  display: "grid",
  gap: 14,
};

const EMPTY_CANVAS_STYLE: CSSProperties = {
  display: "grid",
  gap: 16,
};

const INSIGHT_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const CARD_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: "#FFFFFF",
  padding: 16,
  overflow: "hidden",
};

const INSIGHT_TILE_STYLE: CSSProperties = {
  ...CARD_STYLE,
  minHeight: 158,
};

const CARD_EYEBROW_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: "#14794C",
  marginBottom: 8,
};

const CARD_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 16,
  lineHeight: 1.25,
  color: SHELL.INK,
};

const INSIGHT_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SERIF,
  fontSize: 22,
  lineHeight: 1.12,
  color: SHELL.INK,
};

const BODY_TEXT_STYLE: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 14,
  lineHeight: 1.55,
  color: SHELL.INK,
};

const MUTED_BODY_TEXT_STYLE: CSSProperties = {
  ...BODY_TEXT_STYLE,
  color: SHELL.INK_MUTED,
};

const ANSWER_TEXT_STYLE: CSSProperties = {
  ...BODY_TEXT_STYLE,
  whiteSpace: "pre-wrap",
};

const QUESTION_CARD_STYLE: CSSProperties = {
  ...CARD_STYLE,
  color: SHELL.INK,
  fontFamily: SHELL.SANS,
  fontSize: 14,
  lineHeight: 1.45,
};

const MONO_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const ERROR_STYLE: CSSProperties = {
  border: "1px solid rgba(159,29,29,0.24)",
  borderRadius: 8,
  padding: 12,
  color: "#9F1D1D",
  background: "#FFF6F4",
  fontFamily: SHELL.SANS,
  fontSize: 14,
};

const PILL_GRID_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 12,
};

const PILL_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  padding: "6px 9px",
  background: "#FFFFFF",
  color: SHELL.INK,
  fontFamily: SHELL.SANS,
  fontSize: 13,
};

const STAGE_SUMMARY_STYLE: CSSProperties = {
  listStyle: "none",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontFamily: SHELL.SERIF,
  fontSize: 18,
  color: SHELL.INK,
};

const STAGE_CONFIDENCE_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.GRAY_TEXT,
};

const STAGE_BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  paddingTop: 12,
};

const PRIMARY_ACTION_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.INK}`,
  background: SHELL.INK,
  color: SHELL.PAPER,
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: SHELL.MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
  cursor: "pointer",
};
