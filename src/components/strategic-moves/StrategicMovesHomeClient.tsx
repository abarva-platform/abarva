'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { PhaseRail } from '@/components/strategic-moves/PhaseRail';
import styles from './StrategicMoves.module.css';
import type { StrategicMovePortfolio } from '@/lib/programs/types.ui';
import type {
  StrategicMovesListView,
  StrategicMovesSort,
} from '@/lib/programs/strategic-moves-preferences';

const PHASE_AXIS: Array<{ code: string; name: string }> = [
  { code: 'P0', name: 'Originate' },
  { code: 'P1', name: 'Charter' },
  { code: 'P2', name: 'Diagnose' },
  { code: 'P3', name: 'Solution' },
  { code: 'P4', name: 'Build' },
  { code: 'P5', name: 'Execute' },
  { code: 'P6', name: 'Verify' },
  { code: 'P7', name: 'Handoff' },
];

interface Props {
  portfolio: StrategicMovePortfolio;
  initialListView: StrategicMovesListView;
  initialSort: StrategicMovesSort;
}

function labelView(mode: StrategicMovesListView): string {
  if (mode === 'scatter') return 'Scatter';
  if (mode === 'cards') return 'Cards';
  return 'Kanban';
}

function labelSort(candidate: StrategicMovesSort): string {
  if (candidate === 'value') return 'Value';
  if (candidate === 'phase') return 'Phase';
  if (candidate === 'status') return 'Status';
  return 'Name';
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
      unknownCount: sortedMoves.length - values.length,
    };
  }, [sortedMoves]);

  const totalCapturedValue = useMemo(
    () => sortedMoves.reduce((sum, move) => sum + (moveValueScore(move) ?? 0), 0),
    [sortedMoves],
  );
  const phaseCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const move of sortedMoves) counts[move.currentPhase] = (counts[move.currentPhase] ?? 0) + 1;
    return counts;
  }, [sortedMoves]);

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

      <section className={styles.ribbonEditorial} aria-label="Portfolio summary">
        <div className={styles.ribbonSeg}>
          <span className={styles.ribbonSegNum}>{portfolio.counts.total}</span>
          <span className={styles.ribbonSegLbl}>Moves</span>
        </div>
        <div className={`${styles.ribbonSeg} ${portfolio.counts.needAttention > 0 ? styles.ribbonSegAttn : ''}`}>
          <span className={styles.ribbonSegNum}>{portfolio.counts.needAttention}</span>
          <span className={styles.ribbonSegLbl}>Need attention</span>
        </div>
        <div className={styles.ribbonSeg}>
          <span className={styles.ribbonSegNum}>{portfolio.counts.onTrack}</span>
          <span className={styles.ribbonSegLbl}>On track</span>
        </div>
        <div className={styles.ribbonSeg}>
          <span className={styles.ribbonSegNum}>{formatValueAtStake(totalCapturedValue)}</span>
          <span className={styles.ribbonSegLbl}>At stake</span>
        </div>
        <div className={styles.ribbonMeta}>Live portfolio</div>
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
              {labelView(mode)}
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
              {labelSort(candidate)}
            </button>
          ))}
        </div>
      </div>

      {listView === 'scatter' ? (
        <div className={styles.mapTitleBlock}>
          <h2 className={styles.mapTitle}>Portfolio map</h2>
          <div className={styles.mapSub}>
            Phase × value at stake. {portfolio.counts.total} move{portfolio.counts.total === 1 ? '' : 's'} in flight.
          </div>
        </div>
      ) : null}

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
                <PhaseRail current={move.currentPhase} />
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
                      <Link
                        className={`${styles.card} ${styles.kanbanCard} ${
                          move.statusColor === 'red' ? styles.cardRed :
                          move.statusColor === 'amber' ? styles.cardAmber :
                          move.statusColor === 'teal' ? styles.cardTeal :
                          styles.cardGreen
                        }`}
                        key={move.id}
                        href={`/strategic-moves/${move.id}`}
                      >
                        <div className={styles.eyebrow}>{move.displayCode}</div>
                        <div className={styles.cardTitle}>{move.name}</div>
                        <div className={styles.kanbanCardFoot}>
                          <span className={`${styles.chip} ${
                            move.statusColor === 'red' ? styles.chipRed :
                            move.statusColor === 'amber' ? styles.chipAmber :
                            move.statusColor === 'teal' ? styles.chipTeal :
                            styles.chipGreen
                          }`}>
                            {move.status.text}
                          </span>
                          <span className={styles.kanbanValue}>
                            {formatValueAtStake(move.valueAtStake.projected?.high ?? move.valueAtStake.verified?.amount ?? 0)}
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {listView === 'scatter' ? (
          <div className={styles.scatter}>
            <div className={styles.scatterLegend}>
              <span><i className={`${styles.legendDot} ${styles.legendRed}`} />Needs attention</span>
              <span><i className={`${styles.legendDot} ${styles.legendAmber}`} />Awaiting decision</span>
              <span><i className={`${styles.legendDot} ${styles.legendGreen}`} />On track</span>
              <span><i className={`${styles.legendDot} ${styles.legendTeal}`} />Healthy / early</span>
            </div>
            <div className={styles.scatterBands} aria-hidden>
              {PHASE_AXIS.map((phase) => (
                <div className={styles.scatterBand} key={`band-${phase.code}`} />
              ))}
            </div>
            <div className={styles.scatterGrid} aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((tick) => (
                <div className={styles.scatterGridLine} key={`grid-${tick}`} />
              ))}
            </div>
            {mapStats.capturedCount === 0 ? (
              <div className={styles.scatterNotice}>
                Value-at-stake has not been captured yet for this portfolio.
                Bubbles are pinned to the unknown-value lane until projected or verified values are entered.
              </div>
            ) : null}
            {mapStats.unknownCount > 0 ? (
              <div className={styles.scatterNoticeSecondary}>
                {mapStats.unknownCount} move{mapStats.unknownCount === 1 ? '' : 's'} currently missing projected or verified value.
              </div>
            ) : null}
            <div className={styles.scatterXAxis}>Phase progression →</div>
            <div className={styles.scatterYAxis}>Value at stake</div>
            <div className={styles.scatterYTicks} aria-hidden>
              <span>$50M</span>
              <span>$40M</span>
              <span>$30M</span>
              <span>$20M</span>
              <span>$10M</span>
              <span>$0M</span>
            </div>
            <div className={styles.scatterXTicks} aria-hidden>
              {PHASE_AXIS.map((phase) => (
                <div className={styles.scatterXTick} key={`phase-tick-${phase.code}`}>
                  <span className={styles.scatterPhaseCode}>{phase.code}</span>
                  <span className={styles.scatterPhaseName}>{phase.name}</span>
                </div>
              ))}
            </div>
            {sortedMoves.map((move, index) => {
              const phaseIndex = sortedMoves
                .slice(0, index)
                .filter((m) => m.currentPhase === move.currentPhase).length;
              const phaseCount = Math.max(1, phaseCounts[move.currentPhase] ?? 1);
              const valueScore = moveValueScore(move);
              const valueKnown = valueScore !== null;
              const normalized =
                valueKnown && mapStats.max > mapStats.min
                  ? (valueScore - mapStats.min) / (mapStats.max - mapStats.min)
                  : valueKnown
                    ? 0.5
                    : 0;
              const bubbleSize = valueKnown ? Math.max(42, Math.min(92, 48 + normalized * 36)) : 52;
              const xBase = 8 + move.currentPhase * 11.5;
              const xSpread = phaseCount > 1 ? ((phaseIndex / (phaseCount - 1)) - 0.5) * 6.4 : 0;
              const x = Math.min(94, Math.max(6, xBase + xSpread));
              const unknownBandRows = Math.max(1, Math.min(4, phaseCount));
              const unknownRow = phaseIndex % unknownBandRows;
              const unknownY = 84 - unknownRow * 5.3;
              const y = valueKnown ? Math.max(14, 82 - normalized * 68) : unknownY;
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
