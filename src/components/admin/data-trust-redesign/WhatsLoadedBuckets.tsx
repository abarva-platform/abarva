/**
 * WhatsLoadedBuckets · Block 2.2 (Setup Redesign Package PR B).
 *
 * 5 plain-language buckets. Per `DATA_BINDING_CATALOG.md` §2.2 +
 * Setup canon refit.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type { BucketRow } from '@/lib/admin/setup-vocab';

const DOT: Record<BucketRow['health'], string> = {
  green: SETUP.mint,
  amber: SETUP.amber,
  red: SETUP.coral,
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
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h2 style={SETUP_TYPE.cardH2}>What&apos;s loaded</h2>
        <span style={SETUP_TYPE.cardMeta}>plain-language buckets</span>
      </header>
      <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {buckets.map((b) => (
          <li
            key={b.id}
            data-bucket-id={b.id}
            data-bucket-health={b.health}
            style={{
              display: 'grid',
              gridTemplateColumns: '14px auto 1fr auto',
              alignItems: 'baseline',
              gap: 10,
              padding: '10px 0',
              borderTop: `1px solid ${SETUP.cardLine}`,
            }}
          >
            <span
              aria-label={`bucket-${b.health}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: DOT[b.health],
                position: 'relative',
                top: 1,
                justifySelf: 'start',
              }}
            />
            <span
              style={{
                fontFamily: SETUP.sans,
                fontSize: 13.5,
                fontWeight: 700,
                color: SETUP.ink,
              }}
            >
              {b.label}
            </span>
            <span style={{ ...SETUP_TYPE.bodySans, color: SETUP.inkMuted }}>
              — {b.description}
            </span>
            <span
              style={{
                fontFamily: SETUP.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: DOT[b.health],
                whiteSpace: 'nowrap',
              }}
            >
              {STATUS_LABEL[b.health]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
