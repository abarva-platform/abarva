import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { BuildWaveDetail } from '@/lib/admin/build-progress-page-view';

export interface BacklogPreviewProps {
  waves: ReadonlyArray<BuildWaveDetail>;
}

/**
 * ADMIN15 — Backlog tab.
 *
 * Renders the next 3 planned waves with their slice IDs. Pulls from the
 * build-waves.json manifest deterministically.
 */
export function BacklogPreview({ waves }: BacklogPreviewProps) {
  return (
    <section
      data-component="BacklogPreview"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Backlog · next planned waves
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}80`,
          }}
        >
          {waves.length} of 3
        </span>
      </header>
      {waves.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: `${COLORS.ink}80`,
            fontStyle: 'italic',
            fontFamily: TYPOGRAPHY.sans,
          }}
        >
          No planned waves currently in the manifest.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          {waves.map((w) => (
            <li
              key={w.id}
              data-backlog-wave={w.id}
              style={{
                background: COLORS.cream,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                fontFamily: TYPOGRAPHY.sans,
              }}
            >
              <header
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: SPACING.sm,
                  marginBottom: SPACING.sm,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: COLORS.navy,
                    }}
                  >
                    {w.id}
                  </span>
                  <h3
                    style={{
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 16,
                      fontWeight: 700,
                      margin: `${SPACING.xs} 0 0`,
                      color: COLORS.ink,
                    }}
                  >
                    {w.title}
                  </h3>
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: RADIUS.pill,
                    background: COLORS.skyPale,
                    color: COLORS.navy,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Planned
                </span>
              </header>
              {w.goal ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: `${COLORS.ink}cc`,
                    lineHeight: 1.5,
                  }}
                >
                  {w.goal}
                </p>
              ) : null}
              {w.plannedSliceIds.length > 0 ? (
                <ul
                  data-backlog-slices={w.id}
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: `${SPACING.sm} 0 0`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: SPACING.xs,
                  }}
                >
                  {w.plannedSliceIds.map((sid) => (
                    <li
                      key={sid}
                      data-backlog-slice={sid}
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: RADIUS.pill,
                        background: COLORS.white,
                        color: COLORS.ink,
                        border: `1px solid ${COLORS.ink}14`,
                      }}
                    >
                      {sid}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    margin: `${SPACING.sm} 0 0`,
                    fontSize: 11,
                    color: `${COLORS.ink}80`,
                    fontStyle: 'italic',
                  }}
                >
                  No slice IDs declared yet.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
