// /invite/<slug> · personalized invite landing page for a single CXO
// persona. Shareable URL (e.g., https://app.abarva.ai/invite/cio-apex).
//
// Renders a brand-locked welcome page with the persona's bio, login
// instructions, and a CTA into /sign-in. The static invite HTML
// generator (scripts/generate-invite-html.ts) emits offline copies
// of the same content for email distribution.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CXO_PERSONAS, findPersonaBySlug, type CxoPersona } from '@/lib/auth/cxo-personas';
import { DEMO_CODE_VALUE } from '@/lib/auth/demo-code';

// Pre-render every persona slug at build time.
export function generateStaticParams() {
  return CXO_PERSONAS.map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const persona = findPersonaBySlug(slug);
  if (!persona) return { title: 'Invite · AbarVa' };
  return {
    title: `${persona.personaName} · Your AbarVa workspace`,
    description: `Sign in as ${persona.titleShort} of ${persona.tenant}.`,
  };
}

const BRAND = {
  ink: '#000000',
  signalBlue: '#0066CC',
  paper: '#faf7f1',
  paperLine: '#DCD8D0',
  hair: 'rgba(255,255,255,0.10)',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.12)',
  textStrong: '#F5F7FB',
  textMute: 'rgba(255,255,255,0.72)',
  textFaint: 'rgba(255,255,255,0.55)',
  fSans: 'Inter, system-ui, sans-serif',
  fMono: '"JetBrains Mono", ui-monospace, monospace',
  fSerif: 'Fraunces, Georgia, serif',
};

const DEMO_PASSWORD = 'Demo2026!';
const SIGN_IN_URL = 'https://app.abarva.ai/sign-in';

export default async function InvitePage({ params }: Props) {
  const { slug } = await params;
  const persona = findPersonaBySlug(slug);
  if (!persona) notFound();
  return <InviteSurface persona={persona} />;
}

function InviteSurface({ persona }: { persona: CxoPersona }) {
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
          maxWidth: 560,
          background: 'rgba(7, 14, 24, 0.92)',
          border: `1px solid ${BRAND.cardBorder}`,
          borderRadius: 16,
          padding: '40px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
        }}
      >
        {/* Brand block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
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

        {/* Persona pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 10,
            background: BRAND.card,
            border: `1px solid ${BRAND.cardBorder}`,
            marginBottom: 28,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 8,
              background: persona.monogramBg,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '0.02em',
            }}
          >
            {persona.monogram}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: BRAND.fMono,
                fontSize: 13,
                fontWeight: 600,
                color: BRAND.textStrong,
                marginBottom: 3,
              }}
            >
              {persona.shortLabel}
            </div>
            <div style={{ fontSize: 12.5, color: BRAND.textMute, lineHeight: 1.3 }}>
              {persona.personaName} · {persona.titleFull} · {persona.tenant}
            </div>
          </div>
        </div>

        {/* Welcome */}
        <h1
          style={{
            fontFamily: BRAND.fSerif,
            fontSize: 30,
            fontWeight: 400,
            color: BRAND.textStrong,
            letterSpacing: '-0.018em',
            lineHeight: 1.15,
            margin: '0 0 12px',
          }}
        >
          Welcome, {persona.firstName}.
        </h1>
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: BRAND.textMute,
            margin: '0 0 18px',
          }}
        >
          Your AbarVa workspace is ready. You&apos;re signing in as{' '}
          <strong style={{ color: BRAND.textStrong, fontWeight: 600 }}>
            {persona.personaName}
          </strong>
          , {persona.titleFull} at {persona.tenant}.
        </p>
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.6,
            color: BRAND.textMute,
            margin: '0 0 28px',
          }}
        >
          {persona.bioLong}
        </p>

        {/* Workspace teaser */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: 'rgba(0,102,204,0.08)',
            border: `1px solid rgba(0,102,204,0.30)`,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontFamily: BRAND.fMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: BRAND.signalBlue,
              marginBottom: 6,
            }}
          >
            What you&apos;ll see
          </div>
          <div style={{ fontSize: 13.5, color: BRAND.textStrong, lineHeight: 1.55 }}>
            {persona.workspaceTeaser}
          </div>
        </div>

        {/* Credentials */}
        <div
          style={{
            display: 'grid',
            gap: 10,
            padding: '16px 18px',
            borderRadius: 10,
            background: BRAND.card,
            border: `1px solid ${BRAND.cardBorder}`,
            marginBottom: 22,
          }}
        >
          <CredRow label="Sign-in URL" value={SIGN_IN_URL} mono />
          <CredRow label="Email" value={persona.email} mono />
          <CredRow label="Verification code" value={DEMO_CODE_VALUE} mono />
          <CredRow label="Password (alternate)" value={DEMO_PASSWORD} mono />
        </div>

        {/* CTA */}
        <Link
          href="/sign-in"
          style={{
            display: 'block',
            width: '100%',
            background: BRAND.signalBlue,
            color: '#FFFFFF',
            fontSize: 14.5,
            fontWeight: 600,
            padding: '14px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            textAlign: 'center',
            marginBottom: 14,
            letterSpacing: '-0.005em',
          }}
        >
          Sign in to your workspace →
        </Link>

        <div
          style={{
            fontSize: 11.5,
            color: BRAND.textFaint,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Need help? Contact{' '}
          <a
            href="mailto:anand.sundaram@thesundaram.com"
            style={{ color: BRAND.textMute, textDecoration: 'underline' }}
          >
            anand.sundaram@thesundaram.com
          </a>
        </div>
      </div>
    </div>
  );
}

function CredRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, alignItems: 'baseline' }}>
      <div
        style={{
          fontFamily: BRAND.fMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: BRAND.textFaint,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono ? BRAND.fMono : BRAND.fSans,
          fontSize: mono ? 13 : 14,
          color: BRAND.textStrong,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  );
}
