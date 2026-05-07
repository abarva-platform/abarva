import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ReadinessTile } from '@/lib/admin/production-readiness-page-view';

const TILE_STATUS_COLOR: Record<string, { fg: string; bg: string }> = {
  ready: { fg: COLORS.mintInk, bg: COLORS.mintSoft },
  partial: { fg: COLORS.amberInk, bg: COLORS.amberSoft },
  blocked: { fg: COLORS.coralInk, bg: COLORS.coralSoft },
};

export interface DemoPilotProductionTilesProps {
  tiles: ReadonlyArray<ReadinessTile>;
}

export function DemoPilotProductionTiles({ tiles }: DemoPilotProductionTilesProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: SPACING.md,
      }}
      data-readiness-tiles="true"
    >
      {tiles.map((tile) => {
        const palette = TILE_STATUS_COLOR[tile.status] ?? TILE_STATUS_COLOR.partial;
        return (
          <article
            key={tile.id}
            style={{
              padding: SPACING.lg,
              background: COLORS.white,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.ink}10`,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.sm,
            }}
            data-tile-id={tile.id}
          >
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}80`,
              }}
            >
              {tile.label}
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 32,
                fontWeight: 700,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {tile.statusLabel}
            </div>
            <p
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: `${COLORS.ink}cc`,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {tile.body}
            </p>
            {tile.blockerLinks && tile.blockerLinks.length > 0 ? (
              <ul
                data-tile-blocker-links={tile.id}
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SPACING.xs,
                }}
              >
                {tile.blockerLinks.map((link) => (
                  <li
                    key={link.label}
                    style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.xs, flexWrap: 'wrap' }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 700,
                        color: COLORS.ink,
                      }}
                    >
                      {link.label}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}66` }}
                    >
                      —
                    </span>
                    <Link
                      href={link.href}
                      data-tile-blocker-link={link.label.toLowerCase()}
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.navy,
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {link.cta}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <span
              style={{
                marginTop: SPACING.sm,
                alignSelf: 'flex-start',
                padding: '4px 12px',
                borderRadius: RADIUS.pill,
                background: palette.bg,
                color: palette.fg,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {tile.status === 'ready' ? 'Go' : tile.status === 'partial' ? 'Blocked inputs' : 'Blocked'}
            </span>
          </article>
        );
      })}
    </div>
  );
}
