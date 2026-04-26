import React from 'react';

type AdminPage = 'index' | 'architecture' | 'production_readiness' | 'build_progress' | 'quality' | 'other';

interface AdminRouteShellProps {
  children: React.ReactNode;
  page?: AdminPage;
  caveat?: string;
}

const PAGE_LABELS: Record<AdminPage, string> = {
  index: 'ADMIN · PLATFORM OPERATIONS',
  architecture: 'ADMIN · ARCHITECTURE CANVAS',
  production_readiness: 'ADMIN · PRODUCTION READINESS',
  build_progress: 'ADMIN · BUILD PROGRESS',
  quality: 'ADMIN · QUALITY OPS',
  other: 'ADMIN · PLATFORM',
};

export function AdminRouteShell({
  children,
  page = 'index',
  caveat = 'Manifest-backed. No live monitoring. All states are deterministic or manually updated.',
}: AdminRouteShellProps) {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#FBFAF7', minHeight: '100vh' }}>
      <div style={{
        borderBottom: '1px solid #E8E6E1',
        padding: '8px 24px',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px',
        color: '#525866',
      }}>
        <span style={{ fontWeight: 600, color: '#1B2B5C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {PAGE_LABELS[page]}
        </span>
        <span style={{ marginLeft: 'auto', color: '#9AA3B2', fontSize: '10px' }}>{caveat}</span>
      </div>
      {children}
    </div>
  );
}
