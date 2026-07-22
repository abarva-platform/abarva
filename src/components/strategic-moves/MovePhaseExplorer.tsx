"use client";

// MovePhaseExplorer — persistent left-side phase explorer for Moves surfaces.
// The Finder-style rail is now the only supported shell; the previous
// legacy rail was retired after P0-P5 live smoke proof.

import Link from "next/link";
import { useState, type ReactNode } from "react";
import styles from "./MovePhaseExplorer.module.css";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";

export interface MovePhaseExplorerProps {
  moveId: string;
  currentPhase: number;
  tallies: PhaseTallyRow[];
  /**
   * Phases that have an authoritative-but-not-yet-final AI draft pending
   * review (renders an amber dot next to the phase label).
   */
  draftPendingPhases?: ReadonlyArray<number>;
  /**
   * Phases that are currently gate-blocked, with the human-readable block
   * reason (renders an amber subtitle line under the phase label).
   */
  blockedPhases?: ReadonlyArray<{ phase: number; reason: string }>;
}

const WORKSPACE_GROUP_ITEMS = [
  { key: "files", label: "Files & Evidence" },
  { key: "intelligence", label: "Phase Intelligence" },
  { key: "approvals", label: "Approvals" },
] as const;

export function MovePhaseExplorer(props: MovePhaseExplorerProps) {
  return <MovePhaseExplorerFinderShell {...props} />;
}

// ---------------------------------------------------------------------------
// Finder shell.
// Grouped rail (Phases, then Workspace), collapse/expand to an icon-only
// rail, soft-blue selection tint, connector-line tree styling, amber
// draft-not-final dot, amber blocked-reason subtitle.
// ---------------------------------------------------------------------------

function MovePhaseExplorerFinderShell({
  moveId,
  currentPhase,
  tallies,
  draftPendingPhases,
  blockedPhases,
}: MovePhaseExplorerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const draftSet = new Set(draftPendingPhases ?? []);
  const blockedReasonByPhase = new Map(
    (blockedPhases ?? []).map((entry) => [entry.phase, entry.reason]),
  );

  const railClasses = [
    styles.finderShell,
    collapsed ? styles.finderShellCollapsed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={railClasses}
      aria-label={`Move journey: phase ${currentPhase} of ${tallies.length - 1}`}
      data-testid="move-phase-explorer-finder-shell"
    >
      <button
        type="button"
        className={styles.finderCollapseToggle}
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand phase rail" : "Collapse phase rail"}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? "»" : "«"}
      </button>

      <FinderGroup label="Phases" collapsed={collapsed}>
        {tallies.map((row) => {
          const isCurrent = row.state === "current";
          const isDone = row.state === "done";
          const hasDraft = draftSet.has(row.phase);
          const blockedReason = blockedReasonByPhase.get(row.phase);
          const isBlocked = Boolean(blockedReason);

          const badge = isDone ? "✓" : String(row.phase);
          const rowClasses = [
            styles.finderRow,
            isCurrent ? styles.finderRowActive : "",
          ]
            .filter(Boolean)
            .join(" ");

          const badgeClasses = [
            styles.finderBadge,
            isDone ? styles.finderBadgeDone : "",
          ]
            .filter(Boolean)
            .join(" ");

          const rowContent = (
            <>
              <span className={badgeClasses} aria-hidden>
                {badge}
              </span>
              {!collapsed && (
                <span className={styles.finderRowBody}>
                  <span className={styles.finderRowLabelLine}>
                    <span
                      className={[
                        styles.finderLabel,
                        isCurrent ? styles.finderLabelCurrent : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {row.label}
                    </span>
                    {hasDraft && (
                      <span
                        className={styles.finderDraftDot}
                        role="img"
                        aria-label="AI draft not yet final"
                        title="AI draft not yet final"
                      />
                    )}
                  </span>
                  {isBlocked && (
                    <span className={styles.finderBlockedSubtitle}>
                      {blockedReason}
                    </span>
                  )}
                </span>
              )}
              {!collapsed && (
                <span className={styles.finderTally}>
                  {row.total > 0 ? `${row.met}/${row.total}` : "—"}
                </span>
              )}
            </>
          );

          const title = collapsed
            ? `${row.label}${hasDraft ? " · AI draft not yet final" : ""}${
                isBlocked ? ` · Blocked: ${blockedReason}` : ""
              }`
            : undefined;

          return row.state === "done" ? (
            <Link
              key={row.phase}
              href={`/strategic-moves/${moveId}/phase/${row.phase}`}
              className={rowClasses}
              title={title}
            >
              {rowContent}
            </Link>
          ) : (
            <div key={row.phase} className={rowClasses} title={title}>
              {rowContent}
            </div>
          );
        })}
      </FinderGroup>

      <FinderGroup label="Workspace" collapsed={collapsed}>
        {WORKSPACE_GROUP_ITEMS.map((item) => (
          <div
            key={item.key}
            className={styles.finderRow}
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.finderBadge} aria-hidden>
              {item.label.charAt(0)}
            </span>
            {!collapsed && (
              <span className={styles.finderRowBody}>
                <span className={styles.finderRowLabelLine}>
                  <span className={styles.finderLabel}>{item.label}</span>
                </span>
              </span>
            )}
          </div>
        ))}
      </FinderGroup>

      {!collapsed && (
        <div
          className={styles.towerRow}
          aria-label="Hands off to Control Tower after P5"
        >
          <span aria-hidden>&rarr;</span> Tower
        </div>
      )}
    </aside>
  );
}

function FinderGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.finderGroup}>
      {!collapsed && <div className={styles.finderGroupLabel}>{label}</div>}
      <div className={styles.finderGroupRows}>{children}</div>
    </div>
  );
}
