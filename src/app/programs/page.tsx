'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PortfolioFilters } from '@/lib/programs/types';
import { PortfolioIndexScreen } from '@/components/programs/PortfolioIndex';

function ProgramsPageContent() {
  const searchParams = useSearchParams();

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

  return <PortfolioIndexScreen initialRole={searchParams.get('role')} initialFilters={initialFilters} />;
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading programs…</div>}>
      <ProgramsPageContent />
    </Suspense>
  );
}
