import React from 'react';
// BRAND1-dependent: AbarVaLogo will be replaced by the canonical SVG-backed implementation
// from the BRAND1 lane. The stub at src/components/brand/AbarVaLogo.tsx satisfies TypeScript
// until BRAND1 lands. Wiring is additive — no other shell behaviour changes.
import { AbarVaLogo } from '@/components/brand/AbarVaLogo';
// FALLBACK: AbarVaWordmark kept as a clearly-labelled fallback for direct wordmark-only usage.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        {/* BRAND1: canonical logo — BRAND1 lane will replace the stub with real SVG */}
        <AbarVaLogo size="sm" label="AbarVa" />
        {/* FALLBACK (unused by default): <AbarVaWordmark /> */}
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
