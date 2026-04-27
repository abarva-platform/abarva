// ADMIN14 — Data quality scorecard panel.
//
// Server component. Absorbs the substantive 4-tenant × 4-pillar confidence
// grid from legacy /platform/admin/quality (974-line page). We render the
// deterministic per-tenant pillar scores; we do NOT reimplement the demo
// narrative copy.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  QualityScorecardRow,
  QualityPillarScore,
} from '@/lib/admin/data-trust-page-view';

export interface DataQualityPanelProps {
  rows: ReadonlyArray<QualityScorecardRow>;
}

const PILLAR_ORDER: ReadonlyArray<QualityPillarScore['pillar']> = [
  'data',
  'evidence',
  'intelligence',
  'knowledge',
];

function pillarLabel(p: QualityPillarScore['pillar']): string {
  switch (p) {
    case 'data':
      return 'Data';
    case 'evidence':
      return 'Evidence';
    case 'intelligence':
      return 'Intelligence';
    case 'knowledge':
      return 'Knowledge';
  }
}

function scoreCellColor(score: number) {
  if (score >= 75) return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
  if (score >= 60) return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: COLORS.coralSoft, fg: COLORS.coralInk };
}

export function DataQualityPanel({ rows }: DataQualityPanelProps) {
  return (
    <section
      data-data-quality-panel="true"
      aria-label="Data quality scorecard"
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
      <header>
        <h3
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            fontWeight: 400,
          }}
        >
          Quality Scorecard
        </h3>
        <p
          style={{
            margin: `${SPACING.xs} 0 0 0`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          Tenant × pillar confidence (data, evidence, intelligence, knowledge).
          Deterministic seed; no live mutation.
        </p>
      </header>
      <div
        style={{
          overflowX: 'auto',
        }}
      >
        <table
          data-quality-grid="true"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: SPACING.sm,
                  borderBottom: `1px solid ${COLORS.ink}10`,
                  fontWeight: 700,
                  color: `${COLORS.ink}80`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: 11,
                }}
              >
                Tenant
              </th>
              {PILLAR_ORDER.map((p) => (
                <th
                  key={p}
                  style={{
                    textAlign: 'left',
                    padding: SPACING.sm,
                    borderBottom: `1px solid ${COLORS.ink}10`,
                    fontWeight: 700,
                    color: `${COLORS.ink}80`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: 11,
                  }}
                >
                  {pillarLabel(p)}
                </th>
              ))}
              <th
                style={{
                  textAlign: 'left',
                  padding: SPACING.sm,
                  borderBottom: `1px solid ${COLORS.ink}10`,
                  fontWeight: 700,
                  color: `${COLORS.ink}80`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: 11,
                }}
              >
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.tenantKey} data-tenant-key={row.tenantKey}>
                <td
                  style={{
                    padding: SPACING.sm,
                    borderBottom: `1px solid ${COLORS.ink}05`,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {row.tenantLabel}
                </td>
                {PILLAR_ORDER.map((p) => {
                  const cell = row.pillars.find((x) => x.pillar === p);
                  const score = cell?.score ?? 0;
                  const tone = scoreCellColor(score);
                  return (
                    <td
                      key={p}
                      data-quality-cell={`${row.tenantKey}-${p}`}
                      style={{
                        padding: SPACING.sm,
                        borderBottom: `1px solid ${COLORS.ink}05`,
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: RADIUS.pill,
                          background: tone.bg,
                          color: tone.fg,
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {score}
                      </span>
                    </td>
                  );
                })}
                <td
                  data-quality-overall={row.tenantKey}
                  style={{
                    padding: SPACING.sm,
                    borderBottom: `1px solid ${COLORS.ink}05`,
                    fontWeight: 700,
                    fontFamily: TYPOGRAPHY.mono,
                    color: COLORS.ink,
                  }}
                >
                  {row.overall}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
