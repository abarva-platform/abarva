// INT-IDX — Shell-native Intelligence pattern library index.
// Server Component: renders the AppShell-native IntelligenceIndexPage.
// Suspense boundary required because IntelligenceIndexPage uses useSearchParams.

import { Suspense } from 'react';
import { IntelligenceIndexPage } from '@/components/intelligence/IntelligenceIndexPage';

export const metadata = {
  title: 'Intelligence · Pattern Library | Apex Retail Group',
};

export default function IntelligencePage() {
  return (
    <Suspense fallback={null}>
      <IntelligenceIndexPage />
    </Suspense>
  );
}
