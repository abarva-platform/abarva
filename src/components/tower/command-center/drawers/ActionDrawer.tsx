"use client";

// The action drawer — opened from any action card on the Evidence & Actions
// tab. Transcribed from `actionDrawer()` (design line ~1181).
//
// ── On "Approve & route" ───────────────────────────────────────────────────
//
// The design (lines 1196–1203) swaps the drawer body for a confirmation reading
// "Routed to <role> — created as a Move — with its evidence chain attached",
// and swaps the footer to Close / View in Moves.
//
// There is no governed Tower → Moves create path in the repo today.
// `TowerMartCxoAction.moduleHandoff` is a display label — the Command Center
// renders it as text and nothing more — and `src/app/api/tower/decision/route.ts`
// writes a fund/pause/kill signal into `program_audit_log` against an EXISTING
// programId or moveId. Neither creates a Move.
//
// Per §5 of the handoff prompt — "Do not ship a button that shows 'Routed to
// CFO' without anything having been routed" — the button is therefore rendered
// DISABLED with the reason stated in the drawer. The confirmation state is
// implemented and unit-tested behind `canRoute`, so the day a governed create
// path lands, wiring it is a one-line change and the transition is already
// correct. This is a stop-and-ask item in the PR.

import { useEffect, useState } from "react";

import type { TowerActionView } from "@/lib/tower/command-center/types";

import { Dot, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";
import { DrawerSection, DrawerShell, DrawerStat } from "./DrawerShell";

const LANE_TONE = {
  fund: "teal",
  fix: "amber",
  freeze: "red",
  stop: "red",
} as const;

const EYEBROW_TONE = { teal: "eTeal", amber: "eAmber", red: "eRed" } as const;

export function ActionDrawer({
  action,
  /**
   * Whether a governed create-a-Move path exists for this action. Today the
   * page always passes `false`; the parameter exists so the wiring point is
   * explicit rather than buried.
   */
  canRoute = false,
  onClose,
  onRoute,
}: {
  action: TowerActionView | null;
  canRoute?: boolean;
  onClose: () => void;
  onRoute?: (action: TowerActionView) => Promise<void>;
}) {
  const open = action !== null;
  const [routed, setRouted] = useState(false);
  const [routing, setRouting] = useState(false);

  // Every newly opened action starts un-routed — otherwise the confirmation
  // from a previous action would leak onto the next one.
  useEffect(() => {
    setRouted(false);
    setRouting(false);
  }, [action?.id]);

  const tone = action ? LANE_TONE[action.lane] : "amber";

  const handleRoute = async () => {
    if (!action || !canRoute || !onRoute) return;
    setRouting(true);
    try {
      await onRoute(action);
      // The confirmation renders only AFTER the write resolves.
      setRouted(true);
    } finally {
      setRouting(false);
    }
  };

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      eyebrowTone={EYEBROW_TONE[tone]}
      eyebrow={action ? `Action · ${action.ownerRole} · ${action.lane}` : ""}
      title={action?.title ?? ""}
      footer={
        routed ? (
          <>
            <span className={styles.drTrust}>
              <Dot tone="teal" />
              Move created · awaiting owner
            </span>
            <button type="button" className={styles.btn} onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <span className={styles.drTrust}>
              <Dot tone={tone} />
              Owner · {action?.ownerRole ?? "Unassigned"}
            </span>
            <button type="button" className={styles.btn} onClick={onClose}>
              Defer
            </button>
            <button
              type="button"
              className={cx(styles.btn, styles.primary)}
              disabled={!canRoute || routing}
              title={
                canRoute
                  ? undefined
                  : "No governed Tower → Moves create path exists yet, so nothing would actually be routed."
              }
              onClick={handleRoute}
            >
              {routing ? "Routing…" : "Approve & route"}
            </button>
          </>
        )
      }
    >
      {action ? (
        routed ? (
          <div className={styles.moveDone}>
            <div className={styles.md}>●</div>
            <h4>Routed to {action.ownerRole}</h4>
            <p>
              Created as a Move — “{action.moveTitle}” — with its evidence chain
              attached. The owner approves activation in Strategic Moves.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.drGrid}>
              <DrawerStat
                label="Decision required"
                value={action.decision}
                small
              />
              <DrawerStat
                label="Due window"
                value={action.due ?? "Not recorded"}
                small
                tone={
                  tone === "red"
                    ? "vRed"
                    : tone === "amber"
                      ? "vAmber"
                      : "vTeal"
                }
              />
              <DrawerStat
                label="Linked program"
                value={action.linkedProgram ?? "Not linked"}
                small
              />
              <DrawerStat label="Owner" value={action.ownerRole} small />
            </div>

            <DrawerSection>Why now</DrawerSection>
            <p className={cx(styles.recBox, styles.muted)}>{action.why}</p>

            <DrawerSection>Evidence needed</DrawerSection>
            <p className={styles.recBox}>{action.evidence}</p>

            <div className={styles.approveNote}>
              <Dot tone={canRoute ? "amber" : "red"} />
              <span>
                {canRoute ? (
                  <>
                    <b>Human approval required.</b> Approving routes this to{" "}
                    <b>{action.ownerRole}</b> as a Move — “{action.moveTitle}” —
                    with its evidence chain attached. Nothing acts
                    automatically.
                  </>
                ) : (
                  <>
                    <b>Routing is not available yet.</b> There is no governed
                    Tower → Moves create path, so approving here would change
                    nothing. The button is disabled rather than showing a
                    confirmation for work that did not happen. Raise the Move in
                    Strategic Moves directly, against{" "}
                    <b>{action.moduleHandoff ?? "the owning module"}</b>.
                  </>
                )}
              </span>
            </div>
          </>
        )
      ) : null}
    </DrawerShell>
  );
}
