import styles from './PhaseRail.module.css';
import type { StrategicMoveStatusColor } from '@/lib/programs/types.ui';

interface PhaseRailProps {
  current: number;
  totalPhases?: number;
  status?: StrategicMoveStatusColor;
  showLabels?: boolean;
  size?: 'default' | 'mini';
}

const PHASE_CODES = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];

export function PhaseRail({
  current,
  totalPhases = 8,
  status,
  showLabels = true,
  size = 'default',
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
        </div>
      ) : null}
    </div>
  );
}
