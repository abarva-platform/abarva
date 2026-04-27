// ADMIN14 — Per-rung dataset list inside the Trust Ladder tab.
//
// Server component. Each dataset row is a Link to ?dataset=<id> which opens
// the DatasetDetailDrawer in the URL state. No client state, no hydration.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  DatasetSummary,
  TrustRungKey,
  TrustLadderRung,
} from '@/lib/admin/data-trust-page-view';

export interface RungDatasetListProps {
  ladder: ReadonlyArray<TrustLadderRung>;
  datasetsByRung: Readonly<Record<TrustRungKey, ReadonlyArray<DatasetSummary>>>;
  baseUrl: string;
  activeDatasetId?: string;
}

function approvalPill(state: DatasetSummary['approvalState']) {
  switch (state) {
    case 'approved':
      return { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Approved' };
    case 'requested':
      return { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Requested' };
    case 'revoked':
      return { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Revoked' };
    default:
      return { bg: `${COLORS.ink}10`, fg: `${COLORS.ink}99`, label: 'Unapproved' };
  }
}

function formatDate(iso: string): string {
  if (!iso || iso === '—') return '—';
  return iso.slice(0, 10);
}

export function RungDatasetList({
  ladder,
  datasetsByRung,
  baseUrl,
  activeDatasetId,
}: RungDatasetListProps) {
  return (
    <section
      data-rung-dataset-list="true"
      aria-label="Per-rung dataset list"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      {ladder.map((rung) => {
        const items = datasetsByRung[rung.id as TrustRungKey] ?? [];
        return (
          <div key={rung.id} data-rung-block={rung.id}>
            <header
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: SPACING.sm,
                gap: SPACING.md,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 18,
                    color: COLORS.ink,
                    fontWeight: 400,
                  }}
                >
                  {rung.label}{' '}
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: `${COLORS.ink}80`,
                      fontWeight: 500,
                    }}
                  >
                    ({items.length} of {rung.count})
                  </span>
                </h3>
                <p
                  style={{
                    margin: `${SPACING.xs} 0 0 0`,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}99`,
                  }}
                >
                  {rung.description}
                </p>
              </div>
            </header>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.xs,
              }}
            >
              {items.map((d) => {
                const pill = approvalPill(d.approvalState);
                const isActive = activeDatasetId === d.id;
                const href = `${baseUrl}?tab=trust_ladder&dataset=${d.id}`;
                return (
                  <li key={d.id}>
                    <Link
                      href={href}
                      data-dataset-id={d.id}
                      data-dataset-active={isActive ? 'true' : 'false'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACING.md,
                        padding: SPACING.sm,
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${isActive ? `${COLORS.navy}40` : `${COLORS.ink}0d`}`,
                        background: isActive ? COLORS.skyPale : COLORS.cream,
                        textDecoration: 'none',
                        color: COLORS.ink,
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {d.name}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          color: `${COLORS.ink}80`,
                        }}
                      >
                        {d.owner}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: `${COLORS.ink}80`,
                        }}
                      >
                        {formatDate(d.lastUpdated)}
                      </span>
                      <span
                        data-dataset-approval={d.approvalState}
                        style={{
                          padding: '2px 10px',
                          borderRadius: RADIUS.pill,
                          background: pill.bg,
                          color: pill.fg,
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pill.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {items.length === 0 ? (
                <li
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}80`,
                    fontStyle: 'italic',
                    padding: SPACING.sm,
                  }}
                >
                  No datasets at this rung yet.
                </li>
              ) : null}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
