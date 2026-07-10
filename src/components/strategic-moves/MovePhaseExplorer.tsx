"use client";

// MovePhaseExplorer — persistent left-side phase explorer for the Moves
// phase workspace. Ports Source's CanvasGateSidebar pattern (a Stripe-style
// deterministic step list: every stage visible at once, with a live
// met/total tally, so progress and what's left are never a guess).
//
// Purely presentational: it renders the tallies it is given. Rows for
// phases already reached are links (jump back to review); the current
// phase and phases not yet reached render as plain rows — you cannot skip
// ahead, so making those look clickable would only invite a locked-phase
// redirect.

import Link from "next/link";
import styles from "./MovePhaseExplorer.module.css";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";

export interface MovePhaseExplorerProps {
  moveId: string;
  currentPhase: number;
  tallies: PhaseTallyRow[];
}

export function MovePhaseExplorer({
  moveId,
  currentPhase,
  tallies,
}: MovePhaseExplorerProps) {
  return (
    <aside
      className={styles.explorer}
      aria-label={`Move journey: phase ${currentPhase} of ${tallies.length - 1}`}
    >
      <div className={styles.head}>Journey</div>
      <div className={styles.rows}>
        {tallies.map((row) => {
          const isCurrent = row.state === "current";
          const isDone = row.state === "done";
          const rowClasses = [
            styles.row,
            isCurrent ? styles.rowCurrent : "",
            isDone ? styles.rowDone : "",
          ]
            .filter(Boolean)
            .join(" ");
          const inner = (
            <>
              <span className={styles.dot} aria-hidden>
                {isDone ? "✓" : ""}
              </span>
              <span className={styles.label}>{row.label}</span>
              <span className={styles.tally}>
                {row.total > 0 ? `${row.met} of ${row.total}` : "—"}
              </span>
            </>
          );
          return row.state === "done" ? (
            <Link
              key={row.phase}
              href={`/strategic-moves/${moveId}/phase/${row.phase}`}
              className={rowClasses}
            >
              {inner}
            </Link>
          ) : (
            <div key={row.phase} className={rowClasses}>
              {inner}
            </div>
          );
        })}
        <div className={styles.towerRow} aria-label="Hands off to Control Tower after P5">
          <span aria-hidden>&rarr;</span> Tower
        </div>
      </div>
    </aside>
  );
}
