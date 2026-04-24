import type { CSSProperties } from 'react';
import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';
import type { BuildRisk, BuildStatus, ExecutionSlice } from '@/lib/build-progress/roadmap';

const thStyle: CSSProperties = {
  ...TEXT.small,
  fontFamily: FONTS.mono,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '10px 12px',
  borderBottom: `1px solid ${COLORS.border}`,
  textAlign: 'left',
};

const tdStyle: CSSProperties = {
  ...TEXT.bodySecondary,
  padding: '14px 12px',
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: 'top',
};

function statusTone(status: BuildStatus): 'low' | 'medium' | 'high' {
  if (status === 'verified' || status === 'code_complete') return 'low';
  if (status === 'blocked') return 'high';
  return 'medium';
}

function riskTone(risk: BuildRisk): 'low' | 'medium' | 'high' {
  if (risk === 'low') return 'low';
  if (risk === 'critical' || risk === 'high') return 'high';
  return 'medium';
}

function label(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function SliceQueueTable({ slices }: { slices: ExecutionSlice[] }) {
  return (
    <section style={{ ...COMPONENTS.card, display: 'grid', gap: 14 }}>
      <div>
        <div style={TEXT.sectionLabel}>Execution Slice Queue</div>
        <h2 style={{ margin: 0, fontFamily: FONTS.serif, fontSize: 28, fontWeight: 500 }}>
          First ten controlled build slices
        </h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1120 }}>
          <thead>
            <tr>
              <th style={thStyle}>Slice</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Risk</th>
              <th style={thStyle}>Owner / agent recommendation</th>
              <th style={thStyle}>Dependencies</th>
              <th style={thStyle}>Acceptance</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((slice) => (
              <tr key={slice.id}>
                <td style={tdStyle}>
                  <div style={{ fontFamily: FONTS.mono, color: COLORS.teal, fontSize: 12 }}>{slice.id}</div>
                  <div style={{ ...TEXT.body, fontWeight: 700 }}>{slice.name}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontFamily: FONTS.mono, color: COLORS.textPrimary }}>{slice.category}</span>
                </td>
                <td style={tdStyle}>
                  <span style={COMPONENTS.riskPill(statusTone(slice.status))}>{label(slice.status)}</span>
                </td>
                <td style={tdStyle}>
                  <span style={COMPONENTS.riskPill(riskTone(slice.risk))}>{label(slice.risk)}</span>
                </td>
                <td style={tdStyle}>{slice.ownerRecommendation}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {slice.dependencies.map((dependency) => (
                      <span key={dependency}>- {dependency}</span>
                    ))}
                  </div>
                </td>
                <td style={tdStyle}>{slice.acceptanceSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
