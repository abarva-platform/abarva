import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { ContactForm } from '@/components/public-site/ContactForm';

export const metadata: Metadata = buildPageMetadata({
  title: 'Talk to us',
  description: 'Enterprise contact for AbarVa. Tell us what AI program you\'re working on and what you\'d need AbarVa to do.',
  openGraph: { url: CANONICAL_URLS.contact },
});

export default function ContactPage() {
  return (
    <div style={{ paddingTop: 80, background: 'var(--pub-paper)', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 32px' }}>
        <header style={{ marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 16 }}>
            Talk to us.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--pub-slate)', lineHeight: 1.6 }}>
            No demo request forms. No sales qualification sequences. Tell us what you&apos;re building and what you need.
          </p>
          <p style={{ fontSize: 14, color: 'var(--pub-stone)', marginTop: 12, fontFamily: 'var(--pub-font-sans)' }}>
            We respond to serious inquiries within 48 hours.
          </p>
        </header>
        <ContactForm />
      </div>
    </div>
  );
}
