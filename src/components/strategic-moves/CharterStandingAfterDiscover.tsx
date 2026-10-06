"use client";

import type { PostDiscoverCharterAnswer } from "@/lib/programs/charter-standing-after-discover";

/**
 * What a charter answer is worth once Discover has closed
 * (`moves_charter_standing_after_discover_v1`, flag-gated), shown on P3+.
 *
 * P1 lets a charter field be answered from an assumption; P2 inherits it and
 * can record what Discover found. Both reads are scoped to their own phase, so
 * from P3 onward a charter answer reads identically whether it was proved,
 * assumed and never checked, or checked and found wrong — while P3 routes a
 * solution off it, P4 builds a business case on it and P5 mobilises against it.
 * This is the read that outlives Discover.
 *
 * Deliberately only a READ: it resolves, edits and re-classifies nothing. It
 * reports two standings, because they are two different problems, and it never
 * renders either in evidence wording.
 *
 * Purely presentational. The host owns the flag gate and the fold
 * (`charterStandingAfterDiscover`); `null` and `[]` both render nothing — an
 * all-clear is not announced here, because the panel's whole subject is the
 * answers that carry a caveat.
 */
export interface CharterStandingAfterDiscoverProps {
  /**
   * The fold's output, passed through unchanged. `null` means the surface is
   * inactive; `[]` means it is active and every charter answer is either
   * evidence-backed, asserted outright, or had its assumption resolved cleanly.
   */
  rows: readonly PostDiscoverCharterAnswer[] | null;
}

export function CharterStandingAfterDiscover({
  rows,
}: CharterStandingAfterDiscoverProps) {
  if (!rows || rows.length === 0) return null;
  const knownWrong = rows.filter((row) => row.standing === "known_wrong");
  const unvalidated = rows.filter((row) => row.standing === "unvalidated");

  return (
    <section
      className="csad"
      aria-label="Charter answers carrying a caveat after Discover"
      data-testid="charter-standing-after-discover"
      data-count={rows.length}
      data-known-wrong={knownWrong.length}
      data-unvalidated={unvalidated.length}
    >
      <style>{CSAD_CSS}</style>
      <div className="csad-eyebrow">Charter standing after Discover</div>
      <h2 className="csad-headline">
        {rows.length} charter answer{rows.length === 1 ? "" : "s"} should not
        be quoted flat from here on.
      </h2>
      <p className="csad-lede">
        Discover has closed. These answers were each completed from an
        assumption, and{" "}
        {knownWrong.length > 0 && unvalidated.length > 0
          ? "one group was corrected while the other was never checked"
          : knownWrong.length > 0
            ? "Discover recorded a correction against them"
            : "the phase whose job was to check them has closed"}
        . Nothing below is resolved by reading it.
      </p>

      {knownWrong.length > 0 ? (
        <div className="csad-group" data-testid="csad-known-wrong">
          <h3 className="csad-group-head">
            Discover corrected {knownWrong.length === 1 ? "this" : "these"} — the
            charter still carries the old wording
          </h3>
          <ul className="csad-list">
            {knownWrong.map((row) => (
              <li className="csad-row csad-row-wrong" key={row.sectionKey}>
                <div className="csad-row-head">
                  <span className="csad-label">{row.label}</span>
                  <span className="csad-badge csad-badge-wrong">
                    Known wrong
                  </span>
                </div>
                {row.answer ? (
                  <p className="csad-answer">{row.answer}</p>
                ) : null}
                <dl className="csad-meta">
                  <div className="csad-meta-cell">
                    <dt>What Discover found</dt>
                    <dd>{row.correction}</dd>
                  </div>
                  <div className="csad-meta-cell">
                    <dt>Assumption owner</dt>
                    <dd>{row.owner}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {unvalidated.length > 0 ? (
        <div className="csad-group" data-testid="csad-unvalidated">
          <h3 className="csad-group-head">
            Nobody checked {unvalidated.length === 1 ? "this" : "these"} — the
            assumption outlived Discover
          </h3>
          <ul className="csad-list">
            {unvalidated.map((row) => (
              <li className="csad-row" key={row.sectionKey}>
                <div className="csad-row-head">
                  <span className="csad-label">{row.label}</span>
                  <span className="csad-badge">Unvalidated</span>
                </div>
                {row.answer ? (
                  <p className="csad-answer">{row.answer}</p>
                ) : null}
                <dl className="csad-meta">
                  <div className="csad-meta-cell">
                    <dt>Owner</dt>
                    <dd>{row.owner}</dd>
                  </div>
                  <div className="csad-meta-cell">
                    <dt>How Discover was meant to validate it</dt>
                    <dd>{row.plannedValidation}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const CSAD_CSS = `
.csad{--csad-ink:#2c2c2a;--csad-amber:#ba7517;--csad-red:#a33a28;--csad-faint:#6f6e68;--csad-line:rgba(10,10,11,.12);--csad-mono:'JetBrains Mono',ui-monospace,monospace;font-family:Inter,system-ui,sans-serif;color:var(--csad-ink);background:#fff;border:1px solid rgba(163,58,40,.26);border-radius:12px;padding:18px 20px;margin-bottom:24px}
.csad-eyebrow{font-family:var(--csad-mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--csad-red)}
.csad-headline{font-family:Fraunces,Georgia,serif;font-size:19px;font-weight:500;line-height:1.4;margin:10px 0 8px}
.csad-lede{font-size:13px;line-height:1.55;color:var(--csad-faint);margin:0 0 16px;max-width:62ch}
.csad-group{margin:0 0 16px}
.csad-group:last-child{margin-bottom:0}
.csad-group-head{font-size:12.5px;font-weight:600;line-height:1.45;margin:0 0 10px;color:var(--csad-ink)}
.csad-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.csad-row{border:1px solid var(--csad-line);border-radius:10px;background:#f5f1eb;padding:13px 15px}
.csad-row-wrong{border-color:rgba(163,58,40,.3);background:#faecea}
.csad-row-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.csad-label{font-size:13.5px;font-weight:600}
.csad-badge{font-family:var(--csad-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--csad-amber);background:#faeeda;border:1px solid rgba(186,117,23,.3);border-radius:4px;padding:2px 6px;white-space:nowrap}
.csad-badge-wrong{color:var(--csad-red);background:#f7ddd8;border-color:rgba(163,58,40,.3)}
.csad-answer{font-size:13px;line-height:1.55;margin:8px 0 0;color:var(--csad-ink)}
.csad-meta{display:grid;grid-template-columns:1fr 1.5fr;gap:10px 18px;margin:12px 0 0}
@media (max-width:640px){.csad-meta{grid-template-columns:1fr}}
.csad-meta-cell dt{font-family:var(--csad-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--csad-faint);margin:0 0 3px}
.csad-meta-cell dd{font-size:13px;line-height:1.5;margin:0}
`;
