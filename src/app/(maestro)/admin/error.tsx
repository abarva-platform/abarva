'use client';

/**
 * /admin error boundary — PR-A (P0 Apex-leak elimination · 2026-05-30).
 *
 * Catches `AdminTenantUnresolvedError` thrown by `resolveAdminTenant()`
 * and renders an explicit "no active tenant" recovery panel instead of
 * silently routing the user into Apex-branded content (the prior
 * fallback behavior in `src/lib/admin/admin-tenant.ts`).
 *
 * All other errors are rethrown so the parent `(maestro)/error.tsx`
 * boundary handles them with the generic surface-error template.
 */

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';

function UnresolvedTenantPanel({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <AppShell surface="setup">
      <div
        style={{
          flex: 1,
          background: SHELL.PAPER,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          minHeight: 'calc(100vh - 48px)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div
            style={{
              background: SHELL.RUST_BG,
              border: `1px solid #dbb8a8`,
              borderRadius: 10,
              padding: '28px 32px',
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(138,62,34,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 20,
                  fontWeight: 700,
                  color: SHELL.RUST_TEXT,
                  lineHeight: 1,
                }}
              >
                !
              </span>
            </div>

            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 18,
                fontWeight: 700,
                color: SHELL.RUST_TEXT,
                marginBottom: 8,
                letterSpacing: '-0.01em',
              }}
            >
              No active tenant
            </div>

            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.RUST_TEXT,
                opacity: 0.85,
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              We couldn&apos;t identify your active tenant for the Admin workspace
              control plane. Please switch tenants or sign out and back in.
            </div>

            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.04em',
                color: SHELL.RUST_TEXT,
                opacity: 0.6,
                lineHeight: 1.4,
              }}
            >
              {reason}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={onRetry}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SHELL.PAPER,
                background: SHELL.INK,
                border: `1px solid ${SHELL.INK}`,
                padding: '9px 18px',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <Link
              href="/sign-in"
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SHELL.INK,
                border: `1px solid ${SHELL.CARD_LINE}`,
                background: 'transparent',
                padding: '9px 18px',
                borderRadius: 20,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
            <Link
              href="/admin/customer"
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SHELL.INK,
                border: `1px solid ${SHELL.CARD_LINE}`,
                background: 'transparent',
                padding: '9px 18px',
                borderRadius: 20,
                textDecoration: 'none',
              }}
            >
              Switch tenant
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (error.name === 'AdminTenantUnresolvedError') {
    return <UnresolvedTenantPanel reason={error.message} onRetry={reset} />;
  }
  // Rethrow so the parent (maestro)/error.tsx boundary handles non-tenant errors.
  throw error;
}
