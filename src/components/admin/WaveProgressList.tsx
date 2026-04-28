import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { BuildWaveRow, BuildWaveStatus } from '@/lib/admin/build-progress-page-view';

export interface WaveProgressListProps {
  waves: ReadonlyArray<BuildWaveRow>;
  slicesShipped: number;
  slicesPlanned: number;
}

const STATUS_STYLES: Record<BuildWaveStatus, { bg: string; fg: string; label: string }> = {
  merged: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Merged' },
  in_progress: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'In progress' },
  planned: { bg: COLORS.skyPale, fg: COLORS.navy, label: 'Planned' },
  blocked: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Blocked' },
  deferred: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Deferred' },
};

export function WaveProgressList({ waves, slicesShipped, slicesPlanned }: WaveProgressListProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-wave-progress-list="true"
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: SPACING.lg,
          flexWrap: 'wrap',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Waves
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}80` }}>
          Slices shipped <strong style={{ color: COLORS.ink }}>{slicesShipped}</strong> ·
          {' '}planned <strong style={{ color: COLORS.ink }}>{slicesPlanned}</strong>
        </span>
      </header>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        {waves.map((wave, idx) => {
          const status = STATUS_STYLES[wave.status];
          return (
            <li
              key={wave.id}
              style={{
                padding: `${SPACING.md} 0`,
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                display: 'grid',
                gridTemplateColumns: '120px 1fr 80px 120px',
                gap: SPACING.md,
                alignItems: 'center',
                fontFamily: TYPOGRAPHY.sans,
              }}
              data-wave-id={wave.id}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: `${COLORS.ink}80`,
                }}
              >
                {wave.id}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{wave.title}</div>
                <div style={{ fontSize: 12, color: `${COLORS.ink}cc`, marginTop: 2 }}>{wave.note}</div>
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.ink,
                  textAlign: 'right',
                }}
              >
                {wave.percentComplete}%
              </div>
              <span
                style={{
                  justifySelf: 'end',
                  padding: '4px 12px',
                  borderRadius: RADIUS.pill,
                  background: status.bg,
                  color: status.fg,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
                data-status={wave.status}
              >
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
