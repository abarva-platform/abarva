import React from 'react';

interface AbarVaTenantBadgeProps {
  tenantName: string;
  richness?: 'rich' | 'thin' | 'shell_only';
}

export function AbarVaTenantBadge({ tenantName, richness = 'rich' }: AbarVaTenantBadgeProps) {
  const richnessLabel = richness === 'rich' ? 'Full Demo' : richness === 'thin' ? 'Thin Demo' : 'Shell Only';
  const richnessColor = richness === 'rich' ? '#1B2B5C' : '#525866';
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 8px',
      backgroundColor: '#F0F2F7',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <span style={{ fontWeight: 600, color: '#0A0C12' }}>{tenantName}</span>
      <span style={{ color: richnessColor, fontSize: '10px' }}>{richnessLabel}</span>
    </div>
  );
}
