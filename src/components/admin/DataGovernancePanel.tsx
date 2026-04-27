// ADMIN14 — Data governance panel (Promotion Queue tab).
//
// Server component. Absorbs the substantive promotion-request workflow content
// from legacy /platform/admin/data-governance — pending / approved / rejected
// sections. Approve/Reject buttons are HARD-GATED.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  PromotionRequestRow,
  PromotionStatus,
} from '@/lib/admin/data-trust-page-view';

export interface DataGovernancePanelProps {
  requests: ReadonlyArray<PromotionRequestRow>;
}

const SECTION_ORDER: ReadonlyArray<{ status: PromotionStatus; label: string }> = [
  { status: 'pending', label: 'Pending' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
];

function statusPill(s: PromotionStatus) {
  switch (s) {
    case 'approved':
      return { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Approved' };
    case 'rejected':
      return { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Rejected' };
    default:
      return { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Pending' };
  }
}

function formatDate(iso: string): string {
  if (!iso || iso === '—') return '—';
  return iso.slice(0, 10);
}

export function DataGovernancePanel({ requests }: DataGovernancePanelProps) {
  return (
    <section
      data-data-governance-panel="true"
      aria-label="Promotion queue"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}cc`,
        }}
      >
        Engagement → master promotion requests. Approval and rejection are
        HARD-GATED until the audit event store lands in Wave 27.
      </p>

      {SECTION_ORDER.map(({ status, label }) => {
        const rows = requests.filter((r) => r.status === status);
        const pill = statusPill(status);
        return (
          <div key={status} data-promotion-section={status}>
            <header
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: SPACING.sm,
                marginBottom: SPACING.sm,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 18,
                  color: COLORS.ink,
                  fontWeight: 400,
                }}
              >
                {label}
              </h3>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}80`,
                }}
              >
                {rows.length}
              </span>
            </header>
            {rows.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}80`,
                  fontStyle: 'italic',
                }}
              >
                No requests in this state.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SPACING.sm,
                }}
              >
                {rows.map((r) => (
                  <li
                    key={r.id}
                    data-promotion-id={r.id}
                    style={{
                      background: COLORS.white,
                      border: `1px solid ${COLORS.ink}10`,
                      borderRadius: RADIUS.md,
                      padding: SPACING.md,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: SPACING.xs,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: SPACING.md,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.ink,
                        }}
                      >
                        {r.document}
                      </span>
                      <span
                        data-promotion-status={r.status}
                        style={{
                          padding: '2px 10px',
                          borderRadius: RADIUS.pill,
                          background: pill.bg,
                          color: pill.fg,
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {pill.label}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: `${COLORS.ink}99`,
                      }}
                    >
                      {r.engagement} · {r.org} · {r.category} ·{' '}
                      <span style={{ fontFamily: TYPOGRAPHY.mono }}>
                        {formatDate(r.requestedAt)}
                      </span>
                    </p>
                    {r.note ? (
                      <p
                        style={{
                          margin: 0,
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: `${COLORS.ink}cc`,
                          fontStyle: 'italic',
                        }}
                      >
                        {r.note}
                      </p>
                    ) : null}
                    {r.status === 'pending' ? (
                      <div
                        style={{
                          display: 'flex',
                          gap: SPACING.sm,
                          marginTop: SPACING.xs,
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          disabled
                          aria-disabled="true"
                          data-promotion-approve-button={r.id}
                          data-action-status="hard_gated"
                          title="Live approval available with audit event store in Wave 27"
                          style={{
                            padding: `${SPACING.xs} ${SPACING.md}`,
                            borderRadius: RADIUS.sm,
                            border: `1px solid ${COLORS.ink}20`,
                            background: COLORS.white,
                            color: `${COLORS.ink}80`,
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'not-allowed',
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled
                          aria-disabled="true"
                          data-promotion-reject-button={r.id}
                          data-action-status="hard_gated"
                          title="Live rejection available with audit event store in Wave 27"
                          style={{
                            padding: `${SPACING.xs} ${SPACING.md}`,
                            borderRadius: RADIUS.sm,
                            border: `1px solid ${COLORS.ink}20`,
                            background: COLORS.white,
                            color: `${COLORS.ink}80`,
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'not-allowed',
                          }}
                        >
                          Reject
                        </button>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: RADIUS.pill,
                            background: COLORS.amberSoft,
                            color: COLORS.amberInk,
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 11,
                            fontWeight: 600,
                            alignSelf: 'center',
                          }}
                        >
                          Available in pilot environment (Wave 27)
                        </span>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
