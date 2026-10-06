"use client";

import type { CarriedCharterAssumption } from "@/lib/programs/charter-assumptions-carry-forward";

/**
 * The P2 half of the charter-basis promise: the open charter assumptions
 * Discover inherits (`moves_charter_assumptions_discover_v1`, flag-gated).
 *
 * P1 badges an unsupported answer "Assumption · validate in Discover" and tells
 * the person it "carries into Discover to be validated". Until this panel
 * existed nothing in P2 read that record, so the sentence named a handover the
 * product never performed. This is that handover, and it is deliberately only
 * a READ: it shows what P1 left open, who owns it, and the validation plan the
 * person typed — it never closes, edits or re-classifies an assumption, and it
 * never renders an assumption in evidence wording.
 *
 * Purely presentational. The host owns the flag gate and the fold
 * (`carriedCharterAssumptions`); an empty or null list renders nothing at all.
 */
export interface CharterAssumptionsCarryForwardProps {
  /**
   * The fold's output, passed through unchanged. `null` (surface inactive) and
   * `[]` (active, nothing assumed) both render nothing — the panel never
   * announces an empty charter as a clean one.
   */
  assumptions: readonly CarriedCharterAssumption[] | null;
}

export function CharterAssumptionsCarryForward({
  assumptions,
}: CharterAssumptionsCarryForwardProps) {
  if (!assumptions || assumptions.length === 0) return null;
  const count = assumptions.length;

  return (
    <section
      className="cac"
      aria-label="Charter assumptions to validate in Discover"
      data-testid="charter-assumptions-carry-forward"
      data-count={count}
    >
      <style>{CAC_CSS}</style>
      <div className="cac-eyebrow">Carried from the charter</div>
      <h2 className="cac-headline">
        {count} charter answer{count === 1 ? "" : "s"}{" "}
        {count === 1 ? "is" : "are"} still an assumption. Discover is where{" "}
        {count === 1 ? "it gets" : "they get"} confirmed or corrected.
      </h2>
      <p className="cac-lede">
        These completed the charter without evidence behind them. None of them
        counts as established fact, and none is covered by evidence — each is
        open until the work below says otherwise.
      </p>

      <ul className="cac-list">
        {assumptions.map((row) => (
          <li className="cac-row" key={row.sectionKey}>
            <div className="cac-row-head">
              <span className="cac-label">{row.label}</span>
              <span className="cac-badge">Assumption · open</span>
            </div>
            {row.answer ? <p className="cac-answer">{row.answer}</p> : null}
            <dl className="cac-meta">
              <div className="cac-meta-cell">
                <dt>Owner</dt>
                <dd>{row.owner}</dd>
              </div>
              <div className="cac-meta-cell">
                <dt>How Discover validates it</dt>
                <dd>{row.validationPlan}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

const CAC_CSS = `
.cac{--cac-ink:#2c2c2a;--cac-amber:#ba7517;--cac-faint:#6f6e68;--cac-line:rgba(10,10,11,.12);--cac-mono:'JetBrains Mono',ui-monospace,monospace;font-family:Inter,system-ui,sans-serif;color:var(--cac-ink);background:#fff;border:1px solid rgba(186,117,23,.3);border-radius:12px;padding:18px 20px;margin-bottom:24px}
.cac-eyebrow{font-family:var(--cac-mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--cac-amber)}
.cac-headline{font-family:Fraunces,Georgia,serif;font-size:19px;font-weight:500;line-height:1.4;margin:10px 0 8px}
.cac-lede{font-size:13px;line-height:1.55;color:var(--cac-faint);margin:0 0 16px;max-width:62ch}
.cac-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.cac-row{border:1px solid var(--cac-line);border-radius:10px;background:#f5f1eb;padding:13px 15px}
.cac-row-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cac-label{font-size:13.5px;font-weight:600}
.cac-badge{font-family:var(--cac-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--cac-amber);background:#faeeda;border:1px solid rgba(186,117,23,.3);border-radius:4px;padding:2px 6px;white-space:nowrap}
.cac-answer{font-size:13px;line-height:1.55;margin:8px 0 0;color:var(--cac-ink)}
.cac-meta{display:grid;grid-template-columns:1fr 1.5fr;gap:10px 18px;margin:12px 0 0}
@media (max-width:640px){.cac-meta{grid-template-columns:1fr}}
.cac-meta-cell dt{font-family:var(--cac-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--cac-faint);margin:0 0 3px}
.cac-meta-cell dd{font-size:13px;line-height:1.5;margin:0}
`;
