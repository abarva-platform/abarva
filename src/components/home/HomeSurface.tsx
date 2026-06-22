// Home — real React surface (replaces the static /home-v2 iframe + its fake
// `answerForAsk`). The ask is the canonical AvaAsk: shared engine + the ONE
// AgentAnswerRenderer, identical to Intelligence. No surface-local renderer,
// no fact-globbing. Context cards are read from the same binding payload the
// Intelligence surface uses, so Home and Intelligence share one source of truth.
//
// Follow-up (separate slice): port the full 19-dimension Context Explorer
// (left rail + per-dimension current-state assessments) from public/home-v2
// into this surface, then retire the static assets.

import { AvaAsk } from "@/components/agent-answer/AvaAsk";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";

const CSS = `
.homev3{--hl:#E7E3DA;--hi:#1A1A18;--hm:#6B6B63;--hf:#9A998E;--hg:#1F6B3A;background:#FBFAF7;min-height:100%;font-family:var(--font-geist-sans),Inter,system-ui,sans-serif;color:var(--hi)}
.homev3 .hv-wrap{max-width:1180px;margin:0 auto;padding:0 28px}
.homev3 .hv-hero{text-align:center;padding:52px 0 8px}
.homev3 .hv-ey{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--hf)}
.homev3 .hv-hero h1{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:42px;line-height:1.06;letter-spacing:-.015em;margin:14px 0 14px}
.homev3 .hv-sub{color:var(--hm);font-size:15px;max-width:620px;margin:0 auto 26px}
.homev3 .hv-sec{padding:34px 0 80px}
.homev3 .hv-sechead{display:flex;justify-content:space-between;align-items:baseline;margin:10px 0 18px}
.homev3 .hv-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media(max-width:760px){.homev3 .hv-grid{grid-template-columns:1fr}}
.homev3 .hv-card{background:#fff;border:1px solid var(--hl);border-radius:12px;padding:22px 24px}
.homev3 .hv-tags{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--hm);margin-bottom:10px}
.homev3 .hv-card h3{font-family:var(--font-fraunces),Georgia,serif;font-weight:500;font-size:20px;line-height:1.22;letter-spacing:-.01em;margin:0 0 9px}
.homev3 .hv-card p{color:#3d3d36;font-size:13.5px;line-height:1.6;margin:0}
.homev3 .hv-evi{font-family:var(--font-geist-mono),ui-monospace,monospace;font-size:11px;color:var(--hm);margin-top:13px}
`;

export function HomeSurface({
  payload,
  surfaceContext,
}: {
  payload: IntelligenceBindingPayload | null;
  surfaceContext?: AskSurfaceContext;
}) {
  const signals = payload?.signals?.slice(0, 4) ?? [];
  return (
    <div className="homev3">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hv-wrap">
        <div className="hv-hero">
          <div className="hv-ey">Home · Context</div>
          <h1>Ask anything about your enterprise.</h1>
          <p className="hv-sub">
            Every answer is read from your loaded context and cited to its source — and
            says so honestly when the evidence isn&rsquo;t there.
          </p>
          <AvaAsk client={payload?.tenant.key} surfaceContext={surfaceContext} />
        </div>

        {signals.length > 0 && (
          <div className="hv-sec">
            <div className="hv-sechead">
              <span className="hv-ey">What your context is telling you</span>
              <span className="hv-ey">{signals.length} active</span>
            </div>
            <div className="hv-grid">
              {signals.map((s) => (
                <div className="hv-card" key={s.id}>
                  {s.domains?.length ? (
                    <div className="hv-tags">{s.domains.join(" · ")}</div>
                  ) : null}
                  <h3>{s.headline}</h3>
                  <p>{s.body}</p>
                  {typeof s.evidencePoints === "number" ? (
                    <div className="hv-evi">
                      {s.evidencePoints} evidence points
                      {typeof s.sources === "number" ? ` · ${s.sources} sources` : ""}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
