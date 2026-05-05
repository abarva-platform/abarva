import styles from './PhaseRail.module.css';
import type { StrategicMoveStatusColor } from '@/lib/programs/types.ui';
import { PHASE_CODES, TOTAL_PHASES } from '@/lib/programs/phase-labels';

interface PhaseRailProps {
  current: number;
  totalPhases?: number;
  status?: StrategicMoveStatusColor;
  showLabels?: boolean;
  size?: 'default' | 'mini';
  /**
   * Doctrine: after P5, Strategic Moves hands off to Tower. The rail
   * surfaces this as a "→ Tower" terminal indicator. It is not a phase.
   * Pass `false` to suppress on surfaces where the indicator would
   * mislead (e.g. mini rails inside cards).
   */
  showTowerIndicator?: boolean;
}

export function PhaseRail({
  current,
  totalPhases = TOTAL_PHASES,
  status,
  showLabels = true,
  size = 'default',
  showTowerIndicator = true,
}: PhaseRailProps) {
  const labels = PHASE_CODES.slice(0, totalPhases);
  return (
    <div
      className={`${styles.rail} ${size === 'mini' ? styles.railMini : ''}`}
      role="img"
      aria-label={`Phase ${current} of ${totalPhases - 1}`}
    >
      <div className={styles.track}>
        <div className={styles.line} />
        {labels.map((_, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const left = `${(index / (totalPhases - 1)) * 100}%`;
          const dotClasses = [
            styles.dot,
            isDone ? styles.dotDone : '',
            isCurrent ? styles.dotCurrent : '',
            isCurrent && status ? styles[`dotStatus_${status}`] : '',
          ]
            .filter(Boolean)
            .join(' ');
          return <div key={index} className={dotClasses} style={{ left }} />;
        })}
      </div>
      {showLabels ? (
        <div className={styles.labels}>
          {labels.map((label, index) => {
            const isCurrent = index === current;
            const labelClasses = [
              styles.label,
              isCurrent ? styles.labelCurrent : '',
              isCurrent && status ? styles[`labelStatus_${status}`] : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <span key={label} className={labelClasses}>
                {label}
              </span>
            );
          })}
          {showTowerIndicator && size !== 'mini' ? (
            <span
              className={styles.towerIndicator}
              aria-label="Hands off to Control Tower after P5"
            >
              <span aria-hidden>&rarr;</span> TOWER
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
