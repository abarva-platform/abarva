"use client";

// The action drawer — opened from any action card on the Evidence & Actions
// tab. Transcribed from `actionDrawer()` (design line ~1181).
//
// The current page has no governed Tower → Moves create path. `moduleHandoff`
// names a destination, while the existing decision route writes a signal to an
// existing program or Move. Keep creation disabled until a governed create path
// is wired and returns a confirmed result.

import { useEffect, useState } from "react";
import Link from "next/link";

import type { TowerActionView } from "@/lib/tower/command-center/types";
import { formatUsdM } from "@/lib/tower/command-center/format";

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

function dueRead(due: string | null): {
  label: string;
  value: string;
  gate: string | null;
} {
  const value = due?.trim() ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { label: "Due date", value, gate: null };
  }
  if (
    /\b(today|tomorrow|immediate(?:ly)?|\d+\s+(?:day|week|month)s?)\b/i.test(
      value,
    )
  ) {
    return { label: "Target window", value, gate: null };
  }
  return {
    label: "Due date",
    value: "No calendar date recorded",
    gate: value ? value.replace(/_/g, " ") : null,
  };
}

function evidenceRead(action: TowerActionView): string {
  if (action.evidenceRequirement) {
    return action.evidenceRequirement.replace(/_/g, " ");
  }
  return "No specific evidence requirement is recorded for this action.";
}

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
  const due = dueRead(action?.due ?? null);
  const sourceContractHref =
    action?.moduleHandoff?.trim().toLowerCase() === "source" &&
    action.handoffEntityId
      ? `/source?contractId=${encodeURIComponent(action.handoffEntityId)}&contractTab=Optimize`
      : null;

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
            {sourceContractHref ? (
              <Link
                className={cx(styles.btn, styles.sourceLink)}
                href={sourceContractHref}
              >
                View in Source
              </Link>
            ) : null}
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
                label={due.label}
                value={due.value}
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
                label="Linked program ID"
                value={action.linkedProgram ?? "No program linked"}
                small
              />
              <DrawerStat label="Owner" value={action.ownerRole} small />
              <DrawerStat
                label={action.moduleHandoff?.toLowerCase() === "source" ? "Potential annual saving" : "Projected yearly benefit affected"}
                value={action.amountExposedUsd === null ? "Not loaded" : formatUsdM(action.amountExposedUsd)}
                small
              />
              {action.handoffEntityId ? (
                <DrawerStat
                  label="Linked object"
                  value={action.handoffEntityId}
                  small
                />
              ) : null}
            </div>

            <DrawerSection>Why now</DrawerSection>
            {action.moduleHandoff?.toLowerCase() === "source" ? (
              <p className={cx(styles.recBox, styles.muted)}>
                This is a possible yearly saving, not money already saved. Finance confirmation is still required.
              </p>
            ) : null}
            <p className={cx(styles.recBox, styles.muted)}>{action.why}</p>

            {due.gate ? (
              <>
                <DrawerSection>Required proof gate</DrawerSection>
                <p className={styles.recBox}>{due.gate}</p>
              </>
            ) : null}

            <DrawerSection>Evidence needed</DrawerSection>
            <p className={styles.recBox}>{evidenceRead(action)}</p>
            {action.expectedSourceSystem ? (
              <p className={cx(styles.recBox, styles.muted)}>
                Expected source: {action.expectedSourceSystem}
              </p>
            ) : null}
            {action.evidencePackageId ? (
              <p className={cx(styles.recBox, styles.muted)}>
                Evidence package: {action.evidencePackageId}
              </p>
            ) : null}

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
                    confirmation for work that did not happen. Ask the named
                    owner to record the evidence request in the owning workflow.
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
