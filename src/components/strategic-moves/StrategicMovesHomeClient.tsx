'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import styles from './StrategicMoves.module.css';
import type { StrategicMovePortfolio } from '@/lib/programs/types.ui';
import type {
  StrategicMovesListView,
  StrategicMovesSort,
} from '@/lib/programs/strategic-moves-preferences';

interface Props {
  portfolio: StrategicMovePortfolio;
  initialListView: StrategicMovesListView;
  initialSort: StrategicMovesSort;
}

function moveValueScore(move: StrategicMovePortfolio['moves'][number]): number | null {
  if (move.valueAtStake.projected?.high !== undefined) return move.valueAtStake.projected.high;
  if (move.valueAtStake.verified?.amount !== undefined) return move.valueAtStake.verified.amount;
  return null;
}

function formatValueAtStake(amountUsd: number): string {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return '$—';
  if (amountUsd >= 1_000_000_000) return `$${(amountUsd / 1_000_000_000).toFixed(1)}B`;
  if (amountUsd >= 1_000_000) return `$${Math.round(amountUsd / 1_000_000)}M`;
  if (amountUsd >= 1_000) return `$${Math.round(amountUsd / 1_000)}K`;
  return `$${Math.round(amountUsd).toLocaleString()}`;
}

function phaseNumber(value: string): number {
  const match = value.match(/^P(\d+)/);
  return match ? Number(match[1]) : 0;
}

function statusRank(value: string): number {
  if (value === 'gate_blocked') return 0;
  if (value === 'awaiting_decision') return 1;
  if (value === 'idle') return 2;
  if (value === 'on_track') return 3;
  return 4;
}

export function StrategicMovesHomeClient({
  portfolio,
  initialListView,
  initialSort,
}: Props) {
  const [listView, setListView] = useState<StrategicMovesListView>(initialListView);
  const [sort, setSort] = useState<StrategicMovesSort>(initialSort);
  const [, startTransition] = useTransition();

  function persist(nextListView: StrategicMovesListView, nextSort: StrategicMovesSort) {
    startTransition(() => {
      void fetch('/api/v1/users/me/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategicMoves: { listView: nextListView, sort: nextSort } }),
      });
    });
  }

  const sortedMoves = useMemo(() => {
    const copy = [...portfolio.moves];
    if (sort === 'value') {
      copy.sort((a, b) => {
        const av = a.valueAtStake.projected?.high ?? 0;
        const bv = b.valueAtStake.projected?.high ?? 0;
        return bv - av;
      });
    } else if (sort === 'phase') {
      copy.sort((a, b) => phaseNumber(a.phaseLabel) - phaseNumber(b.phaseLabel));
    } else if (sort === 'status') {
      copy.sort((a, b) => statusRank(a.status.key) - statusRank(b.status.key));
    } else {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy;
  }, [portfolio.moves, sort]);

  const mapStats = useMemo(() => {
    const values = sortedMoves.map(moveValueScore).filter((v): v is number => v !== null);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    return {
      min,
      max,
      capturedCount: values.length,
    };
  }, [sortedMoves]);

  const totalCapturedValue = useMemo(
    () => sortedMoves.reduce((sum, move) => sum + (moveValueScore(move) ?? 0), 0),
    [sortedMoves],
  );

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>Strategic Moves</div>
          <h1 className={styles.title}>Portfolio command center</h1>
        </div>
        <Link className={styles.newMove} href="/strategic-moves/new">
          + New Move
        </Link>
      </div>

      <section className={styles.editorialRibbon}>
        <article className={styles.editorialMetric}>
          <div className={styles.ribbonValue}>{portfolio.counts.total}</div>
          <div className={styles.ribbonLabel}>Moves</div>
        </article>
        <article className={styles.editorialMetric}>
          <div className={styles.ribbonValue}>{portfolio.counts.needAttention}</div>
          <div className={styles.ribbonLabel}>Need Attention</div>
        </article>
        <article className={styles.editorialMetric}>
          <div className={styles.ribbonValue}>{portfolio.counts.onTrack}</div>
          <div className={styles.ribbonLabel}>On Track</div>
        </article>
        <article className={styles.editorialMetric}>
          <div className={styles.ribbonValue}>{formatValueAtStake(totalCapturedValue)}</div>
          <div className={styles.ribbonLabel}>At Stake</div>
        </article>
      </section>

      <section className={styles.attentionPanel}>
        <div className={styles.sectionTitle}>Need Attention</div>
        {portfolio.needAttentionMoves.length === 0 ? (
          <div className={styles.attentionEmpty}>
            No immediate gate blockers or pending decisions. Value captured for {mapStats.capturedCount} of {portfolio.counts.total} moves.
          </div>
        ) : (
          <div className={styles.rowList}>
            {portfolio.needAttentionMoves.map((row) => (
              <Link className={styles.attentionRow} key={row.id} href={`/strategic-moves/${row.id}`}>
                <span className={styles.attentionCode}>{row.displayCode}</span>
                <span>{row.statusText}</span>
                <span className={styles.attentionLink}>Review →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className={styles.toolbar}>
        <div className={styles.toggleGroup}>
          {(['scatter', 'cards', 'kanban'] as const).map((mode) => (
            <button
              key={mode}
              className={`${styles.toggleButton} ${listView === mode ? styles.toggleButtonActive : ''}`}
              onClick={() => {
                setListView(mode);
                persist(mode, sort);
              }}
              type="button"
            >
              {mode}
            </button>
          ))}
        </div>
        <div className={styles.toggleGroup}>
          {(['value', 'phase', 'status', 'name'] as const).map((candidate) => (
            <button
              key={candidate}
              className={`${styles.toggleButton} ${sort === candidate ? styles.toggleButtonActive : ''}`}
              onClick={() => {
                setSort(candidate);
                persist(listView, candidate);
              }}
              type="button"
            >
              {candidate}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.canvas}>
        {listView === 'cards' ? (
          <div className={styles.cards}>
            {sortedMoves.map((move) => (
              <Link className={styles.card} key={move.id} href={`/strategic-moves/${move.id}`}>
                <div className={styles.eyebrow}>
                  {move.tenant.name} · {move.archetype}
                </div>
                <div className={styles.cardTitle}>{move.name}</div>
                <div className={styles.metaRow}>
                  <span className={`${styles.chip} ${
                    move.statusColor === 'red' ? styles.chipRed :
                    move.statusColor === 'amber' ? styles.chipAmber :
                    move.statusColor === 'teal' ? styles.chipTeal :
                    styles.chipGreen
                  }`}>
                    {move.status.text}
                  </span>
                  <span className={styles.phaseTag}>{move.phaseLabel}</span>
                </div>
                <div className={styles.phaseRail}>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <span
                      key={`${move.id}-phase-${index}`}
                      className={`${styles.phaseDot} ${
                        index < move.currentPhase
                          ? styles.phaseDotDone
                          : index === move.currentPhase
                            ? styles.phaseDotCurrent
                            : ''
                      }`}
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {listView === 'kanban' ? (
          <div className={styles.kanban}>
            {Array.from({ length: 8 }).map((_, phase) => (
              <section className={styles.kanbanCol} key={`kanban-${phase}`}>
                <div className={styles.kanbanHead}>P{phase}</div>
                <div className={styles.rowList}>
                  {sortedMoves
                    .filter((move) => move.currentPhase === phase)
                    .map((move) => (
                      <Link className={`${styles.card} ${styles.kanbanCard}`} key={move.id} href={`/strategic-moves/${move.id}`}>
                        <div className={styles.eyebrow}>{move.displayCode}</div>
                        <div className={styles.cardTitle}>{move.name}</div>
                        <span className={`${styles.chip} ${
                          move.statusColor === 'red' ? styles.chipRed :
                          move.statusColor === 'amber' ? styles.chipAmber :
                          move.statusColor === 'teal' ? styles.chipTeal :
                          styles.chipGreen
                        }`}>
                          {move.status.text}
                        </span>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {listView === 'scatter' ? (
          <div className={styles.scatter}>
            {mapStats.capturedCount === 0 ? (
              <div className={styles.scatterNotice}>
                Value-at-stake has not been captured yet for this portfolio.
                Bubbles are pinned to the unknown-value lane until projected or verified values are entered.
              </div>
            ) : null}
            <div className={styles.scatterXAxis}>Phase progression →</div>
            <div className={styles.scatterYAxis}>Value at stake</div>
            {sortedMoves.map((move, index) => {
              const valueScore = moveValueScore(move);
              const valueKnown = valueScore !== null;
              const normalized =
                valueKnown && mapStats.max > mapStats.min
                  ? (valueScore - mapStats.min) / (mapStats.max - mapStats.min)
                  : valueKnown
                    ? 0.5
                    : 0;
              const bubbleSize = valueKnown ? Math.max(42, Math.min(92, 48 + normalized * 36)) : 52;
              const x = Math.min(92, 6 + move.currentPhase * 12);
              const unknownJitter = ((index % 3) - 1) * 2.6;
              const y = valueKnown ? Math.max(14, 82 - normalized * 68) : Math.max(72, 82 + unknownJitter);
              return (
                <Link
                  key={move.id}
                  className={`${styles.bubble} ${
                    move.statusColor === 'red' ? styles.bubbleRed :
                    move.statusColor === 'amber' ? styles.bubbleAmber :
                    move.statusColor === 'teal' ? styles.bubbleTeal :
                    valueKnown ? styles.bubbleGreen : styles.bubbleUnknown
                  }`}
                  href={`/strategic-moves/${move.id}`}
                  style={{
                    width: `${bubbleSize}px`,
                    height: `${bubbleSize}px`,
                    left: `calc(${x}% - ${bubbleSize / 2}px)`,
                    top: `calc(${y}% - ${bubbleSize / 2}px)`,
                    zIndex: `${10 + index}`,
                  }}
                  title={`${move.displayCode} · ${move.phaseLabel}`}
                >
                  {move.mapLabel}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
