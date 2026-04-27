import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ConnectorReadiness } from '@/lib/admin/connectors-readiness-view';
import type { ConnectorDetail } from '@/lib/admin/connectors-page-view';

export interface RequirementsMatrixProps {
  connectors: ReadonlyArray<ConnectorReadiness>;
  detailMap: Readonly<Record<string, ConnectorDetail>>;
}

/**
 * ADMIN13 — Requirements matrix.
 *
 * Surface × connector matrix. Each cell renders one of:
 *   - "Required" (mint pill)
 *   - "Optional" (amber pill)
 *   - blank
 */
export function RequirementsMatrix({ connectors, detailMap }: RequirementsMatrixProps) {
  // Build the union of surfaces across all connectors.
  const surfaceSet = new Set<string>();
  for (const c of connectors) {
    const detail = detailMap[c.id];
    if (!detail) continue;
    for (const r of detail.requirements) surfaceSet.add(r.surface);
  }
  const surfaces = Array.from(surfaceSet).sort();

  if (surfaces.length === 0) {
    return (
      <div
        data-component="RequirementsMatrix"
        data-empty="true"
        style={{
          padding: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}99`,
        }}
      >
        No surface requirements defined for this tenant.
      </div>
    );
  }

  return (
    <div
      data-component="RequirementsMatrix"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.lg,
        overflowX: 'auto',
      }}
    >
      <table
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
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}99`,
                borderBottom: `1px solid ${COLORS.ink}14`,
              }}
            >
              Surface
            </th>
            {connectors.map((c) => (
              <th
                key={c.id}
                style={{
                  textAlign: 'center',
                  padding: SPACING.sm,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: `${COLORS.ink}99`,
                  borderBottom: `1px solid ${COLORS.ink}14`,
                  whiteSpace: 'nowrap',
                }}
                data-connector-id={c.id}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {surfaces.map((surface, sIdx) => (
            <tr key={surface} data-surface={surface}>
              <td
                style={{
                  padding: SPACING.sm,
                  fontWeight: 600,
                  color: COLORS.ink,
                  borderBottom:
                    sIdx === surfaces.length - 1 ? 'none' : `1px solid ${COLORS.ink}0a`,
                  whiteSpace: 'nowrap',
                }}
              >
                {surface}
              </td>
              {connectors.map((c) => {
                const detail = detailMap[c.id];
                const req = detail?.requirements.find((r) => r.surface === surface);
                const cellState = !req ? 'none' : req.required ? 'required' : 'optional';
                return (
                  <td
                    key={`${surface}:${c.id}`}
                    style={{
                      padding: SPACING.sm,
                      textAlign: 'center',
                      borderBottom:
                        sIdx === surfaces.length - 1 ? 'none' : `1px solid ${COLORS.ink}0a`,
                    }}
                    data-cell-state={cellState}
                    data-connector-id={c.id}
                  >
                    {cellState === 'required' ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: RADIUS.pill,
                          background: COLORS.mintSoft,
                          color: COLORS.mintInk,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}
                      >
                        Required
                      </span>
                    ) : cellState === 'optional' ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: RADIUS.pill,
                          background: COLORS.amberSoft,
                          color: COLORS.amberInk,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}
                      >
                        Optional
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 2,
                          background: `${COLORS.ink}33`,
                          borderRadius: 1,
                        }}
                        aria-label="Not required"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
