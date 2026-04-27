import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  BuildSliceRow,
  BuildWaveDetail,
  BuildWaveRow,
  BuildWaveStatus,
} from '@/lib/admin/build-progress-page-view';

export interface WaveTimelineProps {
  waves: ReadonlyArray<BuildWaveRow>;
  waveDetailMap: Readonly<Record<string, BuildWaveDetail>>;
  slicesByWave: Readonly<Record<string, ReadonlyArray<BuildSliceRow>>>;
  expandedWaveId: string | null;
  buildExpandHref: (waveId: string) => string;
  buildSliceHref: (sliceId: string) => string;
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

/**
 * ADMIN15 — Vertical wave timeline with expand-in-place slice list.
 *
 * Each wave row is a click-to-expand link (URL-driven `?wave=`). When
 * expanded, slice list renders below with PR numbers and merge dates from
 * the deterministic manifest.
 */
export function WaveTimeline({
  waves,
  waveDetailMap,
  slicesByWave,
  expandedWaveId,
  buildExpandHref,
  buildSliceHref,
  slicesShipped,
  slicesPlanned,
}: WaveTimelineProps) {
  return (
    <section
      data-component="WaveTimeline"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
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
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}80`,
          }}
        >
          Slices shipped <strong style={{ color: COLORS.ink }}>{slicesShipped}</strong> ·{' '}
          planned <strong style={{ color: COLORS.ink }}>{slicesPlanned}</strong>
        </span>
      </header>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {waves.map((wave, idx) => {
          const detail = waveDetailMap[wave.id];
          const isExpanded = expandedWaveId === wave.id;
          const slices = slicesByWave[wave.id] ?? [];
          const status = STATUS_STYLES[wave.status];
          return (
            <li
              key={wave.id}
              data-wave-id={wave.id}
              data-expanded={isExpanded ? 'true' : 'false'}
              style={{
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                padding: `${SPACING.md} 0`,
              }}
            >
              <a
                href={buildExpandHref(wave.id)}
                data-wave-toggle={wave.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 80px 120px',
                  gap: SPACING.md,
                  alignItems: 'center',
                  fontFamily: TYPOGRAPHY.sans,
                  textDecoration: 'none',
                  color: COLORS.ink,
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: `${COLORS.ink}80`,
                  }}
                >
                  {wave.id}
                </span>
                <span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>
                    {wave.title}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: `${COLORS.ink}cc`,
                      marginTop: 2,
                    }}
                  >
                    {wave.note}
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.ink,
                    textAlign: 'right',
                  }}
                >
                  {wave.percentComplete}%
                </span>
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
              </a>
              {isExpanded && detail ? (
                <div
                  data-wave-expanded={wave.id}
                  style={{
                    marginTop: SPACING.md,
                    padding: SPACING.md,
                    background: COLORS.cream,
                    borderRadius: RADIUS.md,
                    fontFamily: TYPOGRAPHY.sans,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: `${COLORS.ink}cc`,
                      fontStyle: 'italic',
                    }}
                  >
                    {detail.goal}
                  </p>
                  <dl
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: SPACING.sm,
                      margin: `${SPACING.md} 0`,
                      fontSize: 12,
                    }}
                  >
                    <Fact
                      label="Planned"
                      value={String(detail.plannedSliceIds.length)}
                    />
                    <Fact
                      label="Completed"
                      value={String(detail.completedSliceIds.length)}
                    />
                    <Fact
                      label="Merged PRs"
                      value={String(detail.mergedPrNumbers.length)}
                    />
                    <Fact label="Last update" value={detail.lastUpdated} />
                  </dl>
                  {slices.length > 0 ? (
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        background: COLORS.white,
                        borderRadius: RADIUS.md,
                        border: `1px solid ${COLORS.ink}10`,
                      }}
                    >
                      {slices.map((s, sidx) => (
                        <li
                          key={s.id}
                          data-wave-slice={s.id}
                          style={{
                            padding: SPACING.sm,
                            borderTop: sidx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr 100px',
                            gap: SPACING.sm,
                            alignItems: 'center',
                            fontSize: 12,
                          }}
                        >
                          <a
                            href={buildSliceHref(s.id)}
                            data-slice-link={s.id}
                            style={{
                              fontFamily: TYPOGRAPHY.mono,
                              fontWeight: 700,
                              color: COLORS.navy,
                              textDecoration: 'none',
                            }}
                          >
                            {s.id}
                          </a>
                          <span style={{ color: COLORS.ink }}>{s.title}</span>
                          <span
                            style={{
                              fontFamily: TYPOGRAPHY.mono,
                              fontSize: 11,
                              color: `${COLORS.ink}80`,
                              textAlign: 'right',
                            }}
                          >
                            {s.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: `${COLORS.ink}80`,
                        fontStyle: 'italic',
                      }}
                    >
                      No slice records linked to this wave in the manifest.
                    </p>
                  )}
                  {detail.mergedPrNumbers.length > 0 ? (
                    <p
                      style={{
                        marginTop: SPACING.sm,
                        marginBottom: 0,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: `${COLORS.ink}80`,
                      }}
                      data-wave-prs={wave.id}
                    >
                      Merged PRs:{' '}
                      {detail.mergedPrNumbers.map((n) => `#${n}`).join(', ')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}80`,
        }}
      >
        {label}
      </span>
      <span style={{ color: COLORS.ink, fontWeight: 700 }}>{value}</span>
    </span>
  );
}
