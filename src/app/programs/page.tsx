'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PortfolioFilters } from '@/lib/programs/types';
import { PortfolioIndexScreen } from '@/components/programs/PortfolioIndex';
import { ProgramsGrid } from '@/components/programs/ProgramsGrid';

// Fix Spec v4 §4 · /programs gets a DataGrid scan-many view alongside the
// existing PortfolioIndex inbox segmentation. Default lands on the grid
// because the scan-many use case is what the spec called out as the
// demo-critical moment — Prat opens /programs expecting "show me
// everything," and the inbox segmentation, while useful, isn't that.

type View = 'grid' | 'inbox';

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
      <div className="programs-shell programs-page">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, padding: '0 24px 18px', borderBottom: '0.5px solid rgba(20,33,47,0.18)' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, margin: 0 }}>Programs</h1>
          <nav role="tablist" aria-label="Programs view" style={{ display: 'flex', gap: 18, marginLeft: 16 }}>
            <button
              role="tab"
              aria-selected={view === 'grid'}
              onClick={() => setView('grid')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 0',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: view === 'grid' ? 600 : 400,
                color: view === 'grid' ? '#0f766e' : 'rgba(27,38,50,0.6)',
                borderBottom: view === 'grid' ? '2px solid #0f766e' : '2px solid transparent',
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
                background: 'transparent',
                border: 'none',
                padding: '6px 0',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                fontWeight: view === 'inbox' ? 600 : 400,
                color: view === 'inbox' ? '#0f766e' : 'rgba(27,38,50,0.6)',
                borderBottom: view === 'inbox' ? '2px solid #0f766e' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Inbox
            </button>
          </nav>
        </div>

        <div style={{ padding: '24px' }}>
          {view === 'grid' ? (
            // Grid was designed against the dark product-shell palette.
            // Embed in a dark card so it reads cleanly inside the beige
            // programs-shell theme without recolouring the component.
            <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 18, color: '#f5f5f0' }}>
              <ProgramsGrid />
            </div>
          ) : (
            <PortfolioIndexScreen initialRole={searchParams.get('role')} initialFilters={initialFilters} />
          )}
        </div>
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
