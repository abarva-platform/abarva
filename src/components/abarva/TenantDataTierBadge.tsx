import React from 'react';
import type { DemoTenantRichness } from '@/lib/tenants/demo-tenant-data-tiers';

interface TenantDataTierBadgeProps {
  tenantName: string;
  richness: DemoTenantRichness;
  caveat?: string;
}

export function TenantDataTierBadge({ tenantName, richness, caveat }: TenantDataTierBadgeProps) {
  const label =
    richness === 'rich' ? 'Full Demo' : richness === 'thin' ? 'Demo — Thin' : 'Shell Only';
  const color = richness === 'rich' ? '#1B2B5C' : '#525866';
  return (
    <div
      title={caveat}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        backgroundColor: richness === 'rich' ? '#EEF2F8' : '#F5F4F2',
        border: `1px solid ${color}`,
        borderRadius: '3px',
        fontSize: '10px',
        fontFamily: 'DM Sans, sans-serif',
        color,
        cursor: caveat ? 'help' : 'default',
      }}
    >
      <span style={{ fontWeight: 600, color: '#0A0C12' }}>{tenantName}</span>
      <span>·</span>
      <span>{label}</span>
    </div>
  );
}
