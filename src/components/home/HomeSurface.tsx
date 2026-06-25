"use client";

// Home — real React Context Explorer. Home is a KNOW-mode surface: it asks the
// Home KNOW endpoint and renders the shared HomeKnowResponse contract. It does
// not classify intent, retrieve data, or render Intelligence experts locally.

import { useCallback, useMemo, useState } from "react";
import {
  AvaChatShell,
  type AvaCanvasTab,
} from "@/components/ava-chat/AvaChatShell";
import type {
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  HomeKnowCitation,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import type {
  IntelligenceBindingPayload,
  BindingDimension,
  BindingSignal,
} from "@/lib/intelligence/binding/binding-payload";

const CSS = `
.homex{--hl:#E7E3DA;--hi:#1A1A18;--hm:#6B6B63;--hf:#9A998E;--hg:#1F6B3A;--hb:#0A76D8;--ham:#A66A1F;--hr:#a32d2d;--hcard:#fff;--hbg:#FBFAF7;background:var(--hbg);min-height:100%;color:var(--hi);font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px}
.homex .hx-shell{display:block;min-height:100%}
.homex .hx-rail{border-bottom:1px solid var(--hl);padding:10px 40px;background:#fff}
.homex .hx-navWrap{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px}
.homex .hx-railLabel{display:flex;align-items:center;gap:8px;color:var(--hm);font-size:12px}
.homex .hx-dot{width:8px;height:8px;border-radius:50%;flex:none}
.homex .hx-select{min-width:min(360px,100%);border:1px solid var(--hl);border-radius:8px;background:#fff;color:var(--hi);font:inherit;font-size:13px;padding:8px 32px 8px 10px}
.homex .hx-select:focus{outline:2px solid rgba(34,174,234,.22);border-color:#22AEEA}
.homex .hx-rail-h,.homex .hx-rail-g{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.homex .hx-canvas{padding:0 0 80px;max-width:none;min-width:0;min-height:100%}
.homex .hx-body{padding:14px 40px 0;max-width:1400px;margin:0 auto}
.homex .hx-ey{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--hf)}
.homex .hx-h2{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:26px;letter-spacing:-.01em;margin:8px 0 6px}
.homex .hx-stats{display:flex;flex-wrap:wrap;gap:26px;margin:18px 0 6px;padding-bottom:18px;border-bottom:1px solid var(--hl)}
.homex .hx-stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--hf)}
.homex .hx-stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.homex .hx-sec{margin-top:26px}
.homex .hx-sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
.homex .hx-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:680px){.homex .hx-grid{grid-template-columns:1fr}.homex .hx-rail,.homex .hx-body{padding-left:18px;padding-right:18px}.homex .hx-navWrap{display:grid}.homex .hx-select{width:100%;min-width:0}}
.homex .hx-card{background:var(--hcard);border:1px solid var(--hl);border-radius:12px;padding:20px 22px}
.homex .hx-tags{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--hm);margin-bottom:9px}
.homex .hx-card h3{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:19px;line-height:1.22;margin:0 0 8px}
.homex .hx-card p{color:#3d3d36;font-size:13.5px;line-height:1.6;margin:0}
.homex .hx-evi{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--hm);margin-top:12px;padding-top:11px;border-top:1px solid var(--hl)}
.homex .hx-cpat{background:var(--hcard);border:1px solid var(--hl);border-radius:10px;padding:14px 16px}
.homex .hx-cpat .dom{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--hg);margin-bottom:6px}
.homex .hx-cpat h4{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:16px;margin:0 0 5px}
.homex .hx-cpat p{color:var(--hm);font-size:12.5px;margin:0}
.homex .hx-meter{height:6px;border-radius:3px;background:#EDEAE2;overflow:hidden;margin-top:8px}
.homex .hx-meter span{display:block;height:100%}
.homex .hx-badge{display:inline-flex;font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;background:#EEF6E9;color:var(--hg);padding:3px 9px;border-radius:4px}
.homex .hx-hint{color:var(--hf);font-size:12.5px;margin-top:24px;display:flex;align-items:center;gap:8px}
`;

const CONTEXT_BROWSER_QUESTIONS = [
  "What context is loaded for this tenant?",
  "Show the loaded context dimensions in a table.",
  "How is our IT organization structured today?",
  "Which systems of record are loaded?",
  "Show vendor and contract coverage.",
  "What fields are missing?",
];

const EMPTY_DIMS: BindingDimension[] = [];
const EMPTY_SIGNALS: BindingSignal[] = [];

function contextBrowserQuestions(dimensions: BindingDimension[]): string[] {
  const labels = dimensions.map((dimension) =>
    dimension.dimension.toLowerCase(),
  );
  const questions = [...CONTEXT_BROWSER_QUESTIONS];
  if (
    labels.some(
      (label) => label.includes("data") || label.includes("analytics"),
    )
  ) {
    questions.push(
      "Show our data products in a table with domain and owning team.",
    );
  }
  if (
    labels.some(
      (label) => label.includes("integration") || label.includes("interface"),
    )
  ) {
    questions.push("Map relationships between systems and integrations.");
  }
  return questions.slice(0, 6);
}

function toneFor(trust: number): string {
  if (trust >= 75) return "var(--hg)";
  if (trust >= 50) return "var(--ham)";
  return "var(--hr)";
}

function SignalCard({ s }: { s: BindingSignal }) {
  return (
    <div className="hx-card">
      {s.domains?.length ? (
        <div className="hx-tags">
          {s.domains.join(" · ")}
          {s.crossDomain ? " · cross-domain" : ""}
        </div>
      ) : null}
      <h3>{s.headline}</h3>
      <p>{s.body}</p>
      <div className="hx-evi">
        {s.evidencePoints} source points · {s.sources} sources
      </div>
    </div>
  );
}

function DimensionView({
  dim,
  signals,
}: {
  dim: BindingDimension;
  signals: BindingSignal[];
}) {
  const firstWord = dim.dimension.toLowerCase().split(" ")[0];
  const related = signals.filter((s) =>
    s.domains?.some((d) => d.toLowerCase().includes(firstWord)),
  );
  return (
    <div className="hx-body">
      <div className="hx-ey">Loaded context dimension</div>
      <h2 className="hx-h2">{dim.dimension}</h2>
      <p style={{ color: "var(--hm)", maxWidth: "64ch" }}>{dim.description}</p>
      <div className="hx-stats">
        <div className="hx-stat">
          <div className="k">Status</div>
          <div className="v" style={{ fontSize: 16 }}>
            <span className="hx-badge">{dim.status}</span>
          </div>
        </div>
        <div className="hx-stat">
          <div className="k">Source points</div>
          <div className="v">{dim.evidence.toLocaleString()}</div>
        </div>
        <div className="hx-stat">
          <div className="k">Sources</div>
          <div className="v">{dim.sources}</div>
        </div>
        <div className="hx-stat" style={{ minWidth: 140 }}>
          <div className="k">Trust</div>
          <div className="v">{dim.trust}%</div>
          <div className="hx-meter">
            <span
              style={{
                width: `${Math.max(0, Math.min(100, dim.trust))}%`,
                background: toneFor(dim.trust),
              }}
            />
          </div>
        </div>
      </div>
      {dim.flag ? (
        <p style={{ color: "var(--ham)", fontSize: 13, marginTop: 14 }}>
          ⚑ {dim.flag}
        </p>
      ) : null}
      {related.length > 0 && (
        <div className="hx-sec">
          <div className="hx-sechead">
            <span className="hx-ey">What this dimension is telling you</span>
          </div>
          <div className="hx-grid">
            {related.map((s) => (
              <SignalCard s={s} key={s.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({ payload }: { payload: IntelligenceBindingPayload | null }) {
  const tl = payload?.trustLine;
  const signals = (payload?.signals ?? []).slice(0, 4);
  const corpus = (payload?.corpus ?? []).slice(0, 3);
  const dimensionCount = payload?.context.length ?? tl?.dimensionsLoaded ?? 0;
  return (
    <div className="hx-body">
      <div className="hx-ey">Current-state context</div>
      <h2 className="hx-h2">What we know about your enterprise.</h2>
      {tl ? (
        <div className="hx-stats">
          <div className="hx-stat">
            <div className="k">Dimensions</div>
            <div className="v">{dimensionCount}</div>
          </div>
          <div className="hx-stat">
            <div className="k">Source points</div>
            <div className="v">{tl.evidencePoints.toLocaleString()}</div>
          </div>
          <div className="hx-stat">
            <div className="k">Sources</div>
            <div className="v">{tl.sources}</div>
          </div>
          <div className="hx-stat">
            <div className="k">Search-verified</div>
            <div className="v">{tl.searchVerifiedPct}%</div>
          </div>
        </div>
      ) : null}

      {signals.length > 0 && (
        <div className="hx-sec">
          <div className="hx-sechead">
            <span className="hx-ey">What your context is telling you</span>
            <span className="hx-ey">{signals.length} active</span>
          </div>
          <div className="hx-grid">
            {signals.map((s) => (
              <SignalCard s={s} key={s.id} />
            ))}
          </div>
        </div>
      )}

      {corpus.length > 0 && (
        <div className="hx-sec">
          <div className="hx-sechead">
            <span className="hx-ey">Industry patterns in play</span>
          </div>
          <div className="hx-grid">
            {corpus.map((c, i) => (
              <div className="hx-cpat" key={`${c.patternName}-${i}`}>
                <div className="dom">{c.domain.replace(/_/g, " ")}</div>
                <h4>{c.patternName}</h4>
                <p>{c.whenToApply}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hx-hint">
        <span className="hx-dot" style={{ background: "var(--hb)" }} />
        Pick a context dot above, or ask in the aVa panel.
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHomeKnowResponse(value: unknown): value is HomeKnowResponse {
  return (
    isRecord(value) &&
    value.mode === "KNOW" &&
    typeof value.tenantKey === "string" &&
    typeof value.question === "string" &&
    typeof value.prose === "string" &&
    Array.isArray(value.tables) &&
    Array.isArray(value.charts) &&
    Array.isArray(value.graphs) &&
    Array.isArray(value.citations)
  );
}

function messageId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function citationClass(citation: HomeKnowCitation) {
  if (citation.sourceClass === "tenant-relationship") return "graph" as const;
  if (citation.sourceClass === "tenant-source-file") return "tenant-chunk" as const;
  return "tenant-fact" as const;
}

function toAvaAnswerPacket(response: HomeKnowResponse): AvaAnswerPacket {
  const tables = response.tables.map((table) => ({
    id: table.id,
    title: table.title,
    columns: table.columns,
    rows: table.rows.map((row) => {
      const normalized: Record<string, string | number | null> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[key] =
          typeof value === "boolean" ? String(value) : value;
      });
      return normalized;
    }),
    note: table.note,
    citationIds: table.citationIds,
  }));
  const charts = response.charts.map((chart) => ({
    id: chart.id,
    kind: "cost-stack" as const,
    title: chart.title,
    data: chart.data.map((point, index) => ({
      label: point.label,
      value: point.value,
      color:
        point.color ??
        ["#0f5ba7", "#1f6b3a", "#d8e4f2", "#7a8ca5"][index % 4],
    })),
    citationIds: chart.citationIds,
  }));
  const graphs = response.graphs.map((graph) => ({
    id: graph.id,
    title: graph.title,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      kind: node.type,
    })),
    edges: graph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      label: edge.label,
      kind: edge.type,
    })),
    citationIds: graph.citationIds,
  }));

  return {
    surface: "home",
    mode: "KNOW",
    tenantKey: response.tenantKey,
    question: response.question,
    intent: response.intent,
    status: response.answerStatus,
    directAnswer: response.prose,
    prose: response.prose,
    factsUsed: response.facts.map((fact) => ({
      id: fact.id,
      label: fact.label,
      value: fact.value,
      citationIds: fact.citationIds,
    })),
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [
      ...tables.map((table) => ({ ...table, artifact: "table" as const })),
      ...charts.map((chart) => ({ ...chart, artifact: "chart" as const })),
      ...graphs.map((graph) => ({ ...graph, artifact: "graph" as const })),
    ],
    tables,
    charts,
    graphs,
    citations: response.citations.map((citation) => ({
      id: citation.id,
      label: citation.label,
      sourceClass: citationClass(citation),
      recordId: citation.recordId ?? undefined,
      excerpt: citation.excerpt ?? undefined,
      confidence: citation.confidence,
    })),
    gaps: response.gaps.map((gap) => ({
      id: gap.id,
      label: gap.displayLabel,
      detail: gap.message,
      severity: gap.severity,
      citationIds: gap.citationIds,
    })),
    caveats: [
      ...response.conflicts.map((conflict) => ({
        id: conflict.id,
        label: conflict.label,
        detail: conflict.description,
      })),
      ...response.charts.flatMap((chart) =>
        chart.caveats.map((caveat, index) => ({
          id: `${chart.id}-caveat-${index}`,
          label: chart.title,
          detail: caveat,
        })),
      ),
    ],
    nextSteps: response.handoff
      ? [
          {
            id: "home-know-handoff",
            label: response.handoff.label,
            rationale: response.handoff.reason,
            targetSurface: response.handoff.target ?? undefined,
          },
        ]
      : [],
    quality: {
      confidence: response.answerStatus === "answered" ? "high" : "medium",
      evidenceStrength:
        response.answerStatus === "answered" ? "strong" : "partial",
      tenantGrounding:
        response.citations.length > 0 ? "complete" : "partial",
      answerCompleteness:
        response.answerStatus === "answered" ? "complete" : "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: !response.safety.frontendTripwireShouldFire,
      unsupportedClaimsBlocked: true,
    },
  };
}

function textFallback(response: HomeKnowResponse): string {
  const lines = [response.prose.trim()].filter(Boolean);
  const exhibitParts = [
    response.tables.length ? `${response.tables.length} table` : null,
    response.charts.length ? `${response.charts.length} chart` : null,
    response.graphs.length ? `${response.graphs.length} graph` : null,
  ].filter(Boolean);
  if (exhibitParts.length > 0) {
    lines.push(`Evidence and exhibits: ${exhibitParts.join(", ")}.`);
  }
  if (response.gaps.length > 0) {
    lines.push(
      `Open gaps: ${response.gaps
        .slice(0, 3)
        .map((gap) => gap.message)
        .join("; ")}.`,
    );
  }
  if (response.handoff) {
    lines.push(`${response.handoff.label}: ${response.handoff.reason}`);
  }
  return lines.join("\n\n") || "I do not see that in the loaded data.";
}

export function HomeSurface({
  payload,
  clientKey,
}: {
  payload: IntelligenceBindingPayload | null;
  clientKey?: string | null;
}) {
  const dims = payload?.context ?? EMPTY_DIMS;
  const signals = payload?.signals ?? EMPTY_SIGNALS;
  const [dimKey, setDimKey] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const selected = dimKey
    ? (dims.find((d) => d.dimension === dimKey) ?? null)
    : null;

  const askHomeKnow = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question) return;

      const userTurn: ChatMessage = {
        id: messageId("home-user"),
        role: "user",
        body: question,
        at: new Date().toISOString(),
      };
      const agentTurnId = messageId("home-ava");
      const pendingTurn: ChatMessage = {
        id: agentTurnId,
        role: "agent",
        body: "",
        at: new Date().toISOString(),
      };

      setThread((current) => [...current, userTurn, pendingTurn]);
      setIsBusy(true);

      try {
        const res = await fetch("/api/home/know/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question,
            client: clientKey ?? payload?.tenant.key ?? null,
            tenantKey: payload?.tenant.key ?? clientKey ?? null,
          }),
        });
        const json: unknown = await res.json();
        if (!res.ok || !isHomeKnowResponse(json)) {
          throw new Error("Home KNOW returned an invalid response.");
        }
        const response = json;
        const body = textFallback(response);
        const agentAnswer = toAvaAnswerPacket(response);
        setThread((current) =>
          current.map((turn) =>
            turn.id === agentTurnId
              ? {
                  ...turn,
                  body,
                  agentAnswer,
                }
              : turn,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Home KNOW could not answer that question.";
        setThread((current) =>
          current.map((turn) =>
            turn.id === agentTurnId
              ? {
                  ...turn,
                  body: message,
                }
              : turn,
          ),
        );
      } finally {
        setIsBusy(false);
      }
    },
    [clientKey, payload?.tenant.key],
  );

  const suggestedActions = useMemo<SuggestedAction[]>(
    () =>
      contextBrowserQuestions(dims)
        .slice(0, 3)
        .map((question, index) => ({
          id: `home-know-suggested-${index}`,
          label: question,
          body: question,
          onClick: () => {
            void askHomeKnow(question);
          },
        })),
    [askHomeKnow, dims],
  );

  const tabs = useMemo<AvaCanvasTab[]>(
    () => [
      { id: "overview", label: "Overview" },
      { id: "context", label: "Context", count: dims.length },
      { id: "signals", label: "Signals", count: signals.length },
    ],
    [dims.length, signals.length],
  );

  const canvas = (
    <div className="homex">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hx-shell">
        <main className="hx-canvas">
          <div className="hx-rail" aria-label="Context Explorer tabs">
            <div className="hx-rail-h">Context Explorer</div>
            <div className="hx-navWrap">
              <div className="hx-railLabel">
                <span className="hx-dot" style={{ background: "var(--hb)" }} />
                <span>
                  {dims.length
                    ? `${dims.length} context dimensions loaded`
                    : "Context dimensions"}
                </span>
              </div>
              <select
                aria-label="Choose context dimension"
                className="hx-select"
                onChange={(event) =>
                  setDimKey(event.currentTarget.value || null)
                }
                value={dimKey ?? ""}
              >
                <option value="">Overview</option>
                {dims.map((d) => (
                  <option key={d.dimension} value={d.dimension}>
                    {d.dimension} · {d.trust}% trust
                  </option>
                ))}
              </select>
            </div>
            {dims.length > 0 && (
              <div className="hx-rail-g">Loaded context · {dims.length}</div>
            )}
          </div>
          {selected ? (
            <DimensionView dim={selected} signals={signals} />
          ) : (
            <Overview payload={payload} />
          )}
        </main>
      </div>
    </div>
  );

  return (
    <AvaChatShell
      agent={{
        name: "aVa",
        role: `${payload?.tenant.displayName ?? "Enterprise"} Home KNOW advisor`,
      }}
      canvas={canvas}
      defaultLeftPercent={34}
      isBusy={isBusy}
      minLeftPx={360}
      onMessage={askHomeKnow}
      placeholder="Ask about loaded context, systems, owners, vendors..."
      suggestedActions={suggestedActions}
      surface="home"
      surfaceContext={{
        clientKey,
        tenantKey: payload?.tenant.key ?? clientKey,
        tabs,
      }}
      thread={thread}
    />
  );
}
