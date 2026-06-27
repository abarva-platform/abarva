"use client";

// Intelligence v2 surface — the Lens. Renders the binding contract (signals /
// context / corpus / suggested questions / trust line) for the active tenant.
// Faithful to the Claude-Design v2 spec (Fraunces headlines, mono eyebrows,
// hairline cards, cross-domain chips). The advisor conversation uses the
// shared AvaChatShell/AgentDock so Intelligence cannot fall back to the old
// centered ask page.

import { useMemo, useState } from "react";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import {
  AvaChatShell,
  type AvaCanvasTab,
} from "@/components/ava-chat/AvaChatShell";
import type {
  AttachmentRef,
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";

type Tab = "answer" | "signals" | "context" | "corpus";

const CSS = `
.iv2{--paper:#FBFAF7;--card:#FFFFFF;--ink:#1A1A18;--muted:#6B6B63;--faint:#9A998E;--line:#E7E3DA;--green:#1F6B3A;--greenbg:#E7F0E9;--amber:#A66A1F;
  background:var(--paper);color:var(--ink);min-height:100%;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px;line-height:1.55}
.iv2 .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
.iv2 .serif{font-family:var(--font-fraunces),Georgia,serif}
.iv2 .ey{font-family:var(--font-geist-mono),'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.iv2 .hero{text-align:left;padding:24px 0 8px}
.iv2 .hero h1{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:44px;line-height:1.06;letter-spacing:-.015em;margin:14px 0 16px}
.iv2 .hero .sub{color:var(--muted);font-size:15px;max-width:720px;margin:0}
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
.iv2 .answerPanel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;display:grid;gap:14px}
.iv2 .answerPanel h3{font-family:var(--font-fraunces),Georgia,serif;font-size:24px;font-weight:500;margin:0}
.iv2 .answerText{white-space:pre-wrap;font-size:15px;line-height:1.65;color:var(--ink)}
.iv2 .emptyAnswer{border:1px dashed var(--line);border-radius:12px;padding:22px;color:var(--muted);background:rgba(255,255,255,.55)}
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
    `The current enterprise view spans ${payload.trustLine.dimensionsLoaded} business areas across ${payload.trustLine.sources} source families, with ${payload.trustLine.searchVerifiedPct}% search verification.`,
    ...payload.context.map(
      (dimension) =>
        `${dimension.dimension}: ${dimension.description}. Source depth: ${sourceDepthLabel(dimension.evidence)} across ${dimension.sources} source families; confidence tier: ${confidenceTierLabel(dimension.trust)}.`,
    ),
  ];
  const strategyFacts = payload.signals.map((signal) => {
    const move = signal.move
      ? ` Recommended move: ${signal.move.title}; owner ${signal.move.owner ?? "unassigned"}; impact ${signal.move.impact ?? "not quantified"}.`
      : "";
    return `${signal.headline} ${signal.body} Confidence ${signal.confidence}; source references available.${move}`;
  });
  const qualityFacts = payload.corpus.map(
    (pattern) =>
      `Industry corpus pattern: ${pattern.patternName} (${pattern.domain}). Apply when: ${pattern.whenToApply}`,
  );

  return {
    activeTab: "intelligence",
    activeClient: payload.tenant.displayName,
    clientKey: payload.tenant.key,
    pageFacts: [
      "This is the Intelligence advisory surface. Prefer tenant-specific business material over generic examples.",
      ...payload.suggestedQuestions.map((question) => `Suggested executive question: ${question}`),
    ],
    tenantFacts,
    strategyFacts,
    qualityFacts,
  };
}

function sourceDepthLabel(count: number): string {
  if (count >= 1000) return "broad";
  if (count >= 100) return "moderate";
  if (count > 0) return "thin";
  return "not yet represented";
}

function confidenceTierLabel(score: number): string {
  if (score >= 85) return "high";
  if (score >= 65) return "medium";
  if (score > 0) return "low";
  return "not assessed";
}

function eventText(event: { delta?: unknown; text?: unknown }): string {
  if (typeof event.delta === "string") return event.delta;
  if (typeof event.text === "string") return event.text;
  return "";
}

function newTurnId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function answerBodyFromPacket(answer: AvaAnswerPacket): string {
  return (
    answer.directAnswer?.trim() ||
    answer.prose?.trim() ||
    ""
  );
}

function hasRenderableAvaArtifacts(
  answer?: AvaAnswerPacket | null,
): answer is AvaAnswerPacket {
  return (
    answer?.artifacts?.some(
      (artifact) =>
        artifact.artifact === "table" ||
        artifact.artifact === "chart" ||
        artifact.artifact === "graph",
    ) ?? false
  );
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
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [latestAnswer, setLatestAnswer] = useState<ChatMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const t = payload;
  const tl = t.trustLine;
  const contextEvidence = t.context.reduce((a, c) => a + (c.evidence || 0), 0);
  const surfaceContext = buildSurfaceContext({
    ...t,
    tenant: {
      ...t.tenant,
      displayName: tenantName?.trim() || t.tenant.displayName,
    },
  });
  const tabs = useMemo<AvaCanvasTab[]>(
    () => [
      { id: "answer", label: "Answer", count: latestAnswer ? 1 : 0 },
      { id: "signals", label: "Signals", count: t.signals.length },
      { id: "context", label: "Context", count: t.context.length },
      { id: "corpus", label: "Corpus", count: t.corpus.length },
    ],
    [latestAnswer, t.context.length, t.corpus.length, t.signals.length],
  );

  async function askIntelligence(text: string, attachments: AttachmentRef[] = []) {
    const q = text.trim();
    if (!q && attachments.length === 0) return;

    const userTurn: ChatMessage = {
      id: newTurnId("intelligence-user"),
      role: "user",
      body: attachments.length > 0
        ? `${q}${q ? "\n\n" : ""}[attached: ${attachments.map((a) => a.file_name).join(", ")}]`
        : q,
    };
    const agentId = newTurnId("intelligence-ava");
    const agentTurn: ChatMessage = {
      id: agentId,
      role: "agent",
      body: "",
    };

    setThread((prev) => [...prev, userTurn, agentTurn]);
    setLatestAnswer(agentTurn);
    setTab("answer");
    setBusy(true);

    try {
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q,
          client: t.tenant.key,
          format: "rich",
          surfaceContext,
          attachmentIds: attachments.map((attachment) => attachment.id),
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Intelligence request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";
      let structuredAnswer: AvaAnswerPacket | null = null;

      function updateAgentTurn(
        body: string,
        agentAnswer?: AvaAnswerPacket | null,
      ) {
        setThread((prev) =>
          prev.map((turn) =>
            turn.id === agentId
              ? {
                  ...turn,
                  body,
                  ...(agentAnswer ? { agentAnswer } : null),
                }
              : turn,
          ),
        );
        setLatestAnswer((current) =>
          current?.id === agentId
            ? {
                ...current,
                body,
                ...(agentAnswer ? { agentAnswer } : null),
              }
            : current,
        );
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type?: string;
            delta?: string;
            text?: string;
            answer?: AvaAnswerPacket;
            error?: string;
            telemetryEventId?: string;
          };
          if (event.type === "error") {
            throw new Error(event.error ?? "Intelligence stream error");
          }
          if (event.type === "agent-answer" && event.answer) {
            const packetBody = answerBodyFromPacket(event.answer);
            structuredAnswer = {
              ...event.answer,
              directAnswer:
                event.answer.directAnswer?.trim() || answerText.trim(),
              prose:
                event.answer.prose?.trim() ||
                event.answer.directAnswer?.trim() ||
                answerText.trim(),
            };
            updateAgentTurn(answerText.trim() || packetBody, structuredAnswer);
            continue;
          }
          const delta = eventText(event);
          if (delta) {
            answerText += delta;
            updateAgentTurn(scrubPublicAvaAnswerText(answerText), structuredAnswer);
          }
          if (event.type === "done" && event.telemetryEventId) {
            setThread((prev) =>
              prev.map((turn) =>
                turn.id === agentId
                  ? { ...turn, feedbackEventId: event.telemetryEventId }
                  : turn,
              ),
            );
          }
        }
      }

      if (!answerText.trim() && structuredAnswer) {
        updateAgentTurn(
          scrubPublicAvaAnswerText(answerBodyFromPacket(structuredAnswer)),
          structuredAnswer,
        );
      } else if (!answerText.trim() && !structuredAnswer) {
        updateAgentTurn(
          "I could not produce a grounded Intelligence answer for that request yet.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? `aVa could not complete that request: ${error.message}`
          : "aVa could not complete that request.";
      setThread((prev) =>
        prev.map((turn) =>
          turn.id === agentId ? { ...turn, body: message } : turn,
        ),
      );
      setLatestAnswer((current) =>
        current?.id === agentId ? { ...current, body: message } : current,
      );
    } finally {
      setBusy(false);
    }
  }

  const suggestedActions = useMemo<SuggestedAction[]>(
    () =>
      t.suggestedQuestions.slice(0, 3).map((question, index) => ({
        id: `intelligence-suggested-${index}`,
        label: question,
        body: question,
        onClick: () => {
          void askIntelligence(question, []);
        },
      })),
    // askIntelligence intentionally closes over current tenant payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.suggestedQuestions, t.tenant.key],
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <AvaChatShell
        surface="intelligence"
        thread={thread}
        onMessage={askIntelligence}
        suggestedActions={suggestedActions}
        surfaceContext={surfaceContext}
        isBusy={busy}
        defaultLeftPercent={34}
        minLeftPx={360}
        placeholder={t.ask.placeholder}
        agent={{
          role: `${t.tenant.displayName} Intelligence advisor`,
        }}
        canvas={
          <div className="iv2">
            <div className="wrap">
              <div className="hero">
                <div>
                  <div className="ey" style={{ color: "var(--green)" }}>
                    INTELLIGENCE · RESEARCH &amp; ANALYSIS ENGINE
                  </div>
                  <h1>Leadership intelligence canvas.</h1>
                  <p className="sub">{t.ask.contract}</p>
                </div>
                <div className="trust" style={{ textAlign: "left", margin: 0 }}>
                  <span className="mono">
                    <b>{tl.dimensionsLoaded}</b> dimensions ·{" "}
                      <b>{tl.evidencePoints.toLocaleString()}</b> source signals ·{" "}
                    <b>{tl.sources}</b> sources · <b>{tl.searchVerifiedPct}%</b>{" "}
                    search-verified
                  </span>
                </div>
              </div>

              <div className="tabs">
                {tabs.map((item) => {
                  const key = item.id as Tab;
                  return (
            <button
              key={key}
              type="button"
              className={`tab${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
                      {item.label} <span className="ct">{item.count ?? 0}</span>
            </button>
                  );
                })}
              </div>

              <div className="section">
                {tab === "answer" && (
                  <div className="answerPanel">
                    <div className="ey">AVA · LATEST ANSWER</div>
                    {latestAnswer ? (
                      <>
                        <h3>Answer from the current conversation</h3>
                        {hasRenderableAvaArtifacts(latestAnswer.agentAnswer) ? (
                          <AgentAnswerRenderer answer={latestAnswer.agentAnswer} />
                        ) : latestAnswer.body.trim() ? (
                          <div className="answerText">
                            {scrubPublicAvaAnswerText(latestAnswer.body)}
                          </div>
                        ) : (
                          <div className="ansfetching">aVa is forming the answer…</div>
                        )}
                      </>
                    ) : (
                      <div className="emptyAnswer">
                        Ask in the left rail. Answers, tables, charts, graphs, and
                        citations stay in the conversation, while this canvas keeps
                        the supporting Intelligence tabs visible.
                      </div>
                    )}
                  </div>
                )}
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
                        {s.evidencePoints} source signals · {s.sources} sources
                      </span>
                      <span className="act">
                        <a>Trace sources →</a>
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
                <span className="ey">AVAILABLE MATERIAL · BROWSE BY BUSINESS AREA</span>
                <span className="ey">
                  {t.context.length} CONNECTED ·{" "}
                  {contextEvidence.toLocaleString()} SOURCE SIGNALS
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
                        <div className="k">Source depth</div>
                        <div className="v">{c.evidence.toLocaleString()}</div>
                      </div>
                      <div className="stat">
                        <div className="k">Sources</div>
                        <div className="v">{c.sources}</div>
                      </div>
                      <div className="stat">
                        <div className="k">Confidence</div>
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
        }
      />
    </>
  );
}
