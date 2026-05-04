'use client';

import styles from './StrategicMoves.module.css';

export interface PhaseRailProps {
  /** Current phase index 0…7 (P0…P7). */
  current: number;
  totalPhases?: number;
}

/**
 * Shared P0–P7 dot rail for Strategic Moves surfaces (portfolio cards, detail, originate).
 * Styling lives in `StrategicMoves.module.css` (`.phaseRail`, `.phaseDot*`).
 */
export function PhaseRail({ current, totalPhases = 8 }: PhaseRailProps) {
  const safeCurrent = Math.min(Math.max(current, 0), Math.max(totalPhases - 1, 0));
  return (
    <div className={styles.phaseRail} role="list" aria-label="Move phases P0 through P7">
      {Array.from({ length: totalPhases }).map((_, index) => (
        <span
          key={`phase-dot-${index}`}
          className={`${styles.phaseDot} ${
            index < safeCurrent ? styles.phaseDotDone : index === safeCurrent ? styles.phaseDotCurrent : ''
          }`}
          title={`P${index}`}
          role="listitem"
        />
      ))}
    </div>
  );
}
