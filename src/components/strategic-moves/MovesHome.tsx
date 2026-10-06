"use client";

import Link from "next/link";

/**
 * The redesigned Moves Home (portfolio) landing surface. Presentational only —
 * every value is passed in by the host, which derives the headline, value line,
 * and reconciliation from the real moves read-model + governed value facts
 * (fact-lineage). No numbers are computed or invented here; the component just
 * renders what it is given. Canon tokens (cream / teal / Fraunces / Inter /
 * mono); matches the Strategic Moves Home design.
 */
export interface MovesHomeWaitingItem {
  id: string;
  /** Where the move is, e.g. "P1 Charter · step 2". */
  where: string;
  name: string;
  /** The specific thing waiting on the user, e.g. "Confirm decision rights." */
  ask: string;
  sponsor: string;
  when: string;
  href: string;
}

export type MovesHomeStatusTone = "active" | "done" | "watch" | "blocked";

export interface MovesHomeMoveRow {
  id: string;
  name: string;
  /** Display code, e.g. "HEALTHCARE_IDN-MEMBER-2026". */
  code: string;
  phaseLabel: string;
  /** 0..5 — drives the six-dot phase rail. */
  phaseIndex: number;
  status: string;
  statusTone: MovesHomeStatusTone;
  sponsor: string;
  value: string;
  activity: string;
  href: string;
}

export interface MovesHomeReconciliation {
  declaredPrograms: string;
  trackedRecords: string;
  declaredBudget: string;
  declaredValue: string;
}

export interface MovesHomeProps {
  tenantName: string;
  /** Human headline, e.g. "8 moves in flight · 3 waiting on a decision". */
  headline: string;
  /** Value line under the headline. */
  valueLine: string;
  waiting: readonly MovesHomeWaitingItem[];
  moves: readonly MovesHomeMoveRow[];
  reconciliation?: MovesHomeReconciliation | null;
  newMoveHref: string;
  footerNote?: string;
}

const PHASE_CODES = ["P0", "P1", "P2", "P3", "P4", "P5"] as const;

export function MovesHome({
  tenantName,
  headline,
  valueLine,
  waiting,
  moves,
  reconciliation = null,
  newMoveHref,
  footerNote,
}: MovesHomeProps) {
  return (
    <div className="mh" data-testid="moves-home">
      <style>{MH_CSS}</style>

      <header className="mh-header">
        <div>
          <span className="mh-eyebrow">{tenantName} · Strategic Moves</span>
          <h1 className="mh-headline">{headline}</h1>
          <p className="mh-valueline">{valueLine}</p>
        </div>
        <div className="mh-actions">
          <Link className="mh-btn-quiet" href="/strategic-moves/manage">
            Manage moves
          </Link>
          <Link className="mh-btn-primary" href={newMoveHref}>
            + New move
          </Link>
        </div>
      </header>

      {waiting.length > 0 ? (
        <section aria-labelledby="mh-waiting" className="mh-section">
          <div className="mh-section-head">
            <h2 id="mh-waiting">Waiting on you</h2>
            <span className="mh-note">Oldest first</span>
          </div>
          <div className="mh-waiting-list">
            {waiting.map((item) => (
              <Link className="mh-waiting-card" href={item.href} key={item.id}>
                <span className="mh-waiting-where">{item.where}</span>
                <span className="mh-waiting-name">{item.name}</span>
                <span className="mh-waiting-ask">{item.ask}</span>
                <span className="mh-waiting-foot">
                  <span>
                    {item.sponsor} · {item.when}
                  </span>
                  <span className="mh-continue">Continue →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="mh-all" className="mh-section">
        <div className="mh-section-head">
          <h2 id="mh-all">All moves</h2>
        </div>
        <div className="mh-table" role="table" aria-label="All moves">
          <div className="mh-row mh-row-head" role="row">
            <span role="columnheader">Move</span>
            <span role="columnheader">Phase</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Sponsor</span>
            <span role="columnheader">Value</span>
            <span role="columnheader">Activity</span>
          </div>
          {moves.map((move) => (
            <Link className="mh-row" href={move.href} key={move.id} role="row">
              <span className="mh-cell mh-cell-move" role="cell">
                <span className="mh-move-name">{move.name}</span>
                <span className="mh-move-code">{move.code}</span>
              </span>
              <span className="mh-cell mh-cell-phase" role="cell">
                <span>{move.phaseLabel}</span>
                <span aria-hidden="true" className="mh-rail">
                  {PHASE_CODES.map((code, index) => (
                    <span
                      className={`mh-rail-dot${index <= move.phaseIndex ? " on" : ""}`}
                      key={code}
                    />
                  ))}
                </span>
              </span>
              <span className="mh-cell" role="cell">
                <span className={`mh-status mh-status-${move.statusTone}`}>
                  {move.status}
                </span>
              </span>
              <span className="mh-cell" role="cell">
                {move.sponsor}
              </span>
              <span className="mh-cell" role="cell">
                {move.value}
              </span>
              <span className="mh-cell mh-cell-activity" role="cell">
                {move.activity}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {reconciliation ? (
        <section aria-label="Reconciliation with client inventory" className="mh-recon">
          <span className="mh-eyebrow">Reconciled with client inventory</span>
          <dl className="mh-recon-grid">
            <div>
              <dt>Declared by client</dt>
              <dd>{reconciliation.declaredPrograms}</dd>
            </div>
            <div>
              <dt>Tracked in Moves</dt>
              <dd>{reconciliation.trackedRecords}</dd>
            </div>
            <div>
              <dt>Declared budget</dt>
              <dd>{reconciliation.declaredBudget}</dd>
            </div>
            <div>
              <dt>Declared value</dt>
              <dd>{reconciliation.declaredValue}</dd>
            </div>
          </dl>
          <p className="mh-recon-note">
            Reconciled, not merged. Work items, milestones and approvals are
            created here and never overwritten from the client inventory.
          </p>
        </section>
      ) : null}

      {footerNote ? <footer className="mh-footer">{footerNote}</footer> : null}
    </div>
  );
}

const MH_CSS = `
.mh{--mh-bg:#f5f1eb;--mh-surface:#fff;--mh-ink:#2c2c2a;--mh-muted:#5f5e5a;--mh-faint:#888780;--mh-line:rgba(10,10,11,.12);--mh-line-strong:rgba(10,10,11,.24);--mh-accent:#1d9e75;--mh-accent-hover:#0f6e56;--mh-amber:#ba7517;--mh-red:#a32d2d;--mh-serif:Fraunces,Georgia,serif;--mh-sans:Inter,system-ui,sans-serif;--mh-mono:'JetBrains Mono',ui-monospace,monospace;color:var(--mh-ink);font-family:var(--mh-sans);font-size:15px;line-height:1.55;display:flex;flex-direction:column;gap:40px;padding:40px clamp(20px,3vw,44px) 64px;max-width:1200px;margin:0 auto}
.mh-eyebrow{font-family:var(--mh-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mh-faint);font-weight:600}
.mh-header{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;justify-content:space-between}
.mh-headline{font-family:var(--mh-serif);font-weight:500;font-size:clamp(26px,3.4vw,38px);line-height:1.12;letter-spacing:-.01em;margin:8px 0 8px}
.mh-valueline{margin:0;color:var(--mh-muted);font-size:16px;max-width:60ch}
.mh-actions{display:flex;align-items:center;gap:10px}
.mh-btn-quiet{color:var(--mh-muted);font-size:14px;font-weight:500;padding:10px 12px;border-radius:9px;text-decoration:none}
.mh-btn-quiet:hover{color:var(--mh-ink)}
.mh-btn-primary{background:var(--mh-accent);color:#fff;font-size:14px;font-weight:600;padding:10px 16px;border-radius:9px;text-decoration:none}
.mh-btn-primary:hover{background:var(--mh-accent-hover)}
.mh-section{display:flex;flex-direction:column;gap:16px}
.mh-section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.mh-section-head h2{font-family:var(--mh-serif);font-weight:500;font-size:22px;margin:0}
.mh-note{font-size:12px;color:var(--mh-faint)}
.mh-waiting-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.mh-waiting-card{display:flex;flex-direction:column;gap:7px;background:var(--mh-surface);border:1px solid var(--mh-line);border-radius:12px;padding:16px;text-decoration:none;color:var(--mh-ink)}
.mh-waiting-card:hover{border-color:var(--mh-line-strong)}
.mh-waiting-where{font-family:var(--mh-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mh-faint)}
.mh-waiting-name{font-size:15px;font-weight:600}
.mh-waiting-ask{font-size:13.5px;color:var(--mh-muted);line-height:1.45}
.mh-waiting-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px;font-size:12px;color:var(--mh-faint)}
.mh-continue{color:var(--mh-accent);font-weight:600}
.mh-table{display:flex;flex-direction:column;border:1px solid var(--mh-line);border-radius:12px;overflow:hidden;background:var(--mh-surface)}
.mh-row{display:grid;grid-template-columns:2.4fr 1.6fr 1fr 1.2fr 1fr 1fr;gap:12px;align-items:center;padding:13px 16px;border-top:1px solid var(--mh-line);text-decoration:none;color:var(--mh-ink)}
.mh-row:first-child{border-top:0}
.mh-row-head{background:var(--mh-bg);font-family:var(--mh-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mh-faint);font-weight:600}
.mh-row:not(.mh-row-head):hover{background:#faf7f1}
.mh-cell{font-size:13.5px;min-width:0}
.mh-cell-move{display:flex;flex-direction:column;gap:2px}
.mh-move-name{font-weight:600;font-size:14px}
.mh-move-code{font-family:var(--mh-mono);font-size:10px;color:var(--mh-faint)}
.mh-cell-phase{display:flex;flex-direction:column;gap:5px}
.mh-rail{display:flex;gap:3px}
.mh-rail-dot{width:14px;height:3px;border-radius:2px;background:var(--mh-line-strong);opacity:.4}
.mh-rail-dot.on{background:var(--mh-accent);opacity:1}
.mh-status{font-size:12.5px;font-weight:600}
.mh-status-active{color:var(--mh-accent)}
.mh-status-done{color:var(--mh-muted)}
.mh-status-watch{color:var(--mh-amber)}
.mh-status-blocked{color:var(--mh-red)}
.mh-cell-activity{color:var(--mh-faint);font-size:12.5px}
.mh-recon{display:flex;flex-direction:column;gap:12px;border-top:1px solid var(--mh-line);padding-top:24px}
.mh-recon-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:18px;margin:0}
.mh-recon-grid dt{font-size:12px;color:var(--mh-faint);margin-bottom:4px}
.mh-recon-grid dd{margin:0;font-family:var(--mh-serif);font-size:22px}
.mh-recon-note{margin:0;font-size:12.5px;color:var(--mh-muted);max-width:70ch}
.mh-footer{font-size:11px;color:var(--mh-faint);border-top:1px solid var(--mh-line);padding-top:16px}
@media (max-width:760px){.mh-row{grid-template-columns:1fr 1fr;gap:8px}.mh-row-head{display:none}.mh-cell-activity{display:none}}
`;
