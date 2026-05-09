'use client';
// Apex Retail case study · shared shell.
// Mirrors _shell.tsx from the Meridian study but with Apex-specific chapter
// slugs, routing, and the /home/learn URL base.

import Link from 'next/link';
import { T } from '@/components/home/learn/primitives';

export const APEX_CHAPTER_SLUGS = [
  'apex-strategy',
  'apex-scope',
  'apex-rfp',
  'apex-responses',
  'apex-evaluation',
  'apex-pricing',
  'apex-bafo',
  'apex-decision',
] as const;

export type ApexChapterSlug = (typeof APEX_CHAPTER_SLUGS)[number];

const APEX_CHAPTER_LABELS: Record<ApexChapterSlug, string> = {
  'apex-strategy':   'Ch.01 · Strategy',
  'apex-scope':      'Ch.02 · Scope',
  'apex-rfp':        'Ch.03 · RFP',
  'apex-responses':  'Ch.04 · Vendor Responses',
  'apex-evaluation': 'Ch.05 · Evaluation',
  'apex-pricing':    'Ch.06 · Pricing',
  'apex-bafo':       'Ch.07 · BAFO',
  'apex-decision':   'Ch.08 · Decision',
};

function apexNeighbors(slug: string) {
  const idx = APEX_CHAPTER_SLUGS.indexOf(slug as ApexChapterSlug);
  if (idx < 0) return { prev: null, next: null };
  const prevSlug = idx === 0 ? 'apex-retail-case-study' : APEX_CHAPTER_SLUGS[idx - 1];
  const nextSlug = idx < APEX_CHAPTER_SLUGS.length - 1 ? APEX_CHAPTER_SLUGS[idx + 1] : null;
  return {
    prev: prevSlug ? { slug: prevSlug, label: idx === 0 ? 'Case study overview' : APEX_CHAPTER_LABELS[prevSlug as ApexChapterSlug] } : null,
    next: nextSlug ? { slug: nextSlug, label: APEX_CHAPTER_LABELS[nextSlug as ApexChapterSlug] } : null,
  };
}

export function ApexChapterShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { prev, next } = apexNeighbors(slug);
  return (
    <>
      {children}
      <nav
        aria-label="Case study chapter navigation"
        style={{
          padding: '40px clamp(32px, 4vw, 64px) 64px',
          borderTop: `1px solid ${T.borderLt}`,
          background: T.surface2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}
      >
        <div>
          {prev ? (
            <Link
              href={`/home/learn/source/${prev.slug}`}
              style={{ display: 'block', textDecoration: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', background: T.surface }}
            >
              <div style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.faint, marginBottom: 6 }}>← Previous</div>
              <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 600, color: T.navy, lineHeight: 1.4 }}>{prev.label}</div>
            </Link>
          ) : <div />}
        </div>
        <div>
          {next ? (
            <Link
              href={`/home/learn/source/${next.slug}`}
              style={{ display: 'block', textDecoration: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', background: T.surface, textAlign: 'right' }}
            >
              <div style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.faint, marginBottom: 6 }}>Next →</div>
              <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 600, color: T.navy, lineHeight: 1.4 }}>{next.label}</div>
            </Link>
          ) : <div />}
        </div>
      </nav>
    </>
  );
}

// ── Shared primitives ────────────────────────────────────────────────────────

export function StoryRecap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '20px clamp(32px, 4vw, 64px)',
      background: '#F0F4FF',
      borderBottom: `1px solid ${T.borderLt}`,
      fontFamily: T.fBody,
      fontSize: 13,
      color: '#374151',
      lineHeight: 1.65,
    }}>
      <span style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.navy, marginRight: 10 }}>WHERE WE ARE</span>
      {children}
    </div>
  );
}

export function GateStatusRow({ id, label, status, evidence }: { id: string; label: string; status: 'met' | 'unmet' | 'waived' | 'deferred'; evidence: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    met:      { bg: '#DCFCE7', text: '#166534' },
    unmet:    { bg: '#FEE2E2', text: '#991B1B' },
    waived:   { bg: '#FEF9C3', text: '#854D0E' },
    deferred: { bg: '#E0F2FE', text: '#075985' },
  };
  const c = colors[status];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 1fr', gap: 12, alignItems: 'start', padding: '10px 0', borderBottom: `1px solid ${T.borderLt}` }}>
      <span style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, color: T.faint }}>{id}</span>
      <span style={{ fontFamily: T.fBody, fontSize: 13, color: T.ink }}>{label}</span>
      <span style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: c.bg, color: c.text, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{status}</span>
      <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.faint }}>{evidence}</span>
    </div>
  );
}

export function VendorScoreRow({ vendor, score, rank, notes }: { vendor: string; score: string; rank: number; notes: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px 180px 80px 1fr', gap: 12, alignItems: 'start', padding: '10px 0', borderBottom: `1px solid ${T.borderLt}` }}>
      <span style={{ fontFamily: T.fMono, fontSize: 11, fontWeight: 700, color: rank <= 2 ? T.navy : T.faint }}>#{rank}</span>
      <span style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 600, color: T.ink }}>{vendor}</span>
      <span style={{ fontFamily: T.fMono, fontSize: 12, fontWeight: 700, color: rank <= 2 ? T.navy : T.faint }}>{score}</span>
      <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.faint }}>{notes}</span>
    </div>
  );
}

export function PricingRow({ vendor, year1, year2, year3, tco3yr, delta }: { vendor: string; year1: string; year2: string; year3: string; tco3yr: string; delta?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 120px 90px', gap: 10, padding: '10px 0', borderBottom: `1px solid ${T.borderLt}`, alignItems: 'center' }}>
      <span style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 600, color: T.ink }}>{vendor}</span>
      <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.ink, textAlign: 'right' }}>{year1}</span>
      <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.ink, textAlign: 'right' }}>{year2}</span>
      <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.ink, textAlign: 'right' }}>{year3}</span>
      <span style={{ fontFamily: T.fMono, fontSize: 12, fontWeight: 700, color: T.navy, textAlign: 'right' }}>{tco3yr}</span>
      {delta && <span style={{ fontFamily: T.fMono, fontSize: 11, color: '#166534', textAlign: 'right' }}>{delta}</span>}
    </div>
  );
}
