'use client';

import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { TENANT_FIXTURE, TENANT_AGENT_VOICE } from '@/lib/setup/shell-setup-tenant-fixture';

const SUB_NAV_ITEMS = [
  { key: 'connectors', label: 'Connectors', href: '/admin' },
  { key: 'users', label: 'Users', href: '/admin/users' },
  { key: 'audit', label: 'Audit log', href: '/admin/audit' },
  { key: 'policies', label: 'Policies', href: '/admin/policies' },
  { key: 'tenant', label: 'Tenant', active: true, href: '/admin/tenant' },
  { key: 'architecture', label: 'Architecture', href: '/admin/architecture' },
];

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
  valueBold?: boolean;
  valueColor?: string;
}

function FieldRow({ label, value, isLast, valueBold, valueColor }: FieldRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '8px 0',
        borderBottom: isLast ? 'none' : '1px solid ' + SHELL.CARD_LINE_SOFT,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: valueColor ?? SHELL.INK,
          fontWeight: valueBold ? 600 : 500,
          lineHeight: 1.4,
          textAlign: 'right',
          marginLeft: 12,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function SetupTenantPage() {
  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Setup · Tenant · Apex Retail Group',
      }}
      middleStrip={<SubNavStrip items={SUB_NAV_ITEMS} />}
    >
      <AgentColumn
        agent={{ initials: 'St', name: 'Steward', role: 'Platform Governor' }}
        quote={TENANT_AGENT_VOICE.quote}
        agentContext={TENANT_AGENT_VOICE.agentContext}
        actions={TENANT_AGENT_VOICE.actions}
        surface="setup"
      />

      {/* Work pane */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
              lineHeight: 1,
            }}
          >
            Setup · Tenant
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Tenant Settings
          </h1>
        </div>

        {/* Two-column info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginTop: 24,
          }}
        >
          {/* Left column — Tenant identity */}
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: '1px solid ' + SHELL.CARD_LINE,
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 14,
                lineHeight: 1,
              }}
            >
              Tenant identity
            </div>

            <FieldRow
              label="Name"
              value={
                <span>
                  {TENANT_FIXTURE.name}{' '}
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 9,
                      color: SHELL.AMBER_DOT,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                    }}
                  >
                    🔒 Locked
                  </span>
                </span>
              }
              valueBold
            />
            <FieldRow
              label="Slug"
              value={
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 12,
                    color: SHELL.INK_SOFT,
                  }}
                >
                  {TENANT_FIXTURE.slug}
                </span>
              }
            />
            <FieldRow label="Industry" value={TENANT_FIXTURE.industry} />
            <FieldRow label="Region" value={TENANT_FIXTURE.region} />
            <FieldRow
              label="Tier"
              value={
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: SHELL.MINT_TEXT,
                    background: SHELL.MINT_BG,
                    borderRadius: 10,
                    padding: '3px 9px',
                    lineHeight: 1,
                  }}
                >
                  {TENANT_FIXTURE.tier}
                </span>
              }
            />
            <FieldRow label="Created" value={TENANT_FIXTURE.createdDate} isLast />
          </div>

          {/* Right column — Contract & access */}
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: '1px solid ' + SHELL.CARD_LINE,
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 14,
                lineHeight: 1,
              }}
            >
              Contract &amp; access
            </div>

            <FieldRow label="Contract start" value={TENANT_FIXTURE.contractStart} />
            <FieldRow
              label="Contract end"
              value={TENANT_FIXTURE.contractEnd}
              valueBold
              valueColor={SHELL.PEACH_TEXT}
            />
            <FieldRow label="Renewal owner" value={TENANT_FIXTURE.renewalOwner} />
            <FieldRow label="SSO" value={TENANT_FIXTURE.ssoProvider} />
            <FieldRow label="Data residency" value={TENANT_FIXTURE.dataResidency} />
            <FieldRow
              label="Programs"
              value={`${TENANT_FIXTURE.activePrograms} active / ${TENANT_FIXTURE.programCount} total`}
              isLast
            />
          </div>
        </div>

        {/* Status banner */}
        <div
          style={{
            background: SHELL.MINT_BG,
            border: '1px solid ' + SHELL.MINT_LINE,
            borderRadius: 8,
            padding: '12px 18px',
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              lineHeight: 1.4,
            }}
          >
            Tenant status:{' '}
          </span>
          <span
            style={{
              display: 'inline-block',
              fontFamily: SHELL.MONO,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: SHELL.MINT_TEXT,
              lineHeight: 1,
            }}
          >
            LOCKED
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              lineHeight: 1.4,
            }}
          >
            &nbsp; · &nbsp; All configuration changes require Steward approval
          </span>
        </div>
      </div>
    </AppShell>
  );
}
