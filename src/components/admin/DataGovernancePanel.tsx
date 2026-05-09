import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface GovernancePolicy {
  id: string;
  name: string;
  scope: string;
  status: 'enforced' | 'advisory' | 'inactive';
  lastAuditedAt?: string;
}

export interface DataGovernancePanelProps {
  policies: GovernancePolicy[];
}

const STATUS_STYLES: Record<GovernancePolicy['status'], { bg: string; color: string; label: string }> = {
  enforced: { bg: COLORS.mintSoft, color: COLORS.mintInk, label: 'Enforced' },
  advisory: { bg: COLORS.amberSoft, color: COLORS.amberInk, label: 'Advisory' },
  inactive: { bg: `${COLORS.ink}0d`, color: `${COLORS.ink}60`, label: 'Inactive' },
};

export function DataGovernancePanel({ policies }: DataGovernancePanelProps) {
  return (
    <div>
      <h3
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md}`,
        }}
      >
        Governance Policies
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {policies.map((policy) => {
          const ss = STATUS_STYLES[policy.status];
          return (
            <div
              key={policy.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${SPACING.sm} ${SPACING.md}`,
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: 6,
                background: COLORS.white,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORS.ink,
                  }}
                >
                  {policy.name}
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}60`,
                    marginTop: 2,
                  }}
                >
                  Scope: {policy.scope}
                  {policy.lastAuditedAt ? ` · Audited ${policy.lastAuditedAt}` : ''}
                </div>
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 3,
                  background: ss.bg,
                  color: ss.color,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {ss.label}
              </span>
            </div>
          );
        })}
        {policies.length === 0 ? (
          <div
            style={{
              padding: SPACING.xl,
              textAlign: 'center',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}60`,
            }}
          >
            No governance policies configured
          </div>
        ) : null}
      </div>
    </div>
  );
}
