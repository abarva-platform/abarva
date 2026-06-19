"use client";

// Intelligence v2 surface — the Lens. Renders the binding contract (signals /
// context / corpus / suggested questions / trust line) for the active tenant.
// Faithful to the Claude-Design v2 spec (Fraunces headlines, mono eyebrows,
// hairline cards, cross-domain chips). Ask bar + chips are presentational in v1;
// conversational answers wire to the grounded engine in a follow-on.

import { useState } from "react";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";

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
.iv2 .ask input{flex:1;border:none;outline:none;font-size:14px;background:transparent;color:var(--ink)}
.iv2 .ask .spark{color:var(--green)}
.iv2 .ask button{background:var(--ink);color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer}
.iv2 .chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:780px;margin:16px auto 0}
.iv2 .chip{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:6px 14px;font-size:12.5px;color:#3a3a34;cursor:pointer}
.iv2 .chip .spark{color:var(--green);margin-right:5px}
.iv2 .trust{text-align:center;margin:22px 0 4px}
.iv2 .trust .mono{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11.5px;color:var(--muted)}
.iv2 .trust b{color:var(--ink)}
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

export function IntelligenceV2Surface({
  payload,
}: {
  payload: IntelligenceBindingPayload;
}) {
  const [tab, setTab] = useState<Tab>("signals");
  const t = payload;
  const tl = t.trustLine;
  const contextEvidence = t.context.reduce((a, c) => a + (c.evidence || 0), 0);

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
            {t.tenant.displayName}.
          </h1>
          <p className="sub">{t.ask.contract}</p>
          <div className="ask">
            <span className="spark">✦</span>
            <input
              placeholder={t.ask.placeholder}
              readOnly
              aria-label="Ask Sentinel"
            />
            <button type="button">Ask</button>
          </div>
          <div className="chips">
            {t.suggestedQuestions.map((q) => (
              <span className="chip" key={q}>
                <span className="spark">✦</span>
                {q}
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
