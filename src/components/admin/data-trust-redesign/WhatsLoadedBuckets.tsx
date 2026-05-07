/**
 * WhatsLoadedBuckets · Block 2.2 (Setup Redesign Package PR B).
 *
 * 5 plain-language buckets per `DATA_BINDING_CATALOG.md` §2.2 (post
 * spec-drift entry: 5 not 7, matching wireframe). Each bucket shows
 * a green/amber/red dot, its name, segments backing it, and brief
 * status copy.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { BucketRow } from '@/lib/admin/setup-vocab';

const DOT: Record<BucketRow['health'], string> = {
  green: COLORS.mintInk,
  amber: COLORS.amberInk,
  red: COLORS.coralInk,
};

const STATUS_LABEL: Record<BucketRow['health'], string> = {
  green: 'loaded',
  amber: 'partial',
  red: 'empty',
};

export function WhatsLoadedBuckets({ buckets }: { buckets: BucketRow[] }) {
  return (
    <section
      data-data-trust-block="whats-loaded"
      data-testid="data-trust-whats-loaded"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
        <h2
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: SHELL.INK,
            fontWeight: 600,
          }}
        >
          What&apos;s loaded
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: SHELL.INK_MUTED }}>
          plain-language buckets
        </span>
      </header>
      <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {buckets.map((b) => (
          <li
            key={b.id}
            data-bucket-id={b.id}
            data-bucket-health={b.health}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: SPACING.sm,
              padding: `${SPACING.sm} 0`,
              borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              flexWrap: 'wrap',
            }}
          >
            <span
              aria-label={`bucket-${b.health}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: DOT[b.health],
                flexShrink: 0,
                position: 'relative',
                top: 1,
              }}
            />
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 14, fontWeight: 700, color: SHELL.INK }}>
              {b.label}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK_SOFT, flex: 1 }}>
              — {b.description}{' '}
              <span style={{ color: SHELL.INK_MUTED, fontSize: 12 }}>
                ({STATUS_LABEL[b.health]})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
