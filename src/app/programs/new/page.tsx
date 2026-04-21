'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OriginationFlow } from '@/components/programs/OriginationFlow';

function ProgramsNewPageContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');

  return (
    <OriginationFlow
      source={source === 'intelligence_thread' || source === 'tower_signal' ? source : undefined}
    />
  );
}

export default function ProgramsNewPage() {
  return (
    <Suspense fallback={<div className="programs-page programs-empty">Loading origination…</div>}>
      <ProgramsNewPageContent />
    </Suspense>
  );
}
