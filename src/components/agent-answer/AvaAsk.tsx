"use client";

// Canonical "Ask Ava" — the ONE ask component every surface should use.
//
// It posts to the shared engine (/api/intelligence/ask), streams the answer, and
// renders it through the canonical Ava packet renderer — direct answer + exhibits +
// citations + named experts where allowed. No surface-local answer assembly, no per-surface
// renderer. Drop this into Home, Intelligence, Tower, Source, Moves and every
// surface answers (and renders) identically. This is what retires the static
// Home mock + its fake `answerForAsk`.
//
// Note on exhibits: this renders whatever AvaAnswerPacket the engine emits. Exhibit
// *quality* (e.g. not scraping figures out of prose) is the engine's job — fix it
// once, in the engine, and every surface using AvaAsk benefits at once.

import { useCallback, useRef, useState } from "react";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";

const CSS = `
.avaask{--aa-line:#E7E3DA;--aa-ink:#1A1A18;--aa-muted:#6B6B63;--aa-faint:#9A998E;--aa-green:#1F6B3A;--aa-card:#fff;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif}
.avaask .aa-bar{display:flex;align-items:center;gap:10px;background:var(--aa-card);border:1px solid var(--aa-line);border-radius:14px;padding:10px 10px 10px 18px;max-width:760px;margin:0 auto;box-shadow:0 1px 0 rgba(15,23,42,.02)}
.avaask .aa-bar:focus-within{border-color:#22AEEA;box-shadow:0 0 0 3px rgba(34,174,234,.12)}
.avaask .avaAskMark{flex:none;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-weight:800;font-size:28px;line-height:1;letter-spacing:-.08em;color:#22AEEA;min-width:50px;text-align:center}
.avaask .avaAskMark-v{color:#12AFCB}
.avaask .avaAskMark-a{color:#23B8E6}
.avaask .aa-bar textarea{flex:1;min-height:22px;max-height:140px;border:none;outline:none;font:inherit;font-size:14px;line-height:1.45;background:transparent;color:var(--aa-ink);resize:none;overflow:auto;padding:0}
.avaask .aa-bar button{background:var(--aa-ink);color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer}
.avaask .aa-bar button:disabled{opacity:.5;cursor:default}
.avaask .aa-suggestions{max-width:960px;margin:12px auto 0;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.avaask .aa-thread{max-width:960px;margin:16px auto 0;display:flex;flex-direction:column;gap:14px}
.avaask .aa-turn{display:flex;flex-direction:column;gap:8px}
.avaask .aa-user{align-self:flex-end;max-width:min(760px,90%);background:#F6F4EE;border:1px solid var(--aa-line);border-radius:12px;padding:9px 13px;font-size:13px;line-height:1.45;white-space:pre-wrap;color:#2b2b26}
.avaask .aa-box{max-width:960px;margin:16px auto 0;background:var(--aa-card);border:1px solid var(--aa-line);border-radius:12px;padding:18px 22px;text-align:left}
.avaask .aa-thread .aa-box{margin:0}
.avaask .aa-label{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--aa-green);margin-bottom:8px}
.avaask .aa-prose{font-size:14px;line-height:1.65;color:var(--aa-ink)}
.avaask .aa-think{color:var(--aa-faint);font-style:italic;font-size:13.5px}
.avaask .aa-exps{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px;padding-top:13px;border-top:1px solid var(--aa-line)}
.avaask .aa-exps-summary{display:inline-flex;align-items:center;border:1px solid var(--aa-line);border-radius:999px;padding:3px 9px;font-size:12px;color:var(--aa-muted);background:var(--aa-card);cursor:pointer}
.avaask .aa-exps-panel{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.avaask .aa-exp{display:inline-flex;align-items:center;background:#E7F0E9;color:var(--aa-green);border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:500}
.avaask .aa-fu{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
.avaask .aa-chip{display:inline-flex;align-items:center;border:1px solid var(--aa-line);border-radius:20px;padding:5px 13px;font-size:12px;color:#3a3a34;cursor:pointer;background:var(--aa-card)}
`;

type Evt = {
  type?: string;
  text?: string;
  contributingExperts?: { id: string; name: string }[];
  followups?: string[];
  answer?: AvaAnswerPacket;
};

type AvaTurn = {
  id: string;
  question: string;
  answer: string;
  experts: { id: string; name: string }[];
  followups: string[];
  agentAnswer: AvaAnswerPacket | null;
  fetching: boolean;
};

function resizeAskTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
}

function resetAskTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
}

export function AvaAsk({
  placeholder = "Ask about anything — data, vendors, risk, adoption, customers…",
  client,
  surfaceContext,
  suggestedQuestions = [],
}: {
  placeholder?: string;
  /** Optional tenant override; otherwise the session's active client is used. */
  client?: string;
  /** Surface tagging + page facts passed to the engine (e.g. activeTab "home"). */
  surfaceContext?: AskSurfaceContext;
  /** Optional surface-provided starters rendered by the canonical ask component. */
  suggestedQuestions?: string[];
}) {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<AvaTurn[]>([]);
  const [fetching, setFetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      const turnId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const updateTurn = (patch: Partial<Omit<AvaTurn, "id" | "question">>) => {
        setTurns((current) =>
          current.map((turn) =>
            turn.id === turnId ? { ...turn, ...patch } : turn,
          ),
        );
      };
      setQuery("");
      resetAskTextarea(textareaRef.current);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setFetching(true);
      setTurns((current) => [
        ...current,
        {
          id: turnId,
          question: trimmed,
          answer: "",
          experts: [],
          followups: [],
          agentAnswer: null,
          fetching: true,
        },
      ]);
      try {
        const res = await fetch("/api/intelligence/ask", {
          method: "POST",
          headers: {
            Accept: "application/x-ndjson",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: trimmed,
            client,
            format: "rich",
            surfaceContext,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          updateTurn({ answer: "Ava couldn't retrieve an answer. Try again." });
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) {
          updateTurn({ answer: scrubPublicAvaAnswerText(await res.text()) });
          return;
        }
        const dec = new TextDecoder();
        let buf = "";
        let prose = "";
        const apply = (raw: string) => {
          const s = raw.trim();
          if (!s) return;
          let evt: Evt;
          try {
            evt = JSON.parse(s);
          } catch {
            prose += prose ? `\n${s}` : s;
            updateTurn({ answer: scrubPublicAvaAnswerText(prose) });
            return;
          }
          if (evt.type === "delta" && typeof evt.text === "string") {
            prose += evt.text;
            updateTurn({ answer: scrubPublicAvaAnswerText(prose) });
          } else if (
            evt.type === "contributing-experts" &&
            Array.isArray(evt.contributingExperts)
          ) {
            updateTurn({ experts: evt.contributingExperts });
          } else if (evt.type === "followups" && Array.isArray(evt.followups)) {
            updateTurn({ followups: evt.followups });
          } else if (evt.type === "agent-answer" && evt.answer) {
            updateTurn({ agentAnswer: evt.answer });
          }
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            apply(buf.slice(0, nl));
            buf = buf.slice(nl + 1);
          }
        }
        apply(buf);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          updateTurn({ answer: "Ava couldn't retrieve an answer. Try again." });
        }
      } finally {
        updateTurn({ fetching: false });
        setFetching(false);
      }
    },
    [client, surfaceContext],
  );

  return (
    <div className="avaask">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="aa-bar">
        <AvaAskMark />
        <textarea
          ref={textareaRef}
          rows={1}
          value={query}
          placeholder={placeholder}
          aria-label="Ask Ava"
          onChange={(e) => {
            setQuery(e.target.value);
            resizeAskTextarea(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(query);
            }
          }}
          disabled={fetching}
        />
        <button
          type="button"
          onClick={() => ask(query)}
          disabled={fetching || !query.trim()}
        >
          {fetching ? "…" : "Ask"}
        </button>
      </div>

      {suggestedQuestions.length > 0 && (
        <div className="aa-suggestions" aria-label="Suggested questions">
          {suggestedQuestions.map((suggestion) => (
            <span
              className="aa-chip"
              key={suggestion}
              role="button"
              tabIndex={0}
              title={suggestion}
              onClick={() => {
                ask(suggestion);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  ask(suggestion);
                }
              }}
            >
              {suggestion}
            </span>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <div className="aa-thread" aria-label="Ava conversation">
          {turns.map((turn) => (
            <div className="aa-turn" key={turn.id}>
              <div className="aa-user">{turn.question}</div>
              <div className="aa-box">
                {turn.agentAnswer ? (
                  // Canonical render: one renderer, prose + exhibits + citations + experts.
                  // Prose streams on its own channel, so merge it onto the structured
                  // answer — this avoids the double-header seen when both are rendered.
                  <AgentAnswerRenderer
                    answer={{
                      ...turn.agentAnswer,
                      directAnswer:
                        turn.agentAnswer.directAnswer || turn.answer || "",
                    }}
                  />
                ) : (
                  <>
                    <div className="aa-label">aVa · Intelligence</div>
                    {turn.fetching && !turn.answer ? (
                      <div className="aa-think">Thinking…</div>
                    ) : turn.answer ? (
                      <div className="aa-prose">
                        <AgentMarkdown text={scrubPublicAvaAnswerText(turn.answer)} />
                      </div>
                    ) : null}
                    {turn.experts.length > 0 && (
                      <details className="aa-exps">
                        <summary className="aa-exps-summary">
                          Consulted experts ({turn.experts.length})
                        </summary>
                        <div className="aa-exps-panel">
                          {turn.experts.map((e) => (
                            <span className="aa-exp" key={e.id} title={e.id}>
                              {e.name}
                            </span>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                )}
                {turn.followups.length > 0 && (
                  <div className="aa-fu">
                    {turn.followups.map((f) => (
                      <span
                        className="aa-chip"
                        key={f}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          ask(f);
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
