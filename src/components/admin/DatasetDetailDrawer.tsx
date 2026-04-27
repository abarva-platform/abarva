// ADMIN14 — Dataset detail drawer.
//
// Server component. URL-state driven (?dataset=<id>). The "Approve dataset"
// button is HARD-GATED — disabled with an inline reason chip, no live writes.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { DatasetDetail } from '@/lib/admin/data-trust-page-view';

export interface DatasetDetailDrawerProps {
  dataset: DatasetDetail;
  closeHref: string;
}

function formatDate(iso: string): string {
  if (!iso || iso === '—') return '—';
  return iso.slice(0, 10);
}

export function DatasetDetailDrawer({ dataset, closeHref }: DatasetDetailDrawerProps) {
  return (
    <aside
      data-dataset-detail-drawer="true"
      data-dataset-id={dataset.id}
      aria-label={`Dataset detail · ${dataset.name}`}
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: SPACING.md,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.navy,
            }}
          >
            Dataset detail · {dataset.rung}
          </p>
          <h2
            style={{
              margin: `${SPACING.xs} 0 0 0`,
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: COLORS.ink,
              fontWeight: 400,
            }}
          >
            {dataset.name}
          </h2>
        </div>
        <Link
          href={closeHref}
          data-dataset-drawer-close="true"
          aria-label="Close dataset detail"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.navy,
            textDecoration: 'none',
            border: `1px solid ${COLORS.navy}40`,
            borderRadius: RADIUS.sm,
            padding: `${SPACING.xs} ${SPACING.sm}`,
          }}
        >
          Close
        </Link>
      </header>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          rowGap: SPACING.xs,
          columnGap: SPACING.md,
          margin: 0,
        }}
      >
        <dt
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}80`,
          }}
        >
          Owner
        </dt>
        <dd
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
          }}
        >
          {dataset.owner}
        </dd>
        <dt
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}80`,
          }}
        >
          Segment
        </dt>
        <dd
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
          }}
        >
          {dataset.segment}
        </dd>
        <dt
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}80`,
          }}
        >
          Last updated
        </dt>
        <dd
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 13,
            color: COLORS.ink,
          }}
        >
          {formatDate(dataset.lastUpdated)}
        </dd>
        <dt
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}80`,
          }}
        >
          Evidence-usable
        </dt>
        <dd
          data-dataset-evidence-usable={dataset.evidenceUsable ? 'true' : 'false'}
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
          }}
        >
          {dataset.evidenceUsable ? 'Yes — cited in editorial' : 'No — not yet usable'}
        </dd>
        <dt
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}80`,
          }}
        >
          Approval owner
        </dt>
        <dd
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
          }}
        >
          {dataset.approvalOwner}
        </dd>
      </dl>

      <div>
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}80`,
          }}
        >
          Provenance
        </p>
        <ol
          data-dataset-provenance="true"
          style={{
            margin: `${SPACING.xs} 0 0 0`,
            paddingLeft: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
          }}
        >
          {dataset.provenance.map((p, idx) => (
            <li key={idx}>
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}80` }}>
                {formatDate(p.at)}
              </span>{' '}
              · {p.label}
            </li>
          ))}
        </ol>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}99`,
          fontStyle: 'italic',
        }}
      >
        {dataset.notes}
      </p>

      <div
        style={{
          display: 'flex',
          gap: SPACING.sm,
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingTop: SPACING.sm,
          borderTop: `1px solid ${COLORS.ink}10`,
        }}
      >
        <button
          type="button"
          disabled
          aria-disabled="true"
          data-dataset-approve-button="true"
          data-action-status="hard_gated"
          title="Live approval available with audit event store in Wave 27"
          style={{
            padding: `${SPACING.xs} ${SPACING.md}`,
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.ink}20`,
            background: COLORS.white,
            color: `${COLORS.ink}80`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          Approve dataset
        </button>
        <span
          data-dataset-approve-reason="true"
          style={{
            padding: '2px 10px',
            borderRadius: RADIUS.pill,
            background: COLORS.amberSoft,
            color: COLORS.amberInk,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Live approval available with audit event store in Wave 27
        </span>
      </div>
    </aside>
  );
}
