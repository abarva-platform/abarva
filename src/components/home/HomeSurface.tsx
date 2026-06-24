"use client";

// Home — real React Context Explorer. Home is a KNOW-mode surface: it asks the
// Home KNOW endpoint and renders the shared HomeKnowResponse contract. It does
// not classify intent, retrieve data, or render Intelligence experts locally.

import { useState } from "react";
import { HomeKnowAsk } from "@/components/home/know/HomeKnowAsk";
import type {
  IntelligenceBindingPayload,
  BindingDimension,
  BindingSignal,
} from "@/lib/intelligence/binding/binding-payload";

const CSS = `
.homex{--hl:#E7E3DA;--hi:#1A1A18;--hm:#6B6B63;--hf:#9A998E;--hg:#1F6B3A;--hb:#0A76D8;--ham:#A66A1F;--hr:#a32d2d;--hcard:#fff;--hbg:#FBFAF7;background:var(--hbg);min-height:100%;color:var(--hi);font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;font-size:14px}
.homex .hx-shell{display:block;min-height:100%}
.homex .hx-askBand{background:#fff;border-bottom:1px solid var(--hl);padding:14px 40px 16px}
.homex .hx-askInner{max-width:980px}
.homex .hx-rail{border-bottom:1px solid var(--hl);padding:12px 40px;background:#fff;position:sticky;top:0;z-index:2}
.homex .hx-navWrap{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
.homex .hx-nav{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;background:none;border:1px solid transparent;border-radius:50%;padding:0;cursor:pointer;font-family:inherit}
.homex .hx-nav:hover{background:#F4F2EC}
.homex .hx-nav.on{background:#EEF6E9;border-color:#DDEAD8}
.homex .hx-dot{width:8px;height:8px;border-radius:50%;flex:none}
.homex .hx-nav.on .hx-dot{width:10px;height:10px}
.homex .hx-nav-l,.homex .hx-tr,.homex .hx-rail-h,.homex .hx-rail-g{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.homex .hx-canvas{padding:0 0 80px;max-width:none;min-width:0}
.homex .hx-body{padding:14px 40px 0}
.homex .hx-ey{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--hf)}
.homex .hx-h2{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:26px;letter-spacing:-.01em;margin:8px 0 6px}
.homex .hx-stats{display:flex;flex-wrap:wrap;gap:26px;margin:18px 0 6px;padding-bottom:18px;border-bottom:1px solid var(--hl)}
.homex .hx-stat .k{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--hf)}
.homex .hx-stat .v{font-family:var(--font-fraunces),Georgia,serif;font-size:22px;font-weight:500;margin-top:2px}
.homex .hx-sec{margin-top:26px}
.homex .hx-sechead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
.homex .hx-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:680px){.homex .hx-grid{grid-template-columns:1fr}.homex .hx-askBand,.homex .hx-rail,.homex .hx-body{padding-left:18px;padding-right:18px}}
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
        Pick a context dot above, or ask a question in the aVa bar.
      </div>
    </div>
  );
}

export function HomeSurface({
  payload,
  clientKey,
}: {
  payload: IntelligenceBindingPayload | null;
  clientKey?: string | null;
}) {
  const dims = payload?.context ?? [];
  const signals = payload?.signals ?? [];
  const [dimKey, setDimKey] = useState<string | null>(null);
  const selected = dimKey
    ? (dims.find((d) => d.dimension === dimKey) ?? null)
    : null;

  return (
    <div className="homex">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hx-shell">
        <main className="hx-canvas">
          <section className="hx-askBand" aria-label="Ask aVa">
            <div className="hx-askInner">
              <HomeKnowAsk
                client={clientKey}
                placeholder="Ask about loaded context, systems, owners, vendors..."
                showSuggestions={false}
                suggestedQuestions={contextBrowserQuestions(dims)}
                tenantKey={payload?.tenant.key ?? clientKey}
              />
            </div>
          </section>
          <div className="hx-rail" aria-label="Context Explorer tabs">
            <div className="hx-rail-h">Context Explorer</div>
            <div className="hx-navWrap">
              <button
                type="button"
                className={`hx-nav${dimKey ? "" : " on"}`}
                onClick={() => setDimKey(null)}
                title="Overview"
                aria-label="Overview"
              >
                <span className="hx-dot" style={{ background: "var(--hb)" }} />
                <span className="hx-nav-l">Overview</span>
              </button>
              {dims.map((d) => (
                <button
                  type="button"
                  key={d.dimension}
                  className={`hx-nav${dimKey === d.dimension ? " on" : ""}`}
                  onClick={() => setDimKey(d.dimension)}
                  title={d.dimension}
                  aria-label={d.dimension}
                >
                  <span
                    className="hx-dot"
                    style={{ background: toneFor(d.trust) }}
                  />
                  <span className="hx-nav-l">{d.dimension}</span>
                  <span className="hx-tr">{d.trust}</span>
                </button>
              ))}
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
}
