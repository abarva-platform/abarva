import type { CSSProperties } from 'react';
import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';
import type { ValidationCommand, ValidationStatus } from '@/lib/build-progress/roadmap';

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
  padding: '13px 12px',
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: 'top',
};

function validationTone(status: ValidationStatus): 'low' | 'medium' | 'high' {
  if (status === 'passing') return 'low';
  if (status === 'failing' || status === 'blocked') return 'high';
  return 'medium';
}

function statusLabel(status: ValidationStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ValidationStatusPanel({ commands }: { commands: ValidationCommand[] }) {
  return (
    <section style={{ ...COMPONENTS.card, display: 'grid', gap: 14 }}>
      <div>
        <div style={TEXT.sectionLabel}>Validation Status</div>
        <h2 style={{ margin: 0, fontFamily: FONTS.serif, fontSize: 28, fontWeight: 500 }}>
          Commands that turn code complete into verified
        </h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
          <thead>
            <tr>
              <th style={thStyle}>Check</th>
              <th style={thStyle}>Command</th>
              <th style={thStyle}>Scope</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Latest note</th>
            </tr>
          </thead>
          <tbody>
            {commands.map((command) => (
              <tr key={command.id}>
                <td style={tdStyle}>
                  <div style={{ ...TEXT.body, fontWeight: 700 }}>{command.label}</div>
                </td>
                <td style={tdStyle}>
                  <code
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 11,
                      color: COLORS.textPrimary,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 6,
                      padding: '5px 7px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {command.command}
                  </code>
                </td>
                <td style={tdStyle}>{command.scope}</td>
                <td style={tdStyle}>
                  <span style={COMPONENTS.riskPill(validationTone(command.status))}>{statusLabel(command.status)}</span>
                </td>
                <td style={tdStyle}>{command.latestNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
