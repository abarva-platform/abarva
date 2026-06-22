"use client";

// Home — real React Context Explorer (replaces the static /home-v2 iframe + its
// fake `answerForAsk`). Two things, both canonical:
//
//  1. The ask is AvaAsk: shared /api/intelligence/ask + the ONE AgentAnswerRenderer.
//  2. The explorer renders REAL per-tenant context from the binding payload
//     (the loaded dimensions, signals, and corpus) — NOT the single-tenant demo
//     blob the static page baked in. Same source of truth as Intelligence.
//
// Left rail = the tenant's loaded context dimensions. Canvas = the ask (always)
// plus either an overview (trust posture + signals + corpus) or one dimension's
// detail. When the engine's exhibit quality is fixed, the ask inherits it for
// free — Home has no renderer of its own.

import { useState } from "react";
import { AvaAsk } from "@/components/agent-answer/AvaAsk";
import type {
  IntelligenceBindingPayload,
  BindingDimension,
  BindingSignal,
} from "@/lib/intelligence/binding/binding-payload";
import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";

const CSS = `
.homex{--hl:#E7E3DA;--hi:#1A1A18;--hm:#6B6B63;--hf:#9A998E;--hg:#1F6B3A;--hb:#0A76D8;--ham:#A66A1F;--hr:#a32d2d;--hcard:#fff;--hbg:#FBFAF7;background:var(--hbg);min-height:100%;color:var(--hi);font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px}
.homex .hx-shell{display:grid;grid-template-columns:268px 1fr;min-height:100%}
@media(max-width:860px){.homex .hx-shell{grid-template-columns:1fr}.homex .hx-rail{display:none}}
.homex .hx-rail{border-right:1px solid var(--hl);padding:22px 14px;background:#fff}
.homex .hx-rail-h{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--hf);padding:0 8px 12px}
.homex .hx-rail-g{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--hf);margin:16px 8px 6px}
.homex .hx-nav{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:none;border:none;border-radius:8px;padding:8px 10px;font-size:13px;color:#33332e;cursor:pointer;font-family:inherit}
.homex .hx-nav:hover{background:#F4F2EC}
.homex .hx-nav.on{background:#EEF6E9;color:#1a1a18;font-weight:500}
.homex .hx-dot{width:8px;height:8px;border-radius:50%;flex:none}
.homex .hx-nav-l{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.homex .hx-tr{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;color:var(--hf)}
.homex .hx-canvas{padding:0 0 80px;max-width:1080px}
.homex .hx-ask{padding:34px 40px 8px}
.homex .hx-ask h1{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:34px;line-height:1.08;letter-spacing:-.015em;margin:0 0 8px;text-align:center}
.homex .hx-ask .hx-sub{color:var(--hm);font-size:14px;max-width:600px;margin:0 auto 22px;text-align:center}
.homex .hx-body{padding:14px 40px 0}
.homex .hx-ey{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--hf)}
.homex .hx-h2{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:26px;letter-spacing:-.01em;margin:8px 0 6px}
.homex .hx-stats{display:flex;flex-wrap:wrap;gap:26px;margin:18px 0 6px;padding-bottom:18px;border-bottom:1px solid var(--hl)}
.homex .hx-stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--hf)}
.homex .hx-stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.homex .hx-sec{margin-top:26px}
.homex .hx-sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
.homex .hx-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:680px){.homex .hx-grid{grid-template-columns:1fr}}
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
        {s.evidencePoints} evidence points · {s.sources} sources
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
          <div className="k">Evidence</div>
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
        <p style={{ color: "var(--ham)", fontSize: 13, marginTop: 14 }}>⚑ {dim.flag}</p>
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
  return (
    <div className="hx-body">
      <div className="hx-ey">Current-state read</div>
      <h2 className="hx-h2">What we know about your enterprise.</h2>
      {tl ? (
        <div className="hx-stats">
          <div className="hx-stat">
            <div className="k">Dimensions</div>
            <div className="v">{tl.dimensionsLoaded}</div>
          </div>
          <div className="hx-stat">
            <div className="k">Evidence points</div>
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
        Pick a loaded dimension on the left, or ask a question above — both answer right here.
      </div>
    </div>
  );
}

export function HomeSurface({
  payload,
  surfaceContext,
}: {
  payload: IntelligenceBindingPayload | null;
  surfaceContext?: AskSurfaceContext;
}) {
  const dims = payload?.context ?? [];
  const signals = payload?.signals ?? [];
  const [dimKey, setDimKey] = useState<string | null>(null);
  const selected = dimKey ? dims.find((d) => d.dimension === dimKey) ?? null : null;

  return (
    <div className="homex">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hx-shell">
        <aside className="hx-rail">
          <div className="hx-rail-h">Context Explorer</div>
          <button
            type="button"
            className={`hx-nav${dimKey ? "" : " on"}`}
            onClick={() => setDimKey(null)}
          >
            <span className="hx-nav-l">Overview</span>
          </button>
          {dims.length > 0 && (
            <div className="hx-rail-g">Loaded context · {dims.length}</div>
          )}
          {dims.map((d) => (
            <button
              type="button"
              key={d.dimension}
              className={`hx-nav${dimKey === d.dimension ? " on" : ""}`}
              onClick={() => setDimKey(d.dimension)}
            >
              <span className="hx-dot" style={{ background: toneFor(d.trust) }} />
              <span className="hx-nav-l">{d.dimension}</span>
              <span className="hx-tr">{d.trust}</span>
            </button>
          ))}
        </aside>

        <main className="hx-canvas">
          <div className="hx-ask">
            <h1>Ask anything about your enterprise.</h1>
            <p className="hx-sub">
              Every answer is read from your loaded context and cited to its source — and
              says so honestly when the evidence isn&rsquo;t there.
            </p>
            <AvaAsk client={payload?.tenant.key} surfaceContext={surfaceContext} />
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
}
