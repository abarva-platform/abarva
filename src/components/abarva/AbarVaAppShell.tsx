import React from 'react';
import { AbarVaWordmark } from './AbarVaWordmark';
import { AbarVaTenantBadge } from './AbarVaTenantBadge';
import { ABARVA_SHELL_CONFIG } from '@/lib/design/abarva-shell';

interface AbarVaAppShellProps {
  children: React.ReactNode;
  tenantName?: string;
  tenantRichness?: 'rich' | 'thin' | 'shell_only';
  activeSurface?: string;
}

export function AbarVaAppShell({
  children,
  tenantName,
  tenantRichness = 'rich',
  activeSurface,
}: AbarVaAppShellProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: ABARVA_SHELL_CONFIG.backgroundColor, fontFamily: ABARVA_SHELL_CONFIG.fontFamily }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#0A0C12',
        borderBottom: '1px solid #1F2433',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <AbarVaWordmark />
        {tenantName && (
          <AbarVaTenantBadge tenantName={tenantName} richness={tenantRichness} />
        )}
        <nav style={{ display: 'flex', gap: '4px', marginLeft: '16px', flex: 1 }}>
          {ABARVA_SHELL_CONFIG.navItems.map(item => (
            <a
              key={item.surface}
              href={item.href}
              style={{
                padding: '4px 12px',
                fontSize: '13px',
                fontFamily: 'DM Sans, sans-serif',
                color: activeSurface === item.surface ? '#FFFFFF' : '#9AA3B2',
                borderBottom: activeSurface === item.surface ? '2px solid #1B2B5C' : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
