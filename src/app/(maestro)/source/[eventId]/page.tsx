import { Suspense } from 'react';
import { SourceEventDetailPage } from '@/components/source/SourceEventDetailPage';

export const metadata = { title: 'AMS Vendor Consolidation 2026 · Source' };

export default function SourceEventDetailRoute() {
  return (
    <Suspense fallback={null}>
      <SourceEventDetailPage />
    </Suspense>
  );
}
