import Link from 'next/link';

// 403 page · rendered by Next when `forbidden()` is called from a Server
// Component or Route Handler. Exists primarily for the tenant-access
// guard in src/lib/auth/tenant-access.ts — a signed-in user hitting a
// tenant they don't belong to lands here instead of reading cross-tenant
// data.

export default function Forbidden() {
  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="16" x2="16" y2="6" stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="24.7" y2="11" stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="24.7" y2="21" stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="16" y2="26" stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="7.3" y2="21" stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <line x1="16" y1="16" x2="7.3" y2="11" stroke="#60A5FA" strokeWidth="1.2" opacity="0.55" />
            <circle cx="16" cy="6" r="2.2" fill="#60A5FA" />
            <circle cx="24.7" cy="11" r="2.2" fill="#60A5FA" />
            <circle cx="24.7" cy="21" r="2.2" fill="#60A5FA" />
            <circle cx="16" cy="26" r="2.2" fill="#60A5FA" />
            <circle cx="7.3" cy="21" r="2.2" fill="#60A5FA" />
            <circle cx="7.3" cy="11" r="2.2" fill="#60A5FA" />
            <circle cx="16" cy="16" r="5.5" fill="#14B8A6" />
          </svg>
        </div>

        <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontWeight: 900, fontSize: '22px', letterSpacing: '-0.02em', marginBottom: '24px' }}>
          <span style={{ color: '#F0F6FF' }}>Abar</span><span style={{ color: '#14B8A6' }}>VA</span>
        </div>

        <div style={{ fontSize: '96px', fontWeight: 800, color: '#14B8A6', fontFamily: "'IBM Plex Mono', 'Courier New', monospace", lineHeight: 1, marginBottom: '24px' }}>
          403
        </div>

        <div style={{ fontSize: '20px', color: '#E6EDF3', marginBottom: '12px', fontWeight: 500 }}>
          This tenant is not yours.
        </div>
        <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '40px', lineHeight: 1.6 }}>
          You are signed in, but your session does not have access to the organization whose URL you just opened. Tenant data is isolated at the data plane — we will not render another organization&rsquo;s work to you.
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/home" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #2DD4C8', color: '#2DD4C8', fontSize: '14px', fontWeight: 600, textDecoration: 'none', background: 'transparent' }}>
            ← Go to your home
          </Link>
          <Link href="/sign-in" style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.16)', color: '#E6EDF3', fontSize: '14px', fontWeight: 600, textDecoration: 'none', background: 'transparent' }}>
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}
