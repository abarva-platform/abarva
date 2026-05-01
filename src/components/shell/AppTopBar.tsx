'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { SHELL } from '@/lib/shell/shell-tokens';
import { clearActiveClientContext } from '@/lib/auth/client-context-storage';

export interface AppTopBarProps {
  tenantName?: string;
  showLocked?: boolean;
  context?: string;
  timeString?: string;
}

export function AppTopBar({
  tenantName = 'Apex Retail Group',
  showLocked,
  context,
  timeString,
}: AppTopBarProps) {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const signedIn = isLoaded && Boolean(user);
  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'Demo';
  const initials = displayName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleSignOut() {
    clearActiveClientContext();
    void signOut(() => router.push('/'));
  }

  return (
    <div
      style={{
        height: 48,
        background: SHELL.PAPER,
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        {/* AbarVa logo */}
        <Link href="/home" aria-label="Go to Home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="AbarVa"
            style={{ height: 20, width: 'auto', display: 'block', flexShrink: 0 }}
          />
        </Link>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 16,
            background: SHELL.CARD_LINE,
            flexShrink: 0,
          }}
        />

        {/* Tenant name — plain, no pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Amber dot */}
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: SHELL.AMBER_DOT,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.015em',
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {tenantName}
          </span>
        </div>

        {/* LOCKED pill */}
        {showLocked ? (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.INK,
              padding: '3px 7px',
              border: `1px solid ${SHELL.INK}`,
              borderRadius: 3,
              lineHeight: 1,
            }}
          >
            Locked
          </span>
        ) : null}

        {/* Context string */}
        {context ? (
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MID,
            }}
          >
            {context}
          </span>
        ) : null}

        {/* ⌘K hint */}
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            color: SHELL.INK_MUTED,
            background: SHELL.GRAY_BG,
            padding: '3px 7px',
            borderRadius: 4,
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Time string */}
        {timeString ? (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              letterSpacing: '0.04em',
            }}
          >
            {timeString}
          </span>
        ) : null}

        {signedIn ? (
          <>
            <span
              title={displayName}
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_SOFT,
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 999,
                background: SHELL.CARD_WHITE,
                color: SHELL.INK,
                cursor: 'pointer',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.12em',
                lineHeight: 1,
                padding: '7px 10px',
                textTransform: 'uppercase',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 999,
              background: SHELL.CARD_WHITE,
              color: SHELL.INK,
              fontFamily: SHELL.MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.12em',
              lineHeight: 1,
              padding: '7px 10px',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            Sign in
          </Link>
        )}

        <div
          aria-hidden
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#c5b9d1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: SHELL.SANS, fontSize: 11, fontWeight: 600, color: SHELL.INK, lineHeight: 1 }}>
            {initials || 'D'}
          </span>
        </div>
      </div>
    </div>
  );
}
