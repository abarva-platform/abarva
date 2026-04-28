import { DecisionsIndexPage } from '@/components/tower/DecisionsIndexPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decisions log · AI Control Tower',
};

export default function Page() {
  return <DecisionsIndexPage />;
}
