// ADMIN16 — Gate criteria matrix.
//
// Server component. Renders a per-gate (Demo/Pilot/Production) checklist
// with pass/partial/fail status pills and evidence basis.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  GateCriteriaGroup,
  GateCriterionStatus,
} from '@/lib/admin/production-readiness-page-view';

export interface GateCriteriaMatrixProps {
  groups: ReadonlyArray<GateCriteriaGroup>;
}

const STATUS_PALETTE: Record<GateCriterionStatus, { fg: string; bg: string; label: string }> = {
  pass: { fg: COLORS.mintInk, bg: COLORS.mintSoft, label: 'Pass' },
  partial: { fg: COLORS.amberInk, bg: COLORS.amberSoft, label: 'Partial' },
  fail: { fg: COLORS.coralInk, bg: COLORS.coralSoft, label: 'Fail' },
};

const TILE_STATUS_PALETTE: Record<string, { fg: string; bg: string }> = {
  ready: { fg: COLORS.mintInk, bg: COLORS.mintSoft },
  partial: { fg: COLORS.amberInk, bg: COLORS.amberSoft },
  blocked: { fg: COLORS.coralInk, bg: COLORS.coralSoft },
};

export function GateCriteriaMatrix({ groups }: GateCriteriaMatrixProps) {
  return (
    <section
      data-gate-criteria-matrix="true"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
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
        Gate criteria
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
        }}
      >
        {groups.map((group) => {
          const tilePalette =
            TILE_STATUS_PALETTE[group.status] ?? TILE_STATUS_PALETTE.partial;
          return (
            <article
              key={group.gateId}
              data-gate-id={group.gateId}
              data-gate-status={group.status}
              style={{
                borderTop: `1px solid ${COLORS.ink}10`,
                paddingTop: SPACING.lg,
              }}
            >
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  marginBottom: SPACING.md,
                }}
              >
                <h3
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.ink,
                    margin: 0,
                  }}
                >
                  {group.gateLabel}
                </h3>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: RADIUS.pill,
                    background: tilePalette.bg,
                    color: tilePalette.fg,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {group.status}
                </span>
              </header>
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
                {group.criteria.map((c) => {
                  const palette = STATUS_PALETTE[c.status];
                  return (
                    <li
                      key={c.id}
                      data-criterion-id={c.id}
                      data-criterion-status={c.status}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr 280px',
                        gap: SPACING.md,
                        alignItems: 'start',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        color: COLORS.ink,
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: RADIUS.pill,
                          background: palette.bg,
                          color: palette.fg,
                          fontSize: 11,
                          fontWeight: 600,
                          width: 'fit-content',
                        }}
                      >
                        {palette.label}
                      </span>
                      <span style={{ fontWeight: 600 }}>{c.label}</span>
                      <span style={{ color: `${COLORS.ink}99`, fontSize: 12 }}>
                        {c.evidenceBasis}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
