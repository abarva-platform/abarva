/**
 * DataTrustActionQueue · Block 2.3 (Setup Redesign Package PR B).
 *
 * Ranked next-loads. Each item: severity dot · segment name ·
 * consequence · Template ↓ · Upload →. Per
 * `DATA_BINDING_CATALOG.md` §2 Block 2.3.
 */

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { DataTrustActionQueueItem } from '@/lib/admin/data-trust-composer';

const SEVERITY_DOT = {
  high: COLORS.coralInk,
  medium: COLORS.amberInk,
  low: COLORS.mintInk,
};

export function DataTrustActionQueue({ items }: { items: DataTrustActionQueueItem[] }) {
  if (items.length === 0) {
    return (
      <section
        data-data-trust-block="action-queue"
        data-testid="data-trust-action-queue"
        data-empty="true"
        style={{
          background: COLORS.mintSoft,
          borderLeft: `4px solid ${COLORS.mintInk}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <p style={{ margin: 0, fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK }}>
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
          Next loads, ranked by impact
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: SHELL.INK_MUTED }}>
          ({items.length})
        </span>
      </header>
      <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            data-action-id={item.id}
            data-action-severity={item.severity}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              padding: `${SPACING.sm} 0`,
              borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              flexWrap: 'wrap',
            }}
          >
            <span
              aria-label={`severity-${item.severity}`}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: SEVERITY_DOT[item.severity],
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 14, fontWeight: 600, color: SHELL.INK }}>
              {item.segmentName}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK_SOFT, flex: 1 }}>
              · {item.consequence}
            </span>
            {item.templateHref ? (
              <a
                href={item.templateHref}
                download
                data-testid={`data-trust-template-${item.id}`}
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: SHELL.INK,
                  textDecoration: 'none',
                  border: `1px solid ${SHELL.INK}30`,
                  borderRadius: RADIUS.pill,
                  padding: `2px ${SPACING.sm}`,
                  background: SHELL.PAPER,
                  whiteSpace: 'nowrap',
                }}
              >
                Template ↓
              </a>
            ) : null}
            <Link
              href={item.uploadHref}
              data-testid={`data-trust-upload-${item.id}`}
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.navy,
                textDecoration: 'none',
                border: `1px solid ${COLORS.navy}55`,
                borderRadius: RADIUS.pill,
                padding: `2px ${SPACING.sm}`,
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
