"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { HomeKnowAnswerRenderer } from "@/components/home/know/HomeKnowAnswerRenderer";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

const CSS = `
.homeKnowAsk{--hka-line:#E7E3DA;--hka-ink:#1A1A18;--hka-muted:#6B6B63;--hka-faint:#9A998E;--hka-green:#1F6B3A;--hka-card:#fff;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif}
.homeKnowAsk .hka-bar{display:flex;align-items:flex-start;gap:10px;background:var(--hka-card);border:1px solid var(--hka-line);border-radius:14px;padding:10px 10px 10px 18px;max-width:760px;margin:0 auto;box-shadow:0 1px 0 rgba(15,23,42,.02)}
.homeKnowAsk .hka-bar:focus-within{border-color:#22AEEA;box-shadow:0 0 0 3px rgba(34,174,234,.12)}
.homeKnowAsk .avaAskMark{flex:none;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-weight:800;font-size:28px;line-height:1;letter-spacing:-.08em;color:#22AEEA;min-width:50px;text-align:center;margin-top:2px}
.homeKnowAsk .avaAskMark-v{color:#12AFCB}
.homeKnowAsk .avaAskMark-a{color:#23B8E6}
.homeKnowAsk .hka-bar textarea{flex:1;min-height:28px;max-height:150px;border:none;outline:none;font:inherit;font-size:14px;line-height:1.45;background:transparent;color:var(--hka-ink);resize:none;overflow:auto;padding:4px 0 0}
.homeKnowAsk .hka-bar button{background:var(--hka-ink);color:#fff;border:none;border-radius:9px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;min-width:64px}
.homeKnowAsk .hka-bar button:disabled{opacity:.52;cursor:default}
.homeKnowAsk .hka-suggestions{max-width:960px;margin:12px auto 0;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.homeKnowAsk .hka-chip{display:inline-flex;align-items:center;border:1px solid var(--hka-line);border-radius:20px;padding:5px 13px;font-size:12px;color:#3a3a34;cursor:pointer;background:var(--hka-card)}
.homeKnowAsk .hka-chip:disabled{opacity:.55;cursor:default}
.homeKnowAsk .hka-chip:hover{border-color:#c6ded0;color:var(--hka-green)}
.homeKnowAsk .hka-thread{max-width:960px;margin:22px auto 0;display:flex;flex-direction:column;gap:16px}
.homeKnowAsk .hka-threadHead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;border-bottom:1px solid var(--hka-line);padding-bottom:8px}
.homeKnowAsk .hka-threadTitle{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--hka-green);font-weight:750}
.homeKnowAsk .hka-threadCount{font-size:12px;color:var(--hka-faint)}
.homeKnowAsk .hka-turn{display:flex;flex-direction:column;gap:10px;scroll-margin-top:96px}
.homeKnowAsk .hka-question{background:#F6F4EE;border:1px solid var(--hka-line);border-radius:12px;padding:10px 13px;display:grid;gap:4px;color:#2b2b26}
.homeKnowAsk .hka-questionMeta{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--hka-faint);font-weight:750}
.homeKnowAsk .hka-questionText{font-size:14px;line-height:1.5;white-space:pre-wrap}
.homeKnowAsk .hka-loading,.homeKnowAsk .hka-error{background:#fff;border:1px solid var(--hka-line);border-radius:12px;padding:18px 22px;color:var(--hka-faint);font-size:13.5px}
.homeKnowAsk .hka-error{color:#7f1d1d;background:#fff7f7}
`;

const MAX_STORED_TURNS = 12;

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
  suggestedQuestions = [],
}: {
  tenantKey?: string | null;
  client?: string | null;
  placeholder?: string;
  suggestedQuestions?: string[];
}) {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<HomeKnowTurn[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const storageKey = useMemo(
    () => `abarva.homeKnow.thread.${tenantKey ?? client ?? "default"}`,
    [client, tenantKey],
  );

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) {
        setTurns([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setTurns([]);
        return;
      }
      setTurns(
        parsed
          .filter((turn): turn is HomeKnowTurn => {
            if (!turn || typeof turn !== "object" || Array.isArray(turn)) return false;
            const candidate = turn as Partial<HomeKnowTurn>;
            return (
              typeof candidate.id === "string" &&
              typeof candidate.question === "string" &&
              (candidate.response === null || isHomeKnowResponse(candidate.response)) &&
              typeof candidate.error !== "undefined"
            );
          })
          .map((turn) => ({ ...turn, fetching: false }))
          .slice(-MAX_STORED_TURNS),
      );
    } catch {
      setTurns([]);
    }
  }, [storageKey]);

  useEffect(() => {
    const completedTurns = turns
      .filter((turn) => !turn.fetching)
      .map((turn) => ({ ...turn, fetching: false }))
      .slice(-MAX_STORED_TURNS);
    try {
      if (completedTurns.length === 0) {
        window.sessionStorage.removeItem(storageKey);
      } else {
        window.sessionStorage.setItem(storageKey, JSON.stringify(completedTurns));
      }
    } catch {
      // Session history is helpful, but the chat must keep working if storage is blocked.
    }
  }, [storageKey, turns]);

  useEffect(() => {
    if (typeof threadEndRef.current?.scrollIntoView === "function") {
      threadEndRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [turns.length]);

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      const turnId = newTurnId();
      const updateTurn = (patch: Partial<Omit<HomeKnowTurn, "id" | "question">>) => {
        setTurns((current) =>
          current.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)),
        );
      };

      setQuery("");
      resetAskTextarea(textareaRef.current);
      const ctrl = new AbortController();
      setTurns((current) => [
        ...current.slice(-(MAX_STORED_TURNS - 1)),
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
                : "Ava could not read the loaded Home context.",
          });
          return;
        }

        updateTurn({ response: payload });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          updateTurn({ error: "Ava could not read the loaded Home context." });
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

      {suggestedQuestions.length > 0 ? (
        <div aria-label="Suggested Home KNOW questions" className="hka-suggestions">
          {suggestedQuestions.map((suggestion) => (
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

      {turns.length > 0 ? (
        <div aria-label="Home KNOW conversation" className="hka-thread">
          <div className="hka-threadHead">
            <div className="hka-threadTitle">Conversation history</div>
            <div className="hka-threadCount">
              {turns.length} {turns.length === 1 ? "question" : "questions"}
            </div>
          </div>
          {turns.map((turn, index) => (
            <div className="hka-turn" key={turn.id}>
              <div className="hka-question">
                <div className="hka-questionMeta">You asked · Question {index + 1}</div>
                <div className="hka-questionText">{turn.question}</div>
              </div>
              {turn.response ? (
                <HomeKnowAnswerRenderer response={turn.response} />
              ) : turn.error ? (
                <div className="hka-error" role="status">
                  {turn.error}
                </div>
              ) : turn.fetching ? (
                <div className="hka-loading" role="status">
                  Reading loaded context…
                </div>
              ) : null}
            </div>
          ))}
          <div ref={threadEndRef} />
        </div>
      ) : null}
    </div>
  );
}
