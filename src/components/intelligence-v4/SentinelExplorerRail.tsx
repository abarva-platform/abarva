"use client";

// SentinelExplorerRail · left sidebar for Context & Corpus Explorer
//
// 386px fixed width. Contains:
//  - Sentinel header with green pulsing dot
//  - Subtitle explaining the surface
//  - Scrollable conversation thread
//  - 4 starter question chips
//  - Sticky bottom textarea (Enter=submit, Shift+Enter=newline, auto-grow)
//  - Grounded chip on each answer showing which dimension powered it

import { useState, useRef, useCallback } from "react";

import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";

const C = {
  bg: "#F8F7F4",
  railBg: "#FCFBF8",
  panel: "#FFFFFF",
  ink: "#1B1A17",
  muted: "#6F6A61",
  line: "#E6E2DA",
  line2: "#EFECE5",
  chip: "#F1EEE7",
  fresh: "#3F7A5B",
  freshBg: "#3F7A5B14",
  attention: "#B5852A",
  attentionBg: "#B5852A18",
  stale: "#B4513C",
};

interface ConvoMessage {
  role: "user" | "agent";
  html: string;
  grounded?: string;
  grndCls?: "att" | "stale" | null;
}

const STARTER_QUESTIONS = [
  { key: "telling", label: "What is my context telling me right now?" },
  { key: "derive", label: "Derive a view of our vendor risk" },
  { key: "unlock", label: "What insights are blocked, and why?" },
  { key: "copilot", label: "Is our Copilot investment paying off?" },
] as const;

const OPENER_MSG: ConvoMessage = {
  role: "agent",
  html: "Ask me what the current context is telling you. I will use the live explorer routes where they are wired, and I will call out missing context instead of filling gaps.",
};

interface QaRouteEvent {
  type: "route";
  routeUsed: string;
  confidence: string;
  freshnessStatus: string;
  citationCount: number;
}

interface QaDoneEvent {
  type: "done";
  answer: {
    routeUsed: string;
    citations: unknown[];
    confidence: string;
    freshnessStatus: string;
  };
}

interface QaDeltaEvent {
  type: "delta";
  text: string;
}

interface QaErrorEvent {
  type: "error";
  error: string;
}

type QaEvent = QaRouteEvent | QaDoneEvent | QaDeltaEvent | QaErrorEvent;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function answerToHtml(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br />");
}

interface SentinelExplorerRailProps {
  tenantKey: string;
}

export function SentinelExplorerRail({ tenantKey }: SentinelExplorerRailProps) {
  const [messages, setMessages] = useState<ConvoMessage[]>([OPENER_MSG]);
  const [showStarters, setShowStarters] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convoRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (convoRef.current) {
        convoRef.current.scrollTop = convoRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const updateAgentMessage = useCallback(
    (index: number, patch: Partial<ConvoMessage>) => {
      setMessages((prev) =>
        prev.map((message, idx) =>
          idx === index ? { ...message, ...patch } : message,
        ),
      );
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const handleAsk = useCallback(
    async (questionText: string, key?: string) => {
      void key;
      if (!questionText.trim()) return;
      if (isAsking) return;
      setShowStarters(false);
      setIsAsking(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", html: escapeHtml(questionText) },
        {
          role: "agent",
          html: "Routing against live context…",
          grounded: "router · pending",
        },
      ]);
      scrollToBottom();
      const agentIndex = messages.length + 1;
      let routeLabel = "router";
      let citationCount = 0;
      let freshness = "unknown";
      let answerText = "";

      try {
        const response = await fetch("/api/intelligence/qa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ query: questionText, tenantKey }),
        });
        if (!response.ok || !response.body)
          throw new Error(`qa ${response.status}`);

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
            const event = JSON.parse(line) as QaEvent;
            if (event.type === "route") {
              routeLabel = event.routeUsed;
              citationCount = event.citationCount;
              freshness = event.freshnessStatus;
              updateAgentMessage(agentIndex, {
                grounded: `${routeLabel} · ${citationCount} cites · ${freshness}`,
              });
            } else if (event.type === "delta") {
              answerText += event.text;
              updateAgentMessage(agentIndex, {
                html: answerToHtml(answerText),
              });
            } else if (event.type === "done") {
              routeLabel = event.answer.routeUsed;
              citationCount = event.answer.citations.length;
              freshness = event.answer.freshnessStatus;
              updateAgentMessage(agentIndex, {
                html: answerToHtml(answerText),
                grounded: `${routeLabel} · ${citationCount} cites · ${freshness}`,
                grndCls:
                  freshness === "stale"
                    ? "stale"
                    : freshness === "attention"
                      ? "att"
                      : null,
              });
            } else if (event.type === "error") {
              throw new Error(event.error);
            }
          }
        }
      } catch (error) {
        updateAgentMessage(agentIndex, {
          html: `I could not complete that route: ${escapeHtml(error instanceof Error ? error.message : String(error))}`,
          grounded: "router · error",
          grndCls: "stale",
        });
      } finally {
        setIsAsking(false);
      }
    },
    [isAsking, messages.length, scrollToBottom, tenantKey, updateAgentMessage],
  );

  const handleSubmit = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const rawValue = textareaRef.current?.value ?? inputValue;
      const v = rawValue.trim();
    if (!v) return;
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
    handleAsk(v);
    },
    [inputValue, handleAsk],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      setInputValue(ta.value);
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 110) + "px";
    },
    [],
  );

  return (
    <aside
      style={{
        width: 386,
        minWidth: 386,
        borderRight: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
        background: C.railBg,
        height: "100%",
      }}
    >
      {/* Rail header */}
      <div
        style={{
          padding: "13px 17px 11px",
          borderBottom: `1px solid ${C.line2}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {/* Pulsing green dot */}
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: C.fresh,
              boxShadow: `0 0 0 3px ${C.freshBg}`,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 15,
              color: C.ink,
            }}
          >
            Ava
          </span>
        </div>
        <p
          style={{
            color: C.muted,
            fontSize: 11.5,
            marginTop: 3,
            lineHeight: 1.4,
            marginBottom: 0,
          }}
        >
          Ask what the context is telling you, or &ldquo;derive a view&rdquo;.
          Answers show citations when evidence is available.
        </p>
      </div>

      {/* Conversation thread */}
      <div
        ref={convoRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "15px 17px 6px",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 14,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            {msg.role === "user" ? (
              <span
                style={{
                  background: C.ink,
                  color: "#fff",
                  borderRadius: "13px 13px 4px 13px",
                  padding: "8px 12px",
                  display: "inline-block",
                  maxWidth: "90%",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                {msg.html}
              </span>
            ) : (
              <div
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 6,
                  padding: "12px 13px",
                }}
              >
                <p
                  style={{ fontSize: 13.5, margin: "0 0 8px" }}
                  dangerouslySetInnerHTML={{ __html: msg.html }}
                />
                {msg.grounded && (
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background:
                          msg.grndCls === "att"
                            ? C.attentionBg
                            : msg.grndCls === "stale"
                              ? `${C.stale}16`
                              : C.freshBg,
                        color:
                          msg.grndCls === "att"
                            ? C.attention
                            : msg.grndCls === "stale"
                              ? C.stale
                              : C.fresh,
                        border: `1px solid ${
                          msg.grndCls === "att"
                            ? `${C.attention}33`
                            : msg.grndCls === "stale"
                              ? `${C.stale}33`
                              : `${C.fresh}33`
                        }`,
                        display: "inline-block",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⬡ grounded · {msg.grounded}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Starter chips */}
      {showStarters && (
        <div style={{ padding: "0 17px 10px" }}>
          <div
            style={{
              fontSize: 10.5,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              color: C.muted,
              margin: "6px 0 7px",
            }}
          >
            Try asking
          </div>
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => handleAsk(q.label, q.key)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "#fff",
                border: `1px solid ${C.line}`,
                borderRadius: 6,
                padding: "8px 10px",
                marginBottom: 6,
                fontSize: 12.5,
                color: C.ink,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span style={{ color: C.muted, marginRight: 5 }}>›</span>
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Sticky bottom input */}
      <div
        style={{
          borderTop: `1px solid ${C.line}`,
          padding: "10px 13px 12px",
          background: C.railBg,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 7,
            background: "#fff",
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "7px 9px",
          }}
        >
          <AvaAskMark
            style={{
              minWidth: 34,
              fontSize: 20,
              alignSelf: "center",
            }}
          />
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInput}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder='Ask anything · or "derive a view of…"'
            spellCheck
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              fontSize: 13,
              lineHeight: 1.4,
              maxHeight: 110,
              background: "none",
              color: C.ink,
            }}
          />
          <button
            type="submit"
            aria-label="Ask Ava"
            disabled={isAsking}
            style={{
              width: 29,
              height: 29,
              borderRadius: 7,
              background: C.ink,
              color: "#fff",
              border: "none",
              fontSize: 15,
              cursor: !isAsking ? "pointer" : "default",
              opacity: !isAsking ? 1 : 0.4,
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </form>
        <div
          style={{
            fontSize: 10,
            color: C.muted,
            textAlign: "center",
            marginTop: 6,
          }}
        >
          Enter to submit · Shift+Enter for newline
        </div>
      </div>
    </aside>
  );
}
