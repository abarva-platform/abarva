// AdminTenantTab — tenant configuration content surfaced as a tab inside
// /admin Overview. Per SETUP_AUDIT_2026-05-30_VERDICT §5.5, the standalone
// /admin/tenant route is demoted to this tab. Content reflects the locked
// per-tenant configuration fields previously surfaced by SetupTenantPage.
//
// The component receives a `TenantConfig` prop so the active tenant resolved
// in the page server component drives the displayed fields. Falls back to
// the Apex Retail fixture when no broker value is present, preserving the
// preceding demo posture without re-fetching from Supabase here.

import { SHELL } from '@/lib/shell/shell-tokens';
import { TENANT_FIXTURE, type TenantInfo } from '@/lib/setup/shell-setup-tenant-fixture';

export type TenantConfig = TenantInfo;

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

function TenantChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'mint' | 'peach' | 'ink';
}) {
  const styles =
    tone === 'mint'
      ? { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT }
      : tone === 'peach'
      ? { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT }
      : { bg: SHELL.PAPER_DEEP, text: SHELL.INK };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: styles.text,
        background: styles.bg,
        borderRadius: 999,
        padding: '5px 11px',
        lineHeight: 1,
      }}
    >
      <span style={{ fontFamily: SHELL.SANS, fontSize: 12, fontWeight: 700 }}>{label}</span>
      {value}
    </span>
  );
}

interface Props {
  config?: TenantConfig;
}

export function AdminTenantTab({ config }: Props) {
  const tenant = config ?? TENANT_FIXTURE;

  return (
    <div
      data-component="AdminTenantTab"
      style={{
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
          Admin · Tenant
        </div>
        <h2
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
          Tenant settings
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <TenantChip label="Tier" value={tenant.tier} tone="mint" />
        <TenantChip label="Renewal owner" value={tenant.renewalOwner} tone="ink" />
        <TenantChip label="Data residency" value={tenant.dataResidency} tone="peach" />
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
                {tenant.name}{' '}
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    color: SHELL.AMBER_DOT,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                  }}
                >
                  Locked
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
                {tenant.slug}
              </span>
            }
          />
          <FieldRow label="Industry" value={tenant.industry} />
          <FieldRow label="Region" value={tenant.region} />
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
                {tenant.tier}
              </span>
            }
          />
          <FieldRow label="Created" value={tenant.createdDate} isLast />
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

          <FieldRow label="Contract start" value={tenant.contractStart} />
          <FieldRow
            label="Contract end"
            value={tenant.contractEnd}
            valueBold
            valueColor={SHELL.PEACH_TEXT}
          />
          <FieldRow label="Renewal owner" value={tenant.renewalOwner} />
          <FieldRow label="SSO" value={tenant.ssoProvider} />
          <FieldRow label="Data residency" value={tenant.dataResidency} />
          <FieldRow
            label="Programs"
            value={`${tenant.activePrograms} active / ${tenant.programCount} total`}
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
  );
}
