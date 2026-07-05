"use client";

import Link from "next/link";
import styles from "./StrategicMoves.module.css";
import type { StrategicMove } from "@/lib/programs/types.ui";
import {
  formatValueAtStake,
  isArchived,
  moveValue,
  relativeTime,
} from "./move-list-format";
import { conciseSponsorLabel } from "./sponsor-display";
import { demoSafeClientText } from "@/lib/client-config";

function statusDotClass(color: StrategicMove["statusColor"]): string {
  if (color === "red") return styles.legendRed;
  if (color === "amber") return styles.legendAmber;
  if (color === "teal") return styles.legendTeal;
  return styles.legendGreen;
}

interface Props {
  moves: ReadonlyArray<StrategicMove>;
  /** Epoch ms for relative "last activity" — injected so the table stays pure. */
  now: number;
  /** Manage mode: render leading checkboxes + select-all; hide the Open action. */
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  emptyLabel?: string;
}

export function MoveListTable({
  moves,
  now,
  selectable = false,
  selected,
  onToggle,
  onToggleAll,
  emptyLabel = "No moves in this filter.",
}: Props) {
  const allChecked =
    selectable && moves.length > 0 && moves.every((m) => selected?.has(m.id));

  return (
    <div className={styles.tbl} role="table" aria-label="Strategic moves">
      <div className={`${styles.tblRow} ${styles.tblHead}`} role="row">
        {selectable ? (
          <span className={styles.tblCheck} role="columnheader">
            <input
              type="checkbox"
              checked={Boolean(allChecked)}
              onChange={onToggleAll}
              aria-label="Select all visible moves"
            />
          </span>
        ) : null}
        <span
          className={`${styles.tblCol} ${styles.colMove}`}
          role="columnheader"
        >
          Move
        </span>
        <span
          className={`${styles.tblCol} ${styles.colPhase}`}
          role="columnheader"
        >
          Phase
        </span>
        <span
          className={`${styles.tblCol} ${styles.colStatus}`}
          role="columnheader"
        >
          Status
        </span>
        <span
          className={`${styles.tblCol} ${styles.colSponsor}`}
          role="columnheader"
        >
          Sponsor
        </span>
        <span
          className={`${styles.tblCol} ${styles.colValue}`}
          role="columnheader"
        >
          Value
        </span>
        <span
          className={`${styles.tblCol} ${styles.colActivity}`}
          role="columnheader"
        >
          Last activity
        </span>
        <span
          className={`${styles.tblCol} ${styles.colAction}`}
          role="columnheader"
          aria-label="Action"
        />
      </div>

      {moves.length === 0 ? (
        <div className={styles.tblEmpty}>{emptyLabel}</div>
      ) : (
        moves.map((move) => {
          const archived = isArchived(move);
          const checked = Boolean(selected?.has(move.id));
          const verified = move.valueAtStake.verified?.status === "tracked";
          const moveName = demoSafeClientText(move.name);
          const moveCode = demoSafeClientText(move.displayCode);
          const statusText = demoSafeClientText(move.status.text);
          const sponsorName = demoSafeClientText(conciseSponsorLabel(move.sponsor));
          const archiveReason = move.archiveReason
            ? demoSafeClientText(move.archiveReason)
            : "";
          return (
            <div
              key={move.id}
              className={`${styles.tblRow} ${checked ? styles.tblRowSelected : ""} ${archived ? styles.tblRowArchived : ""}`}
              role="row"
            >
              {selectable ? (
                <span className={styles.tblCheck} role="cell">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle?.(move.id)}
                    aria-label={`Select ${moveCode}`}
                  />
                </span>
              ) : null}

              <span
                className={`${styles.tblCol} ${styles.colMove}`}
                role="cell"
              >
                <Link
                  className={styles.tblMoveName}
                  href={`/strategic-moves/${move.id}`}
                  prefetch={false}
                >
                  {moveName}
                </Link>
                <span className={styles.tblMoveCode}>{moveCode}</span>
              </span>

              <span
                className={`${styles.tblCol} ${styles.colPhase}`}
                role="cell"
              >
                {move.phaseLabel}
              </span>

              <span
                className={`${styles.tblCol} ${styles.colStatus}`}
                role="cell"
              >
                <span className={styles.statusBadge}>
                  <i
                    className={`${styles.statusBadgeDot} ${statusDotClass(move.statusColor)}`}
                    aria-hidden
                  />
                  {archived ? `Archived${archiveReason ? ` · ${archiveReason}` : ""}` : statusText}
                </span>
              </span>

              <span
                className={`${styles.tblCol} ${styles.colSponsor}`}
                role="cell"
              >
                {sponsorName}
              </span>

              <span
                className={`${styles.tblCol} ${styles.colValue}`}
                role="cell"
              >
                {formatValueAtStake(moveValue(move))}{" "}
                <span className={styles.tblValTag}>
                  {verified ? "tracked" : "projected"}
                </span>
              </span>

              <span
                className={`${styles.tblCol} ${styles.colActivity}`}
                role="cell"
              >
                {relativeTime(move.updatedAt, now)}
              </span>

              <span
                className={`${styles.tblCol} ${styles.colAction}`}
                role="cell"
              >
                {!selectable ? (
                  <Link
                    className={styles.tblOpen}
                    href={`/strategic-moves/${move.id}`}
                    prefetch={false}
                  >
                    Open
                  </Link>
                ) : null}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
