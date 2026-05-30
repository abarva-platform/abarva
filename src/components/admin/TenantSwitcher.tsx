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
  // Locked palette — error/retry surface. Red dot + amber surround for
  // 5xx (transient), red dot + plain surround for 4xx (authority/validation).
  errorInk: '#991B1B',
  errorSurface: '#FEF2F2',
  errorBorder: '#FCA5A5',
  warnSurface: '#FFFBEB',
  warnBorder: '#FCD34D',
  retryLink: '#1B2B5C',
};

/**
 * Translate a raw server-error code (or HTTP status) into a plain-English
 * message a non-engineer admin can act on. Keeps schema details out of
 * the UI — never expose internal table/column names.
 */
function friendlyError(
  code: string,
  status?: number,
): { tone: 'authority' | 'transient' | 'unknown'; message: string } {
  if (status === 401 || code === 'unauthenticated') {
    return {
      tone: 'authority',
      message:
        'Your session has expired — sign in again to switch tenant context.',
    };
  }
  if (status === 403 || code === 'forbidden') {
    return {
      tone: 'authority',
      message:
        "Your role doesn't have tenant-switch permission — contact your admin.",
    };
  }
  if (status === 400 || code === 'invalid_tenant') {
    return {
      tone: 'authority',
      message:
        'The selected tenant key is not in the canonical 5-tenant list. Refresh and try again.',
    };
  }
  if (typeof status === 'number' && status >= 500) {
    return {
      tone: 'transient',
      message:
        'Tenant-switch service is temporarily unavailable. Retry, or try again in a moment.',
    };
  }
  return {
    tone: 'unknown',
    message: 'Switch failed — retry, or check the server logs.',
  };
}

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
  const [errorState, setErrorState] = useState<
    | {
        targetKey: string;
        code: string;
        status?: number;
      }
    | null
  >(null);
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
      setErrorState(null);
      let res: Response | null = null;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantKey: targetKey }),
        });
      } catch (networkErr) {
        // Network/CORS/offline — fetch itself rejected. Surface as
        // transient so the user can retry.
        setPendingKey(null);
        setErrorState({
          targetKey,
          code:
            networkErr instanceof Error ? networkErr.message : 'network_error',
          status: undefined,
        });
        return;
      }
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setPendingKey(null);
        setErrorState({
          targetKey,
          code: payload.error || `switch_failed_${res.status}`,
          status: res.status,
        });
        // IMPORTANT: do NOT close the popover on error. The error banner
        // must remain visible until the user dismisses it or retries.
        return;
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
          {errorState && (() => {
            const friendly = friendlyError(errorState.code, errorState.status);
            const surface =
              friendly.tone === 'transient' ? C.warnSurface : C.errorSurface;
            const border =
              friendly.tone === 'transient' ? C.warnBorder : C.errorBorder;
            return (
              <div
                data-testid="tenant-switcher-error"
                role="alert"
                style={{
                  padding: '10px 14px',
                  background: surface,
                  borderTop: `1px solid ${border}`,
                  fontFamily: F_BODY,
                  fontSize: 12,
                  color: C.errorInk,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  aria-hidden="true"
                  data-testid="tenant-switcher-error-dot"
                  style={{
                    flex: '0 0 auto',
                    marginTop: 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: C.errorInk,
                  }}
                />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    data-testid="tenant-switcher-error-eyebrow"
                    style={{
                      display: 'block',
                      fontFamily: F_MONO,
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: C.errorInk,
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    Switch failed
                    {typeof errorState.status === 'number'
                      ? ` · ${errorState.status}`
                      : ''}
                  </span>
                  <span
                    data-testid="tenant-switcher-error-message"
                    style={{
                      display: 'block',
                      color: C.body,
                      lineHeight: 1.4,
                    }}
                  >
                    {friendly.message}
                  </span>
                  <button
                    type="button"
                    data-testid="tenant-switcher-error-retry"
                    onClick={() => {
                      const retryKey = errorState.targetKey;
                      setErrorState(null);
                      void onSelect(retryKey);
                    }}
                    style={{
                      marginTop: 6,
                      padding: 0,
                      background: 'transparent',
                      border: 'none',
                      color: C.retryLink,
                      fontFamily: F_MONO,
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
