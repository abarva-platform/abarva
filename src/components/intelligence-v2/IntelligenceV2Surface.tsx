"use client";

// Intelligence v2 surface — the Lens. Renders the binding contract (signals /
// context / corpus / suggested questions / trust line) for the active tenant.
// Faithful to the Claude-Design v2 spec (Fraunces headlines, mono eyebrows,
// hairline cards, cross-domain chips). Ask bar wired to /api/intelligence/ask.

import { useCallback, useRef, useState } from "react";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import type { AgentAnswer } from "@/lib/intelligence/answer/agent-answer";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";

type Tab = "signals" | "context" | "corpus";

const CSS = `
.iv2{--paper:#FBFAF7;--card:#FFFFFF;--ink:#1A1A18;--muted:#6B6B63;--faint:#9A998E;--line:#E7E3DA;--green:#1F6B3A;--greenbg:#E7F0E9;--amber:#A66A1F;
  background:var(--paper);color:var(--ink);min-height:100%;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px;line-height:1.55}
.iv2 .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
.iv2 .serif{font-family:var(--font-fraunces),Georgia,serif}
.iv2 .ey{font-family:var(--font-geist-mono),'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.iv2 .hero{text-align:center;padding:56px 0 8px}
.iv2 .hero h1{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:44px;line-height:1.06;letter-spacing:-.015em;margin:14px 0 16px}
.iv2 .hero .sub{color:var(--muted);font-size:15px;max-width:620px;margin:0 auto}
.iv2 .ask{max-width:660px;margin:26px auto 0;display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 10px 10px 18px}
.iv2 .ask textarea{flex:1;min-height:22px;max-height:140px;border:none;outline:none;font:inherit;font-size:14px;line-height:1.45;background:transparent;color:var(--ink);resize:none;overflow:auto;padding:0}
.iv2 .ask .spark{color:var(--green)}
.iv2 .ask button{background:var(--ink);color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer}
.iv2 .chips{display:flex;flex-wrap:nowrap;gap:8px;justify-content:center;max-width:1080px;margin:16px auto 0;overflow:hidden}
.iv2 .chips .chip{max-width:230px}
@media(max-width:760px){.iv2 .chips{flex-wrap:wrap}.iv2 .chips .chip{max-width:340px}}
.iv2 .chip{display:inline-flex;align-items:center;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 13px;font-size:12px;color:#3a3a34;cursor:pointer}
.iv2 .chip .spark{color:var(--green);margin-right:5px;flex:none}
.iv2 .chiptext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iv2 .trust{text-align:center;margin:22px 0 4px}
.iv2 .trust .mono{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11.5px;color:var(--muted)}
.iv2 .trust b{color:var(--ink)}
.iv2 .ansbox{max-width:960px;margin:16px auto 0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 22px;text-align:left}
.iv2 .ansbox .anslabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.iv2 .ansbox .ansbody{font-size:14px;line-height:1.65;color:var(--ink)}
.iv2 .ansbox .ansbody>:first-child{margin-top:0}
.iv2 .ansbox .ansbody>:last-child{margin-bottom:0}
.iv2 .ansbox .ansbody table{font-size:13px;margin:10px 0}
.iv2 .ansbox .ansfetching{color:var(--faint);font-style:italic;font-size:13.5px}
.iv2 .ansbox .ansexperts{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}
.iv2 .ansbox .ansexpertslabel{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);margin-right:3px}
.iv2 .ansbox .ansexpertchip{display:inline-flex;align-items:center;background:var(--greenbg);color:var(--green);border-radius:20px;padding:3px 11px;font-size:11.5px;font-weight:500}
.iv2 .ansbox .ansfollowups{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
.iv2 .tabs{display:flex;justify-content:center;gap:30px;border-bottom:1px solid var(--line);margin-top:18px}
.iv2 .tab{padding:14px 2px;font-size:14px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:flex;align-items:center;gap:7px;background:none;font-family:inherit}
.iv2 .tab.active{color:var(--ink);border-bottom-color:var(--green)}
.iv2 .tab .ct{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;color:var(--faint)}
.iv2 .section{padding:26px 0 80px}
.iv2 .sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}
.iv2 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.iv2 .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.iv2 .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px 24px}
.iv2 .tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.iv2 .tag{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.iv2 .tag.sep{color:var(--faint)}
.iv2 .tag.cross{background:var(--greenbg);color:var(--green);padding:2px 7px;border-radius:4px}
.iv2 .card h3{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:21px;line-height:1.22;letter-spacing:-.01em;margin-bottom:10px}
.iv2 .card .body{color:#3d3d36;font-size:13.5px;line-height:1.6}
.iv2 .card .rule{height:1px;background:var(--line);margin:16px 0 13px}
.iv2 .cardfoot{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.iv2 .conf{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;background:var(--greenbg);color:var(--green);padding:3px 8px;border-radius:4px}
.iv2 .conf.med{background:#FBF3E3;color:var(--amber)}
.iv2 .evi{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}
.iv2 .evi .dot{width:5px;height:5px;border-radius:50%;background:var(--green);display:inline-block}
.iv2 .act{margin-left:auto;display:flex;gap:18px}
.iv2 .act a{font-size:12.5px;color:#2a2a26;cursor:pointer;text-decoration:none}
.iv2 .act a.move{color:var(--green)}
.iv2 .dimcard{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}
.iv2 .dimhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.iv2 .dimcard h4{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:18px;letter-spacing:-.01em}
.iv2 .loaded{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;background:var(--greenbg);color:var(--green);padding:3px 7px;border-radius:4px;white-space:nowrap}
.iv2 .dimcard .desc{color:var(--muted);font-size:12.5px;margin:5px 0 16px}
.iv2 .stats{display:flex;gap:26px}
.iv2 .stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.iv2 .stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.iv2 .flag{color:var(--amber);font-size:11.5px;margin-top:12px;font-family:var(--font-geist-mono),ui-monospace,monospace}
.iv2 .cpat .dom{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.iv2 .cpat p{color:var(--muted);font-size:12.5px}
@media(max-width:900px){.iv2 .grid2,.iv2 .grid3{grid-template-columns:1fr}}
`;

function buildSurfaceContext(payload: IntelligenceBindingPayload) {
  const tenantFacts = [
    `Active tenant is ${payload.tenant.displayName} (${payload.tenant.key}), industry ${payload.tenant.industry}.`,
    `${payload.trustLine.dimensionsLoaded} context dimensions loaded with ${payload.trustLine.evidencePoints.toLocaleString()} evidence points across ${payload.trustLine.sources} sources at ${payload.trustLine.searchVerifiedPct}% search verification.`,
    ...payload.context.map(
      (dimension) =>
        `${dimension.dimension}: ${dimension.status.toLowerCase()} with ${dimension.evidence.toLocaleString()} evidence points, ${dimension.sources} sources, trust ${dimension.trust}. ${dimension.description}.`,
    ),
  ];
  const strategyFacts = payload.signals.map((signal) => {
    const move = signal.move
      ? ` Recommended move: ${signal.move.title}; owner ${signal.move.owner ?? "unassigned"}; impact ${signal.move.impact ?? "not quantified"}.`
      : "";
    return `${signal.headline} ${signal.body} Confidence ${signal.confidence}; evidence refs ${signal.evidenceRefs.join(", ")}.${move}`;
  });
  const qualityFacts = payload.corpus.map(
    (pattern) =>
      `Industry corpus pattern: ${pattern.patternName} (${pattern.domain}). Apply when: ${pattern.whenToApply}`,
  );

  return {
    activeTab: "intelligence-v2",
    activeClient: payload.tenant.displayName,
    clientKey: payload.tenant.key,
    pageFacts: [
      "This is the Intelligence v2 Lens surface. Prefer tenant-specific loaded context over generic examples.",
      ...payload.suggestedQuestions.map((question) => `Suggested executive question: ${question}`),
    ],
    tenantFacts,
    strategyFacts,
    qualityFacts,
  };
}

function resizeAskTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
}

function resetAskTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
}

export function IntelligenceV2Surface({
  payload,
  tenantName,
}: {
  payload: IntelligenceBindingPayload;
  // Accepted for API compatibility (callers still pass it) but intentionally
  // NOT rendered: the header stays generic ("your enterprise") in production so
  // it never surfaces a client/tenant name. Re-bind here to restore personalization.
  tenantName?: string;
}) {
  const [tab, setTab] = useState<Tab>("signals");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [agentAnswer, setAgentAnswer] = useState<AgentAnswer | null>(null);
  const [experts, setExperts] = useState<{ id: string; name: string }[]>([]);
  const [followups, setFollowups] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const t = payload;
  const tl = t.trustLine;
  const contextEvidence = t.context.reduce((a, c) => a + (c.evidence || 0), 0);

  const askSentinel = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery("");
    resetAskTextarea(textareaRef.current);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setFetching(true);
    setAnswer(null);
    setAgentAnswer(null);
    setExperts([]);
    setFollowups([]);
    try {
      const surfaceContext = buildSurfaceContext({
        ...t,
        tenant: {
          ...t.tenant,
          displayName: tenantName?.trim() || t.tenant.displayName,
        },
      });
      const res = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: trimmed,
          client: t.tenant.key,
          format: "rich",
          surfaceContext,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        setAnswer("Ava couldn't retrieve an answer. Try again.");
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        setAnswer(await res.text());
        return;
      }
      // The /api/intelligence/ask endpoint streams newline-delimited JSON
      // events (session, classified, sources, contributing-experts, delta,
      // followups, validation, done). Parse them: accumulate `delta` text into
      // the prose answer, surface the Consilium experts and follow-ups. Any
      // non-JSON line is treated as plain text (defensive fallback).
      const dec = new TextDecoder();
      let buf = "";
      let prose = "";
      const applyLine = (raw: string) => {
        const s = raw.trim();
        if (!s) return;
        let evt: {
          type?: string;
          text?: string;
          contributingExperts?: { id: string; name: string }[];
          followups?: string[];
          answer?: AgentAnswer;
        };
        try {
          evt = JSON.parse(s);
        } catch {
          prose += prose ? `\n${s}` : s;
          setAnswer(prose);
          return;
        }
        if (evt.type === "delta" && typeof evt.text === "string") {
          prose += evt.text;
          setAnswer(prose);
        } else if (
          evt.type === "contributing-experts" &&
          Array.isArray(evt.contributingExperts)
        ) {
          setExperts(evt.contributingExperts);
        } else if (evt.type === "followups" && Array.isArray(evt.followups)) {
          setFollowups(evt.followups);
        } else if (evt.type === "agent-answer" && evt.answer) {
          setAgentAnswer(evt.answer);
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          applyLine(buf.slice(0, nl));
          buf = buf.slice(nl + 1);
        }
      }
      applyLine(buf); // flush any trailing line with no terminating newline
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setAnswer("Ava couldn't retrieve an answer. Try again.");
      }
    } finally {
      setFetching(false);
    }
  }, [t, tenantName]);

  return (
    <div className="iv2">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <div className="hero">
          <div className="ey" style={{ color: "var(--green)" }}>
            INTELLIGENCE · RESEARCH &amp; ANALYSIS ENGINE
          </div>
          <h1>
            Ask anything about
            <br />
            your enterprise.
          </h1>
          <p className="sub">{t.ask.contract}</p>
          <div className="ask">
            <span className="spark">✦</span>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={t.ask.placeholder}
              aria-label="Ask Ava"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resizeAskTextarea(e.currentTarget);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askSentinel(query);
                }
              }}
              disabled={fetching}
            />
            <button
              type="button"
              onClick={() => askSentinel(query)}
              disabled={fetching || !query.trim()}
              style={{ opacity: fetching || !query.trim() ? 0.5 : 1 }}
            >
              {fetching ? "…" : "Ask"}
            </button>
          </div>
          {(fetching || answer || agentAnswer || experts.length > 0) && (
            <div className="ansbox">
              {agentAnswer ? (
                <AgentAnswerRenderer
                  answer={{ ...agentAnswer, prose: agentAnswer.prose || answer || "" }}
                />
              ) : (
                <>
                  <div className="anslabel">Ava · Intelligence</div>
                  {fetching && !answer ? (
                    <div className="ansfetching">Thinking…</div>
                  ) : (
                    <div className="ansbody">
                      {answer ? <AgentMarkdown text={answer} /> : null}
                    </div>
                  )}
                  {experts.length > 0 && (
                    <div className="ansexperts">
                      <span className="ansexpertslabel">Experts consulted</span>
                      {experts.map((e) => (
                        <span className="ansexpertchip" key={e.id} title={e.id}>
                          {e.name}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
              {followups.length > 0 && (
                <div className="ansfollowups">
                  {followups.map((f) => (
                    <span
                      className="chip"
                      key={f}
                      title={f}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        askSentinel(f);
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="chips">
            {t.suggestedQuestions.map((sq) => (
              <span
                className="chip"
                key={sq}
                title={sq}
                onClick={() => {
                  askSentinel(sq);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askSentinel(sq);
                  }
                }}
              >
                <span className="spark">✦</span>
                <span className="chiptext">{sq}</span>
              </span>
            ))}
          </div>
          <div className="trust">
            <span className="mono">
              <b>{tl.dimensionsLoaded}</b> dimensions loaded ·{" "}
              <b>{tl.evidencePoints.toLocaleString()}</b> evidence points ·{" "}
              <b>{tl.sources}</b> sources · <b>{tl.searchVerifiedPct}%</b>{" "}
              search-verified
            </span>
          </div>
        </div>

        <div className="tabs">
          {(
            [
              ["signals", "Signals", t.signals.length],
              ["context", "Context", t.context.length],
              ["corpus", "Corpus", t.corpus.length],
            ] as Array<[Tab, string, number]>
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              className={`tab${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label} <span className="ct">{count}</span>
            </button>
          ))}
        </div>

        <div className="section">
          {tab === "signals" && (
            <>
              <div className="sechead">
                <span className="ey">
                  EXECUTIVE SIGNALS · WHAT THE CONTEXT IS TELLING US
                </span>
                <span className="ey">
                  {t.signals.length} ACTIVE · CROSS-DOMAIN
                </span>
              </div>
              <div className="grid2">
                {t.signals.map((s) => (
                  <div className="card" key={s.id}>
                    <div className="tags">
                      {s.domains.map((d, i) => (
                        <span key={d}>
                          {i > 0 && <span className="tag sep">·&nbsp;</span>}
                          <span className="tag">{d}</span>
                        </span>
                      ))}
                      {s.crossDomain && (
                        <span className="tag cross">CROSS-DOMAIN</span>
                      )}
                    </div>
                    <h3>{s.headline}</h3>
                    <p className="body">{s.body}</p>
                    <div className="rule" />
                    <div className="cardfoot">
                      <span
                        className={`conf${s.confidence.toUpperCase().includes("HIGH") ? "" : " med"}`}
                      >
                        {s.confidence}
                      </span>
                      <span className="evi">
                        <span className="dot" />
                        {s.evidencePoints} evidence points · {s.sources} sources
                      </span>
                      <span className="act">
                        <a>Trace evidence →</a>
                        {s.move && (
                          <a
                            className="move"
                            title={`${s.move.title} · ${s.move.owner ?? ""} · ${s.move.impact ?? ""}`}
                          >
                            Shape into Move →
                          </a>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "context" && (
            <>
              <div className="sechead">
                <span className="ey">LOADED CONTEXT · BROWSE BY DIMENSION</span>
                <span className="ey">
                  {t.context.length} CONNECTED ·{" "}
                  {contextEvidence.toLocaleString()} EVIDENCE POINTS
                </span>
              </div>
              <div className="grid3">
                {t.context.map((c) => (
                  <div className="dimcard" key={c.dimension}>
                    <div className="dimhead">
                      <h4>{c.dimension}</h4>
                      <span className="loaded">{c.status}</span>
                    </div>
                    <div className="desc">{c.description}</div>
                    <div className="stats">
                      <div className="stat">
                        <div className="k">Evidence</div>
                        <div className="v">{c.evidence.toLocaleString()}</div>
                      </div>
                      <div className="stat">
                        <div className="k">Sources</div>
                        <div className="v">{c.sources}</div>
                      </div>
                      <div className="stat">
                        <div className="k">Trust</div>
                        <div className="v">{c.trust}%</div>
                      </div>
                    </div>
                    {c.flag && <div className="flag">{c.flag}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "corpus" && (
            <>
              <div className="sechead">
                <span className="ey">
                  CORPUS · PATTERNS MATCHED TO THIS CONTEXT
                </span>
                <span className="ey">{t.corpus.length} PATTERNS</span>
              </div>
              <div className="grid3">
                {t.corpus.length === 0 ? (
                  <p className="ey">No corpus patterns loaded.</p>
                ) : (
                  t.corpus.map((c) => (
                    <div className="dimcard cpat" key={c.patternName}>
                      <div className="dom">{c.domain || "pattern"}</div>
                      <h4
                        style={{
                          fontFamily: "var(--font-fraunces),Georgia,serif",
                          fontWeight: 500,
                          fontSize: 17,
                          marginBottom: 6,
                        }}
                      >
                        {c.patternName}
                      </h4>
                      <p>{c.whenToApply}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
