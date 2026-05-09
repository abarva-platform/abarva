import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface CoverageCell {
  agentId: string;
  domainId: string;
  level: 'full' | 'partial' | 'missing';
}

export interface ContextCoverageMatrixProps {
  agents: string[];
  domains: string[];
  cells: CoverageCell[];
}

const LEVEL_STYLES: Record<CoverageCell['level'], { bg: string; label: string }> = {
  full: { bg: COLORS.mintSoft, label: '✓' },
  partial: { bg: COLORS.amberSoft, label: '~' },
  missing: { bg: COLORS.coralSoft, label: '—' },
};

export function ContextCoverageMatrix({ agents, domains, cells }: ContextCoverageMatrixProps) {
  function getCellLevel(agentId: string, domainId: string): CoverageCell['level'] {
    return cells.find((c) => c.agentId === agentId && c.domainId === domainId)?.level ?? 'missing';
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th
              style={{
                padding: `${SPACING.sm} ${SPACING.md}`,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}80`,
                textAlign: 'left',
                borderBottom: `1px solid ${COLORS.ink}14`,
              }}
            >
              Context Domain
            </th>
            {agents.map((agent) => (
              <th
                key={agent}
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.navy,
                  textAlign: 'center',
                  borderBottom: `1px solid ${COLORS.ink}14`,
                  whiteSpace: 'nowrap',
                }}
              >
                {agent}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {domains.map((domain, i) => (
            <tr
              key={domain}
              style={{ background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03` }}
            >
              <td
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: COLORS.ink,
                  borderBottom: `1px solid ${COLORS.ink}0a`,
                }}
              >
                {domain}
              </td>
              {agents.map((agent) => {
                const level = getCellLevel(agent, domain);
                const s = LEVEL_STYLES[level];
                return (
                  <td
                    key={agent}
                    style={{
                      padding: `${SPACING.sm} ${SPACING.md}`,
                      textAlign: 'center',
                      borderBottom: `1px solid ${COLORS.ink}0a`,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 24,
                        height: 24,
                        lineHeight: '24px',
                        borderRadius: 4,
                        background: s.bg,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        color: COLORS.ink,
                        fontWeight: 600,
                      }}
                    >
                      {s.label}
                    </span>
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
