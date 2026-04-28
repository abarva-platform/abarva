import { Suspense } from 'react';
import { SourceIndexPage } from '@/components/source/SourceIndexPage';

export const metadata = { title: 'Source · AbarVa' };

export default function SourcePage() {
  return (
    <Suspense fallback={null}>
      <SourceIndexPage />
    </Suspense>
  );
}
