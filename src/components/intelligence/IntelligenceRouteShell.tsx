import React from 'react';

/** Data tier descriptor for the orientation strip caveat. */
export type TenantDataTier = 'rich' | 'thin' | 'shell_only';

interface IntelligenceRouteShellProps {
  children: React.ReactNode;
  tenantName?: string;
  pageMode?: 'index' | 'pattern_detail';
  /** Override the deterministic caveat text. Defaults to tier-appropriate copy. */
  caveat?: string;
  /**
   * Tenant data tier — drives the low-context disclosure.
   * Thin/shell_only tenants receive an additional disclosure per the blueprint.
   * All tenants currently show deterministic-only data (Wave 2 seed).
   */
  dataTier?: TenantDataTier;
}

const TIER_CAVEAT: Record<TenantDataTier, string> = {
  rich:
    'Deterministic seed — not live signal detection. Patterns are fixed until live ingestion is wired.',
  thin:
    'Deterministic seed — not tenant-specific. All tenants see the same seed patterns. Live tenant-specific patterns require live signal ingestion.',
  shell_only:
    'Deterministic seed — not tenant-specific. All tenants see the same seed patterns. Live tenant-specific patterns require live signal ingestion.',
};

export function IntelligenceRouteShell({
  children,
  tenantName = 'Apex Retail',
  pageMode = 'index',
  caveat,
  dataTier = 'thin',
}: IntelligenceRouteShellProps) {
  const resolvedCaveat = caveat ?? TIER_CAVEAT[dataTier];

  return (
    <div
      data-page-mode={pageMode}
      data-tenant-data-tier={dataTier}
      style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#F8F7F4', minHeight: '100vh' }}
    >
      {/* Orientation strip — Sentinel primary agent */}
      <div
        data-testid="intelligence-route-shell-strip"
        style={{
          borderBottom: '1px solid #E8E6E1',
          padding: '8px 24px',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: '#525866',
        }}
      >
        {/* Agent label — SENTINEL primary */}
        <span
          style={{
            fontWeight: 600,
            color: '#1B2B5C',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          INTELLIGENCE · PATTERN DETECTION · SENTINEL
        </span>
        <span aria-hidden="true">·</span>
        {/* Tenant name */}
        <span style={{ color: '#0A0C12', fontWeight: 500 }}>{tenantName}</span>
        {/* Deterministic caveat + tenant data tier disclosure */}
        <span
          style={{
            marginLeft: 'auto',
            color: '#9AA3B2',
            fontSize: '10px',
            textAlign: 'right',
            maxWidth: '480px',
          }}
        >
          {resolvedCaveat}
        </span>
      </div>
      {children}
    </div>
  );
}
