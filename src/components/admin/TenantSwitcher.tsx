'use client';

/**
 * TenantSwitcher — Wave 2 PR-5.
 *
 * Inline masthead chip ("acting as <Tenant> · switch") that founders and
 * platform admins use to flip the active-tenant view-context from inside
 * /admin. Required for multi-tenant incident response — without this,
 * an admin investigating tenant A has to sign out / sign in to look at
 * tenant B.
 *
 * Authority posture (verdict §5.6 Zone A, README rules):
 *   - The component receives `canSwitch` from the server (resolved via
 *     the same allowlist + Clerk-metadata gate that protects the /admin
 *     route itself). When `canSwitch === false`, we render a static
 *     `<span>` with the tenant name, NOT the chip — non-admins never see
 *     the switch affordance.
 *   - Switching does NOT change the user's database role grants. RLS
 *     continues to enforce per-user limits inside the new tenant
 *     context; the cookie just steers tenant resolution.
 *   - Every switch lands in admin_audit_log (category=auth) so the
 *     Isolation lane can surface "User X switched tenant A → B at HH:MM".
 *
 * Design system: locked palette only. Mono eyebrow + DM Sans body. No
 * new colors, no rounded-full pill, no gradient.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';

export interface TenantSwitcherOption {
  canonicalKey: string;
  displayName: string;
  industryLabel: string;
}

export interface TenantSwitcherProps {
  /** Canonical key of the tenant currently in view. */
  currentCanonicalKey: string;
  /** Display name of the currently-active tenant. */
  currentDisplayName: string;
  /**
   * The 5 canonical tenants (or whatever subset the server elects to
   * surface). The component hard-validates each entry against the
   * provided list — it does NOT accept free-form tenant keys.
   */
  options: ReadonlyArray<TenantSwitcherOption>;
  /**
   * Server-side authority decision. False → render a static label
   * instead of the chip. The component never re-derives this from
   * client state.
   */
  canSwitch: boolean;
  /**
   * Optional override for the POST endpoint. Defaults to the canonical
   * /api/admin/switch-tenant route. Used only by tests.
   */
  endpoint?: string;
  /**
   * Optional navigation override. Defaults to `window.location.assign`.
   * Used by tests to avoid jsdom's read-only Location object.
   */
  onNavigate?: (href: string) => void;
}

const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';
const F_BODY =
  'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
  navySoft: 'rgba(27,43,92,0.06)',
};

export function TenantSwitcher(props: TenantSwitcherProps) {
  const {
    currentCanonicalKey,
    currentDisplayName,
    options,
    canSwitch,
    endpoint = '/api/admin/switch-tenant',
    onNavigate,
  } = props;

  const [open, setOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (popoverRef.current && target && !popoverRef.current.contains(target)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const onSelect = useCallback(
    async (targetKey: string) => {
      // Hard-validate against the prop-provided canonical list — never
      // POST a key we did not render.
      if (!options.some((o) => o.canonicalKey === targetKey)) return;
      if (targetKey === currentCanonicalKey) {
        setOpen(false);
        return;
      }
      setPendingKey(targetKey);
      setErrorMessage(null);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantKey: targetKey }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error || `switch_failed_${res.status}`);
        }
        try {
          posthog.capture('admin.tenant_switched', {
            from: currentCanonicalKey,
            to: targetKey,
          });
        } catch {
          // PostHog not initialised — swallow.
        }
        if (onNavigate) {
          onNavigate('/admin');
        } else if (typeof window !== 'undefined') {
          window.location.assign('/admin');
        }
      } catch (err) {
        setPendingKey(null);
        setErrorMessage(
          err instanceof Error ? err.message : 'switch_failed_unknown',
        );
      }
    },
    [currentCanonicalKey, endpoint, onNavigate, options],
  );

  if (!canSwitch) {
    return (
      <span
        data-testid="tenant-switcher-static"
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: C.faint,
        }}
      >
        Acting as · {currentDisplayName}
      </span>
    );
  }

  return (
    <div
      ref={popoverRef}
      data-testid="tenant-switcher"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        data-testid="tenant-switcher-chip"
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
        onClick={() => setOpen((current) => !current)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          border: `1px solid ${C.borderLight}`,
          background: C.surface,
          borderRadius: 4,
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: C.muted,
          cursor: 'pointer',
        }}
      >
        <span>Acting as</span>
        <span style={{ color: C.ink }}>{currentDisplayName}</span>
        <span aria-hidden="true" style={{ color: C.faint }}>·</span>
        <span style={{ color: C.ink, textDecoration: 'underline' }}>Switch</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Switch active tenant"
          data-testid="tenant-switcher-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 30,
            minWidth: 280,
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 6,
            boxShadow: '0 4px 14px rgba(10,12,18,0.08)',
            padding: '6px 0',
          }}
        >
          <div
            style={{
              padding: '8px 14px 6px',
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.faint,
            }}
          >
            Switch tenant
          </div>
          {options.map((option) => {
            const isCurrent = option.canonicalKey === currentCanonicalKey;
            const isPending = pendingKey === option.canonicalKey;
            return (
              <button
                key={option.canonicalKey}
                type="button"
                role="option"
                aria-selected={isCurrent ? 'true' : 'false'}
                disabled={isPending || pendingKey !== null}
                onClick={() => onSelect(option.canonicalKey)}
                data-testid={`tenant-switcher-option-${option.canonicalKey}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  background: isCurrent ? C.navySoft : C.surface,
                  border: 'none',
                  borderTop: `1px solid ${C.borderLight}`,
                  textAlign: 'left',
                  cursor: isPending || pendingKey !== null ? 'wait' : 'pointer',
                  fontFamily: F_BODY,
                  color: C.body,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13,
                      color: C.ink,
                      fontWeight: 500,
                    }}
                  >
                    {option.displayName}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: F_MONO,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: C.faint,
                      marginTop: 2,
                    }}
                  >
                    {option.industryLabel}
                  </span>
                </span>
                {isCurrent && (
                  <span
                    aria-label="Currently active"
                    style={{
                      fontFamily: F_MONO,
                      fontSize: 9,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: C.muted,
                    }}
                  >
                    Current
                  </span>
                )}
              </button>
            );
          })}
          {errorMessage && (
            <div
              data-testid="tenant-switcher-error"
              role="alert"
              style={{
                padding: '8px 14px',
                fontFamily: F_MONO,
                fontSize: 10,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: '#991B1B',
                borderTop: `1px solid ${C.borderLight}`,
              }}
            >
              Switch failed · {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
