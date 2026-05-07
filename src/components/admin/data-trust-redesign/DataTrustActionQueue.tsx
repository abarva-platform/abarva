/**
 * DataTrustActionQueue · Block 2.3 (Setup Redesign Package PR B).
 *
 * Per `DATA_BINDING_CATALOG.md` §2 Block 2.3 + Setup canon refit.
 */

import Link from 'next/link';
import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type { DataTrustActionQueueItem } from '@/lib/admin/data-trust-composer';

const SEVERITY_DOT = {
  high: SETUP.coral,
  medium: SETUP.amber,
  low: SETUP.mint,
};

export function DataTrustActionQueue({ items }: { items: DataTrustActionQueueItem[] }) {
  if (items.length === 0) {
    return (
      <section
        data-data-trust-block="action-queue"
        data-testid="data-trust-action-queue"
        data-empty="true"
        style={{
          background: SETUP.mintSoft,
          borderLeft: `4px solid ${SETUP.mint}`,
          borderRadius: SETUP_RADIUS.lg,
          padding: '16px 20px',
        }}
      >
        <p style={{ ...SETUP_TYPE.bodySans, color: SETUP.ink, margin: 0 }}>
          Nothing pending — every segment is loaded or partially loaded.
        </p>
      </section>
    );
  }
  return (
    <section
      data-data-trust-block="action-queue"
      data-testid="data-trust-action-queue"
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
        <h2 style={SETUP_TYPE.cardH2}>Next loads, ranked by impact</h2>
        <span style={SETUP_TYPE.cardMeta}>({items.length})</span>
      </header>
      <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            data-action-id={item.id}
            data-action-severity={item.severity}
            style={{
              display: 'grid',
              gridTemplateColumns: '14px auto 1fr auto auto',
              alignItems: 'center',
              gap: 10,
              padding: '12px 0',
              borderTop: `1px solid ${SETUP.cardLine}`,
            }}
          >
            <span
              aria-label={`severity-${item.severity}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: SEVERITY_DOT[item.severity],
                justifySelf: 'start',
              }}
            />
            <span
              style={{ fontFamily: SETUP.sans, fontSize: 13.5, fontWeight: 600, color: SETUP.ink }}
            >
              {item.segmentName}
            </span>
            <span style={{ ...SETUP_TYPE.bodySans, color: SETUP.inkMuted }}>
              · {item.consequence}
            </span>
            {item.templateHref ? (
              <a
                href={item.templateHref}
                download
                data-testid={`data-trust-template-${item.id}`}
                style={{
                  fontFamily: SETUP.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  color: SETUP.ink,
                  textDecoration: 'none',
                  border: `1px solid ${SETUP.cardLineStrong}`,
                  borderRadius: SETUP_RADIUS.pill,
                  padding: '4px 12px',
                  background: SETUP.paperSoft,
                  whiteSpace: 'nowrap',
                }}
              >
                Template ↓
              </a>
            ) : (
              <span aria-hidden="true" />
            )}
            <Link
              href={item.uploadHref}
              data-testid={`data-trust-upload-${item.id}`}
              style={{
                fontFamily: SETUP.sans,
                fontSize: 11,
                fontWeight: 600,
                color: SETUP.ink,
                background: SETUP.cardWhite,
                textDecoration: 'none',
                border: `1px solid ${SETUP.ink}`,
                borderRadius: SETUP_RADIUS.pill,
                padding: '4px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              Upload →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
