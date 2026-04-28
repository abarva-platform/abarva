'use client';

import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';

export function SessionExpiredPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: SHELL.PAPER,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}
    >
      {/* Brand mark */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 20,
          fontWeight: 700,
          color: SHELL.INK,
          letterSpacing: '-0.02em',
          marginBottom: 40,
        }}
      >
        AbarVa
      </div>

      {/* Card */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 12,
          padding: '40px 48px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Icon area: amber dot */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: SHELL.PEACH_BG,
            border: `1px solid ${SHELL.PEACH_LINE}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <span style={{ fontFamily: SHELL.SERIF, fontSize: 18, color: SHELL.PEACH_TEXT }}>!</span>
        </div>

        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 700,
            color: SHELL.INK,
            margin: '0 0 10px',
            lineHeight: 1.2,
          }}
        >
          Session expired
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_MUTED,
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}
        >
          Your AbarVa session has expired or your credentials are no longer valid. Please sign in again to continue.
        </p>

        <Link
          href="/"
          style={{
            display: 'block',
            fontFamily: SHELL.MONO,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SHELL.PAPER,
            background: SHELL.INK,
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            marginBottom: 16,
          }}
        >
          Sign in again
        </Link>

        <p
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          Ste · Steward · Auth recovery
        </p>
      </div>
    </div>
  );
}
