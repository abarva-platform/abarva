// /signed-out · minimal post-sign-out landing page.
//
// Founder direction (2026-05-08): the prior sign-out destination was
// `/` (the public marketing surface) which surfaces a lot of demo
// content. Sign-out should land on a deliberately bare page that
// confirms the action and offers a clean re-entry — no marketing,
// no insights, no demo data.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Signed out · AbarVa',
  robots: { index: false, follow: false },
};

const BRAND = {
  ink: '#000000',
  signalBlue: '#0066CC',
  hair: 'rgba(255,255,255,0.10)',
  cardBorder: 'rgba(255,255,255,0.12)',
  textStrong: '#F5F7FB',
  textMute: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.55)',
  fSans: 'Inter, system-ui, sans-serif',
  fSerif: 'Fraunces, Georgia, serif',
};

export default function SignedOutPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: BRAND.ink,
        color: BRAND.textStrong,
        fontFamily: BRAND.fSans,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(7, 14, 24, 0.92)',
          border: `1px solid ${BRAND.cardBorder}`,
          borderRadius: 16,
          padding: '36px 32px',
          textAlign: 'center',
        }}
      >
        {/* Brand block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <Image
            src="/brand/abarva-logo-inverse.svg"
            alt="AbarVa"
            width={92}
            height={24}
            style={{ height: 24, width: 'auto', display: 'block' }}
            priority
          />
          <div aria-hidden="true" style={{ width: 1, height: 18, background: BRAND.hair }} />
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 400,
              color: BRAND.textStrong,
              letterSpacing: '-0.005em',
              lineHeight: 1,
            }}
          >
            <strong style={{ fontWeight: 600 }}>AI</strong> Success Platform
          </div>
        </div>

        <h1
          style={{
            fontFamily: BRAND.fSerif,
            fontSize: 28,
            fontWeight: 400,
            color: BRAND.textStrong,
            letterSpacing: '-0.018em',
            lineHeight: 1.15,
            margin: '0 0 10px',
          }}
        >
          You&rsquo;re signed out.
        </h1>
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: BRAND.textMute,
            margin: '0 0 26px',
          }}
        >
          Your session has ended and the active workspace context has been cleared.
        </p>

        <Link
          href="/sign-in"
          style={{
            display: 'block',
            width: '100%',
            background: BRAND.signalBlue,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            padding: '12px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            letterSpacing: '-0.005em',
            boxSizing: 'border-box',
          }}
        >
          Sign in again
        </Link>
      </div>
    </div>
  );
}
