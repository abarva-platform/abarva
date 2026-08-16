"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import styles from "./StrategicMoves.module.css";
import type {
  StrategicMovePortfolio,
  StrategicMove,
} from "@/lib/programs/types.ui";
import type {
  StrategicMovesListView,
  StrategicMovesSort,
} from "@/lib/programs/strategic-moves-preferences";
import { SHELL } from "@/lib/shell/shell-tokens";
import { MoveListTable } from "./MoveListTable";
import {
  MOVE_CHIPS,
  type MoveChipKey,
  chipCounts,
  filterByChip,
  formatValueAtStake,
  moveValue,
  searchMoves,
  summaryStats,
} from "./move-list-format";
import { sponsorDisplayName } from "./sponsor-display";
import { demoSafeClientText } from "@/lib/client-config";

/* Scatter ("Map") view needs enough captured value data to be meaningful. */
const SCATTER_VALUE_COVERAGE_THRESHOLD = 0.3;

const PHASE_AXIS: Array<{ code: string; name: string }> = [
  { code: "P0", name: "Originate" },
  { code: "P1", name: "Charter" },
  { code: "P2", name: "Diagnose" },
  { code: "P3", name: "Design" },
  { code: "P4", name: "Roadmap" },
  { code: "P5", name: "Mobilize" },
];

const VIEW_OPTIONS: Array<{ value: StrategicMovesListView; label: string }> = [
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "kanban", label: "Kanban" },
  { value: "scatter", label: "Map" },
];

interface Props {
  portfolio: StrategicMovePortfolio;
  initialListView: StrategicMovesListView;
  initialSort: StrategicMovesSort;
  tenantName: string;
}

function moveValueScore(move: StrategicMove): number | null {
  if (move.valueAtStake.projected?.high !== undefined)
    return move.valueAtStake.projected.high;
  if (move.valueAtStake.verified?.amount !== undefined)
    return move.valueAtStake.verified.amount;
  return null;
}

function phaseNumber(value: string): number {
  const match = value.match(/^P(\d+)/);
  return match ? Number(match[1]) : 0;
}

function statusRank(value: string): number {
  if (value === "gate_blocked") return 0;
  if (value === "awaiting_decision") return 1;
  if (value === "idle") return 2;
  if (value === "on_track") return 3;
  return 4;
}

function movePhaseHref(move: StrategicMove): string {
  return `/strategic-moves/${move.id}/phase/${move.currentPhase ?? 0}`;
}

export function StrategicMovesHomeClient({
  portfolio,
  initialListView,
  initialSort,
  tenantName,
}: Props) {
  const [listView, setListView] =
    useState<StrategicMovesListView>(initialListView);
  // Sort is fixed to the persisted preference (value-desc by default); the
  // simplified landing exposes filtering via chips + search, not a sort menu.
  const [sort] = useState<StrategicMovesSort>(initialSort);
  const [chip, setChip] = useState<MoveChipKey>("all");
  const [query, setQuery] = useState("");
  // Seed 0 (SSR + first client render agree), set the real clock after mount —
  // avoids a hydration mismatch on the relative "last activity" labels.
  const [now, setNow] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setNow(Date.now());
  }, []);

  function persist(
    nextListView: StrategicMovesListView,
    nextSort: StrategicMovesSort,
  ) {
    startTransition(() => {
      void fetch("/api/v1/users/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategicMoves: { listView: nextListView, sort: nextSort },
        }),
      });
    });
  }

  const counts = useMemo(() => chipCounts(portfolio.moves), [portfolio.moves]);
  const stats = useMemo(() => summaryStats(portfolio.moves), [portfolio.moves]);

  // chip filter → search → sort. Active chips exclude archived; the Archived
  // chip shows only archived. Every view renders this same set.
  const visibleMoves = useMemo(() => {
    const filtered = searchMoves(filterByChip(portfolio.moves, chip), query);
    const copy = [...filtered];
    if (sort === "value") {
      copy.sort((a, b) => moveValue(b) - moveValue(a));
    } else if (sort === "phase") {
      copy.sort(
        (a, b) => phaseNumber(a.phaseLabel) - phaseNumber(b.phaseLabel),
      );
    } else if (sort === "status") {
      copy.sort((a, b) => statusRank(a.status.key) - statusRank(b.status.key));
    } else {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy;
  }, [portfolio.moves, chip, query, sort]);

  const mapStats = useMemo(() => {
    const values = visibleMoves
      .map(moveValueScore)
      .filter((v): v is number => v !== null);
    return {
      capturedCount: values.length,
      unknownCount: visibleMoves.length - values.length,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
  }, [visibleMoves]);

  const scatterAvailable =
    visibleMoves.length > 0 &&
    mapStats.capturedCount / visibleMoves.length >=
      SCATTER_VALUE_COVERAGE_THRESHOLD;

  useEffect(() => {
    if (!scatterAvailable && listView === "scatter") {
      setListView("list");
      persist("list", sort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scatterAvailable]);

  const phaseCounts = useMemo(() => {
    const c: Record<number, number> = {};
    for (const move of visibleMoves)
      c[move.currentPhase] = (c[move.currentPhase] ?? 0) + 1;
    return c;
  }, [visibleMoves]);

  if (portfolio.moves.length === 0) {
    return (
      <div className={styles.page}>
        <Header tenantName={tenantName} />
        <StrategicMovesEmptyState tenantName={tenantName} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header tenantName={tenantName} />

      <section className={styles.statCards} aria-label="Portfolio summary">
        <StatCard value={String(stats.active)} label="Active" />
        <StatCard
          value={String(stats.needAttention)}
          label="Need Attention"
          attn={stats.needAttention > 0}
        />
        <StatCard value={String(stats.onTrack)} label="On Track" />
        <StatCard
          value={formatValueAtStake(stats.valueAtStake)}
          label="At Stake"
        />
      </section>

      <div className={styles.controlsRow}>
        <div className={styles.chips} role="tablist" aria-label="Filter moves">
          {MOVE_CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={chip === c.key}
              className={`${styles.chip} ${chip === c.key ? styles.chipActive : ""}`}
              onClick={() => setChip(c.key)}
            >
              {c.label}
              <span className={styles.chipCount}>{counts[c.key]}</span>
            </button>
          ))}
        </div>

        <div className={styles.controlsRight}>
          <label className={styles.searchBox}>
            <span className={styles.searchIcon} aria-hidden>
              ⌕
            </span>
            <input
              className={styles.searchInput}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search moves…"
              aria-label="Search moves"
            />
          </label>

          <label className={styles.viewMenu}>
            <span className={styles.srOnly}>View</span>
            <select
              className={styles.viewSelect}
              value={listView}
              onChange={(e) => {
                const next = e.target.value as StrategicMovesListView;
                if (next === "scatter" && !scatterAvailable) return;
                setListView(next);
                persist(next, sort);
              }}
            >
              {VIEW_OPTIONS.map((v) => (
                <option
                  key={v.value}
                  value={v.value}
                  disabled={v.value === "scatter" && !scatterAvailable}
                >
                  View: {v.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={styles.openMapLink}
            onClick={() => {
              if (!scatterAvailable) return;
              setListView("scatter");
              persist("scatter", sort);
            }}
            disabled={!scatterAvailable}
            title={
              scatterAvailable
                ? undefined
                : "Value-at-stake not captured on enough moves yet."
            }
          >
            Open portfolio map ↗
          </button>
        </div>
      </div>

      <section className={styles.canvas}>
        {listView === "list" ? (
          <MoveListTable moves={visibleMoves} now={now} />
        ) : null}

        {listView === "cards" ? (
          <div className={styles.cards}>
            {visibleMoves.map((move) => (
              <MoveCard key={move.id} move={move} />
            ))}
          </div>
        ) : null}

        {listView === "kanban" ? (
          <div className={styles.kanban}>
            {Array.from({ length: PHASE_AXIS.length }).map((_, phase) => {
              const inPhase = visibleMoves.filter(
                (move) => move.currentPhase === phase,
              );
              const phaseLabel = PHASE_AXIS[phase]?.name ?? "";
              return (
                <section className={styles.kanbanCol} key={`kanban-${phase}`}>
                  <div className={styles.kanbanHead}>
                    P{phase}
                    <span className={styles.kanbanCount}>{inPhase.length}</span>
                    <span className={styles.kanbanHeadLabel}>{phaseLabel}</span>
                  </div>
                  <div className={styles.kanbanList}>
                    {inPhase.map((move) => (
                      <Link
                        className={`${styles.kanbanCard} ${
                          move.statusColor === "red"
                            ? styles.kanbanCardRed
                            : move.statusColor === "amber"
                              ? styles.kanbanCardAmber
                              : move.statusColor === "teal"
                                ? styles.kanbanCardTeal
                                : styles.kanbanCardGreen
                        }`}
                        key={move.id}
                        href={movePhaseHref(move)}
                        prefetch={false}
                      >
                        <div className={styles.kanbanId}>
                          {demoSafeClientText(move.displayCode)}
                        </div>
                        <div className={styles.kanbanName}>
                          {demoSafeClientText(move.name)}
                        </div>
                        <div className={styles.kanbanVal}>
                          {formatValueAtStake(moveValue(move))}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}

        {listView === "scatter" ? (
          <div className={styles.scatter}>
            <div className={styles.scatterBands} aria-hidden>
              {PHASE_AXIS.map((phase) => (
                <div
                  className={styles.scatterBand}
                  key={`band-${phase.code}`}
                />
              ))}
            </div>
            <div className={styles.scatterGrid} aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((tick) => (
                <div className={styles.scatterGridLine} key={`grid-${tick}`} />
              ))}
            </div>
            <div className={styles.scatterXAxis}>Phase progression →</div>
            <div className={styles.scatterYAxis}>Value at stake</div>
            <div className={styles.scatterXTicks} aria-hidden>
              {PHASE_AXIS.map((phase) => (
                <div className={styles.scatterXTick} key={`tick-${phase.code}`}>
                  <span className={styles.scatterPhaseCode}>{phase.code}</span>
                  <span className={styles.scatterPhaseName}>{phase.name}</span>
                </div>
              ))}
            </div>
            {visibleMoves.map((move, index) => {
              const phaseIndex = visibleMoves
                .slice(0, index)
                .filter((m) => m.currentPhase === move.currentPhase).length;
              const phaseCount = Math.max(
                1,
                phaseCounts[move.currentPhase] ?? 1,
              );
              const valueScore = moveValueScore(move);
              const valueKnown = valueScore !== null;
              const normalized =
                valueKnown && mapStats.max > mapStats.min
                  ? (valueScore - mapStats.min) / (mapStats.max - mapStats.min)
                  : valueKnown
                    ? 0.5
                    : 0;
              const bubbleSize = valueKnown
                ? Math.max(42, Math.min(92, 48 + normalized * 36))
                : 52;
              const phaseSlots = Math.max(1, PHASE_AXIS.length - 1);
              const xBase = 8 + move.currentPhase * (80 / phaseSlots);
              const xSpread =
                phaseCount > 1
                  ? (phaseIndex / (phaseCount - 1) - 0.5) * 6.4
                  : 0;
              const x = Math.min(94, Math.max(6, xBase + xSpread));
              const unknownBandRows = Math.max(1, Math.min(4, phaseCount));
              const unknownRow = phaseIndex % unknownBandRows;
              const y = valueKnown
                ? Math.max(14, 82 - normalized * 68)
                : 84 - unknownRow * 5.3;
              return (
                <Link
                  key={move.id}
                  className={`${styles.bubble} ${
                    move.statusColor === "red"
                      ? styles.bubbleRed
                      : move.statusColor === "amber"
                        ? styles.bubbleAmber
                        : move.statusColor === "teal"
                          ? styles.bubbleTeal
                          : valueKnown
                            ? styles.bubbleGreen
                            : styles.bubbleUnknown
                  }`}
                  href={movePhaseHref(move)}
                  prefetch={false}
                  style={{
                    width: `${bubbleSize}px`,
                    height: `${bubbleSize}px`,
                    left: `calc(${x}% - ${bubbleSize / 2}px)`,
                    top: `calc(${y}% - ${bubbleSize / 2}px)`,
                    zIndex: `${10 + index}`,
                  }}
                  title={`${demoSafeClientText(move.displayCode)} · ${move.phaseLabel}`}
                >
                  {demoSafeClientText(move.mapLabel)}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MoveCard({ move }: { move: StrategicMove }) {
  return (
    <Link
      className={`${styles.card} ${
        move.statusColor === "red"
          ? styles.cardRed
          : move.statusColor === "amber"
            ? styles.cardAmber
            : move.statusColor === "teal"
              ? styles.cardTeal
              : styles.cardGreen
      }`}
      href={movePhaseHref(move)}
      prefetch={false}
    >
      <div className={styles.cardStrip} aria-hidden />
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <div className={styles.cardTitle}>
            {demoSafeClientText(move.name)}
          </div>
          <div className={styles.cardId}>
            {demoSafeClientText(move.displayCode)} ·{" "}
            {demoSafeClientText(move.tenant.name)}
          </div>
        </div>
        <span className={styles.archetypeTag}>
          {demoSafeClientText(move.archetype)}
        </span>
      </div>
      <div
        className={`${styles.gateLine} ${
          move.statusColor === "red"
            ? styles.gateLineRed
            : move.statusColor === "amber"
              ? styles.gateLineAmber
              : move.statusColor === "teal"
                ? styles.gateLineTeal
                : styles.gateLineGreen
        }`}
      >
        <span className={styles.pulse} aria-hidden />
        <span className={styles.statusText}>
          {demoSafeClientText(move.status.text)}
        </span>
        <span className={styles.gateDetail}>
          · {demoSafeClientText(move.status.description)}
        </span>
      </div>
      <div className={styles.cardMeta}>
        <span>
          Sponsor:{" "}
          <strong>
            {demoSafeClientText(sponsorDisplayName(move.sponsor))}
          </strong>
        </span>
        <span>
          Value:{" "}
          <span className={styles.cardMetaVal}>
            {formatValueAtStake(moveValue(move))}{" "}
            {move.valueAtStake.verified?.status === "tracked"
              ? "tracked"
              : "projected"}
          </span>
        </span>
      </div>
    </Link>
  );
}

function Header({ tenantName }: { tenantName: string }) {
  return (
    <div className={styles.topbar}>
      <div>
        <p
          style={{
            margin: "0 0 6px",
            color: SHELL.INK_SOFT,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {tenantName}
        </p>
        <h1 className={styles.pageTitle}>Strategic Moves</h1>
        <p className={styles.pageSub}>
          Track active work, decisions, value, and approvals
        </p>
      </div>
      <div className={styles.topbarActions}>
        <Link className={styles.manageMoves} href="/strategic-moves/manage">
          Manage Moves
        </Link>
        <Link className={styles.newMove} href="/strategic-moves/new">
          + New Move
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  attn,
}: {
  value: string;
  label: string;
  attn?: boolean;
}) {
  return (
    <div className={`${styles.statCard} ${attn ? styles.statCardAttn : ""}`}>
      <span className={styles.statCardValue}>{value}</span>
      <span className={styles.statCardLabel}>{label}</span>
    </div>
  );
}

function StrategicMovesEmptyState({ tenantName }: { tenantName: string }) {
  return (
    <section
      aria-label="No Strategic Moves yet"
      style={{
        background: SHELL.PAPER_SOFT,
        borderTop: `1px solid ${SHELL.CARD_LINE}`,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        padding: "56px clamp(24px, 5vw, 72px)",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <p
          style={{
            margin: "0 0 8px",
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: SHELL.INK_SOFT,
            fontWeight: 700,
          }}
        >
          {tenantName} · No Moves yet
        </p>
        <h2
          style={{
            margin: "0 0 10px",
            fontFamily: SHELL.SERIF,
            fontSize: 32,
            lineHeight: 1.12,
            color: SHELL.INK,
            fontWeight: 700,
          }}
        >
          Strategic Moves appear here once a signal becomes an executive
          program.
        </h2>
        <p
          style={{
            margin: "0 0 22px",
            fontFamily: SHELL.SANS,
            fontSize: 14,
            lineHeight: 1.55,
            color: SHELL.INK_SOFT,
          }}
        >
          Use this portfolio to track phase gates, sponsor decisions, evidence,
          value at stake, and next actions across every Move in flight. Start a
          Move from a qualified Intelligence pressure or originate one directly
          when the sponsor already knows the business problem.
        </p>
        <Link
          href="/strategic-moves/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 40,
            padding: "0 18px",
            borderRadius: 8,
            background: SHELL.INK,
            color: SHELL.PAPER,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Create a Move
        </Link>
      </div>
    </section>
  );
}
