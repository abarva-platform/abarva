import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { BuildSliceRow } from '@/lib/admin/build-progress-page-view';

export interface SliceTableProps {
  slices: ReadonlyArray<BuildSliceRow>;
  selectedSliceId: string | null;
  buildSliceHref: (sliceId: string) => string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  merged: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
  code_complete: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
  in_progress: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  ready: { bg: COLORS.skyPale, fg: COLORS.navy },
  verified: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
};

/**
 * ADMIN15 — Full slice table for the Slices tab.
 *
 * Each row is a click-to-drill anchor that sets `?slice=<id>`.
 */
export function SliceTable({ slices, selectedSliceId, buildSliceHref }: SliceTableProps) {
  return (
    <section
      data-component="SliceTable"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
      }}
    >
      <header
        style={{
          padding: SPACING.md,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            margin: 0,
            color: COLORS.ink,
            fontWeight: 700,
          }}
        >
          Slices
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}80`,
          }}
        >
          {slices.length} total
        </span>
      </header>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <li
          data-slice-header="true"
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 130px 120px 100px',
            gap: SPACING.sm,
            padding: SPACING.sm,
            background: COLORS.cream,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: `${COLORS.ink}80`,
          }}
        >
          <span>Slice ID</span>
          <span>Title</span>
          <span>Wave</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Owner</span>
        </li>
        {slices.map((s) => {
          const isSelected = s.id === selectedSliceId;
          const sc = STATUS_COLORS[s.status] ?? { bg: COLORS.cream, fg: `${COLORS.ink}80` };
          return (
            <li
              key={s.id}
              data-slice-id={s.id}
              data-selected={isSelected ? 'true' : 'false'}
              style={{
                borderTop: `1px solid ${COLORS.ink}0a`,
                background: isSelected ? COLORS.skyPale : COLORS.white,
              }}
            >
              <a
                href={buildSliceHref(s.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr 130px 120px 100px',
                  gap: SPACING.sm,
                  padding: SPACING.sm,
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: COLORS.ink,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontWeight: 700,
                    color: COLORS.navy,
                  }}
                >
                  {s.id}
                </span>
                <span>{s.title}</span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}80`,
                  }}
                >
                  {s.waveId}
                </span>
                <span>
                  <span
                    data-slice-status={s.status}
                    style={{
                      padding: '2px 8px',
                      borderRadius: RADIUS.pill,
                      background: sc.bg,
                      color: sc.fg,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {s.status}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: `${COLORS.ink}80`,
                    textAlign: 'right',
                  }}
                >
                  {s.ownerAgent}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
