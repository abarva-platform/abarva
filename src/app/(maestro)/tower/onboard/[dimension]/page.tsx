import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  TOWER_DIMENSIONS,
  catalogByDimension,
  dimensionByKey,
  type TowerDimension,
} from '@/lib/tower/onboarding-catalog';
import { SystemAccordion } from '@/components/tower/SystemAccordion';

export const dynamic = 'force-dynamic';

// AbarVa locked light design system — see ./page.tsx. Re-skinned from the
// prior dark teal theme in the 2026-05 audit pass.
const PAGE_BG = '#F8F7F4';
const INK = '#1A1A18';
const INK_SOFT = '#5b5148';
const RULE = 'rgba(10,10,11,0.12)';
const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, serif';
const MONO = 'var(--font-body-mono), ui-monospace, SFMono-Regular, Menlo, monospace';
const BODY = 'var(--font-body-sans), "Inter", -apple-system, system-ui, sans-serif';

type Params = { dimension: string };

export default async function DimensionOnboardPage({ params }: { params: Promise<Params> }) {
  const { dimension } = await params;
  const dim = dimensionByKey(dimension);
  if (!dim) notFound();

  const systems = catalogByDimension(dim.key as TowerDimension);

  return (
    <div style={{ background: PAGE_BG, minHeight: '100%' }}>
      <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto', fontFamily: BODY }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Link
            href="/tower/onboard"
            style={{ fontFamily: MONO, fontSize: 10, color: INK, textDecoration: 'none', letterSpacing: '0.16em', fontWeight: 700 }}
          >
            DATA SETUP
          </Link>
          <span style={{ color: INK_SOFT, fontFamily: MONO, fontSize: 10 }}>›</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: INK_SOFT, letterSpacing: '0.16em', fontWeight: 700 }}>
            {dim.num} · {dim.name.toUpperCase()}
          </span>
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: INK, margin: 0, lineHeight: 1.2 }}>
          Populate the {dim.name} dimension
        </h1>
        <p style={{ fontSize: 15, color: INK_SOFT, marginTop: 10, maxWidth: 720, lineHeight: 1.55 }}>
          {dim.tagline} Typical setup: {dim.setupMinutes} minutes.
        </p>

        {/* What we need */}
        <section style={{ marginTop: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
            What we need
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.7, color: INK }}>
            {dim.whatWeNeed.map((item) => (
              <li key={item} style={{ marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Where to find it */}
        <section style={{ marginTop: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            Where to find it
          </div>
          {systems.length === 0 ? (
            <div style={{ padding: 20, border: `1px solid ${RULE}`, borderRadius: 10, background: '#ffffff', color: INK_SOFT, fontSize: 14 }}>
              No Tier-1 system mapping ships for this dimension yet. Use the manual CSV template below.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {systems.map((s) => (
                <SystemAccordion key={s.key} system={s} />
              ))}
            </div>
          )}
        </section>

        {/* Templates + manual */}
        <section style={{ marginTop: 64 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            Don&apos;t have any of these?
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={`/templates/tower/tower-${dim.key}.csv`}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: INK,
                border: `1px solid ${INK}`,
                color: '#ffffff',
                fontFamily: BODY,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              Download {dim.name} template · CSV
            </a>
            <a
              href="/templates/tower/tower-bundle.xlsx"
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: 'transparent',
                border: `1px solid ${INK}`,
                color: INK,
                fontFamily: BODY,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              All 5 dimensions · Excel bundle
            </a>
            <Link
              href="/tower"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: 'transparent',
                border: `1px solid ${INK}`,
                color: INK,
                fontFamily: BODY,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              Paste data → go to Tower
            </Link>
          </div>
          <div style={{ fontSize: 12, color: INK_SOFT, marginTop: 12, fontStyle: 'italic' }}>
            Templates are generated at build time via <code>npm run templates:build</code>. If missing, download from Tower root after next deploy.
          </div>
        </section>

        {/* Other dimensions */}
        <section style={{ marginTop: 80, paddingTop: 32, borderTop: `1px solid ${RULE}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            Populate another dimension
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TOWER_DIMENSIONS.filter((d) => d.key !== dim.key).map((d) => (
              <Link
                key={d.key}
                href={`/tower/onboard/${d.key}`}
                style={{
                  padding: '8px 14px',
                  border: `1px solid ${RULE}`,
                  borderRadius: 999,
                  background: '#ffffff',
                  color: INK,
                  fontFamily: BODY,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                {d.num} · {d.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
