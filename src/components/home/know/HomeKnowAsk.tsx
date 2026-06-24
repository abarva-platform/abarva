"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { HomeKnowAnswerRenderer } from "@/components/home/know/HomeKnowAnswerRenderer";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

const CSS = `
.homeKnowAsk{--hka-line:#E7E3DA;--hka-ink:#1A1A18;--hka-muted:#6B6B63;--hka-faint:#9A998E;--hka-green:#1F6B3A;--hka-card:#fff;--hka-user:#F3F8F5;display:flex;flex:1;flex-direction:column;gap:12px;min-height:0;height:100%;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif}
.homeKnowAsk .hka-barShell{position:sticky;bottom:0;z-index:3;background:linear-gradient(180deg,rgba(255,255,255,0),#fff 22%);padding:14px 0 10px;margin-top:auto}
.homeKnowAsk .hka-bar{display:flex;align-items:flex-start;gap:10px;background:var(--hka-card);border:1px solid var(--hka-line);border-radius:14px;padding:10px 10px 10px 18px;width:100%;box-shadow:0 10px 30px rgba(15,23,42,.08)}
.homeKnowAsk .hka-bar:focus-within{border-color:#22AEEA;box-shadow:0 0 0 3px rgba(34,174,234,.12)}
.homeKnowAsk .avaAskMark{flex:none;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-weight:800;font-size:28px;line-height:1;letter-spacing:-.08em;color:#22AEEA;min-width:50px;text-align:center;margin-top:2px}
.homeKnowAsk .avaAskMark-v{color:#12AFCB}
.homeKnowAsk .avaAskMark-a{color:#23B8E6}
.homeKnowAsk .hka-bar textarea{flex:1;min-height:28px;max-height:150px;border:none;outline:none;font:inherit;font-size:14px;line-height:1.45;background:transparent;color:var(--hka-ink);resize:none;overflow:auto;padding:4px 0 0}
.homeKnowAsk .hka-bar button{background:var(--hka-ink);color:#fff;border:none;border-radius:9px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;min-width:64px}
.homeKnowAsk .hka-bar button:disabled{opacity:.52;cursor:default}
.homeKnowAsk .hka-suggestions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start}
.homeKnowAsk .hka-chip{display:inline-flex;align-items:center;border:1px solid var(--hka-line);border-radius:20px;padding:6px 13px;font-size:12px;color:#3a3a34;cursor:pointer;background:var(--hka-card);max-width:100%;white-space:normal;text-align:left}
.homeKnowAsk .hka-chip:disabled{opacity:.55;cursor:default}
.homeKnowAsk .hka-chip:hover{border-color:#c6ded0;color:var(--hka-green)}
.homeKnowAsk .hka-thread{display:flex;flex:1;flex-direction:column;gap:18px;min-height:0;overflow:auto;padding:14px 2px 0}
.homeKnowAsk .hka-threadHead{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.homeKnowAsk .hka-threadTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--hka-green);font-weight:750}
.homeKnowAsk .hka-threadCount{font-size:12px;color:var(--hka-faint)}
.homeKnowAsk .hka-turn{display:flex;flex-direction:column;gap:10px;scroll-margin-top:96px}
.homeKnowAsk .hka-userRow,.homeKnowAsk .hka-assistantRow{display:flex;width:100%}
.homeKnowAsk .hka-userRow{justify-content:flex-end}
.homeKnowAsk .hka-assistantRow{justify-content:flex-start}
.homeKnowAsk .hka-question{background:var(--hka-user);border:1px solid #D9ECDD;border-radius:18px 18px 4px 18px;padding:10px 14px;display:grid;gap:3px;color:#1f2b20;max-width:min(720px,86%);box-shadow:0 1px 0 rgba(15,23,42,.02)}
.homeKnowAsk .hka-questionMeta{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.homeKnowAsk .hka-questionText{font-size:14px;line-height:1.5;white-space:pre-wrap}
.homeKnowAsk .hka-loading,.homeKnowAsk .hka-error{background:#fff;border:1px solid var(--hka-line);border-radius:18px 18px 18px 4px;padding:16px 18px;color:var(--hka-faint);font-size:13.5px;max-width:min(760px,92%)}
.homeKnowAsk .hka-error{color:#7f1d1d;background:#fff7f7}
@media(max-width:720px){.homeKnowAsk .hka-bar{max-width:none}.homeKnowAsk .hka-question,.homeKnowAsk .hka-loading,.homeKnowAsk .hka-error{max-width:100%}.homeKnowAsk .hka-suggestions{justify-content:flex-start}}
`;

const CONTEXT_EXPLORER_SUGGESTIONS = [
  "What context is loaded for this tenant?",
  "Show the loaded context dimensions in a table.",
  "How is our IT organization structured today?",
  "Which systems of record are loaded?",
  "Show vendor and contract coverage.",
  "What fields are missing?",
];

type HomeKnowTurn = {
  id: string;
  question: string;
  response: HomeKnowResponse | null;
  fetching: boolean;
  error: string | null;
};

function resizeAskTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
}

function resetAskTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
}

function newTurnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isHomeKnowResponse(value: unknown): value is HomeKnowResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.mode === "KNOW" && typeof record.intent === "string";
}

export function HomeKnowAsk({
  tenantKey,
  client,
  placeholder = "Ask what is loaded in your enterprise context…",
  showSuggestions = true,
  suggestedQuestions = [],
}: {
  tenantKey?: string | null;
  client?: string | null;
  placeholder?: string;
  showSuggestions?: boolean;
  suggestedQuestions?: string[];
}) {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<HomeKnowTurn[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const contextSuggestions =
    suggestedQuestions.length > 0
      ? suggestedQuestions
      : CONTEXT_EXPLORER_SUGGESTIONS;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefix = "abarva.homeKnow.thread.";
    try {
      for (
        let index = window.sessionStorage.length - 1;
        index >= 0;
        index -= 1
      ) {
        const key = window.sessionStorage.key(index);
        if (key?.startsWith(prefix)) {
          window.sessionStorage.removeItem(key);
        }
      }
    } catch {
      // Storage cleanup is best-effort; the chat itself stays live.
    }
    setTurns([]);
  }, [client, tenantKey]);

  useEffect(() => {
    if (typeof threadEndRef.current?.scrollIntoView === "function") {
      threadEndRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [turns.length]);

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      const turnId = newTurnId();
      const updateTurn = (
        patch: Partial<Omit<HomeKnowTurn, "id" | "question">>,
      ) => {
        setTurns((current) =>
          current.map((turn) =>
            turn.id === turnId ? { ...turn, ...patch } : turn,
          ),
        );
      };

      setQuery("");
      resetAskTextarea(textareaRef.current);
      const ctrl = new AbortController();
      setTurns([
        {
          id: turnId,
          question: trimmed,
          response: null,
          fetching: true,
          error: null,
        },
      ]);

      try {
        const res = await fetch("/api/home/know/ask", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmed,
            tenantKey,
            client,
          }),
          signal: ctrl.signal,
        });

        const payload = await res.json().catch(() => null);
        if (!res.ok || !isHomeKnowResponse(payload)) {
          updateTurn({
            error:
              payload &&
              typeof payload === "object" &&
              !Array.isArray(payload) &&
              typeof (payload as { error?: unknown }).error === "string"
                ? (payload as { error: string }).error
                : "aVa could not use the loaded Home context yet.",
          });
          return;
        }

        updateTurn({ response: payload });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          updateTurn({
            error: "aVa could not use the loaded Home context yet.",
          });
        }
      } finally {
        updateTurn({ fetching: false });
      }
    },
    [client, tenantKey],
  );

  return (
    <div className="homeKnowAsk">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {turns.length > 0 ? (
        <div aria-label="Home KNOW conversation" className="hka-thread">
          <div className="hka-threadHead">
            <div className="hka-threadTitle">Conversation history</div>
            <div className="hka-threadCount">
              {turns.length} {turns.length === 1 ? "question" : "questions"}
            </div>
          </div>
          {turns.map((turn, index) => {
            const isLatestTurn = index === turns.length - 1;
            return (
              <div className="hka-turn" key={turn.id}>
                <div className="hka-userRow">
                  <div className="hka-question">
                    <div className="hka-questionMeta">
                      You · Question {index + 1}
                    </div>
                    <div className="hka-questionText">{turn.question}</div>
                  </div>
                </div>
                {turn.response ? (
                  <div className="hka-assistantRow">
                    <HomeKnowAnswerRenderer
                      compact={!isLatestTurn}
                      response={turn.response}
                    />
                  </div>
                ) : turn.error ? (
                  <div className="hka-assistantRow">
                    <div className="hka-error" role="status">
                      {turn.error}
                    </div>
                  </div>
                ) : turn.fetching ? (
                  <div className="hka-assistantRow">
                    <div className="hka-loading" role="status">
                      Checking loaded context…
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          <div ref={threadEndRef} />
        </div>
      ) : null}

      {showSuggestions &&
      turns.length === 0 &&
      contextSuggestions.length > 0 ? (
        <div
          aria-label="Suggested Home KNOW questions"
          className="hka-suggestions"
        >
          {contextSuggestions.map((suggestion) => (
            <button
              className="hka-chip"
              key={suggestion}
              onClick={() => ask(suggestion)}
              title={suggestion}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className="hka-barShell">
        <div className="hka-bar">
          <AvaAskMark />
          <textarea
            ref={textareaRef}
            aria-label="Ask Home KNOW"
            onChange={(event) => {
              setQuery(event.target.value);
              resizeAskTextarea(event.currentTarget);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask(query);
              }
            }}
            placeholder={placeholder}
            rows={1}
            value={query}
          />
          <button
            disabled={!query.trim()}
            onClick={() => ask(query)}
            type="button"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
