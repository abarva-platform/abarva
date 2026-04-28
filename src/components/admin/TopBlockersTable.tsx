import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { BlockerDetail } from '@/lib/admin/blocker-detail-view';

const SEVERITY_COLOR: Record<string, string> = {
  critical: COLORS.coralInk,
  high: COLORS.amberInk,
  medium: COLORS.amberInk,
  low: `${COLORS.ink}80`,
};

export interface TopBlockersTableProps {
  blockers: ReadonlyArray<BlockerDetail>;
}

export function TopBlockersTable({ blockers }: TopBlockersTableProps) {
  if (blockers.length === 0) {
    return (
      <section
        style={{
          background: COLORS.white,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.ink}10`,
          padding: SPACING.xl,
          fontFamily: TYPOGRAPHY.sans,
          color: `${COLORS.ink}aa`,
        }}
      >
        No top blockers — readiness is clear.
      </section>
    );
  }

  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-top-blockers="true"
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.lg,
        }}
      >
        Top blockers
      </h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <tbody>
          {blockers.map((b) => (
            <tr
              key={b.id}
              style={{
                borderTop: `1px solid ${COLORS.ink}10`,
              }}
            >
              <td
                style={{
                  padding: SPACING.md,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  color: SEVERITY_COLOR[b.severity] ?? COLORS.ink,
                  width: '120px',
                }}
              >
                {b.severity}
              </td>
              <td
                style={{
                  padding: SPACING.md,
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {b.title}
              </td>
              <td
                style={{
                  padding: SPACING.md,
                  fontSize: 13,
                  color: `${COLORS.ink}aa`,
                  width: '200px',
                }}
              >
                {b.impactedComponent}
              </td>
              <td
                style={{
                  padding: SPACING.md,
                  fontSize: 13,
                  color: `${COLORS.ink}aa`,
                  width: '200px',
                }}
              >
                {b.nextAction}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
