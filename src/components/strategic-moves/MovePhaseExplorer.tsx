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
//
// MOVES-UI-001 (Phase 1-2): a Finder-style visual rebuild lives behind the
// `moves_finder_shell_v1` flag (default off, tenant opt-in — see
// src/lib/features/registry.ts). When the flag is off this component must
// render EXACTLY what it rendered before that work started — the legacy
// tree below is untouched, byte-for-byte, on purpose. See
// docs/specs/programs/moves-phase-shell-ui-backend-reconciliation.md for
// which fields in the new rail are real vs. presentational-only today.

import Link from "next/link";
import { Component, useState, type ReactNode } from "react";
import styles from "./MovePhaseExplorer.module.css";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import { useFeature } from "@/lib/features/use-feature";

export interface MovePhaseExplorerProps {
  moveId: string;
  currentPhase: number;
  tallies: PhaseTallyRow[];
  /**
   * Phases that have an authoritative-but-not-yet-final AI draft pending
   * review (renders an amber dot next to the phase label). Optional and
   * additive — only consumed by the `moves_finder_shell_v1` rail; the
   * caller must already have this computed, nothing here fetches it.
   */
  draftPendingPhases?: ReadonlyArray<number>;
  /**
   * Phases that are currently gate-blocked, with the human-readable block
   * reason (renders an amber subtitle line under the phase label).
   * Optional and additive — same rule as `draftPendingPhases` above.
   */
  blockedPhases?: ReadonlyArray<{ phase: number; reason: string }>;
}

const WORKSPACE_GROUP_ITEMS = [
  { key: "files", label: "Files & Evidence" },
  { key: "intelligence", label: "Phase Intelligence" },
  { key: "approvals", label: "Approvals" },
] as const;

export function MovePhaseExplorer(props: MovePhaseExplorerProps) {
  // The flag check resolves the active tenant via useClientContext(), which
  // depends on Clerk's useUser(). Every real page renders under the app's
  // <ClerkProvider> (src/app/layout.tsx), so this always resolves in
  // production. Some call sites render this component in isolation (unit
  // tests, storybook-style harnesses) without that provider — rather than
  // hard-crash the whole rail in that situation, fall back to the legacy
  // rail, which has no such dependency. This keeps the flag-off guarantee
  // intact even when the flag itself can't be evaluated.
  return (
    <FeatureGateErrorBoundary fallback={<MovePhaseExplorerLegacy {...props} />}>
      <MovePhaseExplorerFlagGate {...props} />
    </FeatureGateErrorBoundary>
  );
}

function MovePhaseExplorerFlagGate(props: MovePhaseExplorerProps) {
  const finderShellEnabled = useFeature("moves_finder_shell_v1");
  if (finderShellEnabled) {
    return <MovePhaseExplorerFinderShell {...props} />;
  }
  return <MovePhaseExplorerLegacy {...props} />;
}

class FeatureGateErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Legacy rail — unchanged. This is the exact tree that rendered before
// MOVES-UI-001; do not "improve" it in place, add a new component above
// instead, so the flag-off path stays a byte-for-byte guarantee.
// ---------------------------------------------------------------------------

function MovePhaseExplorerLegacy({
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
        <div
          className={styles.towerRow}
          aria-label="Hands off to Control Tower after P5"
        >
          <span aria-hidden>&rarr;</span> Tower
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Finder shell — MOVES-UI-001 Phase 1-2, gated behind moves_finder_shell_v1.
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
