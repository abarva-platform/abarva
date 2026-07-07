"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./StrategicMoves.module.css";
import type { StrategicMovePortfolio } from "@/lib/programs/types.ui";
import { MoveListTable } from "./MoveListTable";
import {
  MOVE_CHIPS,
  type MoveChipKey,
  chipCounts,
  filterByChip,
  isArchived,
} from "./move-list-format";

type FilterKey = MoveChipKey;

const ARCHIVE_REASONS: Array<{ value: string; label: string }> = [
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "duplicate", label: "Duplicate" },
  { value: "created_in_error", label: "Created in error" },
  { value: "replaced_by_another_move", label: "Replaced by another Move" },
  { value: "other", label: "Other" },
];

const IMPACT_CHECKLIST = [
  "Hidden from Active views",
  "Excluded from active recommendations",
  "Evidence, artifacts, and audit history retained",
  "Search and read models updated",
];

interface Props {
  portfolio: StrategicMovePortfolio;
  canManage: boolean;
}

export function ManageMovesClient({ portfolio, canManage }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterByChip(portfolio.moves, filter),
    [portfolio.moves, filter],
  );

  const counts = useMemo(() => chipCounts(portfolio.moves), [portfolio.moves]);

  const selectedMoves = useMemo(
    () => portfolio.moves.filter((m) => selected.has(m.id)),
    [portfolio.moves, selected],
  );
  const selectedArchivedCount = selectedMoves.filter(isArchived).length;
  const selectedActiveCount = selectedMoves.length - selectedArchivedCount;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (filtered.every((m) => prev.has(m.id)) && filtered.length > 0) {
        const next = new Set(prev);
        for (const m of filtered) next.delete(m.id);
        return next;
      }
      const next = new Set(prev);
      for (const m of filtered) next.add(m.id);
      return next;
    });
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  async function confirmArchive() {
    if (!reason || !acknowledged || selectedActiveCount === 0) return;
    setBusy(true);
    try {
      const moveIds = selectedMoves
        .filter((m) => !isArchived(m))
        .map((m) => m.id);
      const res = await fetch("/api/v1/programs/archive", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moveIds,
          reason,
          explanation: explanation.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        archived?: string[];
        failed?: Array<{ id: string; error: string }>;
      };
      if (!res.ok) {
        showToast("Archive failed. Please try again.");
        return;
      }
      const archivedN = body.archived?.length ?? 0;
      const failedN = body.failed?.length ?? 0;
      showToast(
        `Archived ${archivedN} move${archivedN === 1 ? "" : "s"}${failedN ? ` · ${failedN} failed` : ""}.`,
      );
      closeDrawer();
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function restoreSelected() {
    const moveIds = selectedMoves.filter(isArchived).map((m) => m.id);
    if (moveIds.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/v1/programs/archive/restore", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moveIds }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        restored?: string[];
        failed?: Array<{ id: string; error: string }>;
      };
      if (!res.ok) {
        showToast("Restore failed. Please try again.");
        return;
      }
      const restoredN = body.restored?.length ?? 0;
      const failedN = body.failed?.length ?? 0;
      showToast(
        `Restored ${restoredN} move${restoredN === 1 ? "" : "s"}${failedN ? ` · ${failedN} failed` : ""}.`,
      );
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function exportSelected() {
    const rows = selectedMoves.map((m) => ({
      id: m.id,
      displayCode: m.displayCode,
      name: m.name,
      tenant: m.tenant.name,
      archetype: m.archetype,
      phase: m.phaseLabel,
      status: m.status.text,
      lifecycleState: m.lifecycleState,
      archivedAt: m.archivedAt,
      archiveReason: m.archiveReason,
      valueProjectedHigh: m.valueAtStake.projected?.high ?? null,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strategic-moves-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setReason("");
    setExplanation("");
    setAcknowledged(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <Link className={styles.manageBack} href="/strategic-moves">
            ← Back to Moves
          </Link>
          <h1 className={styles.pageTitle}>Manage Moves</h1>
        </div>
      </div>

      <div
        className={styles.manageChips}
        role="tablist"
        aria-label="Filter moves"
      >
        {MOVE_CHIPS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`${styles.manageChip} ${filter === f.key ? styles.manageChipActive : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className={styles.manageChipCount}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {selected.size > 0 ? (
        <div
          className={styles.manageSelectionBar}
          role="region"
          aria-label="Selection actions"
        >
          <span className={styles.manageSelectionCount}>
            {selected.size} selected
          </span>
          <div className={styles.manageSelectionActions}>
            <button
              type="button"
              className={styles.manageActionPrimary}
              disabled={!canManage || selectedActiveCount === 0 || busy}
              onClick={() => setDrawerOpen(true)}
              title={
                !canManage
                  ? "Requires admin/maestro permission."
                  : selectedActiveCount === 0
                    ? "No active moves selected."
                    : undefined
              }
            >
              Archive selected
            </button>
            <button
              type="button"
              className={styles.manageActionGhost}
              disabled={!canManage || selectedArchivedCount === 0 || busy}
              onClick={restoreSelected}
              title={
                !canManage
                  ? "Requires admin/maestro permission."
                  : selectedArchivedCount === 0
                    ? "No archived moves selected."
                    : undefined
              }
            >
              Restore
            </button>
            <button
              type="button"
              className={styles.manageActionGhost}
              onClick={exportSelected}
              disabled={busy}
            >
              Export
            </button>
          </div>
        </div>
      ) : null}

      <MoveListTable
        moves={filtered}
        now={now}
        selectable
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />

      {drawerOpen ? (
        <>
          <div
            className={styles.manageDrawerScrim}
            onClick={busy ? undefined : closeDrawer}
            aria-hidden
          />
          <aside
            className={styles.manageDrawer}
            role="dialog"
            aria-label="Archive selected moves"
            aria-modal="true"
          >
            <h2 className={styles.manageDrawerTitle}>
              Archive {selectedActiveCount} move
              {selectedActiveCount === 1 ? "" : "s"}
            </h2>
            <p className={styles.manageDrawerSub}>
              Archiving is reversible. Moves are hidden from active views but
              all history is retained.
            </p>

            <label className={styles.manageField}>
              <span className={styles.manageFieldLabel}>Reason</span>
              <select
                className={styles.manageSelect}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select a reason…</option>
                {ARCHIVE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.manageField}>
              <span className={styles.manageFieldLabel}>
                Explanation (optional)
              </span>
              <textarea
                className={styles.manageTextarea}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
                placeholder="Add context for the audit trail…"
              />
            </label>

            <div className={styles.manageImpact}>
              <span className={styles.manageImpactTitle}>Impact summary</span>
              <ul className={styles.manageImpactList}>
                {IMPACT_CHECKLIST.map((item) => (
                  <li key={item}>
                    <span aria-hidden>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <label className={styles.manageAck}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>
                I acknowledge these moves will be archived and hidden from
                active views.
              </span>
            </label>

            <div className={styles.manageDrawerActions}>
              <button
                type="button"
                className={styles.manageActionGhost}
                onClick={closeDrawer}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.manageActionPrimary}
                disabled={
                  !reason || !acknowledged || selectedActiveCount === 0 || busy
                }
                onClick={confirmArchive}
              >
                {busy ? "Archiving…" : "Confirm archive"}
              </button>
            </div>
          </aside>
        </>
      ) : null}

      {toast ? (
        <div className={styles.manageToast} role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
