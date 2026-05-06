// PROG-P1 · Pattern catalog — canonical shell alignment
// Converted from client component (useEffect/useState) to server component.
// Fetches patterns server-side from in-memory mock; wraps in AppShell.

import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { getPatterns, getViewerRole } from '@/lib/programs/mock';
import { SHELL } from '@/lib/shell/shell-tokens';

export const metadata: Metadata = {
  title: 'Pattern Catalog · AbarVa',
};

export default async function ProgramsPatternsPage() {
  const patterns = await getPatterns({ role: getViewerRole('lead') });

  return (
    <AppShell surface="programs">
      <div
        style={{
          minHeight: '100vh',
          background: SHELL.PAPER,
          padding: '32px clamp(20px, 4vw, 48px)',
          fontFamily: SHELL.SANS,
          color: SHELL.INK,
        }}
      >
        {/* ── Header ── */}
        <header style={{ maxWidth: 1200, margin: '0 auto 28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: SHELL.INK_MUTED,
                  marginBottom: 8,
                }}
              >
                Genome library
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontFamily: SHELL.SERIF,
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: SHELL.INK,
                }}
              >
                Pattern catalog
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
                Role-filtered library of AI and transformation patterns available for program origination.
              </p>
            </div>
            <Link
              href="/programs/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 40,
                padding: '0 18px',
                borderRadius: 8,
                background: SHELL.INK,
                color: SHELL.PAPER,
                fontFamily: SHELL.SANS,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Start from intake
            </Link>
          </div>
        </header>

        {/* ── Pattern grid ── */}
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {patterns.map((pattern) => {
            const promotionColor =
              pattern.promotionState === 'mature'
                ? { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT }
                : pattern.promotionState === 'proven'
                ? { bg: '#dde5f4', text: SHELL.INK_MID }
                : { bg: '#f4ead1', text: '#7a5a22' };

            return (
              <div
                key={pattern.key}
                style={{
                  background: '#fff',
                  border: `1px solid rgba(12,26,58,0.09)`,
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: SHELL.INK, lineHeight: 1.3 }}>
                      {pattern.name}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
                      {pattern.summary}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 6,
                      background: promotionColor.bg,
                      color: promotionColor.text,
                      fontSize: 11,
                      fontFamily: SHELL.MONO,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {pattern.promotionState}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                    paddingTop: 12,
                    borderTop: `1px solid rgba(12,26,58,0.07)`,
                  }}
                >
                  {[
                    { label: 'Duration', value: `${pattern.typicalDurationMonths}m` },
                    { label: 'Deployments', value: String(pattern.deploymentCount) },
                    { label: 'Preload depth', value: `${pattern.preloadDepthPct}%` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div
                        style={{
                          fontFamily: SHELL.MONO,
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: SHELL.INK_MUTED,
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: SHELL.INK }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
