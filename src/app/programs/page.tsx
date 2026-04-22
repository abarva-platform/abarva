'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PortfolioFilters } from '@/lib/programs/types.ui';
import { PortfolioIndexScreen } from '@/components/programs/PortfolioIndex';
import { ProgramsGrid } from '@/components/programs/ProgramsGrid';

// Fix Spec v4 §4 · /programs gets a DataGrid scan-many view alongside the
// existing PortfolioIndex inbox segmentation. Default lands on the grid
// because the scan-many use case is what the spec called out as the
// demo-critical moment — Prat opens /programs expecting "show me
// everything," and the inbox segmentation, while useful, isn't that.

type View = 'grid' | 'inbox';

const PAGE_BG = '#F6F1E8';
const PANEL_BG = '#FFFDFC';
const INK = '#171411';
const INK_SOFT = '#3A312A';
const INK_MUTED = '#5B4D43';
const LINE = 'rgba(23,20,17,0.12)';
const TEAL = '#0E9F8C';
const DARK = '#111315';
const DARK_PANEL = '#171A1D';
const CREAM = '#F7F2EA';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';

function ProgramsPageContent() {
  const searchParams = useSearchParams();
  const initialView: View = searchParams.get('view') === 'inbox' ? 'inbox' : 'grid';
  const [view, setView] = useState<View>(initialView);

  const initialFilters: Partial<PortfolioFilters> = {
    search: searchParams.get('search') ?? '',
    phase: (searchParams.get('phase') as PortfolioFilters['phase']) ?? 'all',
    archetype: (searchParams.get('archetype') as PortfolioFilters['archetype']) ?? 'all',
    status: (searchParams.get('status') as PortfolioFilters['status']) ?? 'all',
    sponsor: (searchParams.get('sponsor') as PortfolioFilters['sponsor']) ?? 'all',
    pattern: (searchParams.get('pattern') as PortfolioFilters['pattern']) ?? 'all',
    myRole: (searchParams.get('myRole') as PortfolioFilters['myRole']) ?? undefined,
    shape: (searchParams.get('shape') as PortfolioFilters['shape']) ?? 'all',
  };

  return (
    <div className="programs-layout-shell">
      <div
        className="programs-shell programs-page"
        style={{
          color: INK,
          background: PAGE_BG,
        }}
      >
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 30,
            border: `1px solid ${LINE}`,
            background:
              `radial-gradient(circle at top left, rgba(90,166,248,0.18), transparent 30%),
               radial-gradient(circle at top right, rgba(14,159,140,0.14), transparent 26%),
               linear-gradient(180deg, ${PANEL_BG} 0%, ${PAGE_BG} 100%)`,
            padding: '42px 30px 32px',
            boxShadow: '0 24px 80px rgba(23,20,17,0.07)',
          }}
        >
          <div
            className="programs-light-hero"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
              gap: 28,
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: TEAL,
                  marginBottom: 16,
                }}
              >
                Programs
              </div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: SERIF,
                  fontSize: 'clamp(42px, 5.2vw, 84px)',
                  lineHeight: 0.94,
                  letterSpacing: '-0.05em',
                  color: INK,
                  maxWidth: 820,
                }}
              >
                Program portfolio. Readable at speed, not buried in product chrome.
              </h1>
              <p
                style={{
                  margin: '20px 0 0',
                  maxWidth: 760,
                  fontSize: 'clamp(18px, 1.5vw, 26px)',
                  lineHeight: 1.42,
                  color: INK_SOFT,
                }}
              >
                The portfolio surface should feel executive and scannable. Light by default, denser only where
                scan-many work actually benefits from a darker control surface.
              </p>
            </div>

            <div
              style={{
                borderRadius: 24,
                padding: 22,
                background: 'rgba(255,255,255,0.7)',
                border: `1px solid ${LINE}`,
                backdropFilter: 'blur(6px)',
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                  marginBottom: 14,
                }}
              >
                What changes here
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  'Portfolio hero becomes editorial instead of utility-first',
                  'Grid stays dark as a deliberate scan-many mode, not a fallback',
                  'Inbox remains light and conversational for action review',
                  'Type scale and contrast improve on laptop-sized screens',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      fontSize: 15,
                      lineHeight: 1.55,
                      color: INK,
                    }}
                  >
                    <span style={{ color: TEAL, fontWeight: 800 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
              marginTop: 30,
              paddingTop: 18,
              borderTop: `1px solid ${LINE}`,
            }}
          >
            <nav role="tablist" aria-label="Programs view" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                role="tab"
                aria-selected={view === 'grid'}
                onClick={() => setView('grid')}
                style={{
                  background: view === 'grid' ? INK : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${view === 'grid' ? INK : LINE}`,
                  padding: '10px 16px',
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: view === 'grid' ? CREAM : INK_SOFT,
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >
                Grid
              </button>
              <button
                role="tab"
                aria-selected={view === 'inbox'}
                onClick={() => setView('inbox')}
                style={{
                  background: view === 'inbox' ? INK : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${view === 'inbox' ? INK : LINE}`,
                  padding: '10px 16px',
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: view === 'inbox' ? CREAM : INK_SOFT,
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >
                Inbox
              </button>
            </nav>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                color: INK_MUTED,
                fontSize: 13,
              }}
            >
              <span style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 14px', background: 'rgba(255,255,255,0.68)' }}>
                Default mode · executive scan
              </span>
              <span style={{ border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 14px', background: 'rgba(255,255,255,0.68)' }}>
                Readable on 13–15&quot; laptop screens
              </span>
            </div>
          </div>
        </section>

        <div style={{ padding: '28px 0 0' }}>
          {view === 'grid' ? (
            <section
              style={{
                borderRadius: 28,
                background: `linear-gradient(180deg, ${DARK_PANEL} 0%, ${DARK} 100%)`,
                color: CREAM,
                padding: '24px 22px 22px',
                boxShadow: '0 28px 80px rgba(23,20,17,0.16)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 18,
                  alignItems: 'end',
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: TEAL,
                      marginBottom: 10,
                    }}
                  >
                    Scan-many surface
                  </div>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontSize: 'clamp(28px, 2.2vw, 42px)',
                      lineHeight: 1.02,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    Portfolio grid stays dark on purpose.
                  </div>
                </div>
                <div style={{ maxWidth: 460, fontSize: 15, lineHeight: 1.6, color: 'rgba(247,242,234,0.78)' }}>
                  This is the one section where density and contrast help. The grid remains a control surface,
                  while the rest of the page moves into the warmer editorial system.
                </div>
              </div>
              <ProgramsGrid />
            </section>
          ) : (
            <section
              style={{
                borderRadius: 24,
                border: `1px solid ${LINE}`,
                background: PANEL_BG,
                boxShadow: '0 18px 48px rgba(23,20,17,0.06)',
                padding: '18px',
              }}
            >
              <PortfolioIndexScreen initialRole={searchParams.get('role')} initialFilters={initialFilters} />
            </section>
          )}
        </div>

        <style jsx>{`
          @media (max-width: 1100px) {
            .programs-light-hero {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading programs…</div>}>
      <ProgramsPageContent />
    </Suspense>
  );
}
